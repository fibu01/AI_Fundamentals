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
        {/* "somewhere" is the whole claim: the check is presence, not fit. The
            old "in statute" label, in green, read as "this figure is correct"
            on numbers the summary had attached to the wrong rule. */}
        {n.raw}<span className="mark-text">{ok ? 'somewhere in statute' : 'NOWHERE in statute'}</span>
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
      invented number(s) &mdash; figures that appear nowhere in the statute
    </p>
  )
}

// Reaching zero is where the misreading lives: the meter only asks whether
// each figure appears somewhere in the statute, never whether it was attached
// to the right rule.
//
// This used to say "at least one statement is still wrong. Find it." and stop
// there, with a graded one-shot question waiting. That is a hunt through 1,200
// words of statute for a subtle misattribution, with no way to check yourself
// and a penalty for failing, which is a trap rather than a lesson. The point
// is that a clean meter does not certify a summary; students learn that faster
// by being shown the discrepancy than by failing to find it. So: look first if
// you want to, then open the comparison. Nothing is graded on finding it.
function ZeroCaveat({ planted }) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="card" style={{ borderLeftColor: 'var(--warn-border, #b8860b)' }}>
      <p><strong>Zero invented numbers. That is not the same as a correct summary.</strong></p>
      <p>
        The meter checks one narrow thing: does each figure appear somewhere in the statute text?
        It cannot tell whether a real number was attached to the right rule. Grounding stopped the
        model inventing figures; it did not make the model read carefully.
      </p>
      {planted ? (
        <>
          <p>
            There is exactly one such mistake in this summary, in{' '}
            <strong>{planted.where}</strong>. Try to spot it before you open the comparison, but you
            are not graded on finding it, so open it whenever you like.
          </p>
          {!shown ? (
            <button onClick={() => setShown(true)}>Show me the two lines side by side</button>
          ) : (
            <div className="compare" style={{ marginTop: 10 }}>
              <div className="pane">
                <h4 style={{ margin: '0 0 6px' }}>What the model wrote</h4>
                <p style={{ margin: 0 }}>&ldquo;{planted.claim}&rdquo;</p>
              </div>
              <div className="pane">
                <h4 style={{ margin: '0 0 6px' }}>What the statute says</h4>
                <p style={{ margin: 0 }}>{planted.statute}</p>
              </div>
            </div>
          )}
          {shown && <p style={{ marginBottom: 0 }}>{planted.why}</p>}
        </>
      ) : (
        <p style={{ marginBottom: 0 }}>
          Read the summary line by line against the statute on the right before you trust it. A
          right number cited for the wrong rule passes this meter every time.
        </p>
      )}
    </div>
  )
}

// The questions ask about numbers the student saw further up a long page. Keep
// both counts next to the questions so answering is reading, not recall.
function Scoreboard({ baseline, attempt }) {
  if (baseline == null) return null
  return (
    <p className="mismatch-meter" style={{ flexWrap: 'wrap' }}>
      For the questions below &mdash; your baseline run:{' '}
      <span className={`count${baseline === 0 ? ' zero' : ''}`}>{baseline}</span> invented number(s).
      {attempt != null && (
        <>
          {' '}Your latest attempt:{' '}
          <span className={`count${attempt === 0 ? ' zero' : ''}`}>{attempt}</span>.
        </>
      )}
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
    let pinnedIndex = data.runIndex ?? null
    let planted = null
    if (r?.source === 'recorded') {
      // Pin the transcript on the first run of the module. Drawing a fresh one
      // per attempt meant the baseline and the technique runs came from
      // different transcripts, so the student was not comparing like with like
      // and an inert toggle appeared to change the output.
      pinnedIndex = data.runIndex ?? Math.floor(Math.random() * w5Recorded.runs.length)
      const runObj = w5Recorded.runs[pinnedIndex]
      const variant = recordedVariant(selected)
      text = runObj.variants[variant] || runObj.variants.baseline
      // Only the grounded variants carry a documented planted error. A live
      // run carries none, and the caveat must not claim one that is not there.
      planted = runObj.plantedErrors?.[variant] || null
    }
    const mm = mismatchCount(text)
    const patch = { [slot]: { text, source: r.source, recordedDate: r.recordedDate, provenance: r.provenance, mismatches: mm, planted } }
    if (pinnedIndex != null) patch.runIndex = pinnedIndex
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
            Prompt Golf: drive the invented numbers to ZERO. Par: {PAR} techniques.
            {solvedWith
              ? ` Meter cleared with ${solvedWith.techniques.length} technique(s) in ${solvedWith.strokes} run(s): ${solvedWith.techniques.join(', ')}. Clearing the meter is not the same as a correct summary.`
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
              {attempt.mismatches > 0 ? (
                <p className="muted">Still leaking invented numbers. Not every technique attacks this failure; think about which one gives the model the text it is missing.</p>
              ) : (
                <ZeroCaveat planted={attempt.planted} />
              )}
            </>
          )}
        </div>
      )}
      <Scoreboard
        baseline={baseline ? baseline.mismatches : null}
        attempt={attempt ? attempt.mismatches : null}
      />
    </div>
  )
}

