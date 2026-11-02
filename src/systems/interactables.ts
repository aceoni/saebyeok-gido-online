import { PEWS, SEAT } from '../config'
import { DOOR_LINKS, SEATABLE_CHAIRS, balconySlots, choirSlots, pewSlots, type ChairSeat, type PewSlot } from '../scenes/sanctuaryLayout'
import { usePlayer, type Level, type Seat } from '../store/player'
import { occupiedSeats } from '../store/remote'
import { CLOSET, CLOSET_DOOR, CLOSET_KNEEL } from '../scenes/closetLayout'
import { exitToStart } from './places'
import { NAV, localToWorld, worldToLocal } from './navGrid'

/** 상호작용 공통 인터페이스: 위치(말풍선 기준점), 반경, 라벨, 실행 */
export type Interactable = {
  id: string
  label: string
  anchor: [number, number, number] // 말풍선이 뜨는 곳
  radius: number
  onInteract: () => void
}

const SLOTS: Record<Level, PewSlot[]> = { 1: [...pewSlots, ...choirSlots], 2: balconySlots, 3: [] }

/** 장의자 한 개의 자리들 (로컬 x 좌표). 좌판 길이를 SEAT.seatWidth 간격의 칸으로 나눔 */
export function pewSeatXs(length: number): number[] {
  const n = Math.max(1, Math.floor((length - 2 * SEAT.edgeMargin) / SEAT.seatWidth) + 1)
  return Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * SEAT.seatWidth)
}

// 장의자: 비어 있는 자리 중 플레이어와 가장 가까운 칸에 "앉기"
function pewSeat(level: Level, slot: PewSlot, px: number, py: number, pz: number, taken: Set<string>): { seat: Seat; dist: number } | null {
  const floorY = slot.y ?? 0
  if (Math.abs(py - floorY) > 0.45) return null
  const rot = slot.rotY ?? 0
  const L = slot.length ?? PEWS.length
  const [lx, lz] = worldToLocal(slot.x, slot.z, rot, px, pz)
  // 등받이 뒤쪽에서는 앉지 않음 (끝에서 옆으로 다가온 경우는 허용)
  if (lz > 0.1 && Math.abs(lx) < L / 2) return null
  const free = pewSeatXs(L)
    .map((x, k) => ({ x, k }))
    .filter(({ k }) => !taken.has(`${slot.id}:${k}`))
  if (!free.length) return null
  const { x: sx, k } = free.reduce((a, b) => (Math.abs(b.x - lx) < Math.abs(a.x - lx) ? b : a))
  const dist = Math.hypot(lx - sx, lz)
  if (dist > SEAT.reach) return null

  const [x, z] = localToWorld(slot.x, slot.z, rot, sx, 0.02)
  const nav = NAV[level]
  const [fx, fz] = localToWorld(slot.x, slot.z, rot, sx, -SEAT.standOffset)
  const stand = nav.walkable(fx, fz) ? [fx, fz] : (nav.nearestWalkable(fx, fz, 1.5) ?? [px, pz])
  // 앞 테이블: 앞줄 등받이 뒤 테이블 / 맨 앞줄 테이블 / 성가대 칸막이 위
  const [tx, tz] = localToWorld(slot.x, slot.z, rot, sx, -slot.table.dist)
  return {
    dist,
    seat: {
      id: `${slot.id}:${k}`,
      position: [x, floorY + SEAT.hipLift, z],
      rotY: rot + Math.PI, // 장의자는 로컬 -z 를 바라봄
      standAt: [stand[0], nav.height(stand[0], stand[1]), stand[1]],
      table: { position: [tx, slot.table.y, tz], rotY: rot },
    },
  }
}

// 일반 의자·스툴: 의자 가까이 오면 "앉기". 일어날 때는 의자 앞쪽으로
const PEW_SEAT_TOP = 0.45 // hipLift 는 장의자 좌판 높이 기준
function chairSeat(chair: ChairSeat, px: number, py: number, pz: number, taken: Set<string>): { seat: Seat; dist: number } | null {
  if (taken.has(chair.id)) return null
  const [cx, cy, cz] = chair.pos
  if (Math.abs(py - cy) > 0.45) return null
  const dist = Math.hypot(px - cx, pz - cz)
  if (dist > SEAT.reach) return null
  const fx = Math.sin(chair.rotY)
  const fz = Math.cos(chair.rotY)
  const nav = NAV[1]
  // 일어설 자리: 앞 → 뒤 → 옆 순서로 걸을 수 있는 곳 (피아노·드럼 의자는 앞이 악기라 뒤로 일어남)
  const tries: [number, number][] = [
    [fx, fz],
    [-fx, -fz],
    [fz, -fx],
    [-fz, fx],
  ].flatMap(([dx, dz]) => [0.6, 0.8].map((d) => [cx + dx * d, cz + dz * d] as [number, number]))
  const stand = tries.find(([x, z]) => nav.walkable(x, z)) ?? nav.nearestWalkable(px, pz, 1.5) ?? [px, pz]
  return {
    dist,
    seat: {
      id: chair.id,
      // 엉덩이가 좌판 가운데보다 살짝 뒤에 오도록
      position: [cx - fx * 0.04, cy + chair.seatTop - PEW_SEAT_TOP + SEAT.hipLift, cz - fz * 0.04],
      rotY: chair.rotY,
      standAt: [stand[0], nav.height(stand[0], stand[1]), stand[1]],
    },
  }
}

