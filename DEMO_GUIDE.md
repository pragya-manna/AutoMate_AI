# AutoMate AI — Setup & Demo Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Get Your API Keys](#step-1-get-your-api-keys)
4. [Step 2: Set Up the Database](#step-2-set-up-the-database)
5. [Step 3: Run the Backend](#step-3-run-the-backend)
6. [Step 4: Connect the Frontend](#step-4-connect-the-frontend)
7. [Step 5: Which APIs to Implement (Priority Order)](#step-5-which-apis-to-implement-priority-order)
8. [How to Switch from Mock to Real Data](#how-to-switch-from-mock-to-real-data)
9. [Hackathon Demo Script (Step-by-Step)](#hackathon-demo-script-step-by-step)
10. [How to Show a Teams Deadline in Your Demo](#how-to-show-a-teams-deadline-in-your-demo)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR BROWSER                          │
│                                                         │
│   React Frontend (Bolt)                                 │
│   ├─ Landing page (SaaS marketing)                      │
│   ├─ Dashboard (Overview, Documents, Agent, ...)        │
│   └─ Settings page → stores API keys in localStorage    │
│                                                         │
│   When backend is reachable → uses REAL data            │
│   When backend is NOT reachable → uses DEMO data        │
│   (a banner tells you which mode you're in)             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP requests (fetch)
                         │ x-gemini-key header
                         ▼
┌─────────────────────────────────────────────────────────┐
│               YOUR LOCAL BACKEND                         │
│                                                         │
│   Python + FastAPI (backend/main.py)                    │
│   ├─ /api/health        → health check                  │
│   ├─ /api/dashboard     → aggregated dashboard data     │
│   ├─ /api/documents     → upload + Gemini analysis      │
│   ├─ /api/agent/chat    → Gemini agent with tools       │
│   ├─ /api/memory/query  → pgvector semantic search      │
│   ├─ /api/integrations  → Google/Microsoft OAuth        │
│   └─ /api/assignments   → CRUD assignments              │
│                                                         │
│   Talks to:                                             │
│   ├─ Google Gemini API (document analysis, agent)       │
│   ├─ Google Classroom API (courses, announcements)      │
│   ├─ Microsoft Graph API (Teams classes, assignments)   │
│   ├─ Google Calendar API (create events)                │
│   └─ PostgreSQL + pgvector (storage, semantic search)   │
└─────────────────────────────────────────────────────────┘
```

**Key point:** The frontend NEVER talks to Google/Microsoft/Gemini directly.
All requests go through YOUR FastAPI backend. This keeps your API keys safe
and lets you control the logic.

---

## Prerequisites

- Python 3.11+ installed
- PostgreSQL 14+ installed and running
- Node.js 18+ (already set up for the frontend)
- A Google account (for Gemini API key + Google Cloud Console)
- A Microsoft account (for Teams integration, optional for MVP)

---

## Step 1: Get Your API Keys

### 1A. Google Gemini API Key (REQUIRED — this is the AI engine)

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Choose a project (or create one)
4. Copy the key (starts with `AIza...`)
5. Save it — you'll put it in `backend/.env`

### 1B. Google OAuth Credentials (for Classroom/Calendar/Drive)

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to "APIs & Services" → "Library"
4. Enable these APIs:
   - Google Classroom API
   - Google Calendar API
   - Google Drive API
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "OAuth client ID"
7. Choose "Web application"
8. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
9. Copy the Client ID and Client Secret
10. Configure the OAuth consent screen (add your email as test user)

### 1C. Microsoft Azure Credentials (for Teams — optional for MVP)

1. Go to https://portal.azure.com
2. Navigate to "App Registrations" → "New Registration"
3. Name it "AutoMate AI"
4. Add redirect URI: `http://localhost:8000/auth/microsoft/callback`
5. Under "API Permissions", add Microsoft Graph:
   - `EduAssignments.Read`
   - `Team.ReadBasic.All`
6. Under "Certificates & Secrets", create a new client secret
7. Copy the Client ID, Tenant ID, and Client Secret

---

## Step 2: Set Up the Database

### Install PostgreSQL (if not already installed)

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows: download from https://www.postgresql.org/download/windows/
```

### Install pgvector extension

```bash
# macOS
brew install pgvector

# Ubuntu/Debian
sudo apt install postgresql-16-pgvector
```

### Create the database and run the schema

```bash
# Create database
createdb automate

# Run the schema (from the backend/ directory)
psql -d automate -f schema.sql

# Verify pgvector is installed
psql -d automate -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

The schema file (`backend/schema.sql`) creates these tables:
- `documents` — uploaded files + Gemini analysis results
- `document_embeddings` — pgvector embeddings for semantic search
- `assignments` — tasks (synced from Classroom/Teams or manual)
- `calendar_events` — events (synced or agent-created)
- `memory_entries` — past RAG query history
- `integration_tokens` — OAuth tokens for Google/Microsoft
- `agent_actions` — audit log of agent proposed/executed actions

---

## Step 3: Run the Backend

```bash
# From the backend/ directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from the template
cp .env.example .env

# Edit .env and fill in your keys
#   GEMINI_API_KEY=AIza...your_key
#   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
#   GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
#   MICROSOFT_CLIENT_ID=xxxx
#   MICROSOFT_CLIENT_SECRET=xxxx
#   MICROSOFT_TENANT_ID=common
#   DATABASE_URL=postgresql://localhost:5432/automate

# Start the server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Verify it's running

Open http://localhost:8000/api/health in your browser. You should see:
```json
{"status":"ok","gemini":true,"timestamp":"..."}
```

You can also view the full API docs at http://localhost:8000/docs (FastAPI auto-generates Swagger UI).

---

## Step 4: Connect the Frontend

The frontend (running in Bolt) automatically tries to connect to `http://localhost:8000`.

1. Click "Launch App" on the landing page
2. Go to the **Settings** tab in the dashboard
3. Verify the "API Base URL" is `http://localhost:8000`
4. Enter your Gemini API Key in the Settings form
5. Click "Save Settings"
6. Click "Test Connection" — it should show "Backend reachable"
7. The banner at the top will change from "Demo Mode" to "Live API"
8. The pill next to the page title will change from orange "Demo Mode" to green "Live API"

### If it doesn't connect:
- Make sure your FastAPI server is running (`uvicorn main:app --reload --port 8000`)
- Make sure no firewall is blocking port 8000
- Check that the URL in Settings matches exactly
- The backend has CORS enabled for all origins (for development)

---

## Step 5: Which APIs to Implement (Priority Order)

The backend file (`backend/main.py`) already has all endpoints stubbed out with
demo data. Here's the priority order for making them use REAL data:

### Priority 1 (MVP — must have for demo):

| Endpoint | What to Do | How |
|----------|-----------|-----|
| `GET /api/health` | Already works | Just needs `GEMINI_API_KEY` in `.env` |
| `POST /api/documents/upload` | Replace mock with real Gemini call | Already implemented in `main.py` — just needs the `google-genai` package installed and the key set |
| `POST /api/agent/chat` | Replace mock with real Gemini call | Already implemented in `main.py` — sends student context + message to Gemini |
| `GET /api/dashboard` | Replace mock helpers with DB queries | Replace `_get_assignments()`, `_get_documents()`, etc. with `SELECT * FROM ...` queries |

### Priority 2 (Strong demo — should have):

| Endpoint | What to Do | How |
|----------|-----------|-----|
| `POST /api/memory/query` | Implement pgvector semantic search | 1. Generate embedding with `gemini_embed()` 2. Search `document_embeddings` table 3. Use Gemini to synthesize answer from retrieved chunks |
| `GET /api/integrations/{provider}` | Implement Google OAuth flow | Use `google-auth-oauthlib` to redirect to consent screen, handle callback, store token |
| `POST /api/agent/approve/{action_id}` | Execute approved actions | For `calendar_event` type: call Google Calendar API to create real event |

### Priority 3 (Nice to have — for full demo):

| Endpoint | What to Do | How |
|----------|-----------|-----|
| `GET /api/classroom/courses` | Fetch real Google Classroom courses | Use `google-api-python-client` with stored OAuth token |
| `GET /api/teams/assignments` | Fetch real Teams assignments | Use Microsoft Graph API with MSAL token |
| `POST /api/calendar/create-event` | Create real Google Calendar events | Use `google-api-python-client` Calendar service |

### For each endpoint, the pattern is:

```python
# 1. Replace the mock helper at the bottom of main.py:

# BEFORE (mock):
async def _get_assignments():
    return [...mock data...]

# AFTER (real):
async def _get_assignments():
    import asyncpg
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    rows = await conn.fetch("SELECT * FROM assignments ORDER BY due_date")
    await conn.close()
    return [dict(row) for row in rows]
```

---

## How to Switch from Mock to Real Data

The system works automatically:

1. **Frontend probes the backend** on startup (`probeBackend()` in `src/api.ts`)
2. If backend responds at `http://localhost:8000/api/health`:
   - The connection pill shows **"Live API"** (green)
   - All data fetches go to your real backend
   - The yellow demo banner disappears
3. If backend is NOT reachable:
   - The connection pill shows **"Demo Mode"** (orange)
   - A yellow banner appears: "Demo mode — showing sample data"
   - All data falls back to mock data built into the frontend
   - You can click "Retry connection" after starting your backend

### What this means for your demo:
- **If your backend crashes or has issues during the demo**, the frontend
  automatically falls back to mock data — your demo doesn't break
- **When your backend is running**, all data is real
- The visual indicator makes it clear to judges which mode you're in

### To force real data for a specific page:
Each page component uses the `useDashboard()` hook which tries the real API first.
You don't need to change any frontend code — just make sure your backend returns
the right JSON shape (matching the TypeScript types in `src/types.ts`).

---

## Hackathon Demo Script (Step-by-Step)

### Before the demo (5 minutes before):

1. Start your PostgreSQL database
2. Start your FastAPI backend: `uvicorn main:app --reload --port 8000`
3. Open http://localhost:8000/api/health — verify it says `{"status":"ok"}`
4. Open the frontend in Bolt — verify the pill says "Live API"
5. Have these files ready on your desktop:
   - A real assignment PDF (any subject)
   - A screenshot of a professor's announcement (or make one)
   - A syllabus or timetable PDF

### Demo flow (5-7 minutes):

#### Act 1: The Landing Page (30 seconds)
> "This is AutoMate AI — your academic life, intelligently automated.
> It's not another planner. It's an AI agent powered by Gemini that
> understands your documents, plans your week, and takes action on your behalf."

Click "Launch App".

#### Act 2: Document Understanding (1.5 minutes)
> "Let me show you how it works. First, I'll upload some academic documents."

1. Go to the **Documents** tab
2. Drag and drop your assignment PDF
3. **Watch the status change from "Processing" to "Analyzed"**
4. Click on the document to see the detail panel
5. Point out: "Gemini extracted the deadline, the subject, and the key tasks
   from this PDF — automatically."

> "It also works with screenshots. Here's an announcement from my professor."

6. Drag and drop the announcement screenshot
7. Show how Gemini read the image (multimodal) and extracted dates

**What judges see:** Real Gemini analysis happening in real time.

#### Act 3: Risk Detection (1 minute)
> "Now here's where AutoMate AI is different from a regular planner.
> It doesn't just store deadlines — it detects problems."

1. Go to the **Overview** tab
2. Point to the Risk Alerts section
3. "AutoMate found that I have two submissions within 24 hours.
> It identified the specific risk and suggested a concrete action."

**What judges see:** Proactive intelligence, not passive storage.

#### Act 4: The AI Agent (2 minutes) — THIS IS THE KEY MOMENT
> "Now let me talk to the agent. I'll ask it to plan my week."

1. Go to the **AI Agent** tab
2. Type or click the suggestion: "Plan my week based on current workload"
3. **Watch the agent think** (the typing indicator shows it's processing)
4. The agent responds with a natural language explanation
5. Below the response, **proposed actions appear as cards**:
   - "Block Saturday 10:00-13:00 for CN project"
   - "Block Sunday 14:00-17:00 for OS Round Robin"
   - "Set reminder to upload DBMS lab manual"
6. **Click "Approve" on 1-2 actions**
7. **Click "Execute Approved Actions"**
8. "Those calendar events are now being created in my Google Calendar.
> The agent didn't just give me advice — it took action, with my approval."

**What judges see:** A real AI agent that reasons, proposes, and executes.
This is the "input → understanding → reasoning → action → result" pipeline.

#### Act 5: Academic Memory (1 minute)
> "AutoMate also has long-term memory. I can ask it about past conversations."

1. Go to the **Memory** tab
2. Type: "What did my professor say about the DBMS project?"
3. The system retrieves the answer from the announcement you uploaded earlier
4. Point out the **sources** — it shows which document the answer came from

> "It doesn't hallucinate. Every answer is backed by a source document,
> retrieved using pgvector semantic search."

**What judges see:** RAG in action — sourced answers, not made-up content.

#### Act 6: Integrations (30 seconds)
> "And it connects to Google Classroom, Microsoft Teams, Calendar, and Drive."

1. Go to the **Integrations** tab
2. Show the connection cards
3. (If you have real OAuth set up) Click "Connect" on Google Classroom
4. Show the OAuth flow

#### Closing (15 seconds):
> "AutoMate AI: it understands your documents, detects risks before they
> happen, plans your week, and executes approved actions. All powered by
> Gemini. Your academic life, intelligently automated."

---

## How to Show a Teams Deadline in Your Demo

There are two approaches depending on how much time you have:

### Approach A: Full Integration (if you have Azure set up)

1. **Register your app in Azure** (see Step 1C above)
2. **Implement the Teams sync** in your backend:

```python
# In backend/main.py, replace the mock in _get_assignments():

@app.get("/api/teams/sync")
async def sync_teams_assignments():
    """Pull assignments from Microsoft Teams into your database."""
    import httpx
    import msal

    # 1. Get token using MSAL
    app = msal.ConfidentialClientApplication(
        os.getenv("MICROSOFT_CLIENT_ID"),
        authority=f"https://login.microsoftonline.com/{os.getenv('MICROSOFT_TENANT_ID')}",
        client_credential=os.getenv("MICROSOFT_CLIENT_SECRET"),
    )
    result = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )
    token = result["access_token"]

    # 2. Fetch classes from Teams
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://graph.microsoft.com/v1.0/education/classes",
            headers={"Authorization": f"Bearer {token}"},
        )
        classes = resp.json().get("value", [])

        # 3. For each class, fetch assignments
        for cls in classes:
            resp = await client.get(
                f"https://graph.microsoft.com/v1.0/education/classes/{cls['id']}/assignments",
                headers={"Authorization": f"Bearer {token}"},
            )
            assignments = resp.json().get("value", [])

            # 4. Insert into your database
            for a in assignments:
                due = a.get("dueDateTime", {})
                if due.get("dateTime"):
                    # INSERT INTO assignments (title, subject, due_date, source, external_id)
                    # VALUES (a["displayName"], cls["displayName"], due["dateTime"], 'microsoft_teams', a["id"])
                    pass

    return {"synced": True}
```

3. **In the demo:**
   - Go to Integrations → Click "Connect" on Microsoft Teams
   - Complete the OAuth flow
   - The Teams assignments appear in the Assignments tab
   - Show a deadline that came from Teams (the `source` field shows "microsoft_teams")
   - Then ask the AI Agent: "I have a Teams deadline this week — plan around it"
   - The agent sees the Teams-sourced assignment and factors it into the plan

### Approach B: Quick Demo (if you don't have Azure set up)

1. **Manually insert a Teams-like deadline** into your database:

```sql
INSERT INTO assignments (title, subject, due_date, status, priority, progress, source, external_id)
VALUES (
    'Teams: Software Engineering Presentation',
    'Software Engineering',
    '2026-11-20',
    'not_started',
    'high',
    0,
    'microsoft_teams',
    'teams-demo-001'
);
```

2. **In the demo:**
   - Show the Assignments tab — the Teams assignment appears
   - Point out it came from Microsoft Teams (you can add a "Teams" badge)
   - Go to the AI Agent and type: "I have a software engineering presentation
     from Teams due Friday — help me prepare"
   - The agent proposes study blocks and prep tasks

3. **For a more convincing demo**, take a real screenshot of a Teams assignment
   and upload it as a document. Gemini will extract the deadline from the
   screenshot — that's the multimodal capability wowing judges.

### What to say during the Teams demo:
> "This deadline came from Microsoft Teams. AutoMate AI synced it through
> the Microsoft Graph API. But it doesn't just copy the deadline — it
> understands the context, factors it into your workload analysis, and
> the agent can plan around it."

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend shows "Demo Mode" | Backend not running. Start it with `uvicorn main:app --reload --port 8000` |
| "Cannot reach backend" error | Check the URL in Settings matches your backend (usually `http://localhost:8000`) |
| Gemini analysis fails | Make sure `GEMINI_API_KEY` is set in `backend/.env` and `google-genai` is installed |
| pgvector error | Run `CREATE EXTENSION vector;` in your PostgreSQL database |
| CORS error | Backend has CORS enabled for all origins. If still failing, check your browser console |
| Upload fails | Make sure `python-multipart` is installed (`pip install python-multipart`) |

---

## File Structure

```
project/
├── src/                        # Frontend (React + Tailwind)
│   ├── api.ts                  # API client — connects to YOUR backend
│   ├── hooks.ts                # Data hooks — auto-switch real/mock
│   ├── types.ts                # TypeScript types for all data
│   ├── App.tsx                 # Main app — landing + dashboard
│   ├── components/
│   │   ├── Landing.tsx         # SaaS marketing page
│   │   ├── DashboardLayout.tsx # Sidebar + topbar layout
│   │   ├── ConnectionBanner.tsx# Live/Demo mode indicator
│   │   └── pages/
│   │       ├── Overview.tsx    # Stats, risks, events
│   │       ├── Documents.tsx   # Upload + Gemini analysis
│   │       ├── Agent.tsx       # Chat with Gemini agent
│   │       ├── Assignments.tsx # Task management
│   │       ├── Memory.tsx      # Semantic search (RAG)
│   │       ├── Integrations.tsx# Google/Microsoft connections
│   │       └── Settings.tsx    # API key configuration
│
├── backend/                    # YOUR local backend
│   ├── main.py                 # FastAPI app — all endpoints
│   ├── schema.sql              # PostgreSQL schema with pgvector
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Template for your API keys
│
├── DEMO_GUIDE.md               # This file
└── package.json                # Frontend dependencies
```
