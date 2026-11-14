import { useState, useEffect } from 'react';
import Landing from '@/components/Landing';
import DashboardLayout from '@/components/DashboardLayout';
import Overview from '@/components/pages/Overview';
import Documents from '@/components/pages/Documents';
import Agent from '@/components/pages/Agent';
import Assignments from '@/components/pages/Assignments';
import Memory from '@/components/pages/Memory';
import Integrations from '@/components/pages/Integrations';
import Settings from '@/components/pages/Settings';
import { mockDashboardData, probeBackend } from '@/api';
import { useDashboard } from '@/hooks';
import type { View, DashboardPage } from '@/types';

function App() {
  const [view, setView] = useState<View>('landing');
  const [page, setPage] = useState<DashboardPage>('overview');

  // Probe backend on startup
  useEffect(() => {
    probeBackend();
  }, []);

  // When in app view, try to fetch real dashboard data
  const { data: realData, usingMock } = useDashboard();
  const data = view === 'app' && !usingMock ? realData : mockDashboardData;

  if (view === 'landing') {
    return <Landing onLaunch={() => setView('app')} />;
  }

  return (
    <DashboardLayout
      page={page}
      setPage={setPage}
      onExit={() => setView('landing')}
      data={data}
    >
      {page === 'overview' && <Overview data={data} setPage={setPage} />}
      {page === 'documents' && <Documents data={data} />}
      {page === 'agent' && <Agent data={data} />}
      {page === 'assignments' && <Assignments data={data} />}
      {page === 'memory' && <Memory data={data} />}
      {page === 'integrations' && <Integrations data={data} />}
      {page === 'settings' && <Settings />}
    </DashboardLayout>
  );
}

export default App;
