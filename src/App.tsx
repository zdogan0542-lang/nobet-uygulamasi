import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import StaffManagement from '@/components/StaffManagement';
import SchedulePage from '@/components/SchedulePage';
import GroupManagement from '@/components/GroupManagement';
import SwapRequestsPage from '@/components/SwapRequestsPage';

export type PageId = 'dashboard' | 'staff' | 'schedule' | 'groups' | 'swaps';

function App() {
  const [page, setPage] = useState<PageId>('dashboard');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {page === 'dashboard' && <Dashboard />}
          {page === 'staff' && <StaffManagement />}
          {page === 'schedule' && <SchedulePage />}
          {page === 'groups' && <GroupManagement />}
          {page === 'swaps' && <SwapRequestsPage />}
        </main>
        <BottomNav activePage={page} onNavigate={setPage} />
      </div>
    </div>
  );
}

export default App;
