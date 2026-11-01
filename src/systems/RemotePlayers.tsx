import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { avatarById } from '../data/avatars'
import { CHARACTER_TOP, Character, type CharacterState } from '../models/Character'
import { useRemote } from '../store/remote'

// 같은 기도실의 다른 사람들: 캐릭터 + 이름표 + '소리내어 기도하기' 말풍선.
// 네트워크 값은 초당 몇 번만 오므로, 그 사이를 부드럽게 따라가며(보간) 그린다.

function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

/** 머리 위 이름표 (나 포함) */
export function NameTag({ name }: { name: string }) {
  if (!name) return null
  return (
    <Html position={[0, CHARACTER_TOP + 0.14, 0]} center distanceFactor={5} zIndexRange={[14, 0]} style={{ pointerEvents: 'none' }}>
      <div className="name-tag">{name}</div>
    </Html>
  )
}

/** 머리 위 말풍선 (나 포함). 정해진 시간이 지나면 사라짐 */
export function PrayBubble({ id, lift = 0 }: { id: string; lift?: number }) {
  const bubble = useRemote((s) => s.bubbles[id])
  const [, tick] = useState(0)
  useEffect(() => {
    if (!bubble) return
    const t = window.setTimeout(() => tick((n) => n + 1), Math.max(0, bubble.until - Date.now()) + 50)
    return () => clearTimeout(t)
  }, [bubble])
  if (!bubble || bubble.until < Date.now()) return null
  return (
    <Html position={[0, CHARACTER_TOP + 0.32 + lift, 0]} center distanceFactor={5} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
      <div className="pray-bubble">{bubble.text}</div>
    </Html>
  )
}

function RemoteAvatar({ id }: { id: string }) {
  const name = useRemote((s) => s.players[id]?.name ?? '')
  const avatarId = useRemote((s) => s.players[id]?.avatarId)
  const hasState = useRemote((s) => !!s.players[id]?.state)
  const cur = useRef<CharacterState | null>(null)
  const last = useRef(performance.now())

  const read = (): CharacterState => {
    const now = performance.now()
    const dt = Math.min(0.1, (now - last.current) / 1000)
    last.current = now
    const st = useRemote.getState().players[id]?.state
    if (!st) return cur.current ?? { position: [0, -50, 0], rotY: 0, pose: 'idle' }
    const c = cur.current
    const target: CharacterState = { position: st.p, rotY: st.r, pose: st.pose }
    const far = c && Math.hypot(c.position[0] - st.p[0], c.position[1] - st.p[1], c.position[2] - st.p[2]) > 3
    // 앉기·층 이동처럼 순간 이동은 바로, 걷기는 부드럽게 따라감
    if (!c || far || st.pose === 'sitting' || st.pose === 'praying') {
      cur.current = { ...target, position: [...st.p] }
    } else {
      const k = 1 - Math.exp(-dt * 10)
      c.position = [
        c.position[0] + (st.p[0] - c.position[0]) * k,
        c.position[1] + (st.p[1] - c.position[1]) * k,
        c.position[2] + (st.p[2] - c.position[2]) * k,
      ]
      c.rotY = lerpAngle(c.rotY, st.r, k)
      c.pose = st.pose
    }
    return cur.current!
  }

  if (!hasState || !avatarId) return null
  return (
    <Character avatar={avatarById(avatarId)} read={read}>
      <NameTag name={name} />
      <PrayBubble id={id} lift={0.12} />
    </Character>
  )
}

export function RemotePlayers() {
  const ids = useRemote((s) => Object.keys(s.players).sort().join(','))
  return (
    <>
      {ids
        .split(',')
        .filter(Boolean)
        .map((id) => (
          <RemoteAvatar key={id} id={id} />
        ))}
    </>
  )
}
