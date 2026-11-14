import type {
  ApiConfig,
  CalendarEvent,
  UploadedDocument,
  Assignment,
  RiskAlert,
  MemoryEntry,
  Integration,
  DashboardData,
  AgentMessage,
  ProposedAction,
} from '@/types';

// ============================================================================
// API CLIENT - Connect to your own local backend
// ============================================================================
//
// This client is designed to talk to YOUR local Python + FastAPI backend,
// NOT through Bolt. Set the base URL in Settings or localStorage.
//
// Expected FastAPI endpoints (implement these on your backend):
//   GET    /api/health                    -> { status: "ok" }
//   GET    /api/dashboard                 -> DashboardData
//   POST   /api/documents/upload          -> multipart upload -> UploadedDocument
//   GET    /api/documents                 -> UploadedDocument[]
//   DELETE /api/documents/:id             -> { success: true }
//   POST   /api/agent/chat                -> { message: string } -> AgentMessage
//   POST   /api/agent/approve/:actionId   -> { success: true }
//   GET    /api/assignments               -> Assignment[]
//   PATCH  /api/assignments/:id           -> partial Assignment
//   POST   /api/memory/query              -> { query: string } -> MemoryEntry
//   GET    /api/memory                    -> MemoryEntry[]
//   GET    /api/integrations              -> Integration[]
//   POST   /api/integrations/:provider    -> { connected: true }
//   DELETE /api/integrations/:provider    -> { disconnected: true }
//
// Gemini API can be called either:
//   1. Server-side via your FastAPI backend (recommended, keeps keys safe)
//   2. Or directly, by providing your Gemini API key in Settings
//      (key stored in localStorage, sent as x-gemini-key header)
// ============================================================================

const STORAGE_KEY = 'automate_api_config';

// Track whether we're connected to a real backend
let _connected: boolean | null = null;
const _listeners: Set<(connected: boolean) => void> = new Set();

export function isConnected(): boolean | null {
  return _connected;
}

export function onConnectionChange(cb: (connected: boolean) => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function setConnected(value: boolean) {
  if (_connected !== value) {
    _connected = value;
    _listeners.forEach((cb) => cb(value));
  }
}

// Try to ping the backend on startup
export async function probeBackend(): Promise<boolean> {
  try {
    const config = getApiConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${config.baseUrl}/api/health`, {
      signal: controller.signal,
      headers: authHeaders(),
    });
    clearTimeout(timeout);
    if (res.ok) {
      setConnected(true);
      return true;
    }
    setConnected(false);
    return false;
  } catch {
    setConnected(false);
    return false;
  }
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:8000',
  geminiApiKey: '',
  googleClientId: '',
  googleClientSecret: '',
  googleRedirectUri: 'http://localhost:8000/auth/google/callback',
  microsoftClientId: '',
  microsoftTenantId: '',
  microsoftClientSecret: '',
  fastApiUrl: 'http://localhost:8000',
  pgVectorUrl: 'postgresql://localhost:5432/automate',
};

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

export function saveApiConfig(config: Partial<ApiConfig>): ApiConfig {
  const current = getApiConfig();
  const next = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function authHeaders(): Record<string, string> {
  const config = getApiConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.geminiApiKey) {
    headers['x-gemini-key'] = config.geminiApiKey;
  }
  return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const config = getApiConfig();
  const url = `${config.baseUrl}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...authHeaders(), ...(options?.headers || {}) },
    });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // Return null-safe so UI can fall back to mock data
    if (err instanceof TypeError) {
      // Network error - backend not running
      throw new Error(
        `Cannot reach backend at ${config.baseUrl}. Make sure your FastAPI server is running.`
      );
    }
    throw err;
  }
}

// ---- Health check ----

export async function checkHealth(): Promise<{ status: string; gemini: boolean }> {
  return apiFetch('/api/health');
}

// ---- Dashboard ----

export async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch('/api/dashboard');
}

// ---- Documents ----

export async function fetchDocuments(): Promise<UploadedDocument[]> {
  return apiFetch('/api/documents');
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const config = getApiConfig();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${config.baseUrl}/api/documents/upload`, {
    method: 'POST',
    headers: { ...(config.geminiApiKey ? { 'x-gemini-key': config.geminiApiKey } : {}) },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return (await res.json()) as UploadedDocument;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
}

// ---- Agent ----

export async function sendAgentMessage(message: string): Promise<AgentMessage> {
  return apiFetch('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function approveAction(actionId: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/agent/approve/${actionId}`, { method: 'POST' });
}

// ---- Assignments ----

