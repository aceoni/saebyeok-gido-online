import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config'
import { usePlayer } from '../store/player'

// 로우폴리 인형형 캐릭터 (키 약 1.7m). 앞 = 로컬 +z.
// 위치/방향/자세는 player store 에서 매 프레임 읽어 ref 로 직접 갱신한다.
const C = COLORS.character
const HIP_Y = 0.86
const SHOULDER_Y = 1.4

export function Character() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const phase = useRef(0)
  const amp = useRef(0)

  useFrame((_, dt) => {
    const s = usePlayer.getState()
    if (!root.current) return
    root.current.position.set(...s.position)
    root.current.rotation.y = s.rotY
    // 걷기: 팔다리를 앞뒤로 흔들고 몸을 살짝 위아래로
    const walking = s.pose === 'walking'
    amp.current += ((walking ? 0.5 : 0) - amp.current) * Math.min(1, dt * 8)
    phase.current += dt * 7.5 * (walking ? 1 : 0.3)
    const sw = Math.sin(phase.current) * amp.current
    legL.current!.rotation.x = sw
    legR.current!.rotation.x = -sw
    armL.current!.rotation.x = -sw * 0.8
    armR.current!.rotation.x = sw * 0.8
    body.current!.position.y = Math.abs(Math.sin(phase.current)) * amp.current * 0.06
  })

  const mat = (color: string) => <meshStandardMaterial color={color} roughness={0.85} flatShading />

  const Leg = ({ x, r }: { x: number; r: React.RefObject<THREE.Group | null> }) => (
    <group ref={r} position={[x, HIP_Y, 0]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.14, 0.8, 0.16]} />
        {mat(C.pants)}
      </mesh>
      <mesh position={[0, -0.82, 0.04]}>
        <boxGeometry args={[0.15, 0.08, 0.26]} />
        {mat(C.shoes)}
      </mesh>
    </group>
  )
  const Arm = ({ x, r }: { x: number; r: React.RefObject<THREE.Group | null> }) => (
    <group ref={r} position={[x, SHOULDER_Y, 0]}>
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        {mat(C.top)}
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <icosahedronGeometry args={[0.055, 0]} />
        {mat(C.skin)}
      </mesh>
    </group>
  )

  return (
    <group ref={root} userData={{ noPick: true }}>
      <group ref={body}>
        <Leg x={-0.1} r={legL} />
        <Leg x={0.1} r={legR} />
        {/* 몸통 (아래가 살짝 좁은 사각 기둥) */}
        <mesh position={[0, 1.14, 0]} rotation-y={Math.PI / 4} scale={[1, 1, 0.6]} castShadow>
          <cylinderGeometry args={[0.27, 0.22, 0.6, 4]} />
          {mat(C.top)}
        </mesh>
        <Arm x={-0.25} r={armL} />
        <Arm x={0.25} r={armR} />
        {/* 목 + 머리 + 뒤쪽 머리카락 */}
        <mesh position={[0, 1.47, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.08, 6]} />
          {mat(C.skin)}
        </mesh>
        <group position={[0, 1.6, 0]}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.12, 1]} />
            {mat(C.skin)}
          </mesh>
          <mesh position={[0, 0.02, -0.02]} scale={[1.06, 1.02, 1.06]}>
            <sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            {mat(C.hair)}
          </mesh>
          <mesh position={[0, -0.02, -0.05]}>
            <boxGeometry args={[0.2, 0.14, 0.1]} />
            {mat(C.hair)}
          </mesh>
        </group>
      </group>
    </group>
  )
}
