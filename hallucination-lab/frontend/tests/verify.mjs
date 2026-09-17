/**
 * End-to-end verification suite for the Hallucination Lab.
 *
 * Runs the student journeys the lab has to survive on a lab desktop: a full
 * correct pass, a full wrong pass, navigation stress, rapid clicking, and a
 * fresh session. Also checks the recorded-only guarantees (no network calls
 * to any model or proxy) and the accessibility basics.
 *
 * Usage:  node tests/verify.mjs [baseUrl]
 * Serve dist/ first, e.g.  python3 -m http.server 8300 --directory dist
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] || 'http://localhost:8300/'
const EXEC = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'

let passed = 0, failed = 0
const failures = []
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); console.log(`  FAIL  ${name}  ${detail}`) }
}
function section(t) { console.log(`\n=== ${t} ===`) }

const browser = await chromium.launch({ executablePath: EXEC })

async function newPage({ instructor = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  page.__errors = []
  page.__requests = []
  page.on('pageerror', (e) => page.__errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text().slice(0, 120)) })
  page.on('request', (r) => page.__requests.push(r.url()))
  page.__notFound = []
  page.on('response', (r) => { if (r.status() === 404) page.__notFound.push(r.url()) })
  await page.goto(BASE + (instructor ? '?mode=instructor' : ''), { waitUntil: 'load', timeout: 60000 })
  return page
}

const nextBtn = (page) => page.locator('.nav-row button').nth(1)
const backBtn = (page) => page.locator('.nav-row button').nth(0)

async function lockPrediction(page, optionIndex = 0) {
  const card = page.locator('.predict-card')
  if (await card.count() === 0) return false
  await card.locator('.option').nth(optionIndex).click()
  await card.getByRole('button', { name: /Lock in my prediction/ }).click()
  return true
}

/** Drive whatever interaction a module needs before its questions unlock. */
async function runModuleBody(page) {
  const h2 = (await page.locator('h2').first().textContent()) || ''
  const click = async (name, timeout = 20000) => {
    const b = page.getByRole('button', { name })
    if (await b.count()) await b.first().click({ timeout }).catch(() => {})
  }
  if (h2.includes('Next Word')) { await click(/^Run$/); await page.locator('.output-panel').first().waitFor({ timeout: 20000 }).catch(()=>{}) }
  if (h2.includes('Citation Forge')) {
    await click(/Ask for three Florida cases/)
    await page.locator('.sort-item').first().waitFor({ timeout: 20000 }).catch(()=>{})
    const n = await page.locator('.sort-item').count()
    for (let i = 0; i < n; i++) await page.locator('.sort-item').nth(i).getByRole('button', { name: i % 2 ? 'Fake' : 'Real', exact: true }).click().catch(()=>{})
    await click(/Check my sort/)
  }
  if (h2.includes('Are You Sure')) {
    for (let i = 0; i < 3; i++) { await click(/Are you sure this citation is real/); await page.waitForTimeout(250) }
  }
  if (h2.includes('Prompt Golf')) {
    await click(/Run the bare question/)
    await page.locator('.mismatch-meter').first().waitFor({ timeout: 20000 }).catch(()=>{})
    await page.locator('.technique-toggle', { hasText: 'Ground it' }).locator('input').check().catch(()=>{})
    await page.locator('.technique-toggle', { hasText: 'escape hatch' }).locator('input').check().catch(()=>{})
    await click(/Re-run with/)
    await page.waitForTimeout(600)
  }
  if (h2.includes('Expert Quote')) { await click(/Ask for a direct quote/); await page.locator('.output-panel').first().waitFor({ timeout: 20000 }).catch(()=>{}) }
  if (h2.includes('Two Truths')) {
    for (let r = 0; r < 6; r++) {
      await page.locator('.ttl-statement').first().waitFor({ timeout: 10000 }).catch(()=>{})
      await page.locator('.ttl-statement').nth(r % 3).click().catch(()=>{})
      await click(/Next round|Finish/)
      await page.waitForTimeout(150)
    }
  }
  if (h2.includes('Pioneers')) {
    await click(/Run the bare prompt/); await page.locator('.bars').first().waitFor({ timeout: 20000 }).catch(()=>{})
    await click(/Run the steered prompt/); await page.waitForTimeout(600)
  }
  if (h2.includes('Pronoun')) {
    const rows = page.locator('tbody tr')
    const n = await rows.count()
    for (let i = 0; i < n; i++) await rows.nth(i).getByRole('button', { name: i % 2 ? 'he' : 'she', exact: true }).click().catch(()=>{})
    await click(/Lock all ten calls/); await click(/Run the batch/)
    await page.waitForTimeout(600)
  }
  if (h2.includes('Resume Score')) { await click(/Score each resume/); await page.locator('.output-panel').first().waitFor({ timeout: 20000 }).catch(()=>{}) }
  if (h2.includes('Risk Score')) { await page.locator('#w11-b').fill('2.5').catch(()=>{}) }
  if (h2.includes('Picture the Job')) {
    for (let i = 0; i < 4; i++) await page.locator('.img-cell').nth(i).getByRole('button', { name: 'Male', exact: true }).click().catch(()=>{})
  }
  if (h2.includes('Count the Coins')) {
    await page.locator('.img-cell button').first().click().catch(()=>{})
    await click(/How many items/); await page.waitForTimeout(500)
  }
  if (h2.includes('Spot the Fake')) {
    for (let r = 0; r < 6; r++) {
      await page.locator('.pair-choice').first().waitFor({ timeout: 10000 }).catch(()=>{})
      await page.locator('.pair-choice').nth(r % 2).click().catch(()=>{})
      await click(/Next round|Finish/)
      await page.waitForTimeout(150)
    }
  }
  if (h2.includes('Fact-Check')) {
    // The reveal arms first, then fires, so a single click no longer reveals.
    await click(/^Reveal the planted errors$/)
    await click(/Yes, reveal all three drafts now/)
    await page.waitForTimeout(300)
  }
  return h2
}

