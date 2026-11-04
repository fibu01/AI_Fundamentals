#!/usr/bin/env python3
"""Capture recorded fallback transcripts from the live proxy.

Runs each live widget's template several times through the running proxy and
writes the outputs to frontend/src/data/recorded/<widget>.json in the shapes
the frontend expects. Re-run each semester (PRD section 9), then rebuild the
frontend so the bundled fallbacks update too.

Usage:
  python3 capture_recorded.py [--base http://localhost:8100] [--runs 5] [--widgets w3,w5]

Requires the proxy to be running with a configured gateway.
"""
import argparse
import datetime
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "src" / "data" / "recorded"

W1_STEMS = [
    "The capital of Florida is",
    "The nurse walked into the room and",
    "In 1969, humans first landed on",
    "Barry University is located in",
    "The most important skill for college students is",
]
W13_IMAGES = ["coins", "jellybeans", "toothpicks", "pencils", "books", "crowd"]


def post(base, widget, inputs):
    req = urllib.request.Request(
        f"{base}/api/run/{widget}",
        data=json.dumps({"inputs": inputs}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def capture(base, widget, runs):
    today = datetime.date.today().isoformat()
    note = f"Captured from the live Lab Model via capture_recorded.py on {today}."
    out = {"widget": widget, "recorded_date": today, "provenance": "captured",
           "note": note, "runs": []}

    if widget == "w1":
        stems = {}
        for stem in W1_STEMS:
            bands = {}
            for band, temp in [("low", 0.2), ("mid", 0.9), ("high", 1.4)]:
                data = post(base, "w1", {"stem": stem, "temperature": temp})
                bands[band] = data["candidates"]
            stems[stem] = bands
        out["runs"] = [{"stems": stems}]
    elif widget == "w3":
        # Two runs per topic so different students see different fabrications.
        topics = ["drone_surveillance", "red_light_cameras", "school_searches",
                  "social_media_evidence", "police_body_cameras"]
        for topic in topics:
            for _ in range(2):
                out["runs"].append({"topic": topic, "text": post(base, "w3", {"topic": topic})["text"]})
    elif widget == "w5":
        # One output per technique variant per run, matching the bench's
        # recorded-mode mapping in W5Statute.jsx.
        variant_techniques = {
            "baseline": [],
            "low_temp": ["low_temp"],
            "ground": ["ground"],
            "ground_fallback": ["ground", "fallback"],
        }
        for _ in range(min(runs, 3)):
            variants = {
                name: post(base, "w5", {"techniques": tech})["text"]
                for name, tech in variant_techniques.items()
            }
            out["runs"].append({"variants": variants})
    elif widget == "w7":
        for _ in range(runs):
            out["runs"].append({"text": post(base, widget, {})["text"]})
    elif widget == "w4":
        # Build challenge chains on top of fresh w3 transcripts.
        for _ in range(min(runs, 3)):
            transcript = post(base, "w3", {"topic": "drone_surveillance"})["text"]
            turns = []
            for _i in range(3):
                reply = post(base, "w4", {"transcript": transcript, "prior_challenges": turns})["text"]
                turns.append(reply)
            out["runs"].append({"turns": turns})
    elif widget == "w8":
        variants = {
            v: post(base, "w8", {"variant": v})["texts"]
            for v in ("bare", "women", "world")
        }
        out["runs"] = [{"variants": variants}]
    elif widget == "w9":
        out["runs"] = [post(base, "w9", {})]
    elif widget == "w10":
        out["runs"] = [post(base, "w10", {})]
        out["runs"][0]["labelA"] = "Resume A (Emily Carter, Women's Chess Club captain)"
        out["runs"][0]["labelB"] = "Resume B (Michael Carter, Chess Club captain)"
    elif widget == "w13":
        for _ in range(min(runs, 3)):
            answers = {}
            for img in W13_IMAGES:
                text = post(base, "w13", {"image_id": img})["text"]
                digits = "".join(c for c in text if c.isdigit())
                answers[img] = int(digits) if digits else None
            out["runs"].append({"answers": answers})
    else:
        print(f"skip {widget}: no capture recipe")
        return

    path = OUT / f"{widget}.json"
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path} ({len(out['runs'])} runs)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8100")
    ap.add_argument("--runs", type=int, default=5)
    ap.add_argument("--widgets", default="w1,w3,w4,w5,w7,w8,w9,w10,w13")
    args = ap.parse_args()
    failures = []
    for w in args.widgets.split(","):
        w = w.strip()
        try:
            capture(args.base, w, args.runs)
        except Exception as e:
            print(f"FAILED {w}: {e}")
            failures.append(w)
    if failures:
        print(f"\nFailed widgets: {', '.join(failures)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
