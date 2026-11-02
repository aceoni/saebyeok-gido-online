import { create } from 'zustand'
import { AUDIO } from '../config'

// 배경 찬양 UI 상태. 실제 소리는 systems/AudioManager 가 담당하고 여기 값을 반영한다.
// 볼륨/음소거/장소별 악기는 다음 방문 때도 유지되도록 localStorage 에 저장한다.
const PREF_KEY = 'saebyeok-gido.audio.v1'

export type Instrument = 'organ' | 'piano'
export type Place = 'sanctuary' | 'closet' // 예배당 / 기도 골방
type Prefs = { volume: number; muted: boolean; instruments: Record<Place, Instrument> }

// 장소별 기본 악기: 예배당은 오르간, 골방은 피아노
const DEFAULT_INSTRUMENTS: Record<Place, Instrument> = { sanctuary: AUDIO.instrument, closet: 'piano' }
const isInst = (v: unknown): v is Instrument => v === 'piano' || v === 'organ'

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}')
    return {
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : AUDIO.volume,
      muted: p.muted === true,
      instruments: {
        // 예전 저장값(instrument 하나)은 예배당 악기로
        sanctuary: isInst(p.instruments?.sanctuary) ? p.instruments.sanctuary : isInst(p.instrument) ? p.instrument : DEFAULT_INSTRUMENTS.sanctuary,
        closet: isInst(p.instruments?.closet) ? p.instruments.closet : DEFAULT_INSTRUMENTS.closet,
      },
    }
  } catch {
    return { volume: AUDIO.volume, muted: false, instruments: { ...DEFAULT_INSTRUMENTS } }
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    // 저장이 막혀 있어도 재생에는 지장 없음
  }
}

const pick = (s: Prefs): Prefs => ({ volume: s.volume, muted: s.muted, instruments: s.instruments })

export type AudioPhase = 'idle' | 'loading' | 'ready' | 'error'

type AudioState = Prefs & {
  entered: boolean // "입장하기"를 한 번이라도 눌렀는지 (오디오 시작됨)
  phase: AudioPhase
  playing: boolean
  track: number // HYMNS 인덱스
  measure: number | null // 지금 연주 중인 마디 번호 (쉬는 중이면 null)
  place: Place
  instrument: Instrument // 지금 장소의 악기
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  setInstrument: (i: Instrument) => void
  setPlace: (p: Place) => void
}

const initial = loadPrefs()

export const useAudio = create<AudioState>((set, get) => ({
  ...initial,
  entered: false,
  phase: 'idle',
  playing: false,
  track: 0,
  measure: null,
  place: 'sanctuary',
  instrument: initial.instruments.sanctuary,
  setVolume: (volume) => {
    set({ volume, muted: volume > 0 ? false : get().muted })
    savePrefs({ ...pick(get()), volume })
  },
  setMuted: (muted) => {
    set({ muted })
    savePrefs({ ...pick(get()), muted })
  },
  setInstrument: (instrument) => {
    const instruments = { ...get().instruments, [get().place]: instrument }
    set({ instrument, instruments })
    savePrefs({ ...pick(get()), instruments })
  },
  setPlace: (place) => set({ place, instrument: get().instruments[place] }),
}))
