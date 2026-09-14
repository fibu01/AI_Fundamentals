import React from 'react'
import { useLab } from '../lib/store.jsx'

// question.correct may be:
//   - an option key ('b')
//   - a function (runData) => key, for run-dependent answers
//   - null, for student-reported values with no single right answer
export function getCorrectKey(question, widgetRunData) {
  if (typeof question.correct === 'function') {
    try {
      return question.correct(widgetRunData || {})
    } catch {
      return null
    }
  }
  return question.correct ?? null
}

export default function Questions({ widgetId, questions }) {
  const { answers, setAnswer, runData, instructorMode } = useLab()
  const widgetAnswers = answers[widgetId] || {}
  const widgetData = runData[widgetId] || {}

  return (
    <div>
      {questions.map((q, qi) => {
        const chosen = widgetAnswers[q.id]
        const correctKey = getCorrectKey(q, widgetData)
        return (
          <div className="question" key={q.id}>
            <div className="question-text" id={`${widgetId}-${q.id}-label`}>
              Q{qi + 1}. {q.text}
            </div>
            <div role="radiogroup" aria-labelledby={`${widgetId}-${q.id}-label`}>
              {q.options.map((opt) => {
                const showKey = instructorMode && correctKey === opt.key
                return (
                  <button
                    key={opt.key}
                    role="radio"
                    aria-checked={chosen === opt.key}
                    className={`option${showKey ? ' correct-key' : ''}`}
                    onClick={() => setAnswer(widgetId, q.id, opt.key)}
                  >
                    <span className="marker">{opt.key.toUpperCase()}</span>
                    <span>
                      {opt.label}
                      {showKey && <strong> (answer key)</strong>}
                    </span>
                  </button>
                )
              })}
            </div>
            {chosen && (
              <ExplainPanel
                question={q}
                chosen={chosen}
                correctKey={correctKey}
                widgetData={widgetData}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ExplainPanel({ question, chosen, correctKey, widgetData }) {
  const explainText =
    typeof question.explain === 'function' ? question.explain(widgetData, chosen) : question.explain
  let verdict = null
  if (correctKey) {
    const right = chosen === correctKey
    const label = question.options.find((o) => o.key === correctKey)?.label
    verdict = (
      <p className="verdict-line">
        <span className={`verdict ${right ? 'right' : 'wrong'}`}>
          {right ? 'Correct.' : 'Not quite.'}
        </span>{' '}
        The answer is {correctKey.toUpperCase()}: {label}
      </p>
    )
  } else {
    verdict = <p className="verdict-line"><span className="verdict">Recorded.</span> This question reports your own result; there is no single right answer.</p>
  }
  return (
    <div className="explain">
      {verdict}
      <p>{explainText}</p>
      {question.slide && <p className="slide-ref">{question.slide}</p>}
    </div>
  )
}
