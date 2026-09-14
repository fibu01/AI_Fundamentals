// Shared text-analysis helpers for widget bodies.

// Case names like "State v. Pemberton" or "Cruz v. City of Hialeah".
export function extractCaseNames(text) {
  const re = /([A-Z][A-Za-z'.,-]+(?: [A-Z][A-Za-z'.,-]+)*)\s+v\.\s+([A-Z][A-Za-z'.,-]+(?: [A-Za-z'.,-]+)*)/g
  const names = []
  let m
  while ((m = re.exec(text)) !== null) {
    names.push(`${m[1]} v. ${m[2]}`.replace(/[,.]$/, ''))
    if (names.length >= 5) break
  }
  return [...new Set(names)]
}

// Numbers worth checking against the statute: integers, decimals,
// dollar figures with commas, section numbers like 692.203.
export function extractNumbers(text) {
  const re = /\$?\d{1,4}(?:,\d{3})*(?:\.\d+)?/g
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    out.push({ raw: m[0], index: m.index })
  }
  return out
}

export function normalizeNumber(raw) {
  return raw.replace(/^\$/, '')
}

// Crude apology / reassertion classifier for W4's counter. Heuristic only;
// the student reads the transcript either way.
export function classifyChallengeReply(text) {
  const t = text.toLowerCase()
  const apologized = /apolog|i'm sorry|i am sorry|you are right|you're right|correct the record/.test(t)
  const admitted = /cannot verify|can't verify|do not know|don't know|not able to confirm|may not exist|i made that up|not a real/.test(t)
  return { apologized, admitted, reasserted: !admitted }
}

// Pull person names out of a numbered or bulleted list answer (W8).
export function extractListNames(text) {
  const names = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:\d+[.)]|[-*•])\s*(.+?)\s*$/)
    if (m) {
      const name = m[1].replace(/\s*\(.*\)\s*$/, '').replace(/[.,;:]$/, '').trim()
      if (name && /^[A-Z]/.test(name)) names.push(name)
    }
  }
  return names
}

export function tally(items) {
  const counts = new Map()
  for (const it of items) counts.set(it, (counts.get(it) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

export function round(x, d = 2) {
  const f = 10 ** d
  return Math.round(x * f) / f
}

// First integer 1-10 in a scoring reply (W10).
export function extractScore(text) {
  const m = text.match(/\b(10|[1-9])\b/)
  return m ? parseInt(m[1], 10) : null
}