/** Answer every question on the module. mode: 'first' | 'last' | 'correct' */
async function answerAll(page, mode) {
  const qs = await page.locator('.question').count()
  for (let i = 0; i < qs; i++) {
    const q = page.locator('.question').nth(i)
    const opts = q.locator('.option')
    const n = await opts.count()
    if (!n) continue
    let idx = mode === 'last' ? n - 1 : 0
    await opts.nth(idx).click().catch(() => {})
  }
  return qs
}

async function fullPass(page, mode) {
  const seen = []
  for (let w = 0; w < 15; w++) {
    const h2 = (await page.locator('h2').first().textContent()) || `module ${w}`
    seen.push(h2.trim())
    await lockPrediction(page, mode === 'last' ? 3 : 0)
    await runModuleBody(page)
    await answerAll(page, mode)
    const btn = nextBtn(page)
    if (await btn.isDisabled()) return { seen, stuck: h2 }
    await btn.click()
    await page.waitForTimeout(120)
  }
  return { seen, stuck: null }
}

// ---------------------------------------------------------------- Journey A
section('Journey A: full student pass, student mode, all first options')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  const { seen, stuck } = await fullPass(page, 'first')
  check('all 15 modules reachable', seen.length === 15 && !stuck, stuck ? `stuck on ${stuck}` : `saw ${seen.length}`)
  const onResults = await page.locator('h1', { hasText: 'Download your results' }).count()
  check('reaches results page', onResults === 1)
  check('no JS errors during pass', page.__errors.length === 0,
    page.__errors.slice(0, 2).join(' | ') + (page.__notFound.length ? ' MISSING: ' + [...new Set(page.__notFound)].join(', ') : ''))
  console.log('  modules:', seen.map(s => s.split('.')[0]).join(', '))
  await page.context().close()
}

// ---------------------------------------------------------------- Journey B
section('Journey B: deliberately wrong answers')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  const { stuck } = await fullPass(page, 'last')
  check('completes with wrong answers', !stuck, stuck ? `stuck on ${stuck}` : '')
  await page.locator('h1', { hasText: 'Download your results' }).waitFor({ timeout: 15000 }).catch(()=>{})
  const scoreLine = await page.locator('.golf-score').first().textContent().catch(() => '')
  const m = /Scored (\d+) of (\d+)/.exec(scoreLine || '')
  check('score line present', !!m, scoreLine || 'missing')
  if (m) check('wrong pass scores low', Number(m[1]) <= Number(m[2]) / 2, scoreLine.trim())
  const noMarks = await page.locator('.summary-table td.correct-no').count()
  check('incorrect answers marked NO', noMarks > 0, `${noMarks} marked`)
  await page.context().close()
}

