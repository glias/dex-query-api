import { HashType, Hash } from "@ckb-lumos/base";
import dotenv from "dotenv";
dotenv.config();

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH || "./indexer_data",
  nodeUrl: process.env.CKB_NODE_RPC_URL || "http://localhost:8114",
};

interface Contracts {
  orderLock: Script & { version: number };
  sudtType: Script;
}

interface Script {
  codeHash: Hash;
  hashType: HashType;
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || "0x279bee9fa98959029766c0e0ce19cd91b7180fd15b600a9e95140149b524c53b",
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || "type"),
    version: 1,
  },
  sudtType: {
    codeHash: process.env.SUDT_TYPE_CODE_HASH,
    hashType: <HashType>(process.env.SUDT_TYPE_HASH_TYPE || "type"),
  },
};

export const env = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 7001;
