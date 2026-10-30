import { COLORS } from '../config'

type P = { position: [number, number, number]; rotationY?: number }

// 드럼 세트. 로컬 +z 쪽(회중)을 바라보고, 드러머는 -z 쪽에 앉는다.
const shell = <meshStandardMaterial color={COLORS.drumShell} roughness={0.35} metalness={0.2} />
const head = <meshStandardMaterial color="#ece6da" roughness={0.8} />
const metal = <meshStandardMaterial color="#b8b8bc" metalness={0.7} roughness={0.35} />
const brass = <meshStandardMaterial color={COLORS.cymbal} metalness={0.8} roughness={0.3} />

function Drum({ r, h, position, tilt = 0 }: { r: number; h: number; position: [number, number, number]; tilt?: number }) {
  return (
    <group position={position} rotation-x={tilt}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, h, 12]} />
        {shell}
      </mesh>
      <mesh position={[0, h / 2 + 0.002, 0]}>
        <cylinderGeometry args={[r * 0.97, r * 0.97, 0.004, 12]} />
        {head}
      </mesh>
    </group>
  )
}

function Stand({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <mesh position={[position[0], height / 2, position[2]]}>
      <cylinderGeometry args={[0.012, 0.012, height, 5]} />
      {metal}
    </mesh>
  )
}

function Cymbal({ position, r, tilt = 0.15 }: { position: [number, number, number]; r: number; tilt?: number }) {
  return (
    <group>
      <Stand position={position} height={position[1]} />
      <mesh position={position} rotation-x={tilt}>
        <cylinderGeometry args={[r * 0.15, r, 0.02, 12]} />
        {brass}
      </mesh>
    </group>
  )
}

export function DrumKit({ position, rotationY = 0 }: P) {
  return (
    <group position={position} rotation-y={rotationY}>
      {/* 드럼 매트 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, -0.2]} receiveShadow>
        <planeGeometry args={[2.2, 2.0]} />
        <meshStandardMaterial color="#3a3436" roughness={1} />
      </mesh>
      {/* 베이스 드럼: 앞(+z)을 향해 눕힘 */}
      <group position={[0, 0.28, 0.25]} rotation-x={Math.PI / 2}>
        <mesh castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.42, 14]} />
          {shell}
        </mesh>
        <mesh position={[0, 0.212, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.004, 14]} />
          {head}
        </mesh>
      </group>
      {/* 탐 2개 (베이스 드럼 위) */}
      <Drum r={0.13} h={0.14} position={[-0.17, 0.72, 0.2]} tilt={-0.35} />
      <Drum r={0.14} h={0.15} position={[0.17, 0.72, 0.2]} tilt={-0.35} />
      {/* 스네어 */}
      <Stand position={[-0.35, 0, -0.2]} height={0.55} />
      <Drum r={0.17} h={0.12} position={[-0.35, 0.6, -0.2]} tilt={-0.1} />
      {/* 플로어 탐 */}
      <Drum r={0.2} h={0.38} position={[0.48, 0.38, -0.2]} />
      {/* 하이햇, 크래시, 라이드 */}
      <Cymbal position={[-0.7, 0.85, -0.15]} r={0.18} tilt={0} />
      <mesh position={[-0.7, 0.81, -0.15]}>
        <cylinderGeometry args={[0.027, 0.18, 0.02, 12]} />
        {brass}
      </mesh>
      <Cymbal position={[-0.5, 1.2, 0.35]} r={0.23} tilt={-0.3} />
      <Cymbal position={[0.65, 1.1, 0.25]} r={0.26} tilt={-0.25} />
      {/* 드럼 의자 */}
      <Stand position={[0, 0, -0.65]} height={0.48} />
      <mesh position={[0, 0.5, -0.65]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 12]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
      </mesh>
    </group>
  )
}
