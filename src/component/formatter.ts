import { Cell, HexString, Output } from "@ckb-lumos/base";
import BigNumber from 'bignumber.js';
import { contracts } from '../config';

export interface DexOrderData {
  sUDTAmount: bigint;
  orderAmount: bigint;
  price: bigint;
  isBid: boolean;
}

export interface DexOrderCellFormat {
  sUDTAmount: string;
  orderAmount: string;
  price: string;
  isBid: boolean;
  rawData: Cell;
}

export class CkbUtils {
  static parseOrderData(hex: HexString): DexOrderData {
    const sUDTAmount = this.parseAmountFromLeHex(hex.slice(0, 34));
    const orderAmount = this.parseAmountFromLeHex(hex.slice(34, 66));

    let price: bigint;
    try {
      price = this.parseAmountFromLeHex(hex.slice(66, 98));
      // const priceBuf: Buffer = Buffer.from(hex.slice(66, 98), "hex");
      // price = priceBuf.readBigInt64LE();
    } catch (error) {
      price = null;
    }

    const isBid = hex.slice(98, this.getRequiredDataLength()) === "00";

    const orderData: DexOrderData = {
      sUDTAmount,
      orderAmount,
      price,
      isBid,
    };

    return orderData;
  }

  static parseAmountFromLeHex(leHex: HexString): bigint {
    try {
      return this.readBigUInt128LE(
        leHex.startsWith("0x") ? leHex.slice(0, 34) : `0x${leHex.slice(0, 32)}`
      );
    } catch (error) {
      return BigInt(0);
    }
  }

  static readBigUInt128LE(leHex: HexString): bigint {
    if (leHex.length !== 34 || !leHex.startsWith("0x")) {
      throw new Error("leHex format error");
    }
    const buf = Buffer.from(leHex.slice(2), "hex");

    return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0);
  }

  static formatOrderCells(orderCells: Cell[]): Array<DexOrderCellFormat> {
    const formattedOrderCells = orderCells.map((orderCell) => {
      const parsedOrderData = this.parseOrderData(orderCell.data);

      const result: DexOrderCellFormat = {
        sUDTAmount: parsedOrderData.sUDTAmount.toString(),
        orderAmount: parsedOrderData.orderAmount.toString(),
        price: parsedOrderData.price.toString(),
        isBid: parsedOrderData.isBid,
        rawData: orderCell,
      };

      return result;
    });
    
    return formattedOrderCells;
  }

  static formatBigUInt128LE(u128: bigint): string {
    const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
    const U128_MIN = BigInt(0);

    if (u128 < U128_MIN) {
      throw new Error(`u128 ${u128} too small`);
    }
    if (u128 > U128_MAX) {
      throw new Error(`u128 ${u128} too large`);
    }
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64LE(u128 & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
    buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
    return `0x${buf.toString("hex")}`;
  }

  static formatOrderData(currentAmount: bigint, orderAmount: bigint, price: bigint, isBid: boolean): string {
    const udtAmountHex = this.formatBigUInt128LE(currentAmount);
    if (isBid === undefined) {
      return udtAmountHex;
    }

    const orderAmountHex = this.formatBigUInt128LE(orderAmount).replace(
      "0x",
      ""
    );

    const priceBuf = Buffer.alloc(16);
    priceBuf.writeBigUInt64LE(price);
    const priceHex = `${priceBuf.toString("hex")}`;

    const bidOrAskBuf = Buffer.alloc(1);
    bidOrAskBuf.writeInt8(isBid ? 0 : 1);
    const isBidHex = `${bidOrAskBuf.toString("hex")}`;

    const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
    return dataHex;
  }

  static isOrder(type: { code_hash: string, hash_type: 'data' | 'type', args: string }, output: Output): boolean {
    return output.type
      && output.lock.code_hash === contracts.orderLock.codeHash
      && output.lock.hash_type === contracts.orderLock.hashType
      && output.type.code_hash === type.code_hash
      && output.type.hash_type === type.hash_type
      && output.type.args === type.args
  }

  static roundHalfUp(price: string): string {
    return new BigNumber(price).toFormat(BigNumber.ROUND_HALF_UP);
  }

  static getRequiredDataLength(): number {
    return 100;
  } 

  static getOrderCellCapacitySize(): bigint {
    return 18700000000n
  }

  static getOrdersLimit(): number {
    return 7;
  }
}
