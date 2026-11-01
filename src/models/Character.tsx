import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config'
import { usePlayer } from '../store/player'

// 귀여운 SD(약 2.5등신) 로우폴리 캐릭터. 큰 머리 + 짧은 몸과 팔다리, 키 약 1.2m. 앞 = 로컬 +z.
// 위치/방향/자세는 player store 에서 매 프레임 읽어 ref 로 직접 갱신한다.
const C = COLORS.character
const HIP_Y = 0.42
const SHOULDER_Y = 0.8
const HEAD_R = 0.26
const HEAD_SCALE = 0.8 // 머리 크기 비율 (1 = 처음의 아주 큰 SD 머리)
const HEAD_Y = 0.86 + HEAD_R * 0.9 * HEAD_SCALE // 목 위에 얹히도록

const mat = (color: string) => <meshStandardMaterial color={color} roughness={0.85} flatShading />
// 피부(얼굴·귀·손)는 각지지 않게 매끈한 구
const skinMat = <meshStandardMaterial color={C.skin} roughness={0.75} />

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
          <sphereGeometry args={[0.058, 16, 12]} />
          {skinMat}
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
    // 기도 중에는 1인칭 시점이라 캐릭터를 숨김
    root.current.visible = s.pose !== 'praying'

    const walking = s.pose === 'walking'
    const seated = s.pose === 'sitting' || s.pose === 'praying'
    const k = Math.min(1, dt * 8) // 자세 전환 부드러움
    amp.current += ((walking ? 0.6 : 0) - amp.current) * Math.min(1, dt * 10)
    phase.current += dt * (walking ? 12 : 1.5)
    const sw = Math.sin(phase.current) * amp.current

    // 다리: 걷기 흔들림 / 앉으면 앞으로 90°
    const legBase = seated ? -1.45 : 0
    legL.current!.rotation.x += (legBase + sw - legL.current!.rotation.x) * k
    legR.current!.rotation.x += (legBase - sw - legR.current!.rotation.x) * k
    // 팔: 걷기 흔들림 / 앉으면 무릎 위 / 기도하면 가슴 앞에서 모음
    const praying = s.pose === 'praying'
    const armX = praying ? -1.15 : seated ? -0.45 : 0
    const armZ = praying ? 0.42 : 0
    armL.current!.rotation.x += (armX - sw * 0.9 - armL.current!.rotation.x) * k
    armR.current!.rotation.x += (armX + sw * 0.9 - armR.current!.rotation.x) * k
    // (왼팔은 +z 회전, 오른팔은 -z 회전이 몸 안쪽)
    armL.current!.rotation.z += (armZ - armL.current!.rotation.z) * k
    armR.current!.rotation.z += (-armZ - armR.current!.rotation.z) * k

    body.current!.position.y = Math.abs(Math.sin(phase.current)) * amp.current * 0.07
    // 머리: 걸을 때 살짝 좌우, 기도할 때 숙임, 서 있을 때 아주 느린 숨쉬기
    const breathe = walking ? 0 : Math.sin(phase.current) * 0.006
    head.current!.position.y = HEAD_Y + breathe
    head.current!.rotation.z = Math.sin(phase.current) * amp.current * 0.06
    head.current!.rotation.x += ((praying ? 0.42 : 0) - head.current!.rotation.x) * Math.min(1, dt * 3)
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
          <cylinderGeometry args={[0.05, 0.06, 0.06, 16]} />
          {skinMat}
        </mesh>

        {/* 큰 머리 */}
        <group ref={head} position={[0, HEAD_Y, 0]} scale={HEAD_SCALE}>
          <mesh scale={[1, 0.94, 0.95]} castShadow>
            <sphereGeometry args={[HEAD_R, 40, 28]} />
            {skinMat}
          </mesh>
          {/* 귀 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * HEAD_R * 0.98, -0.01, 0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.06, 16, 12]} />
              {skinMat}
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
