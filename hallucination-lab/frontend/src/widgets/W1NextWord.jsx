import React, { useState } from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import Bars from '../components/Bars.jsx'
import { useRun } from '../lib/useRun.js'
import { SLIDES } from '../config.js'

const STEMS = [
  'The capital of Florida is',
  'The nurse walked into the room and',
  'In 1969, humans first landed on',
  'Barry University is located in',
  'The most important skill for college students is',
]

function Body() {
  const { data, run, loading } = useRun('w1')
  const [stem, setStem] = useState(STEMS[0])
  const [temp, setTemp] = useState(0.2)
  const res = data.result

  // Live responses carry { candidates: [[token, prob], ...] }. Recorded
  // responses carry per-stem tables keyed by temperature band.
  let rows = null
  if (res?.data) {
    if (res.source === 'live' && res.data.candidates) {
      rows = res.data.candidates
    } else if (res.data.stems) {
      const band = temp < 0.5 ? 'low' : temp <= 1.0 ? 'mid' : 'high'
      rows = res.data.stems[stem]?.[band] || null
    }
  }

  return (
    <div>
      <p className="muted">
        Experiment: run a stem at low temperature, note the top word's share, then drag the
        temperature up and run the same stem again. Try at least two stems.
      </p>
      <label className="field-label" htmlFor="w1-stem">Sentence stem</label>
      <select
        id="w1-stem"
        value={stem}
        onChange={(e) => setStem(e.target.value)}
        style={{ font: 'inherit', padding: 8, maxWidth: '100%' }}
      >
        {STEMS.map((s) => <option key={s} value={s}>{s} ...</option>)}
      </select>
      <div className="slider-row">
        <label htmlFor="w1-temp">Temperature</label>
        <input
          id="w1-temp" type="range" min="0" max="1.5" step="0.1" value={temp}
          onChange={(e) => setTemp(parseFloat(e.target.value))}
        />
        <output htmlFor="w1-temp">{temp.toFixed(1)}</output>
        <button className="btn-primary" disabled={loading} onClick={() => run({ stem, temperature: temp })}>
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>
      {rows && (
        <OutputPanel source={res.source} recordedDate={res.recordedDate} provenance={res.provenance}>
          <Bars
            title={`Top five next-word candidates after "${stem}" at temperature ${temp.toFixed(1)}`}
            rows={rows.map(([tok, p]) => ({ label: `"${tok}"`, value: p, display: `${Math.round(p * 100)}%` }))}
            max={1}
          />
        </OutputPanel>
      )}
    </div>
  )
}

export default {
  id: 'w1',
  label: 'W1',
  section: 'A. How the model produces text',
  title: 'Next Word Machine',
  priority: 'P1',
  instruction: 'Run a sentence stem, then raise the temperature and run it again.',
  intro: {
    lead: 'This is the whole machine, stripped bare. A language model does exactly one thing: given the words so far, it scores every possible next word by how often that word followed similar text in its training data, then picks one. Everything else in this lab, the fake court cases, the invented quotes, the biased lists, comes from this single mechanism running over and over.',
    terms: [
      ['Token', 'The unit the model actually predicts: usually a word or a piece of one. "Tallahassee" may be several tokens.'],
      ['Probability', 'The model’s score for each candidate next word. The bars you are about to see are these scores.'],
      ['Temperature', 'A dial from 0 upward that controls how adventurous the pick is. Low temperature: almost always take the top-scoring word. High temperature: give weaker candidates a real chance. It is a randomness dial, not a quality dial.'],
    ],
  },
  predict: {
    text: 'When you raise the temperature, what happens to the top word’s share of the probability?',
    options: [
      { key: 'a', label: 'It grows; the model gets more confident' },
      { key: 'b', label: 'It shrinks; weaker candidates gain ground' },
      { key: 'c', label: 'Nothing changes; temperature only affects speed' },
      { key: 'd', label: 'The model starts refusing to answer' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'What is the model looking at when it picks the next word?',
      options: [
        { key: 'a', label: 'A database of facts it checked' },
        { key: 'b', label: 'Which word statistically follows the previous words' },
        { key: 'c', label: 'The internet' },
        { key: 'd', label: 'A human reviewer' },
      ],
      correct: 'b',
      explain:
        'The bars you saw are probabilities over next words, computed from patterns in training text. Nothing in that step consults a fact source; the model ranks continuations, then samples one.',
      slide: SLIDES.nextWord,
    },
    {
      id: 'q2',
      text: 'Raising temperature made the output:',
      options: [
        { key: 'a', label: 'More accurate' },
        { key: 'b', label: 'More varied and less predictable' },
        { key: 'c', label: 'Longer' },
        { key: 'd', label: 'Cite more sources' },
      ],
      correct: 'b',
      explain:
        'Higher temperature flattens the probability distribution, so lower-ranked words get picked more often. Careful: a high-probability word is the one that most often FOLLOWED this text in training, which is not the same as the one that is true. Turning temperature down makes the model more repeatable, not more accurate. Check your locked prediction against what the bars actually did.',
      slide: SLIDES.temperature,
    },
  ],
}
