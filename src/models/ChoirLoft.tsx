import { CHOIR, COLORS, HALL, STAGE } from '../config'

// 성가대석: 단상 높이에서 이어지는 받침(단상의 연장선) 위에 계단식 단을 쌓고,
// 단상과의 경계에 낮은 원목 칸막이를 둔다. 장의자 자체는 Pews 에서 함께 그린다.
export function ChoirLoft() {
  const wallX = -HALL.width / 2
  const z0 = CHOIR.zFrom - 0.4 // 정면 돌출 벽에 닿도록
  const z1 = CHOIR.zTo + 0.4
  const depth = z1 - z0
  const midZ = (z0 + z1) / 2
  const stageMat = <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
  const baseW = STAGE.leftX - wallX
  return (
    <group>
      {/* 단상 높이 받침 */}
      <mesh position={[wallX + baseW / 2, STAGE.height / 2, midZ]} receiveShadow>
        <boxGeometry args={[baseW, STAGE.height, depth]} />
        {stageMat}
      </mesh>
      {/* 계단식 단 */}
      {Array.from({ length: CHOIR.rows - 1 }, (_, i) => {
        const row = i + 1
        const frontEdge = CHOIR.frontX - row * CHOIR.rowSpacing + CHOIR.rowSpacing / 2
        const h = row * CHOIR.tierHeight
        const w = frontEdge - wallX
        return (
          <mesh key={row} position={[wallX + w / 2, STAGE.height + h / 2, midZ]} receiveShadow>
            <boxGeometry args={[w, h, depth]} />
            {stageMat}
          </mesh>
        )
      })}
      {/* 단상 쪽 낮은 칸막이 */}
      <mesh position={[CHOIR.frontX + 0.55, STAGE.height + 0.36, midZ]} castShadow>
        <boxGeometry args={[0.06, 0.72, depth]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      <mesh position={[CHOIR.frontX + 0.55, STAGE.height + 0.74, midZ]}>
        <boxGeometry args={[0.12, 0.04, depth + 0.04]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
      </mesh>
    </group>
  )
}
