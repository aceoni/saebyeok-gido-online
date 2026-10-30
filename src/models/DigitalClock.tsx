import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CLOCK } from '../config'

type Props = { position: [number, number, number]; rotationY?: number }

// 7-세그먼트 숫자: 각 숫자에서 켜지는 세그먼트 (a b c d e f g)
const DIGIT_SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

// 숫자 하나를 (x, y) 기준 폭 w, 높이 h 로 그린다. 꺼진 세그먼트도 아주 어둡게 그려 실제 LED 시계처럼.
function drawDigit(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, w: number, h: number) {
  const t = w * 0.18 // 세그먼트 두께
  const on = DIGIT_SEGMENTS[ch] ?? ''
  const half = h / 2
  const segs: Record<string, [number, number, number, number]> = {
    a: [x + t, y, w - 2 * t, t],
    b: [x + w - t, y + t, t, half - 1.5 * t],
    c: [x + w - t, y + half + t / 2, t, half - 1.5 * t],
    d: [x + t, y + h - t, w - 2 * t, t],
    e: [x, y + half + t / 2, t, half - 1.5 * t],
    f: [x, y + t, t, half - 1.5 * t],
    g: [x + t, y + half - t / 2, w - 2 * t, t],
  }
  for (const [name, [sx, sy, sw, sh]] of Object.entries(segs)) {
    const lit = on.includes(name)
    ctx.fillStyle = lit ? CLOCK.digitColor : CLOCK.offColor
    ctx.shadowBlur = lit ? t * 1.2 : 0
    ctx.fillRect(sx, sy, sw, sh)
  }
}

function drawClock(canvas: HTMLCanvasElement, hh: string, mm: string, colon: boolean) {
  const ctx = canvas.getContext('2d')!
  const { width: W, height: H } = canvas
  ctx.shadowBlur = 0
  ctx.fillStyle = '#060606'
  ctx.fillRect(0, 0, W, H)
  ctx.shadowColor = CLOCK.digitColor
  const dw = W * 0.15
  const dh = H * 0.7
  const y = (H - dh) / 2
  const xs = [W * 0.06, W * 0.24, W * 0.6, W * 0.78]
  ;[hh[0], hh[1], mm[0], mm[1]].forEach((ch, i) => drawDigit(ctx, ch, xs[i], y, dw, dh))
  // 깜빡이는 콜론
  ctx.fillStyle = colon ? CLOCK.digitColor : CLOCK.offColor
  ctx.shadowBlur = colon ? dw * 0.2 : 0
  const r = dw * 0.11
  for (const cy of [H * 0.36, H * 0.64]) {
    ctx.beginPath()
    ctx.arc(W / 2, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 설교자가 볼 수 있게 2층 난간 앞면에 다는 빨간 디지털 시계. 보는 사람 컴퓨터의 현재 시각(HH:MM)을 보여준다.
// 앞면 = 로컬 +z
export function DigitalClock({ position, rotationY = 0 }: Props) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 160
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [canvas])
  const last = useRef('')

  // 초가 바뀔 때만 다시 그린다 (콜론 깜빡임)
  useFrame(() => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const colon = now.getSeconds() % 2 === 0
    const key = `${hh}${mm}${colon}`
    if (key === last.current) return
    last.current = key
    drawClock(canvas, hh, mm, colon)
    texture.needsUpdate = true
  })

  const w = CLOCK.width
  const h = (w * 160) / 512
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color="#141416" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={CLOCK.glow}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}
