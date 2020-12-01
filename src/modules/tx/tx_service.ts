import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { QueryOptions, Script } from "@ckb-lumos/base";

import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import CkbRequestModel from "../../model/req/ckb_request_model";
import { CkbUtils } from "../../component";

import CkbService from "../ckb/ckb_service";
import CkbCellScriptModel from "../../model/ckb/ckb_cell_script";
import TransactionDetailsModel from './transaction_details_model';

@injectable()
export default class TxService {

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerWrapper,
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private ckbService: CkbService
  ) {}

  async getSudtTransactions(reqParam: CkbRequestModel): Promise<Array<{
    hash: string
    income: string
  }>> {
    const queryOptions: QueryOptions = {};

    if (reqParam.isValidLockScript()) {
      queryOptions.lock = reqParam.lockScript();
    }

    if (reqParam.isValidTypeScript()) {
      queryOptions.type = reqParam.typeScript();
    }

    const txs = [];

    try {
      const txsWithStatus = await this.indexer.collectTransactions(
        queryOptions
      );
      
      const requests = [];
      for (const tx of txsWithStatus) {
        const { inputs } = tx.transaction;
        for (const input of inputs) {
          requests.push(["getTransaction", input.previous_output.tx_hash]);
        }
      }
      const inputTxs = await this.ckbService.getTransactions(requests);
      
      const inputTxsMap = new Map();
      for (const tx of inputTxs) {
        inputTxsMap.set(tx.ckbTransactionWithStatus.transaction.hash, tx);
      }

      for (let i = 0; i < txsWithStatus.length; i++) {
        const txWithStatus = txsWithStatus[i];
        const {
          inputs,
          outputs,
          outputs_data,
          hash,
        } = txWithStatus.transaction;

        let outputSum = BigInt(0);
        let inputSum = BigInt(0);

        for (const input of inputs) {
          const { index, tx_hash } = input.previous_output;
          const inputIndex = parseInt(index, 16);
          const tx = inputTxsMap.get(tx_hash);
          if (tx) {
            const cell = tx.ckbTransactionWithStatus.transaction.outputs[inputIndex];
            if (
              cell &&
              this.isSameTypeScript(cell.lock, <Script>queryOptions.lock) &&
              this.isSameTypeScript(cell.type, <Script>queryOptions.type)
            ) {
              const data = tx.ckbTransactionWithStatus.transaction.outputsData[inputIndex];
              const amount = CkbUtils.parseAmountFromLeHex(data);
              inputSum += amount;
            }
          }
        }

        for (let j = 0; j < outputs.length; j++) {
          const output = outputs[j];
          if (
            this.isSameTypeScript(output.type, <Script>queryOptions.type) &&
            this.isSameTypeScript(output.lock, <Script>queryOptions.lock)
          ) {
            const amount = CkbUtils.parseAmountFromLeHex(outputs_data[j]);        
            outputSum += amount;
          }
        }

        const income = outputSum - inputSum;        

        if (income.toString() !== "0") {
          const blockHash: string = txWithStatus.tx_status.block_hash;          
          const timestamp = await this.ckbService.getBlockTimestampByHash(blockHash);
        
          txs.push({
            hash,
            income: income.toString(),
            timestamp: parseInt(timestamp).toString()
          });
        }
      }

      return txs;
    } catch (err) {
      console.error(err);
    }
  }

  async getTransactionDetailsByHash(
    reqParam: CkbRequestModel,
    txHash: string
  ): Promise<TransactionDetailsModel> {

    try {

      const tx = await this.ckbService.getTransactionByHash(txHash);
      if (!tx) {
        throw { error: "The transaction does not exist!" };
      }

      const requests = [];
      const { inputs } = tx.ckbTransactionWithStatus.transaction;
      for (const input of inputs) {          
        requests.push(["getTransaction", input.previousOutput.txHash]);
      }

      const inputTransactions = await this.ckbService.getTransactions(requests);
    
      const fee = tx.getFee(inputTransactions);
      let amount: bigint;
      const lock: CkbCellScriptModel = {
        codeHash: reqParam.lock_code_hash,
        hashType: reqParam.lock_hash_type,
        args: reqParam.lock_args
      }

      const type: CkbCellScriptModel = {
        codeHash: reqParam.type_code_hash,
        hashType: reqParam.type_hash_type,
        args: reqParam.type_args
      }
      if(reqParam.isValidTypeScript()) {
        amount = tx.getSudtAmountByScript(inputTransactions, lock, type);
      } else {
        amount = tx.getCkbAmountByScript(inputTransactions, lock);
      }

      const blockNumber = await this.ckbService.getblockNumberByBlockHash(tx.ckbTransactionWithStatus.txStatus.blockHash);

      const from = tx.getFromAddress(lock);
      const to = tx.getToAddress(lock);

      const details: TransactionDetailsModel = {
        status: tx.ckbTransactionWithStatus.txStatus.status,
        transaction_fee: fee.toString(),
        amount: amount.toString(),
        to: to,
        from: from,
        hash: txHash,
        block_no: blockNumber
      }

      return details

    } catch (err) {
      console.error(err);
    }
  }

  isSameTypeScript(script1: Script, script2: Script): boolean {
    if (!script1 || !script2) {
      return false;
    }
    // const s1 = this.normalizeScript(script1);
    // const s2 = this.normalizeScript(script2);
    return (
      script1.code_hash === script2.code_hash &&
      script1.hash_type === script2.hash_type &&
      script1.args === script2.args
    );
  }

  // normalizeScript(script) {
  //   return {
  //     code_hash: script.code_hash || script.codeHash,
  //     hash_type: script.hash_type || script.hashType,
  //     args: script.args,
  //   };
  // }
}
