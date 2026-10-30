import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, LIGHTS } from '../config'

type Props = { position: [number, number, number]; seed: number }

const GLOW_W = 2.4
const GLOW_UP = 3.4 // 등 위로 퍼지는 길이
const GLOW_DOWN = 0.8 // 등 아래로 살짝 새는 길이

// 벽에 번지는 부채꼴 빛 (모든 벽등이 공유하는 텍스처)
let glowTexture: THREE.CanvasTexture | null = null
function getGlowTexture() {
  if (glowTexture) return glowTexture
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 256
  const ctx = c.getContext('2d')!
  const lampY = (c.height * GLOW_UP) / (GLOW_UP + GLOW_DOWN)
  // 위로 길게 퍼지는 타원 그라데이션
  ctx.save()
  ctx.translate(c.width / 2, lampY)
  ctx.scale(0.28, 0.95) // 가로 반경이 캔버스 폭 안에 들어오도록 → 가장자리가 잘리지 않음
  const up = ctx.createRadialGradient(0, 0, 0, 0, 0, lampY)
  up.addColorStop(0, 'rgba(255,255,255,0.75)')
  up.addColorStop(0.3, 'rgba(255,255,255,0.3)')
  up.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = up
  ctx.fillRect(-c.width / 0.28, -lampY / 0.95, (c.width * 2) / 0.28, lampY / 0.95)
  ctx.restore()
  // 아래쪽은 짧고 약하게
  ctx.save()
  ctx.translate(c.width / 2, lampY)
  ctx.scale(0.3, 0.9)
  const down = ctx.createRadialGradient(0, 0, 0, 0, 0, c.height - lampY)
  down.addColorStop(0, 'rgba(255,255,255,0.35)')
  down.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = down
  ctx.fillRect(-c.width / 0.3, 0, (c.width * 2) / 0.3, c.height - lampY)
  ctx.restore()
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
