import React, { useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { FC_DRAFTS, FLAG_REASONS, plantedErrorCount } from '../data/factcheck.js'
import { SLIDES } from '../config.js'

function caughtCount(draft, draftFlags) {
  let caught = 0
  draft.sentences.forEach((s, i) => {
    if (s.error && draftFlags?.[i]) caught++
  })
  return caught
}

function Draft({ draft, flags, setFlags, revealed }) {
  const [openIdx, setOpenIdx] = useState(null)
  const draftFlags = flags[draft.id] || {}

  function toggleFlag(i) {
    if (revealed) return
    if (draftFlags[i]) {
      const next = { ...draftFlags }
      delete next[i]
      setFlags(draft.id, next)
      setOpenIdx(null)
    } else {
      setOpenIdx(i)
    }
  }

  function saveFlag(i, reason, url) {
    setFlags(draft.id, { ...draftFlags, [i]: { reason, url } })
    setOpenIdx(null)
  }

  return (
    <div className="card">
      <h3>{draft.title}</h3>
      <p className="muted">{draft.intro}</p>
      <p>
        {draft.sentences.map((s, i) => (
          <React.Fragment key={i}>
            <button
              className="fc-sentence"
              data-flagged={!!draftFlags[i]}
              style={{ border: 'none', background: draftFlags[i] ? undefined : 'transparent', font: 'inherit', display: 'inline', padding: '1px 2px' }}
              aria-pressed={!!draftFlags[i]}
              onClick={() => toggleFlag(i)}
            >
              {s.text}
            </button>{' '}
          </React.Fragment>
        ))}
      </p>
      {openIdx != null && !revealed && (
        <FlagForm
          sentence={draft.sentences[openIdx].text}
          onSave={(reason, url) => saveFlag(openIdx, reason, url)}
          onCancel={() => setOpenIdx(null)}
        />
      )}
      {Object.keys(draftFlags).length > 0 && !revealed && (
        <p className="muted">Flagged {Object.keys(draftFlags).length} sentence(s).</p>
      )}
      {revealed && (
        <div>
          <p>
            <strong>
              You caught {caughtCount(draft, draftFlags)} of {plantedErrorCount(draft)} planted errors.
            </strong>
          </p>
          <ul>
            {draft.sentences.map((s, i) =>
              s.error ? (
                <li key={i}>
                  <strong>{s.error.type}{draftFlags[i] ? ' (you flagged this)' : ' (missed)'}:</strong> "{s.text}" {s.error.note}
                </li>
              ) : null
            )}
          </ul>
          <p><strong>Instructor source list:</strong></p>
          <ul>
            {draft.sources.map((src) => (
              <li key={src.url}><a href={src.url} target="_blank" rel="noreferrer">{src.label}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FlagForm({ sentence, onSave, onCancel }) {
  const [reason, setReason] = useState(FLAG_REASONS[0])
  const [url, setUrl] = useState('')
  return (
    <div className="fc-flag-form">
      <p><strong>Flagging:</strong> "{sentence}"</p>
      <label htmlFor="fc-reason">Reason</label>
      <select id="fc-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
        {FLAG_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <label htmlFor="fc-url">URL of the primary source you checked</label>
      <input id="fc-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={() => onSave(reason, url)}>Save flag</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function Body() {
  const { runData, setWidgetData } = useLab()
  const flags = runData.fc?.flags || {}
  const revealed = !!runData.fc?.revealed

  function setFlags(draftId, draftFlags) {
    const nextFlags = { ...flags, [draftId]: draftFlags }
    setWidgetData('fc', {
      flags: nextFlags,
      caught: Object.fromEntries(FC_DRAFTS.map((d) => [d.id, caughtCount(d, nextFlags[d.id])])),
    })
  }

  return (
    <div>
      {FC_DRAFTS.map((d) => (
        <Draft key={d.id} draft={d} flags={flags} setFlags={setFlags} revealed={revealed} />
      ))}
      <button className="btn-primary" disabled={revealed} onClick={() => setWidgetData('fc', { revealed: true })}>
        Reveal the planted errors
      </button>
      {!revealed && <p className="muted">Flag everything you distrust in all three drafts before revealing.</p>}
    </div>
  )
}

const caughtBucket = (caught, total) =>
  caught == null ? null : caught >= total ? 'all' : caught >= 3 ? '3to4' : '0to2'

const draftQuestion = (draft, n) => ({
  id: `q${n}`,
  text: `${draft.title.split(':')[0]}: how many of the planted errors did you catch?`,
  options: [
    { key: '0to2', label: '0 to 2' },
    { key: '3to4', label: '3 to 4' },
    { key: 'all', label: 'All of them' },
  ],
  correct: (d) => (d.revealed ? caughtBucket(d.caught?.[draft.id] ?? 0, plantedErrorCount(draft)) : null),
  explain: (d) =>
    d.revealed
      ? `This draft contained ${plantedErrorCount(draft)} planted errors; you caught ${d.caught?.[draft.id] ?? 0}. The routine from Tuesday applies to every AI draft you will ever receive: stop, locate the source, compare, correct.`
      : 'Reveal the planted errors first.',
  slide: SLIDES.verification,
})

export default {
  id: 'fc',
  label: 'Fact-Check',
  section: 'Closing: Fact-Check Challenge',
  title: 'Fact-Check Challenge',
  priority: 'P0',
  instruction: 'Flag every sentence you distrust in the three AI drafts, with a reason and a source URL.',
  Body,
  questions: FC_DRAFTS.map((d, i) => draftQuestion(d, i + 1)),
}
