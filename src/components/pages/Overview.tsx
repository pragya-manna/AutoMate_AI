import {
  ClipboardList,
  FileText,
  AlertTriangle,
  CalendarClock,
  TrendingDown,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { DashboardData, DashboardPage } from '@/types';
import { StatCard, PriorityBadge } from '../DashboardLayout';

type Props = {
  data: DashboardData;
  setPage: (p: DashboardPage) => void;
};

export default function Overview({ data, setPage }: Props) {
  const today = new Date();
  const upcomingEvents = data.events
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const activeAssignments = data.assignments
    .filter((a) => a.status !== 'submitted' && a.status !== 'graded')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-500/20 blur-[60px]" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI Analysis Complete
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Welcome back, Pragya</h2>
            <p className="mt-1 max-w-lg text-sm text-ink-400">
              You have {data.stats.pendingAssignments} pending assignments and {data.stats.upcomingDeadlines} deadlines this week.
              {data.risks.length > 0 && ` I've detected ${data.risks.length} risk${data.risks.length > 1 ? 's' : ''} that need your attention.`}
            </p>
          </div>
          <button
            onClick={() => setPage('agent')}
            className="hidden items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30 sm:flex"
          >
            <Zap className="h-4 w-4" />
            Ask AI Agent
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Courses"
          value={data.stats.activeCourses}
          icon={ClipboardList}
          color="bg-brand-100 text-brand-600"
        />
        <StatCard
          label="Pending Assignments"
          value={data.stats.pendingAssignments}
          icon={FileText}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Documents Analyzed"
          value={data.stats.documentsAnalyzed}
          icon={FileText}
          color="bg-mint-100 text-mint-600"
          sublabel={`${data.documents.filter(d => d.status === 'processing').length} processing`}
        />
        <StatCard
          label="Workload Level"
          value={`${data.stats.avgWorkload}%`}
          icon={data.stats.riskLevel === 'at_risk' || data.stats.riskLevel === 'critical' ? TrendingDown : CalendarClock}
          color={
            data.stats.riskLevel === 'critical' ? 'bg-coral-100 text-coral-600'
            : data.stats.riskLevel === 'at_risk' ? 'bg-amber-100 text-amber-600'
            : 'bg-mint-100 text-mint-600'
          }
          sublabel={data.stats.riskLevel.replace('_', ' ')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink-900">Risk Alerts</h3>
            <button
              onClick={() => setPage('agent')}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </button>
          </div>

          {data.risks.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" />
              <p className="mt-2 text-sm text-ink-500">No risks detected. You're on track.</p>
            </div>
          ) : (
            data.risks.map((risk) => (
              <div
                key={risk.id}
                className={`card p-5 ring-1 ${
                  risk.severity === 'critical' ? 'ring-coral-200'
                  : risk.severity === 'high' ? 'ring-amber-200'
                  : 'ring-ink-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    risk.severity === 'critical' ? 'bg-coral-100 text-coral-600'
                    : risk.severity === 'high' ? 'bg-amber-100 text-amber-600'
                    : 'bg-brand-100 text-brand-600'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-ink-900">{risk.title}</h4>
                      <PriorityBadge priority={risk.severity} />
                    </div>
                    <p className="mt-1 text-sm text-ink-600">{risk.description}</p>
                    <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                      <span className="font-semibold">Suggested action: </span>
                      {risk.suggestedAction}
                    </div>
                    <button
                      onClick={() => setPage('agent')}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Let AI handle this <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: upcoming events + assignments */}
        <div className="space-y-6">
          {/* Upcoming events */}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold text-ink-900">This Week</h3>
            <div className="card divide-y divide-ink-100">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const day = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = eventDate.getDate();
                const typeColors: Record<string, string> = {
                  class: 'bg-brand-500',
                  deadline: 'bg-coral-500',
                  exam: 'bg-amber-500',
                  study: 'bg-mint-500',
                  personal: 'bg-ink-400',
                };
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-50">
                      <span className="text-[10px] font-medium uppercase text-ink-400">{day}</span>
                      <span className="text-lg font-bold text-ink-900">{dayNum}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${typeColors[event.type]}`} />
                        <p className="truncate text-sm font-medium text-ink-900">{event.title}</p>
                      </div>
                      <p className="text-xs text-ink-500">
                        {event.time} {event.subject && `· ${event.subject}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick assignment status */}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold text-ink-900">Active Assignments</h3>
            <div className="card divide-y divide-ink-100">
              {activeAssignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setPage('assignments')}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{a.title}</p>
                    <p className="text-xs text-ink-500">{a.subject} · Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${a.progress >= 80 ? 'bg-mint-500' : a.progress >= 40 ? 'bg-brand-500' : 'bg-amber-500'}`}
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ink-700">{a.progress}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
