import { BALCONY, CHOIR, HALL, PEWS, STAGE } from '../config'

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
  // 앉았을 때 앞에 있는 테이블: 앞줄 장의자 등받이 뒤 테이블 / 맨 앞줄은 따로 둔 테이블(성가대는 칸막이 위)
  table: { dist: number; y: number } // dist = 좌석 중심에서 앞쪽으로 테이블 중심까지, y = 테이블 윗면 높이
}

// 맨 앞줄 앞에 따로 두는 테이블(앞판 + 테이블). 장의자처럼 rotY 기본 0 = 앉는 사람이 -z 를 바라봄
export type FrontDesk = { x: number; z: number; y: number; rotY: number; length: number }
const DESK_SHELF = 0.11 // 앞판에서 테이블 중심까지
const tableDist = (spacing: number) => spacing - PEWS.shelfBack

const PEW_CX = PEWS.aisleHalf + PEWS.length / 2
const T1 = tableDist(PEWS.spacing)
export const pewSlots: PewSlot[] = Array.from({ length: PEWS.rows }, (_, row) => {
  const z = PEWS.firstZ + row * PEWS.spacing
  const table = { dist: T1, y: PEWS.shelfY }
  // 앞 몇 줄은 비움 (왼쪽: 그랜드피아노·관현악, 오른쪽: 키보드·밴드)
  const out: PewSlot[] = []
  if (row >= PEWS.frontSkipRows) out.push({ id: `L${row}`, x: -PEW_CX, z, side: 'left', row, table })
  if (row >= PEWS.frontSkipRowsRight) out.push({ id: `R${row}`, x: PEW_CX, z, side: 'right', row, table })
  return out
}).flat()

// 2층 맨 앞줄 테이블은 난간과 겹치지 않게 조금 가깝게
const BALCONY_FRONT_T = 0.85

// 2층(발코니) 장의자: 1층과 같은 좌우 배치, 뒤로 갈수록 한 단씩 높아짐
export const balconySlots: PewSlot[] = Array.from({ length: BALCONY.rows }, (_, row) => {
  const z = BALCONY.firstRowZ + row * BALCONY.rowSpacing
  const y = BALCONY.floorY + row * BALCONY.tierHeight
  // 앞줄은 한 단 낮으므로 그 줄 등받이 테이블도 그만큼 낮음
  const table =
    row === 0
      ? { dist: BALCONY_FRONT_T, y: y + PEWS.shelfY }
      : { dist: tableDist(BALCONY.rowSpacing), y: y - BALCONY.tierHeight + PEWS.shelfY }
  return [
    { id: `BL${row}`, x: -PEW_CX, z, y, side: 'left' as const, row, table },
    { id: `BR${row}`, x: PEW_CX, z, y, side: 'right' as const, row, table },
  ]
}).flat()

// 발코니 단 경계: 각 줄의 단은 바로 앞줄 등받이 뒤에서 시작 → 앞 다리 공간이 그 줄과 같은 높이
export const balconyTierEdge = (row: number) => BALCONY.firstRowZ + (row - 1) * BALCONY.rowSpacing + 0.35
const AISLE_RAMP = 0.5 // 가운데 통로: 단 경계 앞 0.5m 에 반 칸 계단
/** 발코니 바닥 높이 (가운데 통로는 반 칸씩 계단) */
export function balconyFloorHeight(x: number, z: number): number {
  let y = BALCONY.floorY
  for (let r = 1; r < BALCONY.rows; r++) {
    const e = balconyTierEdge(r)
    if (Math.abs(x) < BALCONY.aisleHalf) {
      if (z >= e) y += BALCONY.tierHeight
      else if (z >= e - AISLE_RAMP) y += BALCONY.tierHeight / 2
    } else if (z >= e) y += BALCONY.tierHeight
  }
  return y
}
export const BALCONY_AISLE_RAMP = AISLE_RAMP
export const BALCONY_BACK_Y = BALCONY.floorY + (BALCONY.rows - 1) * BALCONY.tierHeight // 맨 뒤 통로 높이

// 1층 ↔ 2층 오가기 (계단 대신 문)
// 도착 지점은 문에서 조금 앞쪽 가운데 통로 (뒤따르는 카메라가 벽에 붙지 않게)
const UP_ARRIVE_Z = 11.0
export const DOOR_LINKS = {
  down: { pos: [0, 0, 13.1] as [number, number, number], to: [0, balconyFloorHeight(0, UP_ARRIVE_Z), UP_ARRIVE_Z] as [number, number, number] },
  up: { pos: [0, BALCONY_BACK_Y, 13.5] as [number, number, number], to: [0, 0, 11.2] as [number, number, number] },
}

