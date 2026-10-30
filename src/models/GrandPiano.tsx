import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '../config'

type Props = { position: [number, number, number]; rotationY?: number }

// 그랜드피아노 (로컬 좌표: 건반 = +z 쪽, 꼬리 = -z 쪽, 높은음 = +x).
// 성가대 반주용이라 튀지 않게 무광에 가까운 검정, 뚜껑은 짧은 받침대로 낮게 열어 둠.
const outline: [number, number][] = [
  [-0.75, 0],
  [0.75, 0],
  [0.75, 0.55],
  [0.55, 0.85],
  [0.28, 1.3],
  [0.15, 1.7],
  [-0.05, 1.95],
  [-0.4, 2.02],
  [-0.68, 1.95],
  [-0.75, 1.8],
]

function useOutlineGeometry(thickness: number) {
  return useMemo(() => {
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)))
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
    g.rotateX(-Math.PI / 2) // shape y → -z, 두께 → +y
    return g
  }, [thickness])
}

export function GrandPiano({ position, rotationY = 0 }: Props) {
  const body = useOutlineGeometry(0.32)
  const lid = useOutlineGeometry(0.03)
  const black = <meshStandardMaterial color={COLORS.grandPiano} roughness={0.55} flatShading />

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={body} position={[0, 0.62, 0]} castShadow receiveShadow>
        {black}
      </mesh>
      {/* 뚜껑: 직선(낮은음) 쪽 경첩 기준으로 열림 */}
      <group position={[-0.75, 0.95, 0]} rotation-z={0.2}>
        <mesh geometry={lid} position={[0.75, 0, 0]} castShadow>
          {black}
        </mesh>
      </group>
      <mesh position={[0.4, 1.02, -1.0]} rotation-z={0.15}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 5]} />
        {black}
      </mesh>
      {/* 건반부 */}
      <mesh position={[0, 0.72, 0.16]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.32]} />
        {black}
      </mesh>
      <mesh position={[0, 0.785, 0.18]}>
        <boxGeometry args={[1.32, 0.02, 0.18]} />
        <meshStandardMaterial color={COLORS.pianoKeys} roughness={0.4} />
      </mesh>
      {/* 보면대 */}
      <mesh position={[0, 1.05, -0.1]} rotation-x={-0.25}>
        <boxGeometry args={[0.8, 0.28, 0.02]} />
        {black}
      </mesh>
      {/* 다리 */}
      {(
        [
          [-0.65, 0.1],
          [0.65, 0.1],
          [-0.35, -1.85],
        ] as const
      ).map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.31, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.035, 0.62, 6]} />
          {black}
        </mesh>
      ))}
      {/* 의자 */}
      <group position={[0, 0, 0.75]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.85, 0.08, 0.38]} />
          {black}
        </mesh>
        {[-0.36, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]}>
            <boxGeometry args={[0.05, 0.48, 0.32]} />
            {black}
          </mesh>
        ))}
      </group>
    </group>
  )
}
