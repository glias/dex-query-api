import { Cell, HexString } from "@ckb-lumos/base";

export interface DexOrderData {
  sudt_amount: bigint;
  order_amount: bigint;
  price: bigint;
  is_bid: boolean;
}

export interface DexOrderCellFormat {
  sudt_amount: string;
  order_amount: string;
  price: string;
  is_bid: boolean;
  raw_data: Cell;
}

export class CkbUtils {
  static parseOrderData(hex: HexString): DexOrderData {
    const sudt_amount = this.parseAmountFromLeHex(hex.slice(0, 34));
    const order_amount = this.parseAmountFromLeHex(hex.slice(34, 66));

    let price: bigint;
    try {
      const priceBuf: Buffer = Buffer.from(hex.slice(66, 82), "hex");
      price = priceBuf.readBigInt64LE();
    } catch (error) {
      price = null;
    }

    const is_bid = hex.slice(82, 84) === "00";

    const orderData: DexOrderData = {
      sudt_amount,
      order_amount,
      price,
      is_bid,
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
        sudt_amount: parsedOrderData.sudt_amount.toString(),
        order_amount: parsedOrderData.order_amount.toString(),
        price: parsedOrderData.price.toString(),
        is_bid: parsedOrderData.is_bid,
        raw_data: orderCell,
      };

      return result;
    });
    return formattedOrderCells;
  }

  static formatBigUInt128LE(u128) {
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

  static formatOrderData(currentAmount, orderAmount, price, isBid) {
    const udtAmountHex = this.formatBigUInt128LE(currentAmount);
    if (isBid === undefined) {
      return udtAmountHex;
    }

    const orderAmountHex = this.formatBigUInt128LE(orderAmount).replace(
      "0x",
      ""
    );

    const priceBuf = Buffer.alloc(8);
    priceBuf.writeBigUInt64LE(price);
    const priceHex = `${priceBuf.toString("hex")}`;

    const bidOrAskBuf = Buffer.alloc(1);
    bidOrAskBuf.writeInt8(isBid ? 0 : 1);
    const isBidHex = `${bidOrAskBuf.toString("hex")}`;

    const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
    return dataHex;
  }
}
