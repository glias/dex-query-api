import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';
import { DexOrderData } from '../../component'

export interface IndexerService {
    collectCells(queryOptons: QueryOptions): Promise<Array<Cell>>;
    collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>>
    getLastMatchOrders(
        type: { code_hash: string, args: string, hash_type: 'data' | 'type' }
    ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData> | null>>
}