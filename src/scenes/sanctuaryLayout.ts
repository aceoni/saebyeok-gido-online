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
export const PIANO_POS: [number, number, number] = [-6.4, STAGE.height, -13.0]
export const MAIN_SCREEN = { pos: [0, 4.7, HALL.frontZ + 0.12] as const, w: 8, h: 4.5 }
export const SIDE_SCREENS = [
  { pos: [-HALL.width / 2 + 0.12, 4.2, -5] as const, rotY: Math.PI / 2 },
  { pos: [HALL.width / 2 - 0.12, 4.2, -5] as const, rotY: -Math.PI / 2 },
]
export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, 2.3, z] as [number, number, number],
  [HALL.width / 2 - 0.25, 2.3, z] as [number, number, number],
])
