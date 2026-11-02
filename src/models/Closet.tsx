import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { COLORS } from '../config'
import {
  CLOSET,
  CLOSET_BIBLE,
  CLOSET_CABINET,
  CLOSET_CANDLE,
  CLOSET_CHAIR,
  CLOSET_CROSS,
  CLOSET_DESK,
  CLOSET_DOOR,
  CLOSET_WINDOW,
} from '../scenes/closetLayout'
import { Bible } from './Bible'

RectAreaLightUniformsLib.init()

// 기도 골방: 어두운 나무 오두막 방. 창문으로 새벽빛, 책상 위 촛불과 펼친 성경, 벽의 나무 십자가.
const C = COLORS.closet
const { halfW: W, halfD: D, height: H } = CLOSET
const wood = (color: string, rough = 0.8) => <meshStandardMaterial color={color} roughness={rough} flatShading />

/** 판자 이음매: 벽에 세로로 가는 어두운 줄 (한 벽에 여러 개, InstancedMesh) */
function PlankSeams({ along, length, fixed, axis }: { along: 'x' | 'z'; length: number; fixed: number; axis: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const xs = useMemo(() => {
    const out: number[] = []
    for (let v = -length / 2 + 0.22; v < length / 2; v += 0.22) out.push(v)
    return out
  }, [length])
  useEffect(() => {
    const m = new THREE.Matrix4()
    xs.forEach((v, i) => {
      const p = along === 'x' ? [v, H / 2, fixed] : [fixed, H / 2, v]
      ref.current!.setMatrixAt(i, m.makeTranslation(p[0], p[1], p[2]))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [xs, along, fixed])
  const size: [number, number, number] = along === 'x' ? [0.012, H, 0.006] : [0.006, H, 0.012]
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, xs.length]} userData={{ axis }}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={C.seam} roughness={0.9} />
    </instancedMesh>
  )
}

/** 바닥 판자: 길게 놓인 판자들 (색을 번갈아) */
function FloorPlanks() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = Math.round((W * 2) / 0.18)
  useEffect(() => {
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      ref.current!.setMatrixAt(i, m.makeTranslation(-W + 0.09 + i * 0.18, 0.005, 0))
      ref.current!.setColorAt(i, c.set(i % 3 === 0 ? C.floorDark : i % 3 === 1 ? C.floor : C.floorLight))
    }
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.instanceColor!.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [n])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} receiveShadow>
      <boxGeometry args={[0.172, 0.01, D * 2]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  )
}

/** 벽·바닥·천장. 앞벽에는 창문 구멍, 뒷벽에는 문 */
function Shell() {
  const t = 0.12
  const { x: wx, y: wy, w: ww, h: wh } = CLOSET_WINDOW
  const wall = wood(C.wall, 0.85)
  // 앞벽을 창문 구멍 둘레의 네 조각으로
  const leftW = wx - ww / 2 + W
  const rightW = W - (wx + ww / 2)
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[W * 2, D * 2]} />
        {wood(C.floorDark)}
      </mesh>
      <FloorPlanks />
      {/* 천장 + 들보 */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W * 2, D * 2]} />
        {wood(C.ceiling)}
      </mesh>
      {[-1.4, -0.45, 0.5, 1.45].map((z) => (
        <mesh key={z} position={[0, H - 0.08, z]}>
          <boxGeometry args={[W * 2, 0.16, 0.14]} />
          {wood(C.beam)}
        </mesh>
      ))}
      {/* 좌우 벽 */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (W + t / 2), H / 2, 0]}>
            <boxGeometry args={[t, H, D * 2]} />
            {wall}
          </mesh>
          <PlankSeams along="z" length={D * 2} fixed={s * (W - 0.002)} axis={s} />
        </group>
      ))}
      {/* 앞벽(창문 쪽) */}
      <group position={[0, 0, -D - t / 2]}>
        <mesh position={[-W + leftW / 2, H / 2, 0]}>
          <boxGeometry args={[leftW, H, t]} />
          {wall}
        </mesh>
        <mesh position={[W - rightW / 2, H / 2, 0]}>
          <boxGeometry args={[rightW, H, t]} />
          {wall}
        </mesh>
        <mesh position={[wx, (wy - wh / 2) / 2, 0]}>
          <boxGeometry args={[ww, wy - wh / 2, t]} />
          {wall}
        </mesh>
        <mesh position={[wx, (H + wy + wh / 2) / 2, 0]}>
          <boxGeometry args={[ww, H - wy - wh / 2, t]} />
          {wall}
        </mesh>
      </group>
      <PlankSeams along="x" length={W * 2} fixed={-D + 0.002} axis={0} />
      {/* 뒷벽(문 쪽) */}
      <mesh position={[0, H / 2, D + t / 2]}>
        <boxGeometry args={[W * 2 + t * 2, H, t]} />
        {wall}
      </mesh>
      <PlankSeams along="x" length={W * 2} fixed={D - 0.002} axis={1} />
      {/* 벽 아래 걸레받이 */}
      {[
        [0, -D + 0.02, W * 2, 0.03],
        [0, D - 0.02, W * 2, 0.03],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.07, z]}>
          <boxGeometry args={[w, 0.14, d]} />
          {wood(C.beam)}
        </mesh>
      ))}
    </group>
  )
}

