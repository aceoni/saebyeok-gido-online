import { HALL, PEWS, STAGE } from '../config'

// 공간 배치 정보. 렌더링(모델)과 이동/충돌/상호작용 로직이 같은 값을 공유한다.

export type PewSlot = {
  id: string
  x: number // 장의자 중심
  z: number
  side: 'left' | 'right'
  row: number
}

export const pewSlots: PewSlot[] = Array.from({ length: PEWS.rows }, (_, row) => {
  const z = PEWS.firstZ + row * PEWS.spacing
  const cx = PEWS.aisleHalf + PEWS.length / 2
  return [
    { id: `L${row}`, x: -cx, z, side: 'left' as const, row },
    { id: `R${row}`, x: cx, z, side: 'right' as const, row },
  ]
}).flat()

export const pillarZs = [-13, -7, -1, 5, 11]
export const pillarX = HALL.width / 2 - 0.35

export const PULPIT_POS: [number, number, number] = [0, STAGE.height, -12.6]

// 피아노: 단상 바로 앞 오른쪽 바닥. 연주자가 앉으면 강대상을 바라보도록 회전.
// (Piano 모델 로컬 좌표: 건반 = +z, 꼬리 = -z → 연주자는 -z 를 바라봄)
export const PIANO_POS: [number, number, number] = [4.4, 0, -7.4]
export const PIANO_ROT_Y = Math.atan2(PIANO_POS[0] - PULPIT_POS[0], PIANO_POS[2] - PULPIT_POS[2])

// 정면 좌/우 스크린 2개 (가운데는 강대상만 남김)
export const SCREENS = [
  { pos: [-6.3, 4.9, HALL.frontZ + 0.12] as const, w: 4.8, h: 2.7 },
  { pos: [6.3, 4.9, HALL.frontZ + 0.12] as const, w: 4.8, h: 2.7 },
]

export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, 2.3, z] as [number, number, number],
  [HALL.width / 2 - 0.25, 2.3, z] as [number, number, number],
])
