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
  CLOSET_KNEEL,
  CLOSET_CROSS,
  CLOSET_DESK,
  CLOSET_DOOR,
  CLOSET_WINDOW,
} from '../scenes/closetLayout'
import { Bible } from './Bible'
import { useUi, type Weather } from '../store/ui'

RectAreaLightUniformsLib.init()

// 기도 골방: 어두운 나무 오두막 방. 창문으로 새벽빛(맑음·눈·비 중 하나), 앉은뱅이 책상 위 촛불과 펼친 성경, 방석, 벽의 나무 십자가.
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

/** 카메라가 이 벽 바깥으로 나가면(멀리 줌아웃) 서서히 투명해져 방 안이 보이게 하는 묶음 */
function Cutaway({ outside, children }: { outside: (cam: THREE.Vector3) => boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const op = useRef(1)
  useFrame(({ camera }, dt) => {
    const g = ref.current
    if (!g) return
    const target = outside(camera.position) ? 0 : 1
    g.userData.noPick = target === 0 // 투명해지는 중에도 바닥 클릭을 가리지 않게
    if (Math.abs(op.current - target) < 0.001) return
    op.current += (target - op.current) * Math.min(1, dt * 6)
    if (Math.abs(op.current - target) < 0.01) op.current = target
    const o = op.current
    g.visible = o > 0.02
    g.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as THREE.Material | undefined
      if (!m) return
      m.transparent = o < 1
      m.depthWrite = o >= 1
      m.opacity = o
    })
  })
  return <group ref={ref}>{children}</group>
}

const M = 0.05 // 벽 바깥으로 이만큼 나가면 투명해짐
// 카메라가 방 안에 있는지 (밖에서 내려다볼 때는 창밖 하늘·눈비를 숨김 — 방 위에 떠 보이지 않게)
const camInside = (c: THREE.Vector3) => Math.abs(c.x) < W + M && Math.abs(c.z) < D + M && c.y < H + M

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
      <Cutaway outside={(c) => c.y > H + M}>
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
      </Cutaway>
      {/* 좌우 벽 */}
      {[-1, 1].map((s) => (
        <Cutaway key={s} outside={(c) => c.x * s > W + M}>
          <mesh position={[s * (W + t / 2), H / 2, 0]}>
            <boxGeometry args={[t, H, D * 2]} />
            {wall}
          </mesh>
          <PlankSeams along="z" length={D * 2} fixed={s * (W - 0.002)} axis={s} />
        </Cutaway>
      ))}
      {/* 앞벽(창문 쪽) — 투명해져도 창문(Window)은 남음 */}
      <Cutaway outside={(c) => c.z < -D - M}>
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
      <mesh position={[0, 0.07, -D + 0.02]}>
        <boxGeometry args={[W * 2, 0.14, 0.03]} />
        {wood(C.beam)}
      </mesh>
      </Cutaway>
      {/* 뒷벽(문 쪽) */}
      <Cutaway outside={(c) => c.z > D + M}>
      <mesh position={[0, H / 2, D + t / 2]}>
        <boxGeometry args={[W * 2 + t * 2, H, t]} />
        {wall}
      </mesh>
      <PlankSeams along="x" length={W * 2} fixed={D - 0.002} axis={1} />
      <mesh position={[0, 0.07, D - 0.02]}>
        <boxGeometry args={[W * 2, 0.14, 0.03]} />
        {wood(C.beam)}
      </mesh>
      <Door />
      </Cutaway>
    </group>
  )
}