/** 창문: 격자 유리 + 나무 덧문(열림) + 창턱. 바깥은 새벽 하늘빛 */
function Window() {
  const { x, y, w, h } = CLOSET_WINDOW
  const lightRef = useRef<THREE.RectAreaLight>(null)
  useEffect(() => {
    lightRef.current?.lookAt(x, 0.6, 0.5)
  }, [x])
  const frame = wood(C.trim, 0.7)
  return (
    <group position={[x, y, -D]}>
      {/* 바깥 새벽빛 */}
      <mesh position={[0, 0, -0.3]}>
        <planeGeometry args={[w * 1.6, h * 1.6]} />
        <meshBasicMaterial color={C.dawn} toneMapped={false} />
      </mesh>
      {/* 유리 (살짝 빛남) */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={C.glass} emissive={C.glass} emissiveIntensity={0.55} transparent opacity={0.55} roughness={0.2} />
      </mesh>
      {/* 창틀 + 격자 */}
      {[-1, 1].map((s) => (
        <mesh key={`v${s}`} position={[(s * w) / 2, 0, 0]}>
          <boxGeometry args={[0.06, h + 0.06, 0.1]} />
          {frame}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[0, (s * h) / 2, 0]}>
          <boxGeometry args={[w + 0.06, 0.06, 0.1]} />
          {frame}
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[0.04, h, 0.05]} />
        {frame}
      </mesh>
      {[-1 / 6, 1 / 6].map((f) => (
        <mesh key={f} position={[0, f * h * 1.5, 0]}>
          <boxGeometry args={[w, 0.03, 0.05]} />
          {frame}
        </mesh>
      ))}
      {/* 창턱 */}
      <mesh position={[0, -h / 2 - 0.04, 0.1]}>
        <boxGeometry args={[w + 0.24, 0.05, 0.24]} />
        {frame}
      </mesh>
      {/* 열어 둔 나무 덧문 */}
      {[-1, 1].map((s) => (
        <group key={`s${s}`} position={[(s * (w + 0.06)) / 2, 0, 0.05]} rotation-y={s * -1.25}>
          <mesh position={[(s * w) / 4, 0, 0]}>
            <boxGeometry args={[w / 2, h + 0.04, 0.035]} />
            {wood(C.shutter, 0.75)}
          </mesh>
        </group>
      ))}
      {/* 창으로 들어오는 은은한 빛 */}
      <rectAreaLight ref={lightRef} position={[0, 0, 0.05]} width={w} height={h} color={C.dawnLight} intensity={C.dawnIntensity} />
    </group>
  )
}

/** 창에서 바닥으로 비스듬히 내려오는 빛줄기 (가산 혼합 반투명 면 두 장) */
function LightShaft() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 16
    c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createLinearGradient(0, 0, 0, 128)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 16, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  const { x, y, w } = CLOSET_WINDOW
  // 창 위치(y, z=-D) → 바닥(y=0, z≈-0.2) 쪽으로 기울어진 긴 면
  const len = Math.hypot(y, D - 0.2)
  const tilt = Math.atan2(D - 0.2, y)
  return (
    <group position={[x, y, -D]} rotation-x={-tilt}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position={[0, -len / 2, 0]} rotation-y={r} renderOrder={2} userData={{ noPick: true }}>
          <planeGeometry args={[w * 0.95, len]} />
          <meshBasicMaterial
            map={tex}
            color={C.dawnLight}
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/** 사진 같은 다리가 받쳐 주는 작은 나무 책상 */
function Desk() {
  const { pos, w, d, h } = CLOSET_DESK
  const oak = wood(C.oak, 0.65)
  return (
    <group position={pos}>
      <mesh position={[0, h - 0.025, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.05, d]} />
        {oak}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.2), 0, 0]}>
          <mesh position={[0, (h - 0.05) / 2, 0]} castShadow>
            <boxGeometry args={[0.07, h - 0.05, 0.16]} />
            {oak}
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.1, 0.08, d - 0.08]} />
            {oak}
          </mesh>
          <mesh position={[0, h - 0.09, 0]}>
            <boxGeometry args={[0.08, 0.06, d - 0.12]} />
            {oak}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[w - 0.4, 0.06, 0.05]} />
        {oak}
      </mesh>
    </group>
  )
}

