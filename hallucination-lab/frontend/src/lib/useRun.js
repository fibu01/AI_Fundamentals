import { useState } from 'react'
import { runWidget } from './api.js'
import { useLab } from './store.jsx'

// Shared run-state hook: fires the widget's template through the proxy,
// falls back to recorded, and stores the result in the lab store so results
// survive Back/Next navigation.
export function useRun(widgetId) {
  const { runData, setWidgetData } = useLab()
  const [loading, setLoading] = useState(false)
  const data = runData[widgetId] || {}

  async function run(inputs, key = 'result') {
    setLoading(true)
    try {
      const res = await runWidget(widgetId, inputs)
      setWidgetData(widgetId, { [key]: res })
      return res
    } finally {
      setLoading(false)
    }
  }

  return { data, setData: (patch) => setWidgetData(widgetId, patch), run, loading }
}
