import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BALCONY, CAMERA, HALL, SEAT } from '../config'
import { usePlayer } from '../store/player'
import { cameraState } from './cameraState'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 3인칭 카메라: 캐릭터 뒤에서 부드럽게 따라감. 우클릭 드래그 = 회전, 휠 = 확대/축소.
 *  기도 중에는 앉은 자리의 눈높이 1인칭으로 천천히 전환 (앞자리 등받이와 단상이 보이게) */
export function CameraRig() {
  const { camera, gl } = useThree()
  const look = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())
  const first = useRef(true)

  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lx = 0
    let ly = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 2) return
      dragging = true
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      cameraState.yaw -= (e.clientX - lx) * CAMERA.rotateSpeed
      cameraState.pitch = clamp(cameraState.pitch + (e.clientY - ly) * CAMERA.rotateSpeed, CAMERA.minPitch, CAMERA.maxPitch)
      lx = e.clientX
      ly = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      if (e.button === 2) dragging = false
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraState.distance = clamp(cameraState.distance * Math.exp(e.deltaY * 0.001), CAMERA.minDistance, CAMERA.maxDistance)
    }
    const noMenu = (e: Event) => e.preventDefault()
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', noMenu)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', noMenu)
    }
  }, [gl])

  useFrame((_, dt) => {
    const { position, level, pose, rotY } = usePlayer.getState()
    const [px, py, pz] = position

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

    const { yaw, pitch, distance } = cameraState
    const target = new THREE.Vector3(px, py + CAMERA.lookHeight, pz)
    const d = desired.current.set(
      px + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      pz + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    // 벽·천장 밖으로 나가지 않게. 1층에서 발코니 아래면 발코니 밑면 아래로, 2층이면 발코니 바닥 위로
    d.x = clamp(d.x, -HALL.width / 2 + 0.3, HALL.width / 2 - 0.3)
    d.z = clamp(d.z, HALL.frontZ + 0.3, HALL.backZ - 0.3)
    const underBalcony = level === 1 && d.z > BALCONY.frontZ - 0.3
    const ceil = underBalcony ? BALCONY.floorY - BALCONY.slabThickness - 0.15 : HALL.height - 0.4
    d.y = clamp(d.y, level === 2 ? py + 0.4 : 0.4, ceil)

    const t = first.current ? 1 : 1 - Math.exp(-dt * CAMERA.follow)
    first.current = false
    camera.position.lerp(d, t)
    look.current.lerp(target, t)
    camera.lookAt(look.current)
  })

  return null
}
