import { CkbUtils } from '../../component'
import { contracts } from '../../config'

export const dexOrderTransactions = [
  {
    transaction: {
      cell_deps: [],
      hash: '0x939004d1067721bfa07f8004a1ab9abfd71e371c3fcfe94d5a7c548e4c9c7432',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x2',
            tx_hash: '0xde7d8741469856ff1897a7788b3a3da230fb1e6614890f265b51738a8c547ac8'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x2',
            tx_hash: '0x13f6f76165880c0fe99d7316f772dbc877d29bd4df1d30fa77432cd6384f12d2'
          },
          since: '0x0'
        }
      ],
      outputs: [{
        capacity: `0x${18700000000n.toString(16)}`,
        lock: {
          args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
          code_hash: contracts.orderLock.codeHash,
          hash_type: contracts.orderLock.hashType
        },
        type: {
          args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
          code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
          hash_type: 'type'
        }
      },
      {
        capacity: `0x${28300000000n.toString(16)}`,
        lock: {
          args: '0xb901c2f103bdfe286d2b21f1428daa9790df2f680000000000000000000000000000000000000000',
          code_hash: '0x7b802a58978016376e9b92d332c26b1ecdda11855b8250c9570bb2e2dd81f1c2',
          hash_type: 'data'
        },
        type: {
          args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb0630e91a705faa80c7fb5d7a5346b2ac774c5232dc198e68fa4a3916821f32b7',
          code_hash: '0xfe14b0c716bfcbf55067296e424031cb28a35855e8849d2921f23f7916d03b40',
          hash_type: 'data'
        }
      },
      {
        capacity: `0x${992766313700118n.toString(16)}`,
        lock: {
          args: '0x470dcdc5e44064909650113a274b3b36aecb6dc7',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: null
      }],
      outputs_data: [
        CkbUtils.formatOrderData(300900000000000000n, 1, 300000000000n, 10000000000n, 0, false),
        CkbUtils.formatOrderData(57836558651830568n, 1, 38821799640843962n, 3882179964084n, 0, false),
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0x1a0938788acc4a3e99b0b7d3a9c6619cc33385af8bfef7a0ffaeb742c1eb0519',
      status: 'committed'
    }
  },
  {
    transaction: {
      cell_deps: [],
      hash: '0x00097d5ebbdc6889ddb6b70bfc61f8f362b455067e1c970a44aab46e2fbdad28',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0xd0147a9d81a7cc6eead2625dc943a0afa0c89a92fbce84438f399ba2d4b3f6ee'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x83e14469abb619a67c3761744cd89ba5f92dad7fe21ab99561f25813b642be00'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0xe6c4fd5f2b3eee2c26523554f898ef7e28f5d4351953c5540e30029e003c3486'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x939004d1067721bfa07f8004a1ab9abfd71e371c3fcfe94d5a7c548e4c9c7432'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: `0x${500317498155n.toString(16)}`,
          lock: {
            args: '0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6',
            code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hash_type: 'type'
          },
          type: null
        },
        {
          capacity: `0x${61909999999n.toString(16)}`,
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: `0x${35886352825n.toString(16)}`,
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: `0x${81755052021n.toString(16)}`,
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        }
      ],
      outputs_data: [
        CkbUtils.formatOrderData(370199999998479n, 1, 0n, 0n, 0, false),
        CkbUtils.formatOrderData(39774017177571400n, 1, 1n, 4321000000n, 0, false),
        CkbUtils.formatOrderData(123399999999493121n, 1, 506879n, 10000000000n, 0, true),
        CkbUtils.formatOrderData(237655782822937000n, 1, 236944947979n, 10000000000n, 0, false)
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0xa559baa681d7b77c774c69d8d975ff0ab262d1ab06739f5ce844890dfab4916d',
      status: 'committed'
    }
  },
  {
    transaction: {
      cell_deps: [],
      hash: '0x4fa6c4cc93775249a7b95e26fd5bdb7133e1346597fd8bb6e5d8556deffb4d5f',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x3166acf4727c6aec614dcc7b9ea7d3e1833e14819e40c22377e7453fb5d8b197'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x2',
            tx_hash: '0xa4dbd6bcad285b295deb6c42f576bf5ab77b013a27e3e146e2a7a49e8361056d'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: `0x${18700000000n.toString(16)}`,
          lock: {
            args: '0x87a9ac1f2ccdfdc0fd5fc87d8239968176f9f3917a9b25935a28459992727b9c',
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: `0x${28300000000n.toString(16)}`,
          lock: {
            args: '0xb901c2f103bdfe286d2b21f1428daa9790df2f680000000000000000000000000000000000000000',
            code_hash: '0x7b802a58978016376e9b92d332c26b1ecdda11855b8250c9570bb2e2dd81f1c2',
            hash_type: 'data'
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb5b0ff244c22225996f81e5a716c9f02841881bbe491f0e1857aa1feff4f9a185',
            code_hash: '0xfe14b0c716bfcbf55067296e424031cb28a35855e8849d2921f23f7916d03b40',
            hash_type: 'data'
          }
        },
        {
          capacity: `0x${991130832760218n.toString(16)}`,
          lock: {
            args: '0x470dcdc5e44064909650113a274b3b36aecb6dc7',
            code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hash_type: 'type'
          },
          type: null
        }
      ],
      outputs_data: [
        CkbUtils.formatOrderData(300900000000000n, 1, 296280000n, 9876000000n, 0, false),
        CkbUtils.formatOrderData(57836558651830568n, 1, 38821799640843962n, 3882179964084n, 0, false),
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0x51f570599d0f40d41a0d984ecf8e757d4d9bff60eac837fedc638afbac044929',
      status: 'committed'
    }
  },
  {
    transaction: {
      cell_deps: [],
      hash: '0xa146bdb234b069c06b341c3e2f7e6ef79837e9d090723a78347dec59a6c6f7f9',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0xc01a04ec54061c60ba4892fbf7ae87e1cc91d782244657fef0427b74cf9caeba'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: `0x${11900000000000n.toString(16)}`,
          lock: {
            args: '0xa02332efd9363b1dbc87458c4064602aee5c61a3167d281fba50abc64466f614',
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType
          },
          type: {
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: '0x58b4c608d4',
          lock: {
            args: '0x4a000a843d5db6838b27b475f2fd04bffd023ca5',
            code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hash_type: 'type'
          },
          type: null
        }
      ],
      outputs_data: [
        CkbUtils.formatOrderData(0n, 1, 2500000n, 400000n, 0, true),
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0x7e087a3930551da3d16d5c9d243eaedafe850a390d9c3378aa77bcd369864003',
      status: 'committed'
    }
  }
]

