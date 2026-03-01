# VBook Pipeline — Setup Guide (Windows)

Complete these steps in order. Each step is short. The whole setup takes about 20 minutes.

---

## Step 1 — Create a Google Service Account

You already have a Google Cloud project from Phase 1. Now add a Service Account to it.
A service account is like a robot user — it authenticates automatically without OAuth popups.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your existing `vbook` project
3. Go to **IAM & Admin → Service Accounts**
4. Click **Create Service Account**
   - Name: `vbook-pipeline`
   - Description: `VBook content pipeline`
   - Click **Create and Continue**
5. For role, select **Basic → Editor** → click **Continue** → click **Done**
6. Click on the new service account in the list
7. Go to the **Keys** tab → **Add Key → Create new key → JSON**
8. A `.json` file will download — save it somewhere safe, e.g.:
   ```
   C:\Users\Client\vbook-service-account.json
   ```
9. **Important:** Do NOT commit this file to git. Add it to .gitignore.

---

## Step 2 — Share your Google Sheet with the Service Account

1. Open your VBook Master Google Sheet
2. Click **Share** (top right)
3. Paste the service account email address — it looks like:
   ```
   vbook-pipeline@vbook-XXXXX.iam.gserviceaccount.com
   ```
   (find it in the JSON file under `"client_email"`)
4. Set permission to **Editor**
5. Click **Send**

---

## Step 3 — Create the VBook Drive folder and share it

1. Go to [drive.google.com](https://drive.google.com)
2. Create a new folder called **VBook**
3. Right-click the folder → **Share**
4. Paste the same service account email from Step 2
5. Set permission to **Editor** → click **Send**
6. Open the folder and copy its ID from the URL:
   ```
   https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID
   ```

---

## Step 4 — Set up the Python environment

Open **Command Prompt** or **PowerShell** in the `vbook-pipeline` folder:

```cmd
cd C:\Users\Client\Desktop\vbook-pipeline

# Create a virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 5 — Create your .env file

Copy `.env.example` to `.env` and fill in your values:

```cmd
copy .env.example .env
```

Then open `.env` in Notepad and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here

GOOGLE_SERVICE_ACCOUNT_JSON=C:\Users\Client\vbook-service-account.json

GOOGLE_DRIVE_ROOT_FOLDER_ID=paste-your-VBook-folder-id-here

GOOGLE_SHEET_ID=paste-your-sheet-id-here

CLAUDE_MODEL=claude-sonnet-4-6
```

Leave the OPENAI_API_KEY blank for now — you only need it for image generation (Phase 5).

---

## Step 6 — Run the setup phase

With your virtual environment activated:

```cmd
python pipeline.py --phase setup
```

You should see output like:

```
[10:23:01] === PHASE: SETUP ===
[10:23:01] Connecting to Google Drive...
[10:23:02]   Created Drive folder: Chapters
[10:23:02]   Created Drive folder: Images
[10:23:02]   Created Drive folder: Media
[10:23:02]   Created Drive folder: Characters
[10:23:02] Drive folders ready:
[10:23:02]   chapters: https://drive.google.com/drive/folders/...
[10:23:03] Connecting to Google Sheets...
[10:23:03] World_Info: 5 lines read
[10:23:03] Characters: 3 character(s) found
[10:23:03] Setup complete.
```

If you see an error, check:
- The service account email is shared on the Sheet AND the Drive folder
- The JSON file path in `.env` uses backslashes: `C:\Users\...`
- The folder ID and sheet ID are correct

---

## Step 7 — Run the Neon DB migration

1. Go to [console.neon.tech](https://console.neon.tech)
2. Open your project → **SQL Editor**
3. Copy and paste the contents of `neon_migration.sql`
4. Click **Run**
5. You should see a list of table names at the bottom confirming success

---

## Step 8 — Generate Chapter 1

```cmd
python pipeline.py --phase generate --chapter 1
```

This will:
- Read World_Info and Characters from your Google Sheet
- Call Claude 5 times to write Acts 1–5
- Save each act as a `.txt` file in Google Drive under `VBook/Chapters/Chapter_01/`
- Log each act in your Google Sheet's Acts tab

Runtime: approximately 5–10 minutes (5 Claude API calls).

---

## Step 9 — Review Chapter 1

```cmd
python pipeline.py --phase review --chapter 1
```

This will:
- Review each act (score 1–10)
- Improve any act scoring below 9, up to 5 times
- Run a chapter-level review and improvement
- Save the final approved chapter to Drive as `Chapter_01_Full.txt`
- Update scores and status in the Acts and Chapters tabs

Runtime: approximately 15–30 minutes (up to 50 Claude API calls in worst case).

---

## Step 10 — Generate voting options

```cmd
python pipeline.py --phase vote --chapter 1
```

This writes 3 plot direction options for Chapter 2 to your Votes tab.
Share these with readers, then mark the winner in the sheet before generating Chapter 2.

---

## Daily workflow

```cmd
# Activate environment first (if not already active)
venv\Scripts\activate

# Check status
python pipeline.py --status

# Generate next chapter
python pipeline.py --phase generate --chapter 2

# Review it
python pipeline.py --phase review --chapter 2
```

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'anthropic'`**
→ Your virtual environment isn't activated. Run `venv\Scripts\activate` first.

**`google.auth.exceptions.DefaultCredentialsError`**
→ The path to your service account JSON is wrong in `.env`. Check for typos.

**`HttpError 403`**
→ The service account hasn't been shared on the Sheet or Drive folder. Re-do Steps 2 and 3.

**`ValueError: Claude returned invalid JSON`**
→ Rare — Claude occasionally returns malformed JSON. The script will retry automatically.
  If it keeps failing, check the Acts tab in your sheet to see what was saved.

**Acts are too short (< 800 words)**
→ Edit `ACT_MIN_WORDS` in `.env` or adjust the target in the prompt in `config.py`.
