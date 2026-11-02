import { useEffect, useRef } from 'react'
import { sayAmen } from '../systems/network/NetworkManager'
import { usePlayer } from '../store/player'
import { useUi } from '../store/ui'
import { PrayerNote } from './PrayerNote'

/** 앉았을 때: 기도하기 / 일어나기. 기도 중: 비네트 + 기도노트 열기 / 1인칭·3인칭 보기 / 기도 마치기. [Esc] = 한 단계 뒤로 */
export function SeatControls() {
  const pose = usePlayer((s) => s.pose)
  const noteOpen = useUi((s) => s.noteOpen)
  const { startPrayer, standUp, endPrayer } = usePlayer.getState()
  const setNoteOpen = useUi((s) => s.setNoteOpen)
  const firstPerson = useUi((s) => s.firstPerson)
  const setFirstPerson = useUi((s) => s.setFirstPerson)

  // 기도를 마치면 '아멘' 말풍선, 노트도 닫히고 시점은 다시 3인칭
  const prevPose = useRef(pose)
  useEffect(() => {
    if (prevPose.current === 'praying' && pose !== 'praying') sayAmen()
    prevPose.current = pose
    if (pose !== 'praying') {
      setNoteOpen(false)
      setFirstPerson(false)
    }
  }, [pose, setNoteOpen, setFirstPerson])

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
          <button onClick={() => setFirstPerson(!firstPerson)} aria-pressed={firstPerson}>
            {firstPerson ? '3인칭 보기' : '1인칭 보기'}
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
