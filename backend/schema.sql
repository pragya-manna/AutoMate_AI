-- ═══════════════════════════════════════════════════════════════════
-- AutoMate AI - Database Schema
-- Run this in your PostgreSQL database
-- ═══════════════════════════════════════════════════════════════════

-- Required: pgvector extension for semantic search (Memory feature)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Documents table ─────────────────────────────────────────────────
-- Stores all uploaded documents and their Gemini analysis results
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,           -- 'pdf', 'image', 'announcement', 'notes', 'presentation', 'syllabus'
    subject         TEXT,
    summary         TEXT,                    -- Gemini-generated summary
    extracted_dates JSONB DEFAULT '[]',      -- ["2026-11-28", "2026-11-21"]
    extracted_tasks JSONB DEFAULT '[]',      -- ["ER diagram", "SQL DDL"]
    page_count      INTEGER,
    file_path       TEXT,                    -- Path in Google Drive or local storage
    file_size       BIGINT,
    mime_type       TEXT,
    user_id         UUID,                    -- From Supabase Auth
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Document embeddings (for semantic search) ───────────────────────
-- Each document's content is chunked and embedded with Gemini
-- The embedding column uses pgvector for similarity search
CREATE TABLE IF NOT EXISTS document_embeddings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id         UUID REFERENCES documents(id) ON DELETE CASCADE,
    embedding      vector(768),              -- Gemini text-embedding-004 output dimension
    content_chunk  TEXT,                     -- The text chunk that was embedded
    chunk_index    INTEGER,                  -- Order of chunk within document
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- IVF index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector
    ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─── Assignments table ───────────────────────────────────────────────
-- Can be synced from Google Classroom, Microsoft Teams, or created manually
CREATE TABLE IF NOT EXISTS assignments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                 TEXT NOT NULL,
    subject               TEXT,
    due_date              DATE,
    status                TEXT DEFAULT 'not_started',  -- not_started, in_progress, review, submitted, graded
    priority              TEXT DEFAULT 'medium',        -- critical, high, medium, low
    progress              INTEGER DEFAULT 0,            -- 0-100
    rubric_score          INTEGER,                      -- Gemini rubric analysis score 0-100
    missing_requirements  JSONB DEFAULT '[]',           -- What's missing per rubric
    subtasks              JSONB DEFAULT '[]',           -- [{id, label, done}]
    source                TEXT,                         -- 'google_classroom', 'microsoft_teams', 'agent', 'manual'
    external_id           TEXT,                         -- ID from Classroom/Teams
    user_id               UUID,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Calendar events ─────────────────────────────────────────────────
-- Can be synced from Google Calendar, Microsoft Teams, or created by the agent
CREATE TABLE IF NOT EXISTS calendar_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    event_date   DATE NOT NULL,
    event_time   TIME,
    type         TEXT,          -- 'class', 'deadline', 'exam', 'study', 'personal'
    subject      TEXT,
    source       TEXT,          -- 'google_calendar', 'microsoft_teams', 'agent', 'manual'
    external_id  TEXT,          -- Google Calendar event ID
    user_id      UUID,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Memory entries (RAG query history) ──────────────────────────────
-- Stores past semantic search queries and their sourced answers
CREATE TABLE IF NOT EXISTS memory_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query       TEXT NOT NULL,
    answer      TEXT NOT NULL,
    sources     JSONB DEFAULT '[]',   -- [{docName, snippet}]
    user_id     UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Integration tokens (OAuth) ──────────────────────────────────────
-- Stores OAuth tokens for Google and Microsoft integrations
CREATE TABLE IF NOT EXISTS integration_tokens (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider          TEXT NOT NULL,          -- 'google_classroom', 'microsoft_teams', etc.
    access_token      TEXT,
    refresh_token     TEXT,
    token_expires_at  TIMESTAMPTZ,
    scopes            TEXT[],
    user_id           UUID,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, user_id)
);

-- ─── Agent actions log ───────────────────────────────────────────────
-- Tracks proposed and executed actions for audit
CREATE TABLE IF NOT EXISTS agent_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type     TEXT NOT NULL,           -- 'calendar_event', 'task_create', 'reminder', etc.
    label           TEXT NOT NULL,
    description     TEXT,
    approved        BOOLEAN DEFAULT FALSE,
    executed        BOOLEAN DEFAULT FALSE,
    executed_at     TIMESTAMPTZ,
    result          JSONB,                   -- Response from the integration API
    user_id         UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Helpful views ───────────────────────────────────────────────────

-- Upcoming deadlines view
CREATE OR REPLACE VIEW upcoming_deadlines AS
    SELECT title, subject, due_date,
           EXTRACT(DAY FROM due_date - CURRENT_DATE) AS days_remaining,
           progress, status
    FROM assignments
    WHERE due_date >= CURRENT_DATE
      AND status NOT IN ('submitted', 'graded')
    ORDER BY due_date ASC;

-- Risk detection view
CREATE OR REPLACE VIEW deadline_conflicts AS
    SELECT a1.title AS assignment1, a2.title AS assignment2,
           a1.due_date AS date1, a2.due_date AS date2,
           ABS(a1.due_date - a2.due_date) AS days_apart
    FROM assignments a1
    CROSS JOIN assignments a2
    WHERE a1.id < a2.id
      AND a1.status NOT IN ('submitted', 'graded')
      AND a2.status NOT IN ('submitted', 'graded')
      AND ABS(a1.due_date - a2.due_date) <= 2;
