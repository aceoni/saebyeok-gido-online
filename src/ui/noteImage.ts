// 기도노트를 '메모장' 모양 이미지(PNG)로 그린다. 전부 이 브라우저 안에서만 처리 (서버로 보내지 않음)
import { formatDate } from '../store/notes'

const W = 1080
const PAD_X = 110 // 왼쪽 여백선 바깥쪽
const TEXT_X = 150 // 글 시작 (여백선 오른쪽)
const TEXT_R = W - 96
const LINE = 76 // 줄 간격
const FONT = '"Gowun Batang", serif'

const C = {
  paper: '#f8f1e3',
  paperEdge: '#eadcc3',
  binding: '#6b5440',
  hole: '#3b2e22',
  rule: 'rgba(140, 110, 80, 0.28)',
  margin: 'rgba(190, 110, 100, 0.35)',
  ink: '#33291f',
  soft: '#8a7660',
  cross: '#b08a5c',
}

/** 글을 폭에 맞게 줄바꿈 (띄어쓰기에서 끊고, 너무 긴 낱말은 글자 단위로) */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []
  for (const para of text.replace(/\s+$/, '').split('\n')) {
    if (!para.trim()) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of para.split(/(?<= )/)) {
      if (ctx.measureText(line + word).width <= width) {
        line += word
        continue
      }
      if (line) out.push(line.trimEnd())
      line = ''
      // 한 낱말이 한 줄보다 길면 글자 단위로 자름
      for (const ch of word) {
        if (ctx.measureText(line + ch).width > width && line) {
          out.push(line)
          line = ''
        }
        line += ch
      }
    }
    out.push(line.trimEnd())
  }
  return out
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 기도노트 한 장을 PNG Blob 으로 */
export async function renderNoteImage(id: string, text: string): Promise<Blob> {
  // 글꼴이 아직 안 받아졌으면 기다림 (캔버스는 글꼴을 스스로 불러오지 않음)
  try {
    await document.fonts.load(`40px ${FONT}`, '기도')
  } catch {
    // 기본 글꼴로 그림
  }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `40px ${FONT}`
  const lines = wrap(ctx, text, TEXT_R - TEXT_X)

  const top = 360 // 첫 줄 아래 선 위치
  const minLines = 11
  const n = Math.max(minLines, lines.length + 2)
  const H = Math.max(1350, top + n * LINE + 170)
  canvas.width = W
  canvas.height = H
  ctx.font = `40px ${FONT}`

  // 바탕(책상 위에 놓인 종이 느낌): 어두운 나무 바탕 + 살짝 기운 그림자
  ctx.fillStyle = '#2a2119'
  ctx.fillRect(0, 0, W, H)
  const px = 40
  const py = 40
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 12
  roundRect(ctx, px, py, W - px * 2, H - py * 2, 14)
  ctx.fillStyle = C.paper
  ctx.fill()
  ctx.restore()

  // 종이 결: 가장자리로 갈수록 아주 살짝 누렇게
  ctx.save()
  roundRect(ctx, px, py, W - px * 2, H - py * 2, 14)
  ctx.clip()
  const g = ctx.createRadialGradient(W / 2, H * 0.45, W * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.75)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(1, 'rgba(180,150,100,0.22)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // 위쪽 제본 띠 + 구멍 (메모장)
  ctx.fillStyle = C.binding
  ctx.fillRect(px, py, W - px * 2, 70)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(px, py + 62, W - px * 2, 8)
  ctx.fillStyle = C.hole
  for (let x = px + 70; x < W - px - 40; x += 68) {
    ctx.beginPath()
    ctx.arc(x, py + 34, 9, 0, Math.PI * 2)
    ctx.fill()
  }

  // 머리: 작은 십자가 + '기도노트' + 날짜
  const cx = TEXT_X + 14
  ctx.strokeStyle = C.cross
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, 156)
  ctx.lineTo(cx, 214)
  ctx.moveTo(cx - 18, 174)
  ctx.lineTo(cx + 18, 174)
  ctx.stroke()
  ctx.fillStyle = C.soft
  ctx.font = `28px ${FONT}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('기 도 노 트', cx + 44, 184)
  ctx.fillStyle = C.ink
  ctx.font = `46px ${FONT}`
  ctx.fillText(formatDate(id), TEXT_X, 284)

  // 줄 + 왼쪽 여백선
  ctx.strokeStyle = C.rule
  ctx.lineWidth = 2
  for (let i = 0; i < n; i++) {
    const y = top + i * LINE + LINE
    ctx.beginPath()
    ctx.moveTo(px + 30, y)
    ctx.lineTo(W - px - 30, y)
    ctx.stroke()
  }
  ctx.strokeStyle = C.margin
  ctx.beginPath()
  ctx.moveTo(PAD_X + 14, top - 10)
  ctx.lineTo(PAD_X + 14, top + n * LINE + 30)
  ctx.stroke()

  // 글
  ctx.fillStyle = C.ink
  ctx.font = `40px ${FONT}`
  lines.forEach((l, i) => ctx.fillText(l, TEXT_X, top + (i + 1) * LINE - 18))

  // 아래 서명
  ctx.fillStyle = C.soft
  ctx.font = `26px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('새벽기도 온라인', W - px - 56, H - py - 52)
  ctx.restore()

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했습니다'))), 'image/png'))
}

/** 이미지 저장: 휴대폰은 공유 시트(사진에 저장), 그 밖에는 파일 내려받기 */
export async function saveImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' })
  const touch = matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // 사용자가 취소
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