/** 기도 골방: 앉은뱅이 책상 앞 방석에서 무릎 꿇기, 문으로 나가기 (시작 화면) */
const KNEEL_DROP = 0.3 // 무릎 꿇으면 엉덩이(캐릭터 기준점)가 이만큼 내려감 (다리는 뒤로 접힘)
function closetInteractable(px: number, pz: number): Interactable | null {
  const [cx, , cz] = CLOSET_KNEEL.pos
  const dSpot = Math.hypot(px - cx, pz - cz)
  const dDoor = Math.hypot(px - CLOSET_DOOR.x, pz - CLOSET.halfD)
  if (dSpot < SEAT.reach && dSpot < dDoor) {
    const nav = NAV[3]
    // 일어설 자리: 방석 뒤(문 쪽) → 옆
    const tries: [number, number][] = [
      [cx, cz + 0.55],
      [cx + 0.55, cz],
      [cx - 0.55, cz],
    ]
    const stand = tries.find(([x, z]) => nav.walkable(x, z)) ?? [px, pz]
    const seat: Seat = {
      id: 'closet-kneel',
      position: [cx, 0.06 - KNEEL_DROP, cz + 0.06],
      rotY: CLOSET_KNEEL.rotY,
      standAt: [stand[0], 0, stand[1]],
      kneel: true,
    }
    return { id: seat.id, label: '무릎 꿇기', anchor: [cx, 1.3, cz], radius: SEAT.reach, onInteract: () => usePlayer.getState().sit(seat) }
  }
  if (dDoor < 1.1) {
    return { id: 'closet-door', label: '골방에서 나가기', anchor: [CLOSET_DOOR.x, 2.0, CLOSET.halfD - 0.2], radius: 1.1, onInteract: exitToStart }
  }
  return null
}

/** 지금 플레이어 근처에서 실행할 수 있는 가장 가까운 상호작용 */
export function findInteractable(): Interactable | null {
  const { level, position } = usePlayer.getState()
  const [px, py, pz] = position
  let best: Interactable | null = null
  let bestD = Infinity
  if (level === 3) return closetInteractable(px, pz)
  const taken = occupiedSeats() // 다른 사람이 앉은 자리

  for (const slot of SLOTS[level]) {
    const r = pewSeat(level, slot, px, py, pz, taken)
    if (r && r.dist < bestD) {
      bestD = r.dist
      const seat = r.seat
      best = {
        id: seat.id,
        label: '앉기',
        anchor: [seat.position[0], seat.position[1] + 1.25, seat.position[2]],
        radius: SEAT.reach,
        onInteract: () => usePlayer.getState().sit(seat),
      }
    }
  }

  if (level === 1) {
    for (const chair of SEATABLE_CHAIRS) {
      const r = chairSeat(chair, px, py, pz, taken)
      if (r && r.dist < bestD) {
        bestD = r.dist
        const seat = r.seat
        best = {
          id: seat.id,
          label: '앉기',
          anchor: [chair.pos[0], seat.position[1] + 1.25, chair.pos[2]],
          radius: SEAT.reach,
          onInteract: () => usePlayer.getState().sit(seat),
        }
      }
    }
  }

  // 1층 ↔ 2층 문
  const link = level === 1 ? DOOR_LINKS.down : DOOR_LINKS.up
  const d = Math.hypot(px - link.pos[0], pz - link.pos[2])
  if (d < 1.4 && d < bestD) {
    best = {
      id: `door-${level}`,
      label: level === 1 ? '2층으로 올라가기' : '1층으로 내려가기',
      anchor: [link.pos[0], link.pos[1] + 2.0, link.pos[2]],
      radius: 1.4,
      onInteract: () => usePlayer.getState().moveToLevel(level === 1 ? 2 : 1, link.to, Math.PI),
    }
  }
  return best
}
