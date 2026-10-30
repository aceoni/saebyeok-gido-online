import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { usePlayer } from '../store/player'
import { findInteractable, type Interactable } from './interactables'

const CHECK_INTERVAL = 0.12 // 초: 너무 자주 계산하지 않게

/** 가까운 상호작용 대상을 찾아 말풍선 버튼을 띄우고, [E] 키로도 실행 */
export function InteractionSystem() {
  const [focus, setFocus] = useState<Interactable | null>(null)
  const focusRef = useRef<Interactable | null>(null)
  const timer = useRef(0)

  useFrame((_, dt) => {
    timer.current += dt
    if (timer.current < CHECK_INTERVAL) return
    timer.current = 0
    const { pose } = usePlayer.getState()
    const next = pose === 'idle' || pose === 'walking' ? findInteractable() : null
    // 대상이 바뀔 때만 React 상태 갱신 (매 프레임 갱신 금지)
    if (next?.id !== focusRef.current?.id) {
      focusRef.current = next
      setFocus(next)
    } else if (next) {
      focusRef.current = next
    }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      focusRef.current?.onInteract()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!focus) return null
  return (
    <Html position={focus.anchor} center zIndexRange={[20, 0]}>
      <button className="interact-bubble" onClick={() => focusRef.current?.onInteract()}>
        <kbd>E</kbd> {focus.label}
      </button>
    </Html>
  )
}
