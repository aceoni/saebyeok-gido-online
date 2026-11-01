import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { avatarById } from '../data/avatars'
import { Character, type CharacterState } from '../models/Character'
import { useSession } from '../store/session'

// 입장 전 '오늘의 내 모습' 미리 보기: 작은 화면에서 천천히 좌우로 돌아봄
const t0 = performance.now()
const read = (): CharacterState => ({
  position: [0, 0, 0],
  rotY: Math.sin((performance.now() - t0) / 1600) * 0.6,
  pose: 'idle',
})

// 기본 카메라는 원점(발밑)을 보므로, 가슴 높이를 보도록 맞춤
function AimCamera() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.lookAt(0, 0.66, 0)
  }, [camera])
  return null
}

export function AvatarPreview() {
  const avatarId = useSession((s) => s.avatarId)
  return (
    <div className="avatar-preview">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0.78, 2.1], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <AimCamera />
        <ambientLight intensity={1.1} color="#fff1dc" />
        <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} color="#ffe2b8" />
        <directionalLight position={[-2, 1, -1]} intensity={0.5} color="#b4bad6" />
        <group position={[0, -0.02, 0]}>
          <Character avatar={avatarById(avatarId)} read={read} />
        </group>
      </Canvas>
    </div>
  )
}
