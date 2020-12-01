import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { Cell, HashType, QueryOptions } from "@ckb-lumos/base";
import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import { CkbUtils } from "../../component";
import CellsAmountRequestModel from "./cells_amount_request_model";
import { IndexerService } from '../indexer/indexer_service';
import { OutPoint } from '../orders/orders_history_model';

@injectable()
export default class CellsSerive {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {}

  async getLiveCells(reqParam: CellsAmountRequestModel): Promise<Array<Cell>> {
    const queryOptions = this.buildQueryParams(reqParam);

    const cells = await this.indexer.collectCells(queryOptions);
    return cells;
  }

  async getLiveCellsForAmount(
    reqParam: CellsAmountRequestModel
  ): Promise<Array<Cell>> {
    const queryOptions = this.buildQueryParams(reqParam);

    let cells = await this.indexer.collectCells(queryOptions);

    if (reqParam.ckb_amount) {
      const ckb = BigInt(reqParam.ckb_amount);
      cells = this.collectCellsByCKBAmount(cells, ckb, reqParam.spent_cells);
    }
    if (reqParam.sudt_amount) {
      const sudt = BigInt(reqParam.sudt_amount);
      cells = this.collectCellsBySudtAmount(cells, sudt, reqParam.spent_cells);
    }

    if (!cells.length) {
      return [];
    }

    return cells;
  }

  private buildQueryParams(reqParam: CellsAmountRequestModel): QueryOptions {
    const queryOptions: QueryOptions = {};
    queryOptions.type = "empty";

    if (
      reqParam.lock_code_hash &&
      reqParam.lock_hash_type &&
      reqParam.lock_args
    ) {
      queryOptions.lock = {
        code_hash: reqParam.lock_code_hash,
        hash_type: <HashType>reqParam.lock_hash_type,
        args: reqParam.lock_args,
      };
    }

    if (
      reqParam.type_code_hash &&
      reqParam.type_hash_type &&
      reqParam.type_args
    ) {
      queryOptions.type = {
        code_hash: reqParam.type_code_hash,
        hash_type: <HashType>reqParam.type_hash_type,
        args: reqParam.type_args,
      };
    }

    return queryOptions;
  }

  private collectCellsBySudtAmount(cells: Cell[], amount: bigint, spentCells: Array<OutPoint>) {    
    
    cells.sort((a, b) => {      
      const aSudtAmount = CkbUtils.readBigUInt128LE(a.data);
      const bSudtAmount = CkbUtils.readBigUInt128LE(b.data);

      // eslint-disable-next-line no-nested-ternary
      return aSudtAmount < bSudtAmount ? -1 : aSudtAmount > bSudtAmount ? 1 : 0;
    });

    const collectedCells = [];
    let summedAmount = BigInt(0);
    for (const cell of cells) {
      if (Array.isArray(spentCells) && spentCells.some((spentCell) => this.isSameCell(cell, spentCell))) {
        continue;
      }

      if (cell.data.length !== 34 || !cell.data.startsWith("0x")) {
        continue;
      }
      summedAmount += CkbUtils.readBigUInt128LE(cell.data);
      collectedCells.push(cell);

      if (summedAmount > BigInt(amount)) {
        break;
      }
    }

    if (summedAmount < amount) {
      return [];
    }

    return collectedCells;
  }

  private collectCellsByCKBAmount(cells: Cell[], amount: bigint, spentCells: Array<OutPoint>) {
    const filtered = cells.filter((cell) => cell.data === "0x");

    filtered.sort((a, b) => {
      const aAmount = BigInt(a.cell_output.capacity);
      const bAmount = BigInt(b.cell_output.capacity);

      // eslint-disable-next-line no-nested-ternary
      return aAmount < bAmount ? -1 : aAmount > bAmount ? 1 : 0;
    });

    const collectedCells = [];
    let summedAmount = BigInt(0);
    for (const cell of filtered) {
      if (
        Array.isArray(spentCells) &&
        spentCells.some((spentCell) => this.isSameCell(cell, spentCell))
      ) {
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
  }

  private isSameCell(cell: Cell, spentCell): boolean {
    const outPoint = cell.out_point;
    return (
      outPoint.index === spentCell.index &&
      outPoint.tx_hash === spentCell.tx_hash
    );
  }

}
