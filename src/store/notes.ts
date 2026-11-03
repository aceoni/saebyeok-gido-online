import { create } from 'zustand'

// 기도 메모: 이 브라우저의 localStorage 에만 저장한다. 절대 서버로 보내지 않는다.
// 날짜마다 메모 하나 (id = 날짜 'YYYY-MM-DD').
export type PrayerNote = { id: string; text: string; updatedAt: number }

const KEY = 'saebyeok-gido.prayer-notes.v1'

function load(): PrayerNote[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as PrayerNote[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// 빈 메모는 저장하지 않음. 저장소를 쓸 수 없으면(사생활 보호 모드 등) 조용히 넘어감
function persist(notes: PrayerNote[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes.filter((n) => n.text.trim())))
    return true
  } catch {
    return false
  }
}

export function todayId(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
export function formatDate(id: string) {
  const [y, m, d] = id.split('-').map(Number)
  const w = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return `${y}년 ${m}월 ${d}일 ${w}요일`
}

type NotesState = {
  notes: PrayerNote[]
  currentId: string | null
  saveFailed: boolean
  openToday: () => void
  select: (id: string) => void
  update: (id: string, text: string) => void
  remove: (id: string) => void
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: load(),
  currentId: null,
  saveFailed: false,
  openToday: () => {
    const id = todayId()
    if (!get().notes.some((n) => n.id === id)) set({ notes: [...get().notes, { id, text: '', updatedAt: Date.now() }] })
    set({ currentId: id })
  },
  select: (id) => set({ currentId: id }),
  update: (id, text) => {
    const notes = get().notes.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n))
    set({ notes, saveFailed: !persist(notes) })
  },
  remove: (id) => {
    const notes = get().notes.filter((n) => n.id !== id)
    persist(notes)
    set({ notes, currentId: get().currentId === id ? null : get().currentId })
  },
}))
