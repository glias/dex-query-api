import { CkbUtils } from '../../component'
import { CkbTransactionWithStatusModel } from '../../model/ckb/ckb_transaction_with_status'

export const ckbTx: CkbTransactionWithStatusModel = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          "args": "0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd",
          "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
          "hashType": "type"
        },
        type: null,
        capacity: `0x${200n.toString(16)}`
      },
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${299n.toString(16)}`
      }
    ],
    outputsData: [ '0x', '0x' ],
    headerDeps: [],
    hash: '0x34c5ba66e5be46e4b78d3dafe6a9f124912af64bad2f3a3ff53e1c684b7694c7',
    version: "0x0",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block1',
    status: 'committed'
  }
  
}

export const preCkbTx: CkbTransactionWithStatusModel = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${500n.toString(16)}`
      }
    ],
    outputsData: [ '0x', '0x' ],
    headerDeps: [],
    hash: 'hash0',
    version: "0x0",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block0',
    status: 'committed'
  }
}


export const sudtTx = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      },
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x1'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          "args": "0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd",
          "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a62",
          "hashType": "type"
        },
        type: {
          "args": "0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902",
          "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          "hashType": "type"
        },
        capacity: `0x0`
      },
      {
        lock: {
          "args": "0x988485609e16d5d5c62be0a4ae12b665fefcb448",
          "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
          "hashType": "type"
        },
        type: {
          "args": "0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902",
          "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          "hashType": "type"
        },
        capacity: `0x${BigInt(18700000000n).toString(16)}`
      },
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${BigInt(1999999995000n).toString(16)}`
      }
    ],
    outputsData: [ 
      CkbUtils.formatOrderData(4000000000n, 1, BigInt(1), BigInt(1), 0, false), 
      CkbUtils.formatOrderData(6000000000n, 1, BigInt(1), BigInt(1), 0, false),
      '0x' 
    ],
    headerDeps: [],
    hash: '0x34c5ba66e5be46e4b78d3dafe6a9f124912af64bad2f3a3ff53e1c684b7694c7',
    version: "",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block1',
    status: 'committed'
  }
}


export const preSudtTx: CkbTransactionWithStatusModel = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${BigInt(2000000000000n).toString(16)}`
      },
      {
        lock: {
          "args": "0x988485609e16d5d5c62be0a4ae12b665fefcb448",
          "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
          "hashType": "type"
        },
        type: {
          "args": "0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902",
          "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          "hashType": "type"
        },
        capacity: `0x${BigInt(18700000000n).toString(16)}`
      }
    ],
    outputsData: [ '0x', 
      CkbUtils.formatOrderData(10000000000n, 1, BigInt(1), BigInt(1), 0, false)],
    headerDeps: [],
    hash: 'hash0',
    version: "0x0",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block0',
    status: 'committed'
  }
}

export const sudtTxList = 
  {
    transaction: {
      cell_deps: [],
      hash: 'hash1',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: 'hash0'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x1',
            tx_hash: 'hash0'
          },
          since: '0x0'
        }
      ],
      outputs: [ 
        {
          lock: {
            "args": "0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd",
            "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a62",
            "hashType": "type"
          },
          type: {
            "args": "0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902",
            "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
            "hashType": "type"
          },
          capacity: `0x0`
        },
        {
          lock: {
            "args": "0x988485609e16d5d5c62be0a4ae12b665fefcb448",
            "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
            "hashType": "type"
          },
          type: {
            "args": "0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902",
            "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
            "hashType": "type"
          },
          capacity: `0x${BigInt(18700000000n).toString(16)}`
        },
        {
          lock: {
            codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hashType: 'type',
            args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
          },
          type: null,
          capacity: `0x${BigInt(1999999995000n).toString(16)}`
        }
      ],
      outputs_data: [ 
        CkbUtils.formatOrderData(4000000000n, 1, BigInt(1), BigInt(1), 0, false), 
        CkbUtils.formatOrderData(6000000000n, 1, BigInt(1), BigInt(1), 0, false),
        '0x' 
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: 'block1',
      status: 'committed'
    }
  }