// 성가대석 장의자: 왼쪽 벽을 등지고 중앙(+x)을 바라봄 → rotY = -90°
// 장의자는 정면 벽 쪽 통로만큼 짧게
const CHOIR_PEW_Z0 = CHOIR.zFrom + CHOIR.frontAisle
export const CHOIR_LENGTH = CHOIR.zTo - CHOIR_PEW_Z0
export const CHOIR_PARTITION_GAP = 0.55 // 맨 앞줄 중심 → 칸막이
export const CHOIR_PARTITION_TOP = 0.76 // 칸막이 윗면 (단상 기준)
export const choirSlots: PewSlot[] = Array.from({ length: CHOIR.rows }, (_, row) => ({
  id: `C${row}`,
  x: CHOIR.frontX - row * CHOIR.rowSpacing,
  z: (CHOIR_PEW_Z0 + CHOIR.zTo) / 2,
  side: 'choir' as const,
  row,
  y: STAGE.height + row * CHOIR.tierHeight,
  rotY: -Math.PI / 2,
  length: CHOIR_LENGTH,
  // 맨 앞줄은 단상 쪽 낮은 칸막이 윗면을 테이블로
  table:
    row === 0
      ? { dist: CHOIR_PARTITION_GAP, y: STAGE.height + CHOIR_PARTITION_TOP }
      : { dist: tableDist(CHOIR.rowSpacing), y: STAGE.height + (row - 1) * CHOIR.tierHeight + PEWS.shelfY },
}))

// 맨 앞줄 앞 테이블: 1층 좌/우 맨 앞줄, 2층 좌/우 맨 앞줄
const firstRow = (slots: PewSlot[]) => slots.filter((s) => s.row === Math.min(...slots.map((t) => t.row)))
export const frontDesks: FrontDesk[] = [
  ...firstRow(pewSlots.filter((s) => s.side === 'left')),
  ...firstRow(pewSlots.filter((s) => s.side === 'right')),
  ...balconySlots.filter((s) => s.row === 0),
].map((s) => ({ x: s.x, z: s.z - s.table.dist - DESK_SHELF, y: s.y ?? 0, rotY: 0, length: PEWS.length }))

// 지휘자 자리: 성가대 앞, 단상 왼쪽 끝. 성가대와 그랜드피아노 연주자가 모두 이곳을 바라본다.
export const CONDUCTOR_POS: [number, number, number] = [-6.2, STAGE.height, (CHOIR_PEW_Z0 + CHOIR.zTo) / 2]

// 그랜드피아노: 성가대석 앞(회중석 쪽), 연주자가 지휘자를 정면으로 바라보도록 회전.
// (모델 로컬 좌표: 건반 = +z, 꼬리 = -z → 연주자는 -z 를 바라봄)
export const GRAND_PIANO_POS: [number, number, number] = [-8.7, 0, -4.4]
export const GRAND_PIANO_SCALE = 1.28
export const GRAND_PIANO_ROT_Y = Math.atan2(
  GRAND_PIANO_POS[0] - CONDUCTOR_POS[0],
  GRAND_PIANO_POS[2] - CONDUCTOR_POS[2],
)

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

// 악기·연주자 소품 공통 배율 (그랜드피아노와 비율을 맞춤)
export const INSTRUMENT_SCALE = 1

// 강단 소품
export const DRUM_POS: [number, number, number] = [7.6, STAGE.height, -13.0] // 오른쪽 스크린 아래
export const DRUM_SCALE = 1.4
// 강단 의자 2개: 붙여서 왼쪽에만. 오른쪽 끝 ≈ 왼쪽 스크린 오른쪽 끝(x = -4.3)
// 정면 벽에 붙이고, 오른쪽 끝을 원목 벽이 시작하는 선(x = -frontCenterHalf)에 맞춤
const CHAIR_W = 0.77
const CHAIR_Z = FRONT_SIDE_Z + 0.4
export const STAGE_CHAIRS: [number, number, number][] = [
  [-HALL.frontCenterHalf - CHAIR_W / 2, STAGE.height, CHAIR_Z],
  [-HALL.frontCenterHalf - CHAIR_W * 1.5, STAGE.height, CHAIR_Z],
]

