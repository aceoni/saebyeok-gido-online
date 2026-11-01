// 아바타 4종 (남 2, 여 2). 접속할 때 하나를 무작위로 고른다. 얼굴·체형은 모두 같고 옷 색·머리 모양만 다르다.
export type HairStyle = 'short' | 'sidePart' | 'long' | 'bob'

export type Avatar = {
  id: 'm1' | 'm2' | 'f1' | 'f2'
  label: string
  hairStyle: HairStyle
  hair: string
  top: string // 카디건·스웨터
  shirt: string // 안쪽 깃
  bottom: string // 바지 / 치마
  skirt?: 'long' | 'knee'
}

export const AVATARS: Avatar[] = [
  { id: 'm1', label: '남 1', hairStyle: 'short', hair: '#2b211c', top: '#55606f', shirt: '#eee8dd', bottom: '#3c404b' },
  { id: 'm2', label: '남 2', hairStyle: 'sidePart', hair: '#5b3e2b', top: '#b39770', shirt: '#f2ece2', bottom: '#4a3f37' },
  { id: 'f1', label: '여 1', hairStyle: 'long', hair: '#2f2320', top: '#e2d4bd', shirt: '#f6f1e8', bottom: '#6b7d98', skirt: 'long' },
  { id: 'f2', label: '여 2', hairStyle: 'bob', hair: '#6c4631', top: '#b28a8f', shirt: '#f3ede4', bottom: '#5c4c45', skirt: 'knee' },
]

export const avatarById = (id: string | undefined): Avatar => AVATARS.find((a) => a.id === id) ?? AVATARS[0]
export const randomAvatarId = (): Avatar['id'] => AVATARS[Math.floor(Math.random() * AVATARS.length)].id
