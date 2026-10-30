import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, PEWS } from '../config'
import { choirSlots, pewSlots, type PewSlot } from '../scenes/sanctuaryLayout'

// 장의자 부품을 각각 InstancedMesh 로 그린다. 기본은 단상(-z)을 바라보고, 슬롯마다 회전/높이/길이를 줄 수 있다.
type Part = { size: [number, number, number]; offsets: [number, number, number][]; rotX?: number; color: string }

const L = PEWS.length
const D = PEWS.seatDepth
const parts: Part[] = [
  // 회색 쿠션 좌판
  { size: [L, 0.09, D], offsets: [[0, PEWS.seatHeight, 0]], color: COLORS.cushion },
  // 회색 쿠션 등받이
  { size: [L, 0.5, 0.08], offsets: [[0, PEWS.backHeight - 0.25, D / 2 - 0.06]], rotX: -0.08, color: COLORS.cushion },
  // 등받이 위 원목 손잡이
  { size: [L, 0.05, 0.1], offsets: [[0, PEWS.backHeight + 0.02, D / 2 - 0.06]], color: COLORS.wood },
  // 좌판 아래 원목 앞판
  { size: [L, 0.3, 0.03], offsets: [[0, 0.24, -D / 2 + 0.06]], color: COLORS.wood },
  // 양쪽 원목 옆판
  {
    size: [0.07, PEWS.backHeight, D + 0.14],
    offsets: [
      [-L / 2, PEWS.backHeight / 2, 0.04],
      [L / 2, PEWS.backHeight / 2, 0.04],
    ],
    color: COLORS.woodDark,
  },
]

const allSlots: PewSlot[] = [...pewSlots, ...choirSlots]

function PewPart({ part }: { part: Part }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = allSlots.length * part.offsets.length

  useLayoutEffect(() => {
    const slotM = new THREE.Matrix4()
    const partM = new THREE.Matrix4()
    const partQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(part.rotX ?? 0, 0, 0))
    const one = new THREE.Vector3(1, 1, 1)
    const p = new THREE.Vector3()
    let i = 0
    for (const slot of allSlots) {
      // 장의자 길이는 x 방향 스케일로 조절 (옆판 위치도 함께 따라감)
      const sx = (slot.length ?? L) / L
      slotM.compose(
        p.set(slot.x, slot.y ?? 0, slot.z),
        new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, slot.rotY ?? 0),
        new THREE.Vector3(sx, 1, 1),
      )
      for (const [ox, oy, oz] of part.offsets) {
        partM.compose(p.set(ox, oy, oz), partQ, one)
        ref.current!.setMatrixAt(i++, partM.premultiply(slotM))
      }
    }
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [part])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={part.size} />
      <meshStandardMaterial color={part.color} roughness={0.7} />
    </instancedMesh>
  )
}

export function Pews() {
  return (
    <group>
      {parts.map((part, i) => (
        <PewPart key={i} part={part} />
      ))}
    </group>
  )
}
