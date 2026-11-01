import { PEWS, SEAT } from '../config'
import { DOOR_LINKS, SEATABLE_CHAIRS, balconySlots, choirSlots, pewSlots, type ChairSeat, type PewSlot } from '../scenes/sanctuaryLayout'
import { usePlayer, type Level, type Seat } from '../store/player'
import { NAV, localToWorld, worldToLocal } from './navGrid'

/** 상호작용 공통 인터페이스: 위치(말풍선 기준점), 반경, 라벨, 실행 */
export type Interactable = {
  id: string
  label: string
  anchor: [number, number, number] // 말풍선이 뜨는 곳
  radius: number
  onInteract: () => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const SLOTS: Record<Level, PewSlot[]> = { 1: [...pewSlots, ...choirSlots], 2: balconySlots }

// 장의자: 플레이어와 가장 가까운 좌판 위치에 "앉기"
function pewSeat(level: Level, slot: PewSlot, px: number, py: number, pz: number): { seat: Seat; dist: number } | null {
  const floorY = slot.y ?? 0
  if (Math.abs(py - floorY) > 0.45) return null
  const rot = slot.rotY ?? 0
  const L = slot.length ?? PEWS.length
  const [lx, lz] = worldToLocal(slot.x, slot.z, rot, px, pz)
  // 등받이 뒤쪽에서는 앉지 않음 (끝에서 옆으로 다가온 경우는 허용)
  if (lz > 0.1 && Math.abs(lx) < L / 2) return null
  const sx = clamp(lx, -L / 2 + SEAT.edgeMargin, L / 2 - SEAT.edgeMargin)
  const dist = Math.hypot(lx - sx, lz)
  if (dist > SEAT.reach) return null

  const [x, z] = localToWorld(slot.x, slot.z, rot, sx, 0.02)
  const nav = NAV[level]
  const [fx, fz] = localToWorld(slot.x, slot.z, rot, sx, -SEAT.standOffset)
  const stand = nav.walkable(fx, fz) ? [fx, fz] : (nav.nearestWalkable(fx, fz, 1.5) ?? [px, pz])
  return {
    dist,
    seat: {
      id: `${slot.id}:${sx.toFixed(1)}`,
      position: [x, floorY + SEAT.hipLift, z],
      rotY: rot + Math.PI, // 장의자는 로컬 -z 를 바라봄
      standAt: [stand[0], nav.height(stand[0], stand[1]), stand[1]],
    },
  }
}

// 일반 의자·스툴: 의자 가까이 오면 "앉기". 일어날 때는 의자 앞쪽으로
const PEW_SEAT_TOP = 0.45 // hipLift 는 장의자 좌판 높이 기준
function chairSeat(chair: ChairSeat, px: number, py: number, pz: number): { seat: Seat; dist: number } | null {
  const [cx, cy, cz] = chair.pos
  if (Math.abs(py - cy) > 0.45) return null
  const dist = Math.hypot(px - cx, pz - cz)
  if (dist > SEAT.reach) return null
  const fx = Math.sin(chair.rotY)
  const fz = Math.cos(chair.rotY)
  const nav = NAV[1]
  const ax = cx + fx * 0.6
  const az = cz + fz * 0.6
  const stand = nav.walkable(ax, az) ? [ax, az] : (nav.nearestWalkable(ax, az, 1.5) ?? [px, pz])
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

/** 지금 플레이어 근처에서 실행할 수 있는 가장 가까운 상호작용 */
export function findInteractable(): Interactable | null {
  const { level, position } = usePlayer.getState()
  const [px, py, pz] = position
  let best: Interactable | null = null
  let bestD = Infinity

  for (const slot of SLOTS[level]) {
    const r = pewSeat(level, slot, px, py, pz)
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
      const r = chairSeat(chair, px, py, pz)
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
