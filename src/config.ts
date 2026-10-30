// 공간 크기, 색, 조명 세기 등 조정 가능한 상수 모음.
// 단위: 미터. 좌표계: x = 좌우, y = 위, z = 앞(-, 단상) / 뒤(+, 입구)

export const HALL = {
  width: 24, // x: -12 ~ 12
  frontZ: -16, // 정면 벽
  backZ: 14, // 입구 벽
  height: 14, // 높은 천장으로 탁 트인 느낌
  frontSideDepth: 0.6, // 정면 좌/우 흰 벽이 중앙 원목 벽보다 앞으로 나온 깊이
  frontCenterHalf: 3.5, // 중앙 원목 벽 반폭
}

export const STAGE = {
  frontZ: -10.5, // 단상 앞 가장자리
  stepDepth: 0.6, // 아래 단 깊이
  stepHeight: 0.25,
  height: 0.6, // 위 단 높이
  leftX: -6.9, // 단상 왼쪽 끝 (왼쪽 앞은 성가대석)
  rightX: 10, // 단상 오른쪽 끝 (오른쪽은 넓게)
}

// 성가대석: 왼쪽 앞, 왼쪽 벽을 등지고 중앙(+x)을 바라보는 3단
export const CHOIR = {
  rows: 4,
  frontX: -7.6, // 맨 앞줄 장의자 중심 x
  rowSpacing: 1.1,
  tierHeight: 0.3, // 단마다 높아지는 높이 (단상 높이에서 시작)
  zFrom: -15.0,
  zTo: -8.4,
}

export const PEWS = {
  rows: 14,
  firstZ: -6.2, // 첫 줄 앞에 키보드 자리를 비워 둠
  spacing: 1.1,
  aisleHalf: 1.2, // 중앙 통로 반폭
  length: 7.6,
  seatHeight: 0.45,
  seatDepth: 0.45,
  backHeight: 0.95, // 등받이 꼭대기 높이
  frontSkipRows: 4, // 앞 몇 줄은 좌우 모두 비움 (왼쪽: 그랜드피아노·관현악, 오른쪽: 키보드·밴드)
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
  cross: '#f0dcb8', // 벽 십자가 (연한 원목)
  piano: '#16161a',
  pianoKeys: '#e8e2d4',
  grandPiano: '#1b1b1e', // 무광에 가까운 검정 (튀지 않게)
  pulpitAcrylic: '#f4f2ee', // 반투명 흰색 아크릴 강대상
  pulpitGlow: '#fff4e2',
  screenFrame: '#1a1a1d',
  speaker: '#1a1a1c',
  lampShade: '#f3e6cc',
  downlight: '#fff1d6',
  downlightTrim: '#d9d5cc', // 매입등 테두리
  downlightInner: '#4a4a50', // 꺼진 매입등 안쪽
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
  screenRect: { color: '#a8b8ff', intensity: 2.5 },
  screenBreath: { period: 14, depth: 0.25 }, // 초, 밝기 변화 폭
  wallLamp: { color: '#ffc488', intensity: 1.5, distance: 8, flicker: 0.04, glow: 0.35 }, // 업라이트: 벽 번짐 + 약한 광원
  crossSpot: { color: '#ffe2b8', intensity: 40 }, // 십자가를 아래에서 비추는 은은한 조명 (그림자 없음)
  pianoLamp: { color: '#ffc27a', intensity: 3, distance: 3.5 },
  downlightGlow: 0, // 천장 매입등 자체 발광 (0 = 꺼짐)
}

export const SCREEN = {
  // 좌/우 스크린 공통 문구
  text: '조용히 기도하는 시간입니다.',
  // 은은한 교회 예배 화면 느낌의 대각선 그라데이션 (보라빛 파랑 → 파랑)
  background: ['#6668bf', '#4b7fcf', '#5fa0db'],
  brightness: 0.85, // 스크린 전체 밝기 배율
  fadeSeconds: 4,
  font: '"Gowun Batang", serif',
}

export const PULPIT = {
  motto: 'SOLI DEO GLORIA',
  glow: 0.13, // 아크릴 안쪽 아주 약한 발광 (조명 받은 듯 튀지 않게)
}
