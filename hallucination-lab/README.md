# Hallucination Lab

Week 4 Thursday lab for AI Fundamentals and Experimentation, per the PRD
draft of Sept 14, 2026, reworked Sept 15 from a click-through demo into an
experiment bench. Students make a sandboxed model (no tools, no web, no
retrieval, temperature 0.9) fabricate citations, statute details, quotes, and
counts, then make those failures stop using the lecture's techniques.

Core mechanics, applied to every module:

- **Set the stage**: each module opens with a plain-language intro and
  definitions (temperature, grounding, logprob) written for students with no
  background. Edit them in each widget file's `intro` block.
- **Predict, then run**: the experiment stays closed until the student locks
  a one-shot prediction. Predictions appear in the export as `-P` rows.
- **One-shot answers**: every question locks on the first click, so the
  explain panel cannot be farmed for right answers.
- **Technique panel**: on the W5/W6 bench, lecture techniques are toggles
  that visibly rewrite the prompt on screen; the proxy accepts only the
  enumerated flags, never free text.

Games: **Prompt Golf** (W5/W6: reach zero out-of-statute numbers in the
fewest techniques; most toggles fail, which is the trial-and-error lesson),
**Citation Sort** (W3: the model's fabrications shuffled with real Supreme
Court cases), **Two Truths and a Lie** (timed rounds, curated sets),
**Spot the Fake** (W14: real photo vs AI image head-to-head with a timer),
and a session-wide **Hallucination Bingo** card in the corner.

Every live widget falls back to a recorded transcript when the gateway is
slow (10 s timeout) or down, labeled "Recorded on [date], Lab Model". The
lab runs Thursday even if DGX01 is off. W6 is merged into the W5 bench; its
worksheet rows keep their W6 labels.

## Layout

```
frontend/   Vite + React single-page app, state in memory only
proxy/      FastAPI service: /api/run/{widget}, /api/recorded/{widget}, /api/health
scripts/    capture_recorded.py (refresh fallback transcripts each semester)
            make_placeholders.py (regenerate placeholder images)
```

## Quick start

```
python3 scripts/make_placeholders.py   # placeholder images (not committed)
cd frontend && npm install && npm run build
cd ../proxy && pip install -r requirements.txt
cp .env.example .env   # fill in gateway URL and virtual key on the server
uvicorn app:app --port 8100
```

The proxy serves the built frontend at `/` and the API under `/api`, so one
service covers the internal-only deployment on CRMDEVSRV03. For development,
`npm run dev` in `frontend/` proxies `/api` to `localhost:8100`.

Instructor mode: append `?mode=instructor` to the URL. Answer keys show
inline, the progress gate is off, and fonts enlarge for the projector.

## Sandbox enforcement

The browser never holds a gateway key and never sends a prompt. It sends a
widget ID plus the input fields on that widget's allowlist
(`proxy/templates.py`); the proxy fills the approved template and forwards.
Unknown widget IDs and extra fields are rejected, so the proxy cannot be used
as a general chatbot. Rate limit: 60 requests per minute per client IP. The
proxy logs widget ID, latency, and success only.

Create the LiteLLM virtual key scoped to the Lab Model alias with a spend cap
in the gateway UI. Read the gateway URL from `/etc/litellm/config.yaml` on
CRMDEVSRV03 at deploy time; nothing in this repo carries a key or hostname.

## Before Thursday

1. Set `GATEWAY_BASE_URL` and `GATEWAY_API_KEY` in `proxy/.env`, confirm
   `/api/health` reports `gateway_configured: true`, and run one manual W3.
2. Run `python3 scripts/capture_recorded.py` against the live proxy, then
   rebuild the frontend. The shipped transcripts are authored seeds and are
   marked as such in each JSON's note field; replace them with real captures.
3. Set the W7 faculty name in `frontend/src/config.js` AND `proxy/.env`, with
   that colleague's permission (PRD open decision 3).
4. Generate the images: every prompt, filename, and warning is in
   `docs/IMAGE_PROMPTS.md` (W12 grids, W14 real-vs-AI pairs, optional W13
   photos and header illustrations). Keep `frontend/src/data/manifests.js`
   accurate and re-run the build.
5. Verify the curated content: the Fact-Check source list and notes
   (`factcheck.js`), the Two Truths and a Lie statements and sources
   (`ttl.js`), and the real-case citations for Citation Sort
   (`realcases.js`). All three are student-facing claims of fact.
6. Confirm whether gemma-4-27b-it accepts image input through the gateway.
   If yes, set `VISION_ENABLED=1`; if not, W13 stays recorded-only, which the
   widget handles automatically.
7. Load test W8/W9 at 20 concurrent users; if latency exceeds 8 s, cut W8's
   n from 5 to 3 in `proxy/app.py` (PRD risk item).
8. Confirm the Barry red value against the Tuesday deck's pptx theme and
   adjust `--barry-red` in `frontend/src/styles.css` if it differs.
9. Full run-through from a lab machine student account, plus the projector
   check in instructor mode.

Re-capture each semester: recorded transcripts, the statute text in
`frontend/src/data/statute.js` and `proxy/content/statute_692203.txt` (update
the capture date), and the W2 real paragraph.

## Deviations from the PRD, with reasons

- Charts are hand-rolled labeled bars instead of Recharts. Every bar carries
  its number as text (the WCAG "no color-only information" rule required that
  anyway), and it drops a dependency. Swap in Recharts later if you want
  richer charts.
- W5's "correct count" for Q1 is a heuristic: a number in the model output
  counts as a match if it appears anywhere in the statute. The explain panel
  says so and defers to the student's click-by-click comparison. Exact
  context matching is not decidable client-side for arbitrary live outputs.
- W14 Q1 and the Fact-Check questions use bucketed options instead of free
  numeric entry, since the site is multiple-choice only (PRD section 5).
- W9 Q1 offers all ten occupations, not four, because the correct answer is
  run-dependent.
- W4's apology/reassertion counter is a keyword heuristic and is labeled as
  such; students read the actual transcript.

## Open decisions (PRD section 12), current state

1. Live model vs recorded-only for Thursday: both paths work; recorded-only
   requires nothing but the static build and proxy.
2. Hosting: built for internal-only on CRMDEVSRV03 (one service). A split
   deployment works by setting `API_BASE` in `frontend/src/config.js`.
3. W7 faculty name: placeholder until permission is confirmed.
4. W13 student uploads: not implemented; the six fixed images only, per the
   PRD's own recommendation.
5. Fact-Check drafts: written and in `factcheck.js`; they need Justin's
   verification pass, not authoring from scratch.

## Acceptance criteria status

- Recorded fallback on gateway loss: verified end to end (proxy stopped,
  widgets label the recorded run, no error dialog).
- Export pastes as tab-separated rows labeled W1-Q1 through Fact-Check-Q3.
- Keyboard access: every control is a real button or input; W14's mouse lens
  has a keyboard Zoom toggle. Re-verify with a screen reader before class.
- W3/W5 fabrication rates (9 of 10 runs) need the live gateway to measure;
  test during step 1 above.
