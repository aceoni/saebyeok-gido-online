import { useState } from 'react'
import { enter } from '../systems/AudioManager'
import { useAudio } from '../store/audio'

/** 첫 화면: 예배당이 어렴풋이 보이는 위에 "입장하기". 이 클릭으로 오디오를 시작한다 (브라우저 정책) */
export function EnterScreen() {
  const entered = useAudio((s) => s.entered)
  const [leaving, setLeaving] = useState(false)
  if (entered && !leaving) return null

  const go = (withSound: boolean) => {
    setLeaving(true)
    void enter(withSound)
    setTimeout(() => setLeaving(false), 1600) // 페이드아웃이 끝나면 화면에서 제거
  }

  return (
    <div className={`enter-screen${leaving ? ' leaving' : ''}`}>
      <div className="enter-card">
        <h1>새벽기도 온라인</h1>
        <p className="enter-sub">고요한 새벽, 잠시 머물다 가세요.</p>
        <button className="enter-btn" onClick={() => go(true)} disabled={leaving}>
          입장하기
        </button>
        <button className="enter-quiet" onClick={() => go(false)} disabled={leaving}>
          소리 없이 입장
        </button>
        <p className="enter-note">잔잔한 피아노 찬양이 흘러나옵니다.</p>
      </div>
    </div>
  )
}
