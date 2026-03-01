"""
VBook Pipeline — Google Drive & Sheets clients
Authenticated via a Service Account JSON key file.
"""

import io
import json
import os
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

import config


def _credentials():
    key_path = config.GOOGLE_SERVICE_ACCOUNT_JSON
    return service_account.Credentials.from_service_account_file(
        key_path, scopes=config.GOOGLE_SCOPES
    )


def get_drive_service():
    return build("drive", "v3", credentials=_credentials(), cache_discovery=False)


def get_sheets_service():
    return build("sheets", "v4", credentials=_credentials(), cache_discovery=False)


# ── Drive helpers ─────────────────────────────────────────────────────────────

def get_or_create_folder(drive, name: str, parent_id: str) -> str:
    """Return the Drive folder ID for `name` inside `parent_id`, creating it if needed."""
    q = (
        f"name='{name}' and mimeType='application/vnd.google-apps.folder'"
        f" and '{parent_id}' in parents and trashed=false"
    )
    results = drive.files().list(q=q, fields="files(id,name)").execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]
    meta = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    }
    folder = drive.files().create(body=meta, fields="id").execute()
    print(f"  Created Drive folder: {name}")
    return folder["id"]


def upload_text_file(drive, filename: str, content: str, parent_id: str) -> str:
    """Upload a UTF-8 text file to Drive. Returns the file ID."""
    # Check if file already exists (update rather than duplicate)
    q = f"name='{filename}' and '{parent_id}' in parents and trashed=false"
    existing = drive.files().list(q=q, fields="files(id)").execute().get("files", [])

    media = MediaIoBaseUpload(
        io.BytesIO(content.encode("utf-8")),
        mimetype="text/plain",
        resumable=False,
    )
    if existing:
        file_id = existing[0]["id"]
        drive.files().update(fileId=file_id, media_body=media).execute()
        print(f"  Updated Drive file: {filename}")
        return file_id
    else:
        meta = {"name": filename, "parents": [parent_id]}
        f = drive.files().create(body=meta, media_body=media, fields="id").execute()
        print(f"  Created Drive file: {filename}")
        return f["id"]


def upload_binary_file(drive, filename: str, data: bytes, mimetype: str, parent_id: str) -> str:
    """Upload a binary file (image, audio, video) to Drive. Returns the file ID."""
    q = f"name='{filename}' and '{parent_id}' in parents and trashed=false"
    existing = drive.files().list(q=q, fields="files(id)").execute().get("files", [])

    media = MediaIoBaseUpload(io.BytesIO(data), mimetype=mimetype, resumable=True)
    if existing:
        file_id = existing[0]["id"]
        drive.files().update(fileId=file_id, media_body=media).execute()
        print(f"  Updated Drive file: {filename}")
        return file_id
    else:
        meta = {"name": filename, "parents": [parent_id]}
        f = drive.files().create(body=meta, media_body=media, fields="id").execute()
        print(f"  Created Drive file: {filename}")
        return f["id"]


def download_text_file(drive, file_id: str) -> str:
    """Download a text file from Drive and return its content as a string."""
    request = drive.files().get_media(fileId=file_id)
    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue().decode("utf-8")


def make_file_public(drive, file_id: str) -> str:
    """Make a Drive file publicly readable. Returns a direct view URL."""
    drive.permissions().create(
        fileId=file_id,
        body={"role": "reader", "type": "anyone"},
    ).execute()
    return f"https://drive.google.com/file/d/{file_id}/view"


def get_image_embed_url(file_id: str) -> str:
    """Return a direct thumbnail URL suitable for <img> tags."""
    return f"https://drive.google.com/thumbnail?id={file_id}&sz=w1200"


def get_video_embed_url(file_id: str) -> str:
    """Return a Google Drive video embed URL suitable for <iframe>."""
    return f"https://drive.google.com/file/d/{file_id}/preview"


# ── Sheets helpers ────────────────────────────────────────────────────────────

def sheets_read(sheets, tab: str, range_: str = "A:Z") -> list[list]:
    """Read all rows from a Sheets tab. Returns list of rows (each row is a list of strings)."""
    result = (
        sheets.spreadsheets()
        .values()
        .get(spreadsheetId=config.GOOGLE_SHEET_ID, range=f"{tab}!{range_}")
        .execute()
    )
    return result.get("values", [])


def sheets_append(sheets, tab: str, row: list) -> None:
    """Append a single row to a Sheets tab."""
    sheets.spreadsheets().values().append(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range=f"{tab}!A1",
        valueInputOption="USER_ENTERED",
        body={"values": [row]},
    ).execute()


def sheets_update_cell(sheets, tab: str, row_index: int, col_index: int, value: str) -> None:
    """Update a single cell (1-based row and col, accounting for header row)."""
    col_letter = chr(ord("A") + col_index)
    range_ = f"{tab}!{col_letter}{row_index + 1}"  # +1 for header
    sheets.spreadsheets().values().update(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range=range_,
        valueInputOption="USER_ENTERED",
        body={"values": [[value]]},
    ).execute()


def sheets_find_row(sheets, tab: str, col_index: int, value: str) -> int | None:
    """Return the 1-based row index of the first row where col_index matches value. None if not found."""
    rows = sheets_read(sheets, tab)
    for i, row in enumerate(rows[1:], start=2):  # skip header
        if len(row) > col_index and row[col_index] == str(value):
            return i
    return None


def rows_to_dicts(rows: list[list]) -> list[dict]:
    """Convert a Sheets response (rows with header) into a list of dicts."""
    if not rows:
        return []
    headers = rows[0]
    return [
        {headers[j]: row[j] if j < len(row) else "" for j in range(len(headers))}
        for row in rows[1:]
    ]
