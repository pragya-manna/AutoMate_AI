import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, Server, X } from 'lucide-react';
import { isConnected, onConnectionChange, probeBackend } from '@/api';

export default function ConnectionBanner() {
  const [connected, setConnectedState] = useState<boolean | null>(isConnected());
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onConnectionChange((c) => setConnectedState(c));
    return unsub;
  }, []);

  // Don't show banner if connected or dismissed
  if (connected === true || dismissed) return null;

  const handleRetry = async () => {
    setChecking(true);
    await probeBackend();
    setChecking(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2.5 text-sm ring-1 ring-amber-200">
      <div className="flex items-center gap-2.5">
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-600" />
        )}
        <span className="font-medium text-amber-800">
          {checking
            ? 'Checking backend connection...'
            : 'Demo mode — showing sample data. Connect your FastAPI backend for real data.'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRetry}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Wifi className="h-3.5 w-3.5" />
          Retry connection
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ConnectionPill() {
  const [connected, setConnectedState] = useState<boolean | null>(isConnected());

  useEffect(() => {
    const unsub = onConnectionChange((c) => setConnectedState(c));
    return unsub;
  }, []);

  if (connected === null) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        connected
          ? 'bg-mint-100 text-mint-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {connected ? (
        <>
          <Server className="h-3 w-3" />
          Live API
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Demo Mode
        </>
      )}
    </span>
  );
}
