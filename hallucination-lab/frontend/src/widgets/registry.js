import W1 from './W1NextWord.jsx'
import W2 from './W2FluentFalse.jsx'
import W3 from './W3CitationForge.jsx'
import W4 from './W4AreYouSure.jsx'
import W5 from './W5Statute.jsx' // merged W5/W6 experiment bench
import W7 from './W7Expert.jsx'
import TTL from './TwoTruths.jsx'
import W8 from './W8Pioneers.jsx'
import W9 from './W9Pronoun.jsx'
import W10 from './W10Resume.jsx'
import W11 from './W11RiskSim.jsx'
import W12 from './W12PictureJob.jsx'
import W13 from './W13CountCoins.jsx'
import W14 from './W14SpotFake.jsx'
import FactCheck from './FactCheck.jsx'

// Fixed lab order: lecture sections A through D, then the closing challenge.
// W6 is merged into the W5 bench; TTL closes the hallucination section.
export const WIDGETS = [W1, W2, W3, W4, W5, W7, TTL, W8, W9, W10, W11, W12, W13, W14, FactCheck]
