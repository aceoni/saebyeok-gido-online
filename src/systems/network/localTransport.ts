import type { NetState } from '../../store/remote'
import { ROOM, type Handlers, type Member, type Meta, type Transport } from './transport'

// 개발·시험용: 같은 브라우저의 여러 탭끼리 BroadcastChannel 로 주고받는다 (서버 없음). 주소에 ?mp=local
type Msg =
  | { t: 'hello'; id: string; meta: Meta }
  | { t: 'bye'; id: string }
  | { t: 'state'; id: string; s: NetState }
  | { t: 'pray'; id: string; text: string }

export class LocalTransport implements Transport {
  private bc: BroadcastChannel | null = null
  private id = ''
  private meta: Meta | null = null
  private seen = new Map<string, { meta: Meta; at: number }>()
  private timer = 0
  private h: Handlers | null = null

  async connect(id: string, meta: Meta, h: Handlers) {
    this.id = id
    this.meta = meta
    this.h = h
    this.bc = new BroadcastChannel(ROOM)
    this.bc.onmessage = (e: MessageEvent<Msg>) => this.receive(e.data)
    this.hello()
    this.timer = window.setInterval(() => {
      this.hello()
      const now = Date.now()
      for (const [k, v] of this.seen) if (now - v.at > 6000) this.seen.delete(k)
      this.emitMembers()
    }, 2000)
    window.addEventListener('beforeunload', () => this.close())
    h.onStatus('online')
    this.emitMembers()
  }

  private hello() {
    this.bc?.postMessage({ t: 'hello', id: this.id, meta: this.meta! } satisfies Msg)
  }

  private emitMembers() {
    const list: Member[] = [{ id: this.id, ...this.meta! }, ...[...this.seen].map(([id, v]) => ({ id, ...v.meta }))]
    this.h?.onMembers(list)
  }

  private receive(m: Msg) {
    if (m.id === this.id) return
    if (m.t === 'hello') {
      const isNew = !this.seen.has(m.id)
      this.seen.set(m.id, { meta: m.meta, at: Date.now() })
      if (isNew) {
        this.hello() // 새로 온 사람에게 나를 바로 알림
        this.emitMembers()
      }
    } else if (m.t === 'bye') {
      this.seen.delete(m.id)
      this.emitMembers()
    } else if (m.t === 'state') this.h?.onState(m.id, m.s)
    else if (m.t === 'pray') this.h?.onPray(m.id, m.text)
  }

  updateMeta(meta: Meta) {
    this.meta = meta
    this.hello()
    this.emitMembers()
  }
  sendState(s: NetState) {
    this.bc?.postMessage({ t: 'state', id: this.id, s } satisfies Msg)
  }
  sendPray(text: string) {
    this.bc?.postMessage({ t: 'pray', id: this.id, text } satisfies Msg)
  }
  close() {
    this.bc?.postMessage({ t: 'bye', id: this.id } satisfies Msg)
    clearInterval(this.timer)
    this.bc?.close()
    this.bc = null
  }
}
