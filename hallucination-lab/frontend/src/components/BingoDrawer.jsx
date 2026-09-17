import React, { useState } from 'react'
import { useLab } from '../lib/store.jsx'

// Hallucination Bingo: a 4x4 card of failure types that follows the student
// through the whole lab. A square is claimed by naming the widget where they
// caught that behavior in a model output. A completed row, column, or
// diagonal is a bingo: report it to the instructor at the front.

export const BINGO_SQUARES = [
  'A citation that does not exist',
  'A quote nobody ever said',
  'A number the source contradicts',
  'Total confidence about a false claim',
  'An apology followed by a new wrong answer',
  'Two runs that contradict each other',
  // Was "The model admits it cannot verify" and "A disclaimer despite being
  // told not to". Neither behaviour occurs anywhere in the shipped
  // transcripts, so two of sixteen squares could never honestly be claimed and
  // they blocked three of the ten bingo lines. Both replacements are on screen
  // in W5 and W7.
  'A real statute number attached to the wrong rule',
  'A pronoun chosen by stereotype',
  'A famous list missing the women on it',
  'A miscounted image',
  'Garbled hands, text, or reflections',
  'A statute detail invented from thin air',
  'The answer changed when challenged',
  'A grounded run says Information not found',
  'A journal or publication that does not exist',
  'The model gets one completely right',
]

const WIDGET_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5/W6', 'W7', 'TTL', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'Fact-Check']

export function bingoLines(claimed) {
  const has = (i) => claimed[i] != null
  const lines = []
  for (let r = 0; r < 4; r++) lines.push([0, 1, 2, 3].map((c) => r * 4 + c))
  for (let c = 0; c < 4; c++) lines.push([0, 1, 2, 3].map((r) => r * 4 + c))
  lines.push([0, 5, 10, 15], [3, 6, 9, 12])
  return lines.filter((line) => line.every(has)).length
}

export default function BingoDrawer() {
  const { bingo, claimBingo } = useLab()
  const [open, setOpen] = useState(false)
  const [claiming, setClaiming] = useState(null)
  const count = Object.keys(bingo).length
  const lines = bingoLines(bingo)

  return (
    <>
      <button className="bingo-fab" onClick={() => setOpen(!open)} aria-expanded={open}>
        Bingo card ({count}/16{lines > 0 ? `, BINGO x${lines}` : ''})
      </button>
      {open && (
        <div className="bingo-drawer" role="dialog" aria-label="Hallucination Bingo card">
          <p className="question-text">Hallucination Bingo</p>
          <p className="muted">
            Caught the model doing one of these in any module's output? Claim the square and name where.
            Four in a row is a bingo: tell the instructor and show them the output.
          </p>
          <div className="bingo-grid">
            {BINGO_SQUARES.map((label, i) => (
              <button
                key={i}
                className="bingo-square"
                data-claimed={bingo[i] != null}
                onClick={() => setClaiming(claiming === i ? null : i)}
              >
                <span>{label}</span>
                {bingo[i] && <span className="bingo-where">{bingo[i]}</span>}
              </button>
            ))}
          </div>
          {claiming != null && bingo[claiming] == null && (
            <div className="bingo-claim-row">
              <label htmlFor="bingo-where">Where did you see "{BINGO_SQUARES[claiming]}"?</label>
              <select
                id="bingo-where"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    claimBingo(claiming, e.target.value)
                    setClaiming(null)
                  }
                }}
              >
                <option value="" disabled>Pick the widget</option>
                {WIDGET_LABELS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}
          {lines > 0 && (
            <p className="bingo-banner" aria-live="polite">BINGO. Show the instructor the output that earned your last square.</p>
          )}
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  )
}
