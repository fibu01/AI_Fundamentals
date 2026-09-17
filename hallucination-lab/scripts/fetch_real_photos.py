#!/usr/bin/env python3
"""Fetch the real half of each W14 spot-the-fake pair from Wikimedia Commons.

The AI halves are instructor-generated. The real halves must be photographs,
so this searches Commons for each pair's subject, keeps only freely licensed
files, downloads the best match, and writes a credits file.

Licence policy: public domain and CC0 first. CC BY / CC BY-SA are accepted as
a fallback because they are free for classroom use, but they require
attribution, so every file used is listed in CREDITS.md with its licence and
source URL.

Usage:
    python3 scripts/fetch_real_photos.py            # fill missing pairs
    python3 scripts/fetch_real_photos.py --force    # re-fetch all
    python3 scripts/fetch_real_photos.py --pair 3   # just one
"""
import argparse
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "images" / "w14"
CREDITS = ROOT / "docs" / "IMAGE_CREDITS.md"
UA = "BarryAIFundamentalsLab/1.0 (jmoses@barry.edu) course-material"

# Search terms per pair, matching the AI prompts in docs/IMAGE_PROMPTS.md.
# Several phrasings per pair because Commons coverage is uneven.
PAIRS = {
    1: ("person waving", ["waving hand colour photograph 2015", "person waving greeting outdoors 2018",
                          "woman waving hand 2019"]),
    2: ("storefront with signs", ["shop front 2016 colour photograph", "bakery shopfront 2018",
                                  "cafe storefront signage 2017"]),
    3: ("interior staircase", ["staircase interior 2017 colour", "hotel staircase interior 2016",
                               "museum staircase interior 2018"]),
    4: ("person at a mirror", ["mirror reflection selfie 2018", "person reflected mirror 2017",
                               "mirror room reflection 2019"]),
    5: ("hands holding cards", ["hand holding playing cards 2016", "playing cards fan hand colour",
                                "card game hand cards 2018"]),
    6: ("busy street scene", ["pedestrian shopping street 2018", "crowded street people 2017 colour",
                              "city street pedestrians 2019"]),
}

FREE = ("public domain", "cc0", "pdm", "cc by", "cc-by")
BLOCKED = ("fair use", "non-free", "nc", "nd")

# Titles that signal an archival scan rather than a present-day photograph.
HISTORICAL = re.compile(
    r"\b(18\d\d|19[0-7]\d)\b|circa|c\.\s?1[89]|archive|collection|"
    r"daguerreotype|lantern slide|postcard|engraving|lithograph", re.I)

MIN_SATURATION = 28      # mean HSV saturation; sepia and greyscale fall below


def colour_stats(blob):
    """Mean saturation of the image, used to reject greyscale and sepia."""
    try:
        im = Image.open(io.BytesIO(blob)).convert("RGB")
    except Exception:
        return 0
    im.thumbnail((160, 160))
    sat = im.convert("HSV").split()[1]
    return sum(sat.getdata()) / max(1, len(sat.getdata()))


_last_call = [0.0]


def get(url, attempts=5):
    """Commons rate-limits bursts, so pace requests and back off on 429."""
    for attempt in range(attempts):
        gap = time.monotonic() - _last_call[0]
        if gap < 1.5:
            time.sleep(1.5 - gap)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                _last_call[0] = time.monotonic()
                return r.read()
        except urllib.error.HTTPError as e:
            _last_call[0] = time.monotonic()
            if e.code in (429, 503) and attempt < attempts - 1:
                wait = 5 * (attempt + 1)
                print(f"    rate limited, waiting {wait}s")
                time.sleep(wait)
                continue
            raise


def search(term, limit=12):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": "6", "gsrlimit": str(limit),
        "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "1400",
    })
    data = json.loads(get(f"https://commons.wikimedia.org/w/api.php?{q}"))
    return list(data.get("query", {}).get("pages", {}).values())


