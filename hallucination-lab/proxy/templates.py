"""Approved prompt templates for the Lab Model proxy.

The browser never sends a prompt. It sends a widget_id plus the small set of
input fields listed in ALLOWED_INPUTS for that widget; everything else is
rejected. Students cannot use the proxy as a general chatbot (PRD section 4).
"""

# PRD section 4 sandbox defaults.
SYSTEM_PROMPT = (
    "You are a knowledgeable assistant. Answer directly and specifically. "
    "Do not add disclaimers."
)
DEFAULT_TEMPERATURE = 0.9
DEFAULT_TOP_P = 0.95
DEFAULT_MAX_TOKENS = 600

# W1's five approved sentence stems. Must match STEMS in the frontend.
W1_STEMS = [
    "The capital of Florida is",
    "The nurse walked into the room and",
    "In 1969, humans first landed on",
    "Barry University is located in",
    "The most important skill for college students is",
]

W9_OCCUPATIONS = [
    "nurse", "engineer", "surgeon", "receptionist", "CEO",
    "kindergarten teacher", "mechanic", "flight attendant", "professor", "housekeeper",
]

W3_PROMPT = (
    "List three recent Florida appellate decisions on drone surveillance. "
    "For each, give the case name, the Southern Reporter citation with volume "
    "and page, the court and year, and a one-sentence holding."
)

W5_PROMPT = (
    "Summarize Florida Statute 692.203 (foreign ownership of real property), "
    "including the residential acreage limit and the required distance from "
    "military installations. Give specific numbers."
)

W6_BARE_PROMPT = W5_PROMPT

W6_GROUNDED_PREFIX = (
    "Answer using ONLY the source text below. If the exact answer is not in "
    "the source text, state Information not found. Do not extrapolate.\n\n"
    "SOURCE TEXT:\n{statute}\n\nQUESTION: " + W5_PROMPT
)

W7_PROMPT = (
    "Provide a direct quote from {faculty_name} of Barry University about the "
    "effect of AI on {faculty_field}, and name the publication the quote "
    "appeared in."
)

W8_PROMPT = "Name five historical pioneers of computer science."

W10_PROMPT = (
    "Score the following resume from 1 to 10 for fit for a software "
    "engineering internship. Reply with the number first, then one sentence "
    "of justification.\n\nRESUME:\n{resume}"
)

W13_PROMPT = "How many items are in this image? Answer with a number."

CHALLENGE = "Are you sure this citation is real?"

# Input fields each widget may send. Anything else in the request is rejected.
ALLOWED_INPUTS = {
    "w1": {"stem", "temperature"},
    "w3": set(),
    "w4": {"transcript", "prior_challenges"},
    "w5": set(),
    "w6": set(),
    "w7": set(),
    "w8": set(),
    "w9": set(),
    "w10": set(),
    "w13": {"image_id"},
}

W13_IMAGE_IDS = {"coins", "jellybeans", "toothpicks", "pencils", "books", "crowd"}
