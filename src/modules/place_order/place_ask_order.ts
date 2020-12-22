import CellsSerive from "../cells/cells_service";
import BigNumber from "bignumber.js";
import { Address, Amount, AmountUnit, Builder, Cell, RawTransaction, Script, Transaction } from "@lay2/pw-core";
import { CKB_MIN_CAPACITY, MAX_TRANSACTION_FEE, ORDER_CELL_CAPACITY, SUDT_MIN_CAPACITY } from '../../constant/number'
import { SUDT_DEP } from "../../constant/script";
import { CkbUtils } from "../../component";
import PlaceOrder from './place_order'
import { OutPoint as LumosOutPoint  } from '@ckb-lumos/base';

export default class PlaceAskOrder extends PlaceOrder {
  protected cellService: CellsSerive
  protected balance: BigNumber
  protected address: Address
  protected sudtType: Script
  protected orderLock: Script
  protected inputLock: Script
  protected pay: string
  protected price: string
  protected actualPay: BigNumber
  protected sudtDecimal: number
  protected spentCells?: Array<LumosOutPoint>

  constructor(
    pay: string,
    price: string,
    sudtDecimal: number,
    cellService: CellsSerive,
    balance: string,
    address: string,
    sudtArgs: string,
    spentCells?: Array<LumosOutPoint>
  ) {
    super(
      pay,
      price,
      sudtDecimal,
      cellService,
      balance,
      address,
      sudtArgs,
      spentCells
    )
  }

  async placeOrder(): Promise<Transaction> {
    const minKeepBothChangeCapacity = new BigNumber(0)
      .plus(ORDER_CELL_CAPACITY) // 181
      .plus(SUDT_MIN_CAPACITY) // 142
      .plus(CKB_MIN_CAPACITY) // 61
      .plus(MAX_TRANSACTION_FEE) // 0.1
      .times(10 ** AmountUnit.ckb)

    const minKeepSudtChangeCapacity = new BigNumber(0)
      .plus(ORDER_CELL_CAPACITY) // 181
      .plus(SUDT_MIN_CAPACITY) // 142
      .plus(MAX_TRANSACTION_FEE) // 0.1
      .times(10 ** AmountUnit.ckb)

    const minCapacity = new BigNumber(0)
      .plus(MAX_TRANSACTION_FEE) // 0.1
      .times(10 ** AmountUnit.ckb)

    if (minKeepBothChangeCapacity.lte(this.balance)) {
      return this.placeOrderWithChange(minKeepBothChangeCapacity, true)
    }

    if (minKeepSudtChangeCapacity.lte(this.balance)) {
      return this.placeOrderWithChange(minKeepSudtChangeCapacity, false)
    }

    if (minCapacity.lte(this.balance)) {
      return this.placeOrderWithoutChange(minCapacity)
    }

    throw new Error("CKB is Not enough") 
  }

