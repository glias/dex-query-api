import { inject, injectable, LazyServiceIdentifer } from "inversify";
import BigNumber from "bignumber.js";

import { modules } from "../../ioc";
import { contracts } from "../../config";
import { CkbUtils, DexOrderCellFormat, DexOrderData } from "../../component";
import BestPriceModel from "./best_price_model";
import { HashType } from '@ckb-lumos/base';
import { DexRepository } from '../repository/dex_repository';
import CkbRepository from '../repository/ckb_repository';

@injectable()
export default class OrdersService {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private repository: DexRepository,
  ) {}

  async getOrders(
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
  ): Promise<Array<DexOrderData>> {

    const cells = await this.repository.getPlaceOrder({
      type: {
        code_hash: type_code_hash,
        hash_type: <HashType>type_hash_type,
        args: type_args,
      },
      lock: {
        script: {
          code_hash: contracts.orderLock.codeHash,
          hash_type: contracts.orderLock.hashType,
          args: "0x",
        },
        argsLen: 'any',
      },
      order: "desc"
    });

    return cells.sort((c1, c2) => c1.block_number - c2.block_number).reverse();

  }

  async getCurrentPrice(type: { code_hash: string, args: string, hash_type: HashType }): Promise<string> {
    const orders = await this.repository.getLastMatchOrders(type);
    if (!orders) {
      return '';
    }
    const bid_price = new BigNumber(orders.bid_orders.sort((o1, o2) => Number(o1.price - o2.price))[0].price.toString());
    const ask_price = new BigNumber(orders.ask_orders.sort((o1, o2) => Number(o2.price - o1.price))[0].price.toString());
    return (bid_price.plus(ask_price)).dividedBy(2).toString();
  }

  async getBestPrice(
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    is_bid: boolean
  ): Promise<BestPriceModel> {
    const orderCells = await this.repository.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: <HashType>type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: "0x",
      },
      argsLen: "any",
    });

    if (!orderCells.length) {
      throw { error: "cells is null" };
    }

    const formattedOrderCells = CkbUtils.formatOrderCells(orderCells);

    const sortedCells = formattedOrderCells
      .filter((cell) => is_bid !== cell.isBid && cell.orderAmount !== "0")
      .filter((cell) => !this.isInvalidOrderCell(cell))
      .sort((a, b) => {
        if (is_bid) {
          return new BigNumber(a.price)
            .minus(new BigNumber(b.price))
            .toNumber();
        }
        return new BigNumber(b.price).minus(a.price).toNumber();
      });

    const result: BestPriceModel = {
      price: sortedCells[0].price,
    };

    return result;
  }

  isInvalidOrderCell(cell: DexOrderCellFormat): boolean {
    const orderCellMinCapacity = new BigNumber(17900000000);
    const capacityBN = new BigNumber(cell.rawData.cell_output.capacity);
    const sudtAmountBN = new BigNumber(cell.sUDTAmount);
    const orderAmountBN = new BigNumber(cell.orderAmount);
    const priceBN = new BigNumber(cell.price).dividedBy(
      new BigNumber(10 ** 10)
    );
    const feeRatioBN = new BigNumber(0.003);
    try {
      if (cell.rawData.cell_output.lock.args.length !== 66) {
        return true;
      }
      if (capacityBN.lt(orderCellMinCapacity)) {
        return true;
      }
      if (cell.isBid) {
        const exchangeCapacity = orderAmountBN.multipliedBy(priceBN);
        const minimumCapacity = exchangeCapacity
          .plus(exchangeCapacity.multipliedBy(feeRatioBN))
          .plus(orderCellMinCapacity);
        const invalid = capacityBN.lt(minimumCapacity);
        return invalid;
      }

      const exchangeSudtAmountBN = orderAmountBN.dividedBy(priceBN);
      const minimumSudtAmountBN = exchangeSudtAmountBN.multipliedBy(1.003);
      const invalid = sudtAmountBN.lt(minimumSudtAmountBN);
      return invalid;
    } catch (error) {
      console.error(error);
      return true;
    }
  }

}


