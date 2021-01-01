import { HashType, Hash } from "@ckb-lumos/base";
import dotenv from "dotenv";
dotenv.config();

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH || "./indexer_data",
  nodeUrl: process.env.CKB_NODE_RPC_URL || "http://localhost:8114",
};

interface Contracts {
  orderLock: Script & { version: number };
}

interface Script {
  codeHash: Hash;
  hashType: HashType;
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || "0xeecb069a62e02582a3e817dd33624462b6a57ab86addf5c8e20916ffb0d38e6d",
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || "data"),
    version: 1,
  },
};

export const env = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 7001;
