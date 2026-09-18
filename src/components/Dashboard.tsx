import {
  CalendarCheck,
  Users,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type Stat = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: typeof CalendarCheck;
  color: string;
  bgColor: string;
};

const stats: Stat[] = [
  {
    label: 'Bu Haftaki Nöbetler',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: CalendarCheck,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
  },
  {
    label: 'Aktif Personel',
    value: '38',
    change: '+3',
    trend: 'up',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    label: 'Bekleyen Nöbetler',
    value: '6',
    change: '-2',
    trend: 'down',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    label: 'Doluluk Oranı',
    value: '87%',
    change: '+5%',
    trend: 'up',
    icon: Activity,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
];

type Duty = {
  staff: string;
  department: string;
  date: string;
  time: string;
  status: 'active' | 'upcoming' | 'missed';
};

const duties: Duty[] = [
  { staff: 'Dr. Mehmet Kaya', department: 'Acil', date: '18 Eyl', time: '08:00 - 20:00', status: 'active' },
  { staff: 'Hm. Fatma Demir', department: 'Yoğun Bakım', date: '18 Eyl', time: '20:00 - 08:00', status: 'upcoming' },
  { staff: 'Dr. Can Öztürk', department: 'Cerrahi', date: '19 Eyl', time: '08:00 - 20:00', status: 'upcoming' },
  { staff: 'Hm. Elif Şahin', department: 'Dahiliye', date: '19 Eyl', time: '20:00 - 08:00', status: 'upcoming' },
  { staff: 'Dr. Burak Aydın', department: 'Acil', date: '20 Eyl', time: '08:00 - 20:00', status: 'missed' },
];

const statusConfig = {
  active: { label: 'Devam Ediyor', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
  upcoming: { label: 'Planlandı', icon: AlertCircle, cls: 'bg-brand-50 text-brand-700' },
  missed: { label: 'Boş', icon: XCircle, cls: 'bg-rose-50 text-rose-700' },
};

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Hero */}
        <div className="animate-fade-in-up">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-8 py-10 shadow-xl shadow-brand-900/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5" />
                18 Eylül 2026, Cuma
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Nöbet Takip Sistemi
              </h1>
              <p className="mt-2 text-brand-100 text-base sm:text-lg max-w-xl">
                Hastane nöbet çizelgelerinizi tek panelden yönetin. Personel atamaları,
                değiş talepleri ve raporlar artık parmaklarınızın ucunda.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-brand-700 text-sm font-semibold hover:bg-brand-50 transition-all hover:shadow-lg hover:-translate-y-0.5">
                  Yeni Nöbet Ekle
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20">
                  Çizelgeyi Görüntüle
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <div
                key={stat.label}
                className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold ${
                      stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    <TrendIcon className="w-3.5 h-3.5" />
                    {stat.change}
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming duties */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Yaklaşan Nöbetler</h2>
                <p className="text-sm text-gray-400">Sonraki 5 günün nöbet planı</p>
              </div>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                Tümünü Gör
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {duties.map((duty, i) => {
                const cfg = statusConfig[duty.status];
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors animate-fade-in opacity-0"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                      {duty.staff.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{duty.staff}</p>
                      <p className="text-xs text-gray-400">{duty.department} · {duty.time}</p>
                    </div>
                    <span className="text-sm text-gray-500 hidden sm:block">{duty.date}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900">Bölüm Dağılımı</h2>
            <p className="text-sm text-gray-400 mb-5">Bu haftaki nöbet sayısı</p>
            <div className="space-y-4">
              {[
                { dept: 'Acil', count: 8, pct: 80, color: 'bg-brand-500' },
                { dept: 'Yoğun Bakım', count: 6, pct: 60, color: 'bg-emerald-500' },
                { dept: 'Cerrahi', count: 5, pct: 50, color: 'bg-amber-500' },
                { dept: 'Dahiliye', count: 5, pct: 50, color: 'bg-rose-500' },
              ].map((row, i) => (
                <div key={row.dept} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{row.dept}</span>
                    <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all duration-700`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Toplam Nöbet</span>
                <span className="text-lg font-bold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">Dolu Pozisyon</span>
                <span className="text-lg font-bold text-emerald-600">21<span className="text-sm font-normal text-gray-400"> / 24</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
