import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { utils, Script, QueryOptions, Cell } from '@ckb-lumos/base'
import { modules } from '../../ioc'
import { contracts } from '../../config'
import { CkbUtils, DexLogger } from '../../component'
import BalanceCkbModel from './balance_ckb_model'
import BalanceSudtModel from './balance_sudt_model'
import CkbRequestModel from '../../model/req/ckb_request_model'
import { DexRepository } from '../repository/dex_repository'
import CkbRepository from '../repository/ckb_repository'
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'
import CkbCellModel from '../../model/ckb/ckb_cell'
import { DefaultScriptEquals, ScriptEquals } from '../../model/script_equals'

@injectable()
export default class BalanceService {
  private readonly logger: DexLogger
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private readonly dexRepository: DexRepository
  ) {
    this.logger = new DexLogger(BalanceService.name)
  }

  async getCKBBalance (
    reqParms: CkbRequestModel
  ): Promise<BalanceCkbModel> {
    const queryLock: Script = reqParms.lockScript()
    const inputOutPointWithTransaction = await this.dexRepository.getInputOutPointFromTheTxPool()
    const cells = await this.getUserCells({
      lock: queryLock
    }, inputOutPointWithTransaction)

    const normalCells = cells.filter(
      (cell: Cell) => cell.data === '0x' && !cell.cell_output.type)

    const balance = normalCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    )

    const occupiedCells = cells.filter(
      (cell) => cell.data !== '0x' || cell.cell_output.type
    )

    const occupiedBalance = occupiedCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    )

    const queryLockHash = utils.computeScriptHash(queryLock)
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash
    }

    const orderCells = await this.getOrderCell({
      lock: orderLock
    }, inputOutPointWithTransaction)

    const lockedOrderBalance = orderCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    )

    return {
      free: balance.toString(),
      occupied: occupiedBalance.toString(),
      locked_order: lockedOrderBalance.toString()
    }
  }

  async getSUDTBalance (
    reqParms: CkbRequestModel
  ): Promise<BalanceSudtModel> {
    const queryOptions: QueryOptions = {
      lock: reqParms.lockScript(),
      type: reqParms.typeScript()
    }

    const inputOutPointWithTransaction = await this.dexRepository.getInputOutPointFromTheTxPool()
    const cells = await this.getUserCells(queryOptions, inputOutPointWithTransaction)

    const balance = cells.reduce((total, cell) => {
      try {
        return total + CkbUtils.readBigUInt128LE(cell.data)
      } catch (error) {
        console.error(error)
        return total
      }
    }, BigInt(0))

    const queryLockHash = utils.computeScriptHash(<Script>queryOptions.lock)
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash
    }

    const orderCells = await this.getOrderCell({
      lock: orderLock,
      type: queryOptions.type
    }, inputOutPointWithTransaction)

    const lockedOrderBalance = orderCells.reduce((total, cell: Cell) => {
      try {
        return total + CkbUtils.parseOrderData(cell.data).sUDTAmount
      } catch (error) {
        console.error(error)
        return total
      }
    }, BigInt(0))

    return {
      free: balance.toString(),
      locked_order: lockedOrderBalance.toString()
    }
  }

  private async getOrderCell (queryOptions: QueryOptions, inputOutPointWithTransaction: Map<string, CkbTransactionWithStatusModelWrapper>): Promise<Cell[]> {
    const lock = <Script>queryOptions.lock
    const type = <Script>queryOptions.type
    const scriptEquals: ScriptEquals = new DefaultScriptEquals()

    let mergeCells = await this.dexRepository.collectCells(queryOptions)
    if (type) {
      mergeCells = mergeCells.filter(x => scriptEquals.equalsTypeScript(x.cell_output.type, type))
    }
    const markHashes = new Set()

    for (const tx of inputOutPointWithTransaction.values()) {
      if (markHashes.has(tx.ckbTransactionWithStatus.transaction.hash)) {
        continue
      }

      markHashes.add(tx.ckbTransactionWithStatus.transaction.hash)
      for (let i = 0; i < tx.ckbTransactionWithStatus.transaction.outputs.length; i++) {
        const cell = tx.ckbTransactionWithStatus.transaction.outputs[i]
        if (type && scriptEquals.equalsLockScript(cell.lock, lock) &&
          scriptEquals.equalsTypeScript(cell.type, type)) {
          const lumosCell: Cell = this.buildLumosCell(cell, lock, type, tx, i)
          mergeCells.push(lumosCell)
        }

        if (!type && scriptEquals.equalsLockScript(cell.lock, lock)) {
          const lumosCell: Cell = this.buildLumosCell(cell, lock, type, tx, i)
          mergeCells.push(lumosCell)
        }
      }
    }

    return mergeCells
  }

  private async getUserCells (queryOptions: QueryOptions, inputOutPointWithTransaction: Map<string, CkbTransactionWithStatusModelWrapper>): Promise<Cell[]> {
    const cells = await this.dexRepository.collectCells(queryOptions)
    const inputTxs: CkbTransactionWithStatusModelWrapper[] = []
    const markHashes = new Set()
    const mergeCells = []

    for (const cell of cells) {
      const key = `${cell.out_point.tx_hash}:${cell.out_point.index}`
      if (inputOutPointWithTransaction.has(key)) {
        const tx = inputOutPointWithTransaction.get(key)
        if (!markHashes.has(tx.ckbTransactionWithStatus.transaction.hash)) {
          inputTxs.push(tx)
          markHashes.add(tx.ckbTransactionWithStatus.transaction.hash)
        }
      } else {
        mergeCells.push(cell)
      }
    }

    const lock = <Script>queryOptions.lock
    const type = <Script>queryOptions.type
    const scriptEquals: ScriptEquals = new DefaultScriptEquals()

    for (const tx of inputTxs) {
      const outputs = tx.ckbTransactionWithStatus.transaction.outputs

      for (let i = 0; i < outputs.length; i++) {
        const cell = outputs[i]
        if (type && scriptEquals.equalsLockScript(cell.lock, lock) &&
          scriptEquals.equalsTypeScript(cell.type, type)) {
          const lumosCell: Cell = this.buildLumosCell(cell, lock, type, tx, i)
          mergeCells.push(lumosCell)
        }

        if (!type && scriptEquals.equalsLockScript(cell.lock, lock)) {
          const lumosCell: Cell = this.buildLumosCell(cell, lock, type, tx, i)
          mergeCells.push(lumosCell)
        }
      }
    }

    return mergeCells
  }

  private buildLumosCell (cell: CkbCellModel, lock: Script, type: Script, tx: CkbTransactionWithStatusModelWrapper, i: number): Cell {
    return {
      cell_output: {
        capacity: cell.capacity,
        lock: lock,
        type: type
      },
      data: tx.ckbTransactionWithStatus.transaction.outputsData[i],
      out_point: {
        tx_hash: tx.ckbTransactionWithStatus.transaction.hash,
        index: i.toString(16)
      }
    }
  }
}
