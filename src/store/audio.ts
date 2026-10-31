import { create } from 'zustand'
import { AUDIO } from '../config'

// 배경 찬양 UI 상태. 실제 소리는 systems/AudioManager 가 담당하고 여기 값을 반영한다.
// 볼륨/음소거는 다음 방문 때도 유지되도록 localStorage 에 저장한다.
const PREF_KEY = 'saebyeok-gido.audio.v1'

export type Instrument = 'organ' | 'piano'
type Prefs = { volume: number; muted: boolean; instrument: Instrument }

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}')
    return {
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : AUDIO.volume,
      muted: p.muted === true,
      instrument: p.instrument === 'piano' || p.instrument === 'organ' ? p.instrument : AUDIO.instrument,
    }
  } catch {
    return { volume: AUDIO.volume, muted: false, instrument: AUDIO.instrument }
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    // 저장이 막혀 있어도 재생에는 지장 없음
  }
}

const pick = (s: Prefs): Prefs => ({ volume: s.volume, muted: s.muted, instrument: s.instrument })

export type AudioPhase = 'idle' | 'loading' | 'ready' | 'error'

type AudioState = Prefs & {
  entered: boolean // "입장하기"를 눌렀는지
  phase: AudioPhase
  playing: boolean
  track: number // HYMNS 인덱스
  measure: number | null // 지금 연주 중인 마디 번호 (쉬는 중이면 null)
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  setInstrument: (i: Instrument) => void
}

export const useAudio = create<AudioState>((set, get) => ({
  ...loadPrefs(),
  entered: false,
  phase: 'idle',
  playing: false,
  track: 0,
  measure: null,
  setVolume: (volume) => {
    set({ volume, muted: volume > 0 ? false : get().muted })
    savePrefs({ ...pick(get()), volume })
  },
  setMuted: (muted) => {
    set({ muted })
    savePrefs({ ...pick(get()), muted })
  },
  setInstrument: (instrument) => {
    set({ instrument })
    savePrefs({ ...pick(get()), instrument })
  },
}))
