import { useState } from 'react'
import { HYMNS } from '../data/hymns'
import { useAudio } from '../store/audio'
import { nextTrack, prevTrack, setInstrument, togglePlay } from '../systems/AudioManager'

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d={d} fill="currentColor" />
  </svg>
)
const ICONS = {
  prev: 'M6 6h2v12H6zM9.5 12 18 18V6z',
  next: 'M16 6h2v12h-2zM6 18l8.5-6L6 6z',
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  sound: 'M4 9v6h4l5 4V5L8 9zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
  mute: 'M4 9v6h4l5 4V5L8 9zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z',
  note: 'M12 3v10.6A4 4 0 1 0 14 17V7h4V3z',
  fold: 'M7.4 15.4 12 10.8l4.6 4.6L18 14l-6-6-6 6z',
  unfold: 'M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z',
}

// 접힘 상태는 이 브라우저에 기억. 처음엔 휴대폰 화면이면 접힌 채로 시작
const FOLD_KEY = 'saebyeok-gido.player-folded.v1'
function initialFolded() {
  try {
    const v = localStorage.getItem(FOLD_KEY)
    if (v !== null) return v === '1'
  } catch {
    // 무시
  }
  return window.innerWidth <= 640
}

/** 화면 왼쪽 아래 배경 찬양 플레이어: 곡 제목·출처, 이전/일시정지/다음, 음소거, 볼륨, 오르간/피아노 */
export function MusicPlayer() {
  const { entered, phase, playing, track, measure, volume, muted, instrument, setVolume, setMuted } = useAudio()
  const [showInfo, setShowInfo] = useState(false)
  const [folded, setFolded] = useState(initialFolded)
  if (!entered) return null
  const h = HYMNS[track]
  const ready = phase === 'ready'
  const fold = (v: boolean) => {
    setFolded(v)
    try {
      localStorage.setItem(FOLD_KEY, v ? '1' : '0')
    } catch {
      // 무시
    }
  }

  // 접힌 모양: 음표 + 곡 제목 + 재생/일시정지 + 펼치기
  if (folded)
    return (
      <div className="music-player folded">
        <button className="mp-unfold" onClick={() => fold(false)} aria-label="찬양 플레이어 펼치기">
          <Icon d={ICONS.note} />
          <span className="mp-ko">{ready ? h.title : '찬양 준비 중…'}</span>
        </button>
        <button onClick={togglePlay} disabled={!ready} aria-label={playing ? '일시정지' : '재생'}>
          <Icon d={playing ? ICONS.pause : ICONS.play} />
        </button>
        <button onClick={() => fold(false)} aria-label="펼치기">
          <Icon d={ICONS.unfold} />
        </button>
      </div>
    )

  return (
    <div className="music-player">
      <button className="mp-fold" onClick={() => fold(true)} aria-label="찬양 플레이어 접기">
        <Icon d={ICONS.fold} />
      </button>
      <div className="mp-title">
        {phase === 'loading' && <span className="mp-dim">{instrument === 'piano' ? '피아노' : '오르간'} 소리를 준비하는 중…</span>}
        {phase === 'error' && <span className="mp-dim">소리를 불러오지 못했습니다</span>}
        {ready && (
          <button className="mp-song" onClick={() => setShowInfo((v) => !v)} title="곡 정보">
            <span className="mp-ko">{h.title}</span>
            <span className="mp-sub">
              {h.titleEn} · {!playing && '일시정지 '}
              {measure === null ? (playing ? '다음 곡까지 잠시 쉼' : '') : `${measure}마디`}
            </span>
          </button>
        )}
      </div>
      {ready && showInfo && (
        <div className="mp-info">
          <div>
            {h.hymnal} · 곡조 {h.tune}
          </div>
          <div>
            작곡 {h.composer}
            {h.year !== null && `, ${h.year}`}
          </div>
          {instrument === 'piano' && (
            <div className="mp-dim">피아노 음원: Salamander Grand Piano (Alexander Holm, CC BY 3.0)</div>
          )}
        </div>
      )}
      <div className="mp-controls">
        <button onClick={prevTrack} disabled={!ready} aria-label="이전 곡">
          <Icon d={ICONS.prev} />
        </button>
        <button onClick={togglePlay} disabled={!ready} aria-label={playing ? '일시정지' : '재생'}>
          <Icon d={playing ? ICONS.pause : ICONS.play} />
        </button>
        <button onClick={nextTrack} disabled={!ready} aria-label="다음 곡">
          <Icon d={ICONS.next} />
        </button>
        <button onClick={() => setMuted(!muted)} aria-label={muted ? '소리 켜기' : '음소거'} className="mp-mute">
          <Icon d={muted ? ICONS.mute : ICONS.sound} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="볼륨"
        />
      </div>
      <div className="mp-instrument" role="radiogroup" aria-label="악기">
        {(['organ', 'piano'] as const).map((k) => (
          <button
            key={k}
            role="radio"
            aria-checked={instrument === k}
            className={instrument === k ? 'on' : ''}
            disabled={phase === 'loading'}
            onClick={() => void setInstrument(k)}
          >
            {k === 'organ' ? '오르간' : '피아노'}
          </button>
        ))}
      </div>
    </div>
  )
}
