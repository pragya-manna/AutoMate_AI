import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Check,
  CalendarPlus,
  ListTodo,
  Bell,
  FileOutput,
  FileText,
  Loader2,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { DashboardData, AgentMessage, ProposedAction } from '@/types';

type Props = {
  data: DashboardData;
};

// ---- Settings you may want to change ----
const API_BASE = 'http://localhost:8000';
const USER_NAME = 'Pragya';
const VOICE_LANG = 'en-IN';

const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const actionIcons: Record<string, typeof CalendarPlus> = {
  calendar_event: CalendarPlus,
  task_create: ListTodo,
  reminder: Bell,
  file_organize: FileOutput,
  draft_outline: FileText,
};

const actionColors: Record<string, string> = {
  calendar_event: 'bg-brand-100 text-brand-600',
  task_create: 'bg-mint-100 text-mint-600',
  reminder: 'bg-amber-100 text-amber-600',
  file_organize: 'bg-ink-100 text-ink-600',
  draft_outline: 'bg-coral-100 text-coral-600',
};

const suggestions = [
  'Plan my week based on current workload',
  'What assignments are at risk?',
  'Create a study schedule for my DBMS practical',
  'Break down the OS assignment into subtasks',
];

async function postJson(path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function buildGreeting(data: DashboardData): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = data.assignments
    .filter((a) => a.status !== 'submitted' && a.status !== 'graded' && a.dueDate)
    .map((a) => ({ a, days: Math.round((new Date(a.dueDate).getTime() - today.getTime()) / 86400000) }))
    .filter((x) => x.days >= 0)
    .sort((x, y) => x.days - y.days);

  let text = `${part}, ${USER_NAME}! I'm your AutoMate assistant.`;
  if (upcoming.length) {
    const next = upcoming[0];
    const when = next.days === 0 ? 'today' : next.days === 1 ? 'tomorrow' : `in ${next.days} days`;
    text += ` You have ${upcoming.length} upcoming deadline${upcoming.length > 1 ? 's' : ''}. The next one is ${next.a.title}, due ${when}.`;
  } else {
    text += ' You have no upcoming deadlines right now.';
  }
  if (data.risks.length) {
    text += ` I also spotted ${data.risks.length} risk${data.risks.length > 1 ? 's' : ''} to look at.`;
  }
  text += ' What would you like to do? For example, say: plan my week.';
  return text;
}

