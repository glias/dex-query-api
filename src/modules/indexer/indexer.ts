import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base'
import TransactionManager from '@ckb-lumos/transaction-manager'
import {
  CellCollector,
  Indexer,
  TransactionCollector
} from '@ckb-lumos/indexer'
import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { indexer_config } from '../../config'
import { IndexerService } from './indexer_service'
import CkbService from '../ckb/ckb_service'
import { modules } from '../../ioc'

@injectable()
export default class IndexerWrapper implements IndexerService {
  private readonly indexer: Indexer
  private readonly txManager: TransactionManager

  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private readonly ckbService: CkbService
  ) {
    this.indexer = new Indexer(indexer_config.nodeUrl, indexer_config.dataPath)
    // this.txManager = new TransactionManager(this.indexer)
    this.indexer.startForever()

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      const { block_number } = await this.indexer.tip()
      console.log('indexer tip block', parseInt(block_number, 16))
    }, 5000)
  }

  async tip (): Promise<number> {
    const { block_number } = await this.indexer.tip()
    return parseInt(block_number, 16)
  }

  async collectCells (queryOptions: QueryOptions): Promise<Cell[]> {
    const cellCollector = new CellCollector(this.indexer, queryOptions)

    const cells = []
    for await (const cell of cellCollector.collect()) cells.push(cell)

    return cells
  }

  async collectTransactions (queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    const start = new Date().getTime()
    const transactionCollector = new TransactionCollector(
      this.indexer,
      queryOptions
    )

    const txs = []
    for await (const tx of transactionCollector.collect()) txs.push(tx)

    const end = new Date().getTime()
    console.info(`[query txs]-[queryOptions: ${JSON.stringify(queryOptions)}]-[size: ${txs.length}]-[time: ${end - start}]`)

    return txs
  }
}
