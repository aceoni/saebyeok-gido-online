import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { BANNER, COLORS, SCREEN } from '../config'

type Props = { position: [number, number, number] }

function draw(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, COLORS.banner[0])
  g.addColorStop(1, COLORS.banner[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = COLORS.bannerText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(h * 0.52)}px ${SCREEN.font}`
  ctx.fillText(BANNER.text, w / 2, h / 2 + h * 0.03)
}

// 천장 꼭대기 현수막: 천에 인쇄된 느낌이라 장면 조명을 받되, 어둠 속에서도 읽히게 약하게 자체 발광
export function Banner({ position }: Props) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1536
    c.height = Math.round((1536 * BANNER.height) / BANNER.width)
    draw(c)
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [canvas])

  useEffect(() => {
    document.fonts?.load(`bold 48px ${SCREEN.font}`).then(() => {
      draw(canvas)
      texture.needsUpdate = true
    })
  }, [canvas, texture])

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[BANNER.width, BANNER.height]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.35} roughness={1} />
      </mesh>
      {/* 위아래 봉 */}
      {[BANNER.height / 2, -BANNER.height / 2].map((y) => (
        <mesh key={y} position={[0, y, 0.03]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, BANNER.width + 0.3, 6]} />
          <meshStandardMaterial color="#c9c4ba" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