/** 등받이 높은 나무 의자 (옆판 막힘). 로컬 앞 = +z */
function HighChair() {
  const { pos, rotY, seatTop } = CLOSET_CHAIR
  const oak = wood(C.oakDark, 0.7)
  return (
    <group position={pos} rotation-y={rotY}>
      <mesh position={[0, seatTop - 0.025, 0.02]} castShadow>
        <boxGeometry args={[0.52, 0.05, 0.46]} />
        {oak}
      </mesh>
      <mesh position={[0, seatTop + 0.42, -0.22]} castShadow>
        <boxGeometry args={[0.52, 0.86, 0.05]} />
        {oak}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.27, seatTop / 2 + 0.06, 0]} castShadow>
            <boxGeometry args={[0.04, seatTop + 0.12, 0.5]} />
            {oak}
          </mesh>
          {/* 팔걸이 */}
          <mesh position={[s * 0.27, seatTop + 0.2, 0.02]}>
            <boxGeometry args={[0.06, 0.04, 0.5]} />
            {oak}
          </mesh>
          <mesh position={[s * 0.27, seatTop + 0.1, 0.22]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            {oak}
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** 왼쪽 벽의 작은 장 (선반 + 책 몇 권). 앞면 = +x */
function Cabinet() {
  const { pos, w, d, h } = CLOSET_CABINET
  const oak = wood(C.oak, 0.7)
  const books = ['#5a2b24', '#2f3b52', '#6b5a3a', '#3c4a34', '#4a2f3d']
  return (
    <group position={pos}>
      {[0.04, h * 0.48, h - 0.03].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[w, 0.04, d]} />
          {oak}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, h / 2, (s * d) / 2]}>
          <boxGeometry args={[w, h, 0.04]} />
          {oak}
        </mesh>
      ))}
      <mesh position={[-w / 2 + 0.02, h / 2, 0]}>
        <boxGeometry args={[0.03, h, d]} />
        {oak}
      </mesh>
      {books.map((c, i) => (
        <mesh key={c} position={[0.02, h * 0.48 + 0.13, -d / 2 + 0.12 + i * 0.07]} rotation-x={i === 4 ? -0.25 : 0}>
          <boxGeometry args={[0.22, 0.24, 0.05]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.05, 0.12, 0.2]}>
        <cylinderGeometry args={[0.07, 0.08, 0.16, 10]} />
        <meshStandardMaterial color="#6e5a44" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** 벽에 건 소박한 나무 십자가 */
function Cross() {
  return (
    <group position={CLOSET_CROSS}>
      <mesh>
        <boxGeometry args={[0.06, 0.52, 0.04]} />
        {wood(C.cross, 0.7)}
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.32, 0.06, 0.04]} />
        {wood(C.cross, 0.7)}
      </mesh>
    </group>
  )
}

