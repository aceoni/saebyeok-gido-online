import { create } from 'zustand'
import type { Avatar } from '../data/avatars'
import type { Level, Pose } from './player'

// 같은 기도실에 있는 다른 사람들. 네트워크로 받은 값만 담는다 (렌더링은 RemotePlayers 가 보간해서 그림).
export type NetState = {
  p: [number, number, number] // 위치
  r: number // 바라보는 방향
  pose: Pose
  level: Level
  seat: string | null // 앉은 자리 id (자리 겹침 방지)
}

export type RemotePlayer = {
  id: string
  name: string
  avatarId: Avatar['id']
  state: NetState | null // 아직 위치를 못 받았으면 null
  updatedAt: number
}

export type Bubble = { text: string; until: number }

export type NetStatus = 'solo' | 'connecting' | 'online' | 'error'

type RemoteStore = {
  status: NetStatus
  players: Record<string, RemotePlayer>
  bubbles: Record<string, Bubble> // id → 소리내어 기도한 내용 (내 것 포함)
}

export const useRemote = create<RemoteStore>(() => ({
  status: 'solo',
  players: {},
  bubbles: {},
}))

/** 다른 사람이 앉아 있는 자리 id 들 */
export function occupiedSeats(): Set<string> {
  const s = new Set<string>()
  for (const p of Object.values(useRemote.getState().players)) if (p.state?.seat) s.add(p.state.seat)
  return s
}
