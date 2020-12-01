import CKB from "@nervosnetwork/ckb-sdk-core";
import { injectable } from "inversify";
import { indexer_config } from "../../config";
import CkbTransactionWithStatusModelWrapper from "../../model/ckb/ckb_transaction_with_status";

export type ckb_methons = "getTipBlockNumber" | "getTipHeader" | "getCurrentEpoch" | "getEpochByNumber" | "getBlockHash" | "getBlock" | "getHeader" | "getHeaderByNumber" | "getLiveCell" | "getTransaction" | "getCellbaseOutputCapacityDetails" | "getBlockEconomicState" | "getTransactionProof" | "verifyTransactionProof" | "getBlockByNumber" | "dryRunTransaction" | "calculateDaoMaximumWithdraw" | "indexLockHash" | "getLockHashIndexStates" | "getLiveCellsByLockHash" | "getTransactionsByLockHash" | "getCapacityByLockHash" | "deindexLockHash" | "localNodeInfo" | "getPeers" | "getBannedAddresses" | "clearBannedAddresses" | "setBan" | "syncState" | "setNetworkActive" | "addNode" | "removeNode" | "pingPeers" | "sendTransaction" | "txPoolInfo" | "clearTxPool" | "getBlockchainInfo" | "rpcProperties"

@injectable()
export default class CkbService {
  private ckbNode: CKB;

  constructor() {
    this.ckbNode = new CKB(indexer_config.nodeUrl);
  }

  async getTransactions(ckbReqParams: [method: ckb_methons, ...rest: []][]): Promise<Array<CkbTransactionWithStatusModelWrapper>> {
    const inputTxs = await this.ckbNode.rpc
      .createBatchRequest(ckbReqParams)
      .exec();

    return inputTxs.map(x => new CkbTransactionWithStatusModelWrapper(x));
  }

  async getTransactionByHash(txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    const inputTxs = await this.ckbNode.rpc
      .createBatchRequest([["getTransaction", txHash]])
      .exec();

    return new CkbTransactionWithStatusModelWrapper(inputTxs[0]);
  }

  async getblockNumberByBlockHash(blockHash: string): Promise<number> {
    const req = [];
    req.push(["getBlock", blockHash]);
    const block = await this.ckbNode.rpc.createBatchRequest(req).exec();
    const blockNumber = parseInt(block[0].header.number, 16);

    return blockNumber;
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    const req = []
    req.push(["getBlock", blockHash])
    
    const block = await this.ckbNode.rpc
      .createBatchRequest(req)
      .exec();

    return block[0].header.timestamp;
  }
}