function speechFromReply(content: string, actionCount: number): string {
  const plain = content.replace(/[*_`#•]/g, ' ').replace(/\s+/g, ' ').trim();
  let short = plain;
  if (plain.length > 380) {
    const cut = plain.slice(0, 380);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
    short = lastStop > 100 ? cut.slice(0, lastStop + 1) : cut;
  }
  if (actionCount > 0) {
    short += ` I have ${actionCount} proposed action${actionCount > 1 ? 's' : ''}. Say approve to run ${actionCount > 1 ? 'them' : 'it'}.`;
  }
  return short;
}

export default function Agent({ data }: Props) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Hi ${USER_NAME}! AutoMate AI Agent is ready. Ask me to plan your week, analyze workload risks, or break down assignments. I propose actions and only run them after you approve. Tap the speaker button to talk to me.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const voiceOnRef = useRef(false);
  const handleSendRef = useRef<(text?: string, fromVoice?: boolean) => void>(() => {});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const addSystem = (content: string) =>
    setMessages((prev) => [
      ...prev,
      { id: `s-${Date.now()}-${Math.random()}`, role: 'system', content, timestamp: new Date().toISOString() },
    ]);

  // ---------- Voice ----------
  const speak = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE_LANG;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang === VOICE_LANG) || voices.find((x) => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    if (!SpeechRec) {
      addSystem('Voice input needs Chrome or Edge. You can still type.');
      return;
    }
    try { recRef.current?.abort(); } catch { /* ignore */ }
    const rec = new SpeechRec();
    rec.lang = VOICE_LANG;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) handleSendRef.current(transcript, true);
    };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  const setVoice = (v: boolean) => {
    voiceOnRef.current = v;
    setVoiceOn(v);
  };

  const startVoiceAssistant = () => {
    setVoice(true);
    const greeting = buildGreeting(data);
    setMessages((prev) => [
      ...prev,
      { id: `g-${Date.now()}`, role: 'agent', content: greeting, timestamp: new Date().toISOString() },
    ]);
    speak(greeting, () => {
      if (voiceOnRef.current) startListening();
    });
  };

  const stopVoiceAssistant = (farewell?: string) => {
    setVoice(false);
    try { recRef.current?.abort(); } catch { /* ignore */ }
    setListening(false);
    if (farewell) speak(farewell);
    else if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const toggleVoiceAssistant = () => (voiceOnRef.current ? stopVoiceAssistant() : startVoiceAssistant());

  const micButton = () => {
    if (listening) {
      try { recRef.current?.stop(); } catch { /* ignore */ }
    } else {
      startListening();
    }
  };

  const afterSpeaking = () => {
    if (voiceOnRef.current) startListening();
  };

  // ---------- Running approved actions (real backend) ----------
  const runActions = async (list: ProposedAction[]) => {
    if (!list.length) return;
    const lines: string[] = [];
    const okIds = new Set<string>();

    for (const a of list) {
      try {
        const r = await postJson(`/api/agent/approve/${a.id}`);
        okIds.add(a.id);
        lines.push(`• ${a.label}: ${r.result || 'Done'}`);
      } catch {
        lines.push(`• ${a.label}: failed (backend offline, or this was a demo action)`);
      }
    }

    const mark = (a: ProposedAction): ProposedAction =>
      okIds.has(a.id) ? { ...a, approved: true, executed: true } : a;
    setActions((prev) => prev.map(mark));
    setMessages((prev) => prev.map((m) => (m.actions ? { ...m, actions: m.actions.map(mark) } : m)));

    addSystem(`${okIds.size} of ${list.length} action(s) completed:\n${lines.join('\n')}\nRefresh the page to see them in Overview and Assignments.`);

    if (voiceOnRef.current) {
      speak(
        okIds.size === list.length
          ? `Done, ${USER_NAME}. ${okIds.size} action${okIds.size > 1 ? 's' : ''} completed.`
          : `${okIds.size} of ${list.length} actions completed. Some failed, please check the screen.`,
        afterSpeaking
      );
    }
  };

  // ---------- Sending messages ----------
  const handleSend = async (text?: string, fromVoice?: boolean) => {
    const message = text || input.trim();
    if (!message || thinking) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() },
    ]);
    setInput('');

    if (fromVoice) {
      const lower = message.toLowerCase();
      if (/\b(stop|goodbye|bye|that'?s all|turn off)\b/.test(lower)) {
        stopVoiceAssistant(`Okay ${USER_NAME}, talk to you later.`);
        return;
      }
      const pending = actions.filter((a) => !a.executed);
      if (pending.length && /\b(approve|yes|confirm|do it|go ahead|execute)\b/.test(lower)) {
        await runActions(pending);
        return;
      }
    }

    setThinking(true);
    let agentMsg: AgentMessage;
    let proposed: ProposedAction[];

    try {
      const res = await postJson('/api/agent/chat', { message });
      proposed = (res.actions || []) as ProposedAction[];
      agentMsg = {
        id: res.id || `a-${Date.now()}`,
        role: 'agent',
        content: res.content || 'I could not generate a reply.',
        timestamp: res.timestamp || new Date().toISOString(),
        actions: proposed,
        status: 'proposing',
      };
    } catch {
      // Backend not reachable: fall back to the built-in demo behaviour
      proposed = generateActions(message, data);
      agentMsg = {
        id: `a-${Date.now()}`,
        role: 'agent',
        content: `(Offline demo mode)\n${generateResponse(message, data, proposed)}`,
        timestamp: new Date().toISOString(),
        actions: proposed,
        status: 'proposing',
      };
    }

    setMessages((prev) => [...prev, agentMsg]);
    setActions(proposed);
    setThinking(false);

    if (voiceOnRef.current) {
      speak(speechFromReply(agentMsg.content, proposed.length), afterSpeaking);
    }
  };
  handleSendRef.current = handleSend;

  const toggleApprove = (actionId: string) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, approved: !a.approved } : a)));
    setMessages((prev) =>
      prev.map((m) =>
        m.actions
          ? { ...m, actions: m.actions.map((a) => (a.id === actionId ? { ...a, approved: !a.approved } : a)) }
          : m
      )
    );
  };

  const executeApproved = () => {
    runActions(actions.filter((a) => a.approved && !a.executed));
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Agent header */}
      <div className="flex items-center justify-between rounded-2xl bg-ink-900 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15">
            <Bot className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white">AI Agent</h2>
            <p className="text-xs text-ink-400">Powered by Gemini · Voice assistant for {USER_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoiceAssistant}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              voiceOn ? 'bg-brand-500 text-white' : 'bg-white/10 text-ink-200 hover:bg-white/20'
            }`}
          >
            {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {voiceOn ? 'Voice on' : 'Voice off'}
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-mint-500/15 px-3 py-1 text-xs font-semibold text-mint-400">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onApprove={toggleApprove} onExecute={executeApproved} />
        ))}
        {thinking && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900">
              <Bot className="h-4 w-4 text-brand-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-ink-100 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <Sparkles className="h-4 w-4 text-brand-500 animate-pulse" />
                Analyzing your workload and generating a plan...
              </div>
            </div>
          </div>
        )}
        {listening && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-coral-100 px-4 py-1.5 text-xs font-semibold text-coral-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-coral-500" />
              Listening...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-600 ring-1 ring-ink-200 transition-all hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink-200">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Ask the agent to plan, analyze, or take action..."
          className="flex-1 resize-none bg-transparent text-sm text-ink-900 placeholder-ink-400 outline-none"
        />
        <button
          onClick={micButton}
          title={listening ? 'Stop listening' : 'Speak'}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            listening ? 'bg-coral-500 text-white animate-pulse' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || thinking}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition-all hover:bg-brand-600 disabled:opacity-40"
        >
          {thinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onApprove,
  onExecute,
}: {
  message: AgentMessage;
  onApprove: (id: string) => void;
  onExecute: () => void;
}) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="max-w-md whitespace-pre-line rounded-xl bg-ink-100 px-4 py-2.5 text-center text-xs text-ink-500">
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const hasApprovedActions = message.actions?.some((a) => a.approved && !a.executed);
  const allExecuted = message.actions?.every((a) => a.executed);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        isUser ? 'bg-brand-500' : 'bg-ink-900'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-brand-400" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'rounded-tr-sm bg-brand-500 text-white'
            : 'rounded-tl-sm bg-ink-100 text-ink-800'
        }`}>
          {message.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
          ))}
        </div>

        {/* Proposed actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.actions.map((action) => {
              const Icon = actionIcons[action.type] || Zap;
              return (
                <div
                  key={action.id}
                  className={`rounded-xl p-3 ring-1 transition-all ${
                    action.executed
                      ? 'bg-mint-50 ring-mint-200'
                      : action.approved
                      ? 'bg-brand-50 ring-brand-300'
                      : 'bg-white ring-ink-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${actionColors[action.type] || 'bg-ink-100'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-900">{action.label}</p>
                      <p className="text-xs text-ink-500">{action.description}</p>
                    </div>
                    {action.executed ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-mint-600">
                        <Check className="h-4 w-4" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => onApprove(action.id)}
                        className={`flex h-7 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-all ${
                          action.approved
                            ? 'bg-brand-500 text-white'
                            : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {action.approved ? 'Approved' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!allExecuted && hasApprovedActions && (
              <button
                onClick={onExecute}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-800"
              >
                <Zap className="h-4 w-4" />
                Execute Approved Actions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Offline fallback (only used when the backend cannot be reached) ----

function generateResponse(message: string, data: DashboardData, actions: ProposedAction[]): string {
  const lower = message.toLowerCase();
  if (lower.includes('plan') || lower.includes('week') || lower.includes('schedule')) {
    return `I've analyzed your current workload. You have ${data.stats.pendingAssignments} pending assignments with ${data.risks.length} detected risk${data.risks.length > 1 ? 's' : ''}. The main concern is ${data.risks[0]?.title || 'deadline clustering'}.\n\nHere's my proposed plan. Review each action and approve the ones you want me to execute:`;
  }
  if (lower.includes('risk') || lower.includes('behind') || lower.includes('conflict')) {
    return `Based on my analysis, here are the current risks:\n\n${data.risks.map(r => `• ${r.title}`).join('\n')}\n\nI recommend the following actions to address these risks:`;
  }
  if (lower.includes('break') || lower.includes('subtask') || lower.includes('split')) {
    return `I can break down your assignments into manageable subtasks. Based on your document analysis, here are the key actions:`;
  }
  if (lower.includes('study') || lower.includes('exam') || lower.includes('practical')) {
    return `I'll create a focused study plan for your upcoming exam. Based on your uploaded materials and current workload, here are my recommendations:`;
  }
  return `I understand. Based on your current academic context — ${data.stats.activeCourses} courses, ${data.stats.pendingAssignments} pending assignments, and ${data.documents.length} analyzed documents — here's what I propose:`;
}

