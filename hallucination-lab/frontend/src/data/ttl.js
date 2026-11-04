// Two Truths and a Lie: curated statement sets. Exactly one statement per
// set is false. Sources are for the verify step after each round.
// INSTRUCTOR: verify every statement and source before class; these feed a
// timed game and a wrong "truth" would be embarrassing.
export const TTL_SETS = [
  {
    id: 'florida',
    topic: 'Florida',
    statements: [
      { text: 'Tallahassee is the capital of Florida.', lie: false },
      { text: 'Florida has no state personal income tax.', lie: false },
      { text: 'Lake Okeechobee is the largest freshwater lake in the United States.', lie: true, why: 'It is the largest freshwater lake entirely within Florida; Lake Michigan alone is many times larger.' },
    ],
    source: { label: 'Florida facts (myflorida.com and USGS)', url: 'https://www.usgs.gov/faqs' },
  },
  {
    id: 'barry',
    topic: 'Barry University',
    statements: [
      { text: 'Barry University’s main campus is in Miami Shores.', lie: false },
      { text: 'Barry was founded in 1940.', lie: false },
      { text: 'Barry was founded by the Jesuit order.', lie: true, why: 'Barry was founded by the Adrian Dominican Sisters, not the Jesuits.' },
    ],
    source: { label: 'Barry University history', url: 'https://www.barry.edu/en/about/history-mission/' },
  },
  {
    id: 'ai-history',
    topic: 'AI history',
    statements: [
      { text: 'The term "artificial intelligence" was coined for the 1956 Dartmouth workshop.', lie: false },
      { text: 'IBM’s Deep Blue defeated world chess champion Garry Kasparov in a 1997 match.', lie: false },
      { text: 'ELIZA, the 1960s chatbot, was built by IBM.', lie: true, why: 'Joseph Weizenbaum built ELIZA at MIT.' },
    ],
    source: { label: 'Computer History Museum', url: 'https://www.computerhistory.org/' },
  },
  {
    id: 'computing',
    topic: 'Computing history',
    statements: [
      { text: 'Ada Lovelace published the first algorithm intended for a machine, in the 1840s.', lie: false },
      { text: 'The phrase "computer bug" is linked to an actual moth found in a Harvard computer by Grace Hopper’s team.', lie: false },
      { text: 'ENIAC, completed in the 1940s, was programmed mainly by a team of six men.', lie: true, why: 'ENIAC’s original programmers were six women, including Jean Bartik.' },
    ],
    source: { label: 'ENIAC programmers project', url: 'https://eniacprogrammers.org/' },
  },
  {
    id: 'florida-law',
    topic: 'Florida law',
    statements: [
      { text: 'Florida Statute 934.50 restricts law enforcement drone surveillance.', lie: false },
      { text: 'Florida Statute 692.203 restricts certain foreign purchases of property near military installations.', lie: false },
      { text: 'Under 692.203, a qualifying foreign national may buy one residential property of up to 10 acres.', lie: true, why: 'The statute’s limit is 2 acres, and the parcel must not be within 5 miles of a military installation.' },
    ],
    source: { label: 'flsenate.gov statutes', url: 'https://www.flsenate.gov/Laws/Statutes/2025/692.203' },
  },
  {
    id: 'health-ai',
    topic: 'AI in healthcare',
    statements: [
      { text: 'Registered nursing is among the largest licensed healthcare professions in the United States.', lie: false },
      { text: 'The Emergency Severity Index used in many emergency departments has five levels.', lie: false },
      { text: 'In 2024 the FDA approved the first fully autonomous AI nurse for hospital use.', lie: true, why: 'No such approval exists; FDA clearances cover narrow decision-support tools, not autonomous nurses.' },
    ],
    source: { label: 'FDA AI-enabled device list', url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices' },
  },
]

export const TTL_SECONDS = 20
