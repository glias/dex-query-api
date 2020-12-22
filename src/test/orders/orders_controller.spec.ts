import "reflect-metadata"
import chai from 'chai';
import sinonChai from "sinon-chai";

chai.use(sinonChai);
chai.should();
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";

sinonStubPromise(sinon);

import { mockReq, mockRes } from "sinon-express-mock";
import { CkbUtils } from "../../component/formatter";
import OrdersService from '../../modules/orders/orders_service';
import OrdersHistoryService from '../../modules/orders/orders_history_service';
import OrderController from '../../modules/orders/orders_controller';

import { contracts } from "../../config";
import { MockRepository, MockRepositoryFactory } from '../mock_repository_factory';
import { dexOrderTransactions } from './mock_data';


describe('Orders controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = MockRepositoryFactory.getInstance();

    const service = new OrdersService(mock_repository);
    const historyService = new OrdersHistoryService(mock_repository);
    controller = new OrderController(service, historyService);

    req = mockReq();
    res = mockRes();
    next = sinon.spy();
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


    const price = 1n;
    const orderLockArgs = 'orderLockArgs';
    const orderCell1 = {
      capacity: '0x1',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: CkbUtils.formatOrderData(1n, 1, 1n, price, 0, true)
    }
    const orderCell2 = {
      capacity: '0x0',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: CkbUtils.formatOrderData(2n, 1, 0n, price, 0, true)
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
            mock_repository.mockCollectTransactions().resolves(transactions);
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
                  order_cells: [{ index: "0x0", tx_hash: "hash1" }, { index: "0x0", tx_hash: "hash2" }]
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
              mock_repository.mockCollectTransactions().resolves(transactions);
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
                    order_cells: [{ index: "0x0", tx_hash: "hash1" }, { index: "0x0", tx_hash: "hash2" }]
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
          data: CkbUtils.formatOrderData(1n, 1, 1n, price, 0, true)
        }
        const orderCell1_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(2n, 1, 0n, price, 0, true)
        }
        const orderCell2_1 = {
          capacity: '0x4',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(10n, 1, 10n, price, 0, true)
        }
        const orderCell2_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(20n, 1, 0n, price, 0, true)
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
              mock_repository.mockCollectTransactions().resolves(transactions);
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
                    order_cells: [{ index: "0x0", tx_hash: "hash1" }, { index: "0x1", tx_hash: "hash2" }]
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
                    order_cells: [{ index: "0x1", tx_hash: "hash1" }, { index: "0x2", tx_hash: "hash2" }]
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

            mock_repository.mockCollectTransactions().resolves(transactions);
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
                  order_cells: [{ index: "0x0", tx_hash: "hash1" }, { index: "0x2", tx_hash: "hash3" }]
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
                  order_cells: [{ index: "0x0", tx_hash: "hash2" }, { index: "0x1", tx_hash: "hash3" }]
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
        mock_repository.mockCollectTransactions().resolves(transactions);

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
            turnover_rate: '0.00',
            price: '1',
            status: 'aborted',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash2',
              index: '0x1',
            },
            order_cells: [{ index: "0x0", tx_hash: "hash1" }]
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
        mock_repository.mockCollectTransactions().resolves(transactions);

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
            turnover_rate: '0.00',
            price: '1',
            status: 'opening',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash1',
              index: '0x0',
            },
            order_cells: [{ index: "0x0", tx_hash: "hash1" }]
          },
        ]);
      });
    });
  });

  describe('#getOrders()', () => {
    describe('valid requests', () => {
      describe('get orders', () => {
        beforeEach(() => {
          const TYPE_SCRIPT = {
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type',
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb'
          }
          req.query.type_code_hash = TYPE_SCRIPT.code_hash;
          req.query.type_hash_type = TYPE_SCRIPT.hash_type;
          req.query.type_args = TYPE_SCRIPT.args;
          req.query.decimal = "18";
          
          mock_repository.mockCollectTransactions().resolves(dexOrderTransactions);
        })
        it('should return bid orders and ask orders', async () => {
          await controller.getOrders(req, res, next);
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            ask_orders: [{ price: "100000000000000", receive: "236944947979" }, { price: "98760000000000", receive: "296280000" }, { price: "43210000000000", receive: "1" }],
            bid_orders: [{ price: "400000", receive: "2500000" }]
          });
        }) 
      });  

      describe('lumos query when the transaction is empty', () => {
        beforeEach(() => {
          const TYPE_SCRIPT = {
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type',
            args: '0xe7dd2956717c180e727cc0948cdc3275f247c18b7592b39adcebc0d0e1a906bb'
          }
          req.query.type_code_hash = TYPE_SCRIPT.code_hash
          req.query.type_hash_type = TYPE_SCRIPT.hash_type
          req.query.type_args = TYPE_SCRIPT.args;
          
          mock_repository.mockCollectTransactions().resolves([]);
        })
        it('should return bid orders and ask orders', async () => {
          await controller.getOrders(req, res, next);
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            ask_orders: [],
            bid_orders: []
          });
        }) 
      }); 
    });
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
        mock_repository.mockGetLastMatchOrders().resolves({
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
        mock_repository.mockGetLastMatchOrders().resolves(null);
      })

      it('should return bid orders and ask orders', async () => {
        await controller.getCurrentPrice(req, res, next);
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith("");
      })
    })

  })
});