// ---------------------------------------------------------------- one-shot
section('One-shot answer locking')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  await lockPrediction(page, 0)
  await runModuleBody(page)
  const q = page.locator('.question').first()
  await q.locator('.option').nth(1).click()
  const first = await q.locator('.option[aria-checked="true"]').textContent()
  await q.locator('.option').nth(2).click({ force: true }).catch(() => {})
  const after = await q.locator('.option[aria-checked="true"]').textContent()
  check('answer cannot be changed after first click', first === after, `${first} -> ${after}`)
  const disabledCount = await q.locator('.option[disabled]').count()
  check('other options disabled after answering', disabledCount >= 2, `${disabledCount} disabled`)
  // prediction cannot be re-made
  check('prediction card gone after locking', await page.locator('.predict-card').count() === 0)
  await page.context().close()
}

// ---------------------------------------------------------------- Journey D
section('Journey D: navigation stress, completed state must survive')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  await lockPrediction(page, 1)
  await runModuleBody(page)
  await answerAll(page, 'first')
  const before = await page.locator('.option[aria-checked="true"]').allTextContents()
  await nextBtn(page).click()
  await page.waitForTimeout(150)
  for (let i = 0; i < 4; i++) { await backBtn(page).click(); await page.waitForTimeout(90); await nextBtn(page).click().catch(()=>{}); await page.waitForTimeout(90) }
  await backBtn(page).click()
  await page.waitForTimeout(250)
  const after = await page.locator('.option[aria-checked="true"]').allTextContents()
  check('answers survive repeated back/next', JSON.stringify(before) === JSON.stringify(after), `${before.length} vs ${after.length}`)
  check('prediction echo still shown on revisit', await page.locator('.prediction-echo').count() === 1)
  check('no errors during navigation stress', page.__errors.length === 0, page.__errors.slice(0, 2).join(' | '))
  await page.context().close()
}

// ---------------------------------------------------------------- Journey E
section('Journey E: rapid interaction')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  await lockPrediction(page, 0)
  // hammer the run button
  const run = page.getByRole('button', { name: /^Run$/ })
  for (let i = 0; i < 8; i++) await run.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(1500)
  check('rapid run clicks leave one output panel', await page.locator('.output-panel').count() <= 1,
    `${await page.locator('.output-panel').count()} panels`)
  // hammer an answer
  const q = page.locator('.question').first()
  for (let i = 0; i < 6; i++) await q.locator('.option').nth(i % 4).click({ force: true, timeout: 2000 }).catch(() => {})
  check('rapid answer clicks leave exactly one selection',
    await q.locator('.option[aria-checked="true"]').count() === 1)
  // hammer navigation
  for (let i = 0; i < 10; i++) { await nextBtn(page).click({ timeout: 1500 }).catch(()=>{}); await backBtn(page).click({ timeout: 1500 }).catch(()=>{}) }
  await page.waitForTimeout(300)
  const progress = await page.locator('.progress-label').textContent()
  check('progress label still valid after hammering', /Widget \d+ of 15/.test(progress || ''), progress || 'missing')
  check('no errors during rapid interaction', page.__errors.length === 0, page.__errors.slice(0, 2).join(' | '))
  await page.context().close()
}

// ---------------------------------------------------------------- Journey F
section('Journey F: fresh session resets in-memory state')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  await lockPrediction(page, 0)
  await answerAll(page, 'first')
  await page.reload({ waitUntil: 'load' })
  check('reload returns to landing page', await page.getByRole('button', { name: 'Start Lab' }).count() === 1)
  await page.getByRole('button', { name: 'Start Lab' }).click()
  check('prediction gate is back after reload', await page.locator('.predict-card').count() === 1)
  check('no stored answers after reload', await page.locator('.option[aria-checked="true"]').count() === 0)
  const storage = await page.evaluate(() => {
    try { return { ls: localStorage.length, ss: sessionStorage.length } } catch { return { ls: -1, ss: -1 } }
  })
  check('nothing written to browser storage', storage.ls === 0 && storage.ss === 0, JSON.stringify(storage))
  await page.context().close()
}

