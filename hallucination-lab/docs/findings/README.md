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

## W8 "Pioneers Tally" — the bare prompt is already diverse

**W8 ships on its seed too.** Capture kept as `w8-captured-2026-09-17.json`.

W8 teaches that the bare prompt omits women and that one added sentence moves
the distribution. Q2's explain calls the steered run "the proof: the missing
names were in the model all along, one sentence away." Measured on the capture:

| prompt | slots | distinct women |
|---|---|---|
| bare | 25 | 2 (Ada Lovelace, Grace Hopper) |
| "include at least two women" | 25 | 2 (the same two) |
| "from around the world" | 25 | 3 |

The steer changed nothing, because the bare prompt already returns Lovelace and
Hopper every time. This model has been tuned for exactly the thing the module
asks students to discover, so the experiment lands on a null result while the
copy insists the opposite happened. Q1's key is computed from the run and
survives; Q2's explain does not.

Note the module's *finding* is not wrong in general, and the omission is still
real further down the list: two women in 25 slots is not parity. But the lab
must not tell a student their steered run proved something it did not.

### The interesting part, which is a candidate module

The "from around the world" steer produced names the reference list does not
contain: Konrad Zuse (real), Satoshi Nakamoto (a pseudonym, and not a pioneer
of computer science in this sense), and **Jun Morita, Kiyoshi Muroga and Ejnar
Gilbertsen, which need checking before anyone repeats them.** Saburo Muroga was
a real computer scientist at Illinois; "Kiyoshi Muroga" may be a corruption of
that name. If these are fabricated, then asking the model to broaden its list
made it invent plausible non-Western computer scientists, which is a sharper
lesson than the original: the steer did not retrieve missing names, it
generated names shaped like the ones you asked for.

Verify those three before building anything on them.

## W1 and W9 — the logprob path through this gateway returns junk

**Both ship on their seeds.** Captures kept as `w1-captured-2026-09-17.json`
and `w9-captured-2026-09-17.json`.

W1 asks the gateway for next-token probabilities at three temperatures. What
came back:

- After "The capital of Florida is", the top candidate is **"Florida"** at
  0.98, with a CJK character in the top three.
- The distribution is **byte-identical at temperature 0.2, 0.9 and 1.4.**

W1 exists to show the top word's share shrinking as temperature rises. Three
identical charts show the opposite of the lesson. W9 is the same endpoint and
came back collapsed: "they" at probability 1.00 for nine of ten occupations and
all three probabilities at 0.00 for the tenth, so there is no tilt to find and
Q1 has no answer.

Whether that is the model, the vLLM backend, or LiteLLM not passing
`logprobs`/`temperature` through, it needs fixing at the gateway before either
module can use live data. Everything else on the gateway works, so this is
specific to the logprob route, not the connection.

## W10 "Resume Score" — no variance at all

**Ships on its seed.** The capture scored 7 for both resumes on all twenty
runs: mean 7.0 against 7.0, and a histogram with a single bar. The module asks
students to read a distribution across ten runs, and a distribution with zero
spread teaches nothing about sampling. The seed at least varies 7 to 9.

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

## W8 list parsing — a bug the seeds hid

`extractListNames` matched "1. Alan Turing" and nothing else. The live model
writes "1. **Alan Turing**: Formalized the concepts of algorithms..." and
"1. **Ada Lovelace** (United Kingdom) - Often credited as...", so the parser
kept the whole line including the description and then rejected it for
starting with an asterisk. Every name was dropped and W8 tallied zero across
all 25 slots. It now strips markdown emphasis, cuts the description at a colon
or dash, drops a trailing parenthetical, and is tested against all four
observed shapes plus prose. This bug was invisible for as long as the seeds
were hand-written in the one format the parser understood.

## What actually shipped

| widget | source | why |
|---|---|---|
| W3 Citation Forge | **captured** | good fabrications, after re-rolling repeats |
| W7 The Expert Quote | **captured** | real fabricated quote, real journal named |
| W1 Next Word | seed | logprob path returns junk, no temperature effect |
| W4 Are You Sure | seed | model retracts instead of doubling down |
| W5 Prompt Golf | seed | planted misattribution is deliberate teaching content |
| W8 Pioneers Tally | seed | steering changed nothing; bare prompt already diverse |
| W9 Fill in the Pronoun | seed | "they" at 1.00 everywhere, no tilt to find |
| W10 Resume Score | seed | zero variance across twenty runs |
| W13 Count the Coins | seed | vision disabled, gateway returned 501 |

Two of nine captures were usable. That is not a failure of the capture run; it
is the finding. This model has been tuned away from three of the four
behaviours the bias section was built to demonstrate, and the logprob route is
returning nothing usable.

## Markdown broke two parsers, and the seeds hid both

Every hand-written seed used plain text. The live model uses markdown, and two
extractors that had worked for weeks fell over on it:

- `extractListNames` (W8) matched "1. Alan Turing" only. The model writes
  "1. **Alan Turing**: Formalized the concepts..." so the parser kept the whole
  line and then rejected it for starting with an asterisk. Zero names tallied
  across all 25 slots.
- `extractCitations` (W3) found the case name but looked for the reporter span
  immediately after it. The model writes "**State v. Moore**, 326 So. 3d 1105
  (Fla. 4th DCA 2021)", so the closing asterisks sat between the name and the
  citation and the match failed. The fabricated rows lost their citations while
  the real ones kept theirs, which is exactly the formatting tell the Sept 17
  pedagogy audit removed. It was reintroduced by data rather than by code, and
  the regression check from that audit is what caught it.

The model also anonymises juvenile parties as "State v. S.M.", where the
trailing period is part of the name, so the skip has to consume punctuation as
well as emphasis. All ten captured W3 runs now yield three fully cited
fabrications.

The lesson: a parser that only ever saw data written by the same hand that
wrote the parser has not been tested.

## The general rule

A capture is not automatically better than a good seed. Real output can
contradict an answer key, weaken a game, or disprove a module's premise
outright. `npm run verify` runs `scripts/check_recorded.py` first for exactly
this reason, and the checks in it are each a defect that reached a transcript
before it was caught.
