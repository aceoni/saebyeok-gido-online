import type { Hymn } from '../../systems/hymn'
import goCarry from './go-carry-thy-burden.json'
import nearer from './nearer-my-god.json'
import faithfulness from './great-is-thy-faithfulness.json'
import trustingHeart from './the-trusting-heart.json'
import foundAFriend from './ive-found-a-friend.json'
import inTheGarden from './in-the-garden.json'

/** 배경 찬양 재생 순서 */
export const HYMNS = [goCarry, faithfulness, nearer, trustingHeart, foundAFriend, inTheGarden] as Hymn[]
