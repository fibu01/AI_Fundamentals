import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { useLab } from '../lib/store.jsx'
import { runWidget } from '../lib/api.js'
import { classifyChallengeReply } from '../lib/utils.js'
import { SLIDES } from '../config.js'

const MAX_CHALLENGES = 3

function Body() {
  const { runData, setWidgetData } = useLab()
  const w3res = runData.w3?.result
  const baseText = w3res?.data?.text || ''
  const turns = runData.w4?.turns || []
  const [loading, setLoading] = React.useState(false)

  async function challenge() {
    setLoading(true)
    try {
      const res = await runWidget('w4', {
        transcript: baseText,
        prior_challenges: turns.map((t) => t.text),
      })
      let text = ''
      if (res.source === 'live') {
        text = res.data.text || ''
      } else {
        // Recorded runs carry a fixed sequence of replies.
        const seq = res.data.turns || []
        text = seq[Math.min(turns.length, seq.length - 1)] || ''
      }
      setWidgetData('w4', {
        turns: [...turns, { text, source: res.source, recordedDate: res.recordedDate }],
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = turns.map((t) => classifyChallengeReply(t.text))
  const apologies = stats.filter((s) => s.apologized).length
  const reassertions = stats.filter((s) => s.reasserted).length

  if (!baseText) {
    return (
      <p className="error-note">
        Run W3 first: this widget challenges the citations the model just gave you. Use Back to return to W3.
      </p>
    )
  }

  return (
    <div>
      <OutputPanel source={w3res.source} recordedDate={w3res.recordedDate} label="From W3: the citations under challenge">
        {baseText}
      </OutputPanel>
      {turns.map((t, i) => (
        <div key={i}>
          <p><strong>You:</strong> Are you sure this citation is real?</p>
          <OutputPanel source={t.source} recordedDate={t.recordedDate}>{t.text}</OutputPanel>
        </div>
      ))}
      <button className="btn-primary" disabled={loading || turns.length >= MAX_CHALLENGES} onClick={challenge}>
        {loading ? 'Asking...' : `Ask: Are you sure this citation is real? (${turns.length}/${MAX_CHALLENGES})`}
      </button>
      {turns.length > 0 && (
        <p className="muted" aria-live="polite">
          Counter (keyword heuristic, read the replies yourself): apologized in {apologies} of {turns.length} replies;
          re-asserted or changed the citation in {reassertions} of {turns.length}.
        </p>
      )}
    </div>
  )
}

export default {
  id: 'w4',
  label: 'W4',
  section: 'B. Hallucination',
  title: 'Are You Sure?',
  priority: 'P0',
  instruction: 'Challenge the model on the citations from W3 up to three times and watch what it does.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'What did the model do when challenged?',
      options: [
        { key: 'a', label: 'Verified the case against a database' },
        { key: 'b', label: 'Apologized and either restated the same case or produced a new one, without checking anything' },
        { key: 'c', label: 'Refused to continue' },
        { key: 'd', label: 'Said "I do not know" on the first challenge' },
      ],
      correct: 'b',
      explain:
        'The model has nothing to check against, so "are you sure" just produces more text shaped like a reply to a challenge: an apology, a correction, or a firmer restatement. None of those turns involved looking anything up.',
      slide: SLIDES.areYouSure,
    },
    {
      id: 'q2',
      text: 'Which action verifies a citation?',
      options: [
        { key: 'a', label: 'Asking the model twice' },
        { key: 'b', label: 'Asking a different model' },
        { key: 'c', label: 'Opening the primary source yourself' },
        { key: 'd', label: 'Asking for a confidence score' },
      ],
      correct: 'c',
      explain:
        'Verification means comparing the claim against the primary source: the docket, the reporter, the statute. Asking any model again, including a different one, only produces more generated text.',
      slide: SLIDES.verification,
    },
  ],
}
