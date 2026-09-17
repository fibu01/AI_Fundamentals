import React, { useState } from 'react'
import { useLab } from '../lib/store.jsx'
import { W12_GRIDS, W12_EXT } from '../data/manifests.js'
import LabImage from '../components/LabImage.jsx'
import { SLIDES } from '../config.js'

const GENDERS = ['Male', 'Female', 'Unclear']
const TONES = ['Lighter', 'Darker', 'Unclear tone']

export function ceoMaleShare(tallies) {
  const grid = tallies?.ceo || {}
  let male = 0, judged = 0
  for (const t of Object.values(grid)) {
    if (t.gender && t.gender !== 'Unclear') {
      judged++
      if (t.gender === 'Male') male++
    }
  }
  return judged > 0 ? male / judged : null
}

function Body() {
  const { runData, setWidgetData } = useLab()
  const tallies = runData.w12?.tallies || {}
  const [gridId, setGridId] = useState('ceo')
  const grid = W12_GRIDS.find((g) => g.id === gridId)
  const gridTally = tallies[gridId] || {}

  function setCell(i, field, value) {
    const next = {
      ...tallies,
      [gridId]: { ...gridTally, [i]: { ...(gridTally[i] || {}), [field]: value } },
    }
    setWidgetData('w12', { tallies: next, ceoShare: ceoMaleShare(next) })
  }

  const judged = Object.values(gridTally).filter((t) => t.gender && t.gender !== 'Unclear')
  const malePct = judged.length ? Math.round((judged.filter((t) => t.gender === 'Male').length / judged.length) * 100) : null

  return (
    <div>
      <div role="tablist" aria-label="Prompt grids" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {W12_GRIDS.map((g) => (
          <button key={g.id} role="tab" aria-selected={g.id === gridId} className={g.id === gridId ? 'btn-primary' : ''} onClick={() => setGridId(g.id)}>
            "{g.prompt}"
          </button>
        ))}
      </div>
      <p className="muted">
        16 images generated before class for the prompt "{grid.prompt}" (generated {grid.generatedDate}).
        Tally each image: apparent gender presentation and apparent skin tone. "Unclear" is a valid tally.
        {gridId === 'ceo'
          ? ' The question below asks for this grid\u2019s share, so finish this one.'
          : ' A partial tally is enough here; you are looking for the direction of the skew, not a precise number.'}
      </p>
      <div className="img-grid">
        {Array.from({ length: grid.count }, (_, i) => (
          <div className="img-cell" key={i}>
            <LabImage base={`images/w12/${grid.id}/${i + 1}`} ext={W12_EXT} alt={`Generated image ${i + 1} of 16 for the prompt "${grid.prompt}"`} />
            <div className="cell-controls" role="group" aria-label={`Gender tally for image ${i + 1}`}>
              {GENDERS.map((g) => (
                <button key={g} aria-pressed={gridTally[i]?.gender === g} onClick={() => setCell(i, 'gender', g)}>{g}</button>
              ))}
            </div>
            <div className="cell-controls" role="group" aria-label={`Skin tone tally for image ${i + 1}`}>
              {TONES.map((t) => (
                <button key={t} aria-pressed={gridTally[i]?.tone === t} onClick={() => setCell(i, 'tone', t)}>{t}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p aria-live="polite">
        {malePct == null
          ? 'No gender tallies yet for this grid.'
          : `Your tally so far for "${grid.prompt}": ${malePct}% presented as male (of ${judged.length} judged).`}
      </p>
    </div>
  )
}

const shareBucket = (share) =>
  share == null ? null : share < 0.25 ? 'under25' : share <= 0.5 ? '25to50' : share <= 0.75 ? '50to75' : 'over75'

export default {
  id: 'w12',
  label: 'W12',
  section: 'C. Bias from training data',
  title: 'Picture the Job',
  priority: 'P0',
  instruction: 'Tally the CEO grid, then compare it against at least one of the other three.',
  intro: {
    lead: 'In W8 you could steer the text model with one extra sentence. Image models give you no such lever here: these grids were generated before class from four bare prompts, and what came back is what came back. An image generator learns from billions of captioned photos, so "a CEO" returns what the internet photographed and labeled as CEOs, not who holds the job. This time you are the measuring instrument. Tally the CEO grid in full, because the question below asks for that number, then tally enough of at least one other grid to see whether the skew runs the same way. "Unclear" is a legitimate tally; do not force a read. The fourth prompt, "a person receiving welfare", is in here on purpose: it is where a generator\u2019s assumptions are hardest to look at and most worth measuring. You are recording what the model produced, not making a claim about any real person.',
    terms: [
      ['Image model', 'A generator (Gemini, Imagen, DALL-E) trained on photo-caption pairs. It reproduces the pairing statistics of its data.'],
      ['Representation bias', 'When the training photos over-represent some pairings of job and demographic, the generated "typical" person inherits that skew.'],
    ],
  },
  predict: {
    text: 'In the 16 images for "a CEO", what share do you expect to present as male?',
    options: [
      { key: 'a', label: 'Under 25%' },
      { key: 'b', label: '25 to 50%' },
      { key: 'c', label: '50 to 75%' },
      { key: 'd', label: 'Over 75%' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'In the CEO grid, roughly what share presented as male?',
      options: [
        { key: 'under25', label: 'Under 25%' },
        { key: '25to50', label: '25 to 50%' },
        { key: '50to75', label: '50 to 75%' },
        { key: 'over75', label: 'Over 75%' },
      ],
      needs: (d) => d.ceoShare != null,
      needsHint: 'Tally the gender column on the CEO grid first. This question opens once you have tallied at least one image there.',
      correct: (d) => shareBucket(d.ceoShare),
      explain: (d) =>
        d.ceoShare == null
          ? 'Tally the CEO grid first, then answer from your own counts.'
          : `Your CEO tally works out to ${Math.round(d.ceoShare * 100)}% presenting as male. Compare that against the other three grids and against who actually holds these jobs.`,
      slide: SLIDES.imageBias,
    },
    {
      id: 'q2',
      text: 'Image models learn from captioned photos online. What does that imply about these grids?',
      options: [
        { key: 'a', label: 'They show reality' },
        { key: 'b', label: 'They show what the internet photographed and labeled most often' },
        { key: 'c', label: 'The model is malicious' },
        { key: 'd', label: 'Nothing' },
      ],
      correct: 'b',
      explain:
        'The generator reproduces the caption-photo pairs it saw. Stock photography and news images over-represent some pairings of job and demographic, so the grids mirror the internet’s photo archive, not the workforce.',
      slide: SLIDES.imageBias,
    },
  ],
}
