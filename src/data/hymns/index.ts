import type { Hymn } from '../../systems/hymn'
import goCarry from './go-carry-thy-burden.json'
import nearer from './nearer-my-god.json'
import faithfulness from './great-is-thy-faithfulness.json'

/** 배경 찬양 재생 순서 */
export const HYMNS = [goCarry, nearer, faithfulness] as Hymn[]
