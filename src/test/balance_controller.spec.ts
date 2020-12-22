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
import { utils, Cell, QueryOptions, TransactionWithStatus, HashType } from '@ckb-lumos/base';

import { IndexerService } from '../modules/indexer/indexer_service';
import BalanceService from '../modules/balance/balance_service';
import BalanceController from '../modules/balance/balance_controller';
import { contracts } from "../config";

describe('Balance controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let mock_cells;


  const generateCell = (capacity, data, lock, type, txHash = '0x1') => {
    const cell: Cell = {
      cell_output: {
        capacity: `0x${capacity.toString(16)}`,
        lock: lock || {
          code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
          hash_type: 'data',
          args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        },
      },
      out_point: {
        tx_hash: txHash,
        index: '0x0',
      },
      block_hash: '0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40',
      block_number: '0xf',
      data: data || '0x',
    };

    if (type) {
      cell.cell_output.type = type;
    }

    return cell;
  };

  const lock = {
    code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
    hash_type: <HashType>'data',
    args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
  };
  const orderLock = {
    code_hash: contracts.orderLock.codeHash,
    hash_type: contracts.orderLock.hashType,
    args: utils.computeScriptHash(lock),
  };
  const sudtType = {
    code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
    hash_type: 'type',
    args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
  };

  const cellsWithNormalLock = [
    generateCell(30, null, lock, null),
    generateCell(10, null, lock, null),
    generateCell(40, '0x1111', lock, null),
    generateCell(20, null, lock, null),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(30)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(10)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(20)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(20)), lock, sudtType),
  ];
  const cellsWithOrderLock = [
    generateCell(30, null, orderLock, null),
    generateCell(40, '0x1111', orderLock, null),
    generateCell(1, CkbUtils.formatOrderData(BigInt(20), 1, BigInt(1), BigInt(1), 0, true), orderLock, sudtType),
    generateCell(1, '0x121', orderLock, sudtType),
  ];

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  beforeEach(() => {
    class MockIndex implements IndexerService {

      tip(): Promise<number> {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      collectCells(queryOptions: QueryOptions): Promise<Cell[]> { 
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      collectTransactions(queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getLastMatchOrders(type) {
        return null;
      }
  
    }
  
    const mock: MockIndex = new MockIndex();
    mock_cells = sinon.stub(mock, 'collectCells');  
    const service = new BalanceService(mock);
    controller = new BalanceController(service);
    
    // const test = sinon.stub(mock, 'collectCells');  
    

    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });

  describe('#getCKBBalance()', () => {
    describe('valid requests', () => {
      beforeEach(() => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args,
        };
      });
      describe('with mixed cells', () => {
        beforeEach(async () => {
          mock_cells
            .withArgs({ lock })
            .resolves(clone(cellsWithNormalLock));
          mock_cells
            .withArgs({ lock: orderLock })
            .resolves(clone(cellsWithOrderLock));

          await controller.getCKBBalance(req, res, next);
        });
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            free: '60',
            occupied: '44',
            locked_order: '72',
          });
        });
      });
      describe('with cells having non-empty data', () => {
        beforeEach(async () => {
          mock_cells
            .withArgs({ lock })
            .resolves(clone([
              generateCell(10, null, lock, null),
              generateCell(40, '0x1111', lock, null),
            ]));
          mock_cells
            .withArgs({ lock: orderLock })
            .resolves([]);
          await controller.getCKBBalance(req, res, next);
        });
        it('returns balance excluding the amounts of cells having data', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            free: '10',
            occupied: '40',
            locked_order: '0',
          });
        });
      });
      describe('with cells having type script', () => {
        beforeEach(async () => {
          mock_cells
            .withArgs({ lock })
            .resolves(clone([
              generateCell(10, null, lock, null),
              generateCell(40, null, lock, sudtType),
            ]));
          mock_cells
            .withArgs({ lock: orderLock })
            .resolves([]);
          await controller.getCKBBalance(req, res, next);
        });
        it('returns balance excluding the amounts of cells having data', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            free: '10',
            occupied: '40',
            locked_order: '0',
          });
        });
      });
    });
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {};
          await controller.getCKBBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires lock script to be specified as parameters' });
        });
      });
    });
  });
  describe('#getSUDTBalance()', () => {
    describe('valid requests', () => {
      beforeEach(async () => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args,
          type_code_hash: sudtType.code_hash,
          type_hash_type: sudtType.hash_type,
          type_args: sudtType.args,
        };
        mock_cells
          .withArgs({
            lock,
            type: sudtType,
          })
          .resolves(clone(cellsWithNormalLock));

        mock_cells
          .withArgs({
            lock: orderLock,
            type: sudtType,
          })
          .resolves(clone(cellsWithOrderLock));
        await controller.getSUDTBalance(req, res, next);
      });
      it('returns balance', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ free: '80', locked_order: '20' });
      });
    });
    describe('invalid requests', () => {
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          await controller.getSUDTBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' });
        });
      });
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args,
          };
          await controller.getSUDTBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' });
        });
      });
    });
  });
});
