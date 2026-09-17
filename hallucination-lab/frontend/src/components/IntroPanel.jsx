import React from 'react'
import { HEADER_IMAGES } from '../data/manifests.js'

// Stage-setting card at the top of every module: what this module
// demonstrates, and definitions for terms a fundamentals student has not
// met before. intro = { lead: string, terms: [[term, definition], ...] }
export default function IntroPanel({ widgetId, intro }) {
  if (!intro) return null
  const hasHeader = HEADER_IMAGES.includes(widgetId)
  return (
    <div className="intro-card">
      {hasHeader && (
        <img src={`images/headers/${widgetId}.png`} alt="" className="intro-illustration" />
      )}
      <div>
        <p className="intro-lead">{intro.lead}</p>
        {intro.terms?.length > 0 && (
          <dl className="term-list">
            {intro.terms.map(([term, def]) => (
              <div className="term-row" key={term}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
