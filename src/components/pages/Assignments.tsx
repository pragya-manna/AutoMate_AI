import { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Target,
  FileWarning,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { DashboardData, Assignment } from '@/types';
import { PriorityBadge, StatusBadge } from '../DashboardLayout';

type Props = {
  data: DashboardData;
};

export default function Assignments({ data }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(data.assignments);
  const [expanded, setExpanded] = useState<string | null>(assignments[0]?.id || null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const toggleSubtask = (assignmentId: string, subtaskId: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const subtasks = a.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        );
        const progress = Math.round((subtasks.filter((s) => s.done).length / subtasks.length) * 100);
        const status = progress === 100 ? 'review' : progress > 0 ? 'in_progress' : 'not_started';
        return { ...a, subtasks, progress, status };
      })
    );
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'active') return a.status !== 'submitted' && a.status !== 'graded';
    if (filter === 'completed') return a.status === 'submitted' || a.status === 'graded';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'
            }`}
          >
            {f} ({f === 'all' ? assignments.length : f === 'active' ? assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').length : assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length})
          </button>
        ))}
      </div>

      {/* Assignment cards */}
      <div className="space-y-3">
        {sorted.map((a) => (
          <div key={a.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-ink-50/50"
            >
              {expanded === a.id ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-ink-400" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900">{a.title}</p>
                  <PriorityBadge priority={a.priority} />
                </div>
                <p className="text-xs text-ink-500">{a.subject}</p>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <Clock className="h-4 w-4 text-ink-400" />
                <span className="text-xs text-ink-500">
                  Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        a.progress >= 80 ? 'bg-mint-500' : a.progress >= 40 ? 'bg-brand-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-ink-700">{a.progress}%</span>
                <StatusBadge status={a.status} />
              </div>
            </button>

            {expanded === a.id && (
              <div className="border-t border-ink-100 p-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Subtasks */}
                  <div className="lg:col-span-2">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Subtasks ({a.subtasks.filter(s => s.done).length}/{a.subtasks.length})
                    </h4>
                    <div className="space-y-1.5">
                      {a.subtasks.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => toggleSubtask(a.id, s.id)}
                          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-ink-50"
                        >
                          {s.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-500" />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-ink-300" />
                          )}
                          <span className={`text-sm ${s.done ? 'text-ink-400 line-through' : 'text-ink-700'}`}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="space-y-3">
                    {/* Rubric score */}
                    {a.rubricScore !== undefined && (
                      <div className="rounded-xl bg-amber-50 p-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-semibold uppercase text-amber-700">Rubric Score</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-amber-700">{a.rubricScore}<span className="text-sm">/100</span></p>
                      </div>
                    )}

                    {/* Missing requirements */}
                    {a.missingRequirements && a.missingRequirements.length > 0 && (
                      <div className="rounded-xl bg-coral-50 p-3">
                        <div className="flex items-center gap-2">
                          <FileWarning className="h-4 w-4 text-coral-600" />
                          <span className="text-xs font-semibold uppercase text-coral-700">Missing Requirements</span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {a.missingRequirements.map((req) => (
                            <li key={req} className="flex items-start gap-2 text-xs text-coral-800">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Deadline info */}
                    <div className="rounded-xl bg-ink-50 p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-ink-500" />
                        <span className="text-xs font-semibold uppercase text-ink-500">Deadline</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {new Date(a.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-ink-500">
                        {Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000)} days remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="card p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-2 text-sm text-ink-500">No assignments in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
