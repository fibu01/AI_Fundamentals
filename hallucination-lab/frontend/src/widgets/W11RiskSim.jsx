import React, { useState } from 'react'
import Bars from '../components/Bars.jsx'
import { SLIDES } from '../config.js'

// Pure JavaScript simulator, no model call (PRD W11).
// Both neighborhoods share one locked true offense rate. Arrests depend on
// offense rate times patrol intensity. A toy risk score "trains" on arrest
// rates and flags residents above a learned cutoff, so raising patrol in one
// neighborhood raises its false-positive rate while true offending is equal.

const POP = 1000
const OFFENSE_RATE = 0.10 // locked equal for both neighborhoods
const CAPTURE_PER_PATROL = 0.3
const SIGMA = 0.015

function phi(z) {
  // Abramowitz-Stegun approximation of the standard normal CDF.
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

function simulate(patrolA, patrolB) {
  const rateA = OFFENSE_RATE * Math.min(1, CAPTURE_PER_PATROL * patrolA)
  const rateB = OFFENSE_RATE * Math.min(1, CAPTURE_PER_PATROL * patrolB)
  const threshold = ((rateA + rateB) / 2) * 1.25 // toy "trained" cutoff: flags above-average arrest areas
  const fpr = (rate) => 1 - phi((threshold - rate) / SIGMA)
  return {
    arrestsA: Math.round(POP * rateA),
    arrestsB: Math.round(POP * rateB),
    fprA: fpr(rateA),
    fprB: fpr(rateB),
  }
}

function Body() {
  const [patrolA, setPatrolA] = useState(1)
  const [patrolB, setPatrolB] = useState(1)
  const s = simulate(patrolA, patrolB)
  const pct = (x) => `${Math.round(x * 100)}%`

  return (
    <div>
      <p className="muted">
        True offense rate: locked at {Math.round(OFFENSE_RATE * 100)}% in both neighborhoods. Population: {POP} each.
        The simulator generates arrests, trains a toy risk score on those arrests, then scores every resident.
      </p>
      <div className="slider-row">
        <label htmlFor="w11-a">Patrol intensity, Neighborhood A</label>
        <input id="w11-a" type="range" min="0.5" max="3" step="0.25" value={patrolA} onChange={(e) => setPatrolA(parseFloat(e.target.value))} />
        <output htmlFor="w11-a">{patrolA.toFixed(2)}x</output>
      </div>
      <div className="slider-row">
        <label htmlFor="w11-b">Patrol intensity, Neighborhood B</label>
        <input id="w11-b" type="range" min="0.5" max="3" step="0.25" value={patrolB} onChange={(e) => setPatrolB(parseFloat(e.target.value))} />
        <output htmlFor="w11-b">{patrolB.toFixed(2)}x</output>
      </div>
      <Bars
        title="Arrest records generated (this is the training data)"
        rows={[
          { label: 'Neighborhood A arrests', value: s.arrestsA },
          { label: 'Neighborhood B arrests', value: s.arrestsB, alt: true },
        ]}
      />
      <Bars
        title="False-positive rate: residents who never offended but got flagged as high risk"
        max={1}
        rows={[
          { label: 'Neighborhood A', value: s.fprA, display: pct(s.fprA) },
          { label: 'Neighborhood B', value: s.fprB, display: pct(s.fprB), alt: true },
        ]}
      />
      <p aria-live="polite">
        With identical true offense rates, false positives sit at {pct(s.fprA)} in A and {pct(s.fprB)} in B.
        Move one patrol slider and watch the false positives move with it.
      </p>
      {Math.abs(patrolA - patrolB) > 0.01 && (
        <p className="muted">
          Notice the neighborhood you did <em>not</em> touch moved too, in the opposite direction. The
          score ranks every resident against one shared threshold, so piling arrest records into one
          neighborhood pushes the other one below the line. Neither number is measuring crime. Both are
          measuring where the patrols went.
        </p>
      )}
    </div>
  )
}

export default {
  id: 'w11',
  label: 'W11',
  section: 'C. Bias from training data',
  title: 'Risk Score Simulator',
  priority: 'P1',
  instruction: 'Change patrol intensity and watch what the risk score learns, while true offense rates stay equal.',
  intro: {
    lead: 'No language model here at all: this simulator exists to show that bias does not need one. Two neighborhoods offend at exactly the same locked rate. You control only how heavily each is patrolled. A toy risk score then "trains" on the arrest records your sliders generate. Move the sliders and watch who gets falsely flagged. This is the feedback-loop mechanism from lecture, running live under your hands.',
    terms: [
      ['Training data', 'Here, arrest records. The score never sees offenses, only arrests, and arrests measure patrols as much as crime.'],
      ['False positive', 'A resident who never offended but gets flagged high-risk anyway.'],
      ['Feedback loop', 'Flagged areas get more patrols, which generate more arrests, which raise the flag further. The model’s output becomes its own future training data.'],
    ],
  },
  predict: {
    text: 'Both neighborhoods offend at the same rate. If you double patrols in B only, B’s false-positive rate will:',
    options: [
      { key: 'a', label: 'Stay the same; offense rates are equal' },
      { key: 'b', label: 'Go up; the score learns patrol patterns' },
      { key: 'c', label: 'Go down; more data means more accuracy' },
      { key: 'd', label: 'Drop to zero' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'When patrol intensity in Neighborhood B doubled, its false-positive rate:',
      options: [
        { key: 'a', label: 'Stayed the same' },
        { key: 'b', label: 'Went up' },
        { key: 'c', label: 'Went down' },
        { key: 'd', label: 'Became zero' },
      ],
      correct: 'b',
      explain:
        'More patrol produced more arrest records in B, so the score learned that B residents look riskier, and flagged more people who never offended. The true offense rate never moved; only the measurement did.',
      slide: SLIDES.feedbackLoops,
    },
    {
      id: 'q2',
      text: 'What did the algorithm actually learn?',
      options: [
        { key: 'a', label: 'Who commits crimes' },
        { key: 'b', label: 'Where police made arrests' },
        { key: 'c', label: 'Nothing' },
        { key: 'd', label: 'Court outcomes' },
      ],
      correct: 'b',
      explain:
        'Arrests are a record of enforcement activity, not of offending. A model trained on arrests learns patrol patterns, and its predictions can then justify sending more patrols to the same place, closing the loop.',
      slide: SLIDES.feedbackLoops,
    },
  ],
}
