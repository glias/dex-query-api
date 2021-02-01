import { QueryOptions } from '@ckb-lumos/base'
import { IndexerService } from '../indexer/indexer_service'
import { DexCache } from './dex_cache'

export class CacheFactory {
  private readonly queryOptions: Map<string, QueryOptions> = new Map()
  private readonly cache: DexCache
  private readonly indexer: IndexerService
  constructor (cache: DexCache, indexer: IndexerService) {
    this.cache = cache
    this.indexer = indexer
  }

  putKey (key: string, queryOption: QueryOptions): void {
    if (this.queryOptions.get(key)) {
      return
    }
    this.queryOptions.set(key, queryOption)
  }

  async get (key: string): Promise<string> {
    return await this.cache.get(key)
  }

  async scheduling (): Promise<void> {
    for (const [key, value] of this.queryOptions) {
      const txs = await this.indexer.collectTransactions(value)
      this.cache.setEx(key, JSON.stringify(txs))
    }
  }
}
