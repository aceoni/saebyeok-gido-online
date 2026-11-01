import { BALCONY, CHOIR, HALL, PEWS, PLAYER, STAGE } from '../config'
import {
  CONDUCTOR_POS,
  DRUM_POS,
  DRUM_SCALE,
  FLOWERS,
  GRAND_PIANO_POS,
  GRAND_PIANO_ROT_Y,
  GRAND_PIANO_SCALE,
  GUITARS,
  INSTRUMENT_SCALE,
  MONITORS,
  MUSIC_STANDS,
  ORCHESTRA_CHAIRS,
  ORCHESTRA_STANDS,
  PIANO_POS,
  PULPIT_POS,
  STAGE_CHAIRS,
  STOOLS,
  balconyFloorHeight,
  balconySlots,
  choirSlots,
  pewSlots,
  frontDesks,
  pillarX,
  pillarZs,
  type PewSlot,
} from '../scenes/sanctuaryLayout'

// 층마다 바닥을 일정한 칸으로 나눈 이동 지도 (1층, 2층 발코니).
// 각 칸의 "막힘 여부"와 "바닥 높이"를 미리 계산해 두고, 이동 충돌·클릭 길찾기에 함께 쓴다.
// 장애물은 모두 sanctuaryLayout 의 배치 값에서 만들어지므로 가구를 옮기면 충돌도 따라 바뀐다.

export type Level = 1 | 2

const CELL = 0.2

