import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status';
import { ckb_methons } from '../ckb/ckb_service';
import { IndexerService } from '../indexer/indexer_service';

export interface DexRepository extends IndexerService {

    getTransactions(ckbReqParams: [method: ckb_methons, ...rest: []][]): Promise<Array<CkbTransactionWithStatusModelWrapper>>

    getTransactionByHash(txHash: string): Promise<CkbTransactionWithStatusModelWrapper>

    getblockNumberByBlockHash(blockHash: string): Promise<number>

    getBlockTimestampByHash(blockHash: string): Promise<string>

}