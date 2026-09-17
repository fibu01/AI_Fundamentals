// Image manifests for W12, W13, and W14. The build ships placeholder SVGs so
// every widget runs end to end; replace the files in public/images/ with
// instructor-generated images before Thursday and update alt text here.
// PRD section 8: instructor-generated or public-domain images only.

export const W12_GRIDS = [
  { id: 'ceo', prompt: 'a CEO', generatedDate: '2026-09-14', count: 16 },
  { id: 'nurse', prompt: 'a nurse', generatedDate: '2026-09-14', count: 16 },
  { id: 'professor', prompt: 'a professor', generatedDate: '2026-09-14', count: 16 },
  { id: 'welfare', prompt: 'a person receiving welfare', generatedDate: '2026-09-14', count: 16 },
]
// Image files: public/images/w12/{gridId}/{1..16}.svg (or .png once replaced)
export const W12_EXT = 'jpg'

export const W13_IMAGES = [
  { id: 'coins', label: 'Coins on a table', trueCount: 17 },
  { id: 'jellybeans', label: 'Jellybeans in a pile', trueCount: 26 },
  { id: 'toothpicks', label: 'Scattered toothpicks', trueCount: 19 },
  { id: 'pencils', label: 'Pencils in a cup', trueCount: 14 },
  { id: 'books', label: 'Books on a shelf', trueCount: 21 },
  { id: 'crowd', label: 'People in a crowd', trueCount: 24 },
]
export const W13_EXT = 'svg'   // placeholders; set to jpg when real counting photos land

// W14: head-to-head pairs, one real photo and one AI image of the same kind
// of subject. The student picks which is REAL, against a timer, for a streak.
// Placeholders ship so the game runs; replace with the instructor's images
// (docs/IMAGE_PROMPTS.md has the generation prompts and real-photo sourcing)
// and keep artifact/note accurate. File naming: images/w14/{id}_real.EXT and
// images/w14/{id}_ai.EXT.
export const W14_PAIRS = [
  { id: 'pair1', subject: 'A person waving at the camera', artifact: 'Hands and fingers', note: 'Count the fingers and check the knuckle spacing on the AI image.' },
  { id: 'pair2', subject: 'A storefront with signage', artifact: 'Garbled text', note: 'The AI sign letters look like writing from a distance and dissolve up close.' },
  { id: 'pair3', subject: 'An interior staircase', artifact: 'Impossible geometry', note: 'Follow the AI railing: it merges into the wall and the steps do not agree.' },
  { id: 'pair4', subject: 'A person in front of a mirror', artifact: 'Reflections and shadows', note: 'The AI reflection does not match the pose or lag of the subject.' },
  { id: 'pair5', subject: 'Hands holding playing cards', artifact: 'Hands and fingers', note: 'Fingers blend together and the card suits are almost, not quite, real.' },
  { id: 'pair6', subject: 'A crowded street scene', artifact: 'Faces and background lines', note: 'Background faces in the AI image smear, and building lines bend.' },
]
export const W14_EXT = 'jpg'
export const W14_SECONDS = 20

// Module header illustrations are optional polish (see docs/IMAGE_PROMPTS.md).
// List the module ids whose header image is present in
// public/images/headers/; anything not listed renders no <img> at all, so the
// lab never requests a file it knows is missing.
export const HEADER_IMAGES = []
