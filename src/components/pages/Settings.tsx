import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Check,
  Server,
  Key,
  Globe,
  Database,
  Loader2,
  Plug,
  Info,
  ExternalLink,
} from 'lucide-react';
import { getApiConfig, saveApiConfig, checkHealth } from '@/api';
import type { ApiConfig } from '@/types';

export default function Settings() {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const update = (key: keyof ApiConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveApiConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setHealthStatus('idle');
    try {
      saveApiConfig(config);
      const result = await checkHealth();
      if (result.status === 'ok') {
        setHealthStatus('ok');
      } else {
        setHealthStatus('fail');
      }
    } catch {
      setHealthStatus('fail');
    }
    setTesting(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Backend connection */}
      <Section icon={Server} title="Backend Connection" desc="Connect to your local Python + FastAPI server.">
        <Field
          label="API Base URL"
          value={config.baseUrl}
          onChange={(v) => update('baseUrl', v)}
          placeholder="http://localhost:8000"
        />
        <Field
          label="FastAPI URL"
          value={config.fastApiUrl}
          onChange={(v) => update('fastApiUrl', v)}
          placeholder="http://localhost:8000"
        />
        <Field
          label="PostgreSQL / pgvector URL"
          value={config.pgVectorUrl}
          onChange={(v) => update('pgVectorUrl', v)}
          placeholder="postgresql://localhost:5432/automate"
        />

        {/* Health check */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            Test Connection
          </button>
          {healthStatus === 'ok' && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-mint-600">
              <Check className="h-4 w-4" /> Backend reachable
            </span>
          )}
          {healthStatus === 'fail' && (
            <span className="text-sm text-coral-600">
              Cannot reach backend. Make sure your FastAPI server is running at {config.baseUrl}
            </span>
          )}
        </div>
      </Section>

      {/* Gemini API */}
      <Section icon={Key} title="Google Gemini API" desc="Provide your Gemini API key for AI-powered features. This is sent as x-gemini-key header to your backend.">
        <Field
          label="Gemini API Key"
          value={config.geminiApiKey}
          onChange={(v) => update('geminiApiKey', v)}
          placeholder="AIza..."
          type="password"
        />
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Get your Gemini API key <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Section>

      {/* Google OAuth */}
      <Section icon={Globe} title="Google OAuth Credentials" desc="For Google Classroom, Calendar, and Drive integrations. Configure these in the Google Cloud Console.">
        <Field
          label="Google Client ID"
          value={config.googleClientId}
          onChange={(v) => update('googleClientId', v)}
          placeholder="xxxx.apps.googleusercontent.com"
        />
        <Field
          label="Google Client Secret"
          value={config.googleClientSecret}
          onChange={(v) => update('googleClientSecret', v)}
          placeholder="GOCSPX-xxxx"
          type="password"
        />
        <Field
          label="Google Redirect URI"
          value={config.googleRedirectUri}
          onChange={(v) => update('googleRedirectUri', v)}
          placeholder="http://localhost:8000/auth/google/callback"
        />
      </Section>

      {/* Microsoft OAuth */}
      <Section icon={Globe} title="Microsoft OAuth Credentials" desc="For Microsoft Teams integration. Configure these in the Azure Portal.">
        <Field
          label="Microsoft Client ID"
          value={config.microsoftClientId}
          onChange={(v) => update('microsoftClientId', v)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Field
          label="Microsoft Tenant ID"
          value={config.microsoftTenantId}
          onChange={(v) => update('microsoftTenantId', v)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Field
          label="Microsoft Client Secret"
          value={config.microsoftClientSecret}
          onChange={(v) => update('microsoftClientSecret', v)}
          placeholder="xxxx"
          type="password"
        />
      </Section>

      {/* Info box */}
      <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-200">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <h4 className="text-sm font-semibold text-ink-900">How connections work</h4>
            <p className="mt-1 text-sm text-ink-600">
              All credentials are stored locally in your browser's localStorage and are only sent to your own backend server.
              AutoMate AI does not proxy through Bolt — you connect directly to your local FastAPI instance.
              Implement the expected API endpoints listed in the source code (<code className="rounded bg-brand-100 px-1.5 py-0.5 text-xs">src/api.ts</code>) on your backend.
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-ink-200">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-mint-600">
            <Check className="h-4 w-4" /> Settings saved
          </span>
        )}
        <button onClick={handleSave} className="btn-primary">
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof SettingsIcon;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100">
          <Icon className="h-5 w-5 text-ink-600" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
          <p className="text-sm text-ink-500">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-0 bg-ink-50 px-4 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none ring-1 ring-inset ring-ink-200 transition-all focus:ring-2 focus:ring-brand-400"
      />
    </div>
  );
}
