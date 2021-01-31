import { Cell, QueryOptions, Script, TransactionWithStatus } from '@ckb-lumos/base'
import sinon from 'sinon'
import { DexOrderData } from '../component'
import CkbTransactionWithStatusModelWrapper from '../model/ckb/ckb_transaction_with_status'
import { ckb_methons } from '../modules/ckb/ckb_service'
import { DexRepository } from '../modules/repository/dex_repository'

export class MockRepositoryFactory {
  static getDexRepositoryInstance (): MockRepository {
    return new MockRepository()
  }
}

export class MockRepository implements DexRepository {
  getTxsByBlockHash: (blockHash: string) => Promise<CkbTransactionWithStatusModelWrapper[]>
  async getForceBridgeHistory (ckbAddress: string, ethAddress: string, pureCross: boolean): Promise<[]> {
    return []
  }

  async getInputOutPointFromTheTxPool (): Promise<Map<string, CkbTransactionWithStatusModelWrapper>> {
    return new Map()
  }

  async tip (): Promise<number> {
    return null
  }

  async collectCells (queryOptions: QueryOptions): Promise<Cell[]> {
    return null
  }

  async collectTransactions (queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    return null
  }

  async getLastMatchOrders (type: Script): Promise<Record<'ask_orders' | 'bid_orders', DexOrderData[] | null>> {
    return null
  }

  async getTransactions (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>): Promise<CkbTransactionWithStatusModelWrapper[]> {
    return null
  }

  async getTransactionByHash (txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    return null
  }

  async getblockNumberByBlockHash (blockHash: string): Promise<number> {
    return 0
  }

  async getBlockTimestampByHash (blockHash: string): Promise<string> {
    return '111'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetForceBridgeHistory (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getForceBridgeHistory')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockTip (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'tip')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockCollectCells (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectCells')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockCollectTransactions (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectTransactions')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetLastMatchOrders (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getLastMatchOrders')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetTransactions (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getTransactions')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetTransactionByHash (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getTransactionByHash')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetblockNumberByBlockHash (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getblockNumberByBlockHash')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetBlockTimestampByHash (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getBlockTimestampByHash')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetInputOutPointFromTheTxPool (): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getInputOutPointFromTheTxPool')
  }
}
