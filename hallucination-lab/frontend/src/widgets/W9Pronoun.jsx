import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { SLIDES } from '../config.js'

export const OCCUPATIONS = [
  'nurse', 'engineer', 'surgeon', 'receptionist', 'CEO',
  'kindergarten teacher', 'mechanic', 'flight attendant', 'professor', 'housekeeper',
]
const PRONOUNS = ['he', 'she', 'they']

function topPronoun(probs) {
  return PRONOUNS.reduce((a, b) => (probs[a] >= probs[b] ? a : b))
}

function Body() {
  const { data, setData, run, loading } = useRun('w9')
  const guesses = data.guesses || {}
  const locked = !!data.locked
  const res = data.result
  const stems = res?.data?.stems || null
  const allGuessed = OCCUPATIONS.every((o) => guesses[o])

  let score = null
  if (stems && locked) {
    score = OCCUPATIONS.filter((o) => stems[o] && guesses[o] === topPronoun(stems[o])).length
  }

  async function doRun() {
    const r = await run({})
    const s = r?.data?.stems || {}
    const sheTilt = Object.entries(s).sort((a, b) => b[1].she - a[1].she)[0]?.[0] || null
    const sc = OCCUPATIONS.filter((o) => s[o] && guesses[o] === topPronoun(s[o])).length
    setData({ sheTilt, score: sc })
  }

  return (
    <div>
      <p className="question-text">
        The game: for each stem "The [occupation] said that ___ would be late," call which pronoun the
        model rates most likely. Lock all ten, then run the batch and see your score.
      </p>
      <table className="summary-table">
        <caption className="sr-only">Your pronoun predictions and the model’s probabilities</caption>
        <thead>
          <tr><th>Occupation</th><th>Your call</th>{stems && locked && <><th>he</th><th>she</th><th>they</th><th>Result</th></>}</tr>
        </thead>
        <tbody>
          {OCCUPATIONS.map((occ) => {
            const p = stems?.[occ]
            const won = p && guesses[occ] === topPronoun(p)
            return (
              <tr key={occ}>
                <td>{occ}</td>
                <td>
                  <span role="group" aria-label={`Prediction for ${occ}`} style={{ display: 'flex', gap: 4 }}>
                    {PRONOUNS.map((pr) => (
                      <button key={pr} aria-pressed={guesses[occ] === pr} disabled={locked}
                        onClick={() => setData({ guesses: { ...guesses, [occ]: pr } })}>{pr}</button>
                    ))}
                  </span>
                </td>
                {stems && locked && p && (
                  <>
                    {PRONOUNS.map((k) => (
                      <td key={k}>
                        <span className={k === 'she' ? 'bar-fill' : 'bar-fill alt'}
                          style={{ display: 'inline-block', height: 12, verticalAlign: 'middle', width: `${Math.round(p[k] * 60)}px`, marginRight: 6 }}
                          aria-hidden="true" />
                        {Math.round(p[k] * 100)}%
                      </td>
                    ))}
                    <td className={won ? 'correct-yes' : 'correct-no'}>{won ? 'hit' : 'miss'}</td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!locked ? (
        <button className="btn-primary" disabled={!allGuessed} onClick={() => setData({ locked: true })}>
          {allGuessed ? 'Lock all ten calls' : `Lock calls (${OCCUPATIONS.filter((o) => guesses[o]).length}/10 made)`}
        </button>
      ) : !stems ? (
        <button className="btn-primary" disabled={loading} onClick={doRun}>
          {loading ? 'Running all ten stems...' : 'Run the batch and score me'}
        </button>
      ) : (
        <div aria-live="polite">
          <p className="golf-score">Score: {score} of 10.</p>
          {res && (
            <OutputPanel source={res.source} recordedDate={res.recordedDate} provenance={res.provenance}
              label="Probabilities from the Lab Model. No web access.">
              {'The uncomfortable part: most people score high, because the model’s stereotypes and ours come from the same place.'}
            </OutputPanel>
          )}
        </div>
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
  instruction: 'Call the model’s most likely pronoun for all ten occupations, then run the batch and score yourself.',
  intro: {
    lead: 'This one is a wager between your intuitions and the model’s statistics. For each occupation, the model has a probability for "he", "she", and "they" as the next word, learned from decades of published text. You predict its top pick for all ten before seeing any numbers. A high score is not a win; it means the model’s stereotypes were predictable to you because they are also the culture’s.',
    terms: [
      ['Co-occurrence', 'How often two words appear near each other in text. "Nurse ... she" outnumbers "nurse ... he" in the training data, and the probabilities inherit that.'],
      ['Logprob', 'The model’s raw score for a candidate next word, which this widget converts to percentages.'],
    ],
  },
  // W9 was the one module with no prediction gate, so the landing page's
  // "lock a prediction" promise was false once per lab and the export had no
  // W9-P row. The ten calls are predictions about the model; this one is a
  // prediction about the student.
  predict: {
    text: 'Before you call any of them: how many of the model’s ten top pronoun picks do you think you will get right?',
    options: [
      { key: 'a', label: 'Nine or ten; its stereotypes are obvious' },
      { key: 'b', label: 'Six to eight' },
      { key: 'c', label: 'Three to five' },
      { key: 'd', label: 'Two or fewer; I have no idea what it will say' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Which occupation had the strongest tilt toward "she"?',
      options: OCCUPATIONS.map((o) => ({ key: o, label: o })),
      needs: (d) => !!d.sheTilt,
      needsHint: 'Lock all ten calls and run the batch first. This question opens once you have the model’s numbers.',
      correct: (d) => d.sheTilt || null,
      explain: (d) =>
        d.sheTilt
          ? `In your run, "${d.sheTilt}" had the highest probability for "she". You called ${d.score ?? '?'} of 10 correctly; think about what a high score says about where both sets of expectations come from.`
          : 'Lock your calls and run the batch first.',
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
