import type { Avatar } from '../../data/avatars'
import type { NetState } from '../../store/remote'

// 실시간 연결 방식(서비스)을 바꿔 끼울 수 있게 공통 인터페이스로 둔다.
// 주고받는 것: 접속자 목록(이름·아바타), 위치·자세, '소리내어 기도하기' 문장. 기도 메모 자체는 보내지 않는다.
export type Meta = { name: string; avatarId: Avatar['id'] }
export type Member = Meta & { id: string }

export type Handlers = {
  onMembers: (members: Member[]) => void // 지금 기도실에 있는 사람 전체 (나 포함)
  onState: (id: string, state: NetState) => void
  onPray: (id: string, text: string) => void
  onStatus: (status: 'connecting' | 'online' | 'error') => void
}

export interface Transport {
  /** 기도실 연결 (보기만: 누가 있는지 받기만 하고 나는 아직 안 보임) */
  connect(id: string, h: Handlers): Promise<void>
  /** 입장: 이제 다른 사람에게 나(이름·아바타)를 알림 */
  join(meta: Meta): void
  updateMeta(meta: Meta): void
  sendState(state: NetState): void
  sendPray(text: string): void
  close(): void
}

export const ROOM = 'saebyeok-main' // 기도실은 하나만
