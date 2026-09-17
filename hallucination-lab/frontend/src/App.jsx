import React from 'react'
import { useLab } from './lib/store.jsx'
import { WIDGETS } from './widgets/registry.js'
import Questions from './components/Questions.jsx'
import IntroPanel from './components/IntroPanel.jsx'
import PredictGate from './components/PredictGate.jsx'
import BingoDrawer from './components/BingoDrawer.jsx'
import ResultsPage from './components/ResultsPage.jsx'

function Landing() {
  const { studentName, setStudentName, setStarted } = useLab()
  return (
    <div>
      <h1>Hallucination Lab</h1>
      <div className="card">
        <p>
          The Lab Model is a language model running with no web access, no retrieval, and its
          randomness turned up. You will watch it invent court cases, statute details, quotes, and
          counts, then make those failures stop using the techniques from Tuesday.
        </p>
        <p className="muted">
          Today this lab runs on saved transcripts rather than live calls, so everyone sees the
          experiment work the same way on 20 machines. Each output panel tells you exactly what you
          are looking at, and the lesson is identical either way: fluent text is not checked text.
        </p>
        <p><strong>How each module works:</strong></p>
        <ol>
          <li>Read the short setup at the top; it defines any term you have not met.</li>
          <li>Lock in a prediction. Predictions are one-shot; wrong predictions cost nothing.</li>
          <li>Run the experiment and poke at it: change the topic, flip the technique toggles, re-run.</li>
          <li>Answer the questions. One answer each, no retries, so run the experiment first.</li>
        </ol>
        <p>
          Two of the modules are timed games with streaks, two more are scored games without a clock,
          and the Bingo card in the corner
          follows you the whole session: claim a square whenever you catch the model doing one of the
          sixteen behaviors on it, and call a bingo out loud.
        </p>
        <p className="error-note">
          Progress lives in this browser tab only. Do not close it until the end, where you save your
          results as a PDF and upload that file to Canvas. Closing early loses everything.
        </p>
      </div>
      <label className="field-label" htmlFor="student-name">Your name (you can also enter it at the end)</label>
      <input id="student-name" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" onClick={() => setStarted(true)}>Start Lab</button>
      </div>
    </div>
  )
}

function WidgetPage({ widget, position, total }) {
  const { index, setIndex, answers, predictions, runData, instructorMode } = useLab()
  const widgetAnswers = answers[widget.id] || {}
  const allAnswered = widget.questions.every((q) => widgetAnswers[q.id])
  // Some questions stay shut until the experiment they ask about has been run,
  // so "answer everything to continue" is not the whole story.
  const widgetRun = runData[widget.id] || {}
  const waitingOnRun = widget.questions.some(
    (q) => !widgetAnswers[q.id] && q.needs && !q.needs(widgetRun)
  )
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
          title={canNext ? undefined : waitingOnRun
            ? 'Run the experiment, then answer every question on this widget'
            : 'Answer every question on this widget to continue'}
          onClick={() => setIndex(index + 1)}
        >
          {position === total ? 'Finish and download my results' : 'Next'}
        </button>
      </div>
      {!canNext && (
        <p className="muted">
          {!predictions[widget.id] && widget.predict
            ? 'Lock a prediction to open the experiment; Next unlocks once every question is answered.'
            : waitingOnRun
              ? 'One or more questions below are still waiting on a run. Do the experiment first, then answer them; Next unlocks after that.'
              : 'Next unlocks once every question on this widget is answered.'}
        </p>
      )}
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
          <ResultsPage />
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
