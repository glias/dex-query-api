import { DexRepository } from './dex_repository';
import { Cell, QueryOptions, TransactionWithStatus, Script } from "@ckb-lumos/base";
import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { modules } from '../../ioc';
import IndexerWrapper from '../indexer/indexer';
import { IndexerService } from '../indexer/indexer_service';
import CkbService from '../ckb/ckb_service';
import { DexOrderData } from '../../component';
import { ckb_methons } from '../ckb/ckb_service';
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status';

@injectable()
export default class CkbRepository implements DexRepository {

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService,
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private ckbService: CkbService
  ) {}

  async getPlaceOrder(queryOptions: QueryOptions): Promise<DexOrderData[]> {
    return this.indexer.getPlaceOrder(queryOptions)
  }
  async tip(): Promise<number> {
    const block_number = await this.indexer.tip();
    return block_number;
  }

  async collectCells(queryOptions: QueryOptions): Promise<Array<Cell>> {
    return await this.indexer.collectCells(queryOptions);
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    return await this.indexer.collectTransactions(queryOptions);
  }


  async getLastMatchOrders(type: Script): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData> | null>> {
    return await this.indexer.getLastMatchOrders(type);
  }

  async getTransactions(ckbReqParams: [method: ckb_methons, ...rest: []][]): Promise<Array<CkbTransactionWithStatusModelWrapper>> {
    return await this.ckbService.getTransactions(ckbReqParams);
  }

  async getTransactionByHash(txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    return await this.ckbService.getTransactionByHash(txHash);
  }

  async getblockNumberByBlockHash(blockHash: string): Promise<number> {
    return await this.ckbService.getblockNumberByBlockHash(blockHash);
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    return await this.ckbService.getBlockTimestampByHash(blockHash);
  }
}