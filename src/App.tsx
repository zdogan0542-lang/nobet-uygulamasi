import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Dashboard from '@/components/Dashboard';
import StaffManagement from '@/components/StaffManagement';
import SchedulePage from '@/components/SchedulePage';
import GroupManagement from '@/components/GroupManagement';
import SwapRequestsPage from '@/components/SwapRequestsPage';

export type PageId = 'dashboard' | 'staff' | 'schedule' | 'groups' | 'swaps' | 'reports' | 'settings';

function App() {
  const [page, setPage] = useState<PageId>('dashboard');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {page === 'dashboard' && <Dashboard />}
        {page === 'staff' && <StaffManagement />}
        {page === 'schedule' && <SchedulePage />}
        {page === 'groups' && <GroupManagement />}
        {page === 'swaps' && <SwapRequestsPage />}
        {(page === 'reports' || page === 'settings') && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-400">Bu sayfa henüz hazır değil</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
