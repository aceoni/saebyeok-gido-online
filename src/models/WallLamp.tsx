import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, LIGHTS } from '../config'

type Props = { position: [number, number, number]; seed: number }

const GLOW_W = 3.4
const GLOW_UP = 3.6 // 등 위로 퍼지는 길이
const GLOW_DOWN = 0.25 // 갓 바로 아래 아주 짧은 번짐
const FAN_HALF_ANGLE = 0.85 // 부채꼴 반각 (rad, 약 49° → 전체 약 97°)

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

// 벽에 번지는 부채꼴 빛 (모든 벽등이 공유하는 텍스처). 위로만 퍼지고 옆/아래로는 거의 없음.
let glowTexture: THREE.CanvasTexture | null = null
function getGlowTexture() {
  if (glowTexture) return glowTexture
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 256
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(c.width, c.height)
  const pxPerM = c.height / (GLOW_UP + GLOW_DOWN)
  const lampY = GLOW_UP * pxPerM
  const cx = c.width / 2
  const tan = Math.tan(FAN_HALF_ANGLE)
  for (let py = 0; py < c.height; py++) {
    for (let px = 0; px < c.width; px++) {
      const dx = px + 0.5 - cx
      const up = lampY - (py + 0.5) // 등 위쪽으로의 거리(px)
      const r = Math.hypot(dx, up)
      let a = 0
      if (up > 0) {
        const halfW = 5 + up * tan
        const angular = 1 - smooth(0.45, 1, Math.abs(dx) / halfW)
        const radial = Math.pow(1 - up / lampY, 1.5)
        a = 0.75 * angular * radial
      }
      a += 0.35 * Math.exp(-((r / 9) ** 2)) // 갓 주변 작은 빛무리
      a *= 1 - smooth(0.7, 1, Math.abs(dx) / cx) // 텍스처 가장자리에서 경계가 보이지 않게
      a *= 1 - smooth(0.85, 1, up / lampY)
      const i = (py * c.width + px) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
      img.data[i + 3] = Math.round(Math.min(1, a) * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  glowTexture = new THREE.CanvasTexture(c)
  return glowTexture
}

// 측벽 업라이트 벽등: 반원 갓에서 위쪽으로 은은하게 벽을 비춤 (그림자 없음, 미세한 깜빡임)
export function WallLamp({ position, seed }: Props) {
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  const inward = position[0] < 0 ? 1 : -1 // 벽에서 안쪽 방향
  const { color, intensity, distance, flicker, glow: glowOpacity } = LIGHTS.wallLamp
  const texture = useMemo(getGlowTexture, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 13.7
    const f = 1 + flicker * (0.6 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 3.7 + 1) + 0.1 * Math.sin(t * 11.3))
    if (light.current) light.current.intensity = intensity * f
    if (glow.current) glow.current.opacity = glowOpacity * f
  })

  const wallX = -inward * 0.24 // 벽 표면 (그룹 기준)
  return (
    <group position={position}>
      {/* 벽에 번지는 빛 */}
      <mesh position={[wallX + inward * 0.01, (GLOW_UP - GLOW_DOWN) / 2, 0]} rotation-y={(inward * Math.PI) / 2}>
        <planeGeometry args={[GLOW_W, GLOW_UP + GLOW_DOWN]} />
        <meshBasicMaterial
          ref={glow}
          map={texture}
          color={color}
          transparent
          opacity={glowOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* 반원 갓 (위가 넓게 열린 그릇 모양) */}
      <mesh position={[wallX, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.09, 0.16, 10, 1, false, inward > 0 ? 0 : Math.PI, Math.PI]} />
        <meshStandardMaterial color={COLORS.lampShade} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <pointLight
        ref={light}
        position={[wallX + inward * 0.9, 0.8, 0]}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={2}
      />
    </group>
  )
}