// ------------------------------------------------------- recorded-only mode
section('Recorded-only operation')
{
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  const { stuck } = await fullPass(page, 'first')
  const reqs = page.__requests
  const offsite = reqs.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:'))
  const apiCalls = reqs.filter((u) => /\/api\/|litellm|gateway|openai|anthropic|generativelanguage/i.test(u))
  check('completed without a proxy running', !stuck, stuck || '')
  check('no requests to any model gateway or proxy', apiCalls.length === 0, apiCalls.slice(0, 3).join(', '))
  check('no off-site requests at all', offsite.length === 0, offsite.slice(0, 3).join(', '))
  const keyish = await page.evaluate(() => {
    const src = [...document.scripts].map(s => s.src).join(' ')
    return { hasInputForFreeText: !!document.querySelector('textarea'), scripts: src.length > 0 }
  })
  check('no free-text prompt box anywhere in the lab', !keyish.hasInputForFreeText)
  await page.context().close()
}

// ---------------------------------------------------------- accessibility
section('Accessibility basics')
{
  const page = await newPage()
  const a11y = await page.evaluate(() => {
    const out = {}
    out.imagesWithoutAlt = [...document.querySelectorAll('img')].filter(i => i.getAttribute('alt') === null).length
    out.inputsWithoutLabel = [...document.querySelectorAll('input,select,textarea')]
      .filter(el => !el.getAttribute('aria-label') && !el.closest('label') &&
        !(el.id && document.querySelector(`label[for="${el.id}"]`))).length
    out.buttonsWithoutName = [...document.querySelectorAll('button')]
      .filter(b => !(b.textContent || '').trim() && !b.getAttribute('aria-label')).length
    return out
  })
  check('every image has an alt attribute (landing)', a11y.imagesWithoutAlt === 0, `${a11y.imagesWithoutAlt} missing`)
  check('every form control is labelled (landing)', a11y.inputsWithoutLabel === 0, `${a11y.inputsWithoutLabel} unlabelled`)
  check('every button has an accessible name (landing)', a11y.buttonsWithoutName === 0, `${a11y.buttonsWithoutName} unnamed`)

  // keyboard-only: tab to Start Lab and activate it
  await page.keyboard.press('Tab')
  let guard = 0, started = false
  while (guard++ < 12) {
    const tag = await page.evaluate(() => document.activeElement?.textContent?.trim() || '')
    if (/Start Lab/.test(tag)) { await page.keyboard.press('Enter'); started = true; break }
    await page.keyboard.press('Tab')
  }
  check('lab can be started with the keyboard alone', started && await page.locator('.progress-label').count() === 1)
  const focusVisible = await page.evaluate(() => {
    const b = document.querySelector('button')
    b.focus()
    const cs = getComputedStyle(b, ':focus-visible')
    return cs.outlineStyle !== 'none' || cs.outlineWidth !== '0px'
  })
  check('focus indicator is styled', focusVisible)

  // deep check inside a module with charts and images
  await lockPrediction(page, 0)
  await runModuleBody(page)
  const inModule = await page.evaluate(() => ({
    imagesWithoutAlt: [...document.querySelectorAll('img')].filter(i => i.getAttribute('alt') === null).length,
    barsWithNumbers: [...document.querySelectorAll('.bar-row')].every(r => (r.querySelector('.bar-value')?.textContent || '').trim().length > 0),
    barCount: document.querySelectorAll('.bar-row').length,
  }))
  check('chart bars all carry a numeric label', inModule.barCount === 0 || inModule.barsWithNumbers, `${inModule.barCount} bars`)
  check('module images have alt text', inModule.imagesWithoutAlt === 0, `${inModule.imagesWithoutAlt} missing`)
  await page.context().close()
}

// -------------------------------------------------------- narrow viewport
section('Narrow viewport (1280 lab desktop already covered; check 900px)')
{
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 }, ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
  check('landing page does not scroll sideways at 900px', !overflow)
  await page.getByRole('button', { name: 'Start Lab' }).click()
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
  check('first module does not scroll sideways at 900px', !overflow2)
  await ctx.close()
}

