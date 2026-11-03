// 소리 담당: 배경 찬양(오르간 신시사이저 / 피아노 샘플), 볼륨/음소거, 상황별 볼륨 낮추기(ducking).
// Tone.js 는 "입장하기"를 누른 뒤에 불러온다 (브라우저 자동재생 정책 + 첫 로딩을 가볍게).
// 피아노 샘플은 피아노를 고를 때 처음 불러온다. 추후 직접 치는 피아노(M5)와 효과음도 여기에 붙인다.
import type * as ToneNS from 'tone'
import { AUDIO } from '../config'
import { HYMNS } from '../data/hymns'
import { useAudio, type Instrument, type Place } from '../store/audio'
import { usePlayer, type Pose } from '../store/player'
import { buildTimeline, noteToMidi, type NoteEvent } from './hymn'

type ToneLib = typeof ToneNS

// Salamander Grand Piano 축약본: A1~C7, 단3도(A, C, D#, F#) 간격 22개
const SAMPLE_NOTES = ['A1']
for (let o = 2; o <= 6; o++) SAMPLE_NOTES.push(`C${o}`, `D#${o}`, `F#${o}`, `A${o}`)
SAMPLE_NOTES.push('C7')
const sampleUrls = Object.fromEntries(SAMPLE_NOTES.map((n) => [n, `${n.replace('#', 's')}.mp3`]))

/** 배경 찬양 악기: 타임라인의 음 하나를 정해진 시각에 연주 */
type Voice = { play: (ev: NoteEvent, time: number) => void; silence: () => void }

let Tone: ToneLib | null = null
let bgmGain: ToneNS.Gain | null = null
let master: ToneNS.Gain | null = null
const voices: Partial<Record<Instrument, Voice>> = {}
let current: Voice | null = null
const ducks = new Map<string, number>() // 이유별 볼륨 배율 (기도 중, 연주 중 …)

const transport = () => Tone!.getTransport()

export function makeOrgan(T: ToneLib, out: ToneNS.ToneAudioNode): Voice {
  const O = AUDIO.organ
  const reverb = new T.Reverb({ decay: O.reverb.decay, wet: O.reverb.wet, preDelay: 0.04 }).connect(out)
  const filter = new T.Filter(O.brightness, 'lowpass').connect(reverb)
  const synth = (partials: number[]) =>
    new T.PolySynth(T.Synth, {
      oscillator: { type: 'custom', partials },
      envelope: { attack: O.attack, decay: 0.1, sustain: 1, release: O.release },
      volume: O.volumeDb,
    }).connect(filter)
  const manual = synth(O.manual)
  const pedal = synth(O.pedal)
  manual.maxPolyphony = 32
  // 배음 배열은 "한 옥타브 아래 음" 기준이라 실제 음보다 12반음 낮춰서 친다
  const down = (n: string) => T.Frequency(noteToMidi(n) - 12, 'midi').toFrequency()
  return {
    play(ev, time) {
      const notes = [...ev.notes]
      if (ev.bass) {
        const low = notes.reduce((a, b) => (noteToMidi(a) <= noteToMidi(b) ? a : b))
        notes.splice(notes.indexOf(low), 1)
        pedal.triggerAttackRelease(down(low), ev.duration, time, ev.velocity)
      }
      if (notes.length) manual.triggerAttackRelease(notes.map(down), ev.duration, time, ev.velocity)
    },
    silence() {
      manual.releaseAll()
      pedal.releaseAll()
    },
  }
}

export async function makePiano(T: ToneLib, out: ToneNS.ToneAudioNode): Promise<Voice> {
  const reverb = new T.Reverb({ decay: AUDIO.reverb.decay, wet: AUDIO.reverb.wet, preDelay: 0.03 }).connect(out)
  const sampler = new T.Sampler({
    urls: sampleUrls,
    baseUrl: `${import.meta.env.BASE_URL}samples/`,
    release: AUDIO.release,
  }).connect(reverb)
  await Promise.all([T.loaded(), reverb.ready])
  return {
    play: (ev, time) => sampler.triggerAttackRelease(ev.notes, ev.duration, time, ev.velocity),
    silence: () => sampler.releaseAll(),
  }
}

