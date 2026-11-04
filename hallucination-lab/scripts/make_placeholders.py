#!/usr/bin/env python3
"""Generate placeholder SVG images for W12, W13, and W14.

W13 placeholders contain the exact item counts from the manifest, so the
counting widget is fully testable. W12 and W14 placeholders are labeled
stand-ins: replace them with instructor-generated images before class
(PRD section 6, W12/W14) and keep the manifest metadata accurate.

Run from anywhere: paths resolve relative to this file.
"""
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "frontend" / "public" / "images"

HEADER = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">'
FOOTER = "</svg>"


def label(text, y=290, size=13):
    return (
        f'<text x="200" y="{y}" text-anchor="middle" font-family="sans-serif" '
        f'font-size="{size}" fill="#555">{text}</text>'
    )


def write(path: Path, body: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(HEADER + body + FOOTER, encoding="utf-8")


def person_icon(x, y, scale, color):
    return (
        f'<g transform="translate({x},{y}) scale({scale})">'
        f'<circle cx="0" cy="-14" r="9" fill="{color}"/>'
        f'<rect x="-11" y="-4" width="22" height="26" rx="8" fill="{color}"/></g>'
    )


def make_w12():
    rng = random.Random(12)
    colors = ["#8c6f5a", "#c9a689", "#5a708c", "#6f8c5a", "#8c5a6f", "#a0a0a0"]
    for grid in ["ceo", "nurse", "professor", "welfare"]:
        for i in range(1, 17):
            c = rng.choice(colors)
            body = (
                f'<rect width="400" height="300" fill="#f2efe9"/>'
                + person_icon(200, 150, 4.5, c)
                + label(f'PLACEHOLDER {grid} {i}: replace with generated image', 285)
            )
            write(IMG / "w12" / grid / f"{i}.svg", body)


def make_w13():
    rng = random.Random(13)
    specs = {
        "coins": 17, "jellybeans": 26, "toothpicks": 19,
        "pencils": 14, "books": 21, "crowd": 24,
    }
    for name, count in specs.items():
        shapes = []
        placed = []
        for _ in range(count):
            for _attempt in range(200):
                x, y = rng.uniform(30, 370), rng.uniform(30, 250)
                if all((x - px) ** 2 + (y - py) ** 2 > 34 ** 2 for px, py in placed):
                    placed.append((x, y))
                    break
            else:
                placed.append((rng.uniform(30, 370), rng.uniform(30, 250)))
        for x, y in placed:
            if name == "coins":
                shapes.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="#d4af37" stroke="#a2812a" stroke-width="2"/>')
            elif name == "jellybeans":
                c = rng.choice(["#e05263", "#5aa05a", "#5a70c8", "#e0a052", "#9a5ac8"])
                shapes.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="14" ry="9" fill="{c}" transform="rotate({rng.randint(0,180)} {x:.0f} {y:.0f})"/>')
            elif name == "toothpicks":
                a = rng.uniform(0, math.pi)
                dx, dy = 16 * math.cos(a), 16 * math.sin(a)
                shapes.append(f'<line x1="{x-dx:.0f}" y1="{y-dy:.0f}" x2="{x+dx:.0f}" y2="{y+dy:.0f}" stroke="#c8a165" stroke-width="3"/>')
            elif name == "pencils":
                shapes.append(f'<rect x="{x-4:.0f}" y="{y-16:.0f}" width="8" height="32" fill="#e8b830" stroke="#8a6d1c"/>')
            elif name == "books":
                shapes.append(f'<rect x="{x-9:.0f}" y="{y-13:.0f}" width="18" height="26" fill="#8c3b3b" stroke="#5a2525" stroke-width="2"/>')
            else:
                shapes.append(person_icon(x, y, 1.1, "#556"))
        body = f'<rect width="400" height="300" fill="#f7f5f0"/>' + "".join(shapes) + label(f"placeholder image: {name}")
        write(IMG / "w13" / f"{name}.svg", body)


def make_w14():
    # Head-to-head pairs: pairN_real (public-domain photo slot) and pairN_ai
    # (generated image slot). Placeholders differ subtly so the game is
    # playable in testing: the "ai" placeholder has a six-fingered hand motif.
    for i in range(1, 7):
        for kind in ("real", "ai"):
            fingers = 6 if kind == "ai" else 5
            hand = "".join(
                f'<rect x="{150 + f * 18}" y="90" width="10" height="{46 + (f % 3) * 8}" rx="5" fill="#8a8a8a"/>'
                for f in range(fingers)
            )
            body = (
                f'<rect width="400" height="300" fill="{"#efe2e6" if kind == "ai" else "#e2ecef"}"/>'
                + hand
                + f'<rect x="140" y="140" width="{20 + fingers * 18}" height="60" rx="18" fill="#8a8a8a"/>'
                + label(f'PLACEHOLDER pair{i} {kind}: replace per docs/IMAGE_PROMPTS.md', 40)
                + label(f'(placeholder tell: count the fingers)', 285, 11)
            )
            write(IMG / "w14" / f"pair{i}_{kind}.svg", body)


if __name__ == "__main__":
    make_w12()
    make_w13()
    make_w14()
    print(f"Placeholder images written under {IMG}")
