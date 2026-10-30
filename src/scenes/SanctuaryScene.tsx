import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, HALL, LIGHTS, SCREEN } from '../config'
import { Room } from '../models/Room'
import { Stage } from '../models/Stage'
import { Pulpit } from '../models/Pulpit'
import { Pews } from '../models/Pews'
import { ChoirLoft } from '../models/ChoirLoft'
import { Piano } from '../models/Piano'
import { Screen } from '../models/Screen'
import { FlowerStand, SpeakerArray, WoodenCross } from '../models/Decor'
import { MonitorWedge, StageChair } from '../models/StageFurniture'
import { DrumKit } from '../models/DrumKit'
import { GuitarOnStand, MusicStand, Stool } from '../models/Instruments'
import { WallLamp } from '../models/WallLamp'
import { CROSS_POS, DRUM_POS, DRUM_SCALE, MUSIC_STANDS, FLOWERS, GUITARS, MONITORS, PIANO_POS, STAGE_CHAIRS, PULPIT_POS, SCREENS, SPEAKER_ARRAYS, STOOLS, WALL_LAMPS } from './sanctuaryLayout'

function Lights() {
  const crossTarget = useMemo(() => new THREE.Object3D(), [])
  return (
    <>
      <ambientLight color={LIGHTS.ambient.color} intensity={LIGHTS.ambient.intensity} />
      <hemisphereLight args={[LIGHTS.hemi.sky, LIGHTS.hemi.ground, LIGHTS.hemi.intensity]} />
      <primitive object={crossTarget} position={CROSS_POS} />
      <spotLight
        position={[CROSS_POS[0], 3.2, CROSS_POS[2] + 3]}
        target={crossTarget}
        color={LIGHTS.crossSpot.color}
        intensity={LIGHTS.crossSpot.intensity}
        angle={0.3}
        penumbra={0.9}
        decay={2}
        distance={14}
      />
      {WALL_LAMPS.map((p, i) => (
        <WallLamp key={i} position={p} seed={i} />
      ))}
    </>
  )
}

export function SanctuaryScene() {

  return (
    <>
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.fog, LIGHTS.fog.near, LIGHTS.fog.far]} />
      <Lights />

      <Room />
      <Stage />
      <Pulpit position={PULPIT_POS} />
      <Pews />
      <ChoirLoft />
      <Piano position={PIANO_POS} />

      {FLOWERS.map((p, i) => (
        <FlowerStand key={i} position={p} scale={1.7} />
      ))}
      {STAGE_CHAIRS.map((p, i) => (
        <StageChair key={i} position={p} />
      ))}
      {MONITORS.map((p, i) => (
        <MonitorWedge key={i} position={p} rotationY={Math.PI} />
      ))}
      <group position={DRUM_POS} scale={DRUM_SCALE}>
        <DrumKit position={[0, 0, 0]} />
      </group>
      <WoodenCross position={CROSS_POS} />
      {MUSIC_STANDS.map((p, i) => (
        <MusicStand key={i} position={p} />
      ))}
      {GUITARS.map((g, i) => (
        <GuitarOnStand key={i} position={g.pos} kind={g.kind} color={g.color} />
      ))}
      {STOOLS.map((p, i) => (
        <Stool key={i} position={p} />
      ))}

      {/* 정면 좌/우 스크린: 같은 문구 */}
      {SCREENS.map((sc, i) => (
        <group key={i} position={[...sc.pos]}>
          <Screen width={sc.w} height={sc.h} text={SCREEN.text} main />
        </group>
      ))}

      {SPEAKER_ARRAYS.map(([x, z, n]) => (
        <SpeakerArray key={`${x}${z}`} position={[x, HALL.height - 1.6, z]} count={n} ceilingY={HALL.height} />
      ))}
    </>
  )
}