/** 촛불: 받침 + 초 + 흔들리는 불꽃 + 따뜻한 빛 */
function Candle() {
  const light = useRef<THREE.PointLight>(null)
  const flame = useRef<THREE.Mesh>(null)
  const glowTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,220,160,1)')
    grad.addColorStop(0.35, 'rgba(255,170,80,0.35)')
    grad.addColorStop(1, 'rgba(255,150,60,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const wickY = 0.035 + 0.13
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // 여러 사인파를 겹친 불규칙한 일렁임
    const f = 1 + 0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1 + 1.3) + 0.03 * Math.sin(t * 23.7)
    if (light.current) light.current.intensity = C.candleIntensity * f
    if (flame.current) {
      flame.current.scale.set(1, 0.9 + 0.15 * (f - 1) * 5, 1)
      flame.current.rotation.z = 0.06 * Math.sin(t * 3.1)
    }
  })
  return (
    <group position={CLOSET_CANDLE} userData={{ noPick: true }}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.024, 14]} />
        <meshStandardMaterial color="#8a6a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.035 + 0.065, 0]}>
        <cylinderGeometry args={[0.024, 0.026, 0.13, 12]} />
        <meshStandardMaterial color="#efe4cc" roughness={0.6} emissive="#ffcf8a" emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={flame} position={[0, wickY + 0.025, 0]}>
        <coneGeometry args={[0.011, 0.05, 8]} />
        <meshBasicMaterial color="#ffd58a" toneMapped={false} />
      </mesh>
      <sprite position={[0, wickY + 0.03, 0]} scale={[0.22, 0.22, 1]}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <pointLight ref={light} position={[0, wickY + 0.06, 0]} color={C.candle} intensity={C.candleIntensity} distance={5} decay={1.6} />
    </group>
  )
}

/** 뒷벽의 나무 문 (안쪽을 향함). 문을 누르면 시작 화면으로 */
function Door() {
  const { x, w, h } = CLOSET_DOOR
  return (
    <group position={[x, 0, D - 0.03]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, 0.05]} />
        {wood(C.door, 0.75)}
      </mesh>
      {[-0.28, 0, 0.28].map((dx) => (
        <mesh key={dx} position={[dx, h / 2, -0.028]}>
          <boxGeometry args={[0.012, h - 0.06, 0.004]} />
          <meshStandardMaterial color={C.seam} roughness={0.9} />
        </mesh>
      ))}
      {[0.35, h - 0.35].map((y) => (
        <mesh key={y} position={[0, y, -0.035]}>
          <boxGeometry args={[w - 0.08, 0.08, 0.02]} />
          {wood(C.beam)}
        </mesh>
      ))}
      {/* 쇠 손잡이 고리 */}
      <mesh position={[-w / 2 + 0.14, 1.0, -0.05]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.045, 0.008, 6, 14]} />
        <meshStandardMaterial color="#2c2b2a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* 문틀 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (w + 0.08)) / 2, h / 2, -0.01]}>
          <boxGeometry args={[0.08, h + 0.08, 0.08]} />
          {wood(C.trim)}
        </mesh>
      ))}
      <mesh position={[0, h + 0.04, -0.01]}>
        <boxGeometry args={[w + 0.16, 0.08, 0.08]} />
        {wood(C.trim)}
      </mesh>
      {/* 문틈으로 새어 드는 아주 희미한 빛 */}
      <mesh position={[0, 0.004, -0.06]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w * 0.9, 0.08]} />
        <meshBasicMaterial color="#c9a46a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function ClosetRoom() {
  return (
    <group>
      <Shell />
      <Window />
      <LightShaft />
      {/* 책상·의자 아래 러그, 십자가 아래 무릎 방석 */}
      <mesh position={[CLOSET_DESK.pos[0], 0.012, -0.9]} receiveShadow>
        <boxGeometry args={[1.7, 0.012, 1.5]} />
        <meshStandardMaterial color={C.rug} roughness={1} />
      </mesh>
      <mesh position={[CLOSET_CROSS[0], 0.05, -D + 0.5]}>
        <boxGeometry args={[0.46, 0.08, 0.36]} />
        <meshStandardMaterial color={C.cushion} roughness={1} flatShading />
      </mesh>
      <Desk />
      <HighChair />
      <Cabinet />
      <Cross />
      <Candle />
      <group position={CLOSET_BIBLE.pos} rotation-y={CLOSET_BIBLE.rotY} scale={1.15}>
        <Bible />
      </group>
      <Door />
    </group>
  )
}
