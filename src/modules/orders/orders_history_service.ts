import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { HashType, Script } from '@ckb-lumos/base'
import { modules } from '../../ioc'
import { contracts } from '../../config'
import { OrdersHistoryModel } from './orders_history_model'
import { DexOrderChainFactory } from '../../model/orders/dex_order_chain_factory'
import CkbRepository from '../repository/ckb_repository'
import { DexRepository } from '../repository/dex_repository'

@injectable()
export default class OrdersHistoryService {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private readonly repository: DexRepository
  ) {}

  async batch (
    queryOption: {
      type_code_hash: string
      type_hash_type: string
      order_lock_args: string
      ckb_address: string
      eth_address: string
      types: Array<{
        type_args: string
      }>
    }
  ): Promise<{
      normal_orders: OrdersHistoryModel[]
      cross_chain_orders: []
    }> {
    const normal_orders = []
    for (const type of queryOption.types) {
      const orders = await this.getNormalOrders(queryOption.type_code_hash, queryOption.type_hash_type, type.type_args, queryOption.order_lock_args)
      orders.forEach(x => normal_orders.push(x))
    }

    const cross_chain_orders = await this.repository.getForceBridgeHistory(queryOption.ckb_address, queryOption.eth_address, true)

    return {
      normal_orders: normal_orders,
      cross_chain_orders: cross_chain_orders
    }
  }

  async getOrderHistory (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    order_lock_args: string,
    ckb_address: string,
    eth_address: string
  ): Promise<{
      normal_orders: OrdersHistoryModel[]
      cross_chain_orders: []
    }> {
    const normal_orders = await this.getNormalOrders(type_code_hash, type_hash_type, type_args, order_lock_args)
    const cross_chain_orders = await this.repository.getForceBridgeHistory(ckb_address, eth_address, true)

    return {
      normal_orders: normal_orders,
      cross_chain_orders: cross_chain_orders
    }
  }

  private async getNormalOrders (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    order_lock_args: string
  ): Promise<OrdersHistoryModel[]> {
    const sudtType: Script = {
      code_hash: type_code_hash,
      hash_type: <HashType>type_hash_type,
      args: type_args
    }

    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: order_lock_args
    }

    const txsWithStatus = await this.repository.collectTransactions({
      type: sudtType,
      lock: orderLock
    })

    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(orderLock, sudtType, txsWithStatus).filter(x => x.cell.lock.args === order_lock_args)

    const normal_orders: OrdersHistoryModel[] = []
    for (const order of orders) {
      const orders = order.getOrders()
      const orderCells = order.getOrderStatus() !== 'opening' ? orders.splice(0, orders.length - 1) : orders
      const timestamp = await this.repository.getBlockTimestampByHash(order.tx.tx_status.block_hash)

      const orderHistory: OrdersHistoryModel = {
        block_hash: order.tx.tx_status.block_hash,
        is_bid: order.isBid(),
        order_amount: order.getOrderData().orderAmount.toString(),
        traded_amount: order.getTradedAmount().toString(),
        turnover_rate: order.getTurnoverRate().toString(),
        paid_amount: order.getPaidAmount().toString(),
        price: order.getOrderData().price.toString(),
        status: order.getOrderStatus(),
        timestamp: parseInt(timestamp, 16).toString(),
        last_order_cell_outpoint: {
          tx_hash: order.getLastOrder().tx.transaction.hash,
          index: `0x${order.getLastOrder().index.toString(16)}`
        },
        order_cells: orderCells.map(orderCell => ({
          tx_hash: orderCell.tx.transaction.hash,
          index: `0x${orderCell.index.toString(16)}`
        })),
        type_args
      }
      normal_orders.push(orderHistory)
    }

    return normal_orders
  }
}
