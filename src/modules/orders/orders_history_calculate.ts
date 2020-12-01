import { Input, OutPoint, Output, Script, Transaction } from "@ckb-lumos/base";

import {
  CkbUtils,
} from "../../component";
import { IndexerService } from '../indexer/indexer_service';

export default class OrdersHistoryCalculate {

  private orderLock: Script;
  private sudtType: Script;
  private indexer: IndexerService;

  private txsByInputOutPoint: Map<string, Transaction>;
  private usedInputOutPoints: Set<string>;
  private orderCellsInputOutPoints: Set<string>;

  constructor(
    indexer: IndexerService,
    orderLock: Script,
    sudtType: Script
  ) {
    this.orderLock = orderLock;
    this.sudtType = sudtType;
    this.indexer = indexer;

    this.txsByInputOutPoint = new Map();
    this.usedInputOutPoints = new Set();
    this.orderCellsInputOutPoints = new Set();
  }

  async calculateOrdersHistory()
  : Promise<Array<OrderHistoryCalculateData>> 
  {
    const txsWithStatus = await this.indexer.collectTransactions({
      type: this.sudtType,
      lock: this.orderLock,
    });

    for (let i = 0; i < txsWithStatus.length; i++) {
      const txWithStatus = txsWithStatus[i];
      const { transaction } = txWithStatus;
      const { hash, inputs, outputs } = transaction;

      for (const input of inputs) {
        const { tx_hash, index } = input.previous_output;
        const inputOutPoint = this.formatInputOutPoint(
          tx_hash,
          parseInt(index, 16)
        );
        if (!this.txsByInputOutPoint.has(inputOutPoint)) {
          this.txsByInputOutPoint.set(inputOutPoint, transaction);
        }
      }
      for (let j = 0; j < outputs.length; j++) {
        const output = outputs[j];
        if (this.isOrderCell(output, this.orderLock, this.sudtType)) {
          const inputOutPoint = this.formatInputOutPoint(hash, j);
          this.orderCellsInputOutPoints.add(inputOutPoint);
        }
      }
    }

    const ordersHistory = [];
    for (const txWithStatus of txsWithStatus) {
      const { transaction } = txWithStatus;
      const { hash, outputs, outputs_data } = transaction;

      const groupedOrderCells = this.groupOrderCells(
        outputs,
        this.orderLock,
        this.sudtType
      );
      for (
        let groupedIndex = 0;
        groupedIndex < groupedOrderCells.length;
        groupedIndex++
      ) {
        const groupedOrderCell = groupedOrderCells[groupedIndex];
        const [originalIndex, output] = groupedOrderCell;

        if (!this.isOrderCell(output, this.orderLock, this.sudtType)) {
          continue;
        }

        const inputOutPoint = this.formatInputOutPoint(hash, originalIndex);
        if (this.usedInputOutPoints.has(inputOutPoint)) {
          continue;
        }

        const data = outputs_data[originalIndex];
        output.data = data;
        output.outpoint = {
          tx_hash: hash,
          index: originalIndex.toString(),
        };
        const order_cells = this.getChainedOrderCells(output);
        ordersHistory.push({
          order_cells,
          block_hash: txWithStatus.tx_status.block_hash
        });
      }
    }

    for (const orderHistory of ordersHistory) {
      const { order_cells } = orderHistory;
      const firstOrderCell = order_cells[0];
      const lastOrderCell = order_cells[order_cells.length - 1];
      const firstOrderCellData = CkbUtils.parseOrderData(firstOrderCell.data);
      const lastOrderCellData = CkbUtils.parseOrderData(lastOrderCell.data);

      const tradedAmount =
        firstOrderCellData.orderAmount - lastOrderCellData.orderAmount;
      let turnoverRate;
      try {
        turnoverRate = Number((tradedAmount * 100n) / firstOrderCellData.orderAmount) / 100;
      } catch (error) {
        console.error("zero order amount for the  first order cell");
        turnoverRate = 0;
      }

      let paidAmount;
      if (firstOrderCellData.isBid) {
        paidAmount =
          BigInt(firstOrderCell.capacity) - BigInt(lastOrderCell.capacity);
      } else {
        paidAmount =
          firstOrderCellData.sUDTAmount - lastOrderCellData.sUDTAmount;
      }

      orderHistory.paid_amount = paidAmount;
      orderHistory.traded_amount = tradedAmount;
      orderHistory.turnover_rate = turnoverRate;
      orderHistory.order_amount = firstOrderCellData.orderAmount;
      orderHistory.is_bid = firstOrderCellData.isBid;
      orderHistory.price = firstOrderCellData.price;

      const outpoint = lastOrderCell.outpoint;
      const inputOutPoint = this.formatInputOutPoint(
        outpoint.tx_hash,
        outpoint.index
      );
      const isLive = !this.txsByInputOutPoint.get(inputOutPoint);

      let status;
      if (orderHistory.turnover_rate === 1) {
        status = "completed";
        if (!isLive) {
          status = "claimed";
        }
      } else {
        status = "opening";
        if (!isLive) {
          status = "aborted";
        }
      }

      orderHistory.status = status;
      
    }
    
    return ordersHistory;
  }

