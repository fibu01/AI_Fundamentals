import React, { useState } from 'react'
import { useLab } from '../lib/store.jsx'

// Predict-then-run: the widget body stays hidden until the student locks in
// a one-shot prediction. predict = { text, options: [{key, label}] }.
// After the run, the widget's own questions do the comparing; the prediction
// is echoed back so students can check themselves against it.
export default function PredictGate({ widgetId, predict, children }) {
  const { predictions, lockPrediction, instructorMode } = useLab()
  const [choice, setChoice] = useState(null)
  const locked = predictions[widgetId]

  if (!predict || locked || instructorMode) {
    return (
      <>
        {locked && (
          <p className="prediction-echo">
            Your prediction: {predict?.options.find((o) => o.key === locked)?.label || locked}.
            Keep it in mind while you run the experiment.
          </p>
        )}
        {children}
      </>
    )
  }

  return (
    <div className="predict-card">
      <p className="question-text">Before you run anything: {predict.text}</p>
      <div role="radiogroup" aria-label="Prediction">
        {predict.options.map((opt) => (
          <button
            key={opt.key}
            role="radio"
            aria-checked={choice === opt.key}
            className="option"
            onClick={() => setChoice(opt.key)}
          >
            <span className="marker">{opt.key.toUpperCase()}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <button
        className="btn-primary"
        disabled={!choice}
        onClick={() => lockPrediction(widgetId, choice)}
      >
        Lock in my prediction and open the experiment
      </button>
      <p className="muted">Predictions lock. Being wrong costs nothing; it is how experiments work.</p>
    </div>
  )
}
