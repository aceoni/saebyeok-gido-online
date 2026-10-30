import { COLORS, HALL, STAGE } from '../config'

// 단상: 아래 계단 1단 + 위 단
export function Stage() {
  const w = 17
  const topDepth = STAGE.frontZ + STAGE.stepDepth - HALL.frontZ
  const topZ = HALL.frontZ + topDepth / 2
  return (
    <group>
      <mesh position={[0, STAGE.height / 2, topZ - STAGE.stepDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, STAGE.height, topDepth - STAGE.stepDepth]} />
        <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
      </mesh>
      <mesh position={[0, STAGE.stepHeight / 2, STAGE.frontZ + STAGE.stepDepth / 2]} receiveShadow>
        <boxGeometry args={[w + 0.6, STAGE.stepHeight, STAGE.stepDepth]} />
        <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
      </mesh>
    </group>
  )
}
