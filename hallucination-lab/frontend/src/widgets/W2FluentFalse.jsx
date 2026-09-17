import React from 'react'
import { useLab } from '../lib/store.jsx'
import { W2_REAL, W2_FAKE, W2_REAL_SIDE } from '../data/w2content.js'
import { SLIDES } from '../config.js'

function highlightFabrications(text, fabricated) {
  let parts = [text]
  for (const frag of fabricated) {
    parts = parts.flatMap((p) => {
      if (typeof p !== 'string') return [p]
      const i = p.indexOf(frag)
      if (i === -1) return [p]
      return [
        p.slice(0, i),
        <mark key={frag} style={{ background: '#ffd6dd' }}>{frag}</mark>,
        p.slice(i + frag.length),
      ]
    })
  }
  return parts
}

function Body() {
  const { runData, answers } = useLab()
  const revealed = !!runData.w2?.revealed || !!answers.w2?.q1
  const real = <p>{W2_REAL.text}</p>
  const fake = revealed
    ? <p>{highlightFabrications(W2_FAKE.text, W2_FAKE.fabricated)}</p>
    : <p>{W2_FAKE.text}</p>
  const left = W2_REAL_SIDE === 'left' ? real : fake
  const right = W2_REAL_SIDE === 'left' ? fake : real

  return (
    <div>
      <div className="compare">
        <div className="pane">
          <h3>Left</h3>
          <div className="pane-body">{left}</div>
          {revealed && W2_REAL_SIDE === 'left' && <p className="muted">Real. Source: <a href={W2_REAL.url} target="_blank" rel="noreferrer">barry.edu</a> (captured {W2_REAL.captureDate})</p>}
          {revealed && W2_REAL_SIDE !== 'left' && <p className="muted">Fabricated. Highlighted details are invented.</p>}
        </div>
        <div className="pane">
          <h3>Right</h3>
          <div className="pane-body">{right}</div>
          {revealed && W2_REAL_SIDE === 'right' && <p className="muted">Real. Source: <a href={W2_REAL.url} target="_blank" rel="noreferrer">barry.edu</a> (captured {W2_REAL.captureDate})</p>}
          {revealed && W2_REAL_SIDE !== 'right' && <p className="muted">Fabricated. Highlighted details are invented.</p>}
        </div>
      </div>
      {!revealed && <p className="muted">Answer Q1 below to reveal which is which.</p>}
      {/* A .sr-only "Reveal answer" button used to sit here. It is visually
          hidden but still focusable, so a keyboard or screen-reader user could
          tab straight onto the answer to Q1 before answering it. Answering Q1
          reveals both panes for everyone, so the shortcut was redundant as well
          as leaky. */}
    </div>
  )
}

export default {
  id: 'w2',
  label: 'W2',
  section: 'A. How the model produces text',
  title: 'Fluent and False',
  priority: 'P0',
  instruction: 'Read both paragraphs about a Barry University building and decide which one is real.',
  intro: {
    lead: 'W1 showed the model predicting words by pattern. Here is the consequence: a machine that has read thousands of university web pages can write a perfect-sounding campus page about a building that does not exist. Your job is to tell the real Barry paragraph from the invented one, using only what is on the screen, which is exactly the situation you are in every time an AI answers you.',
    terms: [
      ['Fluency', 'How natural and polished text sounds. Models are trained to maximize it, so fluency tells you nothing about truth.'],
      ['Fabrication', 'Invented content stated as fact: names, dates, donors, buildings. It comes from the same word-prediction as everything else.'],
    ],
  },
  predict: {
    text: 'How confident are you that you can spot the fake paragraph without looking anything up?',
    options: [
      { key: 'a', label: 'Certain; fakes have obvious tells' },
      { key: 'b', label: 'Probably; the writing will be slightly off' },
      { key: 'c', label: 'Coin flip; both will read the same' },
      { key: 'd', label: 'The fake will actually read better' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Which paragraph was real?',
      options: [
        { key: 'left', label: 'Left' },
        { key: 'right', label: 'Right' },
        { key: 'both', label: 'Both' },
        { key: 'neither', label: 'Neither' },
      ],
      correct: () => W2_REAL_SIDE,
      explain:
        'The real paragraph describes the Monsignor William Barry Memorial Library and comes verbatim from barry.edu. The other paragraph invents a building, a donor, and every date in it, while copying the tone of a real campus page.',
      slide: SLIDES.fluentFalse,
    },
    {
      id: 'q2',
      text: 'What made the fake one convincing?',
      options: [
        { key: 'a', label: 'It had fewer errors' },
        { key: 'b', label: 'It copied the tone and structure of a real source' },
        { key: 'c', label: 'It was shorter' },
        { key: 'd', label: 'It had a citation' },
      ],
      correct: 'b',
      explain:
        'Language models reproduce the style of the text they trained on: campus pages have a recognizable voice, so the fabricated paragraph sounds institutional. Fluency and formatting carry no information about truth.',
      slide: SLIDES.fluentFalse,
    },
  ],
}
