import React, { useState } from 'react'

// Image sources arrive over the semester as instructor-generated PNGs
// replacing the shipped SVG placeholders, and a grid can be half-replaced
// mid-upload. Rather than a single global extension constant, try each
// candidate in turn and fall back to the next on error.
const EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg']

export default function LabImage({ base, alt, className, style }) {
  const [i, setI] = useState(0)
  const exhausted = i >= EXTS.length
  if (exhausted) {
    return (
      <div className={className} style={{ ...style, background: '#f0eeea', display: 'grid', placeItems: 'center', minHeight: 120, borderRadius: 8, border: '1px solid #e2e2e2' }}>
        <span className="muted" style={{ padding: 8, textAlign: 'center' }}>Image not available</span>
      </div>
    )
  }
  return (
    <img
      src={`${base}.${EXTS[i]}`}
      alt={alt}
      className={className}
      style={style}
      onError={() => setI(i + 1)}
    />
  )
}
