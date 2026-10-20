import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FolderTree,
  Repeat2,
  ClipboardList,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "schedule"
  | "staff"
  | "groups"
  | "swaps";

interface Props {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
}

const ITEMS: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { key: "schedule", label: "Nöbet Çizelgesi", icon: CalendarDays },
  { key: "staff", label: "Personel", icon: Users },
  { key: "groups", label: "Nöbet Grupları", icon: FolderTree },
  { key: "swaps", label: "Değişim Talepleri", icon: Repeat2 },
];

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-300 md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Nöbetçi</p>
          <p className="text-[0.65rem] text-slate-500">Nöbet Yönetim Sistemi</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/15 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-[1.15rem] w-[1.15rem] ${
                  isActive ? "text-blue-400" : "text-slate-500"
                }`}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5">
        <div className="rounded-xl bg-slate-800/60 p-3.5">
          <p className="text-[0.7rem] font-semibold text-slate-400">Sürüm 1.0</p>
          <p className="mt-0.5 text-[0.7rem] text-slate-600">
            © 2026 Nöbetçi
          </p>
        </div>
      </div>
    </aside>
  );
}
