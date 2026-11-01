import type { RealtimeChannel } from '@supabase/supabase-js'
import type { NetState } from '../../store/remote'
import { ROOM, type Handlers, type Member, type Meta, type Transport } from './transport'

// Supabase Realtime: Presence(누가 있는지) + Broadcast(위치·기도 문장). 데이터베이스는 쓰지 않는다.
export class SupabaseTransport implements Transport {
  private channel: RealtimeChannel | null = null
  private meta: Meta | null = null
  private id = ''
  private url: string
  private key: string
  constructor(url: string, key: string) {
    this.url = url
    this.key = key
  }

  private subscribed = false
  async connect(id: string, h: Handlers) {
    this.id = id
    h.onStatus('connecting')
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(this.url, this.key, { auth: { persistSession: false } })
    const ch = client.channel(ROOM, { config: { broadcast: { self: false }, presence: { key: id } } })
    this.channel = ch
    ch.on('presence', { event: 'sync' }, () => {
      const st = ch.presenceState<Meta>()
      const members: Member[] = Object.entries(st).map(([pid, metas]) => ({ id: pid, ...(metas[metas.length - 1] as Meta) }))
      h.onMembers(members)
    })
    ch.on('broadcast', { event: 'state' }, ({ payload }) => h.onState(payload.id, payload.s as NetState))
    ch.on('broadcast', { event: 'pray' }, ({ payload }) => h.onPray(payload.id, String(payload.text ?? '')))
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.subscribed = true
        if (this.meta) await ch.track(this.meta) // 연결 전에 이미 입장했으면 바로 알림
        h.onStatus('online')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') h.onStatus('error')
    })
  }

  join(meta: Meta) {
    this.updateMeta(meta)
  }

  updateMeta(meta: Meta) {
    this.meta = meta
    if (this.subscribed) void this.channel?.track(meta)
  }

  private send(event: string, payload: object) {
    void this.channel?.send({ type: 'broadcast', event, payload: { id: this.id, ...payload } })
  }
  sendState(s: NetState) {
    this.send('state', { s })
  }
  sendPray(text: string) {
    this.send('pray', { text })
  }
  close() {
    void this.channel?.unsubscribe()
    this.channel = null
  }
}