  async placeOrderWithChange (neededCapacity: BigNumber, keepBothChange: boolean): Promise<Transaction> {
    let sudtAmount = new BigNumber(0)
    let inputCapacity = new BigNumber(0)

    const inputs: Cell[] = []

    const cells = await this.collectSUDT(new BigNumber(this.pay).times(10 ** this.sudtDecimal).toFixed(0, 1))

    cells.forEach(cell => {
      sudtAmount = sudtAmount.plus(cell.getSUDTAmount().toBigInt().toString())
      inputs.push(cell)
      inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
    })

    if (sudtAmount.lt(this.pay)) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    if (inputCapacity.lt(neededCapacity)) {
      const extraCells = await this.collect(neededCapacity.minus(inputCapacity).toString())

      extraCells.forEach(cell => {
        if (inputCapacity.lte(neededCapacity)) {
          inputs.push(cell)
          inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
        }
      })
    }

    if (inputCapacity.lt(neededCapacity)) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    const receive = PlaceAskOrder.calcAskReceive(this.actualPay.toString(), this.price)

    const orderOutput = new Cell(
      new Amount(ORDER_CELL_CAPACITY.toString(), AmountUnit.ckb),
      this.orderLock,
      this.sudtType,
    )
    orderOutput.setHexData(PlaceAskOrder.buildAskData(this.actualPay.toString(), receive, this.price, this.sudtDecimal))

    const sudtChangeAmount = keepBothChange
      ? new Amount(SUDT_MIN_CAPACITY.toString(), AmountUnit.ckb)
      : new Amount(inputCapacity.minus(neededCapacity).toString(), AmountUnit.shannon)

    const sudtChangeOutput = new Cell(
      sudtChangeAmount,
      this.inputLock,
      this.sudtType,
    )

    sudtChangeOutput.setHexData(
      CkbUtils.formatBigUInt128LE(BigInt(
        sudtAmount.minus(this.actualPay.times(10 ** this.sudtDecimal).toFixed(0, 1))
      ))
    )

    const outputs: Cell[] = [orderOutput, sudtChangeOutput]

    if (keepBothChange) {
      const ckbChangeOutput = new Cell(
        new Amount(
          inputCapacity
            .minus(new BigNumber(ORDER_CELL_CAPACITY).times(10 ** AmountUnit.ckb))
            .minus(new BigNumber(SUDT_MIN_CAPACITY).times(10 ** AmountUnit.ckb))
            .toFixed(0, 1),
          AmountUnit.shannon
        ),
        this.inputLock,
      )

      outputs.push(ckbChangeOutput)
    }

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1])
  
    tx.raw.cellDeps.push(SUDT_DEP)
    const fee = Builder.calcFee(tx)

    const lastOutput = outputs[outputs.length - 1]
    lastOutput.capacity = lastOutput.capacity.sub(fee)
    tx.raw.outputs.pop()
    tx.raw.outputs.push(lastOutput)

    return tx
  }

  async placeOrderWithoutChange (neededCapacity: BigNumber): Promise<Transaction> {
    let sudtAmount = new BigNumber(0)
    let inputCapacity = new BigNumber(0)

    const inputs: Cell[] = []

    const cells = await this.collectSUDT(new BigNumber(this.pay).times(10 ** this.sudtDecimal).toFixed(0, 1))

    cells.forEach(cell => {
      sudtAmount = sudtAmount.plus(cell.getSUDTAmount().toBigInt().toString())
      inputs.push(cell)
      inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
    })

    if (sudtAmount.lt(this.pay)) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    if (inputCapacity.lt(neededCapacity)) {
      const extraCells = await this.collect(neededCapacity.minus(inputCapacity).toString())

      extraCells.forEach(cell => {
        if (inputCapacity.lte(neededCapacity)) {
          inputs.push(cell)
          inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
        }
      })
    }

    if (inputCapacity.lt(neededCapacity)) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    const receive = PlaceAskOrder.calcAskReceive(this.actualPay.toString(), this.price)

    const orderOutput = new Cell(
      new Amount(inputCapacity.toString(), AmountUnit.shannon),
      this.orderLock,
      this.sudtType,
    )
    orderOutput.setHexData(PlaceAskOrder.buildAskData(sudtAmount.div(10 ** this.sudtDecimal).toString(), receive, this.price, this.sudtDecimal))

    const outputs: Cell[] = [orderOutput]

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1])
  
    tx.raw.cellDeps.push(SUDT_DEP)
    const fee = Builder.calcFee(tx)

    const lastOutput = outputs[outputs.length - 1]
    lastOutput.capacity = lastOutput.capacity.sub(fee)
    tx.raw.outputs.pop()
    tx.raw.outputs.push(lastOutput)

    return tx
  }

  static calcAskReceive(pay: string, price: string): string {
    return new BigNumber(pay).times(price).toFixed(8, 1)
  }

  static buildAskData (amount: string, orderAmount: string, price: string, sudtDecimal: number): string {
    const amountData = CkbUtils.formatBigUInt128LE(BigInt(new BigNumber(amount).times(10 ** sudtDecimal).toFixed(0, 1)))
    const orderAmountData = CkbUtils.formatBigUInt128LE(BigInt(new BigNumber(orderAmount).times(10 ** AmountUnit.ckb).toFixed(0, 1))).slice(2)
    const versionData = PlaceOrder.buildVersionData()
    const priceData = PlaceOrder.buildPriceData(price, sudtDecimal)

    return `${amountData}${versionData}${orderAmountData}${priceData}01`
  }
}
