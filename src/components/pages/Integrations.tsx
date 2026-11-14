import {
  Plug,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  MessageSquare,
  Database,
  Cloud,
  Clock,
  Link2,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import type { DashboardData, Integration } from '@/types';

type Props = {
  data: DashboardData;
};

const providerIcons: Record<string, typeof Plug> = {
  google_classroom: FileText,
  microsoft_teams: MessageSquare,
  google_calendar: Calendar,
  google_drive: Cloud,
  notion: Database,
  slack: MessageSquare,
};

const providerColors: Record<string, string> = {
  google_classroom: 'bg-brand-100 text-brand-600',
  microsoft_teams: 'bg-brand-100 text-brand-600',
  google_calendar: 'bg-coral-100 text-coral-600',
  google_drive: 'bg-amber-100 text-amber-600',
  notion: 'bg-ink-100 text-ink-600',
  slack: 'bg-mint-100 text-mint-600',
};

export default function Integrations({ data }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>(data.integrations);
  const [connecting, setConnecting] = useState<string | null>(null);

  const toggle = (provider: string) => {
    setConnecting(provider);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.provider === provider
            ? {
                ...i,
                connected: !i.connected,
                lastSync: !i.connected ? new Date().toISOString() : i.lastSync,
              }
            : i
        )
      );
      setConnecting(null);
    }, 1500);
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl bg-ink-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-white">Connected Services</h3>
            <p className="text-sm text-ink-400">
              {connectedCount} of {integrations.length} services connected
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15">
            <Plug className="h-6 w-6 text-brand-400" />
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = providerIcons[integration.provider] || Plug;
          const color = providerColors[integration.provider] || 'bg-ink-100 text-ink-600';
          const isConnecting = connecting === integration.provider;

          return (
            <div key={integration.provider} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink-900">{integration.label}</h4>
                    {integration.connected ? (
                      <div className="flex items-center gap-1 text-xs text-mint-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Connected
                        {integration.lastSync && (
                          <span className="text-ink-400">
                            {' · '}Synced {new Date(integration.lastSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-ink-400">
                        <XCircle className="h-3.5 w-3.5" />
                        Not connected
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {integration.scopes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {integration.scopes.map((scope) => (
                    <span key={scope} className="rounded-md bg-ink-100 px-2 py-0.5 text-xs text-ink-500">
                      {scope}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggle(integration.provider)}
                disabled={isConnecting}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  integration.connected
                    ? 'bg-ink-100 text-ink-600 hover:bg-coral-50 hover:text-coral-600'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                } disabled:opacity-50`}
              >
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                ) : integration.connected ? (
                  <>Disconnect</>
                ) : (
                  <><Link2 className="h-4 w-4" /> Connect</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* API connection note */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
          <div>
            <h4 className="text-sm font-semibold text-ink-900">Local Backend Connection</h4>
            <p className="mt-1 text-sm text-ink-600">
              Integrations connect through your own FastAPI backend, not through Bolt.
              Configure your API URLs and credentials in the Settings tab to establish the connection.
            </p>
            <p className="mt-2 text-xs text-ink-400">
              Your OAuth credentials (Google Client ID, Microsoft Tenant ID) are stored locally in your browser
              and sent only to your backend server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
