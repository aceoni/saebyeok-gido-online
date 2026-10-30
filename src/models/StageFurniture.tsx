import { COLORS } from '../config'

type P = { position: [number, number, number]; rotationY?: number }

// 강단 의자: 원목 프레임 + 천 쿠션. 로컬 +z 쪽(앞)을 바라봄
export function StageChair({ position, rotationY = 0 }: P) {
  const wood = <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
  const fabric = <meshStandardMaterial color={COLORS.chairFabric} roughness={0.95} />
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.62, 0.12, 0.58]} />
        {fabric}
      </mesh>
      <mesh position={[0, 0.85, -0.26]} rotation-x={-0.1} castShadow>
        <boxGeometry args={[0.62, 0.66, 0.1]} />
        {fabric}
      </mesh>
      {/* 팔걸이 겸 옆판 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.35, 0.36, -0.02]} castShadow>
          <boxGeometry args={[0.07, 0.72, 0.62]} />
          {wood}
        </mesh>
      ))}
    </group>
  )
}

// 바닥 모니터 스피커(웨지): 그릴 면이 로컬 +z 쪽 위를 향함 (연주자 쪽으로 rotationY 지정)
export function MonitorWedge({ position, rotationY = 0 }: P) {
  return (
    <group position={position} rotation-y={rotationY}>
      <group position={[0, 0.17, 0]} rotation-x={-0.55}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.42, 0.3]} />
          <meshStandardMaterial color={COLORS.speaker} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.152]}>
          <boxGeometry args={[0.48, 0.34, 0.01]} />
          <meshStandardMaterial color="#2a2a2e" roughness={1} />
        </mesh>
      </group>
    </group>
  )
}
