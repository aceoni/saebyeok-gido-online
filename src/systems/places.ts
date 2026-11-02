// 장소 오가기: 시작 화면 → 예배당(함께) / 기도 골방(혼자), 골방 문 → 시작 화면
import { CAMERA, PLAYER } from '../config'
import { CLOSET_SPAWN, CLOSET_SPAWN_ROT } from '../scenes/closetLayout'
import { useAudio, type Place } from '../store/audio'
import { usePlayer } from '../store/player'
import { useUi, type Weather } from '../store/ui'
import { enter, setAudioPlace, setRain } from './AudioManager'
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

/** 골방에 들어올 때마다 창밖 날씨를 1/3씩: 맑음 / 눈 / 비 (개발용 ?weather=snow|rain|clear 로 고정) */
function pickWeather(): Weather {
  const forced = new URLSearchParams(location.search).get('weather')
  if (forced === 'snow' || forced === 'rain' || forced === 'clear') return forced
  return (['clear', 'snow', 'rain'] as const)[Math.floor(Math.random() * 3)]
}

/** 시작 화면에서 장소 고르기. withSound = false 면 소리 없이 */
export function enterPlace(place: Place, withSound: boolean) {
  const weather = place === 'closet' ? pickWeather() : 'clear'
  useUi.getState().setWeather(weather)
  setRain(weather === 'rain') // 비 오는 날 골방엔 빗소리 (소리가 아직 준비 중이면 준비되는 대로)
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
  setRain(false)
  useUi.getState().setPlace(null)
}
