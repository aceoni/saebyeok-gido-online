import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, PEWS } from '../config'
import { pewSlots } from '../scenes/sanctuaryLayout'

// 장의자 부품을 각각 InstancedMesh 로 그린다. 장의자는 단상(-z)을 바라본다.
type Part = { size: [number, number, number]; offsets: [number, number, number][]; rotX?: number; color: string }

const L = PEWS.length
const D = PEWS.seatDepth
const parts: Part[] = [
  { size: [L, 0.07, D], offsets: [[0, PEWS.seatHeight, 0]], color: COLORS.wood },
  { size: [L, 0.5, 0.05], offsets: [[0, PEWS.backHeight - 0.27, D / 2 - 0.02]], rotX: -0.12, color: COLORS.wood },
  { size: [L, 0.12, 0.04], offsets: [[0, 0.22, -D / 2 + 0.05]], color: COLORS.woodDark },
  {
    size: [0.07, PEWS.backHeight, D + 0.12],
    offsets: [
      [-L / 2, PEWS.backHeight / 2, 0.03],
      [L / 2, PEWS.backHeight / 2, 0.03],
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
