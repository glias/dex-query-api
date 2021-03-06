import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import BigNumber from 'bignumber.js'
import { modules } from '../../ioc'
import { contracts } from '../../config'
import { CkbUtils } from '../../component'
import { Cell, HashType, QueryOptions, Script, TransactionWithStatus } from '@ckb-lumos/base'
import { DexRepository } from '../repository/dex_repository'
import CkbRepository from '../repository/ckb_repository'
import { DexOrderChainFactory } from '../../model/orders/dex_order_chain_factory'
import { DexOrderChain } from '../../model/orders/dex_order_chain'
import { DexCache } from '../cache/dex_cache'
import RedisCache from '../cache/redis_cache'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import { CacheFactory } from '../cache/cache_factory'

@injectable()
export default class OrdersService {
  private readonly orderFactory: CacheFactory
  private readonly priceFactory: CacheFactory

  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private readonly repository: DexRepository,
    @inject(new LazyServiceIdentifer(() => modules[RedisCache.name]))
    private readonly dexCache: DexCache
  ) {
    this.priceFactory = new CacheFactory(dexCache, repository)
    this.orderFactory = new CacheFactory(dexCache, repository)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      await this.orderFactory.scheduling()
      console.log('orderFactory scheduling')
    }, 20000)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      await this.priceFactory.scheduling()
      console.log('priceFactory scheduling')
    }, 20000)
  }

  private ordersCache: Record<string, TransactionWithStatus[]> = Object.create(null)

  private readonly currentPriceCahce: Record<string, TransactionWithStatus[]> = Object.create(null)

  private getOrdersCahce (key: string) {
    return this.ordersCache[key]
  }

  private getCurrentPriceCache (key: string) {
    return this.currentPriceCahce[key]
  }

  private currentPriceCacheInterval = null

  private async setCurrentPriceCache (key: string, queryOptions: QueryOptions) {
    // first time
    if (this.getCurrentPriceCache(key) == null) {
      const res = await this.repository.collectTransactions(queryOptions)
      this.currentPriceCahce[key] = res
      if (this.currentPriceCacheInterval) {
        clearInterval(this.currentPriceCacheInterval)
      }
      this.currentPriceCacheInterval = setInterval(() => {
        this.repository.collectTransactions(queryOptions).then(res => {
          this.currentPriceCahce[key] = res
        })
          .catch(e => (console.error(e)))
      }, 20e3)
    }

    return this.currentPriceCahce[key]
  }

  private ordersCacheInterval = null

  private async setOrdersCache (key: string, queryOptions: QueryOptions) {
    // first time
    if (this.getOrdersCahce(key) == null) {
      const res = await this.repository.collectTransactions(queryOptions)
      this.ordersCache[key] = res
      if (this.ordersCacheInterval) {
        clearInterval(this.ordersCacheInterval)
      }
      this.ordersCacheInterval = setInterval(() => {
        this.repository.collectTransactions(queryOptions).then(res => {
          this.ordersCache[key] = res
        })
          .catch(e => (console.error(e)))
      }, 20e3)
    }

    return this.ordersCache[key]
  }

  async getOrders (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    decimal: string
  ): Promise<{
      bid_orders: Array<{receive: string, price: string}>
      ask_orders: Array<{receive: string, price: string}>
    }> {
    const orderCells = await this.getOrderCells(type_code_hash, type_hash_type, type_args, decimal)
    if (orderCells.length === 0) {
      return {
        bid_orders: [],
        ask_orders: []
      }
    }

    const dexOrdersBid = orderCells.filter(x => CkbUtils.parseOrderData(x.data).isBid)
    const groupbyPriceBid: Map<string, Cell[]> = this.groupbyPrice(dexOrdersBid, decimal)
    const bidOrderPriceKeys = Array.from(groupbyPriceBid.keys()).sort((c1, c2) => new BigNumber(c1).minus(new BigNumber(c2)).toNumber()).reverse()

    const dexOrdersAsk = orderCells.filter(x => !CkbUtils.parseOrderData(x.data).isBid)
    const groupbyPriceAsk: Map<string, Cell[]> = this.groupbyPrice(dexOrdersAsk, decimal)
    const askOrderPriceKeys = Array.from(groupbyPriceAsk.keys()).sort((c1, c2) => new BigNumber(c1).minus(new BigNumber(c2)).toNumber())

    const prices = await this.comparePrice(
      groupbyPriceBid,
      bidOrderPriceKeys,
      groupbyPriceAsk,
      askOrderPriceKeys
    )

    const bid_orders = this.buildOrders(prices.bidOrderPriceKeys, groupbyPriceBid)
    const ask_orders = this.buildOrders(prices.askOrderPriceKeys, groupbyPriceAsk).reverse()

    return {
      bid_orders,
      ask_orders
    }
  }

  private async comparePrice (groupbyPriceBid: Map<string, Cell[]>, bidOrderPriceKeys: string[], groupbyPriceAsk: Map<string, Cell[]>, askOrderPriceKeys: string[]): Promise<{
    bidOrderPriceKeys: string[]
    askOrderPriceKeys: string[]
  }> {
    const bidPrice = bidOrderPriceKeys[0]
    const askPrice = askOrderPriceKeys[0]

    if (new BigNumber(askPrice).gt(new BigNumber(bidPrice))) {
      return {
        bidOrderPriceKeys,
        askOrderPriceKeys
      }
    }

    let bidOrders = groupbyPriceBid.get(bidPrice)
    for (const cell of bidOrders) {
      const blockNumber = await this.repository.getblockNumberByBlockHash(cell.block_hash)
      cell.block_number = blockNumber.toString()
    }
    bidOrders = bidOrders.sort((c1, c2) => parseInt(c1.block_number, 16) - parseInt(c2.block_number, 16))

    let askOrders = groupbyPriceAsk.get(askPrice)
    for (const cell of askOrders) {
      const blockNumber = await this.repository.getblockNumberByBlockHash(cell.block_hash)
      cell.block_number = blockNumber.toString()
    }
    askOrders = askOrders.sort((c1, c2) => parseInt(c1.block_number, 16) - parseInt(c2.block_number, 16))

    let newBidOrderPriceKeys: string[]
    let newAskOrderPriceKeys: string[]
    if (askOrders[0].block_number === bidOrders[0].block_number) {
      const txs = await this.repository.getTxsByBlockHash(askOrders[0].block_number)
      let bidTxIndex = 0
      let askTxIndex = 0
      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i]
        if (tx.ckbTransactionWithStatus.transaction.hash === bidOrders[0].out_point.tx_hash) {
          bidTxIndex = i
        }

        if (tx.ckbTransactionWithStatus.transaction.hash === askOrders[0].out_point.tx_hash) {
          askTxIndex = i
        }

        newBidOrderPriceKeys = askTxIndex < bidTxIndex ? bidOrderPriceKeys.slice(1, bidOrderPriceKeys.length) : bidOrderPriceKeys
        newAskOrderPriceKeys = askTxIndex < bidTxIndex ? askOrderPriceKeys : askOrderPriceKeys.slice(1, askOrderPriceKeys.length)
      }
    } else {
      newBidOrderPriceKeys = askOrders[0].block_number < bidOrders[0].block_number ? bidOrderPriceKeys.slice(1, bidOrderPriceKeys.length) : bidOrderPriceKeys
      newAskOrderPriceKeys = askOrders[0].block_number < bidOrders[0].block_number ? askOrderPriceKeys : askOrderPriceKeys.slice(1, askOrderPriceKeys.length)
    }

    return this.comparePrice(groupbyPriceBid, newBidOrderPriceKeys, groupbyPriceAsk, newAskOrderPriceKeys)
  }

  async getCurrentPrice (type: { code_hash: string, args: string, hash_type: HashType }): Promise<string> {
    const lock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: '0x'
    }

    const orderTxs = await this.getCacheCurrentPrice(lock, type)

    if (orderTxs.length === 0) { return '' }
    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(lock, type, orderTxs)

    const makerOrders = orders.filter(x => {
      const top = x.getTopOrder()
      if (!top.isCancel() && top.nextOrderCell) {
        return x
      }
    })

    if (makerOrders.length === 0) { return '' }
    const lastMakerOrders = makerOrders.filter(x => x.getLastOrder().tx.transaction.hash === makerOrders[0].getLastOrder().tx.transaction.hash)
    return lastMakerOrders.reduce(
      (total, order) => total.plus(new BigNumber(CkbUtils.parseOrderData(order.data).price)),
      new BigNumber(0)
    ).dividedBy(lastMakerOrders.length).toExponential()
  }

  private async getCacheCurrentPrice (lock: Script, type: Script): Promise<TransactionWithStatus[]> {
    const cacheKey = this.getCacheKey(lock, type, 'price')
    this.priceFactory.putKey(cacheKey, {
      type,
      lock: {
        script: lock,
        argsLen: 'any'
      },
      order: 'desc'
    })

    const txs = await this.priceFactory.get(cacheKey)
    if (!txs) {
      return []
    }
    // let txs = await this.dexCache.get(cacheKey)
    // if (!txs) {
    //   const queryOption: QueryOptions =
    //   const orderTxs = await this.repository.collectTransactions(queryOption)

    //   const value = JSON.stringify(orderTxs)
    //   this.dexCache.setEx(cacheKey, value)

    //   txs = value
    // }

    return JSON.parse(txs)
  }

  private isMakerCellValid (order: DexOrderChain): boolean {
    const FEE = BigInt(3)
    const FEE_RATIO = BigInt(1_000)

    const live = order.getLiveCell()
    try {
      if (live.data.length !== CkbUtils.getRequiredDataLength()) {
        return false
      }
      const output = live.cell
      const { price, orderAmount, sUDTAmount, isBid } = CkbUtils.parseOrderData(live.data)
      const freeCapacity = BigInt(parseInt(output.capacity, 16)) - CkbUtils.getOrderCellCapacitySize()
      const priceBigNumber = new BigNumber(price)
      if (isBid) {
        const costAmount = new BigNumber(orderAmount.toString()).multipliedBy(priceBigNumber)
        const fee = costAmount.multipliedBy(FEE.toString()).div((FEE + FEE_RATIO).toString())

        if (costAmount.plus(fee).gt(freeCapacity.toString())) {
          return false
        }
        if (costAmount.eq(0)) {
          return false
        }

        return true
      }

      if (!isBid) {
        const costAmount = new BigNumber(orderAmount.toString())
        const fee = costAmount.multipliedBy(FEE.toString()).div((FEE + FEE_RATIO).toString())
        const receive = new BigNumber(sUDTAmount.toString()).multipliedBy(priceBigNumber)
        if (costAmount.plus(fee).gt(receive)) {
          return false
        }
        if (new BigNumber(orderAmount.toString()).div(priceBigNumber).eq(0)) {
          return false
        }
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  private filterPlaceOrders (order: DexOrderChain, decimal: string): boolean {
    const placeOrder = order.getTopOrder()
    const data = CkbUtils.parseOrderData(placeOrder.data)
    const price = new BigNumber(data.price).times(new BigNumber(10).pow(parseInt(decimal) - 8)).toString()
    const precision = price.lastIndexOf('.') !== -1 ? price.slice(price.lastIndexOf('.') + 1, price.length).length : 0
    if (order.isBid()) {
      if (new BigNumber(placeOrder.cell.capacity).lt(100000000)) {
        return false
      }
      const receive = new BigNumber(data.orderAmount.toString()).div(new BigNumber(10).pow(parseInt(decimal) - 8))
      // CKB => ETH
      if (placeOrder.cell.type.args === '0x8462b20277bcbaa30d821790b852fb322d55c2b12e750ea91ad7059bc98dda4b') {
        if (receive.lt(new BigNumber(0.0001))) {
          return false
        }

        if (precision > 2) {
          return false
        }

        // CKB => UDT
      } else {
        if (receive.lt(new BigNumber(0.001))) {
          return false
        }

        if (precision > 4) {
          return false
        }
      }
    } else {
      if (new BigNumber(data.orderAmount.toString()).lt(100000000)) {
        return false
      }

      const pay = new BigNumber(data.sUDTAmount.toString()).div(new BigNumber(10).pow(parseInt(decimal)))
      // ETH => CKB
      if (placeOrder.cell.type.args === '0x8462b20277bcbaa30d821790b852fb322d55c2b12e750ea91ad7059bc98dda4b') {
        if (pay.lt(new BigNumber(0.0001))) {
          return false
        }

        if (precision > 2) {
          return false
        }

        // UDT => CKB
      } else {
        if (pay.lt(new BigNumber(0.001))) {
          return false
        }
      }

      if (precision > 4) {
        return false
      }
    }

    return true
  }

  private groupbyPrice (dexOrders: Cell[], decimal: string): Map<string, Cell[]> {
    const groupbyPrice: Map<string, Cell[]> = new Map()
    for (let i = 0; i < dexOrders.length; i++) {
      const dexOrder = dexOrders[i]
      const data = CkbUtils.parseOrderData(dexOrder.data)
      const price = new BigNumber(data.price).times(new BigNumber(10).pow(parseInt(decimal) - 8))
      const key = CkbUtils.roundHalfUp(price.toString())
      let priceArr = groupbyPrice.get(key)
      if (!priceArr) {
        priceArr = []
        groupbyPrice.set(key, priceArr)
      }

      priceArr.push(dexOrder)
    }

    return groupbyPrice
  }

  private buildOrders (bidOrderPriceKeys: string[], groupbyPriceBid: Map<string, Cell[]>) {
    return bidOrderPriceKeys
      .slice(0, bidOrderPriceKeys.length > CkbUtils.getOrdersLimit() ? CkbUtils.getOrdersLimit() : bidOrderPriceKeys.length).map(x => {
        let order_amount = BigInt(0)
        const group = groupbyPriceBid.get(x)
        group.forEach(x => {
          const data = CkbUtils.parseOrderData(x.data)
          order_amount += BigInt(data.orderAmount)
        })

        return {
          receive: order_amount.toString(),
          price: CkbUtils.parseOrderData(group[0].data).price.toString()
        }
      })
  }

  private async getOrderCells (type_code_hash: string, type_hash_type: string, type_args: string, decimal: string) {
    const lock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: '0x'
    }

    const type: Script = {
      code_hash: type_code_hash,
      hash_type: <HashType>type_hash_type,
      args: type_args
    }

    const orderTxs = await this.getCacheOrders(lock, type)

    if (orderTxs.length === 0) {
      return []
    }
    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(lock, type, orderTxs)

    const orderCells = orders
      .filter(x => x.getLiveCell() != null &&
        this.isMakerCellValid(x) &&
        this.filterPlaceOrders(x, decimal))
      .map(x => this.toCell(x))
      .filter(o => o.data.length === CkbUtils.getRequiredDataLength())
      .filter(x => CkbUtils.parseOrderData(x.data).orderAmount.toString() !== '0')

    return orderCells
  }

  private async getCacheOrders (lock: Script, type: Script): Promise<TransactionWithStatus[]> {
    const cacheKey = this.getCacheKey(lock, type, 'orders')

    this.orderFactory.putKey(cacheKey, {
      type: type,
      lock: {
        script: lock,
        argsLen: 'any'
      }
    })
    const txs = await this.orderFactory.get(cacheKey)

    // let txs = await this.dexCache.get(cacheKey)
    // if (!txs) {
    //   const orderTxs = await this.repository.collectTransactions({
    //     type: type,
    //     lock: {
    //       script: lock,
    //       argsLen: 'any'
    //     }
    //   })

    //   const value = JSON.stringify(orderTxs)
    //   this.dexCache.setEx(cacheKey, value)

    //   txs = value
    // }

    if (!txs) {
      return []
    }

    const orderTxs = JSON.parse(txs)
    return orderTxs
  }

  private getCacheKey (lock: Script, type: Script, service: string) {
    const lockScript: CKBComponents.Script = {
      args: lock.args,
      codeHash: lock.code_hash,
      hashType: lock.hash_type
    }

    const typeScript: CKBComponents.Script = {
      args: type.args,
      codeHash: type.code_hash,
      hashType: type.hash_type
    }

    const lockHash = ckbUtils.scriptToHash(lockScript)
    const typeHash = ckbUtils.scriptToHash(typeScript)

    return `${lockHash}:${typeHash}:${service}`
  }

  private toCell (x: DexOrderChain): Cell {
    const c = x.getLiveCell()
    const cell: Cell = {
      cell_output: {
        lock: c.cell.lock,
        type: c.cell.type,
        capacity: c.cell.capacity
      },
      data: c.data,
      out_point: {
        tx_hash: c.tx.transaction.hash,
        index: c.index.toString()
      },
      block_hash: x.tx.tx_status.block_hash
    }
    return cell
  }
}
