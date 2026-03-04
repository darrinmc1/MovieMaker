"""
config.py — Load environment variables from .env file in the pipeline folder.
"""

import os
from pathlib import Path

# Load .env file manually (no python-dotenv required)
_ENV_PATH = Path(__file__).parent / ".env"
if _ENV_PATH.exists():
    for line in _ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

# Expose commonly used values
GEMINI_API_KEY  = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL    = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
FAL_API_KEY     = os.environ.get("FAL_KEY", "")
CLAUDE_MODEL    = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")
GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")
