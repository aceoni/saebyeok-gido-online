// 장소 오가기: 시작 화면 → 예배당(함께) / 기도 골방(혼자), 골방 문 → 시작 화면
import { CAMERA, PLAYER } from '../config'
import { CLOSET_SPAWN, CLOSET_SPAWN_ROT } from '../scenes/closetLayout'
import { useAudio, type Place } from '../store/audio'
import { usePlayer } from '../store/player'
import { useUi } from '../store/ui'
import { enter, setAudioPlace } from './AudioManager'
import { cameraState } from './cameraState'
import { startNetwork } from './network/NetworkManager'

// 작은 방이라 뒤쪽 모서리 위에서 어깨 너머로 내려다보는 시점으로 시작
// insideMax 까지는 방 안에 머물고, 그보다 멀리 줌아웃하면 방 밖으로 나가며 카메라 쪽 벽이 투명해짐
export const CLOSET_CAMERA = { distance: 2.1, minDistance: 1.0, maxDistance: 6, insideMax: 2.6, lookHeight: 1.0, yaw: 0.45, pitch: 0.5 }

function resetCamera(place: Place) {
  cameraState.yaw = place === 'closet' ? CLOSET_CAMERA.yaw : 0
  cameraState.pitch = place === 'closet' ? CLOSET_CAMERA.pitch : CAMERA.pitch
  cameraState.distance = place === 'closet' ? CLOSET_CAMERA.distance : CAMERA.distance
}

/** 시작 화면에서 장소 고르기. withSound = false 면 소리 없이 */
export function enterPlace(place: Place, withSound: boolean) {
  if (place === 'closet') usePlayer.getState().moveToLevel(3, CLOSET_SPAWN, CLOSET_SPAWN_ROT)
  else usePlayer.getState().moveToLevel(1, PLAYER.spawn, PLAYER.spawnRotY)
  resetCamera(place)
  useUi.getState().setPlace(place)
  const audio = useAudio.getState()
  if (!audio.entered) {
    audio.setPlace(place) // 처음 소리를 켤 때 그 장소의 악기로
    void enter(withSound)
  } else {
    audio.setMuted(!withSound)
    void setAudioPlace(place)
  }
  // 예배당만 온라인 (골방은 혼자)
  if (place === 'sanctuary') void startNetwork()
}

/** 골방 문: 시작 화면으로 (배경 찬양은 계속) */
export function exitToStart() {
  usePlayer.getState().moveToLevel(1, PLAYER.spawn, PLAYER.spawnRotY)
  resetCamera('sanctuary')
  useUi.getState().setPlace(null)
}
