import { CAMERA } from '../config'

// 3인칭 카메라 회전 상태. 매 프레임 바뀌므로 React 상태가 아닌 평범한 객체로 공유한다.
// (WASD 이동 방향이 카메라 방향 기준이라 PlayerController 가 읽는다)
export const cameraState = {
  yaw: 0, // 0 = 캐릭터 뒤(+z)에서 앞(-z)을 바라봄
  pitch: CAMERA.pitch,
  distance: CAMERA.distance,
  // 터치: 이번 손가락 제스처가 드래그(회전)나 두 손가락 핀치였으면 탭(이동/상호작용)으로 처리하지 않음
  gestureUsed: false,
}
