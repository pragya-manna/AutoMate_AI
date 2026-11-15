import { useEffect, useState } from 'react';
import {
  MemoryStick,
  Search,
  Sparkles,
  FileText,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import type { DashboardData, MemoryEntry } from '@/types';
import { fetchMemory, queryMemory } from '@/api';

type Props = {
  data: DashboardData;
};

export default function Memory({ data }: Props) {
  const [entries, setEntries] = useState<MemoryEntry[]>(data.memory);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    fetchMemory()
      .then((savedEntries) => {
        if (!cancelled) {
          setEntries(savedEntries);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load saved Memory history.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuery = async () => {
    const question = query.trim();
    if (!question || loading) return;

    setLoading(true);
    setError(null);

    try {
      const entry = await queryMemory(question);
      setEntries((prev) => [entry, ...prev]);
      setQuery('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Memory search failed. Check the backend and Gemini API key.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-mint-50 p-5 ring-1 ring-brand-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <MemoryStick className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">Academic Memory</h3>
            <p className="mt-0.5 text-sm text-ink-600">
              AutoMate AI remembers your subjects, assignments, notes, and conversations using pgvector semantic search.
              Ask any question about your academic life and get sourced answers — no hallucination.
            </p>
          </div>
        </div>
      </div>

      {/* Query box */}
      <div className="card p-4">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
            <Search className="h-5 w-5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask about your academic history... e.g. 'What did my professor say about the DBMS project?'"
              className="flex-1 bg-transparent text-sm text-ink-900 placeholder-ink-400 outline-none"
            />
          </div>
          <button
            onClick={handleQuery}
            disabled={!query.trim() || loading}
            className="flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Searching...' : 'Ask'}
          </button>
          {error && (
            <p className="text-sm text-coral-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Memory entries */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="card p-5">
            {/* Query */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                <Sparkles className="h-4 w-4 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">{entry.query}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Answer */}
            <div className="mt-4 rounded-xl bg-ink-50 p-4">
              <p className="text-sm leading-relaxed text-ink-700">{entry.answer}</p>
            </div>

            {/* Sources */}
            {entry.sources.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Sources</p>
                <div className="space-y-2">
                  {entry.sources.map((src, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-white p-3 ring-1 ring-ink-200">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                      <div>
                        <p className="text-xs font-semibold text-ink-700">{src.docName}</p>
                        <p className="mt-0.5 text-xs italic text-ink-500">"{src.snippet}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && (
          <div className="card p-8 text-center">
            <MemoryStick className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-2 text-sm text-ink-500">No memory entries yet. Ask a question above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
