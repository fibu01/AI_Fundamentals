// Florida Statute 692.203, captured verbatim from flsenate.gov.
// Re-capture each semester and update CAPTURE_DATE. See lab README.
export const STATUTE_URL = 'https://www.flsenate.gov/Laws/Statutes/2025/692.203'
export const CAPTURE_DATE = '2026-09-14'

export const STATUTE_TITLE =
  '692.203 Purchase of real property on or around military installations or critical infrastructure facilities by foreign principals prohibited.'

export const STATUTE_TEXT = `(1) A foreign principal may not directly or indirectly own, or have a controlling interest in, or acquire by purchase, grant, devise, or descent any interest, except a de minimus indirect interest, in real property on or within 10 miles of any military installation or critical infrastructure facility in this state. A foreign principal has a de minimus indirect interest if any ownership is the result of the foreign principal's ownership of registered equities in a publicly traded company owning the land and if the foreign principal's ownership interest in the company is either:
(a) Less than 5 percent of any class of registered equities or less than 5 percent in the aggregate in multiple classes of registered equities; or
(b) A noncontrolling interest in an entity controlled by a company that is both registered with the United States Securities and Exchange Commission as an investment adviser under the Investment Advisers Act of 1940, as amended, and is not a foreign entity.

(2) A foreign principal that directly or indirectly owns or acquires any interest in real property on or within 10 miles of any military installation or critical infrastructure facility in this state before July 1, 2023, may continue to own or hold such real property, but may not purchase or otherwise acquire by grant, devise, or descent any additional real property on or within 10 miles of any military installation or critical infrastructure facility in this state.

(3)(a) A foreign principal must register with the Department of Commerce if the foreign principal owns or acquires real property on or within 10 miles of any military installation or critical infrastructure facility in this state as authorized under subsection (4) or if the foreign principal owned or acquired an interest, other than a de minimus indirect interest, in such property before July 1, 2023. The department must establish a form for such registration which, at a minimum, must include all of the following:
1. The name of the owner of the real property.
2. The address of the real property, the property appraiser's parcel identification number, and the property's legal description.
(b) A foreign principal that fails to timely file a registration with the department is subject to a civil penalty of $1,000 for each day that the registration is late. A foreign principal must register a property interest owned before July 1, 2023, by December 31, 2023. The registration is considered to be late after January 31, 2024. A foreign principal who owns or acquires real property on or after July 1, 2023, as authorized under subsection (4), must register the real property within 30 days after the property is owned or acquired. The department may place a lien against the unregistered real property for the unpaid balance of any penalties assessed under this paragraph.

(4) Notwithstanding subsection (1), a foreign principal who is a natural person may purchase one residential real property that is up to 2 acres in size if all of the following apply:
(a) The parcel is not on or within 5 miles of any military installation in this state.
(b) The person has a current verified United States Visa that is not limited to authorizing tourist-based travel or official documentation confirming that the person has been granted asylum in the United States, and such visa or documentation authorizes the person to be legally present within this state.
(c) The purchase is in the name of the person who holds the visa or official documentation described in paragraph (b).

(5) Notwithstanding subsections (1) and (2), a foreign principal may acquire real property or any interest therein which is on or within 10 miles of any military installation or critical infrastructure facility in this state on or after July 1, 2023, by devise or descent, through the enforcement of security interests, or through the collection of debts, provided that the foreign principal sells, transfers, or otherwise divests itself of such real property within 3 years after acquiring the real property.

(6)(a) At the time of purchase, a buyer of the real property that is on or within 10 miles of any military installation or critical infrastructure facility in this state must provide an affidavit signed under penalty of perjury attesting that the buyer is:
1. Not a foreign principal or not a foreign principal prohibited from purchasing the subject real property; and
2. In compliance with the requirements of this section.
(b) The failure to obtain or maintain the affidavit does not:
1. Affect the title or insurability of the title for the real property; or
2. Subject the closing agent to civil or criminal liability, unless the closing agent has actual knowledge that the transaction will result in a violation of this section.
(c) The Florida Real Estate Commission shall adopt rules to implement this subsection, including rules establishing the form for the affidavit required under this subsection.

(7)(a) If any real property is owned or acquired in violation of this section, the real property may be forfeited to the state.
(b) The Department of Commerce may initiate a civil action in the circuit court of the county in which the property lies for the forfeiture of the real property or any interest therein.

(8) A foreign principal that purchases or acquires real property or any interest therein in violation of this section commits a misdemeanor of the second degree, punishable as provided in s. 775.082 or s. 775.083.

(9) A person who knowingly sells real property or any interest therein in violation of this section commits a misdemeanor of the second degree, punishable as provided in s. 775.082 or s. 775.083.

(10) The Department of Commerce shall adopt rules to implement this section.

History: s. 6, ch. 2023-33; s. 232, ch. 2024-6.`

// Numbers that genuinely appear in the statute, used by the W5 auto-check
// heuristic. A number in the model output counts as a heuristic "match" only
// if it appears in this set. The explain panel tells students the heuristic
// checks presence, not context.
export const STATUTE_NUMBERS = new Set([
  '10', '5', '2', '1', '3', '30', '1,000', '1000',
  '2023', '2024', '1940', '692.203', '775.082', '775.083', '48.23',
])
