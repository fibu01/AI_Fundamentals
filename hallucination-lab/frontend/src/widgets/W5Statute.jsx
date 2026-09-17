import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import TechniquePanel from '../components/TechniquePanel.jsx'
import { useRun } from '../lib/useRun.js'
import { extractNumbers, normalizeNumber } from '../lib/utils.js'
import { STATUTE_TEXT, STATUTE_TITLE, STATUTE_URL, STATUTE_NUMBERS, CAPTURE_DATE } from '../data/statute.js'
import { SLIDES } from '../config.js'
import w5Recorded from '../data/recorded/w5.json'

const BASE_PROMPT =
  'Summarize Florida Statute 692.203 (foreign ownership of real property), including the residential acreage limit and the required distance from military installations. Give specific numbers.'
const AVAILABLE = ['ground', 'fallback', 'cite_check', 'low_temp', 'basis']
const PAR = 2

export function mismatchCount(text) {
  return extractNumbers(text).filter((n) => !STATUTE_NUMBERS.has(normalizeNumber(n.raw))).length
}

function recordedVariant(techniques) {
  if (techniques.includes('ground') && techniques.includes('fallback')) return 'ground_fallback'
  if (techniques.includes('ground')) return 'ground'
  if (techniques.includes('low_temp')) return 'low_temp'
  return 'baseline'
}

function MarkedText({ text }) {
  const nums = extractNumbers(text)
  const parts = []
  let cursor = 0
  nums.forEach((n, i) => {
    const ok = STATUTE_NUMBERS.has(normalizeNumber(n.raw))
    parts.push(text.slice(cursor, n.index))
    parts.push(
      <span key={i} className="num-chip" data-mark={ok ? 'match' : 'mismatch'} style={{ cursor: 'default' }}>
        {n.raw}<span className="mark-text">{ok ? 'in statute' : 'NOT in statute'}</span>
      </span>
    )
    cursor = n.index + n.raw.length
  })
  parts.push(text.slice(cursor))
  return <>{parts}</>
}

function Meter({ label, count }) {
  return (
    <p className="mismatch-meter">
      {label}: <span className={`count${count === 0 ? ' zero' : ''}`}>{count}</span>{' '}
      number(s) the statute does not contain
    </p>
  )
}

