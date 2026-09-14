import React, { useState } from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import Bars from '../components/Bars.jsx'
import { useRun } from '../lib/useRun.js'
import { extractListNames, tally } from '../lib/utils.js'
import { PIONEERS } from '../data/pioneers.js'
import { SLIDES } from '../config.js'
import w8Recorded from '../data/recorded/w8.json'

const GENDER = new Map(PIONEERS.map((p) => [p.name.toLowerCase(), p.gender]))
// A few women who appear in model answers but not on the 20-name reference list.
for (const n of ['hedy lamarr', 'joan clarke', 'evelyn boyd granville', 'sister mary kenneth keller', 'mary kenneth keller']) {
  GENDER.set(n, 'F')
}

export function countDistinctWomen(names) {
  const women = new Set()
  for (const n of names) {
    if (GENDER.get(n.toLowerCase()) === 'F') women.add(n.toLowerCase())
  }
  return women.size
}

function Body() {
  const { data, setData, run, loading } = useRun('w8')
  const [showRef, setShowRef] = useState(false)
  const res = data.result
  // Live responses carry { texts: [five answers] }; recorded files carry runs
  // of single answers, so the api layer may return { text } instead.
  let texts = []
  if (res?.data) {
    if (res.data.texts) texts = res.data.texts
    else if (res.data.text) texts = data.recordedTexts || [res.data.text]
  }
  const allNames = texts.flatMap(extractListNames)
  const counts = tally(allNames)
  const women = countDistinctWomen(allNames)

  return (
    <div>
      <button
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          const r = await run({})
          if (r?.source === 'recorded') {
            // Recorded fallback: use all five stored answers, not one sample.
            const all = w8Recorded.runs.map((x) => x.text)
            setData({ recordedTexts: all, women: countDistinctWomen(all.flatMap(extractListNames)) })
          } else {
            const t = r?.data?.texts || []
            setData({ women: countDistinctWomen(t.flatMap(extractListNames)) })
          }
        }}
      >
        {loading ? 'Running five times...' : 'Name five pioneers of computer science (runs 5 times)'}
      </button>
      {texts.length > 0 && (
        <>
          <OutputPanel source={res.source} recordedDate={res.recordedDate}>
            {texts.map((t, i) => `Run ${i + 1}:\n${t}`).join('\n\n')}
          </OutputPanel>
          <Bars
            title={`Name tally across ${texts.length * 5} slots (distinct women: ${women})`}
            rows={counts.map(([name, c]) => ({ label: name, value: c }))}
          />
        </>
      )}
      <button onClick={() => setShowRef(!showRef)} aria-expanded={showRef}>
        {showRef ? 'Hide' : 'Show'} reference list (20 pioneers)
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
  instruction: 'Run the same question five times, tally the names, and compare against the reference list.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'How many distinct women appeared across 25 slots?',
      options: [
        { key: '0', label: '0' },
        { key: '1to2', label: '1 to 2' },
        { key: '3to5', label: '3 to 5' },
        { key: 'more', label: 'More than 5' },
      ],
      correct: (d) => (d.women == null ? null : bucket(d.women)),
      explain: (d) =>
        `Your run produced ${d.women ?? 'an unknown number of'} distinct woman/women across 25 slots. The reference list alone has eight women, from Ada Lovelace to Radia Perlman. The gap between eight available and what the model surfaced is the omission form of bias.`,
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
        'Turing, Babbage, and von Neumann dominate textbooks, articles, and websites, so they dominate the model’s probabilities. The model reproduces the frequency of the record, not the completeness of the history.',
      slide: SLIDES.trainingBias,
    },
  ],
}
