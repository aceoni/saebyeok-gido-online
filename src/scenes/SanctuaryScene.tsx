import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { COLORS, HALL, LIGHTS, SCREEN, STAGE } from '../config'
import { Room } from '../models/Room'
import { Stage } from '../models/Stage'
import { Pulpit } from '../models/Pulpit'
import { Pews } from '../models/Pews'
import { Piano } from '../models/Piano'
import { Screen } from '../models/Screen'
import { CeilingSpeaker, Flag, FlowerStand } from '../models/Decor'
import { WallLamp } from '../models/WallLamp'
import { PIANO_POS, PIANO_ROT_Y, PULPIT_POS, SCREENS, WALL_LAMPS } from './sanctuaryLayout'

// 왼쪽 스크린 문구를 몇 분마다 바꾼다 (상태 변경은 수 분에 한 번이라 useState 사용)
function useCyclingMessage() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % SCREEN.messages.length), SCREEN.holdSeconds * 1000)
    return () => clearInterval(id)
  }, [])
  return SCREEN.messages[i]
}

function Lights() {
  const spotTarget = useMemo(() => new THREE.Object3D(), [])
  const s = LIGHTS.pulpitSpot
  return (
    <>
      <ambientLight color={LIGHTS.ambient.color} intensity={LIGHTS.ambient.intensity} />
      <hemisphereLight args={[LIGHTS.hemi.sky, LIGHTS.hemi.ground, LIGHTS.hemi.intensity]} />
      <primitive object={spotTarget} position={[PULPIT_POS[0], PULPIT_POS[1] + 0.8, PULPIT_POS[2]]} />
      <spotLight
        position={[PULPIT_POS[0], s.height, PULPIT_POS[2] + 2.5]}
        target={spotTarget}
        color={s.color}
        intensity={s.intensity}
        angle={s.angle}
        penumbra={s.penumbra}
        decay={2}
        distance={14}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {WALL_LAMPS.map((p, i) => (
        <WallLamp key={i} position={p} seed={i} />
      ))}
    </>
  )
}

export function SanctuaryScene() {
  const message = useCyclingMessage()
  const hymnTitle = '새벽기도' // M4에서 현재 재생 중인 찬송 제목으로 교체

  return (
    <>
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.fog, LIGHTS.fog.near, LIGHTS.fog.far]} />
      <Lights />

      <Room />
      <Stage />
      <Pulpit position={PULPIT_POS} />
      <Pews />
      <Piano position={PIANO_POS} rotationY={PIANO_ROT_Y} />

      <FlowerStand position={[-1.9, STAGE.height, -12.3]} />
      <FlowerStand position={[1.9, STAGE.height, -12.3]} />
      <Flag position={[-8.4, STAGE.height, -15.3]} variant="christian" />
      <Flag position={[8.4, STAGE.height, -15.3]} variant="church" />

      {/* 정면 좌: 문구 / 정면 우: 찬송 제목 */}
      {SCREENS.map((sc, i) => (
        <group key={i} position={[...sc.pos]}>
          <Screen width={sc.w} height={sc.h} text={i === 0 ? message : hymnTitle} main />
        </group>
      ))}

      {[-8, 2].flatMap((z) =>
        [-5, 5].map((x) => <CeilingSpeaker key={`${x}${z}`} position={[x, HALL.height - 0.9, z]} />),
      )}
    </>
  )
}