// ------------------------------------------------- every referenced asset
section('Asset coverage: every image the manifests reference must resolve')
{
  // A .gitignore rule once excluded the W13 placeholders, so they existed
  // locally and 404'd on the deployed site. Ask for each file by URL rather
  // than trusting the page, which degrades silently when one is missing.
  const mod = await import('../src/data/manifests.js')
  const urls = []
  for (const g of mod.W12_GRIDS) for (let i = 1; i <= g.count; i++) urls.push(`images/w12/${g.id}/${i}.${mod.W12_EXT}`)
  for (const im of mod.W13_IMAGES) urls.push(`images/w13/${im.id}.${mod.W13_EXT}`)
  for (const pr of mod.W14_PAIRS) { urls.push(`images/w14/${pr.id}_ai.${mod.W14_EXT}`); urls.push(`images/w14/${pr.id}_real.${mod.W14_EXT}`) }
  for (const id of mod.HEADER_IMAGES) urls.push(`images/headers/${id}.png`)

  const page = await newPage()
  const missing = []
  for (const u of urls) {
    const r = await page.request.get(new URL(u, BASE).href, { ignoreHTTPSErrors: true }).catch(() => null)
    if (!r || r.status() !== 200) missing.push(`${u} (${r ? r.status() : 'no response'})`)
  }
  check(`all ${urls.length} manifest images resolve`, missing.length === 0,
    missing.slice(0, 6).join(', ') + (missing.length > 6 ? ` +${missing.length - 6} more` : ''))
  await page.context().close()
}

// ------------------------------------------------- one-shot answers vs runs
section('Run-dependent questions stay shut until the run exists')
{
  // Answers lock on the first click. A question scored against a run the
  // student has not made yet burns that single answer for nothing.
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  for (let i = 0; i < 4; i++) {
    await lockPrediction(page)
    await runModuleBody(page)
    await answerAll(page, 'first')
    await nextBtn(page).click({ timeout: 20000 })
    await page.waitForTimeout(150)
  }
  await page.locator('h2', { hasText: 'Prompt Golf' }).waitFor({ timeout: 10000 })
  await lockPrediction(page)
  const q1 = page.locator('.question').first()
  check('W5 Q1 is not answerable before the baseline has been run',
    await q1.locator('.option').first().isDisabled())
  check('W5 Q1 says what it is waiting for',
    /Run the bare question first/.test(await q1.innerText()))
  check('Next explains that a run is outstanding, not just an answer',
    /still waiting on a run/.test(await page.locator('.app').innerText()))

  await page.getByRole('button', { name: /Run the bare question/ }).click()
  await page.locator('.mismatch-meter').first().waitFor({ timeout: 20000 })
  check('W5 Q1 opens once the baseline exists',
    !(await q1.locator('.option').first().isDisabled()))
  const q3 = page.locator('.question').nth(2)
  check('W5 questions about the cleared run stay shut until it is cleared',
    await q3.locator('.option').first().isDisabled())
  await page.context().close()
}

// ------------------------------------------------- W8 name coverage
section('W8 recognises every pioneer the transcripts actually name')
{
  // countDistinctWomen matches against a hardcoded name map. A captured run
  // that names a woman missing from that map counts her as unknown, which
  // undercounts the bare prompt and can make the steered prompt look like it
  // did nothing. Surface unknown names so the map can be extended.
  const [{ PIONEERS }, { countDistinctWomen }, utils, w8] = await Promise.all([
    import('../src/data/pioneers.js').catch(() => ({ PIONEERS: [] })),
    import('../src/widgets/W8Pioneers.jsx').catch(() => ({})),
    import('../src/lib/utils.js'),
    import('../src/data/recorded/w8.json', { with: { type: 'json' } }),
  ])
  const known = new Set([
    ...PIONEERS.map((p) => p.name.toLowerCase()),
    'hedy lamarr', 'joan clarke', 'evelyn boyd granville', 'sister mary kenneth keller',
    'mary kenneth keller', 'katherine johnson', 'jean bartik', 'kathleen booth',
  ])
  const unknown = new Set()
  for (const r of w8.default.runs) {
    for (const outs of Object.values(r.variants || {})) {
      for (const text of outs) {
        for (const n of utils.extractListNames(text)) {
          const key = n.toLowerCase().replace(/\s*\(.*\)\s*$/, '')
          if (!known.has(key)) unknown.add(key)
        }
      }
    }
  }
  check('every name in the W8 transcripts is in the gender map',
    unknown.size === 0,
    unknown.size ? `unmapped: ${[...unknown].join(', ')}` : '')
}

