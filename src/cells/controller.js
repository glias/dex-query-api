const indexer = require('../indexer');
const formatter = require('../commons/formatter');

class Controller {
  async getLiveCells(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
    } = req.query;
    const queryOptions = {};

    if (!isValidScript(lock_code_hash, lock_hash_type, lock_args) && !isValidScript(type_code_hash, type_hash_type, type_args)) {
      return res.status(400).json({ error: 'requires either lock or type script specified as parameters' });
    }

    if (isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      queryOptions.lock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
    }

    if (isValidScript(type_code_hash, type_hash_type, type_args)) {
      queryOptions.type = {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      };
    }

    try {
      const cells = await indexer.collectCells(queryOptions);
      res.status(200).json(cells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async getLiveCellsForAmount(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
      ckb_amount,
      sudt_amount,
    } = req.query;

    if (ckb_amount && sudt_amount) {
      return res.status(400).json({ error: 'only support query either with ckb_amount or sudt_amount' });
    }

    if (!ckb_amount && !sudt_amount) {
      return res.status(400).json({ error: 'requires either ckb_amount or sudt_amount' });
    }

    if (ckb_amount && !isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      return res.status(400).json({ error: 'invalid lock script' });
    }

    if (sudt_amount && (!isValidScript(lock_code_hash, lock_hash_type, lock_args) || !isValidScript(type_code_hash, type_hash_type, type_args))) {
      return res.status(400).json({ error: 'invalid lock script or type script' });
    }

    const queryOptions = { type: 'empty' };

    if (isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      queryOptions.lock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
    }

    if (isValidScript(type_code_hash, type_hash_type, type_args)) {
      queryOptions.type = {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      };
    }

    try {
      let cells = await indexer.collectCells(queryOptions);

      if (ckb_amount) {
        cells = collectCellsByCKBAmount(cells, ckb_amount);
      }
      if (sudt_amount) {
        cells = collectCellsBySudtAmount(cells, sudt_amount);
      }

      if (!cells.length) {
        return res.status(404).json({ error: 'could not find cells fulfilling the amount query' });
      }
      res.status(200).json(cells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async postLiveCellsForAmount(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
      ckb_amount,
      sudt_amount,
      spent_cells,
    } = req.body;

    if (ckb_amount && sudt_amount) {
      return res.status(400).json({ error: 'only support query either with ckb_amount or sudt_amount' });
    }

    if (!ckb_amount && !sudt_amount) {
      return res.status(400).json({ error: 'requires either ckb_amount or sudt_amount' });
    }

    if (ckb_amount && !isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      return res.status(400).json({ error: 'invalid lock script' });
    }

    if (sudt_amount && (!isValidScript(lock_code_hash, lock_hash_type, lock_args) || !isValidScript(type_code_hash, type_hash_type, type_args))) {
      return res.status(400).json({ error: 'invalid lock script or type script' });
    }

    const queryOptions = { type: 'empty' };

    if (isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      queryOptions.lock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
    }

    if (isValidScript(type_code_hash, type_hash_type, type_args)) {
      queryOptions.type = {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      };
    }

    try {
      let cells = await indexer.collectCells(queryOptions);

      if (ckb_amount) {
        cells = collectCellsByCKBAmount(cells, ckb_amount, spent_cells);
      }
      if (sudt_amount) {
        cells = collectCellsBySudtAmount(cells, sudt_amount, spent_cells);
      }

      if (!cells.length) {
        return res.status(404).json({ error: 'could not find cells fulfilling the amount query' });
      }
      res.status(200).json(cells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}

const isSameCell = (cell, spentCell) => {
  const outPoint = cell.out_point;
  return outPoint.index === spentCell.index && outPoint.tx_hash === spentCell.tx_hash;
};

const collectCellsBySudtAmount = (cells, amount, spentCells) => {
  cells.sort((a, b) => {
    const aSudtAmount = formatter.readBigUInt128LE(a.data);
    const bSudtAmount = formatter.readBigUInt128LE(b.data);

    // eslint-disable-next-line no-nested-ternary
    return (aSudtAmount < bSudtAmount) ? -1 : ((aSudtAmount > bSudtAmount) ? 1 : 0);
  });

  const collectedCells = [];
  let summedAmount = BigInt(0);
  for (const cell of cells) {
    if (Array.isArray(spentCells) && spentCells.some((spentCell) => isSameCell(cell, spentCell))) {
      continue;
    }

    summedAmount += formatter.readBigUInt128LE(cell.data);
    collectedCells.push(cell);

    if (summedAmount > BigInt(amount)) {
      break;
    }
  }

  if (summedAmount < amount) {
    return [];
  }

  return collectedCells;
};

const collectCellsByCKBAmount = (cells, amount, spentCells) => {
  const filtered = cells.filter((cell) => cell.data === '0x');

  filtered.sort((a, b) => {
    const aAmount = BigInt(a.cell_output.capacity);
    const bAmount = BigInt(b.cell_output.capacity);

    // eslint-disable-next-line no-nested-ternary
    return (aAmount < bAmount) ? -1 : ((aAmount > bAmount) ? 1 : 0);
  });

  const collectedCells = [];
  let summedAmount = BigInt(0);
  for (const cell of filtered) {
    if (Array.isArray(spentCells) && spentCells.some((spentCell) => isSameCell(cell, spentCell))) {
      continue;
    }

    summedAmount += BigInt(cell.cell_output.capacity);
    collectedCells.push(cell);

    if (summedAmount > BigInt(amount)) {
      break;
    }
  }

  if (summedAmount < amount) {
    return [];
  }

  return collectedCells;
};

const isValidScript = (codeHash, hashType, args) => (codeHash && hashType && args);

module.exports = new Controller();