// 관현악 연주자 자리: 그랜드피아노 오른쪽(회중석에서 볼 때). 모두 지휘자를 바라봄.
// 두 사람이 보면대 하나를 함께 보는 배치.
// 피아노 앞(회중석에서 볼 때 오른쪽)에 앞뒤로 한 줄. 왼쪽 벽을 등지고 중앙(+x)을 보되,
// 지휘자를 볼 수 있게 앞쪽(-z)으로 살짝 틀어 앉음. 두 명이 보면대 하나를 함께 씀.
const ORCHESTRA_X = -5.6
const ORCHESTRA_TURN = 0.4 // 중앙 방향에서 앞쪽으로 튼 각도 (rad, 약 23°)
const ORCHESTRA_ROT_Y = Math.PI / 2 + ORCHESTRA_TURN // 로컬 +z(의자 앞) → 중앙에서 살짝 앞쪽
const orchestraPairs = [
  [-7.6, -6.85],
  [-5.5, -4.75],
]
export const ORCHESTRA_CHAIRS = orchestraPairs.flat().map((z) => ({
  pos: [ORCHESTRA_X, 0, z] as [number, number, number],
  rotY: ORCHESTRA_ROT_Y,
}))
// 보면대: 두 의자 가운데 앞 0.6m, 악보 면이 연주자를 향함
export const ORCHESTRA_STANDS = orchestraPairs.map(([z0, z1]) => ({
  pos: [
    ORCHESTRA_X + Math.sin(ORCHESTRA_ROT_Y) * 0.6,
    0,
    (z0 + z1) / 2 + Math.cos(ORCHESTRA_ROT_Y) * 0.6,
  ] as [number, number, number],
  rotY: ORCHESTRA_ROT_Y + Math.PI,
}))

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
  [-5.8, STAGE.height, -14.6], // 성가대석 출입구를 막지 않게
  [9.4, STAGE.height, -15.0],
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
]

// 벽등: 천장:바닥 1:4 지점보다 조금 아래
const LAMP_Y = HALL.height * 0.74
export const WALL_LAMPS: [number, number, number][] = [-10, -4, 2, 8].flatMap((z) => [
  [-HALL.width / 2 + 0.25, LAMP_Y, z] as [number, number, number],
  [HALL.width / 2 - 0.25, LAMP_Y, z] as [number, number, number],
])

// 앉을 수 있는 의자(장의자 말고): 강단 의자 2개, 관현악 의자 4개, 기타·베이스 연주자 스툴 2개.
// seatTop = 좌판 윗면 높이(바닥 기준, 모델과 맞춤), rotY = 앉은 사람이 바라보는 방향(앞 = (sin, cos))
export type ChairSeat = { id: string; pos: [number, number, number]; rotY: number; seatTop: number }
export const SEATABLE_CHAIRS: ChairSeat[] = [
  ...STAGE_CHAIRS.map((p, i) => ({ id: `stage-chair-${i}`, pos: p, rotY: 0, seatTop: 0.53 })),
  ...ORCHESTRA_CHAIRS.map((c, i) => ({ id: `orchestra-chair-${i}`, pos: c.pos, rotY: c.rotY, seatTop: 0.48 * INSTRUMENT_SCALE })),
  // 스툴은 앞의 보면대(강단 쪽, -z)를 바라봄
  ...STOOLS.map((p, i) => ({ id: `stool-${i}`, pos: p, rotY: Math.PI, seatTop: 0.69 * INSTRUMENT_SCALE })),
  // 악기 의자 (모델 안에 이미 있는 벤치): 키보드 벤치(강대상 쪽 -z 를 봄), 그랜드피아노 벤치(건반 = 로컬 +z 쪽, 지휘자를 봄), 드럼 의자(회중 +z 를 봄)
  {
    id: 'keyboard-bench',
    pos: [PIANO_POS[0], PIANO_POS[1], PIANO_POS[2] + 0.62 * INSTRUMENT_SCALE],
    rotY: Math.PI,
    seatTop: 0.535 * INSTRUMENT_SCALE,
  },
  {
    id: 'grand-piano-bench',
    pos: [
      GRAND_PIANO_POS[0] + Math.sin(GRAND_PIANO_ROT_Y) * 0.75 * GRAND_PIANO_SCALE,
      GRAND_PIANO_POS[1],
      GRAND_PIANO_POS[2] + Math.cos(GRAND_PIANO_ROT_Y) * 0.75 * GRAND_PIANO_SCALE,
    ],
    rotY: GRAND_PIANO_ROT_Y + Math.PI,
    seatTop: 0.54 * GRAND_PIANO_SCALE,
  },
  {
    id: 'drum-throne',
    pos: [DRUM_POS[0], DRUM_POS[1], DRUM_POS[2] - 0.65 * DRUM_SCALE],
    rotY: 0,
    seatTop: 0.54 * DRUM_SCALE,
  },
]
