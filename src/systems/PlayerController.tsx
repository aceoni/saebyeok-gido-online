import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PLAYER } from '../config'
import { Character } from '../models/Character'
import { usePlayer } from '../store/player'
import { cameraState } from './cameraState'
import { canStep, findPath, groundHeight, nearestWalkable } from './navGrid'

const KEYMAP: Record<string, 'f' | 'b' | 'l' | 'r'> = {
  KeyW: 'f',
  ArrowUp: 'f',
  KeyS: 'b',
  ArrowDown: 'b',
  KeyA: 'l',
  ArrowLeft: 'l',
  KeyD: 'r',
  ArrowRight: 'r',
}
const CLICK_MOVE_TOLERANCE = 6 // px: 이보다 많이 움직이면 드래그로 보고 이동하지 않음

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

// 각도 a 에서 b 로 최단 방향 보간
function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

function hasNoPickAncestor(o: THREE.Object3D | null) {
  for (; o; o = o.parent) if (o.userData.noPick) return true
  return false
}

// 개발 모드에서만: 콘솔/자동 테스트에서 이동을 시험할 수 있게 노출
if (import.meta.env.DEV) {
  Object.assign(window, { __player: usePlayer, __nav: { findPath, nearestWalkable, groundHeight } })
}

/** 키보드(WASD/방향키) + 바닥 클릭 이동, 충돌/높이 처리, 캐릭터·목적지 표시 */
export function PlayerController({ clickToMove = true }: { clickToMove?: boolean }) {
  const keys = useRef({ f: false, b: false, l: false, r: false })
  const marker = useRef<THREE.Mesh>(null)
  const { camera, scene, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // 키보드
  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      const k = KEYMAP[e.code]
      if (!k || isTyping(e)) return
      keys.current[k] = down
      if (down) e.preventDefault()
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    const onBlur = () => (keys.current = { f: false, b: false, l: false, r: false })
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // 바닥 클릭 → 길찾기
  useEffect(() => {
    if (!clickToMove) return
    const el = gl.domElement
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) down = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0 || !down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      down = null
      if (moved > CLICK_MOVE_TOLERANCE) return
      const rect = el.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(scene.children, true).find((h) => !hasNoPickAncestor(h.object))
      if (!hit || hit.point.y > 2.5) return // 벽 위쪽, 발코니 등은 무시
      const goal = nearestWalkable(hit.point.x, hit.point.z)
      if (!goal) return
      const { position } = usePlayer.getState()
      const path = findPath(position[0], position[2], goal[0], goal[1])
      if (path?.length) usePlayer.getState().setPath(path)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
    }
  }, [clickToMove, camera, scene, gl, raycaster])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = usePlayer.getState()
    let [x, y, z] = s.position
    let path = s.path
    let vx = 0
    let vz = 0

    const k = keys.current
    const ix = +k.r - +k.l
    const iz = +k.f - +k.b
    if (ix || iz) {
      // 키보드: 카메라가 보는 방향 기준. 클릭 경로는 취소
      path = []
      const yaw = cameraState.yaw
      const fx = -Math.sin(yaw)
      const fz = -Math.cos(yaw)
      const rx = Math.cos(yaw)
      const rz = -Math.sin(yaw)
      vx = rx * ix + fx * iz
      vz = rz * ix + fz * iz
      const len = Math.hypot(vx, vz)
      vx = (vx / len) * PLAYER.walkSpeed
      vz = (vz / len) * PLAYER.walkSpeed
    } else if (path.length) {
      const [tx, tz] = path[0]
      const d = Math.hypot(tx - x, tz - z)
      if (d < 0.12) {
        path = path.slice(1)
      } else {
        const sp = Math.min(PLAYER.walkSpeed, d / dt)
        vx = ((tx - x) / d) * sp
        vz = ((tz - z) / d) * sp
      }
    }

    // 충돌: 그대로 → x만 → z만 순서로 미끄러지듯 이동
    let moved = false
    if (vx || vz) {
      const nx = x + vx * dt
      const nz = z + vz * dt
      if (canStep(x, z, nx, nz)) {
        x = nx
        z = nz
        moved = true
      } else if (vx && canStep(x, z, nx, z)) {
        x = nx
        moved = true
      } else if (vz && canStep(x, z, x, nz)) {
        z = nz
        moved = true
      } else {
        path = []
      }
    }

    // 높이: 단상/성가대 단을 부드럽게 오르내림
    const gy = groundHeight(x, z)
    y += (gy - y) * Math.min(1, dt * 12)

    let rotY = s.rotY
    if (moved) rotY = lerpAngle(rotY, Math.atan2(vx, vz), Math.min(1, dt * PLAYER.turnSpeed))

    usePlayer.setState({
      position: [x, y, z],
      rotY,
      pose: moved ? 'walking' : s.pose === 'walking' ? 'idle' : s.pose,
      path,
    })

    // 목적지 표시
    if (marker.current) {
      const last = path[path.length - 1]
      marker.current.visible = !!last
      if (last) marker.current.position.set(last[0], groundHeight(last[0], last[1]) + 0.02, last[1])
    }
  })

  return (
    <>
      <Character />
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false} userData={{ noPick: true }}>
        <ringGeometry args={[0.18, 0.24, 24]} />
        <meshBasicMaterial color="#ffe2b0" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </>
  )
}