function Body() {
  const { data, setData, run, loading } = useRun('w5')
  const baseline = data.baseline || null
  const attempt = data.attempt || null
  const techniques = data.techniques || []
  const strokes = data.strokes || 0
  const solvedWith = data.solvedWith || null

  async function runWith(selected, slot) {
    const r = await run({ techniques: selected })
    let text = r?.data?.text || ''
    if (r?.source === 'recorded') {
      const runObj = w5Recorded.runs[Math.floor(Math.random() * w5Recorded.runs.length)]
      text = runObj.variants[recordedVariant(selected)] || runObj.variants.baseline
    }
    const mm = mismatchCount(text)
    const patch = { [slot]: { text, source: r.source, recordedDate: r.recordedDate, provenance: r.provenance, mismatches: mm } }
    if (slot === 'attempt') {
      patch.strokes = strokes + 1
      if (mm === 0 && selected.length > 0 && !solvedWith) {
        patch.solvedWith = { techniques: [...selected], strokes: strokes + 1 }
      }
    } else {
      patch.baselineMismatches = mm
    }
    setData(patch)
  }

  return (
    <div>
      <div className="compare">
        <div className="pane">
          <h3>Step 1: the ungrounded baseline</h3>
          <button className="btn-primary" disabled={loading || !!baseline}
            onClick={() => runWith([], 'baseline')}>
            {baseline ? 'Baseline recorded below' : loading ? 'Running...' : 'Run the bare question'}
          </button>
          {baseline && (
            <>
              <Meter label="Baseline" count={baseline.mismatches} />
              <OutputPanel source={baseline.source} recordedDate={baseline.recordedDate} provenance={baseline.provenance}>
                <MarkedText text={baseline.text} />
              </OutputPanel>
            </>
          )}
        </div>
        <div className="pane">
          <h3>{STATUTE_TITLE}</h3>
          <p className="muted">
            The referee. Captured {CAPTURE_DATE} from{' '}
            <a href={STATUTE_URL} target="_blank" rel="noreferrer">flsenate.gov</a>. The auto-check marks a
            number "in statute" if it appears anywhere in this text, so read the context yourself; a right
            number attached to the wrong rule still slips through.
          </p>
          <div className="pane-body">{STATUTE_TEXT}</div>
        </div>
      </div>

      {baseline && (
        <div className="card">
          <p className="question-text golf-score">
            Prompt Golf: get the summary to ZERO out-of-statute numbers. Par: {PAR} techniques.
            {solvedWith
              ? ` Solved with ${solvedWith.techniques.length} technique(s) in ${solvedWith.strokes} run(s): ${solvedWith.techniques.join(', ')}.`
              : ` Runs so far: ${strokes}.`}
          </p>
          <TechniquePanel
            available={AVAILABLE}
            selected={techniques}
            onChange={(t) => setData({ techniques: t })}
            basePrompt={BASE_PROMPT}
            disabled={loading}
          />
          <button className="btn-primary" disabled={loading || techniques.length === 0}
            onClick={() => runWith(techniques, 'attempt')}>
            {loading ? 'Running...' : `Re-run with ${techniques.length} technique(s)`}
          </button>
          {attempt && (
            <>
              <Meter label="This attempt" count={attempt.mismatches} />
              <OutputPanel source={attempt.source} recordedDate={attempt.recordedDate} provenance={attempt.provenance}>
                <MarkedText text={attempt.text} />
              </OutputPanel>
              {attempt.mismatches > 0 && (
                <p className="muted">Still leaking invented numbers. Not every technique attacks this failure; think about which one gives the model the text it is missing.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default {
  id: 'w5',
  label: 'W5/W6',
  section: 'B. Hallucination',
  title: 'Statute vs Summary: Prompt Golf',
  priority: 'P0',
  instruction: 'Get the model’s statute summary to zero invented numbers, in as few techniques as you can.',
  intro: {
    lead: 'Naming a statute in your prompt does not hand the model the statute; it only sets the style of the answer. First run the bare question and count how many numbers the model invents. Then it is a game: apply techniques from Tuesday until the summary contains zero numbers the statute does not, using as few toggles as possible. Some toggles will not help at all. Finding out which ones fail, and why, is the experiment. One warning before you start: hitting zero on this meter does not mean the summary is correct. The meter only checks whether each number appears somewhere in the statute.',
    terms: [
      ['Grounding', 'Putting the actual source text inside the prompt so the model can copy from it instead of inventing. This is what Copilot and Gemini do with web results.'],
      ['Escape hatch', 'Explicit permission to answer "Information not found." Without it, models fill gaps rather than admit them.'],
      ['Mismatch', 'A number in the model’s summary that appears nowhere in the statute. The meter counts them automatically.'],
    ],
  },
  predict: {
    text: 'Which single technique do you expect will fix the invented numbers?',
    options: [
      { key: 'a', label: 'Lowering the temperature to 0.2' },
      { key: 'b', label: 'Demanding checkable citations' },
      { key: 'c', label: 'Pasting the statute text into the prompt' },
      { key: 'd', label: 'Asking the model to state its basis' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      rowLabel: 'W5-Q1',
      text: 'How many out-of-statute numbers did your BASELINE run contain?',
      options: [
        { key: '0', label: '0' },
        { key: '1', label: '1' },
        { key: '2', label: '2' },
        { key: '3plus', label: '3 or more' },
      ],
      correct: (d) =>
        d.baselineMismatches == null ? null : d.baselineMismatches >= 3 ? '3plus' : String(d.baselineMismatches),
      explain: (d) =>
        d.baselineMismatches == null
          ? 'Run the baseline first.'
          : `The meter counted ${d.baselineMismatches} out-of-statute number(s) in your baseline. Remember the check is presence-only: a real statute number quoted for the wrong rule still shows as "in statute," so the meter understates the damage if anything.`,
      slide: SLIDES.fabrication,
    },
    {
      id: 'q2',
      rowLabel: 'W5-Q2',
      text: 'The statute number was in the prompt. Why did the baseline still get details wrong?',
      options: [
        { key: 'a', label: 'The statute is not online' },
        { key: 'b', label: 'The model has no copy of the statute; it generated plausible legal language from patterns' },
        { key: 'c', label: 'The statute changed today' },
        { key: 'd', label: 'The prompt was too long' },
      ],
      correct: 'b',
      explain:
        'Naming a source is not supplying it. With no retrieval, the model produces language shaped like a statute summary, with numbers where numbers usually go.',
      slide: SLIDES.grounding,
    },
    {
      id: 'q3',
      rowLabel: 'W6-Q1',
      text: 'Which technique actually eliminated the mismatches?',
      options: [
        { key: 'a', label: 'Low temperature' },
        { key: 'b', label: 'Demanding checkable citations' },
        { key: 'c', label: 'Grounding: pasting the source text (with or without the escape hatch)' },
        { key: 'd', label: 'Asking the model to state its basis' },
      ],
      correct: 'c',
      explain: (d) =>
        `Only grounding gives the model the missing text; every other toggle just changes how the fabrication sounds. Low temperature makes the wrong numbers consistent, not correct.${d.solvedWith ? ` You solved it with ${d.solvedWith.techniques.join(' + ')} against a par of ${PAR}.` : ' Keep playing until the meter reads zero; the export records how you solved it.'} Now the limit: a zero here means every number appeared somewhere in the statute, not that the summary says what the statute says. Grounding cuts invention; it does not certify the answer. You still have to read the source.`,
      slide: SLIDES.grounding,
    },
    {
      id: 'q4',
      rowLabel: 'W6-Q2',
      text: 'What changed between your failing runs and the passing run?',
      options: [
        { key: 'a', label: 'The model' },
        { key: 'b', label: 'The temperature' },
        { key: 'c', label: 'The prompt supplied the source and forbade outside facts' },
        { key: 'd', label: 'The question' },
      ],
      correct: 'c',
      explain:
        'Same model, same question. The prompt carried the statute and an instruction to stay inside it, and the escape hatch made "Information not found" an acceptable answer. That combination is the verification-friendly way to use any AI tool.',
      slide: SLIDES.grounding,
    },
  ],
}
