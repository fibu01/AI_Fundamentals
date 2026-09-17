import React, { useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { WIDGETS } from '../widgets/registry.js'
import { getCorrectKey } from './Questions.jsx'
import { BINGO_SQUARES, bingoLines } from './BingoDrawer.jsx'

// End-of-lab results screen. Students download a file here and upload it to
// Canvas, so the file has to stand on its own: who, when, what they answered,
// whether it was right, and the game scores the widgets recorded.

function collect({ answers, predictions, runData, bingo }) {
  const modules = []
  let scored = 0
  let correctCount = 0
  let answeredCount = 0

  for (const w of WIDGETS) {
    const rows = []
    if (w.predict) {
      const p = predictions[w.id]
      rows.push({
        kind: 'prediction',
        label: `${w.label}-P`,
        question: w.predict.text,
        answer: p ? (w.predict.options.find((o) => o.key === p)?.label || p) : '(not made)',
        correct: 'N/A',
      })
    }
    w.questions.forEach((q, qi) => {
      const chosen = answers[w.id]?.[q.id]
      const chosenLabel = q.options.find((o) => o.key === chosen)?.label || ''
      const key = getCorrectKey(q, runData[w.id])
      let correct = 'N/A'
      if (chosen) {
        answeredCount++
        if (key) {
          scored++
          correct = chosen === key ? 'YES' : 'NO'
          if (chosen === key) correctCount++
        }
      }
      rows.push({
        kind: 'question',
        label: q.rowLabel || `${w.label}-Q${qi + 1}`,
        question: q.text,
        answer: chosen ? chosenLabel : '(not answered)',
        correct,
      })
    })
    modules.push({ label: w.label, title: w.title, section: w.section, rows })
  }

  // Game results the widgets stashed in runData.
  const d = runData
  const games = []
  if (d.w3?.sortScore != null) games.push(`Citation Sort (W3): ${d.w3.sortScore} of 6 sorted correctly`)
  if (d.w5?.solvedWith) {
    games.push(`Prompt Golf (W5/W6): solved with ${d.w5.solvedWith.techniques.length} technique(s) ` +
      `in ${d.w5.solvedWith.strokes} run(s) [${d.w5.solvedWith.techniques.join(', ')}]`)
  } else if (d.w5?.strokes) {
    games.push(`Prompt Golf (W5/W6): ${d.w5.strokes} run(s), not solved to zero`)
  }
  if (d.w5?.baselineMismatches != null) games.push(`  baseline invented numbers: ${d.w5.baselineMismatches}`)
  if (d.ttl?.score != null) games.push(`Two Truths and a Lie: ${d.ttl.score} of 6, best streak ${d.ttl.streak ?? 0}`)
  if (d.w9?.score != null) games.push(`Pronoun prediction (W9): called ${d.w9.score} of 10 correctly`)
  if (d.w14?.score != null) games.push(`Spot the Fake (W14): ${d.w14.score} of 6, best streak ${d.w14.streak ?? 0}`)
  if (d.w12?.ceoShare != null) games.push(`Picture the Job (W12): CEO grid tallied ${Math.round(d.w12.ceoShare * 100)}% presenting male`)
  if (d.fc?.caught) {
    const total = Object.values(d.fc.caught).reduce((a, b) => a + b, 0)
    games.push(`Fact-Check Challenge: ${total} planted error${total === 1 ? '' : 's'} caught across the three drafts`)
  }
  const claimed = Object.keys(bingo).length
  if (claimed) {
    games.push(`Hallucination Bingo: ${claimed} of 16 squares, ${bingoLines(bingo)} bingo(s)`)
  }

  return { modules, scored, correctCount, answeredCount, games, claimed }
}

function buildCsv(data, name) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [['Student', 'Row', 'Question', 'My Answer', 'Correct (Y/N)', 'One-sentence observation']]
  for (const m of data.modules) {
    for (const r of m.rows) {
      rows.push([name || '', r.label, r.question, r.answer,
        r.correct === 'YES' ? 'Y' : r.correct === 'NO' ? 'N' : '', ''])
    }
  }
  return rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

function sessionCode(data, name) {
  const basis = (name || '') + data.modules.flatMap((m) =>
    m.rows.map((r) => `${r.label}:${r.answer}:${r.correct}`)).join('|')
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < basis.length; i++) {
    h1 = ((h1 ^ basis.charCodeAt(i)) * 0x01000193) >>> 0
    h2 = ((h2 + basis.charCodeAt(i) * (i + 7)) * 0x27d4eb2f) >>> 0
  }
  return (h1.toString(36) + h2.toString(36)).toUpperCase().slice(0, 10)
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildHtml(data, name, code) {
  const esc = (v) => String(v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const rows = data.modules.flatMap((m) =>
    m.rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.question)}</td>` +
      `<td>${esc(r.answer)}</td><td class="${r.correct === 'YES' ? 'y' : r.correct === 'NO' ? 'n' : ''}">` +
      `${r.correct === 'YES' || r.correct === 'NO' ? esc(r.correct) : '&mdash;'}</td></tr>`)).join('\n')
  const games = data.games.map((g) => `<li>${esc(g)}</li>`).join('\n')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Hallucination Lab results: ${esc(name || 'student')}</title>
<style>
 body { font-family: 'Segoe UI', system-ui, Arial, sans-serif; color: #3a3a3a; max-width: 900px; margin: 24px auto; padding: 0 16px; }
 h1, h2 { color: #c8102e; }
 table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
 th, td { border: 1px solid #e2e2e2; padding: 6px 9px; text-align: left; vertical-align: top; }
 th { background: #fafafa; color: #c8102e; }
 .y { color: #1a7f37; font-weight: 700; } .n { color: #b42318; font-weight: 700; }
 .meta { background: #fafafa; border-left: 5px solid #c8102e; padding: 10px 14px; }
 code { background: #f1efec; padding: 1px 5px; border-radius: 4px; }
</style></head><body>
<h1>Hallucination Lab results</h1>
<div class="meta">
 <p><strong>Student:</strong> ${esc(name || '(no name entered)')}<br>
 <strong>Completed:</strong> ${esc(new Date().toLocaleString())}<br>
 <strong>Scored:</strong> ${data.correctCount} of ${data.scored} auto-scored questions
 (${data.answeredCount} answered in total)<br>
 <strong>Verification code:</strong> <code>${esc(code)}</code></p>
</div>
${games ? `<h2>Game and experiment results</h2><ul>${games}</ul>` : ''}
<h2>Detailed responses</h2>
<p class="muted">Rows ending in -P are locked predictions and are not scored. A dash in the Correct
column means the question has no single right answer; it reports what this student's own run produced.</p>
<table><thead><tr><th>Row</th><th>Question</th><th>My answer</th><th>Correct</th></tr></thead>
<tbody>${rows}</tbody></table>
<p style="color:#6b6b6b;font-size:0.85em">Generated by the Hallucination Lab, Barry University AI Fundamentals Week 4.</p>
</body></html>`
}

function slug(name) {
  const s = (name || 'student').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return s || 'student'
}

export default function ResultsPage() {
  const lab = useLab()
  const { studentName, setStudentName, setIndex } = lab
  const [downloaded, setDownloaded] = useState(null)
  const data = collect(lab)
  const stamp = new Date().toISOString().slice(0, 10)

  const code = sessionCode(data, studentName)

  function saveAsPdf() {
    setDownloaded('pdf')
    window.print()
  }
  function downloadHtml() {
    download(`hallucination-lab-${slug(studentName)}-${stamp}.html`,
      buildHtml(data, studentName, code), 'text/html')
    setDownloaded('html')
  }
  function downloadCsv() {
    download(`hallucination-lab-${slug(studentName)}-${stamp}.csv`,
      buildCsv(data, studentName), 'text/csv')
    setDownloaded('csv')
  }

  return (
    <div>
      <h1>Download your results</h1>

      <div className="card no-print">
        <p><strong>You are done. Two steps left:</strong></p>
        <ol>
          <li>Put your name in the box below so your instructor knows whose work this is.</li>
          <li>Click <strong>Save as PDF</strong>, then upload that PDF to the Week 4 assignment in Canvas.</li>
        </ol>
        <p className="error-note">
          Nothing is submitted automatically. If you close this tab without saving, your work is gone.
        </p>
      </div>

      <div className="no-print">
        <label className="field-label" htmlFor="results-name">Your name (first and last)</label>
        <input
          id="results-name"
          type="text"
          value={studentName}
          placeholder="e.g. Maria Gonzalez"
          onChange={(e) => setStudentName(e.target.value)}
          style={{ width: 340 }}
        />
        {!studentName.trim() && (
          <p className="muted">Add your name before saving, or the file will say "(no name entered)".</p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0' }}>
          <button className="btn-primary" onClick={saveAsPdf} style={{ fontSize: '1.05em', padding: '12px 22px' }}>
            Save as PDF
          </button>
          <button onClick={downloadHtml}>Download as a web page (.html)</button>
          <button onClick={downloadCsv}>Download spreadsheet (.csv)</button>
        </div>
        <p className="muted">
          "Save as PDF" opens your browser's print window. Choose <strong>Save as PDF</strong> as the
          destination (not a printer), then save the file and upload it to Canvas.
        </p>
        {downloaded === 'pdf' && (
          <p className="explain" aria-live="polite">
            <strong>Print window opened.</strong> Pick "Save as PDF" as the destination and save it as
            <code> hallucination-lab-{slug(studentName)}</code>. Upload that file to Canvas.
          </p>
        )}
        {downloaded && downloaded !== 'pdf' && (
          <p className="explain" aria-live="polite">
            <strong>Downloaded.</strong> Look in your Downloads folder for a file starting with
            {' '}<code>hallucination-lab-{slug(studentName)}</code>, then upload it to Canvas.
          </p>
        )}
      </div>

      <div className="print-header" aria-hidden="true">
        <h2>Hallucination Lab results</h2>
        <p>Student: {studentName || '(no name entered)'} &middot; Completed: {new Date().toLocaleString()}</p>
      </div>

      <div className="card">
        <p className="golf-score">
          Scored {data.correctCount} of {data.scored} auto-scored questions.
          {' '}{data.answeredCount} questions answered in total.
        </p>
        {data.games.length > 0 && (
          <ul>{data.games.map((g, i) => <li key={i}>{g}</li>)}</ul>
        )}
        <p className="muted">Verification code: <code>{code}</code></p>
      </div>

      <h2>Everything in your file</h2>
      <p className="muted">
        Rows ending in <strong>-P</strong> are your locked predictions; a wrong prediction is not a
        wrong answer and is not scored. A dash in the Correct column means the question has no single
        right answer (it reports what your own run produced), not that you skipped it.
      </p>
      <table className="summary-table">
        <thead>
          <tr><th>Row</th><th>Question</th><th>My answer</th><th>Correct</th></tr>
        </thead>
        <tbody>
          {data.modules.flatMap((m) =>
            m.rows.map((r) => (
              <tr key={`${m.label}-${r.label}-${r.kind}`}>
                <td>{r.label}</td>
                <td>{r.question}</td>
                <td>{r.answer}</td>
                <td className={r.correct === 'YES' ? 'correct-yes' : r.correct === 'NO' ? 'correct-no' : ''}>
                  {r.correct === 'YES' || r.correct === 'NO' ? r.correct : '\u2014'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="nav-row no-print">
        <button onClick={() => setIndex(WIDGETS.length - 1)}>Back to the last module</button>
      </div>
    </div>
  )
}
