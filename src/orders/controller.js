const config = require('../config');
const indexer = require('../indexer');

const OrdersHistoryService = require('./orders-history');
const formatter = require('../commons/formatter');

class Controller {
  async getOrders(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      order_lock_args,
    } = req.query;
    try {
      const orderCells = await indexer.collectCells({
        type: {
          code_hash: type_code_hash,
          hash_type: type_hash_type,
          args: type_args,
        },
        lock: {
          code_hash: config.contracts.orderLock.codeHash,
          hash_type: config.contracts.orderLock.hashType,
          args: order_lock_args,
        },
      });
      const formattedOrderCells = orderCells.map((orderCell) => {
        const parsedOrderData = formatter.parseOrderData(orderCell.data);
        return {
          sudt_amount: parsedOrderData.sUDTAmount.toString(),
          order_amount: parsedOrderData.orderAmount.toString(),
          price: parsedOrderData.price.toString(),
          is_bid: parsedOrderData.isBid,
          raw_data: orderCell,
        };
      });
      res.status(200).json(formattedOrderCells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async getBestPrice(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      is_bid,
    } = req.query;

    const orderCells = await indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: config.contracts.orderLock.codeHash,
        hash_type: config.contracts.orderLock.hashType,
        args: '0x',
      },
      argsLen: 'any',
    });

    if (!orderCells.length) {
      return res.status(404).send();
    }

    try {
      const formattedOrderCells = formatter.formatOrderCells(orderCells);

      const sortedCells = formattedOrderCells
        .filter((cell) => is_bid !== cell.isBid && cell.orderAmount !== '0')
        .sort((a, b) => {
          if (is_bid) {
            return a.price - b.price;
          }
          return b.price - a.price;
        })
        .filter((cell) => !isInvalidOrderCell(cell));

      const orderCell = sortedCells[0];

      res.status(200).json({ price: orderCell.price });
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  }

  async getOrderHistory(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      order_lock_args,
    } = req.query;

    const sudtType = {
      code_hash: type_code_hash,
      hash_type: type_hash_type,
      args: type_args,
    };

    const orderLock = {
      code_hash: config.contracts.orderLock.codeHash,
      hash_type: config.contracts.orderLock.hashType,
      args: order_lock_args,
    };

    try {
      const ordersHistoryService = new OrdersHistoryService(orderLock, sudtType);
      const ordersHistory = await ordersHistoryService.calculateOrdersHistory();
      const formattedOrdersHistory = ordersHistory.map((o) => {
        const orderHistory = {
          is_bid: o.isBid,
          order_amount: o.orderAmount.toString(),
          traded_amount: o.tradedAmount.toString(),
          turnover_rate: o.turnoverRate.toString(),
          paid_amount: o.paidAmount.toString(),
          price: o.price.toString(),
          status: o.status,
          last_order_cell_outpoint: {
            tx_hash: o.lastOrderCell.outpoint.txHash,
            index: `0x${o.lastOrderCell.outpoint.index.toString(16)}`,
          },
        };
        if (o.lastOrderCell.nextTxHash) {
          orderHistory.last_order_cell_outpoint = {
            tx_hash: o.lastOrderCell.nextTxHash,
            index: '0x1',
          };
        }

        return orderHistory;
      });
      res.status(200).json(formattedOrdersHistory);
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  }
}

const isInvalidOrderCell = (cell) => {
  const orderCellMinCapacity = BigInt(17900000000);
  try {
    if (cell.rawData.cell_output.lock.args.length !== 66) {
      return true;
    }
    if (BigInt(cell.rawData.cell_output.capacity) < orderCellMinCapacity) {
      return true;
    }
    if (cell.isBid) {
      const exchangeCapacity = (BigInt(cell.orderAmount) * BigInt(cell.price)) / BigInt(10 ** 10);
      const minimumCapacity = (exchangeCapacity * BigInt(1003)) / BigInt(1000) + orderCellMinCapacity;
      const invalid = BigInt(cell.rawData.cell_output.capacity) < minimumCapacity;
      return invalid;
    }

    const exchangeSudtAmount = (BigInt(cell.orderAmount) * BigInt(10 ** 10)) / BigInt(cell.price);
    const minimumSudtAmount = (exchangeSudtAmount * BigInt(1003)) / BigInt(1000);
    const invalid = BigInt(cell.sUDTAmount) < minimumSudtAmount;
    return invalid;
  } catch (error) {
    console.error(error);
  }
};

module.exports = new Controller();
