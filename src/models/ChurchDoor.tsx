import { COLORS, LIGHTS } from '../config'

type Props = {
  position: [number, number, number] // 문 아래 가운데 (바닥 높이)
  leafWidth?: number // 문짝 하나 폭
  height?: number
  exitSign?: boolean
  light?: boolean // 문 위 은은한 입구 조명
}

// 교회 양문: 두꺼운 원목 문틀 + 세로 판재 결이 있는 밝은 원목 문짝 2개 + 길쭉한 세로 손잡이.
// 문 앞면은 로컬 -z (예배당 안쪽)를 바라본다.
export function ChurchDoor({ position, leafWidth = 1.5, height = 3.4, exitSign = true, light = false }: Props) {
  const frameW = 0.18
  const totalW = leafWidth * 2
  const woodLight = <meshStandardMaterial color={COLORS.door} roughness={0.55} />
  const woodFrame = <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
  const steel = <meshStandardMaterial color="#e2e0da" metalness={0.25} roughness={0.35} />
  const groove = <meshStandardMaterial color="#8a6a48" roughness={0.7} />
  return (
    <group position={position}>
      {/* 문틀 (양옆 + 위) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (totalW / 2 + frameW / 2), height / 2 + frameW / 2, -0.06]}>
          <boxGeometry args={[frameW, height + frameW, 0.16]} />
          {woodFrame}
        </mesh>
      ))}
      <mesh position={[0, height + frameW / 2, -0.06]}>
        <boxGeometry args={[totalW + frameW * 2, frameW, 0.16]} />
        {woodFrame}
      </mesh>
      {/* 문짝 2개 */}
      {[-1, 1].map((s) => {
        const cx = (s * leafWidth) / 2
        return (
          <group key={s} position={[cx, height / 2, -0.04]}>
            <mesh>
              <boxGeometry args={[leafWidth - 0.02, height, 0.08]} />
              {woodLight}
            </mesh>
            {/* 세로 판재 홈 */}
            {[-0.25, 0.25].map((f) => (
              <mesh key={f} position={[f * leafWidth, 0, -0.042]}>
                <boxGeometry args={[0.012, height - 0.1, 0.004]} />
                {groove}
              </mesh>
            ))}
            {/* 가운데 쪽 길쭉한 세로 손잡이 (스테인리스 + 어두운 홈) */}
            <group position={[-s * (leafWidth / 2 - 0.16), -0.05, -0.1]}>
              <mesh>
                <boxGeometry args={[0.05, height * 0.48, 0.04]} />
                {steel}
              </mesh>
              <mesh position={[0, 0, -0.021]}>
                <boxGeometry args={[0.022, height * 0.4, 0.004]} />
                <meshStandardMaterial color="#1c1c20" roughness={0.6} />
              </mesh>
              {[-1, 1].map((e) => (
                <mesh key={e} position={[0, (e * height * 0.48) / 2 - e * 0.03, 0.04]}>
                  <boxGeometry args={[0.03, 0.03, 0.08]} />
                  {steel}
                </mesh>
              ))}
            </group>
          </group>
        )
      })}
      {light && (
        <pointLight
          position={[0, height + 0.4, -1.2]}
          color={LIGHTS.entranceLight.color}
          intensity={LIGHTS.entranceLight.intensity}
          distance={LIGHTS.entranceLight.distance}
          decay={2}
        />
      )}
      {/* 비상구 표시등 (은은한 초록) */}
      {exitSign && (
        <mesh position={[0, height + frameW + 0.22, -0.05]}>
          <boxGeometry args={[0.5, 0.18, 0.06]} />
          <meshStandardMaterial color="#2f8a4e" emissive="#2fae5c" emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  )
}
