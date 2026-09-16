import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { W13_IMAGES } from '../data/manifests.js'
import LabImage from '../components/LabImage.jsx'
import { SLIDES } from '../config.js'

function Body() {
  const { data, setData, run, loading } = useRun('w13')
  const picked = data.picked || null
  const res = data.result
  const img = W13_IMAGES.find((i) => i.id === picked)

  let modelAnswer = null
  if (res && img) {
    if (res.source === 'live') {
      const m = String(res.data.text || '').match(/\d+/)
      modelAnswer = m ? parseInt(m[0], 10) : null
    } else {
      modelAnswer = res.data.answers?.[img.id] ?? null
    }
  }
  const offBy = modelAnswer != null && img ? Math.abs(modelAnswer - img.trueCount) : null

  return (
    <div>
      <div className="img-grid">
        {W13_IMAGES.map((i) => (
          <div className="img-cell" key={i.id}>
            <button
              aria-pressed={picked === i.id}
              onClick={() => setData({ picked: i.id, result: null, offBy: null })}
              style={{ padding: 4, width: '100%' }}
            >
              <LabImage base={`images/w13/${i.id}`} alt={i.label} />
              {i.label}
            </button>
          </div>
        ))}
      </div>
      <button
        className="btn-primary"
        disabled={!picked || loading}
        onClick={async () => {
          const r = await run({ image_id: picked })
          const chosen = W13_IMAGES.find((i) => i.id === picked)
          let ans = null
          if (r?.source === 'live') {
            const m = String(r.data?.text || '').match(/\d+/)
            ans = m ? parseInt(m[0], 10) : null
          } else {
            ans = r?.data?.answers?.[picked] ?? null
          }
          setData({ offBy: ans != null ? Math.abs(ans - chosen.trueCount) : null })
        }}
      >
        {loading ? 'Asking the Lab Model...' : 'Ask: How many items are in this image?'}
      </button>
      {modelAnswer != null && img && (
        <OutputPanel source={res.source} recordedDate={res.recordedDate}>
          {`Model answer: ${modelAnswer}\nTrue count (${img.label}): ${img.trueCount}\nDifference: ${offBy}`}
        </OutputPanel>
      )}
    </div>
  )
}

const offBucket = (off) => (off == null ? null : off === 0 ? 'exact' : off <= 2 ? 'off1to2' : 'off3plus')

export default {
  id: 'w13',
  label: 'W13',
  section: 'D. Visual hallucination',
  title: 'Count the Coins',
  priority: 'P1',
  instruction: 'Pick an image, ask the model to count the items, then compare against the true count.',
  intro: {
    lead: 'Hallucination is not only a text problem. A vision model does not count objects the way you do, one by one; it encodes the image as a grid of patches and produces a number that fits how the scene looks. Around fifteen to thirty similar objects, that estimate is confidently and plausibly wrong. Pick an image, get the model’s count, then check it against the true count. Run a second image before you decide the first was a fluke.',
    terms: [
      ['Patch', 'A small square of the image, the unit a vision model actually processes. "About twenty coins" is a judgment on texture, not an enumeration.'],
      ['Vision-language model', 'A model that takes images plus text and answers in text, with all of the text side’s confident-guess behavior.'],
    ],
  },
  predict: {
    text: 'Asked to count 15 to 30 similar objects in a photo, the model will typically be:',
    options: [
      { key: 'a', label: 'Exact; counting is easy for computers' },
      { key: 'b', label: 'Off, but plausibly, by a handful' },
      { key: 'c', label: 'Wildly off, by 10x' },
      { key: 'd', label: 'Unwilling to give a number' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'How far off was the model on your image?',
      options: [
        { key: 'exact', label: 'Exact' },
        { key: 'off1to2', label: 'Off by 1 to 2' },
        { key: 'off3plus', label: 'Off by 3 or more' },
      ],
      correct: (d) => offBucket(d.offBy),
      explain: (d) =>
        d.offBy == null
          ? 'Pick an image and run the count first.'
          : `On your image the model was off by ${d.offBy}. An exact answer happens sometimes; run a second image and the error usually shows up.`,
      slide: SLIDES.visionCounting,
    },
    {
      id: 'q2',
      text: 'Why does a vision model miscount?',
      options: [
        { key: 'a', label: 'The image was blurry' },
        { key: 'b', label: 'It processes the image as patches of texture rather than counting objects' },
        { key: 'c', label: 'It ran out of time' },
        { key: 'd', label: 'It counted shadows' },
      ],
      correct: 'b',
      explain:
        'Vision-language models encode an image as a grid of patches and describe what the patches look like. "About twenty coins" is a texture judgment, not an enumeration, so counts of 15 to 30 similar objects come out plausibly wrong.',
      slide: SLIDES.visionCounting,
    },
  ],
}
