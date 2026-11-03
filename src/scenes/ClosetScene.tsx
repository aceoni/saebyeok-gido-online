import { COLORS } from '../config'
import { ClosetRoom } from '../models/Closet'

// 기도 골방: 혼자 쓰는 공간 (온라인 연결 없음). 아주 어두운 바탕에 창문 새벽빛 + 촛불
export function ClosetScene() {
  const C = COLORS.closet
  return (
    <>
      <color attach="background" args={['#07070a']} />
      <ambientLight color={C.ambient} intensity={C.ambientIntensity} />
      <hemisphereLight args={['#6d7aa0', '#2a1d14', 0.58]} />
      {/* 방 뒤쪽 위의 아주 약한 보조광: 촛불을 등진 내 캐릭터가 실루엣만 남지 않게 */}
      <pointLight position={[0.5, 2.3, 1.5]} color="#9a8aa6" intensity={2.8} distance={4.5} decay={1.5} />
      <ClosetRoom />
    </>
  )
}
