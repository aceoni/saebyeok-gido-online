import { BALCONY, COLORS, HALL } from '../config'

// 2층 좌석(발코니): 뒤쪽 벽에서 앞으로 나온 바닥판 + 계단식 단 + 앞쪽 난간 + 양옆 받침 기둥.
// 장의자 자체는 Pews 에서 함께 그린다.
export function Balcony() {
  const W = HALL.width
  const depth = HALL.backZ - BALCONY.frontZ
  const midZ = (HALL.backZ + BALCONY.frontZ) / 2
  const top = BALCONY.floorY
  const slabY = top - BALCONY.slabThickness / 2
  const stageMat = <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
  return (
    <group>
      {/* 바닥판 (아랫면은 천장색) */}
      <mesh position={[0, slabY, midZ]} receiveShadow>
        <boxGeometry args={[W, BALCONY.slabThickness, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.9} />
      </mesh>
      {/* 윗면 마루 */}
      <mesh position={[0, top + 0.01, midZ]} receiveShadow>
        <boxGeometry args={[W, 0.02, depth]} />
        {stageMat}
      </mesh>
      {/* 앞면 원목 띠 */}
      <mesh position={[0, slabY, BALCONY.frontZ - 0.02]}>
        <boxGeometry args={[W, BALCONY.slabThickness + 0.04, 0.06]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      {/* 계단식 단 */}
      {Array.from({ length: BALCONY.rows - 1 }, (_, i) => {
        const row = i + 1
        const z0 = BALCONY.firstRowZ + row * BALCONY.rowSpacing - BALCONY.rowSpacing / 2
        const d = HALL.backZ - z0
        const h = row * BALCONY.tierHeight
        return (
          <mesh key={row} position={[0, top + h / 2, z0 + d / 2]} receiveShadow>
            <boxGeometry args={[W, h, d]} />
            {stageMat}
          </mesh>
        )
      })}
      {/* 난간: 아래 원목 패널 + 위 손잡이 */}
      <mesh position={[0, top + 0.45, BALCONY.frontZ + 0.04]} castShadow>
        <boxGeometry args={[W, 0.9, 0.06]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      <mesh position={[0, top + 0.93, BALCONY.frontZ + 0.04]}>
        <boxGeometry args={[W, 0.06, 0.14]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
      </mesh>
      {/* 양옆 받침 기둥 (측면 통로 쪽, 1층 장의자와 겹치지 않게) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 10.1, (top - BALCONY.slabThickness) / 2, BALCONY.frontZ + 0.35]} castShadow>
          <boxGeometry args={[0.45, top - BALCONY.slabThickness, 0.45]} />
          <meshStandardMaterial color={COLORS.pillar} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
