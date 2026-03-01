"""
VBook Pipeline — Gemini API wrapper (using new google.genai SDK)
"""

import json
import re

from google import genai
from google.genai import types
import config

_client = None


def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def call_claude(system: str, user: str, max_tokens: int = 3000) -> str:
    """
    Call Gemini and return the text response.
    Named call_claude so the rest of the pipeline doesn't need to change.
    """
    client = get_client()
    full_prompt = f"{system}\n\n{user}"
    response = client.models.generate_content(
        model=config.GEMINI_MODEL,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0.8,
        ),
    )
    return response.text.strip()


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