function generateActions(message: string, data: DashboardData): ProposedAction[] {
  const lower = message.toLowerCase();
  const baseActions: ProposedAction[] = [];
  let id = 1;

  if (lower.includes('plan') || lower.includes('week') || lower.includes('schedule')) {
    data.assignments
      .filter((a) => a.status !== 'submitted' && a.status !== 'graded')
      .slice(0, 3)
      .forEach((a) => {
        baseActions.push({
          id: `act-${id++}`,
          type: 'calendar_event',
          label: `Block study time for ${a.title}`,
          description: `Schedule a 2-hour focused session for ${a.subject}. Due ${new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Current progress: ${a.progress}%.`,
          approved: false,
          executed: false,
        });
      });
    baseActions.push({
      id: `act-${id++}`,
      type: 'reminder',
      label: 'Set reminder for upcoming deadlines',
      description: 'Get notified 48 hours before each deadline with a progress check.',
      approved: false,
      executed: false,
    });
  } else if (lower.includes('risk') || lower.includes('behind')) {
    data.risks.forEach((r) => {
      baseActions.push({
        id: `act-${id++}`,
        type: 'calendar_event',
        label: r.suggestedAction.split('.')[0],
        description: r.description,
        approved: false,
        executed: false,
      });
    });
  } else if (lower.includes('study') || lower.includes('exam')) {
    baseActions.push(
      { id: `act-${id++}`, type: 'calendar_event', label: 'Study session: Review key topics', description: 'Block 3 hours for comprehensive review of exam topics extracted from your documents.', approved: false, executed: false },
      { id: `act-${id++}`, type: 'task_create', label: 'Create exam prep checklist', description: 'Generate a topic-by-topic checklist based on your syllabus and notes.', approved: false, executed: false },
      { id: `act-${id++}`, type: 'reminder', label: 'Set pre-exam reminders', description: 'Reminders 3 days, 1 day, and 2 hours before the exam.', approved: false, executed: false },
    );
  } else {
    baseActions.push(
      { id: `act-${id++}`, type: 'task_create', label: 'Organize pending tasks', description: 'Create structured task entries for all pending assignments with priorities.', approved: false, executed: false },
      { id: `act-${id++}`, type: 'calendar_event', label: 'Schedule focused work blocks', description: 'Block calendar time for your highest-priority assignments.', approved: false, executed: false },
    );
  }

  return baseActions;
}