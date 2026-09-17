# Gateway and the two channels

Two independent channels, so work in progress can never reach students.

Three, not two, because the hosted preview and the live-model preview are
different things:

| | Student site | Hosted preview | Live preview |
|---|---|---|---|
| Who uses it | Students, in class | You, reviewing a candidate | You, demonstrating a live call |
| URL | https://fibu01.github.io/AI_Fundamentals/ | https://fibu01.github.io/AI_Fundamentals/preview/ | http://localhost:8100/ (wherever the proxy runs) |
| Built from | `lab-stable-w4` (frozen) | `claude/keen-goodall-f0m7ce` | `claude/keen-goodall-f0m7ce` |
| Build | `npm run build` → `dist/` | same, plus `VITE_BUILD_CHANNEL=preview` | `npm run build:preview` → `dist-preview/` |
| Model calls | None. Bundled transcripts only. | None. Bundled transcripts only. | Live, through the proxy |
| Banner | none | loud amber "PREVIEW BUILD" | none |

**The student site's content always comes from `lab-stable-w4`, whatever is on
the dev branch.** The workflow triggers from the dev branch only because the
`github-pages` environment refuses deployments from any other branch — a push
to `lab-stable-w4` builds fine and then fails at the deploy step. So the
freeze is enforced by which branch the root is *built from*, which is stronger
than enforcing it by trigger: a push to the dev branch cannot change what
students see even by accident. It rebuilds the root from the frozen branch,
byte-identical, and republishes `/preview/` from the candidate.

Falling back is therefore just using the other URL. The two builds are
separate directories in one artifact and neither can overwrite the other.

**To ship a candidate:** merge the dev branch into `lab-stable-w4`, push it,
then push anything to the dev branch (or run the workflow by hand) to rebuild
the root from it.

## Do not put the gateway in front of students on Thursday

Measured against `https://ai-gateway.barry.edu/v1`, model `gemma-4-31b-it`,
on the day of class:

| Output length | Wall time | Rate |
|---|---|---|
| 60 tokens | 11.5 s | 5.2 tok/s |
| 200 tokens | 36.6 s | 5.5 tok/s |
| 220 tokens | 39.9 s | 5.5 tok/s |

Linear, and repeatable across runs. The browser's own timeout is 10 s
(`CALL_TIMEOUT_MS` in `src/config.js`), so in a live build essentially every
widget would spin for ten seconds and then fall back to a recorded transcript
anyway. Some widgets are far worse than one call:

- W8 runs the prompt 5 times, twice (bare and steered) — 10 calls.
- W9 scores 10 occupation stems.
- W10 scores each resume 10 times — 20 calls.
- W5 grounded sends the full statute as context before generating.

At ~12 s per short call that is several minutes per widget, per student, with
20 students sharing one gateway. The lab is built to survive exactly this
(every widget falls back), but the honest call is: **run Thursday on the
static build.** Nothing about the lesson depends on the call being live; every
output panel already says whether it is a live run or a transcript.

## What the gateway is genuinely worth right now

Replacing the authored seed transcripts with real captures. Students then read
output the Lab Model actually produced, the panels say "captured" rather than
"example", and none of it is exposed to class-time latency. That is what
`scripts/capture_recorded.py` does.

```
cd proxy && cp .env.example .env     # fill in GATEWAY_BASE_URL and GATEWAY_API_KEY
set -a; . ./.env; set +a
python3 -m uvicorn app:app --port 8100
cd ../scripts && python3 capture_recorded.py --runs 3
cd ../frontend && npm run build && npm run verify
```

Captured files land in `frontend/src/data/recorded/` with
`"provenance": "captured"`. Expect this to take 20-40 minutes at current
gateway speed.

**Always check a capture before you ship it.** `npm run verify` now runs
`scripts/check_recorded.py` first and fails if a transcript stops satisfying
what its widget needs. Two real examples from the first capture against this
gateway:

- W7's key said the named publication does not exist. The seed invented one;
  the live model named *Nursing Management* and *Nursing Outlook*, both real
  journals. The question had to change, not the transcript.
- Citation Sort dedupes by case name, and in 3 of 10 captured runs the model
  listed the same invented case twice, which quietly turns a six-row game into
  a four-row one. `scripts/topup_w3.py` drops those runs and re-rolls only the
  topics that came up short, so you are not re-capturing all five topics to fix
  one.

A capture is not automatically better than a good seed. Read what came back.

**`w5.json` is excluded from routine re-capture on purpose.** Its grounded
variants carry a deliberate planted misattribution that the whole grounding
lesson depends on, plus a `plantedErrors` block describing each one. A raw
capture would lose that and `npm run verify` will fail. If you do re-capture
W5, re-plant one mistake per grounded variant and update `plantedErrors`.

## Running the preview channel

```
cd frontend && npm run build:preview          # -> dist-preview/, live mode
cd ../proxy
set -a; . ./.env; set +a                      # STATIC_DIR=../frontend/dist-preview
python3 -m uvicorn app:app --port 8100
```

Then open `http://localhost:8100/`. The proxy serves the preview build at `/`
and the API at `/api`, same origin, so no CORS setup is needed. Check
`http://localhost:8100/api/health` first: it must report
`gateway_configured: true` and the model you expect.

`GATEWAY_TIMEOUT_S` (default 180) is the proxy's ceiling for a gateway call.
It is deliberately far above the browser's 10 s so the capture script can
finish long generations; it does not change what students experience.

## The security boundary is unchanged

The browser holds no key and sends no prompt. It sends a widget id plus the
fields on that widget's allowlist; the proxy fills the approved template from
`proxy/templates.py` and forwards. That is as true in the preview channel as
in production. Do not put `GATEWAY_API_KEY` into anything under `frontend/` —
Vite inlines `VITE_*` variables into the bundle, which ships to the browser.

`proxy/.env` is gitignored. Keep it that way.
