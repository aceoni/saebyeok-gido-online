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

// 성가대석: 왼쪽 앞, 왼쪽 벽을 등지고 중앙(+x)을 바라보는 계단식
export const CHOIR = {
  rows: 4,
  frontX: -7.6, // 맨 앞줄 장의자 중심 x
  rowSpacing: 1.1,
  tierHeight: 0.3, // 단마다 높아지는 높이 (단상 높이에서 시작)
  zFrom: -15.0,
  zTo: -8.4,
  frontAisle: 0.8, // 정면 벽 쪽 통로 폭 (장의자는 그만큼 짧음) → 각 줄 끝까지 걸어갈 수 있음
  entrance: [-15.3, -14.5] as [number, number], // 단상 쪽 칸막이 출입구 (z 범위, 통로 끝)
}

// 2층 좌석(발코니): 뒤쪽 위 공간. 단상을 바라보는 계단식 장의자
export const BALCONY = {
  floorY: 5.2, // 발코니 바닥 높이
  slabThickness: 0.45,
  frontZ: 6.9, // 발코니 앞 가장자리 (난간)
  rows: 4,
  firstRowZ: 8.0,
  rowSpacing: 1.3, // 줄 사이로 지나다닐 수 있게
  aisleHalf: 1.2, // 가운데 통로 반폭 (단마다 반 칸씩 계단)
  tierHeight: 0.5, // 아래에서도 의자가 잘 보이게 단차를 크게
}

