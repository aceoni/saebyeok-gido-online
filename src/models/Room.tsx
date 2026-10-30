import { COLORS, HALL, PEWS } from '../config'
import { pillarX, pillarZs } from '../scenes/sanctuaryLayout'

// 바닥, 통로 카펫, 벽(아래 징두리 + 위 나무 벽), 천장, 기둥, 들보, 출입문
export function Room() {
  const len = HALL.backZ - HALL.frontZ
  const midZ = (HALL.backZ + HALL.frontZ) / 2
  const halfW = HALL.width / 2
  const H = HALL.height
  const t = 0.3 // 벽 두께

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[HALL.width, len]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} />
      </mesh>
      {/* 중앙 통로 카펫 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, (-10.5 + HALL.backZ) / 2]} receiveShadow>
        <planeGeometry args={[PEWS.aisleHalf * 2 - 0.3, HALL.backZ + 10.5]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={1} />
      </mesh>

      {/* 천장 */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, midZ]}>
        <planeGeometry args={[HALL.width, len]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} />
      </mesh>

      {/* 좌우 벽 */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (halfW + t / 2), H / 2, midZ]} receiveShadow>
            <boxGeometry args={[t, H, len]} />
            <meshStandardMaterial color={COLORS.wall} roughness={0.85} />
          </mesh>
          <mesh position={[s * (halfW - 0.02), 0.6, midZ]}>
            <boxGeometry args={[0.04, 1.2, len]} />
            <meshStandardMaterial color={COLORS.wallLower} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 정면 벽 */}
      <mesh position={[0, H / 2, HALL.frontZ - t / 2]} receiveShadow>
        <boxGeometry args={[HALL.width + t * 2, H, t]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.85} />
      </mesh>

      {/* 뒷벽 + 양문 */}
      <mesh position={[0, H / 2, HALL.backZ + t / 2]}>
        <boxGeometry args={[HALL.width + t * 2, H, t]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.6, HALL.backZ - 0.02]}>
        <boxGeometry args={[HALL.width, 1.2, 0.04]} />
        <meshStandardMaterial color={COLORS.wallLower} roughness={0.8} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, 1.4, HALL.backZ - 0.05]}>
          <mesh>
            <boxGeometry args={[1.2, 2.8, 0.08]} />
            <meshStandardMaterial color={COLORS.door} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.5, -0.05]}>
            <boxGeometry args={[0.7, 1.0, 0.02]} />
            <meshStandardMaterial color="#1a1c24" roughness={0.3} />
          </mesh>
          <mesh position={[-Math.sign(x) * 0.48, -0.2, -0.07]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#b89a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 측벽 기둥 + 천장 들보 */}
      {pillarZs.map((z) => (
        <group key={z}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * pillarX, H / 2, z]} castShadow receiveShadow>
              <boxGeometry args={[0.7, H, 0.7]} />
              <meshStandardMaterial color={COLORS.pillar} roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, H - 0.25, z]}>
            <boxGeometry args={[HALL.width, 0.5, 0.5]} />
            <meshStandardMaterial color={COLORS.woodDark} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
