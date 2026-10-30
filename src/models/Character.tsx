import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config'
import { usePlayer } from '../store/player'

// 귀여운 SD(2~2.5등신) 로우폴리 캐릭터. 큰 머리 + 짧은 몸과 팔다리, 키 약 1.3m. 앞 = 로컬 +z.
// 위치/방향/자세는 player store 에서 매 프레임 읽어 ref 로 직접 갱신한다.
const C = COLORS.character
const HIP_Y = 0.42
const SHOULDER_Y = 0.8
const HEAD_Y = 1.08
const HEAD_R = 0.26

const mat = (color: string) => <meshStandardMaterial color={color} roughness={0.85} flatShading />

function Leg({ x, legRef }: { x: number; legRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={legRef} position={[x, HIP_Y, 0]}>
      <mesh position={[0, -0.17, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.068, 0.34, 7]} />
        {mat(C.pants)}
      </mesh>
      <mesh position={[0, -0.37, 0.035]} scale={[1, 0.7, 1.35]}>
        <icosahedronGeometry args={[0.085, 0]} />
        {mat(C.shoes)}
      </mesh>
    </group>
  )
}

function Arm({ side, armRef }: { side: -1 | 1; armRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={armRef} position={[side * 0.2, SHOULDER_Y, 0]}>
      {/* 몸에서 살짝 벌어지게 */}
      <group rotation-z={side * 0.18}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.056, 0.05, 0.3, 7]} />
          {mat(C.top)}
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <icosahedronGeometry args={[0.058, 1]} />
          {mat(C.skin)}
        </mesh>
      </group>
    </group>
  )
}

export function Character() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
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
    // 걷기: 짧은 팔다리를 빠르게 흔들고, 통통 튀듯 위아래로 + 머리는 살짝 좌우로
    const walking = s.pose === 'walking'
    amp.current += ((walking ? 0.6 : 0) - amp.current) * Math.min(1, dt * 10)
    phase.current += dt * (walking ? 12 : 1.5)
    const sw = Math.sin(phase.current) * amp.current
    legL.current!.rotation.x = sw
    legR.current!.rotation.x = -sw
    armL.current!.rotation.x = -sw * 0.9
    armR.current!.rotation.x = sw * 0.9
    body.current!.position.y = Math.abs(Math.sin(phase.current)) * amp.current * 0.07
    // 서 있을 때는 아주 느린 숨쉬기
    const breathe = walking ? 0 : Math.sin(phase.current) * 0.006
    head.current!.position.y = HEAD_Y + breathe
    head.current!.rotation.z = Math.sin(phase.current) * amp.current * 0.06
  })

  return (
    <group ref={root} userData={{ noPick: true }}>
      <group ref={body}>
        <Leg x={-0.085} legRef={legL} />
        <Leg x={0.085} legRef={legR} />
        {/* 엉덩이(바지) + 몸통(카디건) + 셔츠 깃 */}
        <mesh position={[0, 0.46, 0]} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.18, 0.17, 0.12, 8]} />
          {mat(C.pants)}
        </mesh>
        <mesh position={[0, 0.66, 0]} scale={[1, 1, 0.78]} castShadow>
          <cylinderGeometry args={[0.15, 0.19, 0.34, 8]} />
          {mat(C.top)}
        </mesh>
        <mesh position={[0, 0.775, 0.118]} rotation={[0.25, 0, Math.PI]} scale={[1, 1, 0.25]}>
          <coneGeometry args={[0.055, 0.1, 3]} />
          {mat(C.shirt)}
        </mesh>
        <Arm side={-1} armRef={armL} />
        <Arm side={1} armRef={armR} />
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.06, 6]} />
          {mat(C.skin)}
        </mesh>

        {/* 큰 머리 */}
        <group ref={head} position={[0, HEAD_Y, 0]}>
          <mesh scale={[1, 0.94, 0.95]} castShadow>
            <icosahedronGeometry args={[HEAD_R, 2]} />
            {mat(C.skin)}
          </mesh>
          {/* 귀 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * HEAD_R * 0.98, -0.01, 0]} scale={[0.5, 1, 0.8]}>
              <icosahedronGeometry args={[0.06, 0]} />
              {mat(C.skin)}
            </mesh>
          ))}
          {/* 머리카락: 정수리~뒤통수, 앞머리는 이마를 살짝 덮음 */}
          <mesh position={[0, 0.02, -0.01]} rotation-x={-0.3}>
            <sphereGeometry args={[HEAD_R * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            {mat(C.hair)}
          </mesh>
          <mesh position={[0, -0.01, -0.01]}>
            <sphereGeometry args={[HEAD_R * 1.05, 12, 8, Math.PI, Math.PI, 0, Math.PI * 0.78]} />
            {mat(C.hair)}
          </mesh>
          {/* 눈 + 볼 */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.085, -0.02, HEAD_R * 0.9]} scale={[0.8, 1.15, 0.5]}>
                <sphereGeometry args={[0.028, 8, 6]} />
                <meshStandardMaterial color={C.eyes} roughness={0.4} />
              </mesh>
              <mesh position={[s * 0.15, -0.085, HEAD_R * 0.8]} scale={[1.2, 0.7, 0.4]}>
                <sphereGeometry args={[0.03, 8, 6]} />
                <meshStandardMaterial color={C.cheek} roughness={0.9} transparent opacity={0.65} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
