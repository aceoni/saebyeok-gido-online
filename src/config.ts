// 공간 크기, 색, 조명 세기 등 조정 가능한 상수 모음.
// 단위: 미터. 좌표계: x = 좌우, y = 위, z = 앞(-, 단상) / 뒤(+, 입구)

export const HALL = {
  width: 24, // x: -12 ~ 12
  frontZ: -16, // 정면 벽
  backZ: 14, // 입구 벽
  height: 14, // 높은 천장으로 탁 트인 느낌
}

export const STAGE = {
  frontZ: -10.5, // 단상 앞 가장자리
  stepDepth: 0.6, // 아래 단 깊이
  stepHeight: 0.25,
  height: 0.6, // 위 단 높이
}

export const PEWS = {
  rows: 11,
  firstZ: -6.2, // 첫 줄 앞에 키보드 자리를 비워 둠
  spacing: 1.1,
  aisleHalf: 1.2, // 중앙 통로 반폭
  length: 7.6,
  seatHeight: 0.45,
  seatDepth: 0.45,
  backHeight: 0.95, // 등받이 꼭대기 높이
}

// 밝은 원목 + 크림색 벽 + 회색 쿠션의 현대적인 예배당 톤
export const COLORS = {
  background: '#101218',
  fog: '#232733',
  floor: '#b7afa2',
  carpet: '#8e8a85',
  wall: '#e6dfd2',
  wallLower: '#b98d61', // 아래쪽 원목 패널
  ceiling: '#dcd5c8',
  pillar: '#d8d0c2',
  wood: '#c8a072', // 밝은 오크
  woodDark: '#a87d52',
  cushion: '#8b8f96', // 장의자 회색 쿠션
  stage: '#d4b78e', // 단상 원목 마루
  frontPanel: '#bf9466', // 강대상 뒤 원목 벽
  piano: '#16161a',
  pianoKeys: '#e8e2d4',
  pulpitAcrylic: '#f4f2ee', // 반투명 흰색 아크릴 강대상
  pulpitGlow: '#fff4e2',
  screenFrame: '#1a1a1d',
  speaker: '#1a1a1c',
  lampShade: '#f3e6cc',
  downlight: '#fff1d6',
  flower: ['#f2ead8', '#e8b4b4', '#f2e6a6'],
  leaf: '#4a6a3e',
  drumShell: '#5b1f24', // 드럼 셸 (짙은 와인색 래커)
  cymbal: '#c9a548',
  chairFabric: '#9a9184',
  door: '#b08a62',
}

export const LIGHTS = {
  ambient: { color: '#b4bad6', intensity: 0.26 },
  hemi: { sky: '#cfd3e6', ground: '#5a4a3a', intensity: 0.36 },
  fog: { near: 14, far: 75 },
  pulpitSpot: { color: '#ffd9a0', intensity: 160, angle: 0.42, penumbra: 0.7, height: 7 },
  screenRect: { color: '#a8b8ff', intensity: 2.5 },
  screenBreath: { period: 14, depth: 0.25 }, // 초, 밝기 변화 폭
  wallLamp: { color: '#ffc488', intensity: 22, distance: 20, flicker: 0.05 },
  pianoLamp: { color: '#ffc27a', intensity: 3, distance: 3.5 },
  downlightGlow: 0.35, // 천장 매입등 자체 발광 세기 (실제 광원 아님)
}

export const SCREEN = {
  // 왼쪽 스크린 문구 (몇 분마다 페이드 전환)
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

export const PULPIT = {
  motto: 'SOLI DEO GLORIA',
  glow: 0.4, // 아크릴 안쪽 은은한 발광
}
