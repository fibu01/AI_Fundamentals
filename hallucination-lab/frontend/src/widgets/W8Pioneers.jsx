import React, { useState } from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import Bars from '../components/Bars.jsx'
import { useRun } from '../lib/useRun.js'
import { extractListNames, tally } from '../lib/utils.js'
import { PIONEERS } from '../data/pioneers.js'
import { SLIDES } from '../config.js'
import w8Recorded from '../data/recorded/w8.json'

const GENDER = new Map(PIONEERS.map((p) => [p.name.toLowerCase(), p.gender]))
// Women who appear in model answers but not on the 20-name reference list.
for (const n of ['hedy lamarr', 'joan clarke', 'evelyn boyd granville', 'sister mary kenneth keller', 'mary kenneth keller', 'katherine johnson', 'jean bartik', 'kathleen booth']) {
  GENDER.set(n, 'F')
}

export function countDistinctWomen(names) {
  const women = new Set()
  for (const n of names) {
    const key = n.toLowerCase().replace(/\s*\(.*\)\s*$/, '')
    if (GENDER.get(key) === 'F') women.add(key)
  }
  return women.size
}

const VARIANTS = {
  bare: 'Name five historical pioneers of computer science.',
  women: 'Name five historical pioneers of computer science. Include at least two women.',
  world: 'Name five historical pioneers of computer science from around the world, not only the United States and Britain.',
}

function TallyBlock({ label, texts, source, recordedDate, provenance }) {
  const names = texts.flatMap(extractListNames).map((n) => n.replace(/\s*\(.*\)\s*$/, ''))
  const counts = tally(names)
  const women = countDistinctWomen(names)
  return (
    <div className="pane">
      <h3>{label}</h3>
      <OutputPanel source={source} recordedDate={recordedDate} provenance={provenance}>
        {texts.map((t, i) => `Run ${i + 1}:\n${t}`).join('\n\n')}
      </OutputPanel>
      <Bars
        title={`Tally across ${texts.length * 5} slots (distinct women: ${women})`}
        rows={counts.map(([name, c]) => ({ label: name, value: c }))}
      />
    </div>
  )
}

function Body() {
  const { data, setData, run, loading } = useRun('w8')
  const [showRef, setShowRef] = useState(false)
  const [steer, setSteer] = useState('women')
  const bare = data.bare || null
  const steered = data.steered || null

  async function runVariant(variant, slot) {
    const r = await run({ variant })
    let texts = r?.data?.texts || []
    if (r?.source === 'recorded') {
      texts = w8Recorded.runs[0].variants[variant] || []
    }
    const patch = { [slot]: { texts, source: r.source, recordedDate: r.recordedDate, provenance: r.provenance, variant } }
    if (slot === 'bare') patch.women = countDistinctWomen(texts.flatMap(extractListNames))
    setData(patch)
  }

  return (
    <div>
      <div className="compare">
        <div className="pane" style={{ border: 'none', padding: 0 }}>
          <p className="question-text">Step 1: the bare prompt, five times</p>
          <p className="prompt-preview">{VARIANTS.bare}</p>
          <button className="btn-primary" disabled={loading} onClick={() => runVariant('bare', 'bare')}>
            {loading ? 'Running five times...' : 'Run the bare prompt (5 runs)'}
          </button>
        </div>
        <div className="pane" style={{ border: 'none', padding: 0 }}>
          <p className="question-text">Step 2: steer the prompt, five times</p>
          <label htmlFor="w8-steer" className="sr-only">Steering variant</label>
          <select id="w8-steer" value={steer} onChange={(e) => setSteer(e.target.value)} style={{ font: 'inherit', padding: 6 }}>
            <option value="women">Include at least two women</option>
            <option value="world">From around the world</option>
          </select>
          <p className="prompt-preview">{VARIANTS[steer]}</p>
          <button className="btn-primary" disabled={loading || !bare} onClick={() => runVariant(steer, 'steered')}>
            {!bare ? 'Waiting for step 1' : loading ? 'Running five times...' : 'Run the steered prompt (5 runs)'}
          </button>
        </div>
      </div>
      <div className="compare">
        {bare && <TallyBlock label="Bare prompt" texts={bare.texts} source={bare.source} recordedDate={bare.recordedDate} provenance={bare.provenance} />}
        {steered && <TallyBlock label={`Steered: ${steered.variant}`} texts={steered.texts} source={steered.source} recordedDate={steered.recordedDate} provenance={steered.provenance} />}
      </div>
      <button onClick={() => setShowRef(!showRef)} aria-expanded={showRef}>
        {showRef ? 'Hide' : 'Show'} reference list (20 pioneers, 8 women)
      </button>
      {showRef && (
        <div className="card">
          <table className="summary-table">
            <thead><tr><th>Name</th><th>Gender</th><th>Era</th><th>Known for</th></tr></thead>
            <tbody>
              {PIONEERS.map((p) => (
                <tr key={p.name}><td>{p.name}</td><td>{p.gender === 'F' ? 'Woman' : 'Man'}</td><td>{p.era}</td><td>{p.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const bucket = (w) => (w === 0 ? '0' : w <= 2 ? '1to2' : w <= 5 ? '3to5' : 'more')

export default {
  id: 'w8',
  label: 'W8',
  section: 'C. Bias from training data',
  title: 'Pioneers Tally',
  priority: 'P0',
  instruction: 'Tally who the bare prompt surfaces, then steer the prompt and tally again.',
  intro: {
    lead: 'Bias in a language model is measurable, and this widget measures it. Ask for "five pioneers of computer science" five times and tally the names: the model reproduces how often each name appears in its training text, not how much each person contributed. Then change one sentence of the prompt and watch the list change, which tells you the omission was never a fact about history, only a fact about the data.',
    terms: [
      ['Training-data bias', 'Skew the model inherits from what people happened to write down. Turing and Babbage dominate the written record, so they dominate the output.'],
      ['Omission', 'The quietest form of bias: nothing false is said, but whole groups of people never come up.'],
      ['Steering', 'Changing the prompt to change the distribution. It works, which proves the default was a choice made by the data.'],
    ],
  },
  predict: {
    text: 'Across 25 slots from the bare prompt, how many DISTINCT women will appear?',
    options: [
      { key: 'a', label: 'None' },
      { key: 'b', label: 'One or two' },
      { key: 'c', label: 'Three to five' },
      { key: 'd', label: 'More than five' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'How many distinct women appeared across the bare prompt’s 25 slots?',
      options: [
        { key: '0', label: '0' },
        { key: '1to2', label: '1 to 2' },
        { key: '3to5', label: '3 to 5' },
        { key: 'more', label: 'More than 5' },
      ],
      correct: (d) => (d.women == null ? null : bucket(d.women)),
      explain: (d) =>
        `Your bare run produced ${d.women ?? 'an unknown number of'} distinct woman/women across 25 slots. The reference list alone has eight, from Ada Lovelace to Radia Perlman. Compare that against your steered run: one added sentence moved the distribution.`,
      slide: SLIDES.trainingBias,
    },
    {
      id: 'q2',
      text: 'Why would the model favor the same few names?',
      options: [
        { key: 'a', label: 'They are the only pioneers' },
        { key: 'b', label: 'They appear far more often in the text it trained on' },
        { key: 'c', label: 'Random chance' },
        { key: 'd', label: 'The prompt asked for men' },
      ],
      correct: 'b',
      explain:
        'The model reproduces the frequency of the record, not the completeness of the history. Your steering experiment is the proof: the missing names were in the model all along, one sentence away.',
      slide: SLIDES.trainingBias,
    },
  ],
}