export default {
  id: 'w5',
  label: 'W5/W6',
  section: 'B. Hallucination',
  title: 'Statute vs Summary: Prompt Golf',
  priority: 'P0',
  instruction: 'Drive the invented numbers to zero in as few techniques as you can, then check whether the summary is actually right.',
  intro: {
    lead: 'Naming a statute in your prompt does not hand the model the statute; it only sets the style of the answer. First run the bare question and count how many numbers the model invents. Then it is a game: apply techniques from Tuesday until the summary contains zero numbers the statute does not, using as few toggles as possible. Some toggles will not help at all. Finding out which ones fail, and why, is the experiment. One warning before you start: hitting zero on this meter does not mean the summary is correct. The meter only checks whether each number appears somewhere in the statute.',
    terms: [
      ['Grounding', 'Putting the actual source text inside the prompt so the model can copy from it instead of inventing. This is what Copilot and Gemini do with web results.'],
      ['Escape hatch', 'Explicit permission to answer "Information not found." Without it, models fill gaps rather than admit them.'],
      ['Invented number', 'A number in the model’s summary that appears nowhere in the statute. The meter counts these automatically. It cannot catch a real statute number quoted for the wrong rule, which is why you still have to read the source.'],
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
      needs: (d) => d.baselineMismatches != null,
      needsHint: 'Run the bare question first. This question opens once the baseline meter has a number in it.',
      text: 'How many invented numbers did your BASELINE run contain?',
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
          : `The meter counted ${d.baselineMismatches} invented number(s) in your baseline. Remember the check is presence-only: a real statute number quoted for the wrong rule still shows as "in statute," so the meter understates the damage if anything.`,
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
      needs: (d) => !!d.solvedWith,
      needsHint: 'Play the game first: toggle techniques and re-run until the meter reads zero. This question opens then.',
      text: 'Which technique actually drove the invented numbers to zero?',
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
      needs: (d) => !!d.solvedWith,
      needsHint: 'This one opens once a run has cleared the meter, so you have both halves to compare.',
      text: 'Between the bare baseline and the run that cleared the meter, what changed?',
      options: [
        { key: 'a', label: 'The model' },
        { key: 'b', label: 'The temperature' },
        { key: 'c', label: 'The prompt supplied the source and forbade outside facts' },
        { key: 'd', label: 'The question' },
      ],
      correct: 'c',
      explain:
        'Same model, same question, same temperature. The only thing that changed is that the prompt carried the statute text itself. Add the escape hatch on top and "Information not found" becomes an acceptable answer instead of a gap the model fills. That is the verification-friendly way to use any AI tool.',
      slide: SLIDES.grounding,
    },
    {
      id: 'q5',
      rowLabel: 'W6-Q3',
      needs: (d) => !!d.solvedWith,
      needsHint: 'This one opens once a run has cleared the meter and the comparison above is on screen.',
      text: 'Your grounded run reached zero invented numbers, and the comparison above shows one of its statements is still wrong. What does that tell you about the meter?',
      options: [
        { key: 'a', label: 'Nothing; zero on the meter still means the summary is correct' },
        { key: 'b', label: 'A number can be real and still be attached to the wrong rule, and the meter cannot see that' },
        { key: 'c', label: 'The meter missed a number the model invented' },
        { key: 'd', label: 'The statute is too complicated to summarize at all' },
      ],
      // Unscored when no planted error is documented: a live run has none, and
      // marking a student wrong for a mistake that is not on their screen is
      // exactly the trap this question used to be.
      correct: (d) => (d.attempt?.planted ? 'b' : null),
      explain: (d) =>
        (d.attempt?.planted
          ? `The summary said "${d.attempt.planted.claim}". ${d.attempt.planted.why} `
          : 'Compare each figure against the rule it is attached to, not just against the statute as a whole. ') +
        'That is the limit of grounding, and it is the reason this module exists. Grounding stops the model inventing facts; it does not make the model read carefully, and no prompt you can write removes the step where you check the source yourself. You were not asked to find this one unaided, because catching it is a skill you build with practice, not a test you pass on the first try. The habit is what transfers: when an AI hands you a number, find the sentence in the source that the number came from.',
      slide: SLIDES.grounding,
    },
  ],
}
