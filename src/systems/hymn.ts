// 찬송가 JSON(src/data/hymns/*.json)을 읽어 연주 타임라인(초 단위 음 목록)으로 바꾼다.
// 표기법은 src/data/hymns/README.md 참고. 이 파일은 다른 모듈을 import 하지 않는다
// (scripts/check-hymns.ts 에서 Node 로 바로 불러 검사하기 위해).

export type Dyn = 'pp' | 'p' | 'mp' | 'mf'

export type HymnMeasure = {
  m: number // 마디 번호 (못갖춘마디 = 0)
  rh: string // 오른손(멜로디)
  lh: string // 왼손(반주)
  dyn?: Dyn // 이 마디부터의 셈여림
  end?: boolean // 프레이즈 끝: 살짝 느려지며 숨 쉼
}

export type Hymn = {
  id: string
  title: string
  titleEn: string
  hymnal: string
  tune: string
  composer: string
  year: number | null // 작곡 연도 (확인되지 않으면 null)
  source: string
  key: string
  meter: [number, number]
  bpm: number
  measures: HymnMeasure[]
}

export type Token = { pitches: string[]; midis: number[]; beats: number; tie: boolean }

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** "F#3" → 54, "Bb2" → 46 */
export function noteToMidi(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name)
  if (!m) throw new Error(`음 이름을 읽을 수 없음: "${name}"`)
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  return (Number(m[3]) + 1) * 12 + STEP[m[1]] + acc
}

/** "G2/1 D3+B3/2 r/1 D5/3~" → 토큰 목록 */
export function parseVoice(src: string): Token[] {
  return src
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const m = /^([^/]+)\/([\d.]+)(~?)$/.exec(tok)
      if (!m) throw new Error(`토큰을 읽을 수 없음: "${tok}" (예: G4/1, D3+B3/2, r/1)`)
      const pitches = m[1] === 'r' ? [] : m[1].split('+')
      const beats = Number(m[2])
      if (!(beats > 0)) throw new Error(`길이가 잘못됨: "${tok}"`)
      return { pitches, midis: pitches.map(noteToMidi), beats, tie: m[3] === '~' }
    })
}

export const sumBeats = (tokens: Token[]) => tokens.reduce((a, t) => a + t.beats, 0)

/** 마디 길이 검사: 못갖춘마디 + 마지막 마디 = 한 마디. 문제 목록을 돌려준다 */
export function validateHymn(h: Hymn): string[] {
  const errors: string[] = []
  const full = h.meter[0] * (4 / h.meter[1])
  const ms = h.measures
  const pickup = ms[0]?.m === 0 ? ms[0] : null
  ms.forEach((ms_, i) => {
    for (const hand of ['rh', 'lh'] as const) {
      let beats: number
      try {
        beats = sumBeats(parseVoice(ms_[hand]))
      } catch (e) {
        errors.push(`${ms_.m}마디 ${hand}: ${(e as Error).message}`)
        continue
      }
      let expect = full
      if (ms_ === pickup) expect = sumBeats(parseVoice(pickup.rh))
      else if (pickup && i === ms.length - 1) expect = full - sumBeats(parseVoice(pickup.rh))
      if (Math.abs(beats - expect) > 1e-6) errors.push(`${ms_.m}마디 ${hand}: ${beats}박 (예상 ${expect}박)`)
    }
    if (i > 0 && ms_.m !== ms[i - 1].m + 1) errors.push(`마디 번호가 이어지지 않음: ${ms[i - 1].m} → ${ms_.m}`)
  })
  return errors
}

// ---- 연주 타임라인 ----

export type NoteEvent = {
  time: number // 곡 시작부터 초
  notes: string[]
  duration: number // 초 (페달 포함 울림 길이)
  velocity: number // 0~1
  bass?: boolean // 왼손 베이스 음(가장 낮은 음은 오르간 발건반으로)
}

/** piano: 페달로 왼손 전체를 이어 울림 / organ: 베이스만 이어지고 나머지는 적힌 길이대로 레가토 */
export type PlayStyle = 'piano' | 'organ'

export type Timeline = {
  events: NoteEvent[]
  measures: { m: number; time: number }[]
  length: number // 마지막 음이 시작하고 끝나는 시점(초)
}

const DYN_VEL: Record<Dyn, number> = { pp: 0.26, p: 0.36, mp: 0.47, mf: 0.58 }

type Pass = { measures: HymnMeasure[]; soft: number; last: boolean }

/**
 * 루바토/페달 느낌을 넣어 초 단위 타임라인을 만든다.
 * - 프레이즈 끝 마디(end)는 뒤로 갈수록 점점 느려짐, 마지막 마디는 더 많이
 * - 왼손 음은 다음 베이스 음(C3 아래)이 나올 때까지 울림(페달 교체), 오른손은 살짝 겹치게(레가토)
 * - passes: 몇 번 반복할지. 두 번째부터는 조금 더 여리게
 */
