# 🚀 AutoMate AI - Your Academic Life, Intelligently Automated.

**One workspace. Every academic responsibility. One intelligent assistant.**

AutoMate AI is an AI-powered academic productivity platform that brings together **Google Classroom, Google Calendar, notes and uploaded study documents with Gemini-powered document analysis, academic search, and planning** into one unified workspace.

It connects assignments, deadlines, schedules, study materials, and academic information, allowing students to manage everything from a single place.

Powered by Google Gemini, AutoMate AI goes beyond organizing information. It understands previously uploaded study materials, answers academic questions, helps prioritize assignments, creates tasks, schedules calendar events, and sets reminders through an intelligent AI Agent.

With document analysis, persistent Academic Memory, voice interaction, and automated academic planning, AutoMate AI transforms scattered academic responsibilities into an organized and actionable workflow.

**Less time managing platforms. More time learning, building, and growing.**

<img width="1817" height="901" alt="Screenshot 2026-11-15 164758" src="https://github.com/user-attachments/assets/00b789c7-b003-4eb2-8c5b-3e3a79f4d8cc" />


---

## 💡 The Problem

A student's academic life is scattered across multiple platforms.

- Assignments and coursework arrive through Google Classroom.
- Important schedules and deadlines live in Google Calendar.
- Study materials are stored across Google Drive, PDFs, Word documents, and personal notes.
- Students manually track submissions and reminders.
- Important tasks get forgotten, and prioritizing work becomes difficult.

The problem isn't a lack of information. It's that information is disconnected.

**AutoMate AI brings these academic resources together and turns them into one intelligent, connected student workspace.**

---

## ✨ Key Features

### 1. 📊 Smart Academic Dashboard

A centralized dashboard that gives students a complete overview of their academic workload.

- Active courses and pending assignments.
- Upcoming deadlines and important events.
- Document analysis statistics.
- Workload overview and detected risks.
- Tasks and assignments that need immediate attention.

Students can understand their academic situation at a glance instead of switching between multiple platforms.

### 2. 📚 Google Classroom Integration & Live Assignment Sync

Connect Google Classroom using Google OAuth and bring coursework directly into AutoMate AI.

- Automatically sync assignments, courses, and due dates.
- Periodically check for new and updated coursework.
- Track assignment progress and completion status.
- Mark assignments as completed directly from AutoMate AI.
- Keep assignment completion status synchronized between AutoMate AI and Google Classroom.

**No more manually updating the same assignment in multiple places.**

When an assignment is marked as done through the supported integration, its updated status is reflected across the connected platforms.

### 3. 📄 AI-Powered Document Analysis

Turn unorganized study materials into structured academic information.

Upload PDFs, images, or text documents and let Google Gemini analyze them.

AutoMate AI automatically extracts:

- Document summaries.
- Subject and topic information.
- Important dates and deadlines.
- Actionable tasks.
- Relevant academic information.

The extracted information is stored in the connected database and becomes searchable through Academic Memory.

### 4. 🧠 Academic Memory — Your Entire Study Library, Always Accessible

Turn all your previously uploaded study materials into an intelligent, searchable knowledge base.

Academic Memory connects directly with the Documents section, allowing students to ask questions about their existing uploaded materials without repeatedly uploading files.

Powered by Google Gemini, it can understand and analyze different types of academic content, including:

- PDF documents and textbooks.
- Word documents and study notes.
- Images and scanned study materials.
- Other supported document formats.

**How it works:**
- Accesses previously uploaded documents stored in the Documents section.
- Uses Gemini to understand and process document content.
- Generates embeddings for semantic retrieval.
- Uses PostgreSQL and pgvector to find relevant information.
- Retrieves relevant context from the student's existing study library.
- Generates contextual answers grounded in the available documents.
- Provides document sources so students can trace the information.
- Saves query history for future reference.

Students can ask questions across their uploaded study materials in natural language.

### 5. 🤖 AI Agent — Your Personal Academic Assistant

This is where AutoMate AI goes beyond being a regular productivity dashboard.

The AI Agent understands the student's academic context, including assignments, deadlines, and uploaded study materials.

It helps students:

- Decide what to study first.
- Prioritize assignments based on deadlines.
- Organize their academic workload.
- Create tasks and calendar events.
- Plan around upcoming submissions.
- Turn natural-language requests into actionable steps.

**It doesn't just suggest what to do — it can prepare actions for execution.**

For example:

"I have a Maths assignment due tomorrow and a UHV submission pending. Help me organize my day."

The Agent can understand the workload, propose a plan, and prepare relevant tasks or calendar events.

All proposed actions require student approval before execution.

### 6. 🎙️ Voice Assistant

Interact with your academic assistant through voice instead of typing every request.

Students can use voice-based interaction to communicate with the assistant, making academic planning and task management more convenient.

Whether you want help organizing your day or need to interact with your academic assistant hands-free, voice interaction makes AutoMate AI more accessible and natural.

