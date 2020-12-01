import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { utils, Script, QueryOptions, Cell } from "@ckb-lumos/base";
import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import { contracts } from "../../config";
import { CkbUtils, DexLogger } from "../../component";
import BalanceCkbModel from "./balance_ckb_model";
import BalanceSudtModel from "./balance_sudt_model";
import { IndexerService } from '../indexer/indexer_service';
import CkbRequestModel from '../../model/req/ckb_request_model';

@injectable()
export default class BalanceService {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {
    this.logger = new DexLogger(BalanceService.name);
  }

  async getCKBBalance(
    reqParms: CkbRequestModel
  ): Promise<BalanceCkbModel> {
    
    const queryLock: Script = reqParms.lockScript();
    const cells = await this.indexer.collectCells({
      lock: queryLock,
    });  

    const normalCells = cells.filter(
      (cell: Cell) => cell.data === "0x" && !cell.cell_output.type);

    const balance = normalCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    const occupiedCells = cells.filter(
      (cell) => cell.data !== "0x" || cell.cell_output.type
    );

    const occupiedBalance = occupiedCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    const queryLockHash = utils.computeScriptHash(queryLock);
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash,
    };

    const orderCells = await this.indexer.collectCells({
      lock: orderLock,
    });

    // this.logger.error("orderCells" + orderCells)
    const lockedOrderBalance = orderCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    return {
      free: balance.toString(),
      occupied: occupiedBalance.toString(),
      locked_order: lockedOrderBalance.toString(),
    };
  }

  async getSUDTBalance(
    reqParms: CkbRequestModel
  ): Promise<BalanceSudtModel> {

    const queryOptions: QueryOptions = {
      lock: reqParms.lockScript(),
      type: reqParms.typeScript()
    };

    const cells = await this.indexer.collectCells(queryOptions);
    const balance = cells.reduce((total, cell) => {
      try {
        return total + CkbUtils.readBigUInt128LE(cell.data);
      } catch (error) {
        console.error(error);
        return total;
      }
    }, BigInt(0));    

    const queryLockHash = utils.computeScriptHash(<Script>queryOptions.lock);
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash,
    };

    const orderCells = await this.indexer.collectCells({
      lock: orderLock,
      type: queryOptions.type,
    });

    const lockedOrderBalance = orderCells.reduce((total, cell: Cell) => {
      try {
        return total + CkbUtils.parseOrderData(cell.data).sUDTAmount;
      } catch (error) {
        console.error(error);
        return total;
      }
    }, BigInt(0));
    
    return {
      free: balance.toString(),
      locked_order: lockedOrderBalance.toString(),
    };
  }

}
