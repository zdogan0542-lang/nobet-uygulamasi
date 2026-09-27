import { UsersRound, Calendar, ArrowLeftRight } from 'lucide-react';
import type { PageId } from '@/App';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof UsersRound;
};

type BottomNavProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
};

const navItems: NavItem[] = [
  { id: 'groups', label: 'Gruplar', icon: UsersRound },
  { id: 'schedule', label: 'Nöbetlerim', icon: Calendar },
  { id: 'swaps', label: 'İstekler', icon: ArrowLeftRight },
];

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg shadow-gray-200/50">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -top-px w-8 h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
