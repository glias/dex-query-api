import { Hash } from '@ckb-lumos/base';
import CkbCellModel from "./ckb_cell";
import CkbTransactionCellDepsModel from "./ckb_transaction_cell_deps";
import CkbTransactionInputsModel from "./ckb_transaction_inputs";

export default interface CkbTransactionModel {
  cellDeps: Array<CkbTransactionCellDepsModel>;

  inputs: Array<CkbTransactionInputsModel>;

  outputs: Array<CkbCellModel>;

  outputsData: Array<string>;

  headerDeps: Array<Hash>;

  hash: string;

  version: string;

  witnesses: Array<string>;


}