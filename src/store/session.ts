import { create } from 'zustand'
import { randomAvatarId, type Avatar } from '../data/avatars'

// 이번 접속의 나: 고유 id, 닉네임, 아바타(접속할 때마다 무작위).
// 닉네임은 다음 방문 편의를 위해 이 브라우저에만 기억한다.
const NAME_KEY = 'saebyeok-gido.nickname.v1'
export const DEFAULT_NAME_PREFIX = '익명의 성도'
export const NAME_MAX = 12

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

type SessionState = {
  id: string
  nickname: string // 사용자가 입력한 이름 ('' = 자동 번호)
  displayName: string // 실제로 보이는 이름 (자동 번호 포함)
  avatarId: Avatar['id']
  setNickname: (n: string) => void
  setDisplayName: (n: string) => void
  setAvatarId: (a: Avatar['id']) => void
}

export const useSession = create<SessionState>((set) => ({
  id: newId(),
  nickname: loadName(),
  displayName: '',
  avatarId: randomAvatarId(),
  setNickname: (nickname) => {
    const n = nickname.trim().slice(0, NAME_MAX)
    set({ nickname: n })
    try {
      localStorage.setItem(NAME_KEY, n)
    } catch {
      // 기억 못 해도 접속에는 지장 없음
    }
  },
  setDisplayName: (displayName) => set({ displayName }),
  setAvatarId: (avatarId) => set({ avatarId }),
}))
