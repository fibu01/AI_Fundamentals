"""Lab Model proxy for the Hallucination Lab.

Routes (all under /api):
  POST /api/run/{widget_id}   fill the approved template, forward to the gateway
  GET  /api/recorded/{widget_id}   serve the recorded fallback transcript
  GET  /api/health

Holds the gateway key in an environment variable; the browser never sees it.
Rejects any widget_id not in the template dictionary and any input field not
on that widget's allowlist. Logs widget_id, latency, and success only; no
student input is logged (PRD section 9).

Configuration (environment variables):
  GATEWAY_BASE_URL   e.g. https://ai-gateway.barry.edu/v1  (no default: read
                     the real value from /etc/litellm/config.yaml on
                     CRMDEVSRV03 at deploy time; do not hardcode from memory)
  GATEWAY_API_KEY    LiteLLM virtual key scoped to the Lab Model alias
  LAB_MODEL          model alias, default gemma-4-27b-it
  VISION_ENABLED     "1" if the gateway accepts image input for the Lab Model
  RECORDED_DIR       default ../frontend/src/data/recorded
  STATIC_DIR         optional path to the frontend build to serve at /
  FACULTY_NAME, FACULTY_FIELD   W7 subject (must match frontend src/config.js)
  RATE_LIMIT_PER_MIN default 60
"""
import asyncio
import base64
import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import templates as T

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("lab-proxy")

HERE = Path(__file__).resolve().parent
GATEWAY_BASE_URL = os.environ.get("GATEWAY_BASE_URL", "").rstrip("/")
GATEWAY_API_KEY = os.environ.get("GATEWAY_API_KEY", "")
LAB_MODEL = os.environ.get("LAB_MODEL", "gemma-4-27b-it")
VISION_ENABLED = os.environ.get("VISION_ENABLED", "0") == "1"
RECORDED_DIR = Path(os.environ.get("RECORDED_DIR", HERE.parent / "frontend" / "src" / "data" / "recorded"))
STATIC_DIR = os.environ.get("STATIC_DIR", str(HERE.parent / "frontend" / "dist"))
FACULTY_NAME = os.environ.get("FACULTY_NAME", "Dr. Jane Facultyname (PLACEHOLDER)")
FACULTY_FIELD = os.environ.get("FACULTY_FIELD", "nursing")
RATE_LIMIT_PER_MIN = int(os.environ.get("RATE_LIMIT_PER_MIN", "60"))
IMAGES_DIR = HERE.parent / "frontend" / "public" / "images"

STATUTE_TEXT = (HERE / "content" / "statute_692203.txt").read_text(encoding="utf-8")
RESUME_A = (HERE / "content" / "resume_a.txt").read_text(encoding="utf-8")
RESUME_B = (HERE / "content" / "resume_b.txt").read_text(encoding="utf-8")

app = FastAPI(title="Hallucination Lab proxy")

_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(ip: str):
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= RATE_LIMIT_PER_MIN:
        raise HTTPException(429, "Rate limit exceeded: 60 requests per minute")
    q.append(now)


