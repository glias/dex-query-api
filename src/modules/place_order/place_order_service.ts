import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { modules } from "../../ioc";

import CellsSerive from "../cells/cells_service";
import BalanceService from "../balance/balance_service";
import CkbRequestModel from "../../model/req/ckb_request_model";
import { OutPoint as LumosOutPoint } from '@ckb-lumos/base';
import { Address, AddressType, Transaction } from "@lay2/pw-core";
import PlaceBidOrder from "./place_bid_order";
import PlaceAskOrder from "./place_ask_order";
interface Payload {
  pay: string
  price: string
  udt_type_args: string
  ckb_address: string
  is_bid: boolean
  udt_decimals: number
  spent_cells?: Array<LumosOutPoint>
}

@injectable()
export default class PlaceOrderService {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[CellsSerive.name]))
    private cellService: CellsSerive,
    @inject(new LazyServiceIdentifer(() => modules[BalanceService.name]))
    private balanceService: BalanceService
  ) {}

  async placeOrder (payload: Payload): Promise<Transaction> {
    const { pay, price, udt_decimals, ckb_address, is_bid, udt_type_args, spent_cells } = payload

    const lock = new Address(ckb_address, AddressType.ckb).toLockScript()
    const { free } = await this.balanceService.getCKBBalance(
      CkbRequestModel.buildReqParam(null, null, null, lock.codeHash, lock.hashType, lock.args)
    )

    const Builder = is_bid ? PlaceBidOrder : PlaceAskOrder

    const builder = new Builder(
      pay,
      price,
      udt_decimals,
      this.cellService,
      free,
      ckb_address,
      udt_type_args,
      spent_cells,
    )

    return builder.placeOrder()
  }
}
