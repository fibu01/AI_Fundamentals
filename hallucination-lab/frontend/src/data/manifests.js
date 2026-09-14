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
export const W12_EXT = 'svg'

export const W13_IMAGES = [
  { id: 'coins', label: 'Coins on a table', trueCount: 17 },
  { id: 'jellybeans', label: 'Jellybeans in a pile', trueCount: 26 },
  { id: 'toothpicks', label: 'Scattered toothpicks', trueCount: 19 },
  { id: 'pencils', label: 'Pencils in a cup', trueCount: 14 },
  { id: 'books', label: 'Books on a shelf', trueCount: 21 },
  { id: 'crowd', label: 'People in a crowd', trueCount: 24 },
]
export const W13_EXT = 'svg'

// W14: ten images, five AI-generated and five real. Placeholders ship with
// obviously synthetic content; replace with the instructor's generated images
// and public-domain photos (Wikimedia), keeping isFake and artifact accurate.
export const W14_IMAGES = [
  { id: 'img01', isFake: true, artifact: 'Hands and fingers', note: 'Six fingers on the left hand', alt: 'Portrait of a person waving' },
  { id: 'img02', isFake: false, artifact: null, note: 'Public-domain photo', alt: 'Street market scene' },
  { id: 'img03', isFake: true, artifact: 'Garbled text', note: 'Storefront sign letters are not real characters', alt: 'Storefront with signage' },
  { id: 'img04', isFake: false, artifact: null, note: 'Public-domain photo', alt: 'Mountain landscape' },
  { id: 'img05', isFake: true, artifact: 'Impossible geometry', note: 'Staircase railing merges into the wall', alt: 'Interior staircase' },
  { id: 'img06', isFake: false, artifact: null, note: 'Public-domain photo', alt: 'Dog in a park' },
  { id: 'img07', isFake: true, artifact: 'Reflections and shadows', note: 'Mirror reflection does not match the subject', alt: 'Person in front of a mirror' },
  { id: 'img08', isFake: false, artifact: null, note: 'Public-domain photo', alt: 'City skyline at dusk' },
  { id: 'img09', isFake: true, artifact: 'Hands and fingers', note: 'Fingers blend together holding the cup', alt: 'Person holding a coffee cup' },
  { id: 'img10', isFake: false, artifact: null, note: 'Public-domain photo', alt: 'Sailboat on the water' },
]
export const W14_EXT = 'svg'