/** 창문: 격자 유리 + 나무 덧문(열림) + 창턱. 바깥은 새벽 하늘빛 */
function Window({ weather }: { weather: Weather }) {
  const { x, y, w, h } = CLOSET_WINDOW
  const lightRef = useRef<THREE.RectAreaLight>(null)
  useEffect(() => {
    lightRef.current?.lookAt(x, 0.6, 0.5)
  }, [x])
  const frame = wood(C.trim, 0.7)
  const skyRef = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (skyRef.current) skyRef.current.visible = camInside(camera.position)
  })
  return (
    <group position={[x, y, -D]}>
      {/* 바깥 새벽빛 */}
      {/* 눈·비가 내리는 공간(창 바깥 1.4m)보다 뒤에 하늘 */}
      <mesh ref={skyRef} position={[0, 0, -1.7]}>
        <planeGeometry args={[w * 5, h * 5]} />
        <meshBasicMaterial color={weather === 'rain' ? C.dawnRain : weather === 'snow' ? C.dawnSnow : C.dawn} toneMapped={false} />
      </mesh>
      {/* 유리 (살짝 빛남) */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={C.glass} emissive={C.glass} emissiveIntensity={weather === 'clear' ? 0.55 : 0.12} transparent opacity={weather === 'clear' ? 0.55 : 0.28} roughness={0.2} />
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
      <rectAreaLight
        ref={lightRef}
        position={[0, 0, 0.05]}
        width={w}
        height={h}
        color={C.dawnLight}
        intensity={C.dawnIntensity * (weather === 'rain' ? 0.7 : weather === 'snow' ? 1.15 : 1)}
      />
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
      <mesh position={[0, h * 0.35, 0]}>
        <boxGeometry args={[w - 0.4, 0.06, 0.05]} />
        {oak}
      </mesh>
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

/** 창밖 날씨: 눈송이(천천히 흔들리며) 또는 빗줄기(빠르게 비스듬히). 창 바로 바깥 상자 안에서만 */
function WeatherOutside({ kind }: { kind: 'snow' | 'rain' }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const { x, y, w, h } = CLOSET_WINDOW
  const box = { x0: x - w, x1: x + w, y0: y - h, y1: y + h, z0: -D - 1.4, z1: -D - 0.12 }
  const n = kind === 'snow' ? 320 : 420
  const parts = useMemo(
    () =>
      Array.from({ length: n }, () => ({
        x: box.x0 + Math.random() * (box.x1 - box.x0),
        y: box.y0 + Math.random() * (box.y1 - box.y0),
        z: box.z0 + Math.random() * (box.z1 - box.z0),
        sp: kind === 'snow' ? 0.18 + Math.random() * 0.16 : 3.2 + Math.random() * 1.6,
        ph: Math.random() * Math.PI * 2,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind],
  )
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, kind === 'rain' ? 0.18 : 0)), [kind])
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock, camera }, dt) => {
    const mesh = ref.current
    if (!mesh) return
    mesh.visible = camInside(camera.position)
    if (!mesh.visible) return
    const t = clock.elapsedTime
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      p.y -= p.sp * Math.min(dt, 0.1)
      if (kind === 'rain') p.x -= p.sp * 0.18 * Math.min(dt, 0.1)
      if (p.y < box.y0) {
        p.y = box.y1
        p.x = box.x0 + Math.random() * (box.x1 - box.x0)
      }
      if (p.x < box.x0) p.x = box.x1
      const sway = kind === 'snow' ? Math.sin(t * 0.9 + p.ph) * 0.06 : 0
      mesh.setMatrixAt(i, m.compose(v.set(p.x + sway, p.y, p.z), q, one))
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false} userData={{ noPick: true }}>
      {kind === 'snow' ? <sphereGeometry args={[0.018, 5, 4]} /> : <boxGeometry args={[0.005, 0.17, 0.005]} />}
      <meshBasicMaterial color={kind === 'snow' ? '#ffffff' : '#d3dcf2'} transparent opacity={kind === 'snow' ? 0.95 : 0.6} toneMapped={false} />
    </instancedMesh>
  )
}

export function ClosetRoom() {
  const weather = useUi((s) => s.weather) // 들어올 때 places.enterPlace 가 정함
  return (
    <group>
      <Shell />
      <Window weather={weather} />
      {weather !== 'clear' && <WeatherOutside kind={weather} />}
      <LightShaft />
      {/* 책상 아래 러그, 책상 앞 무릎 꿇는 방석 */}
      <mesh position={[CLOSET_DESK.pos[0], 0.012, -0.9]} receiveShadow>
        <boxGeometry args={[1.7, 0.012, 1.5]} />
        <meshStandardMaterial color={C.rug} roughness={1} />
      </mesh>
      <mesh position={[CLOSET_KNEEL.pos[0], 0.035, CLOSET_KNEEL.pos[2] + 0.05]}>
        <boxGeometry args={[0.5, 0.06, 0.46]} />
        <meshStandardMaterial color={C.cushion} roughness={1} flatShading />
      </mesh>
      <Desk />
      <Cabinet />
      <Cross />
      <Candle />
      <group position={CLOSET_BIBLE.pos} rotation-y={CLOSET_BIBLE.rotY} scale={1.15}>
        <Bible />
      </group>
    </group>
  )
}
