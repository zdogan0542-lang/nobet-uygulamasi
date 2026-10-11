import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Layers, 
  ArrowLeftRight 
} from 'lucide-react';
import { PageId } from '../App';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems = [
  { id: 'dashboard' as PageId, label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'schedule' as PageId, label: 'Nöbet Çizelgesi', icon: CalendarDays },
  { id: 'staff' as PageId, label: 'Personel', icon: Users },
  { id: 'groups' as PageId, label: 'Nöbet Grupları', icon: Layers },
  { id: 'swaps' as PageId, label: 'Değişim Talepleri', icon: ArrowLeftRight },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
          N
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-tight leading-tight">Nöbet Sistemi</h1>
          <p className="text-xs text-slate-400">Yönetim & Takip</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text
