import PWCore, { CellDep, DepType, OutPoint, Script, HashType } from '@lay2/pw-core'

export const SUDT_DEP = new CellDep(DepType.code, new OutPoint(process.env.SUDT_DEP_OUT_POINT || '0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769', '0x0'))

export const SUDT_TYPE_SCRIPT = new Script(
  process.env.SUDT_TYPE_HASH || '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
  process.env.SUDT_TYPE_ARGS || '0x',
  (process.env.SUDT_TYPE_HASH_TYPE as HashType) || HashType.type
)

export const PW_DEV_CHAIN_CONFIG = {
  daoType: {
    cellDep: new CellDep(
      DepType.code,
      new OutPoint('0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f', '0x2')
    ),
    script: new Script('0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e', '0x', HashType.type)
  },
  defaultLock: {
    cellDep: new CellDep(
      DepType.depGroup,
      new OutPoint('0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37', '0x0')
    ),
    script: new Script('0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', '0x', HashType.type)
  },
  sudtType: {
    cellDep: new CellDep(
      DepType.code,
      new OutPoint('0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958', '0x0')
    ),
    script: new Script('0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4', '0x', HashType.type)
  },
  multiSigLock: {
    cellDep: new CellDep(
      DepType.depGroup,
      new OutPoint('0x6495cede8d500e4309218ae50bbcadb8f722f24cc7572dd2274f5876cb603e4e', '0x1')
    ),
    script: new Script('0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8', '0x', HashType.type)
  },
  pwLock: {
    cellDep: new CellDep(
      DepType.code,
      new OutPoint('0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38', '0x0')
    ),
    script: new Script('0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63', '0x', HashType.type)
  },
  acpLockList: [
    new Script('0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63', '0x', HashType.type),
    new Script('0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b', '0x', HashType.type)
  ]
}

PWCore.config = PW_DEV_CHAIN_CONFIG

PWCore.config.sudtType.cellDep = SUDT_DEP
