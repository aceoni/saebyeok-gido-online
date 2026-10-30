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

// 키보드(디지털 피아노): 단상 바로 앞, 중앙 통로 오른쪽에 강대상과 가깝게.
// 연주자는 강대상(정면, -z)을 바라봄. 모델 로컬 좌표: 건반 = +z 쪽.
export const PIANO_POS: [number, number, number] = [2.3, 0, -9.35]

// 정면 좌/우 대형 스크린 2개 (가운데는 강대상만 남김)
export const SCREENS = [
  { pos: [-7.6, 7.4, HALL.frontZ + 0.12] as const, w: 6.6, h: 3.7 },
  { pos: [7.6, 7.4, HALL.frontZ + 0.12] as const, w: 6.6, h: 3.7 },
]

// 천장 꼭대기 현수막
export const BANNER_POS: [number, number, number] = [0, HALL.height - 1.6, HALL.frontZ + 0.2]

// 천장에 매단 라인 어레이 스피커 (x, z, 박스 개수)
export const SPEAKER_ARRAYS: [number, number, number][] = [
  [-5.6, -12.5, 8],
  [5.6, -12.5, 8],
  [-7, 1, 5],
  [7, 1, 5],
]

export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, 2.3, z] as [number, number, number],
  [HALL.width / 2 - 0.25, 2.3, z] as [number, number, number],
])
