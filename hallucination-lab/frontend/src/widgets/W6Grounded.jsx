import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { SLIDES } from '../config.js'

function Body() {
  const { data, run, loading } = useRun('w6')
  const res = data.result
  const runA = res?.data?.runA || ''
  const runB = res?.data?.runB || ''

  return (
    <div>
      <button className="btn-primary" disabled={loading} onClick={() => run({})}>
        {loading ? 'Running both...' : 'Run both versions of the 692.203 question'}
      </button>
      {res && (
        <div className="compare" style={{ marginTop: 12 }}>
          <div className="pane">
            <h3>Run A: bare question</h3>
            <OutputPanel source={res.source} recordedDate={res.recordedDate}>{runA}</OutputPanel>
          </div>
          <div className="pane">
            <h3>Run B: statute text pasted into the prompt, with the fallback clause</h3>
            <p className="muted">
              Added to the prompt: "If the exact answer is not in the source text, state Information not found. Do not extrapolate."
            </p>
            <OutputPanel source={res.source} recordedDate={res.recordedDate}>{runB}</OutputPanel>
          </div>
        </div>
      )}
    </div>
  )
}

export default {
  id: 'w6',
  label: 'W6',
  section: 'B. Hallucination',
  title: 'Grounded vs Ungrounded',
  priority: 'P0',
  instruction: 'Compare the same question asked bare and asked with the statute text supplied in the prompt.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Which run stayed inside the source text?',
      options: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
        { key: 'both', label: 'Both' },
        { key: 'neither', label: 'Neither' },
      ],
      correct: 'b',
      explain:
        'Run B had the statute in front of it and permission to say "Information not found," so its numbers trace back to the supplied text. Run A had nothing to trace back to and filled the gaps with plausible values.',
      slide: SLIDES.grounding,
    },
    {
      id: 'q2',
      text: 'What changed between A and B?',
      options: [
        { key: 'a', label: 'The model' },
        { key: 'b', label: 'The temperature' },
        { key: 'c', label: 'The prompt supplied the source and forbade outside facts' },
        { key: 'd', label: 'The question' },
      ],
      correct: 'c',
      explain:
        'Same model, same settings, same question. The only difference is grounding: the prompt carried the source text and an instruction to stay inside it. That is the same trick Copilot and Gemini use when they search the web before answering.',
      slide: SLIDES.grounding,
    },
  ],
}
