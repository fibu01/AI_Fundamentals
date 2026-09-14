import React from 'react'

// Labeled horizontal bars. Values render as text next to each bar so no
// information is carried by color alone (WCAG requirement in PRD section 8).
// rows: [{ label, value, display?, alt? }]
export default function Bars({ rows, max, title, formatValue }) {
  const m = max ?? Math.max(...rows.map((r) => r.value), 0.0001)
  const fmt = formatValue || ((v) => String(v))
  return (
    <div className="bars" role="img" aria-label={title || 'Bar chart'}>
      {title && <div className="muted">{title}</div>}
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track">
            <span
              className={r.alt ? 'bar-fill alt' : 'bar-fill'}
              style={{ width: `${Math.max(1, (r.value / m) * 100)}%` }}
            />
          </span>
          <span className="bar-value">{r.display ?? fmt(r.value)}</span>
        </div>
      ))}
    </div>
  )
}
