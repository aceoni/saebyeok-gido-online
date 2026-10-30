import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BALCONY, CAMERA, HALL } from '../config'
import { usePlayer } from '../store/player'
import { cameraState } from './cameraState'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 3인칭 카메라: 캐릭터 뒤에서 부드럽게 따라감. 우클릭 드래그 = 회전, 휠 = 확대/축소 */
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
    const [px, py, pz] = usePlayer.getState().position
    const { yaw, pitch, distance } = cameraState
    const target = new THREE.Vector3(px, py + CAMERA.lookHeight, pz)
    const d = desired.current.set(
      px + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      pz + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    // 벽·천장 밖으로 나가지 않게, 발코니 아래에서는 발코니 밑면 아래로
    d.x = clamp(d.x, -HALL.width / 2 + 0.3, HALL.width / 2 - 0.3)
    d.z = clamp(d.z, HALL.frontZ + 0.3, HALL.backZ - 0.3)
    const ceil = d.z > BALCONY.frontZ - 0.3 ? BALCONY.floorY - BALCONY.slabThickness - 0.15 : HALL.height - 0.4
    d.y = clamp(d.y, 0.4, ceil)

    const t = first.current ? 1 : 1 - Math.exp(-dt * CAMERA.follow)
    first.current = false
    camera.position.lerp(d, t)
    look.current.lerp(target, t)
    camera.lookAt(look.current)
  })

  return null
}
