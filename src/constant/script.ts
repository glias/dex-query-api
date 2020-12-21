import { CellDep, DepType, OutPoint, Script, HashType } from '@lay2/pw-core'

export const SUDT_DEP = new CellDep(DepType.code, new OutPoint(process.env.SUDT_DEP_OUT_POINT, '0x0'))

export const SUDT_TYPE_SCRIPT = new Script(
  process.env.SUDT_TYPE_HASH,
  process.env.SUDT_TYPE_ARGS,
  (process.env.SUDT_TYPE_HASH_TYPE as HashType) || HashType.type,
)
