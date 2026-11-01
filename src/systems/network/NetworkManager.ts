// 여러 사람이 함께: 입장하면 기도실(하나)에 접속해 내 위치·자세를 보내고, 다른 사람들의 것을 받는다.
// 연결 방식: VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY 가 있으면 Supabase Realtime,
// 개발 중 ?mp=local 이면 같은 브라우저 탭끼리, 둘 다 아니면 혼자(solo).
import { usePlayer } from '../../store/player'
import { useRemote, type NetState } from '../../store/remote'
import { DEFAULT_NAME_PREFIX, useSession } from '../../store/session'
import { LocalTransport } from './localTransport'
import { SupabaseTransport } from './supabaseTransport'
import type { Member, Transport } from './transport'

const SEND_INTERVAL = 100 // ms: 움직일 때 최대 초당 10번
const HEARTBEAT = 2500 // ms: 가만히 있어도 이따금 보냄 (늦게 들어온 사람도 볼 수 있게)
const BUBBLE_MS = 15000 // 소리내어 기도한 문장이 머리 위에 떠 있는 시간
export const PRAY_MAX = 80

let transport: Transport | null = null
let lastSent: NetState | null = null
let lastSentAt = 0
let forceSend = false

function pickTransport(): Transport | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && key) return new SupabaseTransport(url, key)
  if (new URLSearchParams(location.search).get('mp') === 'local') return new LocalTransport()
  return null
}

const myState = (): NetState => {
  const s = usePlayer.getState()
  return { p: s.position, r: s.rotY, pose: s.pose, level: s.level, seat: s.seat?.id ?? null }
}

function changed(a: NetState, b: NetState | null) {
  if (!b) return true
  return (
    a.pose !== b.pose ||
    a.level !== b.level ||
    a.seat !== b.seat ||
    Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) > 0.02 ||
    Math.abs(a.r - b.r) > 0.05
  )
}

/** 닉네임을 비워 두면 '익명의 성도 N' 중 비어 있는 가장 작은 번호 */
function autoName(members: Member[], myId: string) {
  const used = new Set(
    members
      .filter((m) => m.id !== myId)
      .map((m) => m.name.match(new RegExp(`^${DEFAULT_NAME_PREFIX} (\\d+)$`))?.[1])
      .filter(Boolean)
      .map(Number),
  )
  let k = 1
  while (used.has(k)) k++
  return `${DEFAULT_NAME_PREFIX} ${k}`
}

let members: Member[] = []
let joined = false
let firstMembers: () => void = () => {}
const membersReady = new Promise<void>((r) => (firstMembers = r))

function onMembers(list: Member[]) {
  members = list
  firstMembers()
  const { id } = useSession.getState()
  const prev = useRemote.getState().players
  const players: typeof prev = {}
  for (const m of list) {
    if (m.id === id) continue
    players[m.id] = prev[m.id]
      ? { ...prev[m.id], name: m.name, avatarId: m.avatarId }
      : { id: m.id, name: m.name, avatarId: m.avatarId, state: null, updatedAt: Date.now() }
    if (!prev[m.id] && joined) forceSend = true // 새로 온 사람에게 내 위치를 바로 알림
  }
  useRemote.setState({ players })
}

/** 첫 화면에서: 기도실에 연결해 지금 몇 명이 있는지만 본다 (나는 아직 안 보임) */
export async function watchRoom() {
  if (transport) return
  transport = pickTransport()
  if (!transport) {
    useRemote.setState({ status: 'solo' })
    return
  }
  try {
    await transport.connect(useSession.getState().id, {
      onMembers,
      onState: (pid, s) => {
        const p = useRemote.getState().players[pid]
        if (!p) return
        useRemote.setState({ players: { ...useRemote.getState().players, [pid]: { ...p, state: s, updatedAt: Date.now() } } })
      },
      onPray: (pid, text) => showBubble(pid, text),
      onStatus: (status) => useRemote.setState({ status }),
    })
  } catch (e) {
    console.error('기도실 연결 실패', e)
    useRemote.setState({ status: 'error' })
    transport = null
    return
  }
  window.addEventListener('pagehide', () => transport?.close())
}

/** 입장하기: 이름(비우면 비어 있는 '익명의 성도 N')·아바타로 기도실에 들어가 내 상태를 보내기 시작 */
export async function startNetwork() {
  const { id, nickname, avatarId } = useSession.getState()
  if (!transport) {
    useSession.getState().setDisplayName(nickname || DEFAULT_NAME_PREFIX)
    return
  }
  if (joined) return
  joined = true
  // 번호를 겹치지 않게 매기려면 지금 있는 사람 목록이 필요 (최대 3초 기다림)
  await Promise.race([membersReady, new Promise((r) => setTimeout(r, 3000))])
  const name = nickname || autoName(members, id)
  useSession.getState().setDisplayName(name)
  transport.join({ name, avatarId })
  forceSend = true
  // 내 상태 보내기: 바뀌었을 때만 + 이따금 한 번씩
  window.setInterval(() => {
    const s = myState()
    const now = Date.now()
    if (forceSend || changed(s, lastSent) || now - lastSentAt > HEARTBEAT) {
      transport?.sendState({ ...s, p: s.p.map((v) => Math.round(v * 100) / 100) as NetState['p'], r: Math.round(s.r * 100) / 100 })
      lastSent = s
      lastSentAt = now
      forceSend = false
    }
  }, SEND_INTERVAL)
}

function showBubble(id: string, text: string) {
  const t = text.trim().slice(0, PRAY_MAX)
  if (!t) return
  useRemote.setState({ bubbles: { ...useRemote.getState().bubbles, [id]: { text: t, until: Date.now() + BUBBLE_MS } } })
}

/** '소리내어 기도하기': 이 문장만 함께 있는 사람들에게 보낸다 (기도 메모 전체는 보내지 않음) */
export function prayAloud(text: string) {
  const t = text.trim().slice(0, PRAY_MAX)
  if (!t) return
  showBubble(useSession.getState().id, t)
  transport?.sendPray(t)
}

export const isOnline = () => !!transport
