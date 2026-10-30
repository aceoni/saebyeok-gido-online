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
        <meshStandardMaterial color={COLORS.stage} roughness={0.8} />
      </mesh>
      <mesh position={[0, STAGE.stepHeight / 2, STAGE.frontZ + STAGE.stepDepth / 2]} receiveShadow>
        <boxGeometry args={[w + 0.6, STAGE.stepHeight, STAGE.stepDepth]} />
        <meshStandardMaterial color={COLORS.stage} roughness={0.8} />
      </mesh>
      {/* 단상 카펫 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, STAGE.height + 0.005, topZ - STAGE.stepDepth / 2]} receiveShadow>
        <planeGeometry args={[9, topDepth - STAGE.stepDepth - 0.6]} />
        <meshStandardMaterial color={COLORS.stageCarpet} roughness={1} />
      </mesh>
    </group>
  )
}
