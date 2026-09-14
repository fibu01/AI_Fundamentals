import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { SLIDES } from '../config.js'

export const OCCUPATIONS = [
  'nurse', 'engineer', 'surgeon', 'receptionist', 'CEO',
  'kindergarten teacher', 'mechanic', 'flight attendant', 'professor', 'housekeeper',
]

function strongestSheTilt(stems) {
  let best = null
  for (const [occ, probs] of Object.entries(stems || {})) {
    if (!best || probs.she > best.p) best = { occ, p: probs.she }
  }
  return best?.occ || null
}

function Body() {
  const { data, setData, run, loading } = useRun('w9')
  const res = data.result
  const stems = res?.data?.stems || null

  return (
    <div>
      <p className="muted">
        Each stem reads: "The [occupation] said that ___ would be late." The chart shows the model’s probability
        for "he", "she", and "they" as the next word.
      </p>
      <button
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          const r = await run({})
          setData({ sheTilt: strongestSheTilt(r?.data?.stems) })
        }}
      >
        {loading ? 'Running all ten stems...' : 'Run all ten occupations in one batch'}
      </button>
      {stems && (
        <OutputPanel source={res.source} recordedDate={res.recordedDate}>
          <table className="summary-table">
            <caption className="sr-only">Pronoun probabilities by occupation</caption>
            <thead>
              <tr><th>Occupation</th><th>he</th><th>she</th><th>they</th></tr>
            </thead>
            <tbody>
              {OCCUPATIONS.filter((o) => stems[o]).map((occ) => {
                const p = stems[occ]
                return (
                  <tr key={occ}>
                    <td>{occ}</td>
                    {['he', 'she', 'they'].map((k) => (
                      <td key={k}>
                        <span
                          className={k === 'she' ? 'bar-fill' : 'bar-fill alt'}
                          style={{ display: 'inline-block', height: 12, verticalAlign: 'middle', width: `${Math.round(p[k] * 60)}px`, marginRight: 6 }}
                          aria-hidden="true"
                        />
                        {Math.round(p[k] * 100)}%
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </OutputPanel>
      )}
    </div>
  )
}

export default {
  id: 'w9',
  label: 'W9',
  section: 'C. Bias from training data',
  title: 'Fill in the Pronoun',
  priority: 'P0',
  instruction: 'Run ten occupation stems and see which pronoun the model expects for each.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Which occupation had the strongest tilt toward "she"?',
      options: OCCUPATIONS.map((o) => ({ key: o, label: o })),
      correct: (d) => d.sheTilt || null,
      explain: (d) =>
        d.sheTilt
          ? `In your run, "${d.sheTilt}" had the highest probability for "she". Different students may get different charts; that variation is expected at this temperature.`
          : 'Run the widget first, then read the strongest "she" bar off your chart.',
      slide: SLIDES.trainingBias,
    },
    {
      id: 'q2',
      text: 'Where did that tilt come from?',
      options: [
        { key: 'a', label: 'The model’s opinion' },
        { key: 'b', label: 'Word co-occurrence in decades of published text' },
        { key: 'c', label: 'The instructor set it' },
        { key: 'd', label: 'Grammar rules' },
      ],
      correct: 'b',
      explain:
        'The model has no view about nurses or mechanics. It counts: in its training text, "nurse" co-occurs with "she" far more often than with "he", so the probability follows. Word association is bias in its rawest measurable form.',
      slide: SLIDES.trainingBias,
    },
  ],
}
