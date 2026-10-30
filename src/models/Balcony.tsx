import { BALCONY, COLORS, HALL } from '../config'
import { ChurchDoor } from './ChurchDoor'
import { DigitalClock } from './DigitalClock'
import { BALCONY_AISLE_RAMP, BALCONY_BACK_Y, balconyTierEdge } from '../scenes/sanctuaryLayout'

const PARAPET_H = 0.42 // 난간 아래 막힌 부분 높이
const RAIL_H = 1.0 // 손잡이 높이
const railPostXs = Array.from({ length: 17 }, (_, i) => -HALL.width / 2 + 0.2 + (i * (HALL.width - 0.4)) / 16)

// 2층 좌석(발코니): 뒤쪽 벽에서 앞으로 나온 바닥판 + 계단식 단 + 앞쪽 난간 + 양옆 받침 기둥 + 뒤쪽 출입문 + 앞면 디지털 시계.
// 장의자 자체는 Pews 에서 함께 그린다.
export function Balcony() {
  const W = HALL.width
  const depth = HALL.backZ - BALCONY.frontZ
  const midZ = (HALL.backZ + BALCONY.frontZ) / 2
  const top = BALCONY.floorY
  const slabY = top - BALCONY.slabThickness / 2
  const stageMat = <meshStandardMaterial color={COLORS.stage} roughness={0.6} />
  const aisleY = BALCONY_BACK_Y // 맨 뒤 통로 바닥 높이
  return (
    <group>
      {/* 바닥판 (아랫면은 천장색) */}
      <mesh position={[0, slabY, midZ]} receiveShadow>
        <boxGeometry args={[W, BALCONY.slabThickness, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.9} />
      </mesh>
      {/* 윗면 마루 */}
      <mesh position={[0, top + 0.01, midZ]} receiveShadow>
        <boxGeometry args={[W, 0.02, depth]} />
        {stageMat}
      </mesh>
      {/* 앞면 원목 띠 */}
      <mesh position={[0, slabY, BALCONY.frontZ - 0.02]}>
        <boxGeometry args={[W, BALCONY.slabThickness + 0.04, 0.06]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      {/* 계단식 단 (각 줄 앞 다리 공간부터 그 줄 높이) */}
      {Array.from({ length: BALCONY.rows - 1 }, (_, i) => {
        const row = i + 1
        const z0 = balconyTierEdge(row)
        const d = HALL.backZ - z0
        const h = row * BALCONY.tierHeight
        return (
          <mesh key={row} position={[0, top + h / 2, z0 + d / 2]} receiveShadow>
            <boxGeometry args={[W, h, d]} />
            {stageMat}
          </mesh>
        )
      })}
      {/* 가운데 통로 반 칸 계단 */}
      {Array.from({ length: BALCONY.rows - 1 }, (_, i) => {
        const row = i + 1
        const z1 = balconyTierEdge(row)
        const h = (row - 0.5) * BALCONY.tierHeight
        return (
          <mesh key={row} position={[0, top + h / 2, z1 - BALCONY_AISLE_RAMP / 2]} receiveShadow>
            <boxGeometry args={[BALCONY.aisleHalf * 2, h, BALCONY_AISLE_RAMP]} />
            {stageMat}
          </mesh>
        )
      })}
      {/* 난간: 아래만 막힌 낮은 원목 벽 + 기둥 + 위 손잡이 (가운데는 뚫림) */}
      <mesh position={[0, top + PARAPET_H / 2, BALCONY.frontZ + 0.08]} castShadow>
        <boxGeometry args={[W, PARAPET_H, 0.16]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>
      <mesh position={[0, top + PARAPET_H + 0.02, BALCONY.frontZ + 0.08]}>
        <boxGeometry args={[W, 0.04, 0.22]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} />
      </mesh>
      {railPostXs.map((x) => (
        <mesh key={x} position={[x, top + (PARAPET_H + RAIL_H) / 2, BALCONY.frontZ + 0.08]}>
          <boxGeometry args={[0.05, RAIL_H - PARAPET_H, 0.05]} />
          <meshStandardMaterial color="#5a5a60" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, top + RAIL_H, BALCONY.frontZ + 0.08]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, W, 8]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.5} />
      </mesh>
      {/* 2층 출입문: 맨 뒤 통로 벽 가운데 (1층 정문 바로 위 중앙 통로 끝) */}
      <ChurchDoor position={[0, aisleY, HALL.backZ - 0.02]} leafWidth={1.0} height={2.5} />
      {/* 설교자가 보는 디지털 시계: 발코니 앞면 가운데, 단상(-z)을 향함 */}
      <DigitalClock position={[0, slabY, BALCONY.frontZ - 0.06]} rotationY={Math.PI} />
      {/* 양옆 받침 기둥 (측면 통로 쪽, 1층 장의자와 겹치지 않게) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 10.1, (top - BALCONY.slabThickness) / 2, BALCONY.frontZ + 0.35]} castShadow>
          <boxGeometry args={[0.45, top - BALCONY.slabThickness, 0.45]} />
          <meshStandardMaterial color={COLORS.pillar} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