/** 악기를 준비(처음 한 번만 만듦) */
async function getVoice(kind: Instrument): Promise<Voice> {
  if (!voices[kind]) voices[kind] = kind === 'organ' ? makeOrgan(Tone!, bgmGain!) : await makePiano(Tone!, bgmGain!)
  return voices[kind]!
}

/** "입장하기": 오디오 시작 + 악기 준비 + 첫 곡 재생 */
export async function enter(withSound: boolean) {
  const store = useAudio.getState()
  if (store.phase === 'loading' || store.phase === 'ready') return
  useAudio.setState({ entered: true })
  if (!withSound) useAudio.getState().setMuted(true)
  useAudio.setState({ phase: 'loading' })
  try {
    Tone = await import('tone')
    await Tone.start() // 사용자 클릭 안에서 호출되어야 함
    master = new Tone.Gain(1.8).toDestination()
    bgmGain = new Tone.Gain(0).connect(master)
    current = await getVoice(useAudio.getState().instrument)
    useAudio.setState({ phase: 'ready' })
    if (import.meta.env.DEV) Object.assign(window, { __tone: Tone, __bgmGain: bgmGain })
    watchState()
    applyVolume(0.1)
    playTrack(useAudio.getState().track)
    applyRain()
  } catch (e) {
    console.error('오디오를 시작하지 못했습니다', e)
    useAudio.setState({ phase: 'error' })
  }
}

/** 곡 하나를 처음부터 재생. 끝나면 잠시 쉬고 다음 곡 */
function playTrack(index: number) {
  if (!Tone || !current) return
  const t = transport()
  t.stop()
  t.cancel(0)
  t.seconds = 0
  current.silence()

  const track = (index + HYMNS.length) % HYMNS.length
  const timeline = buildTimeline(HYMNS[track], AUDIO.passes, useAudio.getState().instrument)
  const voice = current
  for (const ev of timeline.events) t.schedule((time) => voice.play(ev, time), ev.time)
  // 화면의 마디 번호: 소리가 실제로 나는 시각에 맞춰 갱신 (마디마다 한 번)
  const show = (measure: number | null) => (at: number) =>
    setTimeout(() => useAudio.setState({ measure }), Math.max(0, (at - Tone!.now()) * 1000))
  for (const { m, time } of timeline.measures) t.schedule(show(m), time)
  t.schedule(show(null), timeline.length - 2)
  t.schedule(() => {
    // Transport 콜백 안에서 Transport 를 다시 설정하지 않도록 한 박자 뒤로 미룸
    setTimeout(() => playTrack(track + 1), 0)
  }, timeline.length + AUDIO.gapSeconds)

  useAudio.setState({ track, measure: null, playing: true })
  t.start('+0.1')
}

export function togglePlay() {
  if (!Tone || !current) return
  const t = transport()
  if (useAudio.getState().playing) {
    t.pause()
    current.silence()
    useAudio.setState({ playing: false })
  } else {
    t.start('+0.05')
    useAudio.setState({ playing: true })
  }
}

export const nextTrack = () => playTrack(useAudio.getState().track + 1)
export const prevTrack = () => playTrack(useAudio.getState().track - 1)

/** 악기 바꾸기: 지금 곡을 새 악기로 처음부터 */
export async function setInstrument(kind: Instrument) {
  useAudio.getState().setInstrument(kind)
  await applyInstrument()
}

/** 장소 바꾸기(예배당 ↔ 골방): 그 장소의 악기로 */
export async function setAudioPlace(place: Place) {
  useAudio.getState().setPlace(place)
  await applyInstrument()
}

/** 지금 설정된 악기와 연주 중인 악기가 다르면 바꿔서 지금 곡을 처음부터 */
async function applyInstrument() {
  const s = useAudio.getState()
  const kind = s.instrument
  if (!Tone || s.phase !== 'ready' || current === voices[kind]) return
  transport().stop()
  current?.silence()
  const needsLoad = !voices[kind]
  if (needsLoad) useAudio.setState({ phase: 'loading' })
  try {
    current = await getVoice(kind)
    useAudio.setState({ phase: 'ready' })
    playTrack(useAudio.getState().track)
  } catch (e) {
    console.error('악기를 불러오지 못했습니다', e)
    useAudio.setState({ phase: 'error' })
  }
}

