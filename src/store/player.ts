import { create } from 'zustand'
import { PLAYER } from '../config'

export type Pose = 'idle' | 'walking' | 'sitting' | 'praying' | 'playing'

// 플레이어 상태: 렌더링과 분리. 추후 멀티플레이어에서는 이 값(위치·방향·자세)만 서버로 동기화한다.
// 위치/방향은 매 프레임 바뀌므로 컴포넌트에서 훅으로 구독하지 말고 useFrame 안에서 getState()로 읽는다.
type PlayerState = {
  position: [number, number, number]
  rotY: number // 바라보는 방향: 앞 = (sin rotY, cos rotY)
  pose: Pose
  path: [number, number][] // 클릭 이동 경로 (x, z 웨이포인트)
  setPath: (path: [number, number][]) => void
}

export const usePlayer = create<PlayerState>((set) => ({
  position: [...PLAYER.spawn],
  rotY: PLAYER.spawnRotY,
  pose: 'idle',
  path: [],
  setPath: (path) => set({ path }),
}))
