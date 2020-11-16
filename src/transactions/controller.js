const fetch = require('node-fetch');
const indexer = require('../indexer');
const CKB = require('@nervosnetwork/ckb-sdk-core').default;
const formatter = require('../commons/formatter');
const config = require('../config');

const isSameTypeScript = (script1, script2) => {
  if (!script1 || !script2) {
    return false;
  }
  const s1 = normalizeScript(script1);
  const s2 = normalizeScript(script2);
  return s1.code_hash === s2.code_hash && s1.hash_type === s2.hash_type && s1.args === s2.args;
};

const normalizeScript = (script) => {
  return {
    code_hash: script.code_hash || script.codeHash,
    hash_type: script.hash_type || script.hashType,
    args: script.args,
  }
}

const isValidScript = (codeHash, hashType, args) => (codeHash && hashType && args);

function getParams({ tx_hash }) {
  return {
    id: 42,
    jsonrpc: '2.0',
    method: 'get_transaction',
    params: [
      tx_hash,
    ],
  };
}
class Controller {
  ckb = new CKB(config.indexer.nodeUrl)

  async getSudtTransactions(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
    } = req.query;
    const queryOptions = {};

    if (!isValidScript(lock_code_hash, lock_hash_type, lock_args) && !isValidScript(type_code_hash, type_hash_type, type_args)) {
      return res.status(400).json({ error: 'requires either lock or type script specified as parameters' });
    }

    if (isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      queryOptions.lock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
    }

    if (isValidScript(type_code_hash, type_hash_type, type_args)) {
      queryOptions.type = {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      };
    }
    const txs = [];

    try {
      const txsWithStatus = await indexer.collectTransactions(queryOptions);
      const requests = [];
      for (const tx of txsWithStatus) {
        const {
          inputs
        } = tx.transaction;
        for (const input of inputs) {
          requests.push(['getTransaction', input.previous_output.tx_hash]);
        }
      }
      const inputTxs = await this.ckb.rpc.createBatchRequest(requests).exec()
      const inputTxsMap = new Map()
      for (const tx of inputTxs) {
        inputTxsMap.set(tx.transaction.hash, tx)
      }

      for (let i = 0; i < txsWithStatus.length; i++) {
        const txWithStatus = txsWithStatus[i];
        const {
          inputs, outputs, outputs_data, hash,
        } = txWithStatus.transaction;

        for (const input of inputs) {
          const { index, tx_hash } = input.previous_output
          const inputIndex = parseInt(index, 16)
          const tx = inputTxsMap.get(tx_hash);
          if (tx) {
            const cell = tx.transaction.outputs[inputIndex]
            if (cell && isSameTypeScript(cell.lock, queryOptions.lock) && isSameTypeScript(cell.type, queryOptions.type)) {
              const data = tx.transaction.outputsData[inputIndex];
              const amount = formatter.parseAmountFromLeHex(data);
              inputSum += amount;
            }
          }
        }

        for (let j = 0; j < outputs.length; j++) {
          const output = outputs[j];
          if (isSameTypeScript(output.type, queryOptions.type) && isSameTypeScript(output.lock, queryOptions.lock)) {
            const amount = formatter.parseAmountFromLeHex(outputs_data[j]);
            outputSum += amount;
          }
        }

        const income = outputSum - inputSum

        if (income.toString() !== '0') {
          console.log(inputSum, outputSum);
          txs.push({
            hash,
            income: income.toString(),
          });
        }
      }

      res.status(200).json(txs);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}

module.exports = new Controller();
