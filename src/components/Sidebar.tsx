import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileBarChart,
  Settings,
  ShieldPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PageId } from '@/App';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

type SidebarProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
};

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPending() {
      const { count, error } = await supabase
        .from('duties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'missed');
      if (!error && count !== null) {
        setPendingCount(count);
      }
    }
    fetchPending();
  }, []);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'schedule', label: 'Nöbet Çizelgesi', icon: Calendar, badge: pendingCount > 0 ? String(pendingCount) : undefined },
    { id: 'staff', label: 'Personel', icon: Users },
    { id: 'reports', label: 'Raporlar', icon: FileBarChart },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/20">
          <ShieldPlus className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Nöbet Takip</p>
            <p className="text-xs text-gray-400">Sistemi</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 animate-slide-in ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              {!collapsed && (
                <span className="flex-1 text-left animate-fade-in">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 animate-fade-in">
                  {item.badge}
                </span>
              )}
              {isActive && !collapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse-ring" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 shrink-0" />
          )}
          {!collapsed && <span className="animate-fade-in">Daralt</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="animate-fade-in">Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
