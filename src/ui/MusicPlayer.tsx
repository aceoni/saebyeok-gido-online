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
}

/** 화면 왼쪽 아래 배경 찬양 플레이어: 곡 제목·출처, 이전/일시정지/다음, 음소거, 볼륨, 오르간/피아노 */
export function MusicPlayer() {
  const { entered, phase, playing, track, measure, volume, muted, instrument, setVolume, setMuted } = useAudio()
  const [showInfo, setShowInfo] = useState(false)
  if (!entered) return null
  const h = HYMNS[track]
  const ready = phase === 'ready'

  return (
    <div className="music-player">
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
            작곡 {h.composer}, {h.year}
          </div>
          <div className="mp-dim">{h.source}</div>
          {instrument === 'piano' ? (
            <div className="mp-dim">피아노 음원: Salamander Grand Piano (Alexander Holm, CC BY 3.0)</div>
          ) : (
            <div className="mp-dim">오르간: 파이프 배음을 합성한 소리 (음원 파일 없음)</div>
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
