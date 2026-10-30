import { useEffect } from 'react'
import { usePlayer } from '../store/player'
import { PrayerNote } from './PrayerNote'

/** 앉았을 때: 기도하기 / 일어나기. 기도 중: 비네트 + 기도 메모장. [Esc] = 한 단계 뒤로 */
export function SeatControls() {
  const pose = usePlayer((s) => s.pose)
  const { startPrayer, standUp, endPrayer } = usePlayer.getState()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      const p = usePlayer.getState().pose
      if (p === 'praying') endPrayer()
      else if (p === 'sitting') standUp()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [endPrayer, standUp])

  return (
    <>
      <div className={`vignette${pose === 'praying' ? ' on' : ''}`} />
      {pose === 'sitting' && (
        <div className="seat-controls">
          <button className="primary" onClick={startPrayer}>
            기도하기
          </button>
          <button onClick={standUp}>
            일어나기 <kbd>Esc</kbd>
          </button>
        </div>
      )}
      {pose === 'praying' && <PrayerNote />}
    </>
  )
}
