import React, { createContext, useContext, useMemo, useState } from 'react'

// All lab state lives in memory only. Closing the tab loses progress;
// the landing page says so. Nothing is persisted or sent anywhere except
// the model calls in lib/api.js.

const LabContext = createContext(null)

export function LabProvider({ children }) {
  const [studentName, setStudentName] = useState('')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  // answers: { [widgetId]: { [questionId]: optionKey } }
  const [answers, setAnswers] = useState({})
  // runData: per-widget scratch (model outputs, tallies) so Back keeps results
  const [runData, setRunData] = useState({})

  const instructorMode = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('mode') === 'instructor'
    } catch {
      return false
    }
  }, [])

  const setAnswer = (widgetId, questionId, optionKey) =>
    setAnswers((a) => ({
      ...a,
      [widgetId]: { ...(a[widgetId] || {}), [questionId]: optionKey },
    }))

  const setWidgetData = (widgetId, patch) =>
    setRunData((d) => ({ ...d, [widgetId]: { ...(d[widgetId] || {}), ...patch } }))

  const value = {
    studentName, setStudentName,
    started, setStarted,
    index, setIndex,
    answers, setAnswer,
    runData, setWidgetData,
    instructorMode,
  }
  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error('useLab outside LabProvider')
  return ctx
}
