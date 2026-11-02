import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config'
import type { Avatar } from '../data/avatars'
import type { Pose } from '../store/player'

// 귀여운 SD(약 2.5등신) 로우폴리 캐릭터. 큰 머리 + 짧은 몸과 팔다리, 키 약 1.2m. 앞 = 로컬 +z.
// 위치/방향/자세는 read() 로 매 프레임 읽어 ref 로 직접 갱신한다 (내 캐릭터 = player store, 다른 사람 = 네트워크 상태).
// 아바타(머리 모양·옷 색)는 data/avatars.ts
const C = COLORS.character
const HIP_Y = 0.42
const SHOULDER_Y = 0.8
const HEAD_R = 0.26
const HEAD_SCALE = 0.8 // 머리 크기 비율 (1 = 처음의 아주 큰 SD 머리)
const HEAD_Y = 0.86 + HEAD_R * 0.9 * HEAD_SCALE // 목 위에 얹히도록
export const CHARACTER_TOP = HEAD_Y + HEAD_R * HEAD_SCALE // 머리 꼭대기 높이 (이름표·말풍선 위치)

export type CharacterState = { position: [number, number, number]; rotY: number; pose: Pose; kneel?: boolean }

const mat = (color: string) => <meshStandardMaterial color={color} roughness={0.85} flatShading />
// 피부(얼굴·귀·손)는 각지지 않게 매끈한 구
const skinMat = <meshStandardMaterial color={C.skin} roughness={0.75} />

const THIGH = 0.19 // 허벅지 길이 (엉덩이 관절 → 무릎)
const SHIN = 0.16

/** 다리: 엉덩이 관절(legRef) + 무릎 관절(kneeRef). 무릎은 + 방향으로 굽음 (정강이가 뒤로) */
function Leg({
  x,
  legRef,
  kneeRef,
  color,
}: {
  x: number
  legRef: React.RefObject<THREE.Group | null>
  kneeRef: React.RefObject<THREE.Group | null>
  color: string
}) {
  return (
    <group ref={legRef} position={[x, HIP_Y, 0]}>
      <mesh position={[0, -THIGH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.071, THIGH + 0.02, 7]} />
        {mat(color)}
      </mesh>
      <group ref={kneeRef} position={[0, -THIGH, 0]}>
        <mesh position={[0, -SHIN / 2, 0]} castShadow>
          <cylinderGeometry args={[0.071, 0.066, SHIN + 0.02, 7]} />
          {mat(color)}
        </mesh>
        <mesh position={[0, -SHIN - 0.02, 0.035]} scale={[1, 0.7, 1.35]}>
          <icosahedronGeometry args={[0.085, 0]} />
          {mat(C.shoes)}
        </mesh>
      </group>
    </group>
  )
}

function Arm({ side, armRef, color }: { side: -1 | 1; armRef: React.RefObject<THREE.Group | null>; color: string }) {
  return (
    <group ref={armRef} position={[side * 0.2, SHOULDER_Y, 0]}>
      {/* 몸에서 살짝 벌어지게 */}
      <group rotation-z={side * 0.18}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.056, 0.05, 0.3, 7]} />
          {mat(color)}
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.058, 16, 12]} />
          {skinMat}
        </mesh>
      </group>
    </group>
  )
}