export async function fetchAssignments(): Promise<Assignment[]> {
  return apiFetch('/api/assignments');
}

export async function updateAssignment(
  id: string,
  patch: Partial<Assignment>
): Promise<Assignment> {
  return apiFetch(`/api/assignments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// ---- Memory ----

export async function queryMemory(query: string): Promise<MemoryEntry> {
  return apiFetch('/api/memory/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function fetchMemory(): Promise<MemoryEntry[]> {
  return apiFetch('/api/memory');
}

// ---- Integrations ----

export async function fetchIntegrations(): Promise<Integration[]> {
  return apiFetch('/api/integrations');
}

export async function connectIntegration(
  provider: string
): Promise<{ connected: boolean }> {
  return apiFetch(`/api/integrations/${provider}`, { method: 'POST' });
}

export async function disconnectIntegration(
  provider: string
): Promise<{ disconnected: boolean }> {
  return apiFetch(`/api/integrations/${provider}`, { method: 'DELETE' });
}

// ---- Direct Gemini call (optional, bypasses your backend) ----

export async function callGeminiDirectly(
  prompt: string,
  model = 'gemini-3.8-flash'
): Promise<string> {
  const config = getApiConfig();
  if (!config.geminiApiKey) {
    throw new Error('No Gemini API key set. Add one in Settings.');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ============================================================================
// MOCK DATA - Used when backend is not connected, for demo/hackathon purposes
// ============================================================================

const mockEvents: CalendarEvent[] = [
  { id: 'e1', title: 'DBMS Lecture', date: '2026-11-16', time: '09:00', type: 'class', subject: 'DBMS' },
  { id: 'e2', title: 'Data Structures Lab', date: '2026-11-16', time: '11:00', type: 'class', subject: 'DSA' },
  { id: 'e3', title: 'OS Assignment Due', date: '2026-11-18', time: '23:59', type: 'deadline', subject: 'Operating Systems' },
  { id: 'e4', title: 'Math Midterm', date: '2026-11-20', time: '14:00', type: 'exam', subject: 'Engineering Math' },
  { id: 'e5', title: 'DBMS Practical Exam', date: '2026-11-21', time: '10:00', type: 'exam', subject: 'DBMS' },
  { id: 'e6', title: 'Study Session - Math', date: '2026-11-17', time: '18:00', type: 'study', subject: 'Engineering Math' },
  { id: 'e7', title: 'CN Project Review', date: '2026-11-19', time: '15:00', type: 'deadline', subject: 'Computer Networks' },
];

const mockDocuments: UploadedDocument[] = [
  {
    id: 'd1', name: 'DBMS_Assignment3_Schema_Design.pdf', type: 'pdf', status: 'analyzed',
    uploadedAt: '2026-11-12T10:30:00Z', size: 245678, subject: 'DBMS', pageCount: 8,
    summary: 'Design a normalized database schema for a university library system. Includes ER diagram, 3NF decomposition, and SQL DDL.',
    extractedDates: ['2026-11-28'], extractedTasks: ['ER diagram', '3NF decomposition', 'SQL DDL script', 'Sample queries'],
  },
  {
    id: 'd2', name: 'OS_Lab_Manual_W6.pdf', type: 'pdf', status: 'analyzed',
    uploadedAt: '2026-11-11T14:20:00Z', size: 189234, subject: 'Operating Systems', pageCount: 12,
    summary: 'Process scheduling algorithms: FCFS, SJF, Round Robin. Implement in C with Gantt chart output.',
    extractedDates: ['2026-11-18'], extractedTasks: ['Implement FCFS', 'Implement SJF', 'Implement Round Robin', 'Generate Gantt charts'],
  },
  {
    id: 'd3', name: 'Professor_Announcement_DBMS.png', type: 'image', status: 'analyzed',
    uploadedAt: '2026-11-13T09:15:00Z', size: 456789, subject: 'DBMS',
    summary: 'Screenshot of Google Classroom announcement: DBMS practical exam moved to Nov 21. Bring lab manual. Mini-project proposal due Nov 25.',
    extractedDates: ['2026-11-21', '2026-11-25'], extractedTasks: ['Prepare for practical exam', 'Submit mini-project proposal'],
  },
  {
    id: 'd4', name: 'CN_Syllabus_Sem5.pdf', type: 'syllabus', status: 'analyzed',
    uploadedAt: '2026-11-10T08:00:00Z', size: 567890, subject: 'Computer Networks', pageCount: 6,
    summary: 'Semester 5 Computer Networks syllabus: OSI model, TCP/IP, routing protocols, socket programming, network security.',
    extractedDates: ['2026-12-10'],
    extractedTasks: ['Socket programming assignment', 'Routing protocol study', 'Final exam prep'],
  },
  {
    id: 'd5', name: 'Math_Lecture_Notes_Ch5.pdf', type: 'notes', status: 'processing',
    uploadedAt: '2026-11-14T16:45:00Z', size: 345678, subject: 'Engineering Math',
    summary: undefined,
  },
];

const mockAssignments: Assignment[] = [
  {
    id: 'a1', title: 'OS Process Scheduler Implementation', subject: 'Operating Systems',
    dueDate: '2026-11-18', status: 'in_progress', priority: 'high', progress: 45,
    subtasks: [
      { id: 's1', label: 'Implement FCFS scheduler', done: true },
      { id: 's2', label: 'Implement SJF scheduler', done: true },
      { id: 's3', label: 'Implement Round Robin', done: false },
      { id: 's4', label: 'Generate Gantt charts', done: false },
      { id: 's5', label: 'Write report', done: false },
    ],
  },
  {
    id: 'a2', title: 'DBMS Schema Design Assignment', subject: 'DBMS',
    dueDate: '2026-11-28', status: 'not_started', priority: 'medium', progress: 0,
    subtasks: [
      { id: 's1', label: 'Create ER diagram', done: false },
      { id: 's2', label: 'Decompose to 3NF', done: false },
      { id: 's3', label: 'Write SQL DDL', done: false },
      { id: 's4', label: 'Test sample queries', done: false },
    ],
  },
  {
    id: 'a3', title: 'CN Socket Programming Project', subject: 'Computer Networks',
    dueDate: '2026-11-19', status: 'review', priority: 'critical', progress: 85,
    rubricScore: 72,
    missingRequirements: ['Error handling for connection timeout', 'README with usage instructions'],
    subtasks: [
      { id: 's1', label: 'TCP server-client setup', done: true },
      { id: 's2', label: 'Multi-client handling', done: true },
      { id: 's3', label: 'Message protocol', done: true },
      { id: 's4', label: 'Error handling', done: false },
      { id: 's5', label: 'Documentation', done: false },
    ],
  },
  {
    id: 'a4', title: 'DBMS Mini-Project Proposal', subject: 'DBMS',
    dueDate: '2026-11-25', status: 'not_started', priority: 'medium', progress: 0,
    subtasks: [
      { id: 's1', label: 'Choose topic', done: false },
      { id: 's2', label: 'Write problem statement', done: false },
      { id: 's3', label: 'Submit proposal', done: false },
    ],
  },
  {
    id: 'a5', title: 'Math Problem Set 5', subject: 'Engineering Math',
    dueDate: '2026-11-22', status: 'in_progress', priority: 'medium', progress: 60,
    subtasks: [
      { id: 's1', label: 'Q1-Q4: Laplace transforms', done: true },
      { id: 's2', label: 'Q5-Q8: Fourier series', done: true },
      { id: 's3', label: 'Q9-Q12: PDEs', done: false },
    ],
  },
];

const mockRisks: RiskAlert[] = [
  {
    id: 'r1', type: 'deadline_conflict', severity: 'critical',
    title: 'Two major submissions within 24 hours',
    description: 'CN Socket Programming Project (Nov 19) and OS Process Scheduler (Nov 18) are both due this week. Current progress suggests the CN project needs 2 more days.',
    suggestedAction: 'Prioritize CN project this weekend. Shift OS report writing to Monday-Tuesday. AutoMate can draft a revised study schedule.',
    affectedAssignments: ['a3', 'a1'],
  },
  {
    id: 'r2', type: 'behind_schedule', severity: 'high',
    title: 'Math Problem Set 5 behind schedule',
    description: 'PDE section (Q9-Q12) is incomplete. At current pace, submission on Nov 22 is at risk. Estimated 4 hours of work remaining.',
    suggestedAction: 'Block 2 study sessions of 2 hours each before Nov 21. AutoMate can create calendar blocks.',
    affectedAssignments: ['a5'],
  },
  {
    id: 'r3', type: 'missing_docs', severity: 'medium',
    title: 'DBMS practical exam in 7 days - lab manual not uploaded',
    description: 'Your DBMS practical exam is on Nov 21. The lab manual has not been uploaded for AI-assisted preparation.',
    suggestedAction: 'Upload your DBMS lab manual so AutoMate can extract key topics and generate a prep plan.',
    affectedAssignments: [],
  },
];

const mockMemory: MemoryEntry[] = [
  {
    id: 'm1',
    query: 'What did my professor say about the DBMS mini-project?',
    answer: 'In the announcement uploaded on Nov 13, your professor stated: the DBMS practical exam is moved to Nov 21, you should bring your lab manual, and the mini-project proposal is due Nov 25. The proposal should include a problem statement and expected schema.',
    sources: [
      { docName: 'Professor_Announcement_DBMS.png', snippet: '...practical exam moved to Nov 21. Bring lab manual. Mini-project proposal due Nov 25...' },
    ],
    timestamp: '2026-11-14T10:30:00Z',
  },
  {
    id: 'm2',
    query: 'When is the OS assignment due and what does it cover?',
    answer: 'The OS assignment (Process Scheduler Implementation) is due Nov 18 at 23:59. It covers FCFS, SJF, and Round Robin scheduling algorithms. You need to implement them in C and generate Gantt charts.',
    sources: [
      { docName: 'OS_Lab_Manual_W6.pdf', snippet: '...Process scheduling algorithms: FCFS, SJF, Round Robin. Implement in C with Gantt chart output...' },
    ],
    timestamp: '2026-11-14T09:15:00Z',
  },
];

const mockIntegrations: Integration[] = [
  { provider: 'google_classroom', label: 'Google Classroom', connected: true, lastSync: '2026-11-14T08:00:00Z', scopes: ['coursework.read', 'announcements.read'] },
  { provider: 'google_calendar', label: 'Google Calendar', connected: true, lastSync: '2026-11-14T08:00:00Z', scopes: ['calendar.events'] },
  { provider: 'google_drive', label: 'Google Drive', connected: false, scopes: ['drive.file'] },
  { provider: 'microsoft_teams', label: 'Microsoft Teams', connected: false, scopes: ['team.read', 'assignment.read'] },
  { provider: 'notion', label: 'Notion', connected: false, scopes: ['pages.write'] },
  { provider: 'slack', label: 'Slack', connected: false, scopes: ['chat.write'] },
];

export const mockDashboardData: DashboardData = {
  events: mockEvents,
  documents: mockDocuments,
  assignments: mockAssignments,
  risks: mockRisks,
  memory: mockMemory,
  integrations: mockIntegrations,
  stats: {
    activeCourses: 5,
    pendingAssignments: 5,
    upcomingDeadlines: 4,
    documentsAnalyzed: 4,
    avgWorkload: 78,
    riskLevel: 'at_risk',
  },
};

export const mockAgentConversation: AgentMessage[] = [
  {
    id: 'msg1', role: 'user',
    content: "I have my DBMS practical next Friday, two assignments pending, and incomplete math notes. Plan my week.",
    timestamp: '2026-11-14T10:00:00Z',
  },
  {
    id: 'msg2', role: 'agent', status: 'proposing',
    content: "I've analyzed your current workload. You have 3 submissions due this week and a practical exam next Friday. The main risk is the CN project (85% done, missing error handling) and OS assignment (45% done) both being due within 24 hours of each other.\n\nHere's my proposed plan. Review each action and approve the ones you want me to execute:",
    timestamp: '2026-11-14T10:00:05Z',
    actions: [
      { id: 'act1', type: 'calendar_event', label: 'Block Sat 10:00-13:00 for CN project', description: 'Finish error handling and documentation for the socket programming project. Highest priority - due Nov 19.', approved: false, executed: false },
      { id: 'act2', type: 'calendar_event', label: 'Block Sun 14:00-17:00 for OS Round Robin', description: 'Implement Round Robin scheduler and start Gantt chart generation. Due Nov 18.', approved: false, executed: false },
      { id: 'act3', type: 'task_create', label: 'Create subtasks for DBMS mini-project proposal', description: 'Break down the Nov 25 proposal into: choose topic, write problem statement, draft schema outline.', approved: false, executed: false },
      { id: 'act4', type: 'calendar_event', label: 'Block Mon 18:00-20:00 for Math PDEs', description: 'Complete Q9-Q12 (PDE section) of Problem Set 5. Due Nov 22.', approved: false, executed: false },
      { id: 'act5', type: 'reminder', label: 'Set reminder to upload DBMS lab manual', description: 'Your practical exam is Nov 21. Upload the lab manual so I can generate a prep plan.', approved: false, executed: false },
    ],
  },
];

export const mockProposedActions: ProposedAction[] = [
  { id: 'act1', type: 'calendar_event', label: 'Block Sat 10:00-13:00 for CN project', description: 'Finish error handling and documentation for the socket programming project.', approved: false, executed: false },
  { id: 'act2', type: 'calendar_event', label: 'Block Sun 14:00-17:00 for OS Round Robin', description: 'Implement Round Robin scheduler and start Gantt chart generation.', approved: false, executed: false },
];
