import { HashType, Hash } from '@ckb-lumos/base'
import dotenv from 'dotenv'
dotenv.config()

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH ? process.env.INDEXER_FOLDER_PATH : './indexer_data',
  nodeUrl: process.env.CKB_NODE_RPC_URL ? process.env.CKB_NODE_RPC_URL : 'http://localhost:8114'
}

interface Contracts {
  orderLock: Script & { version: number }
}

interface Script {
  codeHash: Hash
  hashType: HashType
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || '0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48',
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || 'type'),
    version: 1
  }
}

interface ExplorerConfig {
  explorerTokensUrl: string
  explorerCorsReferrer: string
}

export const explorerConfig: ExplorerConfig = {
  explorerTokensUrl: process.env.EXPLORER_TOKENS_URL ? process.env.EXPLORER_TOKENS_URL : 'https://api.explorer.nervos.org/testnet/api/v1/udts',
  explorerCorsReferrer: process.env.EXPLORER_CORS_REFERRER ? process.env.EXPLORER_CORS_REFERRER : 'https://explorer.nervos.org/'
}

export const redisConfiguration = {
  address: process.env.REDIS_ADDRESS || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  auth: process.env.REDIS_AUTH || '123456'
}

export const env = process.env.NODE_ENV || 'development'
export const port = process.env.PORT || 7001
export const forceBridgeServerUrl = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://121.196.29.165:3003'
