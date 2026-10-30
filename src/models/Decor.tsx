import { COLORS } from '../config'

type P = { position: [number, number, number] }

// 꽃꽂이: 받침대 + 화병 + 꽃송이(정이십면체) + 잎(원뿔)
export function FlowerStand({ position, scale = 1 }: P & { scale?: number }) {
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
    <group position={position} scale={scale}>
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

// 라인 어레이 스피커: 천장에서 와이어로 매단 박스를 세로로 여러 개 이어 붙이고,
// 아래로 갈수록 조금씩 더 기울여 J자 곡선을 만든다.
export function SpeakerArray({ position, count, ceilingY }: P & { count: number; ceilingY: number }) {
  const boxH = 0.42
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
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, wire / 2 + 0.2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, wire, 4]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.5, 0.07, 0.8]} />
        <meshStandardMaterial color={COLORS.speaker} roughness={0.6} />
      </mesh>
      {boxes.map((b, i) => (
        <mesh key={i} position={[0, b.y, b.z]} rotation-x={b.tilt}>
          <boxGeometry args={[1.35, boxH - 0.02, 0.75]} />
          <meshStandardMaterial color={COLORS.speaker} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
