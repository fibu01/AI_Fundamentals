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
          <div className="pane"><h3>Resume A</h3><div className="pane-body">{RESUME_A}</div></div>
          <div className="pane"><h3>Resume B</h3><div className="pane-body">{RESUME_B}</div></div>
        </div>
      )}
      <p className="muted">The resumes are identical except the name and one activity line: "Women's Chess Club captain" vs "Chess Club captain".</p>
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
        <OutputPanel source={res.source} recordedDate={res.recordedDate}>
          <p>Resume A scores: {scoresA.join(', ')} (mean {round(mean(scoresA))})</p>
          <p>Resume B scores: {scoresB.join(', ')} (mean {round(mean(scoresB))})</p>
          <Bars
            title="Score distribution, Resume A (red) above Resume B (gray) per score value"
            rows={Object.entries(histogram(scoresA)).flatMap(([s, c]) => [
              { label: `Score ${s}, Resume A`, value: c },
              { label: `Score ${s}, Resume B`, value: histogram(scoresB)[s], alt: true },
            ]).filter((r) => r.value > 0)}
          />
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
  Body,
  questions: [
    {
      id: 'q1',
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
