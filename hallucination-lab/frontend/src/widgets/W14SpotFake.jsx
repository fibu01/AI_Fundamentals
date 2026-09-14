import React, { useRef, useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { W14_IMAGES, W14_EXT } from '../data/manifests.js'
import { SLIDES } from '../config.js'

function ZoomImage({ src, alt }) {
  const wrapRef = useRef(null)
  const lensRef = useRef(null)
  const [zoomed, setZoomed] = useState(false) // keyboard-accessible zoom toggle

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
    lens.style.backgroundImage = `url(${src})`
    lens.style.backgroundSize = `${rect.width * 2.5}px ${rect.height * 2.5}px`
    lens.style.backgroundPosition = `-${x * 2.5 - 70}px -${y * 2.5 - 70}px`
  }

  return (
    <div>
      <div
        className="zoom-wrap"
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => { if (lensRef.current) lensRef.current.style.display = 'none' }}
      >
        <img src={src} alt={alt} style={zoomed ? { transform: 'scale(2)', transformOrigin: 'top left' } : undefined} />
        <div className="zoom-lens" ref={lensRef} aria-hidden="true" />
      </div>
      <button onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}>
        {zoomed ? 'Zoom out' : 'Zoom 2x'}
      </button>
    </div>
  )
}

export function computeScore(marks) {
  let score = 0
  for (const img of W14_IMAGES) {
    const m = marks?.[img.id]
    if (m && ((m === 'fake') === img.isFake)) score++
  }
  return score
}

function Body() {
  const { runData, setWidgetData } = useLab()
  const marks = runData.w14?.marks || {}
  const revealed = !!runData.w14?.revealed
  const allMarked = W14_IMAGES.every((i) => marks[i.id])
  const score = computeScore(marks)

  function mark(id, value) {
    if (revealed) return
    const next = { ...marks, [id]: value }
    setWidgetData('w14', { marks: next, score: computeScore(next) })
  }

  return (
    <div>
      <p className="muted">Drag your mouse over hands, text, reflections, and background lines, or use the Zoom button. Mark all ten, then reveal.</p>
      <div className="img-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {W14_IMAGES.map((img) => (
          <div className="img-cell" key={img.id}>
            <ZoomImage src={`images/w14/${img.id}.${W14_EXT}`} alt={img.alt} />
            <div className="cell-controls" role="group" aria-label={`Mark ${img.alt}`}>
              <button aria-pressed={marks[img.id] === 'real'} onClick={() => mark(img.id, 'real')}>Real</button>
              <button aria-pressed={marks[img.id] === 'fake'} onClick={() => mark(img.id, 'fake')}>Fake</button>
            </div>
            {revealed && (
              <p className={marks[img.id] === (img.isFake ? 'fake' : 'real') ? 'muted' : 'error-note'}>
                {img.isFake ? `AI-generated. Artifact: ${img.artifact}. ${img.note}.` : `Real. ${img.note}.`}
              </p>
            )}
          </div>
        ))}
      </div>
      <button className="btn-primary" disabled={!allMarked || revealed} onClick={() => setWidgetData('w14', { revealed: true })}>
        Reveal score
      </button>
      {revealed && <p aria-live="polite"><strong>Your score: {score} of 10.</strong></p>}
    </div>
  )
}

const scoreBucket = (s) => (s == null ? null : s <= 4 ? '0to4' : s <= 6 ? '5to6' : s <= 8 ? '7to8' : '9to10')

export default {
  id: 'w14',
  label: 'W14',
  section: 'D. Visual hallucination',
  title: 'Spot the Fake',
  priority: 'P0',
  instruction: 'Mark each of the ten images Real or Fake, using the zoom lens on the usual trouble spots.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Your score out of 10:',
      options: [
        { key: '0to4', label: '0 to 4' },
        { key: '5to6', label: '5 to 6' },
        { key: '7to8', label: '7 to 8' },
        { key: '9to10', label: '9 to 10' },
      ],
      correct: (d) => (d.revealed ? scoreBucket(d.score) : null),
      explain: (d) =>
        d.revealed
          ? `You scored ${d.score} of 10. Generators keep improving, so today’s artifacts (hands, text, reflections) are a habit of looking, not a permanent checklist.`
          : 'Mark all ten images and reveal your score first.',
      slide: SLIDES.deepfakes,
    },
    {
      id: 'q2',
      text: 'Which artifact did you find most often?',
      options: [
        { key: 'hands', label: 'Hands and fingers' },
        { key: 'text', label: 'Garbled text' },
        { key: 'geometry', label: 'Impossible geometry' },
        { key: 'reflections', label: 'Reflections and shadows' },
      ],
      correct: null,
      explain:
        'All four artifact families come from the same cause: the generator assembles locally plausible texture without a global model of objects, writing, or physics. Check whichever family you found weakest next time; the tells rotate as models improve.',
      slide: SLIDES.deepfakes,
    },
  ],
}
