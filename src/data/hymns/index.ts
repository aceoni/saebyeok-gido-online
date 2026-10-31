import type { Hymn } from '../../systems/hymn'
import goCarry from './go-carry-thy-burden.json'
import nearer from './nearer-my-god.json'
import jesusLoves from './jesus-loves-me.json'
import itIsWell from './it-is-well.json'
import rockOfAges from './rock-of-ages.json'
import amazingGrace from './amazing-grace.json'

/** 배경 찬양 재생 순서 */
export const HYMNS = [goCarry, nearer, jesusLoves, itIsWell, rockOfAges, amazingGrace] as Hymn[]
