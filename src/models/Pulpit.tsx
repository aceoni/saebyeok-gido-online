import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, PULPIT, SCREEN } from '../config'

type Props = { position: [number, number, number] }

function drawMotto(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  ctx.fillStyle = COLORS.pulpitAcrylic
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#6f6a62'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(h * 0.5)}px ${SCREEN.font}`
  ctx.letterSpacing = `${Math.round(h * 0.08)}px`
  ctx.fillText(PULPIT.motto, w / 2, h / 2 + h * 0.04)
}

// 구스넥 마이크: 상판 뒤쪽에서 설교자(-z) 쪽으로 휘어 올라감
function GooseneckMic({ x }: { x: number }) {
  const metal = <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
  return (
    <group position={[x, 0, -0.18]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.03, 8]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.17, -0.03]} rotation-x={-0.2}>
        <cylinderGeometry args={[0.006, 0.006, 0.3, 5]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.34, -0.12]} rotation-x={-0.95}>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 5]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.39, -0.19]} rotation-x={-1.3}>
        <cylinderGeometry args={[0.014, 0.011, 0.07, 8]} />
        {metal}
      </mesh>
    </group>
  )
}

// 반투명 흰색 아크릴 강대상 (회중 쪽 = +z 를 바라봄). 안쪽이 은은하게 빛나는 느낌.
export function Pulpit({ position }: Props) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 96
    drawMotto(c)
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [canvas])
  useEffect(() => {
    document.fonts?.load(`48px ${SCREEN.font}`).then(() => {
      drawMotto(canvas)
      texture.needsUpdate = true
    })
  }, [canvas, texture])

  const acrylic = (
    <meshStandardMaterial
      color={COLORS.pulpitAcrylic}
      emissive={COLORS.pulpitGlow}
      emissiveIntensity={PULPIT.glow}
      roughness={0.25}
      transparent
      opacity={0.88}
    />
  )
  const colH = 0.95
  const topY = 0.06 + colH

  return (
    <group position={position}>
      {/* 받침판 */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.06, 0.55]} />
        {acrylic}
      </mesh>
      {/* 기둥: 위가 넓어지는 사각 기둥 (4각 원기둥을 45° 돌려 만듦) */}
      <mesh position={[0, 0.06 + colH / 2, 0]} rotation-y={Math.PI / 4} scale={[1, 1, 0.62]} castShadow>
        <cylinderGeometry args={[0.46, 0.36, colH, 4, 1]} />
        {acrylic}
      </mesh>
      {/* 상판 (설교자 쪽으로 기울어짐) + 앞쪽 문구 띠 */}
      <mesh position={[0, topY + 0.05, -0.02]} rotation-x={0.12} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.08, 0.6]} />
        {acrylic}
      </mesh>
      <mesh position={[0, topY + 0.06, 0.29]}>
        <boxGeometry args={[1.0, 0.13, 0.03]} />
        {acrylic}
      </mesh>
      <mesh position={[0, topY + 0.06, 0.306]}>
        <planeGeometry args={[0.92, 0.086]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={PULPIT.glow * 1.5} roughness={0.4} />
      </mesh>
      {/* 마이크 2개 */}
      <group position={[0, topY + 0.1, 0]}>
        <GooseneckMic x={-0.2} />
        <GooseneckMic x={0.2} />
      </group>
    </group>
  )
}
