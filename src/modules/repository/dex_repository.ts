import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'
import { ckb_methons } from '../ckb/ckb_service'
import { IndexerService } from '../indexer/indexer_service'
import { ForceBridgeRepository } from './force_bridge_repository'

export interface DexRepository extends IndexerService, ForceBridgeRepository {

  getTransactions: (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>) => Promise<CkbTransactionWithStatusModelWrapper[]>

  getTransactionByHash: (txHash: string) => Promise<CkbTransactionWithStatusModelWrapper>

  getblockNumberByBlockHash: (blockHash: string) => Promise<number>

  getBlockTimestampByHash: (blockHash: string) => Promise<string>

  getInputOutPointFromTheTxPool: () => Promise<Map<string, CkbTransactionWithStatusModelWrapper>>

  getTxsByBlockHash: (blockHash: string) => Promise<CkbTransactionWithStatusModelWrapper[]>

}