/** 머리 모양 (머리 그룹 안, 머리 중심 기준) */
function Hair({ avatar }: { avatar: Avatar }) {
  const m = mat(avatar.hair)
  const style = avatar.hairStyle
  return (
    <>
      {/* 정수리~뒤통수 (공통) */}
      <mesh position={[0, 0.02, -0.01]} rotation-x={-0.3}>
        <sphereGeometry args={[HEAD_R * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        {m}
      </mesh>
      <mesh position={[0, -0.01, -0.01]}>
        <sphereGeometry args={[HEAD_R * 1.05, 12, 8, Math.PI, Math.PI, 0, Math.PI * (style === 'bob' ? 0.86 : 0.78)]} />
        {m}
      </mesh>
      {style === 'sidePart' && (
        // 옆으로 넘긴 앞머리
        <mesh position={[0.07, 0.17, 0.16]} rotation={[-0.5, 0, -0.5]} scale={[1.5, 0.45, 0.8]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          {m}
        </mesh>
      )}
      {style === 'long' && (
        <>
          {/* 어깨 아래로 내려오는 긴 머리 */}
          <mesh position={[0, -0.24, -0.1]} scale={[1, 1, 0.55]}>
            <cylinderGeometry args={[HEAD_R * 0.95, HEAD_R * 0.85, 0.42, 12, 1, true, Math.PI * 0.5, Math.PI]} />
            <meshStandardMaterial color={avatar.hair} roughness={0.85} flatShading side={THREE.DoubleSide} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * HEAD_R * 0.9, -0.14, 0.02]} scale={[0.45, 1.6, 0.7]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              {m}
            </mesh>
          ))}
        </>
      )}
      {style === 'bob' && (
        <>
          {/* 턱선까지 오는 단발 + 일자 앞머리 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * HEAD_R * 0.92, -0.07, -0.01]} scale={[0.5, 1.15, 1.05]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              {m}
            </mesh>
          ))}
          <mesh position={[0, 0.13, 0.17]} rotation-x={-0.35} scale={[1.9, 0.5, 0.8]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            {m}
          </mesh>
        </>
      )}
    </>
  )
}

export function Character({
  avatar,
  read,
  hideWhenPraying = false,
  children,
}: {
  avatar: Avatar
  read: () => CharacterState
  hideWhenPraying?: boolean // 내 캐릭터: 기도 중엔 1인칭이라 숨김
  children?: ReactNode // 캐릭터를 따라다니는 것 (이름표, 말풍선)
}) {
  const root = useRef<THREE.Group>(null)
  const model = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const kneeL = useRef<THREE.Group>(null)
  const kneeR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)
  const phase = useRef(0)
  const amp = useRef(0)

  useFrame((_, dt) => {
    const s = read()
    if (!root.current) return
    root.current.position.set(...s.position)
    model.current!.rotation.y = s.rotY
    model.current!.visible = !(hideWhenPraying && s.pose === 'praying')

    const walking = s.pose === 'walking'
    const seated = s.pose === 'sitting' || s.pose === 'praying'
    const k = Math.min(1, dt * 8) // 자세 전환 부드러움
    amp.current += ((walking ? 0.6 : 0) - amp.current) * Math.min(1, dt * 10)
    phase.current += dt * (walking ? 12 : 1.5)
    const sw = Math.sin(phase.current) * amp.current

    // 다리: 걷기 흔들림 / 앉으면 앞으로 90° / 무릎 꿇으면 뒤로
    // 의자: 허벅지 앞으로 + 정강이는 아래로 / 무릎 꿇기(정좌): 허벅지 앞으로 눕히고 정강이를 허벅지 밑으로 완전히 접음
    const legBase = seated ? (s.kneel ? -1.52 : -1.45) : 0
    const kneeBase = seated ? (s.kneel ? 3.02 : 1.3) : 0
    legL.current!.rotation.x += (legBase + sw - legL.current!.rotation.x) * k
    legR.current!.rotation.x += (legBase - sw - legR.current!.rotation.x) * k
    // 걸을 때는 뒤로 보내는 다리의 무릎이 살짝 굽음
    kneeL.current!.rotation.x += (kneeBase + Math.max(0, sw) * 0.7 - kneeL.current!.rotation.x) * k
    kneeR.current!.rotation.x += (kneeBase + Math.max(0, -sw) * 0.7 - kneeR.current!.rotation.x) * k
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
    // 눈: 기도할 때 감음 (세로로 납작한 선)
    const eyeY = praying ? 0.16 : 1.15
    for (const e of [eyeL.current, eyeR.current]) if (e) e.scale.y += (eyeY - e.scale.y) * Math.min(1, dt * 6)
  })

  const skirtH = avatar.skirt === 'long' ? 0.36 : 0.22
  return (
    <group ref={root} userData={{ noPick: true }}>
      <group ref={model}>
        <group ref={body}>
          <Leg x={-0.085} legRef={legL} kneeRef={kneeL} color={avatar.skirt ? '#4a4044' : avatar.bottom} />
          <Leg x={0.085} legRef={legR} kneeRef={kneeR} color={avatar.skirt ? '#4a4044' : avatar.bottom} />
          {/* 엉덩이(바지) 또는 치마 + 몸통(카디건) + 셔츠 깃 */}
          {avatar.skirt ? (
            <mesh position={[0, 0.5 - skirtH / 2, 0]} scale={[1, 1, 0.85]} castShadow>
              <cylinderGeometry args={[0.17, avatar.skirt === 'long' ? 0.25 : 0.23, skirtH + 0.08, 10]} />
              {mat(avatar.bottom)}
            </mesh>
          ) : (
            <mesh position={[0, 0.46, 0]} scale={[1, 1, 0.8]}>
              <cylinderGeometry args={[0.18, 0.17, 0.12, 8]} />
              {mat(avatar.bottom)}
            </mesh>
          )}
          <mesh position={[0, 0.66, 0]} scale={[1, 1, 0.78]} castShadow>
            <cylinderGeometry args={[0.15, 0.19, 0.34, 8]} />
            {mat(avatar.top)}
          </mesh>
          <mesh position={[0, 0.775, 0.118]} rotation={[0.25, 0, Math.PI]} scale={[1, 1, 0.25]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            {mat(avatar.shirt)}
          </mesh>
          <Arm side={-1} armRef={armL} color={avatar.top} />
          <Arm side={1} armRef={armR} color={avatar.top} />
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
            <Hair avatar={avatar} />
            {/* 눈 + 볼 */}
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh ref={s < 0 ? eyeL : eyeR} position={[s * 0.085, -0.02, HEAD_R * 0.9]} scale={[0.8, 1.15, 0.5]}>
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
      {children}
    </group>
  )
}
