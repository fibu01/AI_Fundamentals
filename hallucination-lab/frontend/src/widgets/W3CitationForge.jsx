import React from 'react'
import OutputPanel from '../components/OutputPanel.jsx'
import { useRun } from '../lib/useRun.js'
import { extractCaseNames } from '../lib/utils.js'
import { SLIDES } from '../config.js'

function Body() {
  const { data, run, loading } = useRun('w3')
  const res = data.result
  const text = res?.data?.text || ''
  const cases = text ? extractCaseNames(text) : []

  return (
    <div>
      <button className="btn-primary" disabled={loading} onClick={() => run({})}>
        {loading ? 'Asking the Lab Model...' : 'Ask for three Florida drone cases with citations'}
      </button>
      {res && (
        <>
          <OutputPanel source={res.source} recordedDate={res.recordedDate}>{text}</OutputPanel>
          {cases.length > 0 && (
            <div className="card">
              <strong>Verify each case yourself:</strong>
              {cases.map((c) => (
                <p key={c}>
                  {c}{' '}
                  <a href={`https://scholar.google.com/scholar?as_sdt=4,10&q=${encodeURIComponent(`"${c}"`)}`} target="_blank" rel="noreferrer">
                    Google Scholar case law
                  </a>{' | '}
                  <a href={`https://onlinedocketssc.flcourts.org/DocketResults/CaseSearch?searchtype=case&searchterm=${encodeURIComponent(c)}`} target="_blank" rel="noreferrer">
                    Florida Supreme Court docket
                  </a>
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default {
  id: 'w3',
  label: 'W3',
  section: 'B. Hallucination',
  title: 'Citation Forge',
  priority: 'P0',
  instruction: 'Ask the Lab Model for three court cases, then verify each one in a real legal database.',
  Body,
  questions: [
    {
      id: 'q1',
      text: 'How many of the three cases did you find in a real docket or reporter?',
      options: [
        { key: '0', label: '0' },
        { key: '1', label: '1' },
        { key: '2', label: '2' },
        { key: '3', label: '3' },
      ],
      correct: '0',
      explain:
        'The Lab Model has no web access and no legal database, so its case names and reporter citations are generated from patterns. If you actually found one of these cases in a real docket, tell the instructor: that is a rare event worth checking together at the front.',
      slide: SLIDES.fabrication,
    },
    {
      id: 'q2',
      text: 'Why did the model produce reporter volume numbers?',
      options: [
        { key: 'a', label: 'It looked them up' },
        { key: 'b', label: 'Volume numbers follow case names in its training text, so it generated the pattern' },
        { key: 'c', label: 'It was told to lie' },
        { key: 'd', label: 'The cases exist under different names' },
      ],
      correct: 'b',
      explain:
        'In legal text, a case name is almost always followed by a volume, a reporter abbreviation, and a page. The model learned that shape and fills it with plausible values. The format is right; the facts behind it were never checked.',
      slide: SLIDES.fabrication,
    },
  ],
}
