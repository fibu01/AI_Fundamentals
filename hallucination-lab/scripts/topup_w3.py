#!/usr/bin/env python3
"""Top up w3.json until every topic has enough usable transcripts.

Citation Sort shuffles the model's fabricated citations with an equal number of
real cases. buildSortItems dedupes by case name, so a transcript where the
model lists the same invented case twice yields a four-row sort while the copy
promises six. The model repeats itself often enough that a straight capture
leaves some topics unusable, so re-roll only those.

  python3 topup_w3.py [--want 2] [--attempts 6] [--base http://localhost:8100]
"""
import argparse
import datetime
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "src" / "data" / "recorded" / "w3.json"
TOPICS = ["drone_surveillance", "red_light_cameras", "school_searches",
          "social_media_evidence", "police_body_cameras"]
CASE_RE = re.compile(r"[A-Z][A-Za-z'.,-]+(?: [A-Z][A-Za-z'.,-]+)* v\. [A-Z]")
CITE_RE = re.compile(r"\d+\s+[A-Za-z.]+(?:\s+[A-Za-z0-9.]+){0,3}\s+\d+\s*\([^)]{1,40}\)")


def usable(text):
    return len(set(CASE_RE.findall(text))) >= 3 and len(set(CITE_RE.findall(text))) >= 3


def ask(base, topic):
    req = urllib.request.Request(
        f"{base}/api/run/w3",
        data=json.dumps({"inputs": {"topic": topic}}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read())["text"]


ap = argparse.ArgumentParser()
ap.add_argument("--want", type=int, default=2)
ap.add_argument("--attempts", type=int, default=6)
ap.add_argument("--base", default="http://localhost:8100")
a = ap.parse_args()

doc = json.loads(OUT.read_text())
kept = [r for r in doc["runs"] if usable(r.get("text", ""))]
dropped = len(doc["runs"]) - len(kept)
print(f"kept {len(kept)} of {len(doc['runs'])} captured runs ({dropped} had repeated cases)")

for topic in TOPICS:
    have = sum(1 for r in kept if r.get("topic") == topic)
    tries = 0
    while have < a.want and tries < a.attempts:
        tries += 1
        try:
            text = ask(a.base, topic)
        except Exception as e:
            print(f"  {topic}: attempt {tries} failed: {e}")
            continue
        if usable(text):
            kept.append({"topic": topic, "text": text})
            have += 1
            print(f"  {topic}: +1 usable ({have}/{a.want})")
        else:
            print(f"  {topic}: attempt {tries} repeated a case, re-rolling")
    if have == 0:
        print(f"  !! {topic}: no usable transcript after {tries} attempts", file=sys.stderr)

kept.sort(key=lambda r: TOPICS.index(r["topic"]))
doc["runs"] = kept
doc["recorded_date"] = datetime.date.today().isoformat()
doc["note"] = (f"Captured from the live Lab Model on {doc['recorded_date']}. Runs where the model "
               "listed the same invented case twice were dropped and re-rolled: the sort panel "
               "dedupes by case name, so a repeat shrinks the game. See topup_w3.py.")
OUT.write_text(json.dumps(doc, indent=1) + "\n")
print(f"wrote {OUT} ({len(kept)} runs)")
for t in TOPICS:
    print(f"  {t}: {sum(1 for r in kept if r['topic'] == t)}")
