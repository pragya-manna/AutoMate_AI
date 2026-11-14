"""
AutoMate AI - Backend (real database version)
Python + FastAPI + Google Gemini + PostgreSQL/pgvector

Run: uvicorn main:app --reload --port 8000
"""

import os
import re
import json
import uuid
import asyncio
from datetime import datetime, timezone, date, time as dtime, timedelta
from typing import Optional

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

load_dotenv()

# Allow OAuth over plain http://localhost and tolerate Google returning extra scopes
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

# ─── Config ─────────────────────────────────────────────────────────────
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini-embedding-001")
TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
GOOGLE_REDIRECT = f"{BACKEND_URL}/auth/google/callback"
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
    "https://www.googleapis.com/auth/drive.file",
]

app = FastAPI(title="AutoMate AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request models ─────────────────────────────────────────────────────

class AgentChatRequest(BaseModel):
    message: str


class MemoryQueryRequest(BaseModel):
    query: str


class AssignmentPatch(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None


# ═══════════════════════════════════════════════════════════════════════
# DATABASE HELPERS
# ═══════════════════════════════════════════════════════════════════════

async def _connect():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    # Without this, asyncpg returns JSONB columns as plain strings
    await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
    return conn


async def _fetch(query: str, *args):
    conn = await _connect()
    try:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def _execute(query: str, *args):
    conn = await _connect()
    try:
        return await conn.execute(query, *args)
    finally:
        await conn.close()


@app.on_event("startup")
async def ensure_tables():
    """Creates the extra table/columns this version needs. Safe to run every time."""
    try:
        await _execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'analyzed'")
        await _execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS size INTEGER")
        await _execute("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_event_id TEXT")
        await _execute("""
            CREATE TABLE IF NOT EXISTS agent_proposed_actions (
                id UUID PRIMARY KEY,
                type TEXT NOT NULL,
                label TEXT,
                description TEXT,
                details JSONB DEFAULT '{}',
                approved BOOLEAN DEFAULT FALSE,
                executed BOOLEAN DEFAULT FALSE,
                result TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        print("Database ready")
    except Exception as e:
        print(f"DATABASE SETUP FAILED: {e}")


# ═══════════════════════════════════════════════════════════════════════
# SMALL UTILITIES
# ═══════════════════════════════════════════════════════════════════════

def _safe_date(value) -> Optional[date]:
    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def _safe_time(value, default="10:00") -> dtime:
    for candidate in (value, default):
        try:
            return datetime.strptime(str(candidate)[:5], "%H:%M").time()
        except (ValueError, TypeError):
            continue
    return dtime(10, 0)


def _clean_dates(values) -> list:
    out = []
    for v in values or []:
        d = _safe_date(v)
        if d:
            out.append(d.isoformat())
    return out


def _parse_json(text: Optional[str]):
    """Parse JSON from Gemini, tolerating ```json fences. Returns None on failure."""
    if not text:
        return None
    clean = re.sub(r"^```(?:json)?\s*", "", text.strip())
    clean = re.sub(r"\s*```$", "", clean)
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return None


# ═══════════════════════════════════════════════════════════════════════
# GEMINI HELPERS
# ═══════════════════════════════════════════════════════════════════════

def get_gemini_client(api_key: Optional[str] = None):
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="No Gemini API key configured")
    try:
        from google import genai
    except ImportError:
        raise HTTPException(status_code=500, detail="google-genai not installed. Run: pip install google-genai")
    return genai.Client(api_key=key)


def _gen(client, contents, as_json: bool = True) -> str:
    from google.genai import types
    config = types.GenerateContentConfig(response_mime_type="application/json") if as_json else None
    resp = client.models.generate_content(model=GEMINI_MODEL, contents=contents, config=config)
    return resp.text


def gemini_embed(client, text: str) -> str:
    """Returns the embedding formatted as a pgvector literal like '[0.1,0.2,...]' (768 dims)."""
    from google.genai import types
    r = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    return "[" + ",".join(str(x) for x in r.embeddings[0].values) + "]"


# ═══════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    db_ok = True
    try:
        await _fetch("SELECT 1")
    except Exception:
        db_ok = False
    return {
        "status": "ok",
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
        "database": db_ok,
        "google_connected": bool(await _google_credentials()) if db_ok else False,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard")
async def get_dashboard():
    return {
        "events": await _get_events(),
        "documents": await _get_documents(),
        "assignments": await _get_assignments(),
        "risks": await _detect_risks(),
        "memory": await _get_memory_entries(),
        "integrations": await _get_integrations(),
        "stats": await _get_stats(),
    }


# ═══════════════════════════════════════════════════════════════════════
# DOCUMENTS
# ═══════════════════════════════════════════════════════════════════════

ANALYSIS_PROMPT = """You are AutoMate AI, an academic assistant. Analyze this document and extract:
1. A concise summary (2-3 sentences)
2. All important dates (deadlines, exam dates, submission dates) in YYYY-MM-DD format
3. All actionable tasks the student needs to complete
4. The subject this document relates to
5. The important text of the document (max 1500 characters), for later search

Return ONLY valid JSON with this structure:
{
  "summary": "string",
  "subject": "string",
  "extracted_dates": ["YYYY-MM-DD"],
  "extracted_tasks": ["task 1", "task 2"],
  "page_count": number or null,
  "full_text": "string"
}"""


def _analyze(client, contents: bytes, file_type: str) -> dict:
    from google.genai import types
    page_count = None

    if file_type == "application/pdf":
        payload = None
        try:
            import fitz  # PyMuPDF
            pdf = fitz.open(stream=contents, filetype="pdf")
            page_count = len(pdf)
            text = "".join(p.get_text() for p in pdf)
            pdf.close()
            if text.strip():
                payload = f"{ANALYSIS_PROMPT}\n\nDocument text:\n{text[:50000]}"
        except ImportError:
            pass
        if payload is None:  # scanned PDF or PyMuPDF missing: let Gemini read the PDF itself
            payload = [ANALYSIS_PROMPT, types.Part.from_bytes(data=contents, mime_type=file_type)]
    elif file_type.startswith("image/"):
        payload = [ANALYSIS_PROMPT, types.Part.from_bytes(data=contents, mime_type=file_type)]
    else:
        text = contents.decode("utf-8", errors="ignore")
        payload = f"{ANALYSIS_PROMPT}\n\nDocument text:\n{text[:50000]}"

    data = _parse_json(_gen(client, payload)) or {}
    if not isinstance(data, dict):
        data = {}
    if page_count:
        data["page_count"] = page_count
    return data


def _doc_response(name, file_type, size, status, summary, dates, tasks, page_count=None, subject=None):
    doc_type = "pdf" if "pdf" in file_type else "image" if "image" in file_type else "notes"
    return {
        "id": f"doc-{datetime.now().timestamp()}",
        "name": name,
        "type": doc_type,
        "status": status,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "size": size,
        "subject": subject or "Uncategorized",
        "summary": summary,
        "extractedDates": dates or [],
        "extractedTasks": tasks or [],
        "pageCount": page_count,
    }


async def _store_embedding(client, doc_id: str, text: str):
    """Embedding failure must never break an upload, so errors are only printed."""
    try:
        vec = gemini_embed(client, text[:8000])
        await _execute(
            "INSERT INTO document_embeddings (doc_id, embedding, content_chunk) "
            "VALUES ($1::uuid, $2::text::vector, $3)",
            doc_id, vec, text,
        )
    except Exception as e:
        print(f"Embedding skipped: {e}")


@app.get("/api/documents")
async def list_documents():
    return await _get_documents()


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
):
    contents = await file.read()
    file_type = file.content_type or "application/octet-stream"
    doc_type = "pdf" if "pdf" in file_type else "image" if "image" in file_type else "notes"

    try:
        client = get_gemini_client(x_gemini_key)
        analysis = _analyze(client, contents, file_type)

        dates = _clean_dates(analysis.get("extracted_dates"))
        tasks = analysis.get("extracted_tasks") or []
        summary = analysis.get("summary")
        subject = analysis.get("subject")
        page_count = analysis.get("page_count") if isinstance(analysis.get("page_count"), int) else None

        saved = await _fetch(
            """
            INSERT INTO documents (name, type, subject, summary, extracted_dates,
                                   extracted_tasks, page_count, status, size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'analyzed', $8)
            RETURNING id::text AS id
            """,
            file.filename, doc_type, subject, summary, dates, tasks, page_count, len(contents),
        )
        doc_id = saved[0]["id"]

        # Each extracted date becomes a calendar event so the Overview shows it
        for d in dates:
            await _execute(
                "INSERT INTO calendar_events (title, event_date, type, subject, source) "
                "VALUES ($1, $2, 'deadline', $3, 'document')",
                f"Deadline: {file.filename}", date.fromisoformat(d), subject,
            )

        # Searchable text for the Memory tab
        searchable = "\n".join([
            f"Document: {file.filename}",
            f"Subject: {subject or ''}",
            f"Summary: {summary or ''}",
            f"Dates: {', '.join(dates)}",
            f"Tasks: {'; '.join(str(t) for t in tasks)}",
            f"Text: {analysis.get('full_text') or ''}",
        ])
        await _store_embedding(client, doc_id, searchable)

        resp = _doc_response(file.filename, file_type, len(contents), "analyzed",
                             summary, dates, tasks, page_count, subject)
        resp["id"] = doc_id
        return resp

    except Exception as e:
        print(f"UPLOAD FAILED: {e}")
        return _doc_response(file.filename, file_type, len(contents), "failed", None, None, None)


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    await _execute("DELETE FROM documents WHERE id = $1::uuid", doc_id)  # embeddings cascade
    return {"success": True}


# ═══════════════════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/agent/chat")
async def agent_chat(
    req: AgentChatRequest,
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
):
    context = await _get_student_context()
    today = date.today()

    system_prompt = f"""You are AutoMate AI, an autonomous academic assistant powered by Gemini.
Today's date is {today.isoformat()} ({today.strftime('%A')}).

Student context:
- Active courses: {context['stats']['activeCourses']}
- Pending assignments: {context['stats']['pendingAssignments']}
- Upcoming deadlines: {context['stats']['upcomingDeadlines']}
- Risk level: {context['stats']['riskLevel']}

Assignments:
{json.dumps(context['assignments'], indent=2, default=str)}

Risks detected:
{json.dumps(context['risks'], indent=2, default=str)}

Recent documents:
{json.dumps(context['documents'][:3], indent=2, default=str)}

When the student asks you to plan, schedule or take action, propose specific steps.
Action types: calendar_event, task_create, reminder, file_organize, draft_outline.
Every calendar_event and reminder MUST have a real date (YYYY-MM-DD, on or after today) and
start_time / end_time in 24h HH:MM. Never invent assignments that are not listed above.

Respond with JSON only:
{{
  "content": "Your explanation to the student",
  "actions": [
    {{
      "type": "calendar_event",
      "label": "Short label",
      "description": "What this does and why",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "subject": "Subject name",
      "priority": "high"
    }}
  ]
}}"""

    try:
        client = get_gemini_client(x_gemini_key)
        raw = _gen(client, [system_prompt, f"Student: {req.message}"])
        parsed = _parse_json(raw)
        if not isinstance(parsed, dict):
            parsed = {"content": raw, "actions": []}

        actions = []
        for a in parsed.get("actions", []) or []:
            action_id = str(uuid.uuid4())
            a_type = a.get("type", "task_create")
            label = a.get("label", "Action")
            description = a.get("description", "")
            details = {k: a.get(k) for k in ("date", "start_time", "end_time", "subject", "priority")}
            await _execute(
                "INSERT INTO agent_proposed_actions (id, type, label, description, details) "
                "VALUES ($1::uuid, $2, $3, $4, $5)",
                action_id, a_type, label, description, details,
            )
            actions.append({
                "id": action_id, "type": a_type, "label": label, "description": description,
                "approved": False, "executed": False,
            })

        return {
            "id": f"msg-{datetime.now().timestamp()}",
            "role": "agent",
            "content": parsed.get("content", raw),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actions": actions,
            "status": "proposing",
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"AGENT ERROR: {e}")
        return {
            "id": f"msg-{datetime.now().timestamp()}",
            "role": "agent",
            "content": f"I encountered an error: {e}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actions": [],
            "status": "idle",
        }


@app.post("/api/agent/approve/{action_id}")
async def approve_action(action_id: str):
    """Runs one approved action for real: writes to the database and, if connected, Google Calendar."""
    try:
        uuid.UUID(action_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Unknown action id")

    rows = await _fetch("SELECT * FROM agent_proposed_actions WHERE id = $1::uuid", action_id)
    if not rows:
        raise HTTPException(status_code=404, detail="Action not found")
    action = rows[0]
    if action["executed"]:
        return {"success": True, "action_id": action_id, "result": "Already executed"}

    det = action["details"] or {}
    a_type = action["type"]
    label = action["label"] or "AutoMate AI task"
    subject = det.get("subject")
    d = _safe_date(det.get("date")) or (date.today() + timedelta(days=1))
    start_t = _safe_time(det.get("start_time"))
    result = "Done"

    if a_type in ("calendar_event", "reminder"):
        saved = await _fetch(
            "INSERT INTO calendar_events (title, event_date, event_time, type, subject, source) "
            "VALUES ($1, $2, $3, $4, $5, 'agent') RETURNING id::text AS id",
            label, d, start_t, "study" if a_type == "calendar_event" else "personal", subject,
        )
        end_t = _safe_time(det.get("end_time"), default=(datetime.combine(d, start_t) + timedelta(hours=1)).strftime("%H:%M"))
        gid = await _push_to_google_calendar(label, action["description"], d, start_t, end_t)
        if gid:
            await _execute("UPDATE calendar_events SET google_event_id = $2 WHERE id = $1::uuid", saved[0]["id"], gid)
            result = "Added to your calendar and Google Calendar"
        else:
            result = f"Added to your calendar. Google Calendar failed: {LAST_GOOGLE_ERROR['msg']}"

    elif a_type == "task_create":
        await _execute(
            "INSERT INTO assignments (title, subject, due_date, status, priority, progress, source) "
            "VALUES ($1, $2, $3, 'not_started', $4, 0, 'agent')",
            label, subject, _safe_date(det.get("date")), det.get("priority") or "medium",
        )
        result = "Task created"

    else:  # file_organize, draft_outline: recorded only
        result = "Recorded"

    await _execute(
        "UPDATE agent_proposed_actions SET approved = TRUE, executed = TRUE, result = $2 WHERE id = $1::uuid",
        action_id, result,
    )
    return {"success": True, "action_id": action_id, "result": result,
            "executed_at": datetime.now(timezone.utc).isoformat()}


# ═══════════════════════════════════════════════════════════════════════
# ASSIGNMENTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/assignments")
async def list_assignments():
    return await _get_assignments()


@app.patch("/api/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, patch: AssignmentPatch):
    await _execute(
        """
        UPDATE assignments
        SET status = COALESCE($2, status), progress = COALESCE($3, progress)
        WHERE id = $1::uuid
        """,
        assignment_id, patch.status, patch.progress,
    )
    return {"id": assignment_id, "status": patch.status, "progress": patch.progress}


# ═══════════════════════════════════════════════════════════════════════
# MEMORY (RAG with pgvector)
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/memory/query")
async def memory_query(
    req: MemoryQueryRequest,
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
):
    try:
        client = get_gemini_client(x_gemini_key)

        rows = []
        try:
            qvec = gemini_embed(client, req.query)
            rows = await _fetch(
                """
                SELECT d.name AS name, e.content_chunk AS chunk
                FROM document_embeddings e
                JOIN documents d ON d.id = e.doc_id
                ORDER BY e.embedding <=> $1::text::vector
                LIMIT 4
                """,
                qvec,
            )
        except Exception as e:
            print(f"Vector search failed, falling back to summaries: {e}")

        if not rows:
            rows = await _fetch(
                "SELECT name, COALESCE(summary, '') AS chunk FROM documents ORDER BY created_at DESC LIMIT 5"
            )

        if not rows:
            answer = "I don't have any uploaded documents yet. Upload one in the Documents tab first."
            sources = []
        else:
            context = "\n\n".join(f"[{r['name']}]\n{r['chunk']}" for r in rows)
            prompt = (
                "Answer the student's question using ONLY the documents below. "
                "If the answer is not in them, say you could not find it.\n\n"
                f"Documents:\n{context}\n\nQuestion: {req.query}"
            )
            answer = _gen(client, prompt, as_json=False)
            sources = [{"docName": r["name"], "snippet": (r["chunk"] or "")[:200]} for r in rows]

        saved = await _fetch(
            "INSERT INTO memory_entries (query, answer, sources) VALUES ($1, $2, $3) RETURNING id::text AS id",
            req.query, answer, sources,
        )
        return {
            "id": saved[0]["id"],
            "query": req.query,
            "answer": answer,
            "sources": sources,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"MEMORY ERROR: {e}")
        return {
            "id": f"mem-{datetime.now().timestamp()}",
            "query": req.query,
            "answer": f"Error: {e}",
            "sources": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@app.get("/api/memory")
async def list_memory():
    return await _get_memory_entries()


# ═══════════════════════════════════════════════════════════════════════
# INTEGRATIONS - Google OAuth, Calendar, Classroom
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/integrations")
async def list_integrations():
    return await _get_integrations()


@app.post("/api/integrations/{provider}")
async def connect_integration(provider: str):
    if provider.startswith("google"):
        # Not connected yet: the browser must visit this URL to sign in with Google
        return {"connected": False, "provider": provider, "authUrl": f"{BACKEND_URL}/auth/google/login"}
    return {"connected": True, "provider": provider}  # other providers are still placeholders


@app.delete("/api/integrations/{provider}")
async def disconnect_integration(provider: str):
    if provider.startswith("google"):
        await _execute("DELETE FROM integration_tokens WHERE provider = 'google'")
    return {"disconnected": True, "provider": provider}


def _google_flow():
    from google_auth_oauthlib.flow import Flow
    client_config = {"web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [GOOGLE_REDIRECT],
    }}
    return Flow.from_client_config(
        client_config, scopes=GOOGLE_SCOPES, redirect_uri=GOOGLE_REDIRECT,
        autogenerate_code_verifier=False,
    )


@app.get("/auth/google/login")
async def google_login():
    if not os.getenv("GOOGLE_CLIENT_ID") or not os.getenv("GOOGLE_CLIENT_SECRET"):
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing in .env")
    flow = _google_flow()
    url, _state = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true")
    return RedirectResponse(url)


@app.get("/auth/google/callback")
async def google_callback(code: Optional[str] = None, error: Optional[str] = None):
    if error or not code:
        raise HTTPException(status_code=400, detail=f"Google sign-in failed: {error or 'no code returned'}")
    flow = _google_flow()
    flow.fetch_token(code=code)
    c = flow.credentials
    expiry = c.expiry.replace(tzinfo=timezone.utc) if c.expiry else None
    await _execute("DELETE FROM integration_tokens WHERE provider = 'google'")
    await _execute(
        "INSERT INTO integration_tokens (provider, access_token, refresh_token, token_expires_at, scopes) "
        "VALUES ('google', $1, $2, $3, $4)",
        c.token, c.refresh_token, expiry, list(c.scopes or []),
    )
    return RedirectResponse(FRONTEND_URL)


async def _google_credentials():
    rows = await _fetch(
        "SELECT access_token, refresh_token FROM integration_tokens WHERE provider = 'google' LIMIT 1"
    )
    if not rows:
        return None
    from google.oauth2.credentials import Credentials
    return Credentials(
        token=rows[0]["access_token"],
        refresh_token=rows[0]["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=GOOGLE_SCOPES,
    )


def _calendar_insert_sync(creds, body):
    from googleapiclient.discovery import build
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return service.events().insert(calendarId="primary", body=body).execute()


LAST_GOOGLE_ERROR = {"msg": None}


async def _push_to_google_calendar(title, description, d: date, start_t: dtime, end_t: dtime,
                                   all_day: bool = False, reminders=None) -> Optional[str]:
    """Creates the event in Google Calendar. Returns the Google event id, or None on failure.
    The failure reason is kept in LAST_GOOGLE_ERROR so it can be shown."""
    LAST_GOOGLE_ERROR["msg"] = None
    try:
        creds = await _google_credentials()
        if not creds:
            LAST_GOOGLE_ERROR["msg"] = "Google is not connected. Open /auth/google/login first."
            return None
        if reminders is None:
            reminders = (900,) if all_day else (1440, 60)  # minutes before; all-day: 9 AM the day before
        if all_day:
            start = {"date": d.isoformat()}
            end = {"date": (d + timedelta(days=1)).isoformat()}
        else:
            start_dt = datetime.combine(d, start_t)
            end_dt = datetime.combine(d, end_t)
            if end_dt <= start_dt:
                end_dt = start_dt + timedelta(hours=1)
            start = {"dateTime": start_dt.isoformat(), "timeZone": TIMEZONE}
            end = {"dateTime": end_dt.isoformat(), "timeZone": TIMEZONE}
        body = {
            "summary": title,
            "description": description or "Created by AutoMate AI",
            "start": start,
            "end": end,
            "reminders": {"useDefault": False,
                          "overrides": [{"method": "popup", "minutes": m} for m in reminders]},
        }
        created = await asyncio.to_thread(_calendar_insert_sync, creds, body)
        return created.get("id")
    except Exception as e:
        LAST_GOOGLE_ERROR["msg"] = str(e)
        print(f"Google Calendar push failed: {e}")
        return None


@app.post("/api/calendar/test")
async def calendar_test():
    """Creates one test event tomorrow 10:00 so you can see if Google Calendar works."""
    d = date.today() + timedelta(days=1)
    gid = await _push_to_google_calendar("AutoMate AI test event", "Test from AutoMate AI", d, dtime(10, 0), dtime(10, 30))
    if gid:
        return {"ok": True, "google_event_id": gid, "date": d.isoformat(), "time": "10:00", "timezone": TIMEZONE}
    return {"ok": False, "error": LAST_GOOGLE_ERROR["msg"]}


@app.post("/api/calendar/push-all")
async def calendar_push_all():
    """Sends every upcoming event that is not in Google Calendar yet (Classroom items are skipped,
    because Classroom already puts those on your calendar). Events with no time become all-day."""
    rows = await _fetch("""
        SELECT id::text AS id, title, event_date, event_time, subject
        FROM calendar_events
        WHERE google_event_id IS NULL
          AND COALESCE(source, '') <> 'google_classroom'
          AND event_date >= CURRENT_DATE
        ORDER BY event_date
    """)
    pushed = 0
    for r in rows:
        all_day = r["event_time"] is None
        start_t = r["event_time"] or dtime(9, 0)
        end_t = (datetime.combine(r["event_date"], start_t) + timedelta(hours=1)).time()
        gid = await _push_to_google_calendar(r["title"], f"Subject: {r['subject'] or 'General'}",
                                             r["event_date"], start_t, end_t, all_day=all_day)
        if not gid:
            return {"ok": False, "pushed": pushed, "remaining": len(rows) - pushed, "error": LAST_GOOGLE_ERROR["msg"]}
        await _execute("UPDATE calendar_events SET google_event_id = $2 WHERE id = $1::uuid", r["id"], gid)
        pushed += 1
    return {"ok": True, "pushed": pushed}


def _classroom_fetch_sync(creds):
    from googleapiclient.discovery import build
    service = build("classroom", "v1", credentials=creds, cache_discovery=False)
    items = []
    courses = service.courses().list(courseStates=["ACTIVE"]).execute().get("courses", [])
    for c in courses:
        try:
            work = service.courses().courseWork().list(courseId=c["id"]).execute().get("courseWork", [])
        except Exception as e:
            print(f"Classroom: skipped course '{c.get('name')}': {e}")
            continue
        for w in work:
            dd = w.get("dueDate")
            due = date(dd["year"], dd["month"], dd["day"]) if dd else None
            items.append({"external_id": f"gc-{w['id']}", "title": w.get("title", "Untitled"),
                          "subject": c.get("name"), "due": due})
    return items


@app.post("/api/classroom/sync")
async def classroom_sync():
    """Pulls Google Classroom assignments into the assignments table."""
    creds = await _google_credentials()
    if not creds:
        raise HTTPException(status_code=400, detail=f"Google not connected. Open {BACKEND_URL}/auth/google/login")
    try:
        items = await asyncio.to_thread(_classroom_fetch_sync, creds)
    except Exception as e:
        print(f"CLASSROOM SYNC FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Classroom sync failed: {e}")
    added = 0
    try:
        for it in items:
            if await _fetch("SELECT 1 FROM assignments WHERE external_id = $1", it["external_id"]):
                continue
            await _execute(
                "INSERT INTO assignments (title, subject, due_date, status, priority, progress, source, external_id) "
                "VALUES ($1, $2, $3, 'not_started', 'medium', 0, 'google_classroom', $4)",
                it["title"], it["subject"], it["due"], it["external_id"],
            )
            added += 1
    except Exception as e:
        print(f"CLASSROOM SAVE FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Saving to database failed: {e}")
    return {"synced": added, "total": len(items)}


# ═══════════════════════════════════════════════════════════════════════
# DATA QUERIES (shape matches src/types.ts)
# ═══════════════════════════════════════════════════════════════════════

async def _get_events():
    return await _fetch("""
        SELECT id::text AS id, title,
               to_char(event_date, 'YYYY-MM-DD') AS date,
               COALESCE(to_char(event_time, 'HH24:MI'), '00:00') AS time,
               COALESCE(type, 'deadline') AS type,
               COALESCE(subject, 'General') AS subject
        FROM calendar_events
        ORDER BY event_date, event_time
    """)


async def _get_documents():
    return await _fetch("""
        SELECT id::text AS id, name, type,
               COALESCE(status, 'analyzed') AS status,
               to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "uploadedAt",
               COALESCE(size, 0) AS size,
               COALESCE(subject, 'Uncategorized') AS subject,
               COALESCE(summary, '') AS summary,
               COALESCE(extracted_dates, '[]'::jsonb) AS "extractedDates",
               COALESCE(extracted_tasks, '[]'::jsonb) AS "extractedTasks",
               page_count AS "pageCount"
        FROM documents
        ORDER BY created_at DESC
    """)


async def _get_assignments():
    return await _fetch("""
        SELECT id::text AS id, title,
               COALESCE(subject, 'General') AS subject,
               to_char(due_date, 'YYYY-MM-DD') AS "dueDate",
               COALESCE(status, 'not_started') AS status,
               COALESCE(priority, 'medium') AS priority,
               COALESCE(progress, 0) AS progress,
               rubric_score AS "rubricScore",
               COALESCE(missing_requirements, '[]'::jsonb) AS "missingRequirements",
               COALESCE(subtasks, '[]'::jsonb) AS subtasks,
               source
        FROM assignments
        WHERE due_date IS NOT NULL
        ORDER BY due_date
    """)


async def _get_memory_entries():
    return await _fetch("""
        SELECT id::text AS id, query, answer, sources,
               to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "timestamp"
        FROM memory_entries
        ORDER BY created_at DESC
        LIMIT 10
    """)


async def _detect_risks():
    rows = await _fetch("""
        SELECT id::text AS id, title, due_date, COALESCE(progress, 0) AS progress
        FROM assignments
        WHERE COALESCE(status, '') <> 'submitted'
          AND due_date IS NOT NULL AND due_date >= CURRENT_DATE
        ORDER BY due_date
    """)
    risks = []

    # Risk 1: two deadlines within 1 day of each other
    for a, b in zip(rows, rows[1:]):
        if (b["due_date"] - a["due_date"]).days <= 1:
            risks.append({
                "id": f"conflict-{a['id'][:8]}-{b['id'][:8]}",
                "type": "deadline_conflict",
                "severity": "critical",
                "title": "Two submissions within 24 hours",
                "description": f"{a['title']} ({a['due_date']}) and {b['title']} ({b['due_date']}) are due back to back.",
                "suggestedAction": f"Start {a['title']} first and block time for {b['title']} right after.",
                "affectedAssignments": [a["id"], b["id"]],
            })

    # Risk 2: due within 3 days but under 50% done
    for r in rows:
        days_left = (r["due_date"] - date.today()).days
        if days_left <= 3 and r["progress"] < 50:
            risks.append({
                "id": f"behind-{r['id'][:8]}",
                "type": "behind_schedule",
                "severity": "high",
                "title": f"{r['title']} is behind schedule",
                "description": f"Due in {days_left} day(s) but only {r['progress']}% done.",
                "suggestedAction": "Block a focused work session today.",
                "affectedAssignments": [r["id"]],
            })
    return risks


async def _get_stats():
    row = (await _fetch("""
        SELECT
          (SELECT COUNT(*) FROM assignments WHERE COALESCE(status, '') <> 'submitted') AS pending,
          (SELECT COUNT(*) FROM assignments WHERE COALESCE(status, '') <> 'submitted'
             AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS upcoming,
          (SELECT COUNT(*) FROM documents) AS docs,
          (SELECT COUNT(DISTINCT subject) FROM assignments) AS courses
    """))[0]
    risks = await _detect_risks()
    risk_level = "at_risk" if any(r["severity"] == "critical" for r in risks) else ("moderate" if risks else "on_track")
    return {
        "activeCourses": row["courses"],
        "pendingAssignments": row["pending"],
        "upcomingDeadlines": row["upcoming"],
        "documentsAnalyzed": row["docs"],
        "avgWorkload": min(100, row["pending"] * 20),
        "riskLevel": risk_level,
    }


async def _get_integrations():
    google_connected = bool(await _fetch("SELECT 1 FROM integration_tokens WHERE provider = 'google' LIMIT 1"))
    return [
        {"provider": "google_classroom", "label": "Google Classroom", "connected": google_connected, "scopes": ["coursework.read"]},
        {"provider": "google_calendar", "label": "Google Calendar", "connected": google_connected, "scopes": ["calendar.events"]},
        {"provider": "google_drive", "label": "Google Drive", "connected": google_connected, "scopes": ["drive.file"]},
        {"provider": "microsoft_teams", "label": "Microsoft Teams", "connected": False, "scopes": ["team.read", "assignment.read"]},
        {"provider": "notion", "label": "Notion", "connected": False, "scopes": ["pages.write"]},
        {"provider": "slack", "label": "Slack", "connected": False, "scopes": ["chat.write"]},
    ]


async def _get_student_context():
    return {
        "stats": await _get_stats(),
        "assignments": await _get_assignments(),
        "risks": await _detect_risks(),
        "documents": await _get_documents(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)