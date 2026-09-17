# Findings from the first live capture, 17 Sep 2026

Gateway `https://ai-gateway.barry.edu/v1`, model `gemma-4-31b-it`.

## W4 "Are You Sure?" — this model does not do what the module says

**The module's premise no longer holds for this model, and W4 ships on its
authored seed because of it.** The real capture is kept here as evidence:
`w4-captured-2026-09-17.json`.

W4 teaches that challenging a model produces an apology followed by a
restatement or a fresh invention, never a check. Q1 is keyed accordingly.
Challenged on its own fabricated citations, `gemma-4-31b-it` said this, on the
first challenge, in all three captured runs:

> "No, those citations are not real. I hallucinated those specific case names
> and volume/page numbers."

No hedging, no re-assertion, no new invented case. It backs down immediately
and accurately. Against that transcript Q1's key is simply wrong, so the
seed stays and the capture does not ship.

Two things this exposed in the code, both fixed and both wrong regardless of
which transcript ships:

- `classifyChallengeReply` in `frontend/src/lib/utils.js` did not recognise
  "not real", "hallucinated" or "fabricated" as an admission, so a full
  retraction scored as a re-assertion. The on-screen counter would have told
  students "re-asserted or changed the citation in 3 of 3" directly underneath
  a transcript where the model retracted three times out of three.
- `scripts/check_recorded.py` used the same word list and therefore missed it
  too. Both now match the same wider set.

### What to do with this before the next run of the lab

Do not just swap the key to "admits on the first challenge". That teaches
students to trust a retraction, which is the opposite lesson and no safer.

The experiment worth running: **challenge the model on a citation that is
real.** The claim to test is that the model caves to social pressure rather
than checking anything, so it should retract a true citation just as readily
as a false one. If it does, W4 becomes a stronger module than the original:
the model's confidence and its capitulation are both untethered from the
facts, and "are you sure?" remains useless as a verification step for exactly
the reason the module always said. If it does not — if it holds firm on real
citations and folds on invented ones — that is a genuinely useful behaviour
and the module should say so plainly.

Either way this needs a capture against real citations and a rewritten Q1, and
it is not a change to make in the hours before class.

## W7 "The Expert Quote" — the model names real journals

The seed invented a journal, and Q1 was keyed "the publication does not
exist". The live model attributes its invented quote to *Nursing Management*
and *Nursing Outlook*, both real. Q1 now asks whether the quote turns up
anywhere, which holds whichever outlet the model picks, and the explain panel
uses the real-journal case as the sharper point: a real person, a real
publication, and words neither of them produced.

W7 ships on the real capture.

## W3 "Citation Forge" — the model repeats itself

Citation Sort dedupes by case name. In 3 of 10 captured runs the model listed
the same invented case twice, which turns a six-row sort into a four-row one,
and both `drone_surveillance` runs were affected: the default topic, and the
one W4 chains off. `scripts/topup_w3.py` drops those and re-rolls only the
topics that came up short.

W3 ships on the real capture, after the top-up.

## The general rule

A capture is not automatically better than a good seed. Real output can
contradict an answer key, weaken a game, or disprove a module's premise
outright. `npm run verify` runs `scripts/check_recorded.py` first for exactly
this reason, and the checks in it are each a defect that reached a transcript
before it was caught.
