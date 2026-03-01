"""
VBook Pipeline — Drive folder structure setup
Run this once to create all required folders in Google Drive.
Also exposes helpers to get folder IDs for chapters/acts/images/media.
"""

import config
from google_clients import get_drive_service, get_or_create_folder

# Cache of folder IDs to avoid repeated API calls
_folder_cache: dict[str, str] = {}


def ensure_structure(drive=None) -> dict[str, str]:
    """
    Create the full VBook folder structure in Drive if it doesn't exist.
    Returns a dict of key → folder_id for the top-level folders.
    """
    if drive is None:
        drive = get_drive_service()

    root = config.GOOGLE_DRIVE_ROOT_FOLDER_ID

    chapters_id = get_or_create_folder(drive, config.DRIVE_CHAPTERS_FOLDER, root)
    images_id   = get_or_create_folder(drive, config.DRIVE_IMAGES_FOLDER,   root)
    media_id    = get_or_create_folder(drive, config.DRIVE_MEDIA_FOLDER,    root)
    chars_id    = get_or_create_folder(drive, config.DRIVE_CHARS_FOLDER,    root)

    ids = {
        "chapters": chapters_id,
        "images":   images_id,
        "media":    media_id,
        "characters": chars_id,
    }
    _folder_cache.update(ids)
    return ids


def get_chapter_folder(drive, chapter_num: int) -> str:
    """Get (or create) Drive folder: VBook/Chapters/Chapter_XX/"""
    key = f"chapter_{chapter_num:02d}"
    if key in _folder_cache:
        return _folder_cache[key]
    if "chapters" not in _folder_cache:
        ensure_structure(drive)
    folder_id = get_or_create_folder(
        drive, f"Chapter_{chapter_num:02d}", _folder_cache["chapters"]
    )
    _folder_cache[key] = folder_id
    return folder_id


def get_act_images_folder(drive, chapter_num: int, act_num: int) -> str:
    """Get (or create) Drive folder: VBook/Images/Chapter_XX/Act_Y/"""
    key = f"images_ch{chapter_num:02d}_act{act_num}"
    if key in _folder_cache:
        return _folder_cache[key]
    if "images" not in _folder_cache:
        ensure_structure(drive)
    ch_folder = get_or_create_folder(
        drive, f"Chapter_{chapter_num:02d}", _folder_cache["images"]
    )
    act_folder = get_or_create_folder(drive, f"Act_{act_num}", ch_folder)
    _folder_cache[key] = act_folder
    return act_folder


def get_media_folder(drive) -> str:
    """Get the VBook/Media/ folder ID."""
    if "media" not in _folder_cache:
        ensure_structure(drive)
    return _folder_cache["media"]


if __name__ == "__main__":
    print("Setting up Google Drive folder structure...")
    drive = get_drive_service()
    ids = ensure_structure(drive)
    print("\nFolder IDs:")
    for name, fid in ids.items():
        print(f"  {name}: {fid}")
    print("\nDone. All folders are ready.")
