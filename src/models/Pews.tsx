import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, PEWS } from '../config'
import { pewSlots } from '../scenes/sanctuaryLayout'

// 장의자 부품을 각각 InstancedMesh 로 그린다. 장의자는 단상(-z)을 바라본다.
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

function PewPart({ part }: { part: Part }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = pewSlots.length * part.offsets.length

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(part.rotX ?? 0, 0, 0))
    const s = new THREE.Vector3(1, 1, 1)
    const p = new THREE.Vector3()
    let i = 0
    for (const slot of pewSlots) {
      for (const [ox, oy, oz] of part.offsets) {
        p.set(slot.x + ox, oy, slot.z + oz)
        ref.current!.setMatrixAt(i++, m.compose(p, q, s))
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
