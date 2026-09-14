// Per-semester configuration. Edit before each run of the lab.

// W7 faculty name. PRD open decision 3: pick a willing Barry colleague and
// get their permission first. The placeholder below makes the fabrication
// obvious until a real name is set.
export const FACULTY_NAME = 'Dr. Jane Facultyname (PLACEHOLDER, set in src/config.js)'
export const FACULTY_FIELD = 'nursing'

// Proxy base path. Same-origin '/api' works for the dev server and for the
// production layout where the proxy serves the static build. Set an absolute
// URL if the frontend is hosted separately from the proxy.
export const API_BASE = '/api'

// Per-call timeout before falling back to a recorded run (PRD: 10 s).
export const CALL_TIMEOUT_MS = 10000

// Descriptive references into the Tuesday deck, used by explain panels.
// Map these to real slide numbers once the deck is final.
export const SLIDES = {
  nextWord: 'Tuesday slide: How the model picks the next word',
  temperature: 'Tuesday slide: Temperature and sampling',
  fluentFalse: 'Tuesday slide: Fluent does not mean true',
  fabrication: 'Tuesday slide: Why models invent citations',
  areYouSure: 'Tuesday slide: The "are you sure" loop',
  grounding: 'Tuesday slide: Grounding answers in a source',
  verification: 'Tuesday slide: The verification routine',
  trainingBias: 'Tuesday slide: Bias comes from the training data',
  feedbackLoops: 'Tuesday slide: Feedback loops in scored decisions',
  imageBias: 'Tuesday slide: What image models learn from captions',
  visionCounting: 'Tuesday slide: Why vision models miscount',
  deepfakes: 'Tuesday slide: Spotting generated images',
}
