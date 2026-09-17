import React, { useEffect, useRef, useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { TTL_SETS, TTL_SECONDS } from '../data/ttl.js'
import { SLIDES } from '../config.js'

// Two Truths and a Lie: timed rounds against curated statement sets.
// Score and best streak feed the widget's questions and the export.

function Body() {
  const { runData, setWidgetData } = useLab()
  const round = runData.ttl?.round ?? 0
  const results = runData.ttl?.results || [] // per round: 'hit' | 'miss' | 'timeout'
  const [picked, setPicked] = useState(null) // statement index answered this round
  const [timeLeft, setTimeLeft] = useState(TTL_SECONDS)
  const timerRef = useRef(null)
  const done = round >= TTL_SETS.length
  const set = TTL_SETS[round]

  useEffect(() => {
    setPicked(null)
    setTimeLeft(TTL_SECONDS)
    if (done) return
    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [round, done])

  useEffect(() => {
    if (timeLeft <= 0 && picked == null && !done) {
      clearInterval(timerRef.current)
      setPicked(-1)
      setWidgetData('ttl', { results: [...results, 'timeout'] })
    }
  }, [timeLeft])

  function pick(i) {
    if (picked != null) return
    clearInterval(timerRef.current)
    setPicked(i)
    const hit = set.statements[i].lie
    setWidgetData('ttl', {
      results: [...results, hit ? 'hit' : 'miss'],
    })
  }

  function next() {
    const hits = [...results].filter((r) => r === 'hit').length
    let best = 0, cur = 0
    for (const r of results) {
      cur = r === 'hit' ? cur + 1 : 0
      best = Math.max(best, cur)
    }
    setWidgetData('ttl', { round: round + 1, score: hits, streak: best })
  }

  if (done) {
    const hits = results.filter((r) => r === 'hit').length
    return (
      <div className="card">
        <p className="golf-score">Final: {hits} of {TTL_SETS.length} lies caught.{' '}
          <span className="streak-chip">best streak {runData.ttl?.streak ?? 0}</span></p>
        <p>Now do the part the timer would not let you do: verify. Each round’s source is below; open at least two.</p>
        <ul>
          {TTL_SETS.map((s) => (
            <li key={s.id}>
              {s.topic}: the lie was "{s.statements.find((x) => x.lie).text}" ({s.statements.find((x) => x.lie).why}){' '}
              <a href={s.source.url} target="_blank" rel="noreferrer">{s.source.label}</a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <p className="golf-score">
        Round {round + 1} of {TTL_SETS.length}: {set.topic}{' '}
        <span className="streak-chip">{results.filter((r) => r === 'hit').length} caught</span>
      </p>
      <div className="timer-track" role="timer" aria-label={`${Math.max(0, timeLeft)} seconds left`}>
        <div className="timer-fill" style={{ width: `${Math.max(0, (timeLeft / TTL_SECONDS) * 100)}%` }} />
      </div>
      <p className="muted">{Math.max(0, timeLeft)} seconds. Two of these are true. Click the lie.</p>
      {set.statements.map((s, i) => {
        // Colour marks what the statement IS, not which one the student went
        // for: every row is labelled once the round closes, so red never lands
        // on a true sentence and green never lands on the lie. The student's
        // own pick is called out separately, in words.
        const state = picked == null ? null : s.lie ? 'lie' : 'truth'
        const mine = picked === i
        return (
          <button key={i} className="ttl-statement option" data-state={state}
            style={mine && picked >= 0 ? { outline: '3px solid var(--barry-red)' } : undefined}
            disabled={picked != null} onClick={() => pick(i)}>
            {s.text}
            {picked != null && (
              s.lie
                ? <strong> &larr; FALSE. {s.why}{mine ? ' You caught it.' : ''}</strong>
                : <strong> &mdash; true.{mine ? ' You picked this one, so the lie got past you.' : ''}</strong>
            )}
          </button>
        )
      })}
      {picked != null && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span aria-live="polite">
            {picked === -1 ? 'Time. The lie is marked above.' : set.statements[picked]?.lie ? 'Caught it.' : 'That one was true.'}
          </span>
          <a href={set.source.url} target="_blank" rel="noreferrer">Verify this round: {set.source.label}</a>
          <button className="btn-primary" onClick={next}>
            {round + 1 === TTL_SETS.length ? 'Finish' : 'Next round'}
          </button>
        </div>
      )}
    </div>
  )
}

const scoreBucket = (s) => (s == null ? null : s <= 2 ? '0to2' : s <= 4 ? '3to4' : '5to6')

export default {
  id: 'ttl',
  label: 'TTL',
  section: 'B. Hallucination',
  title: 'Two Truths and a Lie',
  priority: 'P0',
  instruction: 'Six timed rounds: two statements are true, one is false, twenty seconds to catch the lie.',
  intro: {
    lead: 'Everything so far had the fabrications labeled for you eventually. Real life will not. This game runs at reading speed: each round shows three confident statements, one false, and gives you twenty seconds, which is roughly the attention a claim gets inside an AI answer you are skimming. The point of the timer is to make you feel the gap between "sounds right" and "checked."',
    terms: [
      ['Plausibility', 'How true something feels based on what you already believe. It is the only signal you have under time pressure, and it is exactly the signal fabricated text is optimized to satisfy.'],
    ],
  },
  predict: {
    text: 'Out of six lies, how many do you expect to catch at twenty seconds a round?',
    options: [
      { key: 'a', label: 'All six' },
      { key: 'b', label: 'Four or five' },
      { key: 'c', label: 'Two or three' },
      { key: 'd', label: 'One at best' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Your final score:',
      options: [
        { key: '0to2', label: '0 to 2 lies caught' },
        { key: '3to4', label: '3 to 4' },
        { key: '5to6', label: '5 to 6' },
      ],
      correct: (d) => (d.round >= TTL_SETS.length ? scoreBucket(d.score ?? 0) : null),
      explain: (d) =>
        `You caught ${d.score ?? 0} of 6 against your prediction. Whatever the score, notice which rounds you got right for the wrong reason: a guess that happens to land is not verification.`,
      slide: SLIDES.verification,
    },
    {
      id: 'q2',
      text: 'What actually separated the lies from the truths in these rounds?',
      options: [
        { key: 'a', label: 'The lies sounded less confident' },
        { key: 'b', label: 'The lies had grammar mistakes' },
        { key: 'c', label: 'Nothing on the surface; only checking a source separates them' },
        { key: 'd', label: 'The lies were always the longest statement' },
      ],
      correct: 'c',
      explain:
        'Each lie was written in the same register as its two truths, the way model output presents invented and real claims identically. Surface reading cannot separate them reliably at speed; the source link at the end of each round can.',
      slide: SLIDES.verification,
    },
  ],
}