async def gateway_chat(client: httpx.AsyncClient, messages, temperature=None, top_p=None, max_tokens=None):
    resp = await client.post(
        f"{GATEWAY_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {GATEWAY_API_KEY}"},
        json={
            "model": LAB_MODEL,
            "messages": messages,
            "temperature": T.DEFAULT_TEMPERATURE if temperature is None else temperature,
            "top_p": T.DEFAULT_TOP_P if top_p is None else top_p,
            "max_tokens": T.DEFAULT_MAX_TOKENS if max_tokens is None else max_tokens,
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


async def gateway_next_token_logprobs(client: httpx.AsyncClient, prompt: str, temperature: float, top_k: int = 20):
    """Top next-token candidates via the completions endpoint (vLLM logprobs)."""
    resp = await client.post(
        f"{GATEWAY_BASE_URL}/completions",
        headers={"Authorization": f"Bearer {GATEWAY_API_KEY}"},
        json={
            "model": LAB_MODEL,
            "prompt": prompt,
            "max_tokens": 1,
            "temperature": temperature,
            "logprobs": top_k,
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()["choices"][0]["logprobs"]
    top = data["top_logprobs"][0]  # {token: logprob}
    import math
    items = [(tok, math.exp(lp)) for tok, lp in top.items()]
    items.sort(key=lambda x: -x[1])
    return items


def chat_prompt(user_text: str):
    return [
        {"role": "system", "content": T.SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]


async def handle_w1(client, inputs):
    stem = inputs.get("stem")
    if stem not in T.W1_STEMS:
        raise HTTPException(400, "Unknown stem")
    try:
        temperature = max(0.0, min(1.5, float(inputs.get("temperature", 0.9))))
    except (TypeError, ValueError):
        raise HTTPException(400, "Bad temperature")
    # vLLM rejects temperature 0 with logprobs on some builds; floor at 0.05.
    items = await gateway_next_token_logprobs(client, stem, max(temperature, 0.05))
    candidates = [[tok.strip() or tok, round(p, 4)] for tok, p in items[:5]]
    return {"candidates": candidates}


async def handle_w3(client, inputs):
    return {"text": await gateway_chat(client, chat_prompt(T.W3_PROMPT))}


async def handle_w4(client, inputs):
    transcript = str(inputs.get("transcript", ""))[:8000]
    prior = inputs.get("prior_challenges", [])
    if not isinstance(prior, list) or len(prior) > 3:
        raise HTTPException(400, "Bad prior_challenges")
    if not transcript:
        raise HTTPException(400, "Missing transcript")
    messages = [
        {"role": "system", "content": T.SYSTEM_PROMPT},
        {"role": "user", "content": T.W3_PROMPT},
        {"role": "assistant", "content": transcript},
    ]
    for reply in prior:
        messages.append({"role": "user", "content": T.CHALLENGE})
        messages.append({"role": "assistant", "content": str(reply)[:4000]})
    messages.append({"role": "user", "content": T.CHALLENGE})
    return {"text": await gateway_chat(client, messages)}


async def handle_w5(client, inputs):
    return {"text": await gateway_chat(client, chat_prompt(T.W5_PROMPT))}


async def handle_w6(client, inputs):
    grounded = T.W6_GROUNDED_PREFIX.format(statute=STATUTE_TEXT)
    run_a, run_b = await asyncio.gather(
        gateway_chat(client, chat_prompt(T.W6_BARE_PROMPT)),
        gateway_chat(client, chat_prompt(grounded), temperature=0.3),
    )
    return {"runA": run_a, "runB": run_b}


async def handle_w7(client, inputs):
    prompt = T.W7_PROMPT.format(faculty_name=FACULTY_NAME, faculty_field=FACULTY_FIELD)
    return {"text": await gateway_chat(client, chat_prompt(prompt))}


async def handle_w8(client, inputs):
    texts = await asyncio.gather(*[
        gateway_chat(client, chat_prompt(T.W8_PROMPT), max_tokens=200) for _ in range(5)
    ])
    return {"texts": list(texts)}


async def handle_w9(client, inputs):
    async def probs_for(occ):
        items = await gateway_next_token_logprobs(client, f"The {occ} said that", 1.0, top_k=20)
        found = {"he": 0.0, "she": 0.0, "they": 0.0}
        for tok, p in items:
            key = tok.strip().lower()
            if key in found:
                found[key] += p
        total = sum(found.values()) or 1.0
        return occ, {k: round(v / total, 4) for k, v in found.items()}

    results = await asyncio.gather(*[probs_for(o) for o in T.W9_OCCUPATIONS])
    return {"stems": dict(results)}


async def handle_w10(client, inputs):
    async def score(resume):
        text = await gateway_chat(client, chat_prompt(T.W10_PROMPT.format(resume=resume)), max_tokens=80)
        m = re.search(r"\b(10|[1-9])\b", text)
        return int(m.group(1)) if m else None

    scores = await asyncio.gather(*([score(RESUME_A) for _ in range(10)] + [score(RESUME_B) for _ in range(10)]))
    scores_a = [s for s in scores[:10] if s is not None]
    scores_b = [s for s in scores[10:] if s is not None]
    return {"scoresA": scores_a, "scoresB": scores_b}


async def handle_w13(client, inputs):
    if not VISION_ENABLED:
        # PRD open item: gemma image input unconfirmed. Client falls back to recorded.
        raise HTTPException(501, "Vision not enabled for the Lab Model")
    image_id = inputs.get("image_id")
    if image_id not in T.W13_IMAGE_IDS:
        raise HTTPException(400, "Unknown image_id")
    candidates = list((IMAGES_DIR / "w13").glob(f"{image_id}.*"))
    if not candidates:
        raise HTTPException(404, "Image file missing")
    path = candidates[0]
    mime = {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(
        path.suffix.lstrip("."), "application/octet-stream")
    b64 = base64.b64encode(path.read_bytes()).decode()
    messages = [
        {"role": "system", "content": T.SYSTEM_PROMPT},
        {"role": "user", "content": [
            {"type": "text", "text": T.W13_PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]},
    ]
    return {"text": await gateway_chat(client, messages, max_tokens=30)}


HANDLERS = {
    "w1": handle_w1, "w3": handle_w3, "w4": handle_w4, "w5": handle_w5,
    "w6": handle_w6, "w7": handle_w7, "w8": handle_w8, "w9": handle_w9,
    "w10": handle_w10, "w13": handle_w13,
}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "gateway_configured": bool(GATEWAY_BASE_URL and GATEWAY_API_KEY),
        "model": LAB_MODEL,
        "vision_enabled": VISION_ENABLED,
    }


@app.get("/api/recorded/{widget_id}")
async def recorded(widget_id: str):
    if widget_id not in HANDLERS and widget_id not in T.ALLOWED_INPUTS:
        raise HTTPException(404, "Unknown widget")
    path = RECORDED_DIR / f"{widget_id}.json"
    if not path.exists():
        raise HTTPException(404, "No recorded transcript for this widget")
    return JSONResponse(json.loads(path.read_text(encoding="utf-8")))


@app.post("/api/run/{widget_id}")
async def run(widget_id: str, request: Request):
    rate_limit(request.client.host if request.client else "unknown")
    handler = HANDLERS.get(widget_id)
    if handler is None:
        raise HTTPException(404, "Unknown widget")
    try:
        body = await request.json()
    except Exception:
        body = {}
    inputs = body.get("inputs", {}) if isinstance(body, dict) else {}
    if not isinstance(inputs, dict):
        raise HTTPException(400, "Bad inputs")
    extra = set(inputs) - T.ALLOWED_INPUTS.get(widget_id, set())
    if extra:
        raise HTTPException(400, f"Fields not allowed for {widget_id}: {sorted(extra)}")
    if not GATEWAY_BASE_URL or not GATEWAY_API_KEY:
        raise HTTPException(503, "Gateway not configured")

    start = time.monotonic()
    ok = False
    try:
        async with httpx.AsyncClient() as client:
            result = await handler(client, inputs)
        ok = True
        return JSONResponse(result)
    except HTTPException:
        raise
    except Exception:
        log.exception("gateway call failed widget=%s", widget_id)
        raise HTTPException(502, "Gateway call failed")
    finally:
        log.info("run widget=%s latency_ms=%d success=%s",
                 widget_id, int((time.monotonic() - start) * 1000), ok)


# Serve the static frontend build when present (single-service deploy).
if Path(STATIC_DIR).is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