export const makerOrders = [
  {
    transaction: {
      cell_deps: [],
      hash: '0x4fb89c233607b501c9a67e9bcdc5113b271c6099cc9b74f28968ec6534990e67',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x35e3db08cb266b79c9a187f181471c2738d2e2e24d626fcdb545c813a9bfef86'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0xd937339578efabadb59f2664fa610980b101aa174caf06bea69797ef6254eada'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: '0x1b7f4efd00',
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: '0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48',
            hash_type: 'type'
          },
          type: {
            args: '0xb9bd13d1714ce30c30aff25565e062fb2e94fac8c3e907494ad3108a1e92a4eb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: '0x2f52dd9b6f',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hash_type: 'type'
          },
          type: null
        }
      ],
      outputs_data: [
        CkbUtils.formatOrderData(1n, 1, 1n, 1n, 0, true),
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0xecd97b774877d9f32bd0b00afebb53a3a7f4b61c1f4a1989724b775f10c22c33',
      status: 'committed'
    }
  },
  {
    transaction: {
      cell_deps: [],
      hash: '0x9d0a6da0b2ba86255f70475d9bc69dd0b767848ca3f00c63aab101c6c3d0705f',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x853fcaff933c7f457791ba0a73c1894153fbe6269f27078b4039eead5e49c543'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x2',
            tx_hash: '0x952c581974cf8f65a2d21ec724a8fe6c97acd75ac913dff992cf68d79c0f4a7d'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: '0x436d81500',
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: '0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48',
            hash_type: 'type'
          },
          type: {
            args: '0xb9bd13d1714ce30c30aff25565e062fb2e94fac8c3e907494ad3108a1e92a4eb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: '0x7558bdb00',
          lock: {
            args: '0xf264a2adf7d5c683855828b5be39c25cee0a13df0000000000000000000000000000000000000000bb867b58869bdcd636c2c1d0256dd087630ac88619dda33537f887889ddaa233',
            code_hash: '0xfd9515dc15ce2385aab85af21a6c89d7c003eac115dcbd195a8f29ad916ab316',
            hash_type: 'type'
          },
          type: {
            args: '0xb9bd13d1714ce30c30aff25565e062fb2e94fac8c3e907494ad3108a1e92a4eb603cd5fa42b5f37dc480949b830e295ec0ca37065c29fc18fb08fee18b6f9779',
            code_hash: '0xa878bee27cf7fae49a028cf3e506af946dd2ea86f19586d68db3029ab3f20dd3',
            hash_type: 'type'
          }
        },
        {
          capacity: '0x47f353f9e24',
          lock: {
            args: '0x106c4e4f8f259609dbad0af421388402cdd2e208',
            code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hash_type: 'type'
          },
          type: null
        }
      ],
      outputs_data: [
        CkbUtils.formatOrderData(1n, 1, 1n, 1n, 0, false),
        '0x690000000c0000005900000049000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000a0ba43e86090bce8cf2c50c59d4071b74a0ebb9700000000000000000000000000000000',
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0x0d3d5b2ef6e18ec55e2fdca8635b119b16f4bd53ffc92c7584523e38ccaf2fe4',
      status: 'committed'
    }
  },
  {
    transaction: {
      cell_deps: [],
      hash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c46',
      header_deps: [],
      inputs: [
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0xd299bc36ed9d4b07d973f2ae01a70a396372450942650ab01ce8cd2d0db95d93'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x9d0a6da0b2ba86255f70475d9bc69dd0b767848ca3f00c63aab101c6c3d0705f'
          },
          since: '0x0'
        },
        {
          previous_output: {
            index: '0x0',
            tx_hash: '0x4fb89c233607b501c9a67e9bcdc5113b271c6099cc9b74f28968ec6534990e67'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: '0xb5e88b7798b6',
          lock: {
            args: '0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6',
            code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hash_type: 'type'
          },
          type: null
        },
        {
          capacity: '0x9f2115d90',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hash_type: 'type'
          },
          type: null
        },
        {
          capacity: '0x15bfab7c80',
          lock: {
            args: '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
            code_hash: '0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48',
            hash_type: 'type'
          },
          type: {
            args: '0xb9bd13d1714ce30c30aff25565e062fb2e94fac8c3e907494ad3108a1e92a4eb',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        }
      ],
      outputs_data: [
        '0x5843aff4a55a90060000000000000000',
        '0x',
        '0x0040d20853d74600000000000000000001c164f175c714d80000000000000000003930000000000000f600'
      ],
      version: '0x0',
      witnesses: []
    },
    tx_status: {
      block_hash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4c',
      status: 'committed'
    }
  }
]
