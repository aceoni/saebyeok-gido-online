import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { COLORS, LIGHTS, SCREEN } from '../config'

RectAreaLightUniformsLib.init()

type Props = {
  width: number
  height: number
  text: string
  /** 숨 쉬듯 밝기 변화 + RectAreaLight */
  main?: boolean
  fontScale?: number
}

const TEX_W = 1024

// 배경: 대각선 그라데이션 + 왼쪽 위에서 퍼지는 은은한 등고선 무늬
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const [c0, c1, c2] = SCREEN.background
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, c0)
  g.addColorStop(0.55, c1)
  g.addColorStop(1, c2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const cx = w * 0.12
  const cy = h * 0.18
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 16; i++) {
    const r = 30 + i * 42
    ctx.beginPath()
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2
      const wobble = 1 + 0.08 * Math.sin(a * 3 + i * 0.7) + 0.05 * Math.sin(a * 5 - i)
      const x = cx + Math.cos(a) * r * wobble * 1.25
      const y = cy + Math.sin(a) * r * wobble
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // 가장자리를 살짝 어둡게
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75)
  v.addColorStop(0, 'rgba(0, 0, 0, 0)')
  v.addColorStop(1, 'rgba(10, 15, 40, 0.35)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
}

function drawText(canvas: HTMLCanvasElement, text: string, fontScale: number) {
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  drawBackground(ctx, w, h)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // 긴 문구는 화면 폭의 85% 안에 들어가도록 글자 크기를 줄인다
  let size = Math.round(h * 0.12 * fontScale)
  ctx.font = `${size}px ${SCREEN.font}`
  const textW = ctx.measureText(text).width
  if (textW > w * 0.85) {
    size = Math.floor((size * w * 0.85) / textW)
    ctx.font = `${size}px ${SCREEN.font}`
  }
  ctx.shadowColor = 'rgba(30, 40, 90, 0.45)'
  ctx.shadowBlur = size * 0.4
  ctx.fillText(text, w / 2, h / 2)
}

/** 자체 발광 스크린. text가 바뀌면 천천히 페이드아웃 → 교체 → 페이드인 */
export function Screen({ width, height, text, main = false, fontScale = 1 }: Props) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_W
    c.height = Math.round((TEX_W * height) / width)
    return c
  }, [width, height])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [canvas])

  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const lightRef = useRef<THREE.RectAreaLight>(null)
  const shown = useRef<string | null>(null)
  const target = useRef(text)
  const fade = useRef(0) // 0 ~ 1
  target.current = text

  // 웹폰트가 늦게 로드되면 다시 그린다
  useEffect(() => {
    document.fonts?.load(`48px ${SCREEN.font}`).then(() => {
      if (shown.current !== null) {
        drawText(canvas, shown.current, fontScale)
        texture.needsUpdate = true
      }
    })
  }, [canvas, texture, fontScale])

  useEffect(() => {
    lightRef.current?.lookAt(0, 1.5, 10)
  }, [])

  useFrame(({ clock }, dt) => {
    const step = dt / SCREEN.fadeSeconds
    if (shown.current !== target.current) {
      fade.current = Math.max(0, fade.current - step)
      if (fade.current === 0) {
        shown.current = target.current
        drawText(canvas, shown.current, fontScale)
        texture.needsUpdate = true
      }
    } else {
      fade.current = Math.min(1, fade.current + step)
    }
    const { period, depth } = LIGHTS.screenBreath
    const breath = main ? 1 - depth / 2 + (depth / 2) * Math.sin((clock.elapsedTime * Math.PI * 2) / period) : 1
    const k = (0.25 + 0.75 * fade.current) * breath * SCREEN.brightness
    matRef.current?.color.setScalar(k)
    if (lightRef.current) lightRef.current.intensity = LIGHTS.screenRect.intensity * k
  })

  const frame = 0.12
  return (
    <group>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[width + frame * 2, height + frame * 2, 0.06]} />
        <meshStandardMaterial color={COLORS.screenFrame} roughness={0.6} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={matRef} map={texture} toneMapped={false} />
      </mesh>
      {main && (
        <rectAreaLight
          ref={lightRef}
          position={[0, 0, 0.05]}
          width={width}
          height={height}
          color={LIGHTS.screenRect.color}
          intensity={LIGHTS.screenRect.intensity}
        />
      )}
    </group>
  )
}
