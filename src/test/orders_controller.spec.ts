import "reflect-metadata"
import chai from 'chai';
import sinonChai from "sinon-chai";

chai.use(sinonChai);
chai.should();
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";

sinonStubPromise(sinon);

import { mockReq, mockRes } from "sinon-express-mock";
import { CkbUtils } from "../component/formatter";
import OrdersService from '../modules/orders/orders_service';
import OrdersHistoryService from '../modules/orders/orders_history_service';
import OrderController from '../modules/orders/orders_controller';

import { contracts } from "../config";
import { IndexerService } from '../modules/indexer/indexer_service';
import { QueryOptions, Cell, TransactionWithStatus } from '@ckb-lumos/base';


describe('Orders controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let orders;
  let mock_cell;
  let mock_transaction;
  let mock_last_match_orders;


  beforeEach(() => {
    orders = [
      {
        sUDTAmount: '5000000000',
        orderAmount: '15000000000',
        price: '50000000000',
        isBid: true,
        cell_output: {
          capacity: `0x${BigInt(200000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0x2d662063751dd2b1bcc87a486e0186d489b6f8d20f9987978bdf3911b3de526d',
          index: '0x0',
        },
        block_hash: '0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40',
        block_number: '0xf',
        data: CkbUtils.formatOrderData(5000000000n, 15000000000n, 50000000000n, true),
      },
      {
        sUDTAmount: '5000000000',
        orderAmount: '15000000000',
        price: '70000000000',
        isBid: true,
        cell_output: {
          capacity: `0x${BigInt(200000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xd2fdccb50e40d30d9193af27532271616c9e09a33ab25dce4ed653c9e4dd72f8',
          index: '0x0',
        },
        block_hash: '0x2b17c782478f908110b1f653a1d3d322c39ac620d5f951d160977b02c2bcc9ce',
        block_number: '0x13',
        data: CkbUtils.formatOrderData(5000000000n, 15000000000n, 70000000000n, true),
      },
      {
        sUDTAmount: '50000000000',
        orderAmount: '100000000000',
        price: '50000000000',
        isBid: false,
        cell_output: {
          capacity: `0x${BigInt(80000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xeea888c6bae03f54c58e09bb1aaa51453f82438d1363528c570a5780d5d5aa7a',
          index: '0x0',
        },
        block_hash: '0xcfeafc49705d16bcf0c85d71715f8e18fe2ab26f827cde5e4537d5a318b642cf',
        block_number: '0x17',
        data: CkbUtils.formatOrderData(50000000000n, 100000000000n, 50000000000n, false),
      },
      {
        sUDTAmount: '50000000000',
        orderAmount: '100000000000',
        price: '55000000000',
        isBid: false,
        cell_output: {
          capacity: `0x${BigInt(80000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xb634202edd6409e6282b0d1d0b1dbcd5b3a52918a82235e9539dbe31961b1932',
          index: '0x0',
        },
        block_hash: '0x301326140a7ccf7735dc88deec20da679eb19a344321d849376b01a07a0c6a19',
        block_number: '0x1b',
        data: CkbUtils.formatOrderData(50000000000n, 100000000000n, 55000000000n, false),
      },
    ];

    class MockIndex implements IndexerService {
      collectCells(queryOptions: QueryOptions): Promise<Cell[]> {
        console.log(queryOptions + " is mock");
        return null;
      }
      collectTransactions(queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
        console.log(queryOptions + " is mock");
        return null;
      }
      getLastMatchOrders(type) {
        console.log(type + " is mock");
        return null;
      }

    }

    const mock: MockIndex = new MockIndex();
    mock_cell = sinon.stub(mock, 'collectCells');  
    mock_transaction = sinon.stub(mock, 'collectTransactions');  
    mock_last_match_orders = sinon.stub(mock, 'getLastMatchOrders');
    
    const service = new OrdersService(mock);
    const historyService = new OrdersHistoryService(mock);
    controller = new OrderController(service, historyService);

    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });

  describe('#getBestPrice()', () => {
    describe('query best ask price', () => {
      beforeEach(async () => {
        mock_cell.resolves(orders);

        req.query.is_bid = false;
        await controller.getBestPrice(req, res, next);
      });

      it('returns highest bid price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '70000000000' });
      });
    });
    describe('query best bid price', () => {
      beforeEach(async () => {
        mock_cell.resolves(orders);

        req.query.is_bid = true;
        await controller.getBestPrice(req, res, next);
      });

      it('returns lowest ask price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '50000000000' });
      });
    });
    describe('with order live cells having zero order amount', () => {
      const fakeOrders = [
        {
          cell_output: {
            capacity: `0x${BigInt(17900000000n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(0), BigInt(20), true),
        },
        {
          cell_output: {
            capacity: `0x${BigInt(17900000001n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(1), BigInt(10), true),
        },
        {
          cell_output: {
            capacity: `0x${BigInt(17900000000n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(1), BigInt(15), false),
        },
      ];
      beforeEach(async () => {
        mock_cell.resolves(fakeOrders);

        req.query.is_bid = false;
        await controller.getBestPrice(req, res, next);
      });
      it('returns the price from the order cell having non-zero order amount', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '10' });
      });
    });
    describe('with insufficient sudt amount or capacity', () => {
      const orderLock = {
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'data',
        args: `0x${'0'.repeat(64)}`,
      };

      describe('when query for best price for bid order', () => {
        const insufficientCapacity = BigInt(1790000000n);
        const sufficientCapacity = BigInt(17900000000n);
        const validOrderData = CkbUtils.formatOrderData(BigInt(25075 * 10 ** 5), BigInt(5 * 10 ** 9), BigInt(2 * 10 ** 10), false);
        const invalidOrderData = CkbUtils.formatOrderData(BigInt(2 * 10 ** 10), BigInt(4 * 10 ** 9), BigInt(2 * 10 ** 9), false);
        const fakeOrders = [
          {
            cell_output: {
              capacity: `0x${insufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: validOrderData,
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: validOrderData,
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: invalidOrderData,
          },
        ];
        beforeEach(async () => {
          mock_cell.resolves(fakeOrders);

          req.query.is_bid = true;
          await controller.getBestPrice(req, res, next);
        });
        it('returns the price from the order cell having non-zero order amount', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({ price: '20000000000' });
        });
      });
      describe('when query for best price for ask order', () => {
        const orderAmount = BigInt(5 * 10 ** 9);
        const price = 2n;
        const sufficientCapacity = (BigInt(orderAmount * price) * BigInt(1003)) / BigInt(1000) + 17900000000n;
        const insufficientCapacity = sufficientCapacity - 2n;
        const fakeOrders = [
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(1 * 10 ** 10), true),
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(2 * 10 ** 10), true),
          },
          {
            cell_output: {
              capacity: `0x${insufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(2 * 10 ** 10), true),
          },
        ];
        beforeEach(async () => {
          mock_cell.resolves(fakeOrders);

          req.query.is_bid = false;
          await controller.getBestPrice(req, res, next);
        });
        it('returns the price from the order cell having non-zero order amount', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({ price: '20000000000' });
        });
      });
    });
  });

  describe('#getOrdersHistory()', () => {
    const typeScript = {
      args: 'type args',
      code_hash: 'type code hash',
      hash_type: 'type',
    };
    const orderLockScript = {
      args: null,
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
    };

    const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
    const U128_MIN = BigInt(0);

    const writeBigUInt128LE = (u128) => {
      if (u128 < U128_MIN) {
        throw new Error(`u128 ${u128} too small`);
      }
      if (u128 > U128_MAX) {
        throw new Error(`u128 ${u128} too large`);
      }
      const buf = Buffer.alloc(16);
      buf.writeBigUInt64LE(u128 & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
      buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
      return `0x${buf.toString('hex')}`;
    };

    const formatOrderData = (currentAmount, orderAmount, price, isBid) => {
      const udtAmountHex = writeBigUInt128LE(currentAmount);
      if (isBid === undefined) {
        return udtAmountHex;
      }

      const orderAmountHex = writeBigUInt128LE(orderAmount).replace('0x', '');

      const priceBuf = Buffer.alloc(8);
      priceBuf.writeBigUInt64LE(price);
      const priceHex = `${priceBuf.toString('hex')}`;

      const bidOrAskBuf = Buffer.alloc(1);
      bidOrAskBuf.writeInt8(isBid ? 0 : 1);
      const isBidHex = `${bidOrAskBuf.toString('hex')}`;

      const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
      return dataHex;
    };

    const price = 1n;
    const orderLockArgs = 'orderLockArgs';
    const orderCell1 = {
      capacity: '0x1',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: formatOrderData(1n, 1n, price, true)
    }
    const orderCell2 = {
      capacity: '0x0',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: formatOrderData(2n, 0n, price, true)
    }

    describe('completed order', () => {
      let transactions;

      describe('with single order history', () => {
        beforeEach(async () => {
          transactions = [
            {
              transaction: {
                hash: 'hash1',
                inputs: [
                  {
                    previous_output: {
                      index: '0x0',
                      tx_hash: 'hash0',
                    },
                  },
                ],
                outputs: [
                  {
                    capacity: orderCell1.capacity,
                    lock: orderCell1.lock,
                    type: orderCell1.type,
                  },
                ],
                outputs_data: [
                  orderCell1.data,
                ],
              },
              tx_status: {
                block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                status: 'committed'
              }
            },
            {
              transaction: {
                hash: 'hash2',
                inputs: [
                  {
                    previous_output: {
                      index: '0x0',
                      tx_hash: 'hash1',
                    },
                  },
                ],
                outputs: [
                  {
                    capacity: orderCell2.capacity,
                    lock: orderCell2.lock,
                    type: orderCell2.type,
                  },
                ],
                outputs_data: [
                  orderCell2.data,
                ],
              },
              tx_status: {
                block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                status: 'committed'
              }
            },
          ];

          req.query.type_code_hash = typeScript.code_hash;
          req.query.type_hash_type = typeScript.hash_type;
          req.query.type_args = typeScript.args;
          req.query.order_lock_args = orderLockArgs;
        });
        describe('when order cell is live', () => {
          beforeEach(async () => {
            mock_transaction.resolves(transactions);
            await controller.getOrderHistory(req, res, next);
          });
          it('returns order history', () => {
            res.status.should.have.been.calledWith(200);
            res.json.should.have.been.calledWith(
              [
                {
                  block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                  paid_amount: '1',
                  price: '1',
                  traded_amount: '1',
                  order_amount: '1',
                  turnover_rate: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash2',
                    index: '0x0',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash1" },
                    { index: "0", tx_hash: "hash2" },
                  ]
                },
              ],
            );
          });
        });
        describe('when order cell is not live', () => {
          describe('with order lock or type mismatched', () => {
            beforeEach(async () => {
              transactions.push({
                transaction: {
                  hash: 'hash3',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash2',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x2',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                  ],
                  outputs_data: ['0x'],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              });
              mock_transaction.resolves(transactions);
              await controller.getOrderHistory(req, res, next);
            });
            it('returns order history', () => {
              res.status.should.have.been.calledWith(200);
              res.json.should.have.been.calledWith(
                [
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '1',
                    traded_amount: '1',
                    order_amount: '1',
                    turnover_rate: '1',
                    price: '1',
                    status: 'claimed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash3',
                      index: '0x1',
                    },
                    order_cells: [
                      { index: "0", tx_hash: "hash1" },
                      { index: "0", tx_hash: "hash2" },
                    ]
                  },
                ],
              );
            });
          });
        });
      });
      describe('with multiple order history', () => {
        const orderCell1_1 = {
          capacity: '0x3',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: formatOrderData(1n, 1n, price, true)
        }
        const orderCell1_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: formatOrderData(2n, 0n, price, true)
        }
        const orderCell2_1 = {
          capacity: '0x4',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: formatOrderData(10n, 10n, price, true)
        }
        const orderCell2_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: formatOrderData(20n, 0n, price, true)
        }
        describe('with one input transaction to one output transaction', () => {
          beforeEach(async () => {
            transactions = [
              {
                transaction: {
                  hash: 'hash1',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell1_1.capacity,
                      lock: orderCell1_1.lock,
                      type: orderCell1_1.type,
                    },
                    {
                      capacity: orderCell2_1.capacity,
                      lock: orderCell2_1.lock,
                      type: orderCell2_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell1_1.data,
                    orderCell2_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash2',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash1',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x1',
                        tx_hash: 'hash1',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x0',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                    {
                      capacity: orderCell1_2.capacity,
                      lock: orderCell1_2.lock,
                      type: orderCell1_2.type,
                    },
                    {
                      capacity: orderCell2_2.capacity,
                      lock: orderCell2_2.lock,
                      type: orderCell2_2.type,
                    },
                  ],
                  outputs_data: [
                    '0x',
                    orderCell1_2.data,
                    orderCell2_2.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
            ];

            req.query.type_code_hash = typeScript.code_hash;
            req.query.type_hash_type = typeScript.hash_type;
            req.query.type_args = typeScript.args;
            req.query.order_lock_args = orderLockArgs;
          });
          describe('when order cell is live', () => {
            beforeEach(async () => {
              mock_transaction.resolves(transactions);
              await controller.getOrderHistory(req, res, next);
            });
            it('returns order history', () => {
              res.status.should.have.been.calledWith(200);
              res.json.should.have.been.calledWith(
                [
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '2',
                    traded_amount: '1',
                    order_amount: '1',
                    turnover_rate: '1',
                    price: '1',
                    status: 'completed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash2',
                      index: '0x1',
                    },
                    order_cells: [
                      { index: "0", tx_hash: "hash1" },
                      { index: "1", tx_hash: "hash2" },
                    ]
                  },
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '3',
                    traded_amount: '10',
                    order_amount: '10',
                    turnover_rate: '1',
                    price: '1',
                    status: 'completed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash2',
                      index: '0x2',
                    },
                    order_cells: [
                      { index: "1", tx_hash: "hash1" },
                      { index: "2", tx_hash: "hash2" },
                    ]
                  },
                ],
              );
            });
          });
        });
        describe('with two input transactions to one transaction', () => {
          beforeEach(async () => {
            transactions = [
              {
                transaction: {
                  hash: 'hash1',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell1_1.capacity,
                      lock: orderCell1_1.lock,
                      type: orderCell1_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell1_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash2',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x1',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell2_1.capacity,
                      lock: orderCell2_1.lock,
                      type: orderCell2_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell2_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash3',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash-1',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash2',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash1',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x0',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                    {
                      capacity: orderCell2_2.capacity,
                      lock: orderCell2_2.lock,
                      type: orderCell2_2.type,
                    },
                    {
                      capacity: orderCell1_2.capacity,
                      lock: orderCell1_2.lock,
                      type: orderCell1_2.type,
                    },
                  ],
                  outputs_data: [
                    '0x',
                    orderCell2_2.data,
                    orderCell1_2.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
            ];

            req.query.type_code_hash = typeScript.code_hash;
            req.query.type_hash_type = typeScript.hash_type;
            req.query.type_args = typeScript.args;
            req.query.order_lock_args = orderLockArgs;

            mock_transaction.resolves(transactions);
            await controller.getOrderHistory(req, res, next);
          });
          it('returns order history', () => {
            res.status.should.have.been.calledWith(200);
            res.json.should.have.been.calledWith(
              [
                {
                  block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                  paid_amount: '2',
                  traded_amount: '1',
                  order_amount: '1',
                  turnover_rate: '1',
                  price: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash3',
                    index: '0x2',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash1" },
                    { index: "2", tx_hash: "hash3" },
                  ]
                },
                {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  paid_amount: '3',
                  traded_amount: '10',
                  order_amount: '10',
                  turnover_rate: '1',
                  price: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash3',
                    index: '0x1',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash2" },
                    { index: "1", tx_hash: "hash3" },
                  ]
                },
              ],
            );
          });
        });
      });
    });
    describe('aborted order', () => {
      beforeEach(async () => {
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0',
                  },
                },
              ],
              outputs: [
                {
                  capacity: orderCell1.capacity,
                  lock: orderCell1.lock,
                  type: orderCell1.type,
                },
              ],
              outputs_data: [
                orderCell1.data,
              ],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
          {
            transaction: {
              hash: 'hash2',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash1',
                  },
                },
              ],
              outputs: [
                {
                  capacity: '0x2',
                  lock: {
                    ...orderLockScript,
                    args: orderLockArgs,
                  },
                },
              ],
              outputs_data: ['0x'],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
        ];

        req.query.type_code_hash = typeScript.code_hash;
        req.query.type_hash_type = typeScript.hash_type;
        req.query.type_args = typeScript.args;
        req.query.order_lock_args = orderLockArgs;
        mock_transaction.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith([
          {
            block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
            paid_amount: '0',
            traded_amount: '0',
            order_amount: '1',
            turnover_rate: '0',
            price: '1',
            status: 'aborted',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash2',
              index: '0x1',
            },
            order_cells: [
              {index: "0", tx_hash: "hash1"},
            ]
          },
        ]);
      });
    });
    describe('incompleted order', () => {
      beforeEach(async () => {
        const orderLockArgs = 'orderLockArgs';
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0',
                  },
                },
              ],
              outputs: [
                {
                  capacity: orderCell1.capacity,
                  lock: orderCell1.lock,
                  type: orderCell1.type,
                },
              ],
              outputs_data: [
                orderCell1.data,
              ],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
        ];

        req.query.type_code_hash = typeScript.code_hash;
        req.query.type_hash_type = typeScript.hash_type;
        req.query.type_args = typeScript.args;
        req.query.order_lock_args = orderLockArgs;
        mock_transaction.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith([
          {
            block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
            paid_amount: '0',
            traded_amount: '0',
            order_amount: '1',
            turnover_rate: '0',
            price: '1',
            status: 'opening',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash1',
              index: '0x0',
            },
            order_cells: [
              { index: "0", tx_hash: "hash1" }
            ]
          },
        ]);
      });
    });
  });

  describe('#getOrders()', () => {
    beforeEach(() => {
      const TYPE_SCRIPT = {
        code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
        hash_type: 'data',
        args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947'
      }
      req.query.type_code_hash = TYPE_SCRIPT.code_hash
      req.query.type_hash_type = TYPE_SCRIPT.hash_type
      req.query.type_args = TYPE_SCRIPT.args;
      mock_cell.resolves(orders)
    })

    it('should return bid orders and ask orders', async () => {
      await controller.getOrders(req, res, next);
      res.status.should.have.been.calledWith(200);
      res.json.should.have.been.calledWith({
        ask_orders: [
          {
            order_amount: "100000000000",
            price: "50000000000",
            sudt_amount: "50000000000",
          },
          { 
            order_amount: "100000000000",
            price: "55000000000",
            sudt_amount: "50000000000",
          },
        ],
        bid_orders: [
          {
            order_amount: "15000000000",
            price: "50000000000",
            sudt_amount: "5000000000",
          },
          { 
            order_amount: "15000000000",
            price: "70000000000",
            sudt_amount: "5000000000"
          },
        ]
      });
    })
  })

  describe('#getCurrentPrice', () => {
    beforeEach(() => {
      const TYPE_SCRIPT = {
        code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
        hash_type: 'data',
        args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947'
      };
      req.query.type_code_hash = TYPE_SCRIPT.code_hash;
      req.query.type_hash_type = TYPE_SCRIPT.hash_type;
      req.query.type_args = TYPE_SCRIPT.args;
    })

    describe('when orders are found', () => {
      beforeEach(() => {
        mock_last_match_orders.resolves({
          ask_orders: [
            { sUDTAmount: 9775000006n, orderAmount: 0n, price: 20000000000n, isBid: false },
            { sUDTAmount: 9775000006n, orderAmount: 0n, price: 10000000000n, isBid: false }
          ],
          bid_orders: [
            { sUDTAmount: 4087736789n, orderAmount: 0n, price: 30000000000n, isBid: true },
            { sUDTAmount: 6580259222n, orderAmount: 0n, price: 10000000000n, isBid: true }
          ]
        });
      })

      it('should return bid orders and ask orders', async () => {
        await controller.getCurrentPrice(req, res, next);
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith("15000000000");
      })
    })

    describe('when orders are not found', () => {
      beforeEach(() => {
        mock_last_match_orders.resolves(null);
      })

      it('should return bid orders and ask orders', async () => {
        await controller.getCurrentPrice(req, res, next);
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith("");
      })
    })

  })
});
