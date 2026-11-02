import { useEffect, useState } from 'react'
import { AVATARS } from '../data/avatars'
import { enterPlace } from '../systems/places'
import { watchRoom } from '../systems/network/NetworkManager'
import type { Place } from '../store/audio'
import { useRemote } from '../store/remote'
import { useUi } from '../store/ui'
import { DEFAULT_NAME_PREFIX, NAME_MAX, useSession } from '../store/session'
import { AvatarPreview } from './AvatarPreview'

/** 첫 화면: 지금 기도 중인 사람 수, 오늘의 내 모습, 이름, 예배당(함께) / 골방(혼자) 입장.
 *  이 클릭으로 오디오를 시작한다 (브라우저 정책). 골방 문으로 나오면 다시 이 화면 */
export function EnterScreen() {
  const place = useUi((s) => s.place)
  const savedName = useSession((s) => s.nickname)
  const avatarId = useSession((s) => s.avatarId)
  const status = useRemote((s) => s.status)
  const others = useRemote((s) => Object.keys(s.players).length)
  const [name, setName] = useState(savedName)
  const [quiet, setQuiet] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // 첫 화면부터 기도실에 연결해 인원만 확인 (입장 전에는 다른 사람에게 보이지 않음)
  useEffect(() => {
    void watchRoom()
  }, [])

  if (place && !leaving) return null

  const go = (p: Place) => {
    useSession.getState().setNickname(name)
    setLeaving(true)
    enterPlace(p, !quiet)
    setTimeout(() => setLeaving(false), 1600) // 페이드아웃이 끝나면 화면에서 제거
  }
  const nextAvatar = () => {
    const i = AVATARS.findIndex((a) => a.id === avatarId)
    useSession.getState().setAvatarId(AVATARS[(i + 1) % AVATARS.length].id)
  }

  return (
    <div className={`enter-screen${leaving ? ' leaving' : ''}`}>
      <form
        className="enter-card"
        onSubmit={(e) => {
          e.preventDefault()
          go('sanctuary')
        }}
      >
        <h1>새벽기도 온라인</h1>
        <p className="enter-sub">함께 드리는 새벽기도</p>
        {status === 'online' && (
          <p className="enter-live">
            <span className="presence-dot" />
            {others > 0 ? `지금 ${others}명이 기도하고 있어요` : '지금은 예배당이 조용해요'}
          </p>
        )}
        <div className="enter-me">
          <AvatarPreview />
          <button type="button" className="enter-avatar-next" onClick={nextAvatar} disabled={leaving}>
            다른 모습
          </button>
        </div>
        <input
          className="enter-name"
          value={name}
          maxLength={NAME_MAX}
          placeholder={DEFAULT_NAME_PREFIX}
          aria-label="이름"
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          enterKeyHint="go"
        />
        <div className="enter-places">
          <button className="enter-btn" type="submit" disabled={leaving}>
            예배당 입장
            <small>함께 기도해요</small>
          </button>
          <button className="enter-btn closet" type="button" onClick={() => go('closet')} disabled={leaving}>
            골방 입장
            <small>혼자 조용히</small>
          </button>
        </div>
        <label className="enter-quiet-toggle">
          <input type="checkbox" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} />
          소리 없이 들어가기
        </label>
        <p className="enter-note">잔잔한 찬양 반주가 흘러나옵니다.</p>
        <p className="enter-copyright">© 2026 Sieon Lee</p>
      </form>
    </div>
  )
}
