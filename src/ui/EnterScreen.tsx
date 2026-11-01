import { useState } from 'react'
import { enter } from '../systems/AudioManager'
import { startNetwork } from '../systems/network/NetworkManager'
import { useAudio } from '../store/audio'
import { DEFAULT_NAME_PREFIX, NAME_MAX, useSession } from '../store/session'

/** 첫 화면: 예배당이 어렴풋이 보이는 위에 닉네임 + "입장하기". 이 클릭으로 오디오와 기도실 연결을 시작한다 */
export function EnterScreen() {
  const entered = useAudio((s) => s.entered)
  const savedName = useSession((s) => s.nickname)
  const [name, setName] = useState(savedName)
  const [leaving, setLeaving] = useState(false)
  if (entered && !leaving) return null

  const go = (withSound: boolean) => {
    useSession.getState().setNickname(name)
    setLeaving(true)
    void startNetwork()
    void enter(withSound)
    setTimeout(() => setLeaving(false), 1600) // 페이드아웃이 끝나면 화면에서 제거
  }

  return (
    <div className={`enter-screen${leaving ? ' leaving' : ''}`}>
      <form
        className="enter-card"
        onSubmit={(e) => {
          e.preventDefault()
          go(true)
        }}
      >
        <h1>새벽기도 온라인</h1>
        <p className="enter-sub">고요한 새벽, 잠시 머물다 가세요.</p>
        <label className="enter-name">
          <span>이름</span>
          <input
            value={name}
            maxLength={NAME_MAX}
            placeholder={`비워 두면 '${DEFAULT_NAME_PREFIX} 1'처럼`}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            enterKeyHint="go"
          />
        </label>
        <button className="enter-btn" type="submit" disabled={leaving}>
          입장하기
        </button>
        <button className="enter-quiet" type="button" onClick={() => go(false)} disabled={leaving}>
          소리 없이 입장
        </button>
        <p className="enter-note">잔잔한 찬양 반주가 흘러나옵니다. 함께 있는 분들에게는 이름과 모습만 보입니다.</p>
      </form>
    </div>
  )
}
