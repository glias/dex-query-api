import CellsSerive from "../cells/cells_service";
import BigNumber from "bignumber.js";
import { Address, Amount, AmountUnit, Builder, Cell, RawTransaction, Script, Transaction } from "@lay2/pw-core";
import { CKB_MIN_CAPACITY, MAX_TRANSACTION_FEE, ORDER_CELL_CAPACITY } from '../../constant/number'
import { SUDT_DEP } from "../../constant/script";
import { CkbUtils } from "../../component";
import PlaceOrder from './place_order'
import { OutPoint as LumosOutPoint  } from '@ckb-lumos/base';

export default class PlaceBidOrder extends PlaceOrder {
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

  static calcBidReceive(pay: string, price: string, decimal: number): string {
    return new BigNumber(pay).div(price).toFixed(decimal, 1)
  }

  static buildBidData(orderAmount: string, price: string, decimal: number): string {
    const amountData = CkbUtils.formatBigUInt128LE(BigInt(0))

    const versionData = PlaceOrder.buildVersionData()

    const orderAmountData = CkbUtils.formatBigUInt128LE(BigInt(new BigNumber(orderAmount).times(10 ** decimal).toFixed(0, 1))).slice(2)

    const priceData = PlaceOrder.buildPriceData(price, decimal)

    return `${amountData}${versionData}${orderAmountData}${priceData}00`
  }

  async placeOrder(): Promise<Transaction> {
    const minCapacity = new BigNumber(this.pay)
      .plus(ORDER_CELL_CAPACITY) // 181
      .plus(MAX_TRANSACTION_FEE) // 0.1
      .times(10 ** AmountUnit.ckb)

    const minKeepChangeCapacity = new BigNumber(this.pay)
      .plus(ORDER_CELL_CAPACITY) // 181
      .plus(CKB_MIN_CAPACITY) // 61
      .plus(MAX_TRANSACTION_FEE) // 0.1
      .times(10 ** AmountUnit.ckb)

    if (minKeepChangeCapacity.lte(this.balance)) {
      return this.placeBidOrderWithChange(minKeepChangeCapacity)
    }

    if (minCapacity.lte(this.balance)) {
      return this.placeBidOrderWithoutChange(minCapacity)
    }

    throw new Error('CKB balance is not enough.')
  }

  async placeBidOrderWithoutChange(
    neededCapacity: BigNumber,
  ): Promise<Transaction> {
    let inputCapacity = new BigNumber(0)
    const inputs: Cell[] = []

    const cells = await this.collect(neededCapacity.toFixed(0, BigNumber.ROUND_DOWN))

    if (cells.length === 0) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    cells.forEach(cell => {
      if (inputCapacity.lte(neededCapacity)) {
        inputs.push(cell)
        inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
      }
    })

    const orderOutput = new Cell(
      new Amount(ORDER_CELL_CAPACITY.toString(), AmountUnit.ckb),
      this.orderLock,
      this.sudtType,
    )

    const receive = PlaceBidOrder.calcBidReceive(this.actualPay.toString(), this.price, this.sudtDecimal)
    orderOutput.setHexData(PlaceBidOrder.buildBidData(receive, this.price, this.sudtDecimal))

    const outputs: Cell[] = [orderOutput]

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1])

    tx.raw.cellDeps.push(SUDT_DEP)

    const fee = Builder.calcFee(tx)

    orderOutput.capacity = orderOutput.capacity.sub(fee)
    tx.raw.outputs.pop()
    tx.raw.outputs.push(orderOutput)

    return tx
  }

  async placeBidOrderWithChange(
    neededCapacity: BigNumber,
  ): Promise<Transaction> {
    let inputCapacity = new BigNumber(0)
    const inputs: Cell[] = []

    const cells = await this.collect(neededCapacity.toFixed(0, BigNumber.ROUND_DOWN))

    if (cells.length === 0) {
      throw new Error(`You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`);
    }

    cells.forEach(cell => {
      if (inputCapacity.lte(neededCapacity)) {
        inputs.push(cell)
        inputCapacity = inputCapacity.plus(cell.capacity.toHexString())
      }
    })

    const orderOutput = new Cell(
      new Amount(ORDER_CELL_CAPACITY.toString(), AmountUnit.ckb),
      this.orderLock,
      this.sudtType,
    )

    const receive = PlaceBidOrder.calcBidReceive(this.actualPay.toString(), this.price, this.sudtDecimal)
    orderOutput.setHexData(PlaceBidOrder.buildBidData(receive, this.price, this.sudtDecimal))

    const changeOutput = new Cell(
      new Amount(
        inputCapacity.minus(
          new BigNumber(ORDER_CELL_CAPACITY).times(10 ** AmountUnit.ckb)
        ).toFixed(0, BigNumber.ROUND_DOWN),
        AmountUnit.shannon,
      ),
      this.inputLock,
    )

    const outputs: Cell[] = [orderOutput, changeOutput]

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1])

    tx.raw.cellDeps.push(SUDT_DEP)

    const fee = Builder.calcFee(tx)

    changeOutput.capacity = changeOutput.capacity.sub(fee)
    tx.raw.outputs.pop()
    tx.raw.outputs.push(changeOutput)
    
    return tx
  }
}
