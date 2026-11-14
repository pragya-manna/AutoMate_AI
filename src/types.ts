export type View = 'landing' | 'app';

export type DashboardPage =
  | 'overview'
  | 'documents'
  | 'agent'
  | 'assignments'
  | 'memory'
  | 'integrations'
  | 'settings';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type DocumentType = 'pdf' | 'image' | 'announcement' | 'notes' | 'presentation' | 'syllabus';

export type DocumentStatus = 'processing' | 'analyzed' | 'failed';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'review' | 'submitted' | 'graded';

export type WorkloadRisk = 'safe' | 'watch' | 'at_risk' | 'critical';

export type AgentStatus = 'idle' | 'thinking' | 'proposing' | 'executing' | 'awaiting_approval';

export type IntegrationProvider = 'google_classroom' | 'microsoft_teams' | 'google_calendar' | 'google_drive' | 'notion' | 'slack';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'deadline' | 'exam' | 'study' | 'personal';
  subject?: string;
};

export type UploadedDocument = {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  size: number;
  subject?: string;
  summary?: string;
  extractedDates?: string[];
  extractedTasks?: string[];
  pageCount?: number;
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: Priority;
  progress: number;
  rubricScore?: number;
  missingRequirements?: string[];
  subtasks: { id: string; label: string; done: boolean }[];
};

export type RiskAlert = {
  id: string;
  type: 'deadline_conflict' | 'overload' | 'behind_schedule' | 'missing_docs';
  severity: Priority;
  title: string;
  description: string;
  suggestedAction: string;
  affectedAssignments: string[];
};

export type AgentMessage = {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  actions?: ProposedAction[];
  status?: AgentStatus;
};

export type ProposedAction = {
  id: string;
  label: string;
  description: string;
  type: 'calendar_event' | 'task_create' | 'reminder' | 'file_organize' | 'draft_outline';
  approved: boolean;
  executed: boolean;
};

export type MemoryEntry = {
  id: string;
  query: string;
  answer: string;
  sources: { docName: string; snippet: string }[];
  timestamp: string;
};

export type Integration = {
  provider: IntegrationProvider;
  label: string;
  connected: boolean;
  lastSync?: string;
  scopes: string[];
};

export type ApiConfig = {
  baseUrl: string;
  geminiApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  microsoftClientId: string;
  microsoftTenantId: string;
  microsoftClientSecret: string;
  fastApiUrl: string;
  pgVectorUrl: string;
};

export type DashboardData = {
  events: CalendarEvent[];
  documents: UploadedDocument[];
  assignments: Assignment[];
  risks: RiskAlert[];
  memory: MemoryEntry[];
  integrations: Integration[];
  stats: {
    activeCourses: number;
    pendingAssignments: number;
    upcomingDeadlines: number;
    documentsAnalyzed: number;
    avgWorkload: number;
    riskLevel: WorkloadRisk;
  };
};
