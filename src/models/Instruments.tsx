import { COLORS } from '../config'

type P = { position: [number, number, number]; rotationY?: number }
export type GuitarKind = 'acoustic' | 'electric' | 'bass'

const black = <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
const neckMat = <meshStandardMaterial color="#5a3a22" roughness={0.6} />

// 기타 본체: 아래 큰 원 + 위 작은 원을 납작하게 겹친 로우폴리 모양. 앞면 = +z
function Guitar({ kind, color }: { kind: GuitarKind; color: string }) {
  const body = <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} flatShading />
  const isBass = kind === 'bass'
  const thick = kind === 'acoustic' ? 0.1 : 0.045
  const lower = kind === 'acoustic' ? 0.19 : 0.17
  const upper = kind === 'acoustic' ? 0.15 : 0.13
  const neckLen = isBass ? 0.82 : 0.6
  const neckBase = 0.42
  return (
    <group>
      <mesh position={[0, 0.2, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[lower, lower, thick, 12]} />
        {body}
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[upper, upper, thick, 12]} />
        {body}
      </mesh>
      {kind === 'acoustic' ? (
        <mesh position={[0, 0.3, thick / 2 + 0.002]}>
          <circleGeometry args={[0.05, 12]} />
          {black}
        </mesh>
      ) : (
        <mesh position={[0, 0.24, thick / 2 + 0.002]}>
          <boxGeometry args={[0.16, 0.05, 0.004]} />
          {black}
        </mesh>
      )}
      {/* 넥 + 헤드 */}
      <mesh position={[0, neckBase + neckLen / 2, 0]}>
        <boxGeometry args={[isBass ? 0.06 : 0.05, neckLen, 0.03]} />
        {neckMat}
      </mesh>
      <mesh position={[0, neckBase + neckLen + 0.08, -0.01]} rotation-x={-0.2}>
        <boxGeometry args={[0.08, 0.17, 0.025]} />
        {neckMat}
      </mesh>
    </group>
  )
}

// A자 거치대에 세워 둔 기타. 앞면이 +z(회중) 쪽, 살짝 뒤로 기댐
export function GuitarOnStand({ position, rotationY = 0, kind, color }: P & { kind: GuitarKind; color: string }) {
  return (
    <group position={position} rotation-y={rotationY}>
      {/* 거치대: 세 갈래 다리 + 세로 기둥 + 받침 */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.12, 0.03, -Math.sin(a) * 0.12]} rotation-y={a}>
            <boxGeometry args={[0.26, 0.02, 0.02]} />
            {black}
          </mesh>
        )
      })}
      <mesh position={[0, 0.4, -0.08]} rotation-x={-0.18}>
        <cylinderGeometry args={[0.01, 0.01, 0.78, 5]} />
        {black}
      </mesh>
      <mesh position={[0, 0.2, 0.06]}>
        <boxGeometry args={[0.32, 0.03, 0.08]} />
        {black}
      </mesh>
      <group position={[0, 0.02, 0.03]} rotation-x={-0.18}>
        <Guitar kind={kind} color={color} />
      </group>
    </group>
  )
}

// 등받이 없는 연주자 의자 (스툴)
export function Stool({ position }: P) {
  return (
    <group position={position}>
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 12]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.32, Math.sin(a) * 0.1]} rotation={[-Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12]}>
            <cylinderGeometry args={[0.012, 0.014, 0.66, 5]} />
            <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.25, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.12, 0.01, 4, 12]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
    </group>
  )
}

// 보면대: 세 갈래 다리 + 기둥 + 기울어진 악보대. 악보대 앞면 = 로컬 +z
export function MusicStand({ position, rotationY = 0 }: P) {
  return (
    <group position={position} rotation-y={rotationY}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.14, 0.1, -Math.sin(a) * 0.14]} rotation={[0, a, 0.6]}>
            <boxGeometry args={[0.3, 0.015, 0.015]} />
            {black}
          </mesh>
        )
      })}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.01, 0.012, 0.9, 5]} />
        {black}
      </mesh>
      <group position={[0, 1.08, 0]} rotation-x={-0.35}>
        <mesh>
          <boxGeometry args={[0.5, 0.34, 0.012]} />
          {black}
        </mesh>
        <mesh position={[0, -0.18, 0.03]}>
          <boxGeometry args={[0.5, 0.02, 0.06]} />
          {black}
        </mesh>
        {/* 악보 */}
        <mesh position={[0, 0.01, 0.008]}>
          <planeGeometry args={[0.42, 0.29]} />
          <meshStandardMaterial color="#efe9dc" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

// 관현악 연주자용 일반 의자 (검은 철제 프레임 + 원목 좌판/등받이). 앞면 = 로컬 +z
export function OrchestraChair({ position, rotationY = 0 }: P) {
  const frame = <meshStandardMaterial color="#2a2a2e" metalness={0.4} roughness={0.5} />
  const wood = <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.44, 0.04, 0.42]} />
        {wood}
      </mesh>
      <mesh position={[0, 0.78, -0.21]} rotation-x={-0.12} castShadow>
        <boxGeometry args={[0.42, 0.26, 0.03]} />
        {wood}
      </mesh>
      {(
        [
          [-0.19, 0.18],
          [0.19, 0.18],
          [-0.19, -0.18],
          [0.19, -0.18],
        ] as const
      ).map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.23, z]}>
          <cylinderGeometry args={[0.012, 0.012, 0.46, 5]} />
          {frame}
        </mesh>
      ))}
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.66, -0.2]} rotation-x={-0.12}>
          <cylinderGeometry args={[0.011, 0.011, 0.42, 5]} />
          {frame}
        </mesh>
      ))}
    </group>
  )
}