  groupOrderCells(cells: Array<OrderHistoryCalculateOutputs>, orderLock: Script, sudtType: Script): Array<[number, OrderHistoryCalculateOutputs]> {
    const groupedCells = [];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (this.isOrderCell(cell, orderLock, sudtType)) {
        groupedCells.push([i, cell]);
      }
    }
    return groupedCells;
  }

  isOrderCell(cell: Output, orderLock: Script, sudtType: Script): boolean {
    const { lock, type } = cell;

    if (
      !this.equalsScript(lock, orderLock) ||
      !this.equalsScript(type, sudtType)
    ) {
      return false;
    }
    return true;
  }

  equalsScript(script1: Script, script2: Script): boolean {
    if (!script1 && script2) {
      return false;
    }

    if (script1 && !script2) {
      return false;
    }

    if (
      script1.args !== script2.args ||
      script1.code_hash !== script2.code_hash ||
      script1.hash_type !== script2.hash_type
    ) {
      return false;
    }
    return true;
  }

  determineGroupedOrderCellIndex(inputs: Array<Input>, outpoint: string): number {
    const inputOutpointList: Array<string> = [];
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const { previous_output } = input;
      const outpointStr = this.formatInputOutPoint(
        previous_output.tx_hash,
        parseInt(previous_output.index)
      );
      if (this.orderCellsInputOutPoints.has(outpointStr)) {
        inputOutpointList.push(outpointStr);
      }
    }

    return inputOutpointList.indexOf(outpoint);
  }

  getChainedOrderCells(currentOutput: OrderHistoryCalculateOutputs, prevOrderCells: Array<OrderHistoryCalculateOutputs> = []): Array<OrderHistoryCalculateOutputs> {
    const {outpoint} = currentOutput;
    const inputOutPoint = this.formatInputOutPoint(outpoint.tx_hash, parseInt(outpoint.index));
    const nextTransaction = this.txsByInputOutPoint.get(inputOutPoint);
  

    if (!this.usedInputOutPoints.has(inputOutPoint)) {
      this.usedInputOutPoints.add(inputOutPoint);
    }

    if (!nextTransaction) {
      return [...prevOrderCells, currentOutput];
    }

    const nextGroupedOrderCellIndex = this.determineGroupedOrderCellIndex(nextTransaction.inputs, inputOutPoint);

    const nextGroupedOrderCells = this.groupOrderCells(
      nextTransaction.outputs,
      this.orderLock,
      this.sudtType
    );
    const nextGroupedOrderCell =
      nextGroupedOrderCells[nextGroupedOrderCellIndex];
    const nextTxHash = nextTransaction.hash;

    currentOutput.nextTxHash = nextTxHash;

    if (!nextGroupedOrderCell) {
      return [...prevOrderCells, currentOutput];
    }

    const [nextOriginalIndex, nextOutput] = nextGroupedOrderCell;
    if (!this.isOrderCell(nextOutput, this.orderLock, this.sudtType)) {
      return [...prevOrderCells, currentOutput];
    }

    nextOutput.data = nextTransaction.outputs_data[nextOriginalIndex];

    nextOutput.outpoint = {
      tx_hash: nextTxHash,
      index: nextOriginalIndex.toString(),
    };

    return this.getChainedOrderCells(
      nextOutput,
      [...prevOrderCells, currentOutput]
    );
  }

  formatInputOutPoint(txHash: string, index: number): string {
    return `${txHash}0x${index.toString(16)}`;
  }
}

export interface OrderHistoryCalculateOutputs extends Output {
  data?: string;
  outpoint?: OutPoint;
  nextTxHash?: string;
}

export interface OrderHistoryCalculateData {
  block_hash: string;
  is_bid?: boolean;
  order_amount?: string;
  traded_amount?: string;
  turnover_rate?: string;
  paid_amount?: string;
  price?: string;
  status?: string;
  last_order_cell_outpoint?: OutPoint;
  order_cells: Array<OrderHistoryCalculateOutputs>;
}