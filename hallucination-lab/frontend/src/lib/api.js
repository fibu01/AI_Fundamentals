import { API_BASE, CALL_TIMEOUT_MS } from '../config.js'

// Set at build time for static hosting (GitHub Pages): there is no proxy to
// call, so go straight to the recorded transcripts with no failed round trip.
const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY === '1'

// Bundled recorded fallbacks: the lab must run even if both the gateway and
// the proxy are down (PRD section 4). Vite inlines these JSON files into the
// static build.
import w1 from '../data/recorded/w1.json'
import w3 from '../data/recorded/w3.json'
import w4 from '../data/recorded/w4.json'
import w5 from '../data/recorded/w5.json'
import w7 from '../data/recorded/w7.json'
import w8 from '../data/recorded/w8.json'
import w9 from '../data/recorded/w9.json'
import w10 from '../data/recorded/w10.json'
import w13 from '../data/recorded/w13.json'

const BUNDLED = { w1, w3, w4, w5, w7, w8, w9, w10, w13 }

function pickRun(recorded) {
  const runs = recorded.runs || []
  const run = runs[Math.floor(Math.random() * runs.length)] || {}
  return {
    ok: true,
    source: 'recorded',
    recordedDate: recorded.recorded_date,
    provenance: recorded.provenance || 'seed',
    data: run,
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = CALL_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// Run a widget's approved template through the proxy. `inputs` carries only
// the student-controlled fields that template accepts (a stem, a transcript,
// an image id). On timeout or any failure, fall back to the proxy's recorded
// file, then to the bundled recorded file. Never throws; always returns
// { ok, source: 'live' | 'recorded', data, recordedDate? }.
export async function runWidget(widgetId, inputs = {}) {
  if (STATIC_ONLY) {
    if (BUNDLED[widgetId]) return pickRun(BUNDLED[widgetId])
    return { ok: false, source: 'none', data: null }
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/run/${widgetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs }),
    })
    if (res.ok) {
      const data = await res.json()
      return { ok: true, source: 'live', data }
    }
  } catch {
    // fall through to recorded
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE}/recorded/${widgetId}`, {}, 4000)
    if (res.ok) return pickRun(await res.json())
  } catch {
    // fall through to bundled
  }

  if (BUNDLED[widgetId]) return pickRun(BUNDLED[widgetId])
  return { ok: false, source: 'none', data: null }
}

// Force a recorded run (used by instructor mode's recorded-only toggle and
// by widgets marked recorded-only).
export function recordedRun(widgetId) {
  if (BUNDLED[widgetId]) return pickRun(BUNDLED[widgetId])
  return { ok: false, source: 'none', data: null }
}
