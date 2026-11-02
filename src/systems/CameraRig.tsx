import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BALCONY, CAMERA, HALL, SEAT } from '../config'
import { usePlayer } from '../store/player'
import { cameraState } from './cameraState'
import { CLOSET } from '../scenes/closetLayout'
import { CLOSET_CAMERA } from './places'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 3인칭 카메라: 캐릭터 뒤에서 부드럽게 따라감.
 *  마우스: 우클릭 드래그 = 회전, 휠 = 확대/축소
 *  터치: 한 손가락 드래그 = 회전, 두 손가락 핀치 = 확대/축소 (탭 = 이동/상호작용은 PlayerController)
 *  기도 중에는 앉은 자리의 눈높이 1인칭으로 천천히 전환 (앞자리 등받이와 단상이 보이게) */
export function CameraRig() {
  const { camera, gl } = useThree()
  const look = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())
  const first = useRef(true)
  const lastLevel = useRef(0)

  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lx = 0
    let ly = 0
    // 터치: 화면에 닿아 있는 손가락들
    const touches = new Map<number, { x: number; y: number; sx: number; sy: number }>()
    let pinchDist = 0
    const rotate = (dx: number, dy: number) => {
      cameraState.yaw -= dx * CAMERA.rotateSpeed
      cameraState.pitch = clamp(cameraState.pitch + dy * CAMERA.rotateSpeed, CAMERA.minPitch, CAMERA.maxPitch)
    }
    const zoom = (factor: number) => {
      cameraState.distance = clamp(cameraState.distance * factor, CAMERA.minDistance, CAMERA.maxDistance)
    }
    const twoFingerDist = () => {
      const [a, b] = [...touches.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
    const onTouchDown = (e: PointerEvent) => {
      if (touches.size === 0) cameraState.gestureUsed = false
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY })
      if (touches.size >= 2) {
        cameraState.gestureUsed = true
        pinchDist = twoFingerDist()
      }
    }
    const onTouchMove = (e: PointerEvent) => {
      const t = touches.get(e.pointerId)
      if (!t) return
      const dx = e.clientX - t.x
      const dy = e.clientY - t.y
      t.x = e.clientX
      t.y = e.clientY
      if (touches.size >= 2) {
        const d = twoFingerDist()
        if (pinchDist > 0 && d > 0) zoom(pinchDist / d) // 벌리면 가까이, 오므리면 멀리
        pinchDist = d
        return
      }
      if (!cameraState.gestureUsed && Math.hypot(t.x - t.sx, t.y - t.sy) > 8) cameraState.gestureUsed = true
      if (cameraState.gestureUsed) rotate(dx * 1.3, dy * 1.3)
    }
    const onTouchUp = (e: PointerEvent) => {
      touches.delete(e.pointerId)
      pinchDist = touches.size >= 2 ? twoFingerDist() : 0
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return onTouchDown(e)
      if (e.button !== 2) return
      dragging = true
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return onTouchMove(e)
      if (!dragging) return
      rotate(e.clientX - lx, e.clientY - ly)
      lx = e.clientX
      ly = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return onTouchUp(e)
      if (e.button === 2) dragging = false
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom(Math.exp(e.deltaY * 0.001))
    }
    const noMenu = (e: Event) => e.preventDefault()
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', noMenu)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', noMenu)
    }
  }, [gl])

  useFrame((_, dt) => {
    const { position, level, pose, rotY } = usePlayer.getState()
    const [px, py, pz] = position
    // 골방 ↔ 예배당처럼 다른 곳으로 옮기면 카메라도 바로 그 자리로
    if ((level === 3) !== (lastLevel.current === 3)) first.current = true
    lastLevel.current = level

    if (pose === 'praying') {
      // 1인칭: 눈높이에서 앉은 방향으로, 살짝 내려다봄
      const fx = Math.sin(rotY)
      const fz = Math.cos(rotY)
      const eye = desired.current.set(px + fx * 0.12, py + SEAT.eyeHeight, pz + fz * 0.12)
      const target = new THREE.Vector3(eye.x + fx * 6, eye.y - 6 * SEAT.prayLookDown, eye.z + fz * 6)
      const t = 1 - Math.exp(-dt * 2.2) // 천천히 전환
      camera.position.lerp(eye, t)
      look.current.lerp(target, t)
      camera.lookAt(look.current)
      return
    }

    const closet = level === 3
    const { yaw, pitch } = cameraState
    const distance = closet ? Math.min(cameraState.distance, CLOSET_CAMERA.maxDistance) : cameraState.distance
    const target = new THREE.Vector3(px, py + (closet ? CLOSET_CAMERA.lookHeight : CAMERA.lookHeight), pz)
    const d = desired.current.set(
      px + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      pz + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    if (closet) {
      // 작은 골방: 벽·천장 안쪽에 머물게
      d.x = clamp(d.x, -CLOSET.halfW + 0.15, CLOSET.halfW - 0.15)
      d.z = clamp(d.z, -CLOSET.halfD + 0.15, CLOSET.halfD - 0.15)
      d.y = clamp(d.y, 0.4, CLOSET.height - 0.15)
    } else {
    // 벽·천장 밖으로 나가지 않게. 1층에서 발코니 아래면 발코니 밑면 아래로, 2층이면 발코니 바닥 위로
    d.x = clamp(d.x, -HALL.width / 2 + 0.3, HALL.width / 2 - 0.3)
    d.z = clamp(d.z, HALL.frontZ + 0.3, HALL.backZ - 0.3)
    const underBalcony = level === 1 && d.z > BALCONY.frontZ - 0.3
    const ceil = underBalcony ? BALCONY.floorY - BALCONY.slabThickness - 0.15 : HALL.height - 0.4
    d.y = clamp(d.y, level === 2 ? py + 0.4 : 0.4, ceil)
    }

    const t = first.current ? 1 : 1 - Math.exp(-dt * CAMERA.follow)
    first.current = false
    camera.position.lerp(d, t)
    look.current.lerp(target, t)
    camera.lookAt(look.current)
  })

  return null
}
