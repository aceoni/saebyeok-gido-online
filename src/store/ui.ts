import { create } from 'zustand'
import type { Place } from './audio'

// 화면(UI) 상태. 이름표 표시 여부는 이 브라우저에 기억한다.
const NAMES_KEY = 'saebyeok-gido.show-names.v1'

function loadShowNames() {
  try {
    return localStorage.getItem(NAMES_KEY) !== '0'
  } catch {
    return true
  }
}

type UiState = {
  place: Place | null // 지금 있는 곳 (null = 시작 화면)
  setPlace: (p: Place | null) => void
  noteOpen: boolean // 기도 중 기도노트가 열려 있는지
  showNames: boolean // 머리 위 이름표 보이기
  setNoteOpen: (v: boolean) => void
  setShowNames: (v: boolean) => void
}

export const useUi = create<UiState>((set) => ({
  place: null,
  setPlace: (place) => set({ place }),
  noteOpen: false,
  showNames: loadShowNames(),
  setNoteOpen: (noteOpen) => set({ noteOpen }),
  setShowNames: (showNames) => {
    set({ showNames })
    try {
      localStorage.setItem(NAMES_KEY, showNames ? '1' : '0')
    } catch {
      // 기억 못 해도 괜찮음
    }
  },
}))
