import React, { useState } from 'react'

// Image sources arrive over the semester as instructor-generated PNGs
// replacing the shipped SVG placeholders, and a grid can be half-replaced
// mid-upload. Rather than a single global extension constant, try each
// candidate in turn and fall back to the next on error.
const EXTS = ['jpg', 'svg', 'png', 'jpeg', 'webp']

// `ext` names the extension the lab currently ships for this set, so the
// first request is the right one. The probe below is the fallback for a set
// mid-replacement, not the normal path.
export default function LabImage({ base, alt, className, style, ext }) {
  const order = ext ? [ext, ...EXTS.filter((e) => e !== ext)] : EXTS
  const [i, setI] = useState(0)
  const exhausted = i >= order.length
  if (exhausted) {
    return (
      <div className={className} style={{ ...style, background: '#f0eeea', display: 'grid', placeItems: 'center', minHeight: 120, borderRadius: 8, border: '1px solid #e2e2e2' }}>
        <span className="muted" style={{ padding: 8, textAlign: 'center' }}>Image not available</span>
      </div>
    )
  }
  return (
    <img
      src={`${base}.${order[i]}`}
      alt={alt}
      className={className}
      style={style}
      onError={() => setI(i + 1)}
    />
  )
}
