import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../store/player'
import { downloadText, formatDate, todayId, useNotes } from '../store/notes'

/** 기도 메모장: 기도하는 동안 열림. 자동 저장, 날짜별 목록, 삭제, .txt 내보내기 */
export function PrayerNote() {
  const { notes, currentId, saveFailed, openToday, select, update, remove } = useNotes()
  const endPrayer = usePlayer((s) => s.endPrayer)
  const [view, setView] = useState<'edit' | 'list'>('edit')
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    openToday()
  }, [openToday])

  useEffect(() => {
    if (view === 'edit') textRef.current?.focus({ preventScroll: true })
  }, [view, currentId])

  const current = notes.find((n) => n.id === currentId)
  const saved = notes.filter((n) => n.text.trim()).sort((a, b) => (a.id < b.id ? 1 : -1))

  const exportOne = () => {
    if (!current) return
    downloadText(`기도메모_${current.id}.txt`, `${formatDate(current.id)}\n\n${current.text}\n`)
  }
  const exportAll = () => {
    const body = saved.map((n) => `${formatDate(n.id)}\n\n${n.text}\n`).join('\n────────────\n\n')
    downloadText(`기도메모_전체_${todayId()}.txt`, body)
  }
  const removeCurrent = () => {
    if (!current) return
    if (current.text.trim() && !confirm(`${formatDate(current.id)} 기록을 삭제할까요?`)) return
    remove(current.id)
    openToday()
  }

  return (
    <aside className="prayer-note" aria-label="기도 메모">
      {view === 'edit' && current ? (
        <>
          <header>
            <h2>{formatDate(current.id)}</h2>
            <button className="link" onClick={() => setView('list')}>
              지난 기록
            </button>
          </header>
          <textarea
            ref={textRef}
            value={current.text}
            placeholder="주님께 드리고 싶은 마음을 조용히 적어 보세요."
            onChange={(e) => update(current.id, e.target.value)}
          />
          <div className="note-actions">
            <button onClick={exportOne} disabled={!current.text.trim()}>
              .txt로 저장
            </button>
            <button onClick={removeCurrent} disabled={!current.text.trim()}>
              삭제
            </button>
            <button className="primary" onClick={endPrayer}>
              기도 마치기
            </button>
          </div>
        </>
      ) : (
        <>
          <header>
            <h2>지난 기록</h2>
            <button
              className="link"
              onClick={() => {
                openToday()
                setView('edit')
              }}
            >
              오늘 기록
            </button>
          </header>
          <ul className="note-list">
            {saved.length === 0 && <li className="empty">아직 남긴 기록이 없습니다.</li>}
            {saved.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    select(n.id)
                    setView('edit')
                  }}
                >
                  <strong>{formatDate(n.id)}</strong>
                  <span>{n.text.trim().split('\n')[0]}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="note-actions">
            <button onClick={exportAll} disabled={!saved.length}>
              전체 .txt로 저장
            </button>
            <button className="primary" onClick={endPrayer}>
              기도 마치기
            </button>
          </div>
        </>
      )}
      <p className="note-privacy">
        이 기록은 이 브라우저에만 저장됩니다.
        {saveFailed && ' (지금은 브라우저 설정 때문에 저장되지 않고 있어요)'}
      </p>
    </aside>
  )
}
