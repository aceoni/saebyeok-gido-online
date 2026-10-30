import { COLORS } from '../config'

type P = { position: [number, number, number] }

// 꽃꽂이: 받침대 + 화병 + 꽃송이(정이십면체) + 잎(원뿔)
export function FlowerStand({ position }: P) {
  const blooms: [number, number, number, number][] = [
    [0, 1.42, 0, 0],
    [0.16, 1.34, 0.05, 1],
    [-0.15, 1.35, 0.06, 2],
    [0.07, 1.3, -0.14, 1],
    [-0.08, 1.52, -0.05, 2],
    [0.12, 1.5, 0.1, 0],
    [-0.18, 1.25, -0.08, 0],
  ]
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.9, 6]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.09, 0.25, 6]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.4} flatShading />
      </mesh>
      {blooms.map(([x, y, z, c], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color={COLORS.flower[c]} roughness={0.8} flatShading />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.2, 1.22, Math.sin(a) * 0.2]}
            rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}
          >
            <coneGeometry args={[0.05, 0.35, 4]} />
            <meshStandardMaterial color={COLORS.leaf} roughness={0.9} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

// 깃발: 깃대 + 천(얇은 상자) + 십자가 문양
export function Flag({ position, variant }: P & { variant: 'christian' | 'church' }) {
  const field = variant === 'christian' ? COLORS.flagCross : COLORS.flagNavy
  const cross = variant === 'christian' ? COLORS.flagRed : COLORS.flagCross
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 2.6, 6]} />
        <meshStandardMaterial color="#b89a5a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.66, 0]}>
        <octahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial color="#d8b868" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.08, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
      </mesh>
      {/* 깃발 천은 정면(+z)을 향해 늘어짐 */}
      <group position={[0, 1.95, 0.05]}>
        <mesh position={[0.48, 0, 0.0]} rotation-y={-0.15} castShadow>
          <boxGeometry args={[0.92, 1.1, 0.02]} />
          <meshStandardMaterial color={field} roughness={0.9} />
        </mesh>
        {variant === 'christian' && (
          <mesh position={[0.2, 0.3, 0.035]} rotation-y={-0.15}>
            <boxGeometry args={[0.36, 0.42, 0.01]} />
            <meshStandardMaterial color={COLORS.flagBlue} roughness={0.9} />
          </mesh>
        )}
        <group position={variant === 'christian' ? [0.2, 0.3, 0.045] : [0.48, 0, 0.025]} rotation-y={-0.15}>
          <mesh>
            <boxGeometry args={[0.05, 0.3, 0.01]} />
            <meshStandardMaterial color={cross} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.2, 0.05, 0.01]} />
            <meshStandardMaterial color={cross} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// 라인 어레이 스피커: 천장에서 와이어로 매단 박스를 세로로 여러 개 이어 붙이고,
// 아래로 갈수록 조금씩 더 기울여 J자 곡선을 만든다.
export function SpeakerArray({ position, count, ceilingY }: P & { count: number; ceilingY: number }) {
  const boxH = 0.32
  const boxes: { y: number; z: number; tilt: number }[] = []
  let y = 0
  let z = 0
  for (let i = 0; i < count; i++) {
    const tilt = 0.04 * i * i * 0.25 + 0.03 * i
    boxes.push({ y, z, tilt })
    y -= boxH * Math.cos(tilt)
    z += boxH * Math.sin(tilt)
  }
  const wire = ceilingY - position[1]
  return (
    <group position={position}>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, wire / 2 + 0.2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, wire, 4]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.1, 0.06, 0.6]} />
        <meshStandardMaterial color={COLORS.speaker} roughness={0.6} />
      </mesh>
      {boxes.map((b, i) => (
        <mesh key={i} position={[0, b.y, b.z]} rotation-x={b.tilt}>
          <boxGeometry args={[1.0, boxH - 0.015, 0.55]} />
          <meshStandardMaterial color={COLORS.speaker} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
