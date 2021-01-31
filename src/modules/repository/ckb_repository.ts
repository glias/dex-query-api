import { DexRepository } from './dex_repository'
import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base'
import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { modules } from '../../ioc'
import IndexerWrapper from '../indexer/indexer'
import { IndexerService } from '../indexer/indexer_service'
import CkbService, { ckb_methons } from '../ckb/ckb_service'
import * as pw from '@lay2/pw-core'
import rp from 'request-promise'
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'
import { contracts, forceBridgeServerUrl } from '../../config'

@injectable()
export default class CkbRepository implements DexRepository {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private readonly indexer: IndexerService,
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private readonly ckbService: CkbService
  ) {}

  async getTxsByBlockHash (blockHash: string): Promise<CkbTransactionWithStatusModelWrapper[]> {
    return await this.ckbService.getTxsByBlockHash(blockHash)
  }

  async getForceBridgeHistory (ckbAddress: string, ethAddress: string): Promise<[]> {
    const orderLock = new pw.Script(
      contracts.orderLock.codeHash,
      new pw.Address(ckbAddress, pw.AddressType.ckb).toLockScript().toHash(),
      <pw.HashType>contracts.orderLock.hashType
    )

    const QueryOptions = {
      url: `${forceBridgeServerUrl}/get_crosschain_history`,
      method: 'POST',
      body: {
        ckb_recipient_lockscript_addr: orderLock.toAddress().toCKBAddress(),
        eth_recipient_addr: ethAddress
      },
      json: true
    }
    const result = await rp(QueryOptions)
    return result
  }

  async getInputOutPointFromTheTxPool (): Promise<Map<string, CkbTransactionWithStatusModelWrapper>> {
    return await this.ckbService.getInputOutPointFromTheTxPool()
  }

  async tip (): Promise<number> {
    const block_number = await this.indexer.tip()
    return block_number
  }

  async collectCells (queryOptions: QueryOptions): Promise<Cell[]> {
    return await this.indexer.collectCells(queryOptions)
  }

  async collectTransactions (queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    return await this.indexer.collectTransactions(queryOptions)
  }

  async getTransactions (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>): Promise<CkbTransactionWithStatusModelWrapper[]> {
    return await this.ckbService.getTransactions(ckbReqParams)
  }

  async getTransactionByHash (txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    return await this.ckbService.getTransactionByHash(txHash)
  }

  async getblockNumberByBlockHash (blockHash: string): Promise<number> {
    return await this.ckbService.getblockNumberByBlockHash(blockHash)
  }

  async getBlockTimestampByHash (blockHash: string): Promise<string> {
    return await this.ckbService.getBlockTimestampByHash(blockHash)
  }
}
