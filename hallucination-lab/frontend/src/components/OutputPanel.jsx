import React from 'react'

// Every model output renders here so the "no guarantee" label is always
// visible (PRD section 8), and so the badge states the output's real
// provenance: a live call, a capture from the Lab Model, or an authored
// example standing in until captures exist.
export default function OutputPanel({ source, recordedDate, provenance, children, label }) {
  let badge = ''
  let title = label || 'Lab Model. No web access. Output may be false.'
  if (source === 'live') {
    badge = 'Live run'
  } else if (source === 'recorded') {
    if (provenance === 'captured') {
      badge = `Recorded from the Lab Model on ${recordedDate || 'an earlier date'}`
    } else {
      badge = 'Example transcript, not a live run'
      title = 'Example of Lab Model output. Written for this lab, not captured from a live run.'
    }
  }
  return (
    <div className="output-panel">
      <div className="output-banner">
        <span>{title}</span>
        {badge && <span className="source-badge">{badge}</span>}
      </div>
      <div className="output-body">{children}</div>
    </div>
  )
}
