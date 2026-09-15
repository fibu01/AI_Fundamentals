import React, { useState } from 'react'
import { useLab } from './lib/store.jsx'
import { WIDGETS } from './widgets/registry.js'
import Questions, { getCorrectKey } from './components/Questions.jsx'
import IntroPanel from './components/IntroPanel.jsx'
import PredictGate from './components/PredictGate.jsx'
import BingoDrawer, { BINGO_SQUARES, bingoLines } from './components/BingoDrawer.jsx'

function Landing() {
  const { studentName, setStudentName, setStarted } = useLab()
  return (
    <div>
      <h1>Hallucination Lab</h1>
      <div className="card">
        <p>
          Every experiment here talks to the Lab Model: a language model running with no web access,
          no retrieval, and its randomness turned up. You will make it invent court cases, statute
          details, quotes, and counts, then make those failures stop using the techniques from Tuesday.
        </p>
        <p><strong>How each module works:</strong></p>
        <ol>
          <li>Read the short setup at the top; it defines any term you have not met.</li>
          <li>Lock in a prediction. Predictions are one-shot; wrong predictions cost nothing.</li>
          <li>Run the experiment and poke at it: change the topic, flip the technique toggles, re-run.</li>
          <li>Answer the questions. One answer each, no retries, so run the experiment first.</li>
        </ol>
        <p>
          Three of the modules are games with timers and streaks, and the Bingo card in the corner
          follows you the whole session: claim a square whenever you catch the model doing one of the
          sixteen behaviors on it, and call a bingo out loud.
        </p>
        <p className="error-note">
          Progress lives in this browser tab only. Closing the tab loses your work; the copy button at the
          end is how your answers leave this page.
        </p>
      </div>
      <label className="field-label" htmlFor="student-name">First name (optional, stamps your export only)</label>
      <input id="student-name" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" onClick={() => setStarted(true)}>Start Lab</button>
      </div>
    </div>
  )
}

function WidgetPage({ widget, position, total }) {
  const { index, setIndex, answers, predictions, instructorMode } = useLab()
  const widgetAnswers = answers[widget.id] || {}
  const allAnswered = widget.questions.every((q) => widgetAnswers[q.id])
  const canNext = allAnswered || instructorMode
  const Body = widget.Body

  return (
    <div>
      <div className="progress-wrap">
        <div className="progress-label">Widget {position} of {total}: {widget.section}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(position / total) * 100}%` }} />
        </div>
      </div>
      <h2>{widget.label}. {widget.title}</h2>
      <IntroPanel widgetId={widget.id} intro={widget.intro} />
      <p>{widget.instruction}</p>
      <PredictGate widgetId={widget.id} predict={widget.predict}>
        <Body />
        <Questions widgetId={widget.id} questions={widget.questions} />
      </PredictGate>
      <div className="nav-row">
        <button onClick={() => setIndex(index - 1)}>Back</button>
        <button
          className="btn-primary"
          disabled={!canNext}
          title={canNext ? undefined : 'Answer every question on this widget to continue'}
          onClick={() => setIndex(index + 1)}
        >
          {position === total ? 'Finish: see your answers' : 'Next'}
        </button>
      </div>
      {!canNext && (
        <p className="muted">
          {!predictions[widget.id] && widget.predict
            ? 'Lock a prediction to open the experiment; Next unlocks once every question is answered.'
            : 'Next unlocks once every question on this widget is answered.'}
        </p>
      )}
    </div>
  )
}

function summaryRows(answers, predictions, runData, bingo) {
  const rows = []
  for (const w of WIDGETS) {
    if (w.predict) {
      const p = predictions[w.id]
      rows.push({
        label: `${w.label}-P`,
        question: `Prediction: ${w.predict.text}`,
        answer: p ? (w.predict.options.find((o) => o.key === p)?.label || p) : '(not made)',
        correct: 'N/A',
      })
    }
    w.questions.forEach((q, qi) => {
      const chosen = answers[w.id]?.[q.id]
      const chosenLabel = q.options.find((o) => o.key === chosen)?.label || ''
      const correctKey = getCorrectKey(q, runData[w.id])
      let correct = 'N/A'
      if (chosen && correctKey) correct = chosen === correctKey ? 'Y' : 'N'
      rows.push({
        label: q.rowLabel || `${w.label}-Q${qi + 1}`,
        question: q.text,
        answer: chosen ? chosenLabel : '(not answered)',
        correct,
      })
    })
  }
  const claimed = Object.keys(bingo).length
  rows.push({
    label: 'BINGO',
    question: 'Hallucination Bingo squares claimed (and where)',
    answer: claimed
      ? `${claimed}/16, ${bingoLines(bingo)} bingo(s): ` +
        Object.entries(bingo).map(([i, where]) => `${BINGO_SQUARES[i]} @ ${where}`).join('; ')
      : 'none claimed',
    correct: 'N/A',
  })
  return rows
}

function Summary() {
  const { answers, predictions, runData, bingo, studentName, setIndex } = useLab()
  const [copied, setCopied] = useState(false)
  const rows = summaryRows(answers, predictions, runData, bingo)

  async function copyForWorksheet() {
    // Plain text, tab-separated: pastes into the worksheet's answer table in
    // Word with rows aligned. Observation column stays blank for the student.
    const header = `Hallucination Lab answers${studentName ? ` for ${studentName}` : ''}, exported ${new Date().toLocaleString()}`
    const lines = [header, 'Row\tMy Answer\tCorrect (Y/N)\tOne-sentence observation']
    for (const r of rows) lines.push(`${r.label}\t${r.answer}\t${r.correct}\t`)
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
    } catch {
      window.prompt('Copy this text manually:', lines.join('\n'))
    }
  }

  return (
    <div>
      <h1>Your answers</h1>
      <table className="summary-table">
        <thead>
          <tr><th>Row</th><th>Question</th><th>My answer</th><th>Correct</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.question}</td>
              <td>{r.answer}</td>
              <td className={r.correct === 'Y' ? 'correct-yes' : r.correct === 'N' ? 'correct-no' : ''}>{r.correct}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="nav-row">
        <button onClick={() => setIndex(WIDGETS.length - 1)}>Back</button>
        <button className="btn-primary" onClick={copyForWorksheet}>
          {copied ? 'Copied. Paste into the worksheet table.' : 'Copy for worksheet'}
        </button>
      </div>
      <p className="muted">
        Paste into "Week 4 Thursday Student Lab Worksheet.docx", then write your one-sentence observation
        per row. The five synthesis questions are in the worksheet itself.
      </p>
    </div>
  )
}

export default function App() {
  const { started, index, instructorMode } = useLab()
  return (
    <div className={`app${instructorMode ? ' instructor' : ''}`}>
      {instructorMode && (
        <div className="instructor-banner">
          Instructor mode: answer keys visible, predictions and progress gates off, answers re-clickable.
          Remove ?mode=instructor for the student view.
        </div>
      )}
      {!started ? (
        <Landing />
      ) : index >= WIDGETS.length ? (
        <>
          <Summary />
          <BingoDrawer />
        </>
      ) : (
        <>
          <WidgetPage widget={WIDGETS[Math.max(0, index)]} position={Math.max(0, index) + 1} total={WIDGETS.length} />
          <BingoDrawer />
        </>
      )}
    </div>
  )
}
