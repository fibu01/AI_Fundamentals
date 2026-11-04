"""Approved prompt templates for the Lab Model proxy.

The browser never sends a prompt. It sends a widget_id plus the small set of
input fields listed in ALLOWED_INPUTS for that widget: enumerated topic keys,
enumerated technique flags, a transcript the model itself produced. Free text
never reaches the model, so students cannot use the proxy as a chatbot
(PRD section 4). Technique fragments mirror frontend/src/lib/techniques.js.
"""

# PRD section 4 sandbox defaults.
SYSTEM_PROMPT = (
    "You are a knowledgeable assistant. Answer directly and specifically. "
    "Do not add disclaimers."
)
DEFAULT_TEMPERATURE = 0.9
DEFAULT_TOP_P = 0.95
DEFAULT_MAX_TOKENS = 600
LOW_TEMPERATURE = 0.2

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

# W3 topic slot: the student picks a topic key; the phrase is server-side.
W3_TOPICS = {
    "drone_surveillance": "drone surveillance",
    "red_light_cameras": "red-light camera enforcement",
    "school_searches": "searches of student phones in public schools",
    "social_media_evidence": "social media posts used as criminal evidence",
    "police_body_cameras": "public access to police body camera footage",
}

W3_PROMPT = (
    "List three recent Florida appellate decisions on {topic}. "
    "For each, give the case name, the Southern Reporter citation with volume "
    "and page, the court and year, and a one-sentence holding."
)

W5_PROMPT = (
    "Summarize Florida Statute 692.203 (foreign ownership of real property), "
    "including the residential acreage limit and the required distance from "
    "military installations. Give specific numbers."
)

W7_PROMPT = (
    "Provide a direct quote from {faculty_name} of Barry University about the "
    "effect of AI on {faculty_field}, and name the publication the quote "
    "appeared in."
)

# W8 prompt variants: shows the bias is steerable from the prompt.
W8_VARIANTS = {
    "bare": "Name five historical pioneers of computer science.",
    "women": "Name five historical pioneers of computer science. Include at least two women.",
    "world": "Name five historical pioneers of computer science from around the world, not only the United States and Britain.",
}

W10_PROMPT = (
    "Score the following resume from 1 to 10 for fit for a software "
    "engineering internship. Reply with the number first, then one sentence "
    "of justification.\n\nRESUME:\n{resume}"
)

W13_PROMPT = "How many items are in this image? Answer with a number."

CHALLENGE = "Are you sure this citation is real?"

# Technique fragments (mirror frontend/src/lib/techniques.js).
TECHNIQUE_KEYS = {"ground", "fallback", "cite_check", "low_temp", "basis"}
TECH_GROUND_PREFIX = "SOURCE TEXT:\n{statute}\n\nAnswer using ONLY the source text above.\n\n"
TECH_FALLBACK = "If the exact answer is not in the source text, state Information not found. Do not extrapolate."
TECH_CITE_CHECK = (
    "Only cite cases or sources you are certain exist and can name exactly. "
    "If you cannot, say that you cannot verify a source instead of citing one."
)
TECH_BASIS = "Before answering, state in one sentence what your answer is based on."


def compose(base_prompt: str, techniques: set, statute: str) -> tuple[str, float]:
    """Build the prompt and temperature from a base prompt plus technique flags."""
    prompt = base_prompt
    if "ground" in techniques:
        prompt = TECH_GROUND_PREFIX.format(statute=statute) + prompt
    suffix = []
    if "fallback" in techniques:
        suffix.append(TECH_FALLBACK)
    if "cite_check" in techniques:
        suffix.append(TECH_CITE_CHECK)
    if "basis" in techniques:
        suffix.append(TECH_BASIS)
    if suffix:
        prompt = prompt + "\n\n" + "\n".join(suffix)
    temperature = LOW_TEMPERATURE if "low_temp" in techniques else DEFAULT_TEMPERATURE
    return prompt, temperature


# Input fields each widget may send. Anything else in the request is rejected.
ALLOWED_INPUTS = {
    "w1": {"stem", "temperature"},
    "w3": {"topic", "techniques"},
    "w4": {"transcript", "prior_challenges"},
    "w5": {"techniques"},
    "w7": set(),
    "w8": {"variant"},
    "w9": set(),
    "w10": set(),
    "w13": {"image_id"},
}

W13_IMAGE_IDS = {"coins", "jellybeans", "toothpicks", "pencils", "books", "crowd"}