export const PEWS = {
  rows: 14,
  firstZ: -6.2, // 첫 줄 앞에 키보드 자리를 비워 둠
  spacing: 1.3, // 줄 사이로 지나다닐 수 있게
  aisleHalf: 1.2, // 중앙 통로 반폭
  length: 7.6,
  seatHeight: 0.45,
  seatDepth: 0.45,
  backHeight: 0.95, // 등받이 꼭대기 높이
  frontSkipRows: 4, // 왼쪽: 앞 몇 줄을 비움 (그랜드피아노·관현악 자리)
  frontSkipRowsRight: 2, // 오른쪽: 앞 몇 줄을 비움 (키보드·밴드 자리)
  // 앞 의자 등받이 뒤에 달린 작은 테이블(성경·찬송 받침)
  shelfY: 0.72, // 테이블 윗면 높이 (그 줄 바닥 기준)
  shelfDepth: 0.2,
  shelfBack: 0.315, // 장의자 중심에서 뒤쪽(뒷줄 쪽)으로 테이블 중심까지 거리
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
  character: {
    top: '#9c8670', // 따뜻한 회갈색 카디건
    shirt: '#efe8dc', // 안쪽 셔츠 깃
    pants: '#454a58',
    skin: '#f0cfae',
    hair: '#3a2c24',
    eyes: '#2a2220',
    cheek: '#eaa79a',
    shoes: '#5a4636',
  },
  door: '#dcb684', // 정문 밝은 원목
  // 기도 골방 (어두운 나무 오두막)
  closet: {
    wall: '#4a3322',
    seam: '#2b1d13',
    floor: '#3f2c1e',
    floorDark: '#35251a',
    floorLight: '#4a3424',
    ceiling: '#33241a',
    beam: '#2a1c12',
    trim: '#5a3e28',
    shutter: '#6b4a2e',
    oak: '#8a6440',
    oakDark: '#6e4e32',
    cross: '#8a603a',
    door: '#5c4029',
    rug: '#4d2420',
    cushion: '#4a4a3a',
    glass: '#b9c8e6',
    dawn: '#5d6f9a', // 창 밖 새벽 하늘
    dawnRain: '#323b52', // 비 오는 새벽
    dawnSnow: '#4a5675', // 눈 오는 새벽 (눈송이가 잘 보이게 하늘은 어둡게)
    dawnLight: '#a9bde6',
    dawnIntensity: 3.2,
    candle: '#ffae5c',
    candleIntensity: 3.0,
    ambient: '#4c4662',
    ambientIntensity: 1.3,
  },
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
  entranceLight: { color: '#ffd9a8', intensity: 2.5, distance: 7 }, // 정문 위 은은한 입구 조명
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

// 2층 난간 앞 디지털 시계 (설교자용)
export const CLOCK = {
  width: 1.2,
  digitColor: '#ff2a1a',
  offColor: '#2a0806', // 꺼진 세그먼트
  glow: 0.9, // 숫자 자체 발광 (은은하게)
}

export const PULPIT = {
  motto: 'SOLI DEO GLORIA',
  glow: 0.13, // 아크릴 안쪽 아주 약한 발광 (조명 받은 듯 튀지 않게)
}

// 플레이어(캐릭터) 이동
export const PLAYER = {
  spawn: [0, 0, 9.8] as [number, number, number], // 1층 중앙 통로 뒤쪽 (캐릭터와 정면 십자가가 함께 보이는 자리)
  spawnRotY: Math.PI, // 단상(-z)을 바라봄
  walkSpeed: 3.4, // m/s
  turnSpeed: 10, // 방향 전환 부드러움
  radius: 0.18, // 충돌 반경 (SD 캐릭터)
  maxStep: 0.36, // 한 번에 오를 수 있는 높이 (단상 계단, 성가대 단)
}

// 3인칭 카메라
export const CAMERA = {
  distance: 4, // 기본 거리
  minDistance: 1.5,
  maxDistance: 12,
  pitch: 0.12, // 기본 내려다보는 각도 (rad): 낮게 → 정면 십자가까지 보임
  minPitch: 0.05,
  maxPitch: 1.25,
  lookHeight: 1.5, // 바라보는 높이 (SD 캐릭터 머리 위쪽 → 캐릭터는 화면 아래, 정면은 위로 보임)
  follow: 6, // 따라가는 부드러움 (클수록 빠름)
  rotateSpeed: 0.005, // 우클릭 드래그 회전 감도
}

// 앉기·기도
export const SEAT = {
  reach: 0.95, // 이 거리 안이면 "앉기" 말풍선
  seatWidth: 0.55, // 장의자 한 자리 폭: 자리를 정해진 칸으로 나눠 여러 사람이 겹치지 않게 나란히 앉음
  edgeMargin: 0.35, // 장의자 끝에서 이만큼 안쪽까지만 앉음
  hipLift: 0.095, // 앉았을 때 캐릭터 기준점 높이 (좌판 위)
  standOffset: 0.5, // 일어날 때 좌판 앞쪽으로 나서는 거리
  eyeHeight: 1.05, // 기도 중 1인칭 눈높이 (앉은 기준점 위)
  prayLookDown: 0.09, // 1인칭에서 살짝 내려다보는 정도 (앞자리 등받이와 단상이 함께 보이게)
}

// 배경 찬양 (피아노)
export const AUDIO = {
  volume: 0.7, // 기본 볼륨 (0~1)
  passes: 2, // 곡마다 몇 번 반복할지
  gapSeconds: 5, // 곡 사이 쉼
  reverb: { decay: 4.5, wet: 0.32 }, // 예배당 울림
  release: 1.4, // 건반을 뗀 뒤 소리가 사라지는 시간(초)
  duck: { praying: 0.6, playing: 0.2 }, // 기도 중 / 직접 연주 중 배경 찬양 볼륨 배율
  fadeSeconds: 1.5,
  instrument: 'organ' as 'organ' | 'piano', // 처음 입장 시 배경 찬양 악기
  // 교회 오르간(신시사이저): 파이프 배음을 겹쳐 만든다. 배열 = 1, 2, 3, 4…번째 배음의 세기.
  // 음을 한 옥타브 아래로 쳐서 1번 배음 = 16' , 2번 = 8'(기본음), 3번 = 5⅓', 4번 = 4', 6번 = 2⅔', 8번 = 2'
  organ: {
    manual: [0, 1, 0.12, 0.42, 0, 0.1, 0, 0.14], // 손건반: 8' + 4' 중심의 부드러운 플루트·디아파종
    pedal: [0.85, 1, 0.08, 0.25, 0, 0.04], // 발건반(베이스): 16' 을 더해 낮게 깔림
    attack: 0.07,
    release: 0.45,
    volumeDb: -22,
    brightness: 3200, // 저역 통과 필터(Hz): 낮을수록 부드럽고 먹먹함
    reverb: { decay: 6.5, wet: 0.42 },
  },
}
