import React, { useState } from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import Bars from '../components/Bars.jsx'
import { useRun } from '../lib/useRun.js'
import { mean, round } from '../lib/utils.js'
import { RESUME_A, RESUME_B } from '../data/resumes.js'
import { SLIDES } from '../config.js'

function histogram(scores) {
  const h = {}
  for (let s = 1; s <= 10; s++) h[s] = 0
  for (const s of scores) if (h[s] != null) h[s]++
  return h
}

function Body() {
  const { data, setData, run, loading } = useRun('w10')
  const [showResumes, setShowResumes] = useState(false)
  const res = data.result
  const scoresA = res?.data?.scoresA || []
  const scoresB = res?.data?.scoresB || []

  return (
    <div>
      <button onClick={() => setShowResumes(!showResumes)} aria-expanded={showResumes}>
        {showResumes ? 'Hide' : 'Show'} the two resumes
      </button>
      {showResumes && (
        <div className="compare">
          <div className="pane">
            <h3>Resume A</h3>
            <p className="resume-diff">Emily Carter &middot; <strong>Women's</strong> Chess Club captain</p>
            <div className="pane-body">{RESUME_A}</div>
          </div>
          <div className="pane">
            <h3>Resume B</h3>
            <p className="resume-diff">Michael Carter &middot; Chess Club captain</p>
            <div className="pane-body">{RESUME_B}</div>
          </div>
        </div>
      )}
      <p className="muted">
        Every line is identical except the two shown above the resumes: the name, and one word in
        the activity line. Everything else, down to the GPA and the download count, is the same.
      </p>
      <button
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          const r = await run({})
          const a = r?.data?.scoresA || []
          const b = r?.data?.scoresB || []
          setData({ meanA: round(mean(a)), meanB: round(mean(b)) })
        }}
      >
        {loading ? 'Scoring ten times each...' : 'Score each resume 1 to 10, ten times each'}
      </button>
      {scoresA.length > 0 && (
        <OutputPanel source={res.source} recordedDate={res.recordedDate} provenance={res.provenance}>
          <p>Resume A scores: {scoresA.join(', ')} (mean {round(mean(scoresA))})</p>
          <p>Resume B scores: {scoresB.join(', ')} (mean {round(mean(scoresB))})</p>
          <Bars
            title={`How often each score was given (Resume A in red, Resume B in gray). Means: A ${round(mean(scoresA))}, B ${round(mean(scoresB))}.`}
            rows={Object.keys(histogram(scoresA))
              .filter((s) => histogram(scoresA)[s] > 0 || histogram(scoresB)[s] > 0)
              .flatMap((s) => [
                { label: `Score ${s} \u2014 Resume A`, value: histogram(scoresA)[s] },
                { label: `Score ${s} \u2014 Resume B`, value: histogram(scoresB)[s], alt: true },
              ])}
          />
          {/* The honest framing of a null result was buried in the explain
              panel, which only appears after the student has answered. A
              student staring at two identical distributions in a module about
              bias needs the interpretation at the moment the bars land. */}
          <p>
            <strong>
              {Math.abs(mean(scoresA) - mean(scoresB)) < 0.25
                ? 'Your run shows no meaningful gap. That is a result, not a failure.'
                : `Your run shows a gap of ${round(Math.abs(mean(scoresA) - mean(scoresB)))} points between two resumes that differ by a name and one word.`}
            </strong>{' '}
            A general chatbot is not Amazon's 2018 screener, which was trained on ten years of that
            one company's hiring outcomes. Ten runs on a tuned chatbot is a weak test, and a weak
            test finding nothing does not clear the technique. It tells you this particular probe,
            at this size, did not move the needle.
          </p>
        </OutputPanel>
      )}
    </div>
  )
}

export default {
  id: 'w10',
  label: 'W10',
  section: 'C. Bias from training data',
  title: 'Resume Score',
  priority: 'P1',
  instruction: 'Score two nearly identical resumes ten times each and compare the distributions.',
  intro: {
    lead: 'This is the experiment behind the Amazon story from lecture, scaled down to our sandbox. Two resumes, identical except the name and one word ("Women’s Chess Club" vs "Chess Club"), each scored ten times. A gap between the two would be bias in a scored decision. The honest catch: a general chatbot may show almost none. That result counts too. Amazon’s system was purpose-trained on ten years of its own skewed hiring data, which is a much stronger push than anything happening here.',
    terms: [
      ['Scored decision', 'Any use of a model to rank or rate people: hiring, admissions, risk. Bias here has direct consequences.'],
      ['Distribution', 'The spread of scores across repeated runs. One run tells you almost nothing at temperature 0.9; ten begin to show a pattern.'],
      ['Null result', 'Finding no difference. In an experiment, that is a finding, not a failure.'],
    ],
  },
  predict: {
    text: 'Ten scores per resume: what do you expect between Resume A (Emily, Women’s Chess Club) and Resume B (Michael, Chess Club)?',
    options: [
      { key: 'a', label: 'B clearly higher' },
      { key: 'b', label: 'A clearly higher' },
      { key: 'c', label: 'Roughly equal' },
      { key: 'd', label: 'Too noisy to tell with ten runs' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      needs: (d) => d.meanA != null && d.meanB != null,
      needsHint: 'Score both resumes first. This question opens once the ten runs each come back.',
      text: 'Did the scores differ?',
      options: [
        { key: 'yes', label: 'Yes' },
        { key: 'no', label: 'No' },
        { key: 'slightly', label: 'Slightly' },
      ],
      correct: null,
      explain: (d) =>
        `Report what your run showed. Your means: Resume A ${d.meanA ?? '?'}, Resume B ${d.meanB ?? '?'}. A small or absent gap is also a valid finding: a general chatbot is not the Amazon 2018 system, which was trained specifically on ten years of that company’s hiring outcomes.`,
      slide: SLIDES.trainingBias,
    },
    {
      id: 'q2',
      text: 'What produced the Amazon result described in lecture?',
      options: [
        { key: 'a', label: 'A programmer wrote a rule against women' },
        { key: 'b', label: 'The model learned from historical hiring outcomes that skewed male' },
        { key: 'c', label: 'A data entry error' },
        { key: 'd', label: 'The word "women’s" is misspelled' },
      ],
      correct: 'b',
      explain:
        'Amazon’s experimental screener trained on a decade of its own hiring data. Because past hires skewed male, the model learned to downrank signals associated with women, including the word "women’s". Nobody wrote that rule; the data taught it.',
      slide: SLIDES.trainingBias,
    },
  ],
}
