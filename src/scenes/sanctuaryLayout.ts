import { CHOIR, HALL, PEWS, STAGE } from '../config'

// 공간 배치 정보. 렌더링(모델)과 이동/충돌/상호작용 로직이 같은 값을 공유한다.

export type PewSlot = {
  id: string
  x: number // 장의자 중심
  z: number
  side: 'left' | 'right' | 'choir'
  row: number
  y?: number // 바닥 높이 (성가대 단)
  rotY?: number // 회전 (기본 0 = 단상(-z)을 바라봄)
  length?: number // 장의자 길이 (기본 PEWS.length)
}

export const pewSlots: PewSlot[] = Array.from({ length: PEWS.rows }, (_, row) => {
  const z = PEWS.firstZ + row * PEWS.spacing
  const cx = PEWS.aisleHalf + PEWS.length / 2
  return [
    { id: `L${row}`, x: -cx, z, side: 'left' as const, row },
    { id: `R${row}`, x: cx, z, side: 'right' as const, row },
  ]
}).flat()

// 성가대석 장의자: 왼쪽 벽을 등지고 중앙(+x)을 바라봄 → rotY = -90°
export const CHOIR_LENGTH = CHOIR.zTo - CHOIR.zFrom
export const choirSlots: PewSlot[] = Array.from({ length: CHOIR.rows }, (_, row) => ({
  id: `C${row}`,
  x: CHOIR.frontX - row * CHOIR.rowSpacing,
  z: (CHOIR.zFrom + CHOIR.zTo) / 2,
  side: 'choir' as const,
  row,
  y: row * CHOIR.tierHeight,
  rotY: -Math.PI / 2,
  length: CHOIR_LENGTH,
}))

// 정면 좌/우 흰 벽의 앞면 z (중앙 원목 벽보다 돌출)
export const FRONT_SIDE_Z = HALL.frontZ + HALL.frontSideDepth

export const pillarZs = [-13, -7, -1, 5, 11]
export const pillarX = HALL.width / 2 - 0.35

// 강대상 뒤 원목 벽 중앙의 나무 십자가
export const CROSS_POS: [number, number, number] = [0, 8.6, HALL.frontZ + 0.17]

export const PULPIT_POS: [number, number, number] = [0, STAGE.height, -12.6]

// 키보드(디지털 피아노): 단상 바로 앞 바닥, 회중석 기준 오른쪽.
// 연주자는 강대상(정면, -z)을 바라봄. 모델 로컬 좌표: 건반 = +z 쪽.
export const PIANO_POS: [number, number, number] = [5.2, 0, -9.35]

// 강단 소품
export const DRUM_POS: [number, number, number] = [6.2, STAGE.height, -13.0] // 오른쪽 스크린 아래
export const DRUM_SCALE = 1.4
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
// 보면대 2개: 스툴 앞, 연주자(스툴) 쪽을 바라봄
export const MUSIC_STANDS: [number, number, number][] = [
  [6.3, 0, -9.15],
  [8.1, 0, -9.15],
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
  [-7.3, STAGE.height, -14.6],
  [7.3, STAGE.height, -14.6],
]

// 정면 좌/우 대형 스크린 2개 (가운데는 강대상만 남김)
export const SCREENS = [
  { pos: [-7.6, 7.4, FRONT_SIDE_Z + 0.12] as const, w: 6.6, h: 3.7 },
  { pos: [7.6, 7.4, FRONT_SIDE_Z + 0.12] as const, w: 6.6, h: 3.7 },
]

// 천장에 매단 라인 어레이 스피커 (x, z, 박스 개수) — 양 사이드로
export const SPEAKER_ARRAYS: [number, number, number][] = [
  [-8.3, -12.5, 9],
  [8.3, -12.5, 9],
  [-8.3, 1, 6],
  [8.3, 1, 6],
]

// 벽등: 천장:바닥 1:4 지점보다 조금 아래
const LAMP_Y = HALL.height * 0.74
export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, LAMP_Y, z] as [number, number, number],
  [HALL.width / 2 - 0.25, LAMP_Y, z] as [number, number, number],
])
