#!/usr/bin/env python3
"""Check recorded transcripts against what the widgets need from them.

Replacing an authored seed with a real capture can silently break a widget or
invalidate an answer key: W7's key said the named publication does not exist,
which stopped being true the moment the live model started naming real
journals. This script asserts the structural contract each widget relies on,
so a bad capture fails here instead of in front of a class.

  python3 check_recorded.py [--dir ../frontend/src/data/recorded]

Exit code 1 if anything fails.
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT = HERE.parent / "frontend" / "src" / "data" / "recorded"

CASE_RE = re.compile(r"[A-Z][A-Za-z'.,-]+(?: [A-Z][A-Za-z'.,-]+)* v\. [A-Z]")
CITE_RE = re.compile(r"\d+\s+[A-Za-z.]+(?:\s+[A-Za-z0-9.]+){0,3}\s+\d+\s*\([^)]{1,40}\)")
QUOTE_RE = re.compile(r"\"([^\"]{20,300})\"|“([^”]{20,300})”")

problems: list[str] = []
notes: list[str] = []


def fail(w, msg):
    problems.append(f"{w}: {msg}")


def note(w, msg):
    notes.append(f"{w}: {msg}")


def load(d, name):
    p = d / f"{name}.json"
    if not p.exists():
        fail(name, "file missing")
        return None
    return json.loads(p.read_text())


def check(d):
    for name in ("w1", "w3", "w4", "w5", "w7", "w8", "w9", "w10", "w13"):
        doc = load(d, name)
        if doc is None:
            continue
        runs = doc.get("runs") or []
        prov = doc.get("provenance", "seed")
        if not runs:
            fail(name, "no runs")
            continue
        if prov not in ("seed", "captured"):
            fail(name, f"provenance {prov!r} is neither seed nor captured")
        note(name, f"{prov}, {len(runs)} run(s)")

        if name == "w1":
            stems = runs[0].get("stems") or {}
            if not stems:
                fail(name, "no stems")
            for stem, bands in stems.items():
                for band in ("low", "mid", "high"):
                    c = (bands or {}).get(band)
                    if not c:
                        fail(name, f"stem {stem!r} missing band {band}")
                        continue
                    if not all(isinstance(x, (list, tuple)) and len(x) == 2 for x in c):
                        fail(name, f"stem {stem!r} band {band}: candidates must be [token, probability] pairs")
                tops = {b: (bands[b][0][1] if bands.get(b) else None) for b in ("low", "mid", "high")}
                if all(v is not None for v in tops.values()) and not (tops["low"] >= tops["mid"] >= tops["high"]):
                    fail(name, f"stem {stem!r}: top probability must fall as temperature rises, got {tops}. "
                               "The whole temperature lesson reads backwards otherwise.")

        elif name == "w3":
            # Citation Sort needs real case names AND reporter citations, or the
            # fabricated pile is distinguishable from the real pile by shape.
            for i, r in enumerate(runs):
                t = r.get("text", "")
                # Count UNIQUE names: buildSortItems dedupes by case name, so a
                # transcript that lists the same fabricated case twice yields a
                # four-row sort while the copy promises six. The model repeats
                # itself often enough that this is the common failure.
                names = set(CASE_RE.findall(t))
                cites = set(CITE_RE.findall(t))
                if len(names) < 3:
                    fail(name, f"run {i} ({r.get('topic')}): {len(names)} distinct 'X v. Y' case "
                               f"names, need 3 (repeats collapse in the sort panel)")
                if len(cites) < 3:
                    fail(name, f"run {i} ({r.get('topic')}): {len(cites)} distinct reporter citations, need 3")
                if not r.get("topic"):
                    fail(name, f"run {i}: no topic, the widget selects transcripts by topic")

        elif name == "w4":
            # Mirrors classifyChallengeReply in frontend/src/lib/utils.js.
            ADMIT = re.compile(r"cannot verify|can't verify|do not know|don't know|"
                               r"not able to confirm|may not exist|i made that up|not a real|"
                               r"not real|hallucinat|fabricat|made (them|that|it) up|"
                               r"no such (case|decision)")
            for i, r in enumerate(runs):
                turns = r.get("turns") or []
                if len(turns) < 3:
                    fail(name, f"run {i}: {len(turns)} challenge turns, widget asks 3")
                # Q1 is keyed "apologized and either restated the same case or
                # produced a new one, without checking anything". If a captured
                # model actually backs down on every challenge, that key is
                # wrong and the module is teaching something that did not
                # happen. Better behaviour from the model is good news and a
                # content change, not something to paper over.
                if turns and all(ADMIT.search(t.lower()) for t in turns):
                    fail(name, f"run {i}: the model admits it cannot verify on every challenge. "
                               "Q1's answer key says it re-asserts without checking; re-key the "
                               "question or keep the seed.")

        elif name == "w5":
            for i, r in enumerate(runs):
                v = r.get("variants") or {}
                for k in ("baseline", "low_temp", "ground", "ground_fallback"):
                    if not v.get(k):
                        fail(name, f"run {i}: missing variant {k}")
                pe = r.get("plantedErrors") or {}
                for k in ("ground", "ground_fallback"):
                    e = pe.get(k)
                    if not e:
                        fail(name, f"run {i}/{k}: no plantedErrors entry; the grounding lesson needs one")
                        continue
                    if e.get("claim") and e["claim"] not in v.get(k, ""):
                        fail(name, f"run {i}/{k}: plantedErrors claim is not in the transcript")

        elif name == "w7":
            for i, r in enumerate(runs):
                t = r.get("text", "")
                if not QUOTE_RE.search(t):
                    fail(name, f"run {i}: no quoted string; the barry.edu search link needs one")
            note(name, "publication may be a real journal; Q1 asks about the quote, not the outlet")

        elif name == "w8":
            for i, r in enumerate(runs):
                variants = r.get("variants") or {}
                if "bare" not in variants:
                    fail(name, f"run {i}: no 'bare' variant")
                for k, outs in variants.items():
                    if len(outs or []) < 5:
                        fail(name, f"run {i}: variant {k} has {len(outs or [])} outputs, "
                                   "the widget presents 5 runs and tallies 25 slots")

        elif name == "w9":
            stems = runs[0].get("stems") or {}
            if len(stems) < 10:
                fail(name, f"{len(stems)} occupation stems, widget shows 10")
            for occ, p in stems.items():
                if not all(k in (p or {}) for k in ("he", "she", "they")):
                    fail(name, f"{occ}: needs he/she/they probabilities")
            if stems and not any((p or {}).get("she", 0) > (p or {}).get("he", 0) for p in stems.values()):
                fail(name, "no occupation tilts toward 'she'; Q1 asks which one does")

        elif name == "w10":
            for i, r in enumerate(runs):
                a, b = r.get("scoresA") or [], r.get("scoresB") or []
                if len(a) < 10 or len(b) < 10:
                    fail(name, f"run {i}: {len(a)}/{len(b)} scores, widget claims ten each")
                if not all(isinstance(x, (int, float)) for x in a + b):
                    fail(name, f"run {i}: non-numeric score")

        elif name == "w13":
            need = {"coins", "jellybeans", "toothpicks", "pencils", "books", "crowd"}
            for i, r in enumerate(runs):
                got = set((r.get("answers") or {}).keys())
                if not need <= got:
                    fail(name, f"run {i}: missing counts for {sorted(need - got)}")


ap = argparse.ArgumentParser()
ap.add_argument("--dir", default=str(DEFAULT))
a = ap.parse_args()
check(Path(a.dir))

for n in notes:
    print(f"  note  {n}")
for p in problems:
    print(f"  FAIL  {p}")
print(f"\n{'PASS: recorded transcripts satisfy every widget contract' if not problems else f'{len(problems)} problem(s)'}")
sys.exit(1 if problems else 0)
