import { Cell, QueryOptions, TransactionWithStatus, Transaction, Script } from "@ckb-lumos/base";
import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { indexer_config, contracts } from "../../config";
import { DexOrderData, CkbUtils } from '../../component';
import { IndexerService } from './indexer_service';
import knex from "knex";
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';
import { Reader } from "ckb-js-toolkit";
import { TransactionCollector } from "../../component/transaction_collector";
import CkbService from '../ckb/ckb_service';
import { modules } from '../../ioc';


@injectable()
export default class IndexerWrapper implements IndexerService {
  private indexer: Indexer;
  private knex: knex;

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private ckbService: CkbService,
  ) {
    const knex2 = knex({
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '123456',
        database: 'ckb'
      },
    });

    knex2.migrate.up();
    this.knex = knex2;

    this.indexer = new Indexer(indexer_config.nodeUrl, this.knex);
    setTimeout(() => {
      this.indexer.startForever();

      setInterval(async () => {
        const { block_number } = await this.indexer.tip();
        console.log("indexer tip block", parseInt(block_number, 16));
      }, 5000);
    }, 10000);
  }

  tip(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  async collectCells(queryOptions: QueryOptions): Promise<Array<Cell>> {  
    const cellCollector = new CellCollector(this.knex, queryOptions);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);

    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    const transactionCollector = new TransactionCollector(
      this.knex,
      queryOptions,
      this.indexer['rpc']
    );

    const txs = [];
    for await (const tx of transactionCollector.collect()) txs.push(tx);

    return txs;
  }

  async getLastMatchOrders(
    type: Script
  ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData>> | null> {
    const transactionCollector = new TransactionCollector(
      this.knex,
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
      this.indexer['rpc']
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const { tx_status, transaction } of transactionCollector.collect() as any) {

      if (tx_status.status === 'committed') {
        const bid_orders: Array<DexOrderData> = [];
        const ask_orders: Array<DexOrderData> = [];
        const { inputs, outputs, outputs_data } = transaction as Transaction;
        
        if(!outputs.find(x => CkbUtils.isOrder(type, x))) {
          continue;
        }
        
        const requests = [];
        for (const input of inputs) {
          requests.push(["getTransaction", input.previous_output.tx_hash]);
        }
        const inputTxs = await this.ckbService.getTransactions(requests);

        if(!inputTxs.find(x => x.ckbTransactionWithStatus.transaction.outputsData.find(y => y.length === CkbUtils.getRequiredDataLength()))) {
          continue;
        }

        for (const data of outputs_data) {
          if(data.length !== CkbUtils.getRequiredDataLength()) {
            continue;
          }
          const orderCell = CkbUtils.parseOrderData(data);
          (orderCell.isBid ? bid_orders : ask_orders).push(orderCell);
          
        }

        if (ask_orders.length && bid_orders.length) {
          return { ask_orders, bid_orders };
        }
      }
    }
    return null;
  }

}
