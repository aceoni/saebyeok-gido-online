import { useEffect } from 'react'
import { usePlayer } from '../store/player'
import { useUi } from '../store/ui'
import { PrayerNote } from './PrayerNote'

/** 앉았을 때: 기도하기 / 일어나기. 기도 중: 비네트 + 기도노트 열기 / 기도 마치기. [Esc] = 한 단계 뒤로 */
export function SeatControls() {
  const pose = usePlayer((s) => s.pose)
  const noteOpen = useUi((s) => s.noteOpen)
  const { startPrayer, standUp, endPrayer } = usePlayer.getState()
  const setNoteOpen = useUi((s) => s.setNoteOpen)

  // 기도를 마치면 노트도 닫힘
  useEffect(() => {
    if (pose !== 'praying') setNoteOpen(false)
  }, [pose, setNoteOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      const p = usePlayer.getState().pose
      if (p === 'praying' && useUi.getState().noteOpen) setNoteOpen(false)
      else if (p === 'praying') endPrayer()
      else if (p === 'sitting') standUp()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [endPrayer, standUp, setNoteOpen])

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
      {pose === 'praying' && (
        <div className={`seat-controls${noteOpen ? ' note-open' : ''}`}>
          <button className="primary" onClick={() => setNoteOpen(!noteOpen)}>
            {noteOpen ? '기도노트 닫기' : '기도노트 열기'}
          </button>
          <button onClick={endPrayer}>
            기도 마치기 {!noteOpen && <kbd>Esc</kbd>}
          </button>
        </div>
      )}
      {pose === 'praying' && noteOpen && <PrayerNote />}
    </>
  )
}