def licence_of(page):
    md = page["imageinfo"][0].get("extmetadata", {})
    return re.sub(r"<[^>]+>", "", md.get("LicenseShortName", {}).get("value", "")).strip()


def credit_of(page):
    md = page["imageinfo"][0].get("extmetadata", {})
    who = md.get("Artist", {}).get("value", "") or md.get("Credit", {}).get("value", "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", who)).strip()[:90] or "Unknown"


def rank(page):
    """Prefer a modern colour photo. Licence is a filter, not the main sort:
    ranking public domain first pulled in archival scans, which let students
    win the game on "this one looks old" instead of on artifacts."""
    lic = licence_of(page).lower()
    score = 0
    if lic.startswith("cc by") or "cc0" in lic:
        score += 60          # modern uploads, freely usable with credit
    elif "public domain" in lic or "pdm" in lic:
        score += 20
    if HISTORICAL.search(page.get("title", "")):
        score -= 200         # archival scan: wrong era for the comparison
    ii = page["imageinfo"][0]
    w, h = ii.get("width", 0), ii.get("height", 0)
    if w and h:
        if 1.1 <= w / h <= 2.0:
            score += 20              # landscape, close to the grid's 4:3 box
        if w >= 1200:
            score += 10
    return score


def usable(page):
    lic = licence_of(page).lower()
    if not lic or any(b in lic for b in BLOCKED if b not in ("nc", "nd")):
        return False
    if re.search(r"\bnc\b|\bnd\b", lic):
        return False
    return any(f in lic for f in FREE)


def fetch_pair(n, force):
    label, terms = PAIRS[n]
    dest = OUT / f"pair{n}_real.jpg"
    if dest.exists() and not force:
        print(f"pair{n}: already present, skipping")
        return None
    for term in terms:
        try:
            pages = [p for p in search(term) if usable(p)]
        except Exception as e:
            print(f"pair{n}: search failed for '{term}': {e}")
            continue
        for page in sorted(pages, key=rank, reverse=True):
            ii = page["imageinfo"][0]
            url = ii.get("thumburl") or ii.get("url")
            try:
                blob = get(url)
            except Exception:
                continue
            if len(blob) < 20000:        # too small to be a usable photo
                continue
            sat = colour_stats(blob)
            if sat < MIN_SATURATION:
                print(f"    skipped {page['title'][:40]} (saturation {sat:.0f}, reads as greyscale/sepia)")
                continue
            dest.write_bytes(blob)
            rec = {
                "pair": n, "subject": label, "title": page["title"], "saturation": round(sat),
                "licence": licence_of(page), "credit": credit_of(page),
                "source": ii.get("descriptionurl", ""),
            }
            print(f"pair{n} ({label}): {page['title'][:48]} [{rec['licence']}]")
            # Placeholder is superseded once a real photo lands.
            svg = OUT / f"pair{n}_real.svg"
            if svg.exists():
                svg.unlink()
            return rec
    print(f"pair{n} ({label}): NO usable freely licensed photo found")
    return None


def write_credits(records):
    lines = ["# Image credits", "",
             "The real half of each W14 spot-the-fake pair comes from Wikimedia",
             "Commons. The AI halves are instructor-generated and need no credit.",
             "Licences requiring attribution are satisfied by this file; keep it with",
             "the lab if the images are reused.", ""]
    for r in sorted(records, key=lambda x: x["pair"]):
        lines += [f"**Pair {r['pair']}, {r['subject']}**  ",
                  f"{r['title']}  ",
                  f"Licence: {r['licence']} &middot; Credit: {r['credit']}  ",
                  f"Source: {r['source']}", ""]
    CREDITS.write_text("\n".join(lines))
    print(f"\nwrote {CREDITS.relative_to(ROOT)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--pair", type=int, choices=sorted(PAIRS))
    args = ap.parse_args()
    targets = [args.pair] if args.pair else sorted(PAIRS)
    records = [r for r in (fetch_pair(n, args.force) for n in targets) if r]
    if records:
        write_credits(records)


if __name__ == "__main__":
    main()
