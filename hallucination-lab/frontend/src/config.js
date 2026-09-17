// Per-semester configuration. Edit before each run of the lab.

// W7 faculty name. PRD open decision 3: pick a willing Barry colleague and
// get their permission first, then set FACULTY_NAME here and in proxy/.env.
// Until then the widget runs on an obviously fictional stand-in. The old
// placeholder spelled its own file path into the model's fabricated quote,
// which students saw. FACULTY_NAME_IS_PLACEHOLDER drives an instructor-only
// banner instead; set it to false when a real name goes in.
export const FACULTY_NAME = 'Dr. Ellen Marsh'
export const FACULTY_NAME_IS_PLACEHOLDER = true
export const FACULTY_FIELD = 'nursing'

// Proxy base path. Same-origin '/api' works for the dev server and for the
// production layout where the proxy serves the static build. Set an absolute
// URL if the frontend is hosted separately from the proxy.
export const API_BASE = '/api'

// Per-call timeout before falling back to a recorded run (PRD: 10 s).
//
// 10 s is the right number for a room full of students: nobody waits longer
// than that before the lab drops to a transcript. It is the wrong number for
// demonstrating the live path, because the Barry gateway's floor on
// gemma-4-31b-it is about 11 s for even a short answer, so at 10 s nothing is
// ever live. The preview build raises it via VITE_CALL_TIMEOUT_MS; production
// is static and never calls anything, so its value is academic.
export const CALL_TIMEOUT_MS = Number(import.meta.env.VITE_CALL_TIMEOUT_MS) || 10000

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
