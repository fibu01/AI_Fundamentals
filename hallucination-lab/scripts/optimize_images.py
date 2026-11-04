#!/usr/bin/env python3
"""Resize lab photos to web size.

Generated images arrive around 1536x1024 and 2 MB each. The W12 grid shows
them near 290 px wide and W14 magnifies at 2.5x, so full resolution costs a
lab full of students a lot of bandwidth for pixels no one sees: 64 images at
2 MB is 125 MB per student, and twenty students on the same network makes
the grid look broken.

Rewrites each photo as a JPEG capped at MAX_W, in place, replacing the
original file. Originals remain in git history.

Usage: python3 scripts/optimize_images.py [--max-width 900] [--quality 82] [--dry-run]
"""
import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "frontend" / "public" / "images"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-width", type=int, default=900)
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    before = after = 0
    changed = 0
    for src in sorted(IMG.rglob("*")):
        if src.suffix.lower() not in (".png", ".jpg", ".jpeg"):
            continue
        size_in = src.stat().st_size
        before += size_in
        with Image.open(src) as im:
            im = im.convert("RGB")
            if im.width > args.max_width:
                h = round(im.height * args.max_width / im.width)
                im = im.resize((args.max_width, h), Image.LANCZOS)
            dst = src.with_suffix(".jpg")
            if args.dry_run:
                after += size_in
                continue
            im.save(dst, "JPEG", quality=args.quality, optimize=True, progressive=True)
        if src.suffix.lower() != ".jpg":
            src.unlink()
        after += dst.stat().st_size
        changed += 1

    mb = lambda b: b / 1048576
    print(f"{changed} images rewritten")
    print(f"before: {mb(before):.1f} MB   after: {mb(after):.1f} MB"
          f"   saved: {mb(before - after):.1f} MB"
          f" ({100 * (before - after) / before:.0f}%)" if before else "nothing to do")


if __name__ == "__main__":
    main()
