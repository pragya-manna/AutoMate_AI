import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboard,
  fetchDocuments,
  fetchAssignments,
  fetchMemory,
  fetchIntegrations,
  isConnected,
  onConnectionChange,
  probeBackend,
  mockDashboardData,
} from '@/api';
import type {
  DashboardData,
  UploadedDocument,
  Assignment,
  MemoryEntry,
  Integration,
} from '@/types';

// Generic hook: tries real API, falls back to mock data
function useApiData<T>(
  fetcher: () => Promise<T>,
  mockData: T,
  deps: unknown[] = []
): { data: T; loading: boolean; error: string | null; usingMock: boolean; refetch: () => void } {
  const [data, setData] = useState<T>(mockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setUsingMock(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(mockData);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  // Listen for connection changes and refetch when backend comes online
  useEffect(() => {
    const unsub = onConnectionChange((connected) => {
      if (connected) load();
    });
    return unsub;
  }, [load]);

  return { data, loading, error, usingMock, refetch: load };
}

export function useDashboard() {
  return useApiData(fetchDashboard, mockDashboardData);
}

export function useDocuments() {
  return useApiData(fetchDocuments, mockDashboardData.documents);
}

export function useAssignments() {
  return useApiData(fetchAssignments, mockDashboardData.assignments);
}

export function useMemory() {
  return useApiData(fetchMemory, mockDashboardData.memory);
}

export function useIntegrations() {
  return useApiData(fetchIntegrations, mockDashboardData.integrations);
}

export function useConnectionStatus() {
  const [connected, setConnectedState] = useState(isConnected());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    probeBackend().then(() => setChecked(true));
    const unsub = onConnectionChange((c) => setConnectedState(c));
    return unsub;
  }, []);

  return { connected, checked };
}
