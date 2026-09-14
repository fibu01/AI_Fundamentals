import React, { useState } from 'react'
import { useLab } from './lib/store.jsx'
import { WIDGETS } from './widgets/registry.js'
import Questions, { getCorrectKey } from './components/Questions.jsx'

function Landing() {
  const { studentName, setStudentName, setStarted } = useLab()
  return (
    <div>
      <h1>Hallucination Lab</h1>
      <div className="card">
        <p>
          Every widget in this lab talks to the Lab Model: a language model with no web access, no retrieval,
          and sampling turned up. You will watch it invent citations, statute details, quotes, and counts,
          then practice the routine from Tuesday: stop, locate the source, compare, correct. Answer the
          questions inside each widget; at the end, copy your answer table into the Week 4 Thursday worksheet
          for Canvas upload.
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
  const { index, setIndex, answers, instructorMode } = useLab()
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
      <p>{widget.instruction}</p>
      <Body />
      <Questions widgetId={widget.id} questions={widget.questions} />
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
      {!canNext && <p className="muted">Next unlocks once every question on this widget is answered.</p>}
    </div>
  )
}

function summaryRows(answers, runData) {
  const rows = []
  for (const w of WIDGETS) {
    w.questions.forEach((q, qi) => {
      const chosen = answers[w.id]?.[q.id]
      const chosenLabel = q.options.find((o) => o.key === chosen)?.label || ''
      const correctKey = getCorrectKey(q, runData[w.id])
      let correct = 'N/A'
      if (chosen && correctKey) correct = chosen === correctKey ? 'Y' : 'N'
      rows.push({
        label: `${w.label}-Q${qi + 1}`,
        widget: `${w.label}. ${w.title}`,
        question: q.text,
        answer: chosen ? chosenLabel : '(not answered)',
        correct,
      })
    })
  }
  return rows
}

function Summary() {
  const { answers, runData, studentName, setIndex } = useLab()
  const [copied, setCopied] = useState(false)
  const rows = summaryRows(answers, runData)

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
          Instructor mode: answer keys visible, progress gate off. Remove ?mode=instructor for the student view.
        </div>
      )}
      {!started ? (
        <Landing />
      ) : index >= WIDGETS.length ? (
        <Summary />
      ) : (
        <WidgetPage widget={WIDGETS[Math.max(0, index)]} position={Math.max(0, index) + 1} total={WIDGETS.length} />
      )}
    </div>
  )
}
