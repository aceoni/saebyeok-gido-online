import { COLORS, PEWS } from '../config'
import type { FrontDesk as Desk } from '../scenes/sanctuaryLayout'

// 맨 앞줄 앞에 따로 둔 테이블: 원목 앞판 + 뒤(앉는 사람 쪽, +z)에 장의자와 같은 작은 테이블
const H = PEWS.shelfY + 0.12

export function FrontDesk({ desk }: { desk: Desk }) {
  const wood = <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
  const dark = <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
  const L = desk.length
  return (
    <group position={[desk.x, desk.y, desk.z]} rotation-y={desk.rotY}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, H, 0.04]} />
        {wood}
      </mesh>
      <mesh position={[0, H + 0.015, 0]}>
        <boxGeometry args={[L + 0.04, 0.03, 0.08]} />
        {dark}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * L) / 2, H / 2, 0.08]} castShadow>
          <boxGeometry args={[0.07, H, 0.3]} />
          {dark}
        </mesh>
      ))}
      <mesh position={[0, PEWS.shelfY - 0.0125, 0.02 + PEWS.shelfDepth / 2]}>
        <boxGeometry args={[L - 0.14, 0.025, PEWS.shelfDepth]} />
        {wood}
      </mesh>
      <mesh position={[0, PEWS.shelfY + 0.012, 0.02 + PEWS.shelfDepth]}>
        <boxGeometry args={[L - 0.14, 0.035, 0.015]} />
        {wood}
      </mesh>
    </group>
  )
}
