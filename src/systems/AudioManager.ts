// 소리 담당: 배경 찬양(피아노 샘플), 볼륨/음소거, 상황별 볼륨 낮추기(ducking).
// Tone.js 는 "입장하기"를 누른 뒤에 불러온다 (브라우저 자동재생 정책 + 첫 로딩을 가볍게).
// 추후 직접 치는 피아노(M5)와 효과음도 여기에 붙인다.
import type * as ToneNS from 'tone'
import { AUDIO } from '../config'
import { HYMNS } from '../data/hymns'
import { useAudio } from '../store/audio'
import { usePlayer, type Pose } from '../store/player'
import { buildTimeline } from './hymn'

type ToneLib = typeof ToneNS

// Salamander Grand Piano 축약본: A1~C7, 단3도(A, C, D#, F#) 간격 22개
const SAMPLE_NOTES = ['A1']
for (let o = 2; o <= 6; o++) SAMPLE_NOTES.push(`C${o}`, `D#${o}`, `F#${o}`, `A${o}`)
SAMPLE_NOTES.push('C7')
const sampleUrls = Object.fromEntries(SAMPLE_NOTES.map((n) => [n, `${n.replace('#', 's')}.mp3`]))

let Tone: ToneLib | null = null
let sampler: ToneNS.Sampler | null = null
let bgmGain: ToneNS.Gain | null = null
const ducks = new Map<string, number>() // 이유별 볼륨 배율 (기도 중, 연주 중 …)

const transport = () => Tone!.getTransport()

/** "입장하기": 오디오 시작 + 샘플 로딩 + 첫 곡 재생 */
export async function enter(withSound: boolean) {
  const store = useAudio.getState()
  if (store.phase === 'loading' || store.phase === 'ready') return
  useAudio.setState({ entered: true })
  if (!withSound) useAudio.getState().setMuted(true)
  useAudio.setState({ phase: 'loading' })
  try {
    Tone = await import('tone')
    await Tone.start() // 사용자 클릭 안에서 호출되어야 함
    const reverb = new Tone.Reverb({ decay: AUDIO.reverb.decay, wet: AUDIO.reverb.wet, preDelay: 0.03 })
    const master = new Tone.Gain(0.9).toDestination()
    reverb.connect(master)
    bgmGain = new Tone.Gain(0).connect(reverb)
    sampler = new Tone.Sampler({
      urls: sampleUrls,
      baseUrl: `${import.meta.env.BASE_URL}samples/`,
      release: AUDIO.release,
    }).connect(bgmGain)
    await Promise.all([Tone.loaded(), reverb.ready])
    useAudio.setState({ phase: 'ready' })
    if (import.meta.env.DEV) Object.assign(window, { __tone: Tone, __sampler: sampler, __bgmGain: bgmGain })
    watchState()
    applyVolume(0.1)
    playTrack(useAudio.getState().track)
  } catch (e) {
    console.error('오디오를 시작하지 못했습니다', e)
    useAudio.setState({ phase: 'error' })
  }
}

/** 곡 하나를 처음부터 재생. 끝나면 잠시 쉬고 다음 곡 */
function playTrack(index: number) {
  if (!Tone || !sampler) return
  const t = transport()
  t.stop()
  t.cancel(0)
  t.seconds = 0
  sampler.releaseAll()

  const track = (index + HYMNS.length) % HYMNS.length
  const timeline = buildTimeline(HYMNS[track], AUDIO.passes)
  const s = sampler
  for (const ev of timeline.events) {
    t.schedule((time) => s.triggerAttackRelease(ev.notes, ev.duration, time, ev.velocity), ev.time)
  }
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
  if (!Tone || !sampler) return
  const t = transport()
  if (useAudio.getState().playing) {
    t.pause()
    sampler.releaseAll()
    useAudio.setState({ playing: false })
  } else {
    t.start('+0.05')
    useAudio.setState({ playing: true })
  }
}

export const nextTrack = () => playTrack(useAudio.getState().track + 1)
export const prevTrack = () => playTrack(useAudio.getState().track - 1)

/** 상황별 볼륨 낮추기. amount = 배율(1 = 그대로). 같은 이유로 다시 부르면 덮어씀 */
export function setDuck(reason: string, amount: number | null) {
  if (amount === null || amount >= 1) ducks.delete(reason)
  else ducks.set(reason, amount)
  applyVolume(AUDIO.fadeSeconds)
}

function applyVolume(fade: number) {
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
