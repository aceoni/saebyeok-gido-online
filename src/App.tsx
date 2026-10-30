import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SanctuaryScene } from './scenes/SanctuaryScene'

// 개발용: ?cam=x,y,z,tx,ty,tz 로 시점 지정
const camParam = new URLSearchParams(location.search).get('cam')?.split(',').map(Number)
const camPos = (camParam?.slice(0, 3) ?? [0, 3.6, 12]) as [number, number, number]
const camTarget = (camParam?.slice(3, 6) ?? [0, 3.4, -6]) as [number, number, number]

// M1: 공간 확인용 임시 카메라(OrbitControls). M2에서 3인칭 카메라로 교체.
export default function App() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: camPos, fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
    >
      <SanctuaryScene />
      <OrbitControls
        target={camTarget}
        minDistance={2}
        maxDistance={26}
        maxPolarAngle={Math.PI * 0.55}
        enableDamping
      />
    </Canvas>
  )
}
