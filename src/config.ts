// 공간 크기, 색, 조명 세기 등 조정 가능한 상수 모음.
// 단위: 미터. 좌표계: x = 좌우, y = 위, z = 앞(-, 단상) / 뒤(+, 입구)

export const HALL = {
  width: 20, // x: -10 ~ 10
  frontZ: -16, // 정면 벽
  backZ: 14, // 입구 벽
  height: 8,
}

export const STAGE = {
  frontZ: -10.5, // 단상 앞 가장자리
  stepDepth: 0.6, // 아래 단 깊이
  stepHeight: 0.25,
  height: 0.6, // 위 단 높이
}

export const PEWS = {
  rows: 11,
  firstZ: -7.5,
  spacing: 1.15,
  aisleHalf: 1.2, // 중앙 통로 반폭
  length: 6.8,
  seatHeight: 0.45,
  seatDepth: 0.45,
  backHeight: 0.95, // 등받이 꼭대기 높이
}

export const COLORS = {
  background: '#06070c',
  fog: '#0b0d16',
  floor: '#3a2a20',
  carpet: '#4a1a1e',
  wall: '#6b4a33',
  wallLower: '#4f3524',
  ceiling: '#2a2420',
  pillar: '#5a3d2a',
  wood: '#7a5233',
  woodDark: '#4a2f1e',
  stage: '#5c3b26',
  stageCarpet: '#5a2026',
  piano: '#0d0d0f',
  pianoKeys: '#e8e2d4',
  screenFrame: '#111114',
  screenGlow: '#1c2740',
  speaker: '#1a1a1c',
  lampShade: '#f3d9a8',
  flower: ['#e8d8c0', '#d98c8c', '#f2e6a6'],
  leaf: '#2f4a2a',
  flagCross: '#f0ead8',
  flagRed: '#8a2a2a',
  flagBlue: '#2a3a6a',
  door: '#3f2a1c',
}

export const LIGHTS = {
  ambient: { color: '#7d8ab0', intensity: 0.35 },
  hemi: { sky: '#3a4566', ground: '#2a1c14', intensity: 0.45 },
  fog: { near: 10, far: 55 },
  pulpitSpot: { color: '#ffcf8a', intensity: 140, angle: 0.42, penumbra: 0.7, height: 7 },
  screenRect: { color: '#a8b8ff', intensity: 3 },
  screenBreath: { period: 14, depth: 0.25 }, // 초, 밝기 변화 폭
  wallLamp: { color: '#ffb066', intensity: 5, distance: 9, flicker: 0.06 },
  pianoLamp: { color: '#ffc27a', intensity: 4, distance: 4 },
}

export const SCREEN = {
  // 정면 스크린 문구 (몇 분마다 페이드 전환)
  messages: [
    '조용히 기도하는 시간입니다.',
    '주님 앞에 마음을 내려놓습니다.',
    '평안이 함께하기를',
    '잠시 멈추어 숨을 고릅니다.',
    '오늘 하루도 은혜 안에서',
  ],
  holdSeconds: 150, // 한 문구 유지 시간
  fadeSeconds: 4,
  font: '"Gowun Batang", serif',
}
