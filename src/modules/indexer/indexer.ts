import { Cell, QueryOptions, TransactionWithStatus, Transaction, Script } from "@ckb-lumos/base";
import {
  Indexer,
  CellCollector,
  TransactionCollector,
} from "@ckb-lumos/indexer";
import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { indexer_config, contracts } from "../../config";
import { DexOrderData, CkbUtils } from '../../component';
import { IndexerService } from './indexer_service';
import CkbService from '../ckb/ckb_service';
import { modules } from '../../ioc';
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status';


@injectable()
export default class IndexerWrapper implements IndexerService {
  private indexer: Indexer;

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private ckbService: CkbService,
  ) {
    this.indexer = new Indexer(indexer_config.nodeUrl, indexer_config.dataPath);
    this.indexer.startForever();

    setInterval(async () => {
      const { block_number } = await this.indexer.tip();
      console.log("indexer tip block", parseInt(block_number, 16));
    }, 5000);
  }

  async tip(): Promise<number> {
    const { block_number } = await this.indexer.tip();
    return parseInt(block_number, 16);
  }

  async collectCells(queryOptions: QueryOptions): Promise<Array<Cell>> {  
    const cellCollector = new CellCollector(this.indexer, queryOptions);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);
    

    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      queryOptions
    );

    const txs = [];
    for await (const tx of transactionCollector.collect()) txs.push(tx);

    return txs;
  }

  async getLastMatchOrders(
    type: Script
  ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData>> | null> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      {
        type,
        lock: {
          script: {
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType,
            args: "0x",
          },
          argsLen: 'any'
        },
        order: "desc",
      },
    );

    for await (const { tx_status, transaction } of transactionCollector.collect() as any) {
      if (tx_status.status === 'committed') {
        const bid_orders: Array<DexOrderData> = [];
        const ask_orders: Array<DexOrderData> = [];
        const { outputs, outputs_data } = transaction as Transaction;
        await Promise.all(outputs.map(async (output, idx) => {
          if (CkbUtils.isOrder(type, output)) {
            try {
              const order = CkbUtils.parseOrderData(outputs_data[idx]);
              if (order.orderAmount === 0n) {
                // TODO: use order history to verify if the order is a REAL ONE
                // const historyService = container.get<OrdersHistoryService>(modules[OrdersHistoryService.name])
                // const history = await historyService.getOrderHistory(
                //   output.type.code_hash,
                //   output.type.hash_type,
                //   output.type.args,
                //   output.lock.args);
                (order.isBid ? bid_orders : ask_orders).push(order);
              }
            } catch {
              // ignore
            }
          }
        }))
        if (ask_orders.length && bid_orders.length) {
          return { ask_orders, bid_orders };
        }
      }
    }
    return null;
  }


  async getPlaceOrder(queryOptions: QueryOptions): Promise<DexOrderData[]> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      queryOptions
    );
    
    const result = [];
    for await (const { tx_status, transaction } of transactionCollector.collect() as any) {
      if(transaction.outputs_data.filter(x => x.length === 84).length !== 0) {

        const requests = [];
        for (const input of transaction.inputs) {
          requests.push(["getTransaction", input.previous_output.tx_hash]);
        }
        
        const inputTxs = await this.ckbService.getTransactions(requests);
  
        const inputTxsMap: Map<string, CkbTransactionWithStatusModelWrapper> = new Map();
        for (const tx of inputTxs) {
          inputTxsMap.set(tx.ckbTransactionWithStatus.transaction.hash, tx);
        }

        let requiredDataLenght = false;
        for (let i = 0; i < transaction.inputs.length; i++) {
          const { tx_hash, index } = transaction.inputs[i].previous_output;
          const inputTx = inputTxsMap.get(tx_hash);
          const data = inputTx.ckbTransactionWithStatus.transaction.outputsData[parseInt(index, 16)]
          if(data.length === 84) {
            requiredDataLenght = true
          }
  
          if(requiredDataLenght) {
            break;
          }
        }
  
        if(!requiredDataLenght) {
          const cells = transaction.outputs_data.filter(data => data.length === 84)
            .map(x => CkbUtils.parseOrderData(x))
   
          const blockNumber = await this.ckbService.getblockNumberByBlockHash(tx_status.block_hash);
          for (let i = 0; i < cells.length; i++) {
            
            cells[i].block_number = blockNumber;
            result.push(cells[i]);
          }
        }
      }

      if(result.length === 50) {
        return result;
      }
    }
  }

}
