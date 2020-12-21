import CellsSerive from "../cells/cells_service";
import BigNumber from "bignumber.js";
import { contracts } from "../../config";
import { Address, AddressType, Amount, AmountUnit, Cell, OutPoint, Script } from "@lay2/pw-core";
import { COMMISSION_FEE } from '../../constant/number'
import { Cell as LumosCell, OutPoint as LumosOutPoint  } from '@ckb-lumos/base';
import CkbRequestModel from "../../model/req/ckb_request_model";
import CellsAmountRequestModel from "../cells/cells_amount_request_model";

export default class PlaceOrder {
  protected cellService: CellsSerive
  protected balance: BigNumber
  protected address: Address
  protected sudtType: Script
  protected orderLock: Script
  protected inputLock: Script
  protected pay: string
  protected price: string
  protected totalPay: BigNumber
  protected sudtDecimal: number
  protected ckbRequestModel: CkbRequestModel
  protected spentCells?: Array<LumosOutPoint>

  constructor(
    pay: string,
    price: string,
    sudtDecimal: number,
    cellService: CellsSerive,
    balance: string,
    address: string,
    sudtArgs: string,
    ckbRequestModel: CkbRequestModel,
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
    this.totalPay = new BigNumber(pay).times(1 + COMMISSION_FEE)
    this.ckbRequestModel = ckbRequestModel
    this.spentCells = spentCells
  }

  static buildSUDTTypeScript(typeArgs: string): Script {
    return new Script(
      contracts.sudtType.codeHash,
      typeArgs,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contracts.sudtType.hashType as any,
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


  static buildPriceData(price: string, decimal: number): string {
    const realPrice = new BigNumber(price).times(10 ** (AmountUnit.ckb - decimal))
    const [effectStr, exponentStr] = realPrice.toExponential().split('e')
    const [, offset] = effectStr.split('.')
    const effect = effectStr.split('.').join('')
    let exponent = parseInt(exponentStr, 10)
    if (offset) {
      exponent -= offset.length
    }

    const buf = Buffer.allocUnsafe(9)
    buf.writeBigInt64BE(BigInt(effect), 0) // u64
    buf.writeInt8(exponent, 8) // i8
    return buf.toString('hex')
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

  static buildCkbRequstModel(typeArgs: string, lockArgs: string): CkbRequestModel {
    return CkbRequestModel.buildReqParam(
      contracts.sudtType.codeHash,
      contracts.sudtType.hashType,
      typeArgs,
      contracts.orderLock.codeHash,
      contracts.sudtType.hashType,
      lockArgs,
    )
  }

  static buildCellsAmountRequestModel(
    ckbRequestModel: CkbRequestModel,
    ckbAmount?: string,
    sudtAmount?: string,
    spentCells?: Array<LumosOutPoint>
  ): CellsAmountRequestModel {
    return {
      ...ckbRequestModel,
      spent_cells: spentCells,
      ckb_amount: ckbAmount,
      sudt_amount: sudtAmount,
    }
  }
}
