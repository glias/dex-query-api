import CellsSerive from "../cells/cells_service";
import BigNumber from "bignumber.js";
import { contracts } from "../../config";
import { Address, AddressType, Amount, AmountUnit, Cell, OutPoint, Script } from "@lay2/pw-core";
import { COMMISSION_FEE } from '../../constant/number'
import { Cell as LumosCell, OutPoint as LumosOutPoint  } from '@ckb-lumos/base';
import { SUDT_TYPE_SCRIPT } from "../../constant/script";

export default class PlaceOrder {
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
    this.cellService = cellService
    this.balance = new BigNumber(balance)
    this.address = new Address(address, AddressType.ckb)
    this.sudtType = PlaceOrder.buildSUDTTypeScript(sudtArgs)
    this.inputLock = this.address.toLockScript()
    this.orderLock = PlaceOrder.buildOrderLock(this.address)
    this.pay = pay
    this.price = price
    this.sudtDecimal = sudtDecimal
    this.actualPay = new BigNumber(pay).times(1 - COMMISSION_FEE)
    this.spentCells = spentCells
  }

  static buildSUDTTypeScript(typeArgs: string): Script {
    return new Script(
      SUDT_TYPE_SCRIPT.codeHash,
      typeArgs,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SUDT_TYPE_SCRIPT.hashType as any,
    )
  }

  static buildOrderLock(address: Address): Script {
    return new Script(
      contracts.orderLock.codeHash,
      address.toLockScript().toHash(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contracts.orderLock.hashType as any,
    )
  }

  async collect(neededCapacity: string): Promise<Cell[]> {
    const lock = this.address.toLockScript()
    const cells = await this.cellService.getLiveCellsForAmount({
      spent_cells: this.spentCells,
      lock_args: lock.args,
      lock_code_hash: lock.codeHash,
      lock_hash_type: lock.hashType,
      ckb_amount: neededCapacity,
    })

    return cells.map(PlaceOrder.fromLumosCell)
  }

  async collectSUDT(sudtAmount: string): Promise<Cell[]> {
    const lock = this.address.toLockScript()
    const type = this.sudtType
    const cells = await this.cellService.getLiveCellsForAmount({
      spent_cells: this.spentCells,
      lock_args: lock.args,
      lock_code_hash: lock.codeHash,
      lock_hash_type: lock.hashType,
      type_args: type.args,
      type_code_hash: type.codeHash,
      type_hash_type: type.hashType,
      sudt_amount: sudtAmount,
    })

    return cells.map(PlaceOrder.fromLumosCell)
  }

  static buildPriceData(price: string, decimal: number): string {
    const realPrice = new BigNumber(price).times(10 ** (AmountUnit.ckb - decimal))
    const [effectStr, exponentStr] = realPrice.toExponential().split('e')
    const [, offset] = effectStr.split('.')
    const effect = effectStr.split('.').join('')
    let exponent = parseInt(exponentStr, 10)
    if (offset) {
      exponent -= offset.length
    }

    const effectBuf = Buffer.allocUnsafe(8) // u64
    effectBuf.writeBigInt64LE(BigInt(effect), 0)
    const exponentBuf = Buffer.allocUnsafe(1) // i8
    exponentBuf.writeInt8(exponent)
    return effectBuf.toString('hex') + exponentBuf.toString('hex')
  }

  static buildVersionData(): string {
    const buf = Buffer.allocUnsafe(1)
    buf.writeUInt8(contracts.orderLock.version, 0) // u8
    return buf.toString('hex')
  }

  public static fromLumosCell(cell: LumosCell): Cell {
    const {
      cell_output: { lock, type, capacity },
      data,
      out_point,
    } = cell
    const { tx_hash, index } = out_point

    return new Cell(
      new Amount(capacity, AmountUnit.shannon),
      Script.fromRPC(lock),
      Script.fromRPC(type),
      new OutPoint(tx_hash, index),
      data,
    )
  }
}