export function buildTimeline(h: Hymn, passes = 2, style: PlayStyle = 'piano', rand: () => number = Math.random): Timeline {
  const organ = style === 'organ'
  const beatSec = 60 / h.bpm
  const events: NoteEvent[] = []
  const measures: Timeline['measures'] = []
  // 반복할 때 마지막 마디 + 다음 절 못갖춘마디가 합쳐져 한 마디가 된다
  const plan: Pass[] = Array.from({ length: passes }, (_, p) => ({
    measures: h.measures,
    soft: p === 0 ? 1 : 0.85,
    last: p === passes - 1,
  }))

  let t = 0.15
  let vel = DYN_VEL.p
  // 붙임줄(~) 처리를 위해 손마다 마지막 이벤트 기억
  const lastEv: Record<'rh' | 'lh', NoteEvent | null> = { rh: null, lh: null }
  const pendingTie: Record<'rh' | 'lh', boolean> = { rh: false, lh: false }
  // 왼손 페달: 다음 베이스 음이 나올 때까지 울릴 이벤트들
  let pedalGroup: NoteEvent[] = []

  plan.forEach((pass, pi) => {
    pass.measures.forEach((ms, mi) => {
      if (ms.dyn) vel = DYN_VEL[ms.dyn]
      const isFinal = pass.last && mi === pass.measures.length - 1
      const rit = isFinal ? 0.9 : ms.end ? 0.32 : 0
      const rh = parseVoice(ms.rh)
      const lh = parseVoice(ms.lh)
      const len = Math.max(sumBeats(rh), sumBeats(lh))
      // 마디 안의 박 위치 x(0~len) → 초. 점점 느려지는 리타르단도: x + rit·x²/(2·len)
      const sway = 1 + 0.025 * Math.sin((mi / 4) * Math.PI) // 아주 미세한 흔들림
      const at = (x: number) => (x + (rit * x * x) / (2 * len)) * beatSec * sway
      measures.push({ m: ms.m, time: t })

      for (const hand of ['rh', 'lh'] as const) {
        let x = 0
        for (const tok of hand === 'rh' ? rh : lh) {
          const start = t + at(x)
          const end = t + at(x + tok.beats)
          x += tok.beats
          if (tok.pitches.length === 0) {
            pendingTie[hand] = false
            continue
          }
          if (pendingTie[hand] && lastEv[hand]) {
            // 붙임줄: 새로 치지 않고 앞 음을 늘린다
            const ev = lastEv[hand]!
            ev.duration = end - ev.time + (hand === 'rh' ? 0.08 : 0)
            pendingTie[hand] = tok.tie
            continue
          }
          const jitter = (rand() - 0.5) * (organ ? 0.01 : 0.024)
          const bassy = hand === 'lh' && Math.min(...tok.midis) < 48
          // 오르간은 건반 세기로 소리가 달라지지 않으므로 셈여림만 반영(강세·흔들림 없음)
          const accent = organ ? 1 : x - tok.beats === 0 ? 1.06 : 1
          const v = vel * pass.soft * accent * (hand === 'rh' ? 1 : organ ? 0.8 : 0.62) * (organ ? 1 : 0.94 + rand() * 0.12)
          // 오르간: 같은 음을 다시 칠 때 끊김이 들리도록 아주 살짝 짧게
          const legato = hand === 'rh' ? (organ ? 0.97 : 1.08) : organ ? 0.97 : 1
          const ev: NoteEvent = {
            time: Math.max(0, start + jitter - (bassy && !organ ? 0.012 : 0)),
            notes: tok.pitches,
            duration: (end - start) * legato + (isFinal ? (organ ? 1.2 : 2.5) : 0),
            velocity: Math.min(1, v),
            bass: bassy,
          }
          if (hand === 'lh' && (!organ || bassy)) {
            if (bassy) {
              // 페달 교체: 이전 묶음은 이 시점까지 울리고 끝
              for (const pe of pedalGroup) pe.duration = Math.max(pe.duration, ev.time - pe.time + (organ ? -0.03 : 0.05))
              pedalGroup = []
            }
            pedalGroup.push(ev)
          }
          events.push(ev)
          lastEv[hand] = ev
          pendingTie[hand] = tok.tie
        }
      }
      t += at(len)
      // 프레이즈 끝: 살짝 숨 쉬는 틈 (페달은 이어짐)
      if (ms.end && !isFinal) t += beatSec * 0.18
    })
    if (pi < plan.length - 1) t += beatSec * 0.4 // 절 사이 숨
  })
  // 마지막 페달 묶음은 곡 끝까지
  for (const pe of pedalGroup) pe.duration = Math.max(pe.duration, t - pe.time + (organ ? 1.2 : 2.5))
  events.sort((a, b) => a.time - b.time)
  return { events, measures, length: t + 2.5 }
}
