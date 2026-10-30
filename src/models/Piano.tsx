import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, LIGHTS } from '../config'

type Props = { position: [number, number, number]; rotationY?: number }

// 스탠드형 디지털 키보드 (로컬 좌표: 건반 = +z 쪽, 연주자는 -z 를 바라봄)
const W = 1.36 // 본체 폭
const KEY_Y = 0.9 // 건반 높이
const WHITE_COUNT = 52 // 88건반 기준 흰건반 수
const whiteW = (W - 0.08) / WHITE_COUNT

// 검은건반 x 위치: 옥타브마다 흰건반 사이 [0,1], [1,2], [3,4], [4,5], [5,6] 경계
const blackXs: number[] = []
for (let i = 0; i < WHITE_COUNT - 1; i++) {
  const inOctave = (i + 5) % 7 // A0 에서 시작 → C 기준으로 맞춤
  if (inOctave !== 2 && inOctave !== 6) blackXs.push(-W / 2 + 0.04 + (i + 1) * whiteW)
}

function BlackKeys() {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    blackXs.forEach((x, i) => ref.current!.setMatrixAt(i, m.makeTranslation(x, KEY_Y + 0.025, 0.06)))
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blackXs.length]}>
      <boxGeometry args={[whiteW * 0.55, 0.02, 0.09]} />
      <meshStandardMaterial color="#0a0a0c" roughness={0.4} />
    </instancedMesh>
  )
}

export function Piano({ position, rotationY = 0 }: Props) {
  const black = <meshStandardMaterial color={COLORS.piano} roughness={0.35} metalness={0.15} />

  return (
    <group position={position} rotation-y={rotationY}>
      {/* 본체 */}
      <mesh position={[0, KEY_Y - 0.02, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.11, 0.36]} />
        {black}
      </mesh>
      {/* 흰건반 판 + 검은건반 */}
      <mesh position={[0, KEY_Y + 0.04, 0.04]}>
        <boxGeometry args={[W - 0.08, 0.02, 0.15]} />
        <meshStandardMaterial color={COLORS.pianoKeys} roughness={0.45} />
      </mesh>
      <BlackKeys />
      {/* 보면대 */}
      <mesh position={[0, KEY_Y + 0.2, -0.17]} rotation-x={-0.22}>
        <boxGeometry args={[0.7, 0.26, 0.015]} />
        {black}
      </mesh>
      {/* 테이블형 스탠드: 양옆 다리 + 가로 지지대 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.08), 0, -0.05]}>
          <mesh position={[0, (KEY_Y - 0.07) / 2, 0]} castShadow>
            <boxGeometry args={[0.04, KEY_Y - 0.07, 0.04]} />
            {black}
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.05, 0.04, 0.42]} />
            {black}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, -0.05]}>
        <boxGeometry args={[W - 0.16, 0.03, 0.03]} />
        {black}
      </mesh>
      {/* 서스테인 페달 */}
      <mesh position={[0.08, 0.02, 0.12]}>
        <boxGeometry args={[0.08, 0.03, 0.2]} />
        {black}
      </mesh>
      {/* 의자 */}
      <group position={[0, 0, 0.62]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 0.07, 0.34]} />
          {black}
        </mesh>
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]}>
            <boxGeometry args={[0.04, 0.48, 0.28]} />
            {black}
          </mesh>
        ))}
      </group>
      <PianoLamp />
    </group>
  )
}

// 보면대 옆 작은 스탠드 조명
function PianoLamp() {
  return (
    <group position={[0.52, KEY_Y + 0.03, -0.15]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 8]} />
        <meshStandardMaterial color="#8a7448" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 5]} />
        <meshStandardMaterial color="#8a7448" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.045, 0.09, 0.09, 8, 1, true]} />
        <meshStandardMaterial
          color={COLORS.lampShade}
          emissive={LIGHTS.pianoLamp.color}
          emissiveIntensity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        position={[0, 0.25, 0.05]}
        color={LIGHTS.pianoLamp.color}
        intensity={LIGHTS.pianoLamp.intensity}
        distance={LIGHTS.pianoLamp.distance}
        decay={2}
      />
    </group>
  )
}
