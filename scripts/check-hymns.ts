// 찬송가 JSON 검사: 마디마다 박 수가 맞는지, 음 이름이 올바른지 확인한다.
// 실행: npm run check:hymns
import { readdirSync, readFileSync } from 'node:fs'
import { buildTimeline, validateHymn, type Hymn } from '../src/systems/hymn.ts'

const dir = new URL('../src/data/hymns/', import.meta.url)
let failed = false
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const h = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Hymn
  const errors = validateHymn(h)
  if (errors.length) {
    failed = true
    console.log(`✗ ${f} (${h.title})`)
    for (const e of errors) console.log(`   - ${e}`)
  } else {
    const t = buildTimeline(h, 1, 'piano', () => 0.5)
    console.log(`✓ ${f}  ${h.title} · ${h.measures.length}마디 · 1절 약 ${Math.round(t.length)}초`)
  }
}
process.exit(failed ? 1 : 0)
