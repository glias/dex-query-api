import { inject, injectable, LazyServiceIdentifer } from "inversify";
import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";

import CellsSerive from "../cells/cells_service";
import BalanceService from "../balance/balance_service";
import CkbRequestModel from "../../model/req/ckb_request_model";
import { contracts } from "../../config";
import CellsAmountRequestModel from "../cells/cells_amount_request_model";
import { OutPoint as LumosOutPoint } from '@ckb-lumos/base';
import PlaceOrder from "./place_order";
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
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private cellService: CellsSerive,
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private balanceService: BalanceService
  ) {}

  async placeOrder (payload: Payload): Promise<Transaction> {
    const { pay, price, udt_decimals, ckb_address, is_bid, udt_type_args, spent_cells } = payload
    const ckbRequestModel = PlaceOrder.buildCkbRequstModel(udt_type_args, new Address(ckb_address, AddressType.eth).toLockScript().args)

    const { free } = await this.balanceService.getCKBBalance(ckbRequestModel)

    const Builder = is_bid ? PlaceBidOrder : PlaceAskOrder

    const builder = new Builder(
      pay,
      price,
      udt_decimals,
      this.cellService,
      free,
      ckb_address,
      udt_type_args,
      ckbRequestModel,
      spent_cells,
    )

    return builder.placeOrder()
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
