import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { extractNumbers, normalizeNumber } from '../lib/utils.js'
import { STATUTE_TEXT, STATUTE_TITLE, STATUTE_URL, STATUTE_NUMBERS, CAPTURE_DATE } from '../data/statute.js'
import { SLIDES } from '../config.js'

function heuristicMatchCount(text) {
  return extractNumbers(text).filter((n) => STATUTE_NUMBERS.has(normalizeNumber(n.raw))).length
}

function ChipText({ text, marks, onMark }) {
  const nums = extractNumbers(text)
  const parts = []
  let cursor = 0
  nums.forEach((n, i) => {
    parts.push(text.slice(cursor, n.index))
    const mark = marks[i]
    parts.push(
      <button
        key={i}
        className="num-chip"
        data-mark={mark || 'unmarked'}
        aria-label={`Number ${n.raw}, currently ${mark || 'unmarked'}. Click to cycle Match, Mismatch.`}
        onClick={() => onMark(i, mark === 'match' ? 'mismatch' : mark === 'mismatch' ? null : 'match')}
      >
        {n.raw}
        <span className="mark-text">{mark === 'match' ? 'Match' : mark === 'mismatch' ? 'Mismatch' : 'check me'}</span>
      </button>
    )
    cursor = n.index + n.raw.length
  })
  parts.push(text.slice(cursor))
  return <>{parts}</>
}

function Body() {
  const { data, setData, run, loading } = useRun('w5')
  const res = data.result
  const text = res?.data?.text || ''
  const marks = data.marks || {}

  return (
    <div>
      <button
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          const r = await run({})
          const t = r?.data?.text || ''
          setData({ marks: {}, heuristic: heuristicMatchCount(t) })
        }}
      >
        {loading ? 'Asking the Lab Model...' : 'Ask for a summary of Florida Statute 692.203'}
      </button>
      {res && (
        <div className="compare" style={{ marginTop: 12 }}>
          <div className="pane">
            <h3>Lab Model summary (click each number, mark Match or Mismatch)</h3>
            <OutputPanel source={res.source} recordedDate={res.recordedDate}>
              <ChipText
                text={text}
                marks={marks}
                onMark={(i, m) => setData({ marks: { ...marks, [i]: m } })}
              />
            </OutputPanel>
          </div>
          <div className="pane">
            <h3>{STATUTE_TITLE}</h3>
            <p className="muted">
              Captured {CAPTURE_DATE} from{' '}
              <a href={STATUTE_URL} target="_blank" rel="noreferrer">flsenate.gov</a>. Compare every number against this text.
            </p>
            <div className="pane-body">{STATUTE_TEXT}</div>
          </div>
        </div>
      )}
    </div>
  )
}

const bucket = (n) => (n >= 3 ? '3plus' : String(n))

export default {
  id: 'w5',
  label: 'W5',
  section: 'B. Hallucination',
  title: 'Statute vs Summary',
  priority: 'P0',
  instruction: 'Check every number in the AI summary against the real statute text on the right.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'How many numbers in the AI summary matched the statute exactly?',
      options: [
        { key: '0', label: '0' },
        { key: '1', label: '1' },
        { key: '2', label: '2' },
        { key: '3plus', label: '3 or more' },
      ],
      correct: (d) => (d.heuristic == null ? null : bucket(d.heuristic)),
      explain: (d) =>
        d.heuristic == null
          ? 'Run the widget to get a summary first.'
          : `The auto-check counted ${d.heuristic} number(s) in your run that appear anywhere in the statute text. That check matches values only, not context: a "10" used for the wrong rule still counts, so your own click-by-click comparison is the better reading. Both real and invented numbers arrive with the same confident wording.`,
      slide: SLIDES.fabrication,
    },
    {
      id: 'q2',
      text: 'The statute number was in the prompt. Why did the model still get details wrong?',
      options: [
        { key: 'a', label: 'The statute is not online' },
        { key: 'b', label: 'The model has no copy of the statute; it generated plausible legal language from patterns' },
        { key: 'c', label: 'The statute changed today' },
        { key: 'd', label: 'The prompt was too long' },
      ],
      correct: 'b',
      explain:
        'Naming a statute in the prompt does not hand the model its text. With no retrieval, the model produces language that sounds like a summary of a Florida property statute, with numbers where numbers usually go.',
      slide: SLIDES.grounding,
    },
  ],
}
