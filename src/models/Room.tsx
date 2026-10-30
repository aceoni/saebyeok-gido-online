import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, HALL, LIGHTS, PEWS, STAGE } from '../config'
import { pillarX, pillarZs } from '../scenes/sanctuaryLayout'

// 천장 매입등 위치 (자체 발광 원판만, 실제 광원은 아님)
const downlights: [number, number][] = []
for (let z = HALL.frontZ + 2; z < HALL.backZ - 1; z += 3) {
  for (const x of [-9, -6, -3, 0, 3, 6, 9]) downlights.push([x, z])
}

// 매입등: 밝은 테두리 링 + 안쪽 우묵한 등. 꺼져 있어도 조명 형태가 보이게.
function DownlightPart({ radius, height, y, color, emissive = 0 }: { radius: number; height: number; y: number; color: string; emissive?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    downlights.forEach(([x, z], i) => ref.current!.setMatrixAt(i, m.makeTranslation(x, y, z)))
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [y])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, downlights.length]}>
      <cylinderGeometry args={[radius, radius, height, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.5} metalness={0.2} />
    </instancedMesh>
  )
}

function Downlights() {
  const top = HALL.height
  return (
    <group>
      <DownlightPart radius={0.17} height={0.03} y={top - 0.015} color={COLORS.downlightTrim} />
      <DownlightPart
        radius={0.11}
        height={0.02}
        y={top - 0.025}
        color={LIGHTS.downlightGlow > 0 ? COLORS.downlight : COLORS.downlightInner}
        emissive={LIGHTS.downlightGlow}
      />
    </group>
  )
}

// 바닥, 통로, 벽(아래 원목 패널 + 위 크림색 벽), 천장, 기둥, 강대상 뒤 원목 벽, 출입문
export function Room() {
  const len = HALL.backZ - HALL.frontZ
  const midZ = (HALL.backZ + HALL.frontZ) / 2
  const halfW = HALL.width / 2
  const H = HALL.height
  const t = 0.3 // 벽 두께
  const panelH = 1.4 // 아래 원목 패널 높이

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[HALL.width, len]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.85} />
      </mesh>
      {/* 중앙 통로 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, (STAGE.frontZ + HALL.backZ) / 2]} receiveShadow>
        <planeGeometry args={[PEWS.aisleHalf * 2 - 0.3, HALL.backZ - STAGE.frontZ]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={1} />
      </mesh>

      {/* 천장 + 매입등 */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, midZ]}>
        <planeGeometry args={[HALL.width, len]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} />
      </mesh>
      <Downlights />

      {/* 좌우 벽 */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (halfW + t / 2), H / 2, midZ]} receiveShadow>
            <boxGeometry args={[t, H, len]} />
            <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
          </mesh>
          <mesh position={[s * (halfW - 0.02), panelH / 2, midZ]}>
            <boxGeometry args={[0.04, panelH, len]} />
            <meshStandardMaterial color={COLORS.wallLower} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 정면 벽 + 강대상 뒤 원목 벽 (세로 패널) */}
      <mesh position={[0, H / 2, HALL.frontZ - t / 2]} receiveShadow>
        <boxGeometry args={[HALL.width + t * 2, H, t]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>
      {/* 정면 좌/우 흰 벽: 중앙 원목 벽보다 앞으로 돌출 */}
      {[-1, 1].map((s) => {
        const w = halfW - HALL.frontCenterHalf
        return (
          <mesh key={s} position={[s * (HALL.frontCenterHalf + w / 2), H / 2, HALL.frontZ + HALL.frontSideDepth / 2]} receiveShadow>
            <boxGeometry args={[w, H, HALL.frontSideDepth]} />
            <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
          </mesh>
        )
      })}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[(i - 3) * 1.0, H / 2, HALL.frontZ + 0.04]} receiveShadow>
          <boxGeometry args={[0.96, H, 0.08]} />
          <meshStandardMaterial color={COLORS.frontPanel} roughness={0.7} />
        </mesh>
      ))}

      {/* 뒷벽 + 양문 */}
      <mesh position={[0, H / 2, HALL.backZ + t / 2]}>
        <boxGeometry args={[HALL.width + t * 2, H, t]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, panelH / 2, HALL.backZ - 0.02]}>
        <boxGeometry args={[HALL.width, panelH, 0.04]} />
        <meshStandardMaterial color={COLORS.wallLower} roughness={0.7} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, 1.4, HALL.backZ - 0.05]}>
          <mesh>
            <boxGeometry args={[1.2, 2.8, 0.08]} />
            <meshStandardMaterial color={COLORS.door} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, -0.05]}>
            <boxGeometry args={[0.7, 1.0, 0.02]} />
            <meshStandardMaterial color="#2a2f3a" roughness={0.3} />
          </mesh>
          <mesh position={[-Math.sign(x) * 0.48, -0.2, -0.07]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#c9c4ba" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* 측벽 기둥 */}
      {pillarZs.map((z) =>
        [-1, 1].map((s) => (
          <mesh key={`${z}${s}`} position={[s * pillarX, H / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.7, H, 0.7]} />
            <meshStandardMaterial color={COLORS.pillar} roughness={0.85} />
          </mesh>
        )),
      )}
    </group>
  )
}
