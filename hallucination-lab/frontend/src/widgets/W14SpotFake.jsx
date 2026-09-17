import React, { useEffect, useRef, useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { W14_PAIRS, W14_SECONDS, W14_EXT } from '../data/manifests.js'
import { SLIDES } from '../config.js'

// Head-to-head: each round shows a real photo and an AI image of the same
// kind of subject, sides shuffled. Pick the REAL one before the timer runs
// out. Streak and score feed the questions and the export.

const SIDES = W14_PAIRS.map(() => (Math.random() < 0.5 ? 'left' : 'right')) // real side per round, per session

const EXTS = [W14_EXT, 'jpg', 'svg', 'png', 'jpeg', 'webp'].filter((e, i, a) => a.indexOf(e) === i)

// `src` is a base path with no extension: instructor photos land as PNG/JPG
// over the semester while placeholders stay SVG, so resolve by trying each.
function ZoomImage({ src, alt, onPick, disabled, state }) {
  const wrapRef = useRef(null)
  const lensRef = useRef(null)
  const [extIdx, setExtIdx] = useState(0)
  const resolved = `${src}.${EXTS[Math.min(extIdx, EXTS.length - 1)]}`
  function onMove(e) {
    const wrap = wrapRef.current
    const lens = lensRef.current
    if (!wrap || !lens) return
    const rect = wrap.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    lens.style.display = 'block'
    lens.style.left = `${x - 70}px`
    lens.style.top = `${y - 70}px`
    lens.style.backgroundImage = `url(${resolved})`
    lens.style.backgroundSize = `${rect.width * 2.5}px ${rect.height * 2.5}px`
    lens.style.backgroundPosition = `-${x * 2.5 - 70}px -${y * 2.5 - 70}px`
  }
  return (
    <button className="pair-choice" data-state={state} disabled={disabled} onClick={onPick}
      aria-label={`${alt}. Pick this one as the real photo.`}>
      <div className="zoom-wrap" ref={wrapRef} onMouseMove={onMove}
        onMouseLeave={() => { if (lensRef.current) lensRef.current.style.display = 'none' }}>
        <img src={resolved} alt={alt} onError={() => setExtIdx((i) => i + 1)} />
        <div className="zoom-lens" ref={lensRef} aria-hidden="true" />
      </div>
    </button>
  )
}

function Body() {
  const { runData, setWidgetData } = useLab()
  const round = runData.w14?.round ?? 0
  const results = runData.w14?.results || []
  const [picked, setPicked] = useState(null) // 'left' | 'right' | 'timeout'
  const [timeLeft, setTimeLeft] = useState(W14_SECONDS)
  const timerRef = useRef(null)
  const done = round >= W14_PAIRS.length
  const pair = W14_PAIRS[round]
  const realSide = SIDES[round]

  useEffect(() => {
    setPicked(null)
    setTimeLeft(W14_SECONDS)
    if (done) return
    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [round, done])

  useEffect(() => {
    if (timeLeft <= 0 && picked == null && !done) {
      clearInterval(timerRef.current)
      setPicked('timeout')
      setWidgetData('w14', { results: [...results, 'timeout'] })
    }
  }, [timeLeft])

  function pick(side) {
    if (picked != null) return
    clearInterval(timerRef.current)
    setPicked(side)
    setWidgetData('w14', { results: [...results, side === realSide ? 'hit' : 'miss'] })
  }

  function next() {
    const hits = results.filter((r) => r === 'hit').length
    let best = 0, cur = 0
    for (const r of results) { cur = r === 'hit' ? cur + 1 : 0; best = Math.max(best, cur) }
    setWidgetData('w14', { round: round + 1, score: hits, streak: best })
  }

  if (done) {
    return (
      <div className="card">
        <p className="golf-score">Final: {runData.w14?.score ?? 0} of {W14_PAIRS.length} real photos identified.{' '}
          <span className="streak-chip">best streak {runData.w14?.streak ?? 0}</span></p>
        <ul>
          {W14_PAIRS.map((p) => (
            <li key={p.id}><strong>{p.subject}.</strong> Artifact family: {p.artifact}. {p.note}</li>
          ))}
        </ul>
      </div>
    )
  }

  const leftSrc = `images/w14/${pair.id}_${realSide === 'left' ? 'real' : 'ai'}`
  const rightSrc = `images/w14/${pair.id}_${realSide === 'right' ? 'real' : 'ai'}`
  const state = (side) =>
    picked == null ? null : side === realSide ? 'right' : picked === side ? 'wrong' : null

  return (
    <div>
      <p className="golf-score">
        Round {round + 1} of {W14_PAIRS.length}: {pair.subject}. Which one is the REAL photo?{' '}
        <span className="streak-chip">{results.filter((r) => r === 'hit').length} right</span>
      </p>
      <div className="timer-track" role="timer" aria-label={`${Math.max(0, timeLeft)} seconds left`}>
        <div className="timer-fill" style={{ width: `${Math.max(0, (timeLeft / W14_SECONDS) * 100)}%` }} />
      </div>
      <p className="muted">{Math.max(0, timeLeft)} seconds. Mouse over to magnify; check hands, text, reflections, background lines.</p>
      <div className="pair-row">
        <ZoomImage src={leftSrc} alt={`Left image: ${pair.subject}`} disabled={picked != null}
          onPick={() => pick('left')} state={state('left')} />
        <ZoomImage src={rightSrc} alt={`Right image: ${pair.subject}`} disabled={picked != null}
          onPick={() => pick('right')} state={state('right')} />
      </div>
      {picked != null && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span aria-live="polite">
            {/* "Wrong. The right image is the real photo." read as "the correct
                image" half the time. Say which side in words that cannot be
                mistaken for a verdict. */}
            {picked === 'timeout' ? 'Time is up.' : picked === realSide ? 'Correct.' : 'Not that one.'}{' '}
            The photograph is the one on the {realSide}-hand side.
            {' '}{pair.artifact}: {pair.note}
          </span>
          <button className="btn-primary" onClick={next}>
            {round + 1 === W14_PAIRS.length ? 'Finish' : 'Next round'}
          </button>
        </div>
      )}
    </div>
  )
}

const scoreBucket = (s) => (s == null ? null : s <= 2 ? '0to2' : s <= 4 ? '3to4' : '5to6')

export default {
  id: 'w14',
  label: 'W14',
  section: 'D. Visual hallucination',
  title: 'Spot the Fake',
  priority: 'P0',
  instruction: 'Six timed rounds: a real photo against an AI image of the same subject; pick the real one.',
  intro: {
    lead: 'The final skill: telling generated images from photographs, under time pressure, the way you will meet them in a feed. Each round pairs a real photo with an AI image of the same kind of subject. The tells tend to cluster in the same places: hands and fingers, written text, reflections and shadows, and the geometry of background lines. Tend to, not always. Each generation of these models fixes some of them, so a checklist that works today is not a test you can rely on next year. Use the magnifier; those areas are where local texture stops agreeing with global structure.',
    terms: [
      ['Artifact', 'A physical impossibility a generator leaves behind: a sixth finger, letters that almost spell, a reflection with no owner.'],
      ['Local vs global', 'Generators assemble patches that look right up close without a world model that keeps the whole scene consistent. Artifacts live at the seams.'],
    ],
  },
  predict: {
    text: 'Six rounds, twenty seconds each. How many real photos will you pick correctly?',
    options: [
      { key: 'a', label: 'All six' },
      { key: 'b', label: 'Four or five' },
      { key: 'c', label: 'Two or three' },
      { key: 'd', label: 'Coin-flip territory' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Your score out of 6:',
      options: [
        { key: '0to2', label: '0 to 2' },
        { key: '3to4', label: '3 to 4' },
        { key: '5to6', label: '5 to 6' },
      ],
      needs: (d) => (d.round ?? 0) >= W14_PAIRS.length,
      needsHint: 'Play all six rounds first. This question opens when the game ends.',
      correct: (d) => (d.round >= W14_PAIRS.length ? scoreBucket(d.score ?? 0) : null),
      explain: (d) =>
        `You identified ${d.score ?? 0} of 6 real photos, best streak ${d.streak ?? 0}. Generators improve every few months, so treat today’s tells as a habit of looking, not a permanent checklist.`,
      slide: SLIDES.deepfakes,
    },
    {
      id: 'q2',
      text: 'Which artifact family helped you most?',
      options: [
        { key: 'hands', label: 'Hands and fingers' },
        { key: 'text', label: 'Garbled text' },
        { key: 'geometry', label: 'Impossible geometry' },
        { key: 'reflections', label: 'Reflections and shadows' },
        // Round 6's tell is "Faces and background lines", which had no option
        // here, so a student whose best catch came from that round had nothing
        // honest to pick.
        { key: 'faces', label: 'Faces and background lines' },
        { key: 'none', label: 'None of them; I was guessing' },
      ],
      correct: null,
      explain:
        'Every family on this list comes from the same cause: locally plausible texture without a global model of objects, writing, or physics. If you were guessing, that is the finding worth taking away. Next time, deliberately check the family you used least; the tells rotate as models improve, and none of them is a reliable test on its own.',
      slide: SLIDES.deepfakes,
    },
  ],
}
