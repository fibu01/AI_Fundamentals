import React, { createContext, useContext, useMemo, useState } from 'react'

// All lab state lives in memory only. Closing the tab loses progress;
// the landing page says so. Nothing is persisted or sent anywhere except
// the model calls in lib/api.js.

const LabContext = createContext(null)

export function LabProvider({ children }) {
  const [studentName, setStudentName] = useState('')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  // answers: { [widgetId]: { [questionId]: optionKey } } - lock on first pick
  const [answers, setAnswers] = useState({})
  // predictions: { [widgetId]: optionKey } - locked before the run unlocks
  const [predictions, setPredictions] = useState({})
  // runData: per-widget scratch (model outputs, tallies, game scores)
  const [runData, setRunData] = useState({})
  // bingo: { [squareIndex]: widgetLabelWhereSeen }
  const [bingo, setBingo] = useState({})

  const instructorMode = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('mode') === 'instructor'
    } catch {
      return false
    }
  }, [])

  // One-shot: the first answer sticks. Instructor mode may re-click freely.
  const setAnswer = (widgetId, questionId, optionKey) =>
    setAnswers((a) => {
      if (!instructorMode && a[widgetId]?.[questionId]) return a
      return { ...a, [widgetId]: { ...(a[widgetId] || {}), [questionId]: optionKey } }
    })

  const lockPrediction = (widgetId, optionKey) =>
    setPredictions((p) => (p[widgetId] && !instructorMode ? p : { ...p, [widgetId]: optionKey }))

  const setWidgetData = (widgetId, patch) =>
    setRunData((d) => ({ ...d, [widgetId]: { ...(d[widgetId] || {}), ...patch } }))

  const claimBingo = (squareIndex, widgetLabel) =>
    setBingo((b) => ({ ...b, [squareIndex]: widgetLabel }))

  const value = {
    studentName, setStudentName,
    started, setStarted,
    index, setIndex,
    answers, setAnswer,
    predictions, lockPrediction,
    runData, setWidgetData,
    bingo, claimBingo,
    instructorMode,
  }
  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error('useLab outside LabProvider')
  return ctx
}
