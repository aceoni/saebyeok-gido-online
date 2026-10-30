import { useMemo } from 'react'
import * as THREE from 'three'

type Props = { position: [number, number, number]; width?: number }

// 실제 피난구 유도등처럼: 초록 바탕에 흰 '달려 나가는 사람 + 문' 픽토그램과 '비상구' 글자.
// 모든 표시등이 공유하는 텍스처. 앞면 = 로컬 -z (문 앞쪽)
let signTexture: THREE.CanvasTexture | null = null
function getSignTexture() {
  if (signTexture) return signTexture
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 192
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#12a150'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // 문 (열린 문틀)
  ctx.lineWidth = 9
  ctx.strokeRect(150, 30, 70, 135)
  ctx.fillRect(176, 36, 40, 126)
  ctx.fillStyle = '#12a150'
  ctx.fillRect(184, 44, 26, 110)
  ctx.fillStyle = '#ffffff'
  // 달려가는 사람 (문 쪽으로)
  ctx.beginPath()
  ctx.arc(108, 48, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.moveTo(100, 70) // 몸통
  ctx.lineTo(86, 112)
  ctx.stroke()
  ctx.lineWidth = 11
  ctx.beginPath() // 팔
  ctx.moveTo(62, 84)
  ctx.lineTo(98, 74)
  ctx.lineTo(128, 96)
  ctx.stroke()
  ctx.beginPath() // 다리
  ctx.moveTo(48, 132)
  ctx.lineTo(70, 118)
  ctx.lineTo(86, 112)
  ctx.lineTo(110, 136)
  ctx.lineTo(104, 166)
  ctx.stroke()
  // 화살표 + 글자
  ctx.font = 'bold 74px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('비상구', 250, 100)
  signTexture = new THREE.CanvasTexture(c)
  signTexture.colorSpace = THREE.SRGBColorSpace
  signTexture.anisotropy = 4
  return signTexture
}

export function ExitSign({ position, width = 0.62 }: Props) {
  const texture = useMemo(getSignTexture, [])
  const h = (width * 192) / 512
  return (
    <group position={position}>
      {/* 흰 케이스 */}
      <mesh>
        <boxGeometry args={[width + 0.06, h + 0.06, 0.07]} />
        <meshStandardMaterial color="#e8e6e0" roughness={0.6} />
      </mesh>
      {/* 발광 면 */}
      <mesh position={[0, 0, -0.037]} rotation-y={Math.PI}>
        <planeGeometry args={[width, h]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.5} />
      </mesh>
    </group>
  )
}
