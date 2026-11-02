// 기도 골방: 혼자 쓰는 작은 나무 오두막 방. 렌더링(models/Closet)·이동 지도·상호작용이 같은 값을 쓴다.
// 좌표: x = 좌우, z = 앞(-, 창문 쪽) / 뒤(+, 문 쪽). 바닥 y = 0
export const CLOSET = {
  halfW: 1.8, // x: -1.8 ~ 1.8
  halfD: 2.1, // z: -2.1 ~ 2.1
  height: 2.6,
}

export const CLOSET_WINDOW = { x: -0.25, y: 1.5, w: 0.95, h: 1.15 } // 앞벽(z = -halfD)
// 바닥에 앉아 쓰는 낮은 앉은뱅이 책상
export const CLOSET_DESK = { pos: [-0.25, 0, -1.3] as [number, number, number], w: 1.1, d: 0.55, h: 0.36 }
// 책상 앞 방석: 여기서 무릎 꿇고 앉음 (창문·책상 쪽 -z 를 바라봄)
export const CLOSET_KNEEL = { pos: [-0.25, 0, -0.68] as [number, number, number], rotY: Math.PI }
export const CLOSET_BIBLE = { pos: [-0.33, CLOSET_DESK.h, -1.3] as [number, number, number], rotY: 0 }
export const CLOSET_CANDLE: [number, number, number] = [0.12, CLOSET_DESK.h, -1.42]
export const CLOSET_CABINET = { pos: [-1.5, 0, 0.3] as [number, number, number], w: 0.55, d: 1.0, h: 1.05 } // 왼쪽 벽, w = x 방향 깊이
export const CLOSET_CROSS: [number, number, number] = [1.05, 1.62, -CLOSET.halfD + 0.04]
export const CLOSET_DOOR = { x: 0.95, w: 0.85, h: 1.95 } // 뒷벽(z = +halfD)
export const CLOSET_SPAWN: [number, number, number] = [0.6, 0, 0.95]
export const CLOSET_SPAWN_ROT = Math.PI // 창문 쪽을 바라봄
