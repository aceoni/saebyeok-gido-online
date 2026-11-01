import { useMemo } from 'react'
import * as THREE from 'three'

// 펼쳐 놓은 성경책 (로컬: 읽는 사람이 +z 쪽, 책 바닥 = y 0). 양쪽 페이지가 살짝 V자로 들림
function usePageTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 192
    const g = c.getContext('2d')!
    g.fillStyle = '#f3ecdc'
    g.fillRect(0, 0, c.width, c.height)
    // 두 단 본문처럼 보이는 옅은 줄
    g.fillStyle = 'rgba(70, 60, 50, 0.32)'
    for (const col of [12, 68]) {
      for (let y = 16; y < 180; y += 7) {
        const w = 44 - ((y * 7) % 11)
        g.fillRect(col, y, w, 2)
      }
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

export function Bible() {
  const page = usePageTexture()
  const cover = <meshStandardMaterial color="#3a1f1c" roughness={0.6} />
  return (
    <group>
      {/* 표지 */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.27, 0.01, 0.19]} />
        {cover}
      </mesh>
      {/* 양쪽 페이지 묶음 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.003, 0.01, 0]} rotation-z={-s * 0.07}>
          <mesh position={[s * 0.064, 0.008, 0]}>
            <boxGeometry args={[0.125, 0.016, 0.175]} />
            <meshStandardMaterial color="#e9e0cc" roughness={0.9} />
          </mesh>
          <mesh position={[s * 0.064, 0.0165, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.12, 0.17]} />
            <meshStandardMaterial map={page} roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* 가름끈 */}
      <mesh position={[0.004, 0.018, 0.1]} rotation-x={0.6}>
        <boxGeometry args={[0.008, 0.002, 0.07]} />
        <meshStandardMaterial color="#8c1d22" roughness={0.7} />
      </mesh>
    </group>
  )
}
