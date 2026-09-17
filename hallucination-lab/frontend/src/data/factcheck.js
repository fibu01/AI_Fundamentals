// Closing Fact-Check Challenge: three instructor-written "AI drafts" with
// planted errors. Each sentence is separately flaggable. Error types match
// the widget's reason menu. INSTRUCTOR: verify every source URL and every
// "real fact" note before Thursday (PRD section 6, closing).

export const FLAG_REASONS = [
  'Unsupported claim',
  'Fake citation',
  'Wrong number',
  'Missing viewpoint',
]

export const FC_DRAFTS = [
  {
    id: 'fc-crim',
    title: 'Criminology draft: Police use of drone surveillance',
    intro:
      'An AI wrote this paragraph for a criminology assignment. Click any sentence you distrust, pick a reason, and paste the URL of the primary source you checked.',
    sentences: [
      { text: 'Police departments across the United States have expanded their use of drones over the past decade.', error: null },
      {
        text: 'According to the FBI Uniform Crime Report, violent crime in the United States rose 40 percent between 2019 and 2023, driving demand for aerial surveillance.',
        error: { type: 'Wrong number', note: 'FBI data does not show a 40 percent rise over this period. Check the FBI Crime Data Explorer for the real trend.' },
      },
      {
        text: 'Florida regulates law enforcement drone use through the Freedom from Unwarranted Surveillance Act, section 934.50, Florida Statutes.',
        error: null,
      },
      {
        text: 'In Ramirez v. State, 371 So. 3d 240 (Fla. 2024), the Florida Supreme Court held that all warrantless drone surveillance is unconstitutional.',
        error: { type: 'Fake citation', note: 'No such decision. Search the Florida Supreme Court docket and Google Scholar for this case name and citation.' },
      },
      {
        text: 'Studies consistently prove that drone programs reduce violent crime in every city that adopts them.',
        error: { type: 'Unsupported claim', note: 'No body of research supports "every city." Absolute claims like this need a source, and the evidence on drone programs is mixed.' },
      },
      { text: 'Supporters argue drones reach emergency scenes faster than patrol cars and document incidents more completely.', error: null },
      {
        text: 'The debate over drone surveillance is therefore settled, and no serious privacy objections remain.',
        error: { type: 'Missing viewpoint', note: 'Civil liberties organizations actively litigate and publish on drone privacy. The draft omits that entire side.' },
      },
      {
        text: 'Section 934.50 requires police to obtain a warrant for drone surveillance in most circumstances, with listed exceptions.',
        error: null,
      },
      {
        text: 'A 2023 Department of Justice report found that 95 percent of Americans support unrestricted police drone use.',
        error: { type: 'Wrong number', note: 'No DOJ report says this. Polling on police drone use shows support varies widely by scenario.' },
      },
    ],
    sources: [
      { label: 'FBI Crime Data Explorer', url: 'https://cde.ucr.cjis.gov/' },
      { label: 'Florida Statute 934.50 (flsenate.gov)', url: 'https://www.flsenate.gov/Laws/Statutes/2025/934.50' },
      { label: 'Florida Supreme Court docket search', url: 'https://onlinedocketssc.flcourts.org/' },
      { label: 'Google Scholar case law', url: 'https://scholar.google.com/' },
    ],
  },
  {
    id: 'fc-nurs',
    title: 'Nursing draft: AI triage tools in emergency departments',
    intro:
      'An AI wrote this paragraph for a nursing assignment. Click any sentence you distrust, pick a reason, and paste the URL of the primary source you checked.',
    sentences: [
      { text: 'Hospitals have begun piloting AI tools that help prioritize patients in emergency departments.', error: null },
      {
        text: 'A landmark study in the Journal of Emergency Nursing Informatics (2022) found AI triage cut wait times by 61 percent across 400 hospitals.',
        error: { type: 'Fake citation', note: 'No journal by this exact name; no such 400-hospital study. Search PubMed for the journal and the claim.' },
      },
      {
        text: 'The Emergency Severity Index, a five-level triage algorithm, is widely used in United States emergency departments.',
        error: null,
      },
      {
        text: 'The FDA has approved every AI triage product currently on the market, so nurses can rely on their outputs without independent judgment.',
        error: { type: 'Unsupported claim', note: 'FDA clearance status varies by product, and no clearance removes the clinician’s duty to verify. Check the FDA AI-enabled device list.' },
      },
      {
        text: 'Nurses report that documentation consumes a large share of their shift, which AI developers cite as a target for automation.',
        error: null,
      },
      {
        text: 'The American Nurses Association states that AI should replace triage nurses in hospitals facing staffing shortages.',
        error: { type: 'Unsupported claim', note: 'The ANA position statements say the opposite: AI should support, not replace, nursing judgment. Read the ANA position on AI.' },
      },
      {
        text: 'Since these tools are trained on past patient data, any bias in that data can carry into their recommendations, a concern raised in the algorithmic bias literature.',
        error: null,
      },
      {
        text: 'In 2023, United States hospitals employed 12 million registered nurses.',
        error: { type: 'Wrong number', note: 'The United States has roughly 4 to 5 million registered nurses in total, not 12 million in hospitals. Check the Bureau of Labor Statistics.' },
      },
      {
        text: 'Patient advocates have raised no objections to AI triage.',
        error: { type: 'Missing viewpoint', note: 'Patient advocacy groups have published concerns about consent, transparency, and bias in AI triage. The draft leaves them out.' },
      },
    ],
    sources: [
      { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
      { label: 'FDA AI-enabled medical devices list', url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices' },
      { label: 'American Nurses Association', url: 'https://www.nursingworld.org/' },
      { label: 'Bureau of Labor Statistics, Registered Nurses', url: 'https://www.bls.gov/ooh/healthcare/registered-nurses.htm' },
    ],
  },
  {
    id: 'fc-bus',
    title: 'Business draft: AI adoption in small businesses',
    intro:
      'An AI wrote this paragraph for a business assignment. Click any sentence you distrust, pick a reason, and paste the URL of the primary source you checked.',
    sentences: [
      { text: 'Small businesses are adopting AI tools for marketing copy, customer service, and bookkeeping.', error: null },
      {
        text: 'A 2024 United States Chamber of Commerce report found that 98 percent of small businesses already use generative AI daily.',
        error: { type: 'Wrong number', note: 'Chamber of Commerce surveys report far lower figures. Find the actual report and the actual percentage.' },
      },
      {
        text: 'Warren Buffett told Fortune in March 2024 that "any small business not running on AI by 2025 will be bankrupt by 2027."',
        error: { type: 'Fake citation', note: 'No such quote exists. Search Fortune and reputable archives for it; fabricated quotes attributed to famous investors circulate widely.' },
      },
      {
        text: 'Businesses that publish AI-generated content without review risk publishing factual errors under their own brand name.',
        error: null,
      },
      {
        text: 'AI adoption guarantees a revenue increase for any business within the first quarter of use.',
        error: { type: 'Unsupported claim', note: 'No study guarantees revenue outcomes. Any "guarantee" language in a business claim needs a primary source.' },
      },
      {
        text: 'The Federal Trade Commission has warned companies against making unsubstantiated claims about their AI products.',
        error: null,
      },
      {
        text: 'Because AI tools handle these tasks well, small business owners report no concerns about cost, accuracy, or customer trust.',
        error: { type: 'Missing viewpoint', note: 'Surveys of small business owners consistently record concerns about accuracy, cost, and customer reaction. The draft erases them.' },
      },
      { text: 'Several major AI vendors offer discounted plans aimed at businesses with fewer than 50 employees.', error: null },
    ],
    sources: [
      { label: 'U.S. Chamber of Commerce reports', url: 'https://www.uschamber.com/technology' },
      { label: 'Fortune archive search', url: 'https://fortune.com/search/' },
      { label: 'FTC business guidance on AI claims', url: 'https://www.ftc.gov/business-guidance/blog' },
    ],
  },
]

export function plantedErrorCount(draft) {
  return draft.sentences.filter((s) => s.error).length
}
