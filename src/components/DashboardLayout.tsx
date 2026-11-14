import { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Bot,
  ClipboardList,
  MemoryStick,
  Plug,
  Settings,
  Bell,
  Search,
  AlertTriangle,
  ChevronLeft,
  LogOut,
  CircleDot,
} from 'lucide-react';
import type { DashboardPage, DashboardData } from '@/types';
import ConnectionBanner, { ConnectionPill } from './ConnectionBanner';

type DashboardLayoutProps = {
  page: DashboardPage;
  setPage: (p: DashboardPage) => void;
  onExit: () => void;
  data: DashboardData;
  children: React.ReactNode;
};
const navItems: { id: DashboardPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'agent', label: 'AI Agent', icon: Bot },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'memory', label: 'Memory', icon: MemoryStick },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  page,
  setPage,
  onExit,
  data,
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const criticalRisks = data.risks.filter((r) => r.severity === 'critical' || r.severity === 'high').length;

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-60'
        } flex flex-col bg-ink-900 transition-all duration-300`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-800 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
            <GraduationCap className="h-4 w-4 text-brand-400" />
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold text-white">
              AutoMate<span className="text-brand-400"> AI</span>
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-200'
                }`}
                title={item.label}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.id === 'agent' && (
                  <CircleDot className="ml-auto h-3 w-3 text-mint-400 animate-pulse" />
                )}
                {!collapsed && item.id === 'overview' && criticalRisks > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-xs font-bold text-white">
                    {criticalRisks}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <button
            onClick={onExit}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-200"
            title="Back to site"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Back to site</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-300"
          >
            <ChevronLeft className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold text-ink-900">
              {navItems.find((n) => n.id === page)?.label}
            </h1>
            <ConnectionPill />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-ink-100 px-3 py-2 sm:flex">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-40 bg-transparent text-sm text-ink-700 placeholder-ink-400 outline-none"
              />
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-ink-200 transition-colors hover:bg-ink-50">
              <Bell className="h-5 w-5 text-ink-500" />
              {criticalRisks > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-xs font-bold text-white">
                  {criticalRisks}
                </span>
              )}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              S
            </div>
          </div>
        </header>

        {/* Connection warning banner */}
        <ConnectionBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ---- Shared small components ----

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: typeof LayoutDashboard;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold text-ink-900">{value}</div>
      <div className="text-sm text-ink-500">{label}</div>
      {sublabel && <div className="mt-1 text-xs text-ink-400">{sublabel}</div>}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-coral-100 text-coral-700 ring-coral-200',
    high: 'bg-amber-100 text-amber-700 ring-amber-200',
    medium: 'bg-brand-100 text-brand-700 ring-brand-200',
    low: 'bg-ink-100 text-ink-600 ring-ink-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colors[priority] || colors.low}`}>
      {priority === 'critical' && <AlertTriangle className="h-3 w-3" />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    not_started: 'bg-ink-100 text-ink-600',
    in_progress: 'bg-brand-100 text-brand-700',
    review: 'bg-amber-100 text-amber-700',
    submitted: 'bg-mint-100 text-mint-700',
    graded: 'bg-mint-100 text-mint-700',
    processing: 'bg-amber-100 text-amber-700',
    analyzed: 'bg-mint-100 text-mint-700',
    failed: 'bg-coral-100 text-coral-700',
  };
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'In Review',
    submitted: 'Submitted',
    graded: 'Graded',
    processing: 'Processing',
    analyzed: 'Analyzed',
    failed: 'Failed',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.not_started}`}>
      {status === 'processing' && <CircleDot className="h-3 w-3 animate-pulse" />}
      {labels[status] || status}
    </span>
  );
}
