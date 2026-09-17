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

// Full citations, not just party names. Citation Sort renders the model's
// fabrications next to real cases; when the fabricated rows lost their reporter
// numbers and the real rows kept theirs, three of six rows were identifiable at
// a glance and the module taught that fakes look different. They do not.
// Returns "Name v. Name, 361 So. 3d 884 (Fla. 2d DCA 2023)" where the reporter
// span is present, and the bare name where it is not.
export function extractCitations(text) {
  return extractCaseNames(text).map((name) => {
    // Look for the reporter span that follows this name in the source text:
    // ", 361 So. 3d 884 (Fla. 2d DCA 2023)".
    const at = text.indexOf(name)
    if (at < 0) return { name, full: name }
    // The live model bolds the case name: "1. **State v. Moore**, 326 So. 3d
    // 1105 (Fla. 4th DCA 2021)." The reporter span sits behind the closing
    // asterisks, so without skipping emphasis the tail never matched and the
    // fabricated rows lost their citations, which is precisely the formatting
    // tell the sort panel must not have.
    // Skip markdown emphasis and the period the model leaves on anonymised
    // party names ("State v. S.M., 358 So. 3d 1120 (Fla. 2d DCA 2023)"), where
    // extractCaseNames has already trimmed the trailing dot off the name.
    const tail = text.slice(at + name.length, at + name.length + 90).replace(/^[*_\s.,]+/, '')
    const m = tail.match(/^,?\s*(\d+\s+[A-Za-z.]+(?:\s+[A-Za-z0-9.]+){0,3}\s+\d+\s*\([^)]{1,40}\))/)
    return { name, full: m ? `${name}, ${m[1]}` : name }
  })
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
  // "not real", "hallucinated" and "fabricated" are how gemma-4-31b-it backs
  // down, and they were all missing here: a full retraction scored as a
  // re-assertion and the counter told students the opposite of the transcript.
  const admitted = /cannot verify|can't verify|do not know|don't know|not able to confirm|may not exist|i made that up|not a real|not real|hallucinat|fabricat|made (them|that|it) up|no such (case|decision)/.test(t)
  return { apologized, admitted, reasserted: !admitted }
}

// Pull person names out of a numbered or bulleted list answer (W8).
export function extractListNames(text) {
  // The seed transcripts were plain "1. Alan Turing". The live model writes
  // "1. **Alan Turing**: Formalized the concepts of algorithms..." and
  // "1. **Ada Lovelace** (United Kingdom) - Often credited as...", so the old
  // parser matched the line, kept the whole thing including the description,
  // then rejected it for starting with an asterisk. Every name was dropped and
  // W8 tallied zero.
  const names = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:\d+[.)]|[-*•])\s*(.+?)\s*$/)
    if (!m) continue
    const name = m[1]
      .replace(/\*\*|__/g, '')                 // markdown emphasis
      .split(/\s*[:–—]\s*|\s+-\s+/)[0]  // drop the description after : or a dash
      .replace(/\s*\(.*$/, '')                 // drop "(United Kingdom)"
      .replace(/[.,;:]$/, '')
      .trim()
    if (name && /^[A-Z]/.test(name)) names.push(name)
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
