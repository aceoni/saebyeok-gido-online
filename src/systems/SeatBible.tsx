import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Bible } from '../models/Bible'
import { usePlayer } from '../store/player'

/** 장의자에 앉으면 앞 테이블에 펼친 성경이 놓인다 (앉는 순간 살짝 내려앉는 짧은 애니메이션) */
export function SeatBible() {
  const table = usePlayer((s) => (s.pose === 'sitting' || s.pose === 'praying' ? s.seat?.table : undefined))
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  const shown = useRef<typeof table>(undefined)

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    if (shown.current !== table) {
      shown.current = table
      t.current = 0
    }
    if (!table) {
      g.visible = false
      return
    }
    t.current = Math.min(1, t.current + dt / 0.45)
    const e = 1 - Math.pow(1 - t.current, 3)
    g.visible = true
    g.position.set(table.position[0], table.position[1] + (1 - e) * 0.08, table.position[2])
    g.rotation.set(0, table.rotY, 0)
    g.scale.setScalar(0.6 + 0.4 * e)
  })

  return (
    <group ref={ref} visible={false} userData={{ noPick: true }}>
      <Bible />
    </group>
  )
}
