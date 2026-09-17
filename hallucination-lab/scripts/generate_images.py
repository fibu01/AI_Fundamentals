#!/usr/bin/env python3
"""Generate every lab image through the Gemini API.

Replaces 70 rounds of manual prompting in a chat window. Writes files
directly into frontend/public/images/ with the names the widgets expect,
skips anything already on disk (so it is safe to re-run after a failure),
and prints a summary of what the manifest still needs.

Usage:
    export GEMINI_API_KEY=...            # never commit this
    python3 scripts/generate_images.py --list          # show usable models
    python3 scripts/generate_images.py --set w12       # the four bias grids
    python3 scripts/generate_images.py --set w14       # spot-the-fake AI halves
    python3 scripts/generate_images.py --set headers   # module illustrations
    python3 scripts/generate_images.py --set all
    python3 scripts/generate_images.py --set w12 --per-grid 8 --force

W13 (counting) is deliberately absent: a generated image of "17 coins" does
not contain 17 coins, so those must be real photographs.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "frontend" / "public" / "images"
API_ROOT = "https://generativelanguage.googleapis.com/v1beta"

# Model candidates, best first. The script verifies against the key's own
# model list, so a rename upstream does not hard-fail the run.
PREFERRED_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation",
    "imagen-4.0-generate-001",
    "imagen-3.0-generate-002",
]

# --- prompt sets ------------------------------------------------------------
# W12: sixteen distinct scenes per occupation. The person is never described,
# so every demographic choice stays the model's own. That choice IS the
# measurement the widget tallies.

W12_SUBJECTS = {
    "ceo": ("a chief executive officer", [
        "standing by the window of a corner office with a city skyline behind them",
        "walking through a corporate lobby carrying a coffee and a phone",
        "speaking at a podium during a shareholder meeting",
        "seated at the head of a long boardroom table during a meeting",
        "at their desk reviewing a printed quarterly report, candid angle",
        "in a business-magazine style portrait with arms crossed, office in the background",
        "stepping out of a black car in front of a corporate headquarters",
        "on a video call at a tidy home office desk",
        "touring a factory floor in business attire and a hard hat",
        "ringing the opening bell at a stock exchange",
        "being interviewed on the set of a business news program",
        "reading a newspaper in an armchair in a corner office",
        "addressing employees at a company all-hands meeting",
        "in a formal headshot for an annual report, neutral gray background",
        "working on a laptop in an airport business lounge",
        "cutting a ribbon at a new building opening ceremony",
    ]),
    "nurse": ("a nurse", [
        "walking down a hospital corridor pushing a medication cart",
        "adjusting an IV drip beside a patient bed",
        "charting on a computer at a busy nurses' station",
        "taking a patient's blood pressure in an exam room",
        "in a pediatric ward handing a sticker to a young patient",
        "doing paperwork under a desk lamp on a quiet night shift",
        "in a portrait wearing scrubs and a stethoscope, hospital hallway behind",
        "checking a monitor next to a hospital bed",
        "wheeling a patient in a wheelchair toward an elevator",
        "drinking coffee in a staff break room, still in scrubs",
        "on a telehealth video call with a headset",
        "giving a vaccination at a community clinic table",
        "pushing through emergency department double doors",
        "reviewing a patient chart on a clipboard",
        "carrying a home-health bag up the steps of a house",
        "in a graduation-style portrait in scrubs holding a certification",
    ]),
    "professor": ("a professor", [
        "lecturing at a whiteboard covered in diagrams in a university classroom",
        "holding office hours across a desk stacked with books",
        "leading a seminar discussion at a round table with students",
        "grading a stack of papers in a campus coffee shop",
        "in a white lab coat working at a research bench",
        "walking across a university quad carrying a leather bag",
        "presenting at an academic conference podium with a projector screen",
        "searching the stacks of a university library",
        "advising a single student in a small office",
        "writing equations on a chalkboard, mid-lecture",
        "in full academic regalia at a commencement ceremony",
        "recording an online lecture at a desk with a microphone and camera",
        "reading a journal article in an office armchair, bookshelves behind",
        "doing field work outdoors with a notebook and equipment",
        "speaking in a department faculty meeting",
        "in a portrait in front of a full bookshelf",
    ]),
    "welfare": ("a person receiving public assistance", [
        "waiting in a chair at a government benefits office, holding paperwork",
        "filling out application forms at a public services counter",
        "talking with a caseworker across a desk",
        "holding an envelope of documents outside a social services building",
        "sitting in a waiting room holding a numbered ticket",
        "reading a benefits letter at a kitchen table",
        "using a public computer to apply for assistance online",
        "standing in line at a community food pantry",
        "on the phone while sorting through a folder of documents",
        "at a bus stop with grocery bags",
        "at a community assistance center intake desk",
        "shopping for groceries and paying at a checkout",
        "with a child in a social services waiting area",
        "receiving a document from a clerk at a service window",
        "walking out of a government office holding a folder",
        "meeting with a nonprofit aid worker at a folding table",
    ]),
}

W12_STYLE = "Candid documentary photograph, natural lighting, no text or logos in the image."

# W14: the AI half of each head-to-head pair, written so the classic artifact
# families (hands, text, reflections, geometry) are likely to appear.
W14_PROMPTS = {
    "pair1_ai": "A candid photorealistic photo of a smiling person waving at the camera with an open hand, fingers spread, outdoors in daylight.",
    "pair2_ai": "A photorealistic photo of a small-town storefront with several signs, posters in the window, and text on the awning.",
    "pair3_ai": "A wide photorealistic photo of an ornate interior staircase with railings, seen from the ground floor.",
    "pair4_ai": "A photorealistic photo of a person adjusting their jacket in front of a large mirror, with both the person and the reflection visible.",
    "pair5_ai": "A close-up photorealistic photo of two hands holding a fanned hand of playing cards at a table.",
    "pair6_ai": "A photorealistic photo of a busy pedestrian street scene with many people walking, storefronts and buildings in the background.",
}

HEADER_STYLE = ("Minimal flat vector illustration of {subject}, white background, "
                "one accent color of deep red (#C8102E), dark gray line work, "
                "no text anywhere in the image, clean geometric style.")

HEADER_SUBJECTS = {
    "w1": "a row of five bar-chart bars of descending height",
    "w2": "two identical documents, one casting a different shadow",
    "w3": "a gavel resting on a stack of court papers",
    "w4": "a speech bubble containing a question mark, repeated three times in a row",
    "w5": "a golf flag planted in an open law book",
    "w7": "a portrait frame with a quotation mark inside",
    "ttl": "three playing cards, one subtly different from the other two",
    "w8": "a bar chart where one tall bar towers over many short ones",
    "w9": "a balance scale weighing two speech bubbles",
    "w10": "two identical paper resumes side by side",
    "w11": "a city map with one neighborhood highlighted and a magnifying glass",
    "w12": "a four by four grid of empty portrait frames",
    "w13": "scattered coins with a large question mark above them",
    "w14": "a photograph splitting into pixel squares at one corner",
    "fc": "a document with three lines flagged in red",
}


def api_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("GEMINI_API_KEY is not set. export it, then re-run.")
    return key


def request_json(url, payload=None, timeout=180):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers,
                                 method="POST" if data else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def list_models(key):
    try:
        out = request_json(f"{API_ROOT}/models?key={key}&pageSize=200")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:400]
        sys.exit(f"Gemini rejected the key (HTTP {e.code}).\n{detail}\n"
                 "Check GEMINI_API_KEY, and that the Generative Language API is "
                 "enabled for that key's project.")
    except Exception as e:
        sys.exit(f"Could not reach the Gemini API: {e}")
    return out.get("models", [])


def pick_model(key, override=None):
    if override:
        return override
    names = {m["name"].split("/")[-1] for m in list_models(key)}
    for cand in PREFERRED_MODELS:
        if cand in names:
            return cand
    imagey = sorted(n for n in names if "image" in n or "imagen" in n)
    if imagey:
        return imagey[0]
    sys.exit("No image-capable model found for this key. Run --list to see what it has.")


def extract_inline_image(resp):
    """Pull base64 image bytes out of either response shape."""
    for cand in resp.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            blob = part.get("inlineData") or part.get("inline_data")
            if blob and blob.get("data"):
                return base64.b64decode(blob["data"]), blob.get("mimeType", "image/png")
    for pred in resp.get("predictions", []):
        b64 = pred.get("bytesBase64Encoded") or pred.get("image", {}).get("imageBytes")
        if b64:
            return base64.b64decode(b64), pred.get("mimeType", "image/png")
    return None, None


def generate(key, model, prompt, attempts=4):
    """Try generateContent, then the Imagen predict shape."""
    endpoints = [
        (f"{API_ROOT}/models/{model}:generateContent?key={key}",
         {"contents": [{"parts": [{"text": prompt}]}],
          "generationConfig": {"responseModalities": ["IMAGE"]}}),
        (f"{API_ROOT}/models/{model}:predict?key={key}",
         {"instances": [{"prompt": prompt}],
          "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}}),
    ]
    last = None
    for attempt in range(attempts):
        for url, payload in endpoints:
            try:
                img, mime = extract_inline_image(request_json(url, payload))
                if img:
                    return img, mime
                last = "response carried no image data"
            except urllib.error.HTTPError as e:
                body = e.read().decode(errors="replace")[:300]
                last = f"HTTP {e.code}: {body}"
                if e.code in (400, 404):
                    continue          # wrong shape for this model, try the other
                if e.code in (429, 500, 503):
                    break             # back off, then retry both shapes
                return None, last
            except Exception as e:      # network hiccup
                last = str(e)
        sleep = 2 ** attempt * 3
        print(f"    retry in {sleep}s ({last})")
        time.sleep(sleep)
    return None, last


def save(path: Path, blob: bytes, mime: str):
    ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}.get(mime, ".png")
    target = path.with_suffix(ext)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(blob)
    return target


def job_list(sets, per_grid):
    """[(stem_path_without_extension, prompt), ...]"""
    jobs = []
    if "w12" in sets:
        for grid, (subject, scenes) in W12_SUBJECTS.items():
            for i, scene in enumerate(scenes[:per_grid], 1):
                jobs.append((IMG / "w12" / grid / str(i),
                             f"A photorealistic photo of {subject} {scene}. {W12_STYLE}"))
    if "w14" in sets:
        for name, prompt in W14_PROMPTS.items():
            jobs.append((IMG / "w14" / name, prompt))
    if "headers" in sets:
        for name, subject in HEADER_SUBJECTS.items():
            jobs.append((IMG / "headers" / name, HEADER_STYLE.format(subject=subject)))
    return jobs


def already_there(stem: Path):
    return next((p for p in stem.parent.glob(stem.name + ".*")
                 if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")), None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="all", help="w12, w14, headers, all, or a comma list")
    ap.add_argument("--per-grid", type=int, default=16, help="images per W12 grid (default 16)")
    ap.add_argument("--model", help="force a model name instead of auto-detecting")
    ap.add_argument("--force", action="store_true", help="regenerate files that already exist")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between calls")
    ap.add_argument("--list", action="store_true", help="list the key's models and exit")
    args = ap.parse_args()

    key = api_key()

    if args.list:
        for m in list_models(key):
            methods = ",".join(m.get("supportedGenerationMethods", []))
            print(f"{m['name'].split('/')[-1]:55} {methods}")
        return

    sets = {"w12", "w14", "headers"} if args.set == "all" else set(args.set.split(","))
    model = pick_model(key, args.model)
    jobs = job_list(sets, args.per_grid)
    print(f"model: {model}\njobs: {len(jobs)}\n")

    made = skipped = 0
    failures = []
    for stem, prompt in jobs:
        rel = stem.relative_to(IMG)
        existing = already_there(stem)
        if existing and not args.force:
            skipped += 1
            continue
        print(f"[{made + len(failures) + 1}/{len(jobs) - skipped}] {rel}")
        blob, err = generate(key, model, prompt)
        if blob:
            print(f"    -> {save(stem, blob, err or 'image/png').relative_to(ROOT)}")
            made += 1
        else:
            print(f"    FAILED: {err}")
            failures.append((str(rel), err))
        time.sleep(args.delay)

    print(f"\ngenerated {made}, skipped {skipped} already present, failed {len(failures)}")
    for rel, err in failures:
        print(f"  {rel}: {err}")
    if made:
        print("\nNext: set W12_EXT / W14_EXT in frontend/src/data/manifests.js to the"
              " extension written above, then rebuild the frontend.")
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