// ------------------------------------------------- W5 transcript integrity
section('W5 recorded transcripts: every grounded variant carries one documented mistake')
{
  const w5 = (await import('../src/data/recorded/w5.json', { with: { type: 'json' } })).default
  const problems = []
  for (const [i, r] of w5.runs.entries()) {
    for (const v of ['ground', 'ground_fallback']) {
      const text = r.variants[v]
      const pe = r.plantedErrors?.[v]
      if (!text) { problems.push(`run${i}/${v}: missing variant`); continue }
      if (!pe) { problems.push(`run${i}/${v}: no plantedErrors entry`); continue }
      for (const f of ['claim', 'statute', 'where', 'why']) {
        if (!pe[f]) problems.push(`run${i}/${v}: plantedErrors.${f} empty`)
      }
      if (pe.claim && !text.includes(pe.claim)) {
        problems.push(`run${i}/${v}: claim not present in the transcript`)
      }
    }
  }
  check(`all ${w5.runs.length * 2} grounded variants document their planted mistake`,
    problems.length === 0, problems.join('; '))
}

// ------------------------------------------------- pedagogy regressions
// Each of these was a real defect found by driving the rendered app on
// Sept 17. They are cheap to reintroduce by editing copy or CSS, so they are
// pinned here. See the "Second-pass pedagogy audit" section of the README.
section('Pedagogy regressions: colour semantics, answer leakage, option sets')
{
  const GREEN = 'rgb(240, 250, 242)'
  const RED = 'rgb(253, 240, 238)'
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()

  // Walk the lab in student mode, checking each module as it comes up. The
  // progress gate is on, so every module has to be answered before the next.
  for (let w = 0; w < 15; w++) {
    const h2 = (await page.locator('h2').first().textContent()) || ''
    await lockPrediction(page)

    if (h2.includes('Fluent and False')) {
      check('W2 has no hidden "Reveal answer" shortcut',
        (await page.getByRole('button', { name: /Reveal answer/ }).count()) === 0)
    }

    await runModuleBody(page)

    if (h2.includes('Citation Forge')) {
      const rows = await page.locator('.sort-item').evaluateAll(
        (n) => n.map((x) => x.innerText.split('\n')[0].trim()))
      const cited = rows.filter((r) => /\d+\s+[A-Za-z.]+.*\d+\s*\(/.test(r))
      check('W3 Citation Sort: fabricated rows carry full citations, like the real ones',
        rows.length > 0 && cited.length === rows.length, `${cited.length}/${rows.length}`)
    }

    if (h2.includes('Prompt Golf')) {
      // The zero state must never tell a student to hunt for a mistake unaided,
      // and must never claim one it cannot show them.
      const cav = page.locator('.card', { hasText: 'That is not the same as a correct summary' }).last()
      if (await cav.count()) {
        const cavText = await cav.innerText()
        check('W5 zero state does not send the student on a blind hunt', !/Find it\./.test(cavText))
        check('W5 zero state names the sentence to check', /residential exception/.test(cavText))
        check('W5 zero state offers the comparison on demand',
          (await page.getByRole('button', { name: /Show me the two lines side by side/ }).count()) === 1)
        await page.getByRole('button', { name: /Show me the two lines side by side/ }).click()
        await page.waitForTimeout(200)
        const opened = await cav.innerText()
        const claim = (opened.match(/\u201c([^\u201d]+)\u201d/) || [])[1] || ''
        const body = (await page.locator('.output-body').last().innerText())
          .replace(/(somewhere|NOWHERE) in statute/g, '').replace(/\s+/g, ' ')
        check('W5 the quoted mistake is really in the model output this student saw',
          !!claim && body.includes(claim.replace(/\s+/g, ' ')), claim)
        check('W5 shows the statute line beside it',
          /not on or within 5 miles of any military installation/.test(opened))
      }
      const sb = (await page.locator('.mismatch-meter').last().innerText()).replace(/\s+/g, ' ')
      check('W5 restates the baseline count beside the questions that ask for it',
        /your baseline run: \d+ invented number/i.test(sb), sb)
      const chip = page.locator('.num-chip[data-mark="match"]').first()
      const bg = await chip.evaluate((el) => getComputedStyle(el).backgroundColor)
      check('W5 "in statute" chip is neutral, not green', bg !== GREEN, bg)
      check('W5 chip label claims presence only, not correctness',
        (await chip.innerText()).includes('somewhere in statute'))
      const qs = await page.locator('.question .question-text').allInnerTexts()
      check('W5 questions use the meter\u2019s own words', qs[0].includes('invented numbers'))
      check('W5 asks nothing that assumes runs the student may not have made',
        !qs.some((q) => /failing runs|Your grounded summary reached/.test(q)))
    }

    if (h2.includes('Expert Quote') || h2.includes('Fabricated Expert')) {
      const t = await page.locator('.app').innerText()
      check('W7 leaks no PLACEHOLDER text to students', !t.includes('PLACEHOLDER'))
      check('W7 does not call the output fabricated before the student checks',
        !/Everything the model says about them below is fabricated/.test(t))
      check('W7 title does not answer its own first question', !t.includes('Fabricated Expert'))
    }

    if (h2.includes('Two Truths')) {
      // runModuleBody has played all six rounds, so re-check the last one's
      // colours from the final round's markup before it advanced.
      check('TTL statements are labelled in text, not colour alone',
        (await page.locator('.app').innerText()).includes('lies caught'))
    }

    if (h2.includes('Fact-Check')) {
      const opts = await page.locator('.question').nth(2).locator('.option').allInnerTexts()
      check('Fact-Check buckets do not overlap on the four-error draft',
        !(opts.some((b) => b.trim().endsWith('3 to 4')) && opts.some((b) => /All 4/.test(b))),
        opts.map((b) => b.replace(/\s+/g, ' ').trim()).join(' | '))
      check('Fact-Check source list is not labelled for instructors',
        !(await page.locator('.app').innerText()).includes('Instructor source list'))
    }

    await answerAll(page, 'first')
    await nextBtn(page).click({ timeout: 20000 })
    await page.waitForTimeout(200)
  }
  const res = await page.locator('.app').innerText()
  check('results table explains its blank verdict cells', res.includes('A dash in the Correct column'))
  check('results table drops the stale "out-of-statute" wording', !res.includes('out-of-statute'))
  check('W5/W6 export rows run in the order the student answered them',
    /W6-Q1[\s\S]*W6-Q2[\s\S]*W6-Q3/.test(res))
  await page.context().close()
}
{
  // TTL colour semantics, checked mid-round: the lie used to render green and
  // a true statement red, teaching the opposite of the module.
  const page = await newPage()
  await page.getByRole('button', { name: 'Start Lab' }).click()
  for (let i = 0; i < 6; i++) {
    await lockPrediction(page)
    await runModuleBody(page)
    await answerAll(page, 'first')
    await nextBtn(page).click({ timeout: 20000 })
    await page.waitForTimeout(150)
  }
  await lockPrediction(page)
  await page.locator('.ttl-statement').first().waitFor({ timeout: 20000 })
  await page.locator('.ttl-statement').nth(0).click()
  await page.waitForTimeout(300)
  const st = await page.locator('.ttl-statement').evaluateAll((n) => n.map((x) => ({
    state: x.dataset.state, bg: getComputedStyle(x).backgroundColor, text: x.innerText,
  })))
  const lie = st.find((x) => x.state === 'lie')
  const truths = st.filter((x) => x.state === 'truth')
  check('TTL: the lie renders red, not green', !!lie && lie.bg === 'rgb(253, 240, 238)', lie && lie.bg)
  check('TTL: true statements render green, not red',
    truths.length === 2 && truths.every((x) => x.bg === 'rgb(240, 250, 242)'))
  check('TTL: every statement says in words whether it is true or FALSE',
    st.every((x) => /FALSE|\u2014 true/.test(x.text)))
  check('TTL: disabled statement text stays readable',
    (await page.locator('.ttl-statement').first().evaluate((el) => getComputedStyle(el).opacity)) === '1')
  await page.context().close()
}

console.log(`\n================ ${passed} passed, ${failed} failed ================`)
if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  - ' + f)) }
await browser.close()
process.exit(failed ? 1 : 0)