// 회전된 직사각형 장애물 (중심, 반폭/반깊이, y축 회전)
type Rect = { x: number; z: number; hw: number; hd: number; rot: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// 로컬 좌표 → 월드 좌표 (모델의 rotation-y 와 같은 규칙)
export function localToWorld(px: number, pz: number, rot: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [px + lx * c + lz * s, pz - lx * s + lz * c]
}
// 월드 좌표 → 로컬 좌표
export function worldToLocal(px: number, pz: number, rot: number, x: number, z: number): [number, number] {
  const dx = x - px
  const dz = z - pz
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [dx * c - dz * s, dx * s + dz * c]
}

/** 1층 바닥 높이 (단상, 계단, 성가대 단 반영) */
export function floorHeight(x: number, z: number): number {
  const cz0 = CHOIR.zFrom - 0.4
  const cz1 = CHOIR.zTo + 0.4
  if (x < STAGE.leftX && z >= cz0 && z <= cz1) {
    // 성가대석: 앞줄부터 한 단씩 높아짐 (ChoirLoft 의 단 경계와 같음)
    const r = Math.ceil((CHOIR.frontX + CHOIR.rowSpacing / 2 - x) / CHOIR.rowSpacing) - 1
    return STAGE.height + clamp(r, 0, CHOIR.rows - 1) * CHOIR.tierHeight
  }
  if (x >= STAGE.leftX && x <= STAGE.rightX && z <= STAGE.frontZ) return STAGE.height
  if (x >= STAGE.leftX - 0.3 && x <= STAGE.rightX + 0.3 && z <= STAGE.frontZ + STAGE.stepDepth) {
    return STAGE.stepHeight
  }
  return 0
}

function rectBuilder() {
  const R: Rect[] = []
  const add = (x: number, z: number, w: number, d: number, rot = 0) => R.push({ x, z, hw: w / 2, hd: d / 2, rot })
  const addLocal = (p: [number, number, number], rot: number, lx: number, lz: number, w: number, d: number) => {
    const [x, z] = localToWorld(p[0], p[2], rot, lx, lz)
    add(x, z, w, d, rot)
  }
  // 장의자: 좌판 앞 ~ 등받이 뒤까지 막음
  const addPews = (slots: PewSlot[]) => {
    for (const slot of slots) addLocal([slot.x, 0, slot.z], slot.rotY ?? 0, 0, 0.03, slot.length ?? PEWS.length, 0.6)
  }
  // 맨 앞줄 앞 테이블 (앞판 + 테이블)
  const addDesks = (level: 1 | 2) => {
    for (const d of frontDesks) if ((d.y > 1) === (level === 2)) addLocal([d.x, 0, d.z], d.rotY, 0, 0.02, d.length + 0.07, 0.1)
  }
  return { R, add, addLocal, addPews, addDesks }
}

function level1Obstacles(): Rect[] {
  const { R, add, addLocal, addPews, addDesks } = rectBuilder()

  // 측벽 기둥, 정면 좌/우 돌출 벽, 발코니 받침 기둥
  for (const z of pillarZs) for (const s of [-1, 1]) add(s * pillarX, z, 0.7, 0.7)
  const sideW = HALL.width / 2 - HALL.frontCenterHalf
  for (const s of [-1, 1]) add(s * (HALL.frontCenterHalf + sideW / 2), HALL.frontZ + HALL.frontSideDepth / 2, sideW, HALL.frontSideDepth)
  for (const s of [-1, 1]) add(s * 10.1, BALCONY.frontZ + 0.35, 0.45, 0.45)

  addPews([...pewSlots, ...choirSlots])
  addDesks(1)

  // 성가대석과 단상 사이 칸막이 (출입구만 비워 둠)
  const px = CHOIR.frontX + 0.55
  const [e0, e1] = CHOIR.entrance
  const pz0 = CHOIR.zFrom - 0.4
  const pz1 = CHOIR.zTo + 0.4
  add(px, (pz0 + e0) / 2, 0.1, e0 - pz0)
  add(px, (e1 + pz1) / 2, 0.1, pz1 - e1)

  // 단상 위
  add(PULPIT_POS[0], PULPIT_POS[2], 1.0, 0.7)
  for (const p of FLOWERS) add(p[0], p[2], 0.6, 0.6)
  for (const p of STAGE_CHAIRS) add(p[0], p[2], 0.8, 0.7)
  for (const p of MONITORS) add(p[0], p[2], 0.6, 0.45)
  // 드럼: 세트 본체와 드럼 의자를 따로 (의자 뒤·옆으로 다가가 앉을 수 있게)
  add(DRUM_POS[0], DRUM_POS[2] + 0.1 * DRUM_SCALE, 2.2 * DRUM_SCALE, 1.3 * DRUM_SCALE)
  add(DRUM_POS[0], DRUM_POS[2] - 0.65 * DRUM_SCALE, 0.4 * DRUM_SCALE, 0.4 * DRUM_SCALE)
  add(CONDUCTOR_POS[0] - 0.35, CONDUCTOR_POS[2], 0.4, 0.4) // 지휘자 보면대

  // 악기·연주자 자리
  const S = INSTRUMENT_SCALE
  addLocal(PIANO_POS, 0, 0, 0.27 * S, 1.4 * S, 1.1 * S) // 키보드 + 의자
  for (const g of GUITARS) add(g.pos[0], g.pos[2], 0.4 * S, 0.4 * S)
  for (const p of MUSIC_STANDS) add(p[0], p[2], 0.35 * S, 0.35 * S)
  for (const p of STOOLS) add(p[0], p[2], 0.4 * S, 0.4 * S)
  for (const c of ORCHESTRA_CHAIRS) add(c.pos[0], c.pos[2], 0.5 * S, 0.5 * S, c.rotY)
  for (const m of ORCHESTRA_STANDS) add(m.pos[0], m.pos[2], 0.35 * S, 0.35 * S)
  // 그랜드피아노: 본체(꼬리 -2.0 ~ 건반 0) + 건반 앞 의자(+0.95)까지
  const G = GRAND_PIANO_SCALE
  addLocal(GRAND_PIANO_POS, GRAND_PIANO_ROT_Y, 0, -0.53 * G, 1.5 * G, 2.95 * G)
  return R
}

function level2Obstacles(): Rect[] {
  const { R, add, addPews, addDesks } = rectBuilder()
  for (const z of pillarZs) if (z > BALCONY.frontZ) for (const s of [-1, 1]) add(s * pillarX, z, 0.7, 0.7)
  addPews(balconySlots)
  addDesks(2)
  return R
}

// ── 층별 이동 지도 ─────────────────────────────────────────
const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

class MinHeap {
  private items: number[] = []
  constructor(private score: Float32Array) {}
  get size() {
    return this.items.length
  }
  push(v: number) {
    const a = this.items
    a.push(v)
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.score[a[p]] <= this.score[a[i]]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }
  pop(): number {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export class NavLayer {
  readonly cols: number
  readonly rows: number
  private blocked: Uint8Array
  private heights: Float32Array

  constructor(
    private x0: number,
    private z0: number,
    x1: number,
    z1: number,
    heightFn: (x: number, z: number) => number,
    rects: Rect[],
  ) {
    this.cols = Math.round((x1 - x0) / CELL)
    this.rows = Math.round((z1 - z0) / CELL)
    this.blocked = new Uint8Array(this.cols * this.rows)
    this.heights = new Float32Array(this.cols * this.rows)
    const r = PLAYER.radius
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const x = this.cx(i)
        const z = this.cz(j)
        const k = j * this.cols + i
        this.heights[k] = heightFn(x, z)
        // 바깥 경계 (벽, 발코니 난간)
        if (x < x0 + r || x > x1 - r || z < z0 + r || z > z1 - r) {
          this.blocked[k] = 1
          continue
        }
        for (const o of rects) {
          const dx = x - o.x
          const dz = z - o.z
          if (Math.abs(dx) > o.hw + o.hd + r || Math.abs(dz) > o.hw + o.hd + r) continue
          const c = Math.cos(o.rot)
          const s = Math.sin(o.rot)
          if (Math.abs(dx * c - dz * s) < o.hw + r && Math.abs(dx * s + dz * c) < o.hd + r) {
            this.blocked[k] = 1
            break
          }
        }
      }
    }
  }

  private cx = (i: number) => this.x0 + (i + 0.5) * CELL
  private cz = (j: number) => this.z0 + (j + 0.5) * CELL
  private toI = (x: number) => Math.floor((x - this.x0) / CELL)
  private toJ = (z: number) => Math.floor((z - this.z0) / CELL)
  private inside = (i: number, j: number) => i >= 0 && j >= 0 && i < this.cols && j < this.rows

  /** 이 칸에 서 있을 수 있는가 */
  walkable(x: number, z: number): boolean {
    const i = this.toI(x)
    const j = this.toJ(z)
    return this.inside(i, j) && !this.blocked[j * this.cols + i]
  }

  /** 칸 기준 바닥 높이 (캐릭터 y) */
  height(x: number, z: number): number {
    const i = clamp(this.toI(x), 0, this.cols - 1)
    const j = clamp(this.toJ(z), 0, this.rows - 1)
    return this.heights[j * this.cols + i]
  }

  /** (x0,z0)에서 (x1,z1)로 한 걸음 옮길 수 있는가: 막힘 + 높이 차 검사 */
  canStep(x0: number, z0: number, x1: number, z1: number): boolean {
    if (!this.walkable(x1, z1)) return false
    return Math.abs(this.height(x1, z1) - this.height(x0, z0)) <= PLAYER.maxStep
  }

  private lineWalkable(x0: number, z0: number, x1: number, z1: number): boolean {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (CELL * 0.5)))
    let px = x0
    let pz = z0
    for (let k = 1; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n
      const z = z0 + ((z1 - z0) * k) / n
      if (!this.canStep(px, pz, x, z)) return false
      px = x
      pz = z
    }
    return true
  }

  /** 막힌 곳을 눌렀을 때 가장 가까운 갈 수 있는 지점 */
  nearestWalkable(x: number, z: number, maxDist = 6): [number, number] | null {
    if (this.walkable(x, z)) return [x, z]
    const ci = this.toI(x)
    const cj = this.toJ(z)
    const maxR = Math.ceil(maxDist / CELL)
    for (let rr = 1; rr <= maxR; rr++) {
      let best: [number, number] | null = null
      let bestD = Infinity
      for (let j = cj - rr; j <= cj + rr; j++) {
        for (let i = ci - rr; i <= ci + rr; i++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== rr) continue
          if (!this.inside(i, j) || this.blocked[j * this.cols + i]) continue
          const d = Math.hypot(this.cx(i) - x, this.cz(j) - z)
          if (d < bestD) {
            bestD = d
            best = [this.cx(i), this.cz(j)]
          }
        }
      }
      if (best) return best
    }
    return null
  }

  /** (sx,sz) → (tx,tz) A* 경로. 다듬어진 웨이포인트(시작점 제외), 못 가면 null */
  findPath(sx: number, sz: number, tx: number, tz: number): [number, number][] | null {
    const { cols, rows, blocked, heights } = this
    const si = this.toI(sx)
    const sj = this.toJ(sz)
    const ti = this.toI(tx)
    const tj = this.toJ(tz)
    if (!this.inside(si, sj) || !this.inside(ti, tj) || blocked[tj * cols + ti]) return null
    const N = cols * rows
    const g = new Float32Array(N).fill(Infinity)
    const f = new Float32Array(N).fill(Infinity)
    const from = new Int32Array(N).fill(-1)
    const closed = new Uint8Array(N)
    const start = sj * cols + si
    const goal = tj * cols + ti
    const h = (i: number, j: number) => {
      const dx = Math.abs(i - ti)
      const dz = Math.abs(j - tj)
      return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)
    }
    g[start] = 0
    f[start] = h(si, sj)
    const open = new MinHeap(f)
    open.push(start)
    while (open.size) {
      const cur = open.pop()
      if (cur === goal) break
      if (closed[cur]) continue
      closed[cur] = 1
      const ci = cur % cols
      const cj = (cur / cols) | 0
      for (const [di, dj, cost] of NEIGHBORS) {
        const ni = ci + di
        const nj = cj + dj
        if (!this.inside(ni, nj)) continue
        const nk = nj * cols + ni
        if (blocked[nk] || closed[nk]) continue
        if (Math.abs(heights[nk] - heights[cur]) > PLAYER.maxStep) continue
        // 대각선은 모서리를 깎지 않게 양옆이 모두 열려 있어야 함
        if (di && dj && (blocked[cj * cols + ni] || blocked[nj * cols + ci])) continue
        const ng = g[cur] + cost
        if (ng < g[nk]) {
          g[nk] = ng
          f[nk] = ng + h(ni, nj)
          from[nk] = cur
          open.push(nk)
        }
      }
    }
    if (from[goal] === -1 && goal !== start) return null

    const cells: [number, number][] = []
    for (let k = goal; k !== -1 && k !== start; k = from[k]) cells.push([this.cx(k % cols), this.cz((k / cols) | 0)])
    cells.reverse()
    if (cells.length) cells[cells.length - 1] = [tx, tz]

    // 직선으로 갈 수 있는 중간점은 건너뛰어 부드러운 경로로
    const out: [number, number][] = []
    let ax = sx
    let az = sz
    let k = 0
    while (k < cells.length) {
      let far = k
      for (let m = cells.length - 1; m > k; m--) {
        if (this.lineWalkable(ax, az, cells[m][0], cells[m][1])) {
          far = m
          break
        }
      }
      out.push(cells[far])
      ;[ax, az] = cells[far]
      k = far + 1
    }
    return out
  }
}

export const NAV: Record<Level, NavLayer> = {
  1: new NavLayer(-HALL.width / 2, HALL.frontZ, HALL.width / 2, HALL.backZ, floorHeight, level1Obstacles()),
  // 2층: 난간 안쪽부터 뒷벽까지
  2: new NavLayer(-HALL.width / 2, BALCONY.frontZ + 0.16, HALL.width / 2, HALL.backZ, balconyFloorHeight, level2Obstacles()),
}