/** 상황별 볼륨 낮추기. amount = 배율(1 = 그대로). 같은 이유로 다시 부르면 덮어씀 */
export function setDuck(reason: string, amount: number | null) {
  if (amount === null || amount >= 1) ducks.delete(reason)
  else ducks.set(reason, amount)
  applyVolume(AUDIO.fadeSeconds)
}

// ── 빗소리 (골방에 비 오는 날) ─────────────────────────
// 음원 없이 노이즈를 걸러 만든다: 낮게 깔리는 분홍 노이즈(빗줄기) + 아주 약한 높은 쉬익 소리(창에 부딪는 비), 천천히 일렁임
const RAIN_LEVEL = 0.18 // 빗소리 크기 (배경 찬양 볼륨 곡선을 따름). 처음 0.5는 너무 커서 약 1/3로
let rainWanted = false
let rain: { gain: ToneNS.Gain; nodes: ToneNS.ToneAudioNode[]; sources: (ToneNS.Noise | ToneNS.LFO)[] } | null = null

if (import.meta.env.DEV) Object.assign(window, { __rainOn: () => !!rain })

export function setRain(on: boolean) {
  rainWanted = on
  applyRain()
}

const rainVolume = () => {
  const { volume, muted } = useAudio.getState()
  return muted ? 0 : RAIN_LEVEL * volume * volume
}

function applyRain() {
  if (!Tone || !master) return
  if (rainWanted && !rain) {
    const T = Tone
    const gain = new T.Gain(0).connect(master)
    const sway = new T.Gain(1).connect(gain)
    const lfo = new T.LFO({ frequency: 0.13, min: 0.7, max: 1 }).connect(sway.gain).start()
    const body = new T.Noise('pink')
    const hp = new T.Filter(280, 'highpass')
    const lp = new T.Filter(2400, 'lowpass')
    body.chain(hp, lp, sway)
    const hiss = new T.Noise('white')
    const bp = new T.Filter({ frequency: 5200, type: 'bandpass', Q: 0.8 })
    const hissGain = new T.Gain(0.12)
    hiss.chain(bp, hissGain, sway)
    body.start()
    hiss.start()
    gain.gain.rampTo(rainVolume(), 2.5)
    rain = { gain, nodes: [sway, hp, lp, bp, hissGain], sources: [body, hiss, lfo] }
  } else if (!rainWanted && rain) {
    const r = rain
    rain = null
    r.gain.gain.rampTo(0, 1.5)
    setTimeout(() => {
      for (const s of r.sources) s.stop().dispose()
      for (const n of r.nodes) n.dispose()
      r.gain.dispose()
    }, 1700)
  }
}

function applyVolume(fade: number) {
  rain?.gain.gain.rampTo(rainVolume(), fade)
  if (!bgmGain) return
  const { volume, muted } = useAudio.getState()
  let g = muted ? 0 : volume * volume // 귀에 자연스러운 곡선
  for (const d of ducks.values()) g *= d
  bgmGain.gain.rampTo(g, fade)
}

let watching = false
function watchState() {
  if (watching) return
  watching = true
  // 볼륨/음소거 바뀌면 바로 반영
  useAudio.subscribe((s, prev) => {
    if (s.volume !== prev.volume || s.muted !== prev.muted) applyVolume(0.15)
  })
  // 기도 중 / 직접 연주 중이면 배경 찬양을 낮춤
  const onPose = (pose: Pose) => {
    setDuck('praying', pose === 'praying' ? AUDIO.duck.praying : null)
    setDuck('playing', pose === 'playing' ? AUDIO.duck.playing : null)
  }
  onPose(usePlayer.getState().pose)
  usePlayer.subscribe((s, prev) => {
    if (s.pose !== prev.pose) onPose(s.pose)
  })
}
