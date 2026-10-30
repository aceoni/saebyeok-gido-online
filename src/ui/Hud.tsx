// 화면 위쪽 조작 안내: 처음 몇 초만 보이고 천천히 사라진다 (CSS 애니메이션)
export function Hud() {
  return (
    <div className="hud-guide" aria-live="polite">
      바닥 클릭 또는 WASD로 걷기 · 우클릭 드래그로 둘러보기 · 휠로 가까이/멀리 · 장의자 곁에서 E로 앉기
    </div>
  )
}
