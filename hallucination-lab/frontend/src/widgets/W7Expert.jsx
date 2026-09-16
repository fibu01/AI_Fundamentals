import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { FACULTY_NAME, FACULTY_FIELD, SLIDES } from '../config.js'

function fillTemplate(text) {
  return text.replaceAll('{{FACULTY_NAME}}', FACULTY_NAME).replaceAll('{{FACULTY_FIELD}}', FACULTY_FIELD)
}

function Body() {
  const { data, run, loading } = useRun('w7')
  const res = data.result
  const text = res ? fillTemplate(res.data?.text || '') : ''
  // Pull the quoted string for the barry.edu site search.
  const quoteMatch = text.match(/"([^"]{20,300})"/)
  const quote = quoteMatch ? quoteMatch[1] : ''

  return (
    <div>
      <p className="muted">
        The named colleague agreed to this demo in advance. Everything the model says about them below is fabricated;
        that is the point of the widget.
      </p>
      <button className="btn-primary" disabled={loading} onClick={() => run({})}>
        {loading ? 'Asking the Lab Model...' : `Ask for a direct quote from ${FACULTY_NAME}`}
      </button>
      {res && (
        <>
          <OutputPanel source={res.source} recordedDate={res.recordedDate} provenance={res.provenance}>{text}</OutputPanel>
          {quote && (
            <p>
              <a
                href={`https://www.google.com/search?q=site%3Abarry.edu+%22${encodeURIComponent(quote.slice(0, 120))}%22`}
                target="_blank"
                rel="noreferrer"
              >
                Search barry.edu for this quote
              </a>
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default {
  id: 'w7',
  label: 'W7',
  section: 'B. Hallucination',
  title: 'Fabricated Expert',
  priority: 'P0',
  instruction: 'Ask the model for a real professor’s quote, then search for the publication it names.',
  intro: {
    lead: 'Fabrication gets personal here. You will ask the model for a direct quote from a real Barry professor, and it will produce one, with a named publication, because quotes-with-sources is a pattern it has seen millions of times. This is the failure that puts invented words in a real person’s mouth in a student paper. The professor named here agreed to be the test subject.',
    terms: [
      ['Attribution', 'Tying words to the specific person who said them. A model can generate the format of attribution without any of the fact.'],
      ['Defamation risk', 'Publishing invented statements as someone’s real words can harm their reputation; "the AI wrote it" is not a defense.'],
    ],
  },
  predict: {
    text: 'Asked for a direct quote from a named professor, the Lab Model will:',
    options: [
      { key: 'a', label: 'Say it has no record of that person' },
      { key: 'b', label: 'Give a quote but refuse to name a publication' },
      { key: 'c', label: 'Produce a polished quote AND a named publication, both invented' },
      { key: 'd', label: 'Produce a real quote from its training data' },
    ],
  },
  Body,
  questions: [
    {
      id: 'q1',
      text: 'Did the quoted publication exist?',
      options: [
        { key: 'yes', label: 'Yes' },
        { key: 'no', label: 'No' },
        { key: 'unclear', label: 'Could not tell' },
      ],
      correct: 'no',
      explain:
        'The model attached a real person’s name to a quote and a publication it generated on the spot. A search of barry.edu and the named outlet turns up nothing, because neither the interview nor the quote ever happened.',
      slide: SLIDES.fabrication,
    },
    {
      id: 'q2',
      text: 'What is the risk if this appeared in a student paper?',
      options: [
        { key: 'a', label: 'None, it sounds right' },
        { key: 'b', label: 'A fabricated quote attributed to a real person, which is a plagiarism and defamation problem' },
        { key: 'c', label: 'The formatting is wrong' },
        { key: 'd', label: 'The professor would be flattered' },
      ],
      correct: 'b',
      explain:
        'Putting invented words in a real person’s mouth is an academic integrity violation and can harm that person’s reputation. The fix is the same routine as always: locate the source before you quote it.',
      slide: SLIDES.verification,
    },
  ],
}
