import { useRemote } from '../store/remote'
import { useSession } from '../store/session'
import { useAudio } from '../store/audio'

/** 오른쪽 위: 함께 있는 사람 수와 내 이름 (연결됐을 때만) */
export function Presence() {
  const entered = useAudio((s) => s.entered)
  const status = useRemote((s) => s.status)
  const count = useRemote((s) => Object.keys(s.players).length) + 1
  const me = useSession((s) => s.displayName)
  if (!entered || status === 'solo') return null
  return (
    <div className="presence" aria-live="polite">
      {status === 'online' ? (
        <>
          <span className="presence-dot" />
          <span className="presence-long">함께 머무는 사람 {count}명</span>
          <span className="presence-short">함께 {count}명</span>
          <span className="presence-me">{me}</span>
        </>
      ) : status === 'connecting' ? (
        '기도실에 들어가는 중…'
      ) : (
        '기도실 연결이 원활하지 않아요 (혼자 머무는 중)'
      )}
    </div>
  )
}
