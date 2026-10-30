import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, LIGHTS } from '../config'

type Props = { position: [number, number, number]; seed: number }

// 측벽 낮은 벽등 (약한 PointLight + 미세한 깜빡임, 그림자 없음)
export function WallLamp({ position, seed }: Props) {
  const light = useRef<THREE.PointLight>(null)
  const shade = useRef<THREE.MeshStandardMaterial>(null)
  const inward = position[0] < 0 ? 1 : -1 // 벽에서 안쪽 방향
  const { color, intensity, distance, flicker } = LIGHTS.wallLamp

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 13.7
    const f = 1 + flicker * (0.6 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 3.7 + 1) + 0.1 * Math.sin(t * 11.3))
    if (light.current) light.current.intensity = intensity * f
    if (shade.current) shade.current.emissiveIntensity = 1.4 * f
  })

  return (
    <group position={position}>
      <mesh position={[-inward * 0.08, 0, 0]}>
        <boxGeometry args={[0.04, 0.3, 0.18]} />
        <meshStandardMaterial color="#5a4630" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[inward * 0.05, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.26, 6, 1]} />
        <meshStandardMaterial ref={shade} color={COLORS.lampShade} emissive={color} emissiveIntensity={1.4} flatShading />
      </mesh>
      <pointLight
        ref={light}
        position={[inward * 0.35, 0.1, 0]}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
      />
    </group>
  )
}
