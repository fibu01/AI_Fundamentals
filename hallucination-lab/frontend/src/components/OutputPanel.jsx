import React from 'react'

// Every model output in the lab renders inside this panel so the
// "no guarantee" label is always visible (PRD section 8).
export default function OutputPanel({ source, recordedDate, children, label }) {
  let badge = ''
  if (source === 'live') badge = 'Live run'
  else if (source === 'recorded') badge = `Recorded on ${recordedDate || 'an earlier date'}, Lab Model`
  return (
    <div className="output-panel">
      <div className="output-banner">
        <span>{label || 'Lab Model. No web access. Output may be false.'}</span>
        {badge && <span className="source-badge">{badge}</span>}
      </div>
      <div className="output-body">{children}</div>
    </div>
  )
}
