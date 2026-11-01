import { useRemote } from '../store/remote'
import { useSession } from '../store/session'
import { useAudio } from '../store/audio'
import { useUi } from '../store/ui'

/** 오른쪽 위: 함께 있는 사람 수, 내 이름, 이름표 보이기 켜기/끄기 */
export function Presence() {
  const entered = useAudio((s) => s.entered)
  const status = useRemote((s) => s.status)
  const count = useRemote((s) => Object.keys(s.players).length) + 1
  const me = useSession((s) => s.displayName)
  const showNames = useUi((s) => s.showNames)
  if (!entered) return null
  const toggle = (
    <button
      className={`name-toggle${showNames ? ' on' : ''}`}
      onClick={() => useUi.getState().setShowNames(!showNames)}
      aria-pressed={showNames}
      title="머리 위 이름 보이기"
    >
      <span className="name-toggle-track">
        <span className="name-toggle-knob" />
      </span>
      이름
    </button>
  )
  if (status === 'solo') return <div className="presence">{toggle}</div>
  return (
    <div className="presence" aria-live="polite">
      {status === 'online' ? (
        <>
          <span className="presence-dot" />
          <span className="presence-long">함께 머무는 사람 {count}명</span>
          <span className="presence-short">함께 {count}명</span>
          <span className="presence-me">{me}</span>
          {toggle}
        </>
      ) : status === 'connecting' ? (
        '기도실에 들어가는 중…'
      ) : (
        '기도실 연결이 원활하지 않아요 (혼자 머무는 중)'
      )}
    </div>
  )
}
