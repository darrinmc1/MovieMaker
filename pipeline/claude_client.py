"""
claude_client.py — Gemini API wrapper using direct HTTP (no SDK).
Compatible with Python 3.14 on Windows (no asyncio/SDK issues).
"""

import json
import urllib.request
import urllib.error
from typing import Any

import config


def _call_gemini_raw(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    """POST directly to Gemini generateContent endpoint. Returns raw text."""
    api_key = config.GEMINI_API_KEY
    model   = config.GEMINI_MODEL

    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7,
        },
    }

    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API HTTP {e.code}: {body}") from e

    try:
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response shape: {result}") from e


def call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    """Returns plain text response from Gemini."""
    return _call_gemini_raw(system_prompt, user_prompt, max_tokens)


def call_claude_json(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> Any:
    """Returns parsed JSON from Gemini response. Strips markdown fences if present."""
    raw = _call_gemini_raw(system_prompt, user_prompt, max_tokens)

    # Strip markdown code fences
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Remove first and last fence lines
        start = 1 if lines[0].startswith("```") else 0
        end   = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text  = "\n".join(lines[start:end]).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON: {e}\n\nRaw response:\n{raw[:500]}") from e
