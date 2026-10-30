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

// 키보드(디지털 피아노): 단상 바로 앞 바닥, 회중석 기준 오른쪽.
// 연주자는 강대상(정면, -z)을 바라봄. 모델 로컬 좌표: 건반 = +z 쪽.
export const PIANO_POS: [number, number, number] = [5.2, 0, -9.35]

// 강단 소품
export const DRUM_POS: [number, number, number] = [7.8, STAGE.height, -13.4] // 오른쪽 스크린 아래
// 강단 의자 2개: 붙여서 왼쪽에만. 오른쪽 끝 ≈ 왼쪽 스크린 오른쪽 끝(x = -4.3)
const CHAIR_W = 0.77
export const STAGE_CHAIRS: [number, number, number][] = [
  [-4.3 - CHAIR_W / 2, STAGE.height, -13.8],
  [-4.3 - CHAIR_W * 1.5, STAGE.height, -13.8],
]

// 키보드 오른쪽: 기타/베이스 거치대 + 연주자 스툴
export const GUITARS: { pos: [number, number, number]; kind: 'acoustic' | 'electric' | 'bass'; color: string }[] = [
  { pos: [6.5, 0, -9.7], kind: 'acoustic', color: '#c8955a' },
  { pos: [7.1, 0, -9.7], kind: 'electric', color: '#e9e4da' },
  { pos: [7.75, 0, -9.7], kind: 'bass', color: '#2b2b30' },
]
export const STOOLS: [number, number, number][] = [
  [6.6, 0, -8.6],
  [7.6, 0, -8.6],
]
export const MONITORS: [number, number, number][] = [
  [-3.4, STAGE.height, -11.0],
  [3.4, STAGE.height, -11.0],
]
export const FLOWERS: [number, number, number][] = [
  [-9.3, STAGE.height, -15.0],
  [9.3, STAGE.height, -15.0],
]

// 정면 좌/우 대형 스크린 2개 (가운데는 강대상만 남김)
export const SCREENS = [
  { pos: [-7.6, 7.4, HALL.frontZ + 0.12] as const, w: 6.6, h: 3.7 },
  { pos: [7.6, 7.4, HALL.frontZ + 0.12] as const, w: 6.6, h: 3.7 },
]

// 천장에 매단 라인 어레이 스피커 (x, z, 박스 개수) — 양 사이드로
export const SPEAKER_ARRAYS: [number, number, number][] = [
  [-9.6, -12.5, 9],
  [9.6, -12.5, 9],
  [-9.4, 1, 6],
  [9.4, 1, 6],
]

// 벽등: 천장:바닥 = 1:5 지점 (천장에서 1/6 아래)
const LAMP_Y = (HALL.height * 5) / 6
export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, LAMP_Y, z] as [number, number, number],
  [HALL.width / 2 - 0.25, LAMP_Y, z] as [number, number, number],
])
