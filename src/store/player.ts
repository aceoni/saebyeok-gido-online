import { create } from 'zustand'
import { PLAYER } from '../config'

export type Pose = 'idle' | 'walking' | 'sitting' | 'praying' | 'playing'
export type Level = 1 | 2

/** 앉은 자리: 앉았을 때 기준점과 바라보는 방향, 일어날 때 설 자리 */
export type Seat = {
  id: string
  position: [number, number, number]
  rotY: number
  standAt: [number, number, number]
  table?: { position: [number, number, number]; rotY: number } // 앞 테이블(성경이 놓이는 곳). 일반 의자는 없음
}

// 플레이어 상태: 렌더링과 분리. 추후 멀티플레이어에서는 이 값(층·위치·방향·자세)만 서버로 동기화한다.
// 위치/방향은 매 프레임 바뀌므로 컴포넌트에서 훅으로 구독하지 말고 useFrame 안에서 getState()로 읽는다.
// (pose, level 처럼 가끔 바뀌는 값은 UI 에서 선택자로 구독해도 됨)
type PlayerState = {
  level: Level
  position: [number, number, number]
  rotY: number // 바라보는 방향: 앞 = (sin rotY, cos rotY)
  pose: Pose
  path: [number, number][] // 클릭 이동 경로 (x, z 웨이포인트)
  seat: Seat | null
  setPath: (path: [number, number][]) => void
  sit: (seat: Seat) => void
  standUp: () => void
  startPrayer: () => void
  endPrayer: () => void
  moveToLevel: (level: Level, position: [number, number, number], rotY: number) => void
}

export const usePlayer = create<PlayerState>((set, get) => ({
  level: 1,
  position: [...PLAYER.spawn],
  rotY: PLAYER.spawnRotY,
  pose: 'idle',
  path: [],
  seat: null,
  setPath: (path) => set({ path }),
  sit: (seat) => set({ seat, pose: 'sitting', path: [], position: [...seat.position], rotY: seat.rotY }),
  standUp: () => {
    const { seat } = get()
    if (!seat) return
    set({ seat: null, pose: 'idle', position: [...seat.standAt] })
  },
  startPrayer: () => {
    if (get().pose === 'sitting') set({ pose: 'praying' })
  },
  endPrayer: () => {
    if (get().pose === 'praying') set({ pose: 'sitting' })
  },
  moveToLevel: (level, position, rotY) => set({ level, position: [...position], rotY, path: [], pose: 'idle', seat: null }),
}))
