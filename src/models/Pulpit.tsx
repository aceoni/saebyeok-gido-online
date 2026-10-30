import { COLORS } from '../config'

type Props = { position: [number, number, number] }

// 밝은 원목 강대상 (회중 쪽 = +z 를 바라봄)
export function Pulpit({ position }: Props) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.1, 0.75]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.0, 0.6]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      {/* 기울어진 상판 */}
      <mesh position={[0, 1.15, -0.02]} rotation-x={0.22} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.06, 0.72]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.5} />
      </mesh>
      {/* 앞면 십자가 장식 */}
      <group position={[0, 0.65, 0.305]}>
        <mesh>
          <boxGeometry args={[0.08, 0.55, 0.02]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.32, 0.08, 0.02]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
