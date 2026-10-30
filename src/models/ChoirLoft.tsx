import { CHOIR, COLORS, HALL } from '../config'
import { CHOIR_LENGTH } from '../scenes/sanctuaryLayout'

// 성가대석 단(계단식 받침)과 앞쪽 낮은 원목 칸막이. 장의자 자체는 Pews 에서 함께 그린다.
export function ChoirLoft() {
  const midZ = (CHOIR.zFrom + CHOIR.zTo) / 2
  const wallX = -HALL.width / 2
  return (
    <group>
      {Array.from({ length: CHOIR.rows - 1 }, (_, i) => {
        const row = i + 1
        const frontEdge = CHOIR.frontX - row * CHOIR.rowSpacing + CHOIR.rowSpacing / 2
        const h = row * CHOIR.tierHeight
        const w = frontEdge - wallX
        return (
          <mesh key={row} position={[wallX + w / 2, h / 2, midZ]} receiveShadow>
            <boxGeometry args={[w, h, CHOIR_LENGTH + 0.4]} />
            <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
          </mesh>
        )
      })}
      {/* 앞쪽 낮은 칸막이 */}
      <mesh position={[CHOIR.frontX + 0.55, 0.42, midZ]} castShadow>
        <boxGeometry args={[0.06, 0.84, CHOIR_LENGTH + 0.4]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      <mesh position={[CHOIR.frontX + 0.55, 0.86, midZ]}>
        <boxGeometry args={[0.12, 0.04, CHOIR_LENGTH + 0.44]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
      </mesh>
    </group>
  )
}
