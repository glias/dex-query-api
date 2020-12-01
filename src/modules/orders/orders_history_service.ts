import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { HashType, Script } from "@ckb-lumos/base";
import IndexerWrapper from "../indexer/indexer";

import { modules } from "../../ioc";
import { contracts } from "../../config";
import OrdersHistoryCalculate from "./orders_history_calculate";
import { IndexerService } from '../indexer/indexer_service';
import { OrdersHistoryModel } from './orders_history_model';

@injectable()
export default class OrdersHistoryService {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {}
  async getOrderHistory(
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    order_lock_args: string
  ): Promise<Array<OrdersHistoryModel>> {
    const sudtType: Script = {
      code_hash: type_code_hash,
      hash_type: <HashType>type_hash_type,
      args: type_args,
    };

    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: order_lock_args,
    };

    const ordersHistoryService = new OrdersHistoryCalculate(this.indexer, orderLock, sudtType);
    const ordersHistory = await ordersHistoryService.calculateOrdersHistory();    

    const formattedOrdersHistory = ordersHistory.map((o) => {
      const {order_cells} = o
      const lastOrderCell = order_cells[order_cells.length - 1]

      const orderHistory: OrdersHistoryModel = {
        block_hash: o.block_hash,
        is_bid: o.is_bid,
        order_amount: o.order_amount.toString(),
        traded_amount: o.traded_amount.toString(),
        turnover_rate: o.turnover_rate.toString(),
        paid_amount: o.paid_amount.toString(),
        price: o.price.toString(),
        status: o.status,
        last_order_cell_outpoint: {
          tx_hash: lastOrderCell.outpoint.tx_hash,
          index: `0x${lastOrderCell.outpoint.index}`,
        },
        order_cells: order_cells.map(orderCell => ({
          tx_hash: orderCell.outpoint.tx_hash,
          index: orderCell.outpoint.index,
        }))
      };
      if (lastOrderCell.nextTxHash) {
        orderHistory.last_order_cell_outpoint = {
          tx_hash: lastOrderCell.nextTxHash,
          index: "0x1",
        };
      }

      return orderHistory;
    });

    return formattedOrdersHistory;
  }
}
