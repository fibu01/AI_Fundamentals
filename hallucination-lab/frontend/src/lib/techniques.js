// The technique toggles from the Tuesday lecture. Each toggle visibly adds
// text to the prompt (or changes a sampling setting) so students watch the
// prompt change before they run it. The proxy composes the real prompt from
// the same definitions (proxy/templates.py); the browser only sends the
// technique keys, never prompt text.

export const TECHNIQUES = {
  ground: {
    label: 'Ground it: paste the source text into the prompt',
    short: 'Ground with source',
    promptText: '[The full text of Florida Statute 692.203 is pasted here.]\n\nAnswer using ONLY the source text above.',
  },
  fallback: {
    label: 'Add an escape hatch: allow "Information not found"',
    short: 'Escape hatch',
    promptText: 'If the exact answer is not in the source text, state Information not found. Do not extrapolate.',
  },
  cite_check: {
    label: 'Demand checkable citations only',
    short: 'Checkable citations',
    promptText: 'Only cite cases or sources you are certain exist and can name exactly. If you cannot, say that you cannot verify a source instead of citing one.',
  },
  low_temp: {
    label: 'Turn temperature down from 0.9 to 0.2',
    short: 'Low temperature',
    promptText: null, // sampling setting, not prompt text
    settingText: 'temperature: 0.9 → 0.2 (picks the most likely words instead of sampling widely)',
  },
  basis: {
    label: 'Ask the model to state what its answer is based on',
    short: 'State your basis',
    promptText: 'Before answering, state in one sentence what your answer is based on.',
  },
}

export function composePreview(basePrompt, selected) {
  const parts = []
  if (selected.includes('ground')) parts.push({ text: TECHNIQUES.ground.promptText, technique: 'ground' })
  parts.push({ text: basePrompt, technique: null })
  for (const key of ['fallback', 'cite_check', 'basis']) {
    if (selected.includes(key)) parts.push({ text: TECHNIQUES[key].promptText, technique: key })
  }
  return parts
}
