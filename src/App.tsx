import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SanctuaryScene } from './scenes/SanctuaryScene'
import { PlayerController } from './systems/PlayerController'
import { CameraRig } from './systems/CameraRig'
import { Hud } from './ui/Hud'
import { InteractionSystem } from './systems/InteractionSystem'
import { SeatBible } from './systems/SeatBible'
import { RemotePlayers } from './systems/RemotePlayers'
import { SeatControls } from './ui/SeatControls'
import { EnterScreen } from './ui/EnterScreen'
import { MusicPlayer } from './ui/MusicPlayer'
import { Presence } from './ui/Presence'
import { useAudio } from './store/audio'

// 개발용: ?cam=x,y,z,tx,ty,tz 로 자유 시점 (OrbitControls: 좌클릭 이동, 우클릭 회전)
const camParam = new URLSearchParams(location.search).get('cam')?.split(',').map(Number)
const devCam = !!camParam

export default function App() {
  const entered = useAudio((s) => s.entered)
  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: (camParam?.slice(0, 3) as [number, number, number]) ?? [0, 3, 16], fov: 55, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <SanctuaryScene />
        <PlayerController clickToMove={!devCam} />
        <InteractionSystem />
        <SeatBible />
        <RemotePlayers />
        {devCam ? (
          <OrbitControls
            target={camParam!.slice(3, 6) as [number, number, number]}
            minDistance={1}
            maxDistance={26}
            enableDamping
            mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
            screenSpacePanning
          />
        ) : (
          <CameraRig />
        )}
      </Canvas>
      {!devCam && entered && <Hud />}
      <SeatControls />
      <MusicPlayer />
      <Presence />
      {!devCam && <EnterScreen />}
    </>
  )
}
