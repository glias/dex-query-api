import { TransactionWithStatus } from '@ckb-lumos/base'
import CKB from '@nervosnetwork/ckb-sdk-core'
import { injectable } from 'inversify'
import rp from 'request-promise'
import { DexLogger } from '../../component'
import { indexer_config } from '../../config'
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'

export type ckb_methons = 'getTipBlockNumber' | 'getTipHeader' | 'getCurrentEpoch' | 'getEpochByNumber' | 'getBlockHash' | 'getBlock' | 'getHeader' | 'getHeaderByNumber' | 'getLiveCell' | 'getTransaction' | 'getCellbaseOutputCapacityDetails' | 'getBlockEconomicState' | 'getTransactionProof' | 'verifyTransactionProof' | 'getBlockByNumber' | 'dryRunTransaction' | 'calculateDaoMaximumWithdraw' | 'indexLockHash' | 'getLockHashIndexStates' | 'getLiveCellsByLockHash' | 'getTransactionsByLockHash' | 'getCapacityByLockHash' | 'deindexLockHash' | 'localNodeInfo' | 'getPeers' | 'getBannedAddresses' | 'clearBannedAddresses' | 'setBan' | 'syncState' | 'setNetworkActive' | 'addNode' | 'removeNode' | 'pingPeers' | 'sendTransaction' | 'txPoolInfo' | 'clearTxPool' | 'getBlockchainInfo' | 'rpcProperties'

@injectable()
export default class CkbService {
  private readonly ckbNode: CKB
  private readonly logger: DexLogger

  constructor () {
    this.ckbNode = new CKB(indexer_config.nodeUrl)
    this.logger = new DexLogger(CkbService.name)
  }

  async getTransactions (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>): Promise<CkbTransactionWithStatusModelWrapper[]> {
    const inputTxs = await this.ckbNode.rpc
      .createBatchRequest(ckbReqParams)
      .exec()

    return inputTxs.map(x => new CkbTransactionWithStatusModelWrapper(x))
  }

  async getTransactionByHash (txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    const inputTxs = await this.ckbNode.rpc
      .createBatchRequest([['getTransaction', txHash]])
      .exec()

    if (!inputTxs || inputTxs[0] === undefined) {
      return null
    }

    return new CkbTransactionWithStatusModelWrapper(inputTxs[0])
  }

  async getblockNumberByBlockHash (blockHash: string): Promise<number> {
    const req = []
    req.push(['getBlock', blockHash])
    const block = await this.ckbNode.rpc.createBatchRequest(req).exec()
    const blockNumber = parseInt(block[0].header.number, 16)

    return blockNumber
  }

  async getTxsByBlockHash (blockHash: string): Promise<CkbTransactionWithStatusModelWrapper[]> {
    const req = []
    req.push(['getBlock', blockHash])
    const block = await this.ckbNode.rpc.createBatchRequest(req).exec()
    const txs = block[0].transactions.map(x => new CkbTransactionWithStatusModelWrapper(x))

    return txs
  }

  async getBlockTimestampByHash (blockHash: string): Promise<string> {
    const req = []
    req.push(['getBlock', blockHash])

    const block = await this.ckbNode.rpc
      .createBatchRequest(req)
      .exec()

    return block[0].header.timestamp
  }

  async getInputOutPointFromTheTxPool (): Promise<Map<string, CkbTransactionWithStatusModelWrapper>> {
    const txs = await this.getPoolTxs()

    const inputOutPointWithTransaction: Map<string, CkbTransactionWithStatusModelWrapper> = new Map()
    for (const tx of txs) {
      const inputs = tx.ckbTransactionWithStatus.transaction.inputs
      for (const { previousOutput } of inputs) {
        const key = `${previousOutput.txHash}:${previousOutput.index}`
        inputOutPointWithTransaction.set(key, tx)
      }
    }

    return inputOutPointWithTransaction
  }

  private async getPoolTxs (): Promise<CkbTransactionWithStatusModelWrapper[]> {
    try {
      const QueryOptions = {
        url: indexer_config.nodeUrl,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json'
        },
        body: {
          id: 42,
          jsonrpc: '2.0',
          method: 'get_raw_tx_pool',
          params: [true]
        }
      }
      const result = await rp(QueryOptions)
      const hashes = []
      // const txs = []
      for (const hash of Object.keys(result.result.pending)) {
        // const tx = await this.getPoolTxByHash(hash)
        // txs.push(tx)
        hashes.push(['getTransaction', hash])
      }

      for (const hash of Object.keys(result.result.proposed)) {
        // txs.push(this.getPoolTxByHash(hash))
        hashes.push(['getTransaction', hash])
      }

      if (hashes.length === 0) {
        return []
      }
      return await this.getTransactions(hashes)
      // return txs
    } catch (error) {
      this.logger.error(error)
      throw new Error('query tx pool error!')
    }
  }

  private async getPoolTxByHash (hash: string): Promise<TransactionWithStatus> {
    const QueryOptions = {
      url: indexer_config.nodeUrl,
      method: 'POST',
      json: true,
      headers: {
        'content-type': 'application/json'
      },
      body: {
        id: 42,
        jsonrpc: '2.0',
        method: 'get_transaction',
        params: [hash]
      }
    }
    const tx = await rp(QueryOptions)
    return tx.result
  }
}
