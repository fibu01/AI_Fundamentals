import React from 'react'
import { TECHNIQUES, composePreview } from '../lib/techniques.js'

// Checkbox panel of lecture techniques plus a live preview of the prompt the
// toggles build. available: technique keys this widget supports.
export default function TechniquePanel({ available, selected, onChange, basePrompt, disabled }) {
  function toggle(key) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }
  const parts = composePreview(basePrompt, selected)

  return (
    <div className="technique-panel">
      <p className="question-text">Techniques from Tuesday (each one edits the prompt below):</p>
      <div className="technique-toggles">
        {available.map((key) => (
          <label key={key} className="technique-toggle">
            <input
              type="checkbox"
              checked={selected.includes(key)}
              disabled={disabled}
              onChange={() => toggle(key)}
            />
            <span>{TECHNIQUES[key].label}</span>
          </label>
        ))}
      </div>
      <div className="prompt-preview" aria-label="The prompt that will be sent">
        <div className="prompt-preview-title">The prompt this builds:</div>
        {parts.map((p, i) => (
          <p key={i} className={p.technique ? 'prompt-added' : ''}>
            {p.technique && <span className="added-tag">{TECHNIQUES[p.technique].short}: </span>}
            {p.text}
          </p>
        ))}
        {selected.includes('low_temp') && (
          <p className="prompt-added"><span className="added-tag">Setting: </span>{TECHNIQUES.low_temp.settingText}</p>
        )}
      </div>
    </div>
  )
}