### 7. 📅 Google Calendar Integration & Smart Reminders

Never lose track of an important deadline again.

AutoMate AI integrates with Google Calendar to help students organize their academic schedules.

- Create calendar events through approved AI Agent actions.
- Schedule reminders with specific dates and times.
- Organize study sessions and assignment deadlines.
- Turn natural-language requests into scheduled events.
- Keep important academic activities visible in the student's calendar.

For example:

"Remind me to complete my Maths assignment tomorrow at 6 PM."

The Agent can prepare a calendar event with the requested date and time, which is executed after the student approves it.

**Your academic assistant doesn't just remember your deadlines. It helps you stay ahead of them.**

---

## 🔄 How AutoMate AI Works

1. **Connect:** Sign in with Google and connect your Google Classroom account.
2. **Sync:** Bring assignments, courses, and deadlines into one dashboard.
3. **Upload:** Add PDFs, notes, and other study materials.
4. **Understand:** Let Gemini extract important information, dates, and actionable tasks.
5. **Remember:** Ask questions about your uploaded materials through Academic Memory.
6. **Plan:** Let the AI Agent analyze your workload and suggest what to prioritize.
7. **Automate:** Approve tasks, calendar events, and reminders proposed by the Agent.
8. **Stay Updated:** Keep your academic workload and assignment progress synchronized.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL, pgvector |
| AI Model | Google Gemini |
| Embeddings | Gemini Embedding Models |
| Integrations | Google Classroom API, Google Calendar API |

---

## 🏗️ Project Structure

```text
AutoMate_AI/
│
├── backend/
│   ├── main.py
│   ├── schema.sql
│   ├── requirements.txt
│   └── .env.example
│
├── src/
│   ├── api.ts
│   ├── hooks.ts
│   └── components/
│       └── pages/
│           ├── Overview
│           ├── Documents
│           ├── Agent
│           ├── Assignments
│           ├── Memory
│           └── Settings
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

- Python installed.
- Node.js and npm installed.
- PostgreSQL installed.
- A Google Gemini API key.
- Google Cloud OAuth credentials for Google integrations.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd AutoMate_AI
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create your `.env` file using `.env.example` as a template.

Configure your own:

- `GEMINI_API_KEY`
- `DATABASE_URL`
- Google OAuth Client ID
- Google OAuth Client Secret
- Frontend and backend URLs

Keep your `.env` file private. Never commit API keys, OAuth secrets, or database credentials.

### 3. Set Up the Database

Create a PostgreSQL database and execute `backend/schema.sql`.

Make sure the pgvector extension is enabled.

### 4. Start the Backend

From the backend directory:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints:

- API Health: http://localhost:8000/api/health
- Interactive API Documentation: http://localhost:8000/docs

### 5. Start the Frontend

Open another terminal from the project root:

```bash
npm install
npm run dev
```

Open the local URL provided by Vite (usually http://localhost:5173).

Navigate to **Settings → Backend Connection**, configure the API Base URL as:

```text
http://localhost:8000
```

Test the connection.

### 6. Connect Google Classroom & Calendar

1. Open Google Cloud Console.
2. Enable the Google Classroom API and Google Calendar API.
3. Configure your OAuth consent screen and required scopes.
4. Add the following redirect URI:

```text
http://localhost:8000/auth/google/callback
```

5. Add your OAuth credentials to `backend/.env`.
6. Start the backend and visit:

```text
http://localhost:8000/auth/google/login
```

7. Sign in using the Google account you want to connect and grant the requested permissions.

Google Classroom synchronization runs periodically while the backend is running. Google Calendar actions are available through the connected account.

---

## 🔮 Future Integrations

AutoMate AI is designed to grow beyond a single academic platform.

Planned integrations include:

- **Microsoft Teams:** Sync class announcements, assignments, and meeting schedules.
- **Google Drive:** Import and organize academic documents directly from Drive.
- **Microsoft Outlook:** Manage academic emails, schedules, and reminders.
- **Moodle & Canvas LMS:** Connect with additional learning management systems.
- **Notion:** Organize academic notes and knowledge bases.

Our vision is to make AutoMate AI a unified academic assistant that works across the platforms students already use.

---

## 🔐 Security

- Environment variables are used to store sensitive credentials.
- API keys and OAuth secrets should never be committed to version control.
- Google authorization is used for connected services.
- AI-proposed actions require student approval before execution.
- The current backend configuration is intended for local development. Production deployment requires HTTPS, restricted CORS, and secure secret management.

---

## 🌟 Our Vision

We believe students should spend less time managing academic chaos and more time learning, building, and growing.

AutoMate AI aims to transform the way students interact with their academic responsibilities — from scattered information and forgotten deadlines to intelligent planning and automated organization.

**One workspace. One intelligent assistant. A smarter academic life.**

---

*Built with ❤️ to make student life smarter, simpler, and more organized.*
