"""
VBook Pipeline — Gemini API wrapper (direct HTTP, no SDK)
Avoids google-genai SDK compatibility issues with Python 3.14
"""

import json
import re
import urllib.request
import urllib.error

import config


def _call_gemini_raw(prompt: str, max_tokens: int = 3000, temperature: float = 0.8) -> str:
    """Make a direct HTTP call to the Gemini API."""
    model = getattr(config, 'GEMINI_MODEL', 'gemini-2.5-flash')
    api_key = config.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"Gemini API error {e.code}: {body}") from e


def call_claude(system: str, user: str, max_tokens: int = 3000) -> str:
    """
    Call Gemini and return the text response.
    Named call_claude so the rest of the pipeline doesn't need to change.
    """
    full_prompt = f"{system}\n\n{user}"
    return _call_gemini_raw(full_prompt, max_tokens=max_tokens, temperature=0.8)


def call_claude_json(system: str, user: str, max_tokens: int = 2000) -> dict | list:
    """
    Call Gemini expecting a JSON response.
    Strips markdown fences and parses the result.
    Raises ValueError if the response is not valid JSON.
    """
    raw = call_claude(system, user, max_tokens)

    # Strip ```json ... ``` fences if Gemini adds them
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini returned invalid JSON.\nError: {e}\nRaw response:\n{raw[:500]}"
        ) from e
