import { useMemo } from 'react';
import { CalendarCheck, Users, Clock, Activity, TrendingUp, TrendingDown, ArrowUpRight, Calendar, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, Loader as Loader2, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DutyGroup, DutyWithRelations } from '@/lib/supabase';

const statusConfig = {
  active: { label: 'Devam Ediyor', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
  upcoming: { label: 'Planlandı', icon: AlertCircle, cls: 'bg-brand-50 text-brand-700' },
  missed: { label: 'Boş', icon: XCircle, cls: 'bg-rose-50 text-rose-700' },
  completed: { label: 'Tamamlandı', icon: CheckCircle2, cls: 'bg-gray-100 text-gray-600' },
} as const;

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

function formatTimeRange(start: string, end: string): string {
  const fmt = (t: string) => t.slice(0, 5);
  return `${fmt(start)} - ${fmt(end)}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Dashboard() {
  const { staff, dutyGroups, duties, loading, error } = useDashboardData();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const thisWeekDuties = duties.filter(
      (d) => d.duty_date >= today && d.duty_date <= weekEndStr
    );
    const activeStaff = staff.filter((s) => s.active);
    const pendingDuties = duties.filter((d) => d.status === 'upcoming');
    const filledDuties = thisWeekDuties.filter((d) => d.status !== 'missed');
    const occupancyRate =
      thisWeekDuties.length > 0
        ? Math.round((filledDuties.length / thisWeekDuties.length) * 100)
        : 0;

    return [
      {
        label: 'Bu Haftaki Nöbetler',
        value: String(thisWeekDuties.length),
        change: '+12%',
        trend: 'up' as const,
        icon: CalendarCheck,
        color: 'text-brand-600',
        bgColor: 'bg-brand-50',
      },
      {
        label: 'Aktif Personel',
        value: String(activeStaff.length),
        change: '+3',
        trend: 'up' as const,
        icon: Users,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        label: 'Bekleyen Nöbetler',
        value: String(pendingDuties.length),
        change: '-2',
        trend: 'down' as const,
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
      {
        label: 'Doluluk Oranı',
        value: `${occupancyRate}%`,
        change: '+5%',
        trend: 'up' as const,
        icon: Activity,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      },
    ];
  }, [staff, duties]);

  const upcomingDuties = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return duties
      .filter((d) => d.duty_date >= today && d.status !== 'completed')
      .slice(0, 8);
  }, [duties]);

  const groupBreakdown = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const counts = dutyGroups.map((grp) => {
      const count = duties.filter(
        (d) =>
          d.duty_group_id === grp.id &&
          d.duty_date >= today &&
          d.duty_date <= weekEndStr
      ).length;
      return { grp: grp.name, count, color: grp.color };
    });

    const maxCount = Math.max(...counts.map((c) => c.count), 1);
    return counts
      .map((c) => ({ ...c, pct: Math.round((c.count / maxCount) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [dutyGroups, duties]);

  const groupStaffCounts = useMemo(() => {
    return dutyGroups.map((grp) => ({
      id: grp.id,
      name: grp.name,
      color: grp.color,
      maxDuties: grp.max_duties_per_month,
      minRest: grp.min_rest_hours,
      staffCount: staff.filter((s) => s.duty_group_id === grp.id && s.active).length,
    }));
  }, [dutyGroups, staff]);

  const totalThisWeek = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const weekDuties = duties.filter(
      (d) => d.duty_date >= today && d.duty_date <= weekEndStr
    );
    const filled = weekDuties.filter((d) => d.status !== 'missed').length;
    return { total: weekDuties.length, filled };
  }, [duties]);

  const today = new Date();
  const todayStr = `${today.getDate()} Eylül ${today.getFullYear()}, ${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][today.getDay()]}`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-gray-900">Veriler yüklenemedi</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

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
                {todayStr}
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

        {/* Duty Group Overview Cards */}
        {groupStaffCounts.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Nöbet Grupları</h2>
                <p className="text-sm text-gray-400">Aktif gruplar ve personel durumu</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupStaffCounts.map((grp, i) => (
                <div
                  key={grp.id}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: grp.color + '20' }}
                    >
                      <Users className="w-5 h-5" style={{ color: grp.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{grp.name}</p>
                      <p className="text-xs text-gray-400">Nöbet Grubu</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-gray-600">{grp.staffCount} personel</span>
                    </div>
                    <span className="text-xs text-gray-400">Maks. {grp.maxDuties}/ay</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming duties */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Yaklaşan Nöbetler</h2>
                <p className="text-sm text-gray-400">Sonraki 7 günün nöbet planı</p>
              </div>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                Tümünü Gör
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingDuties.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-400">Yaklaşan nöbet bulunmuyor</p>
                </div>
              ) : (
                upcomingDuties.map((duty: DutyWithRelations, i) => {
                  const cfg = statusConfig[duty.status] ?? statusConfig.upcoming;
                  const StatusIcon = cfg.icon;
                  const staffName = duty.staff?.full_name ?? 'Atanmamış';
                  return (
                    <div
                      key={duty.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors animate-fade-in opacity-0"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                        {getInitials(staffName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{staffName}</p>
                        <p className="text-xs text-gray-400">
                          {duty.duty_groups?.name ?? '—'} · {formatTimeRange(duty.start_time, duty.end_time)}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500 hidden sm:block">{formatDate(duty.duty_date)}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Group breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900">Grup Dağılımı</h2>
            <p className="text-sm text-gray-400 mb-5">Bu haftaki nöbet sayısı</p>
            <div className="space-y-4">
              {groupBreakdown.map((row, i) => (
                <div key={row.grp} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{row.grp}</span>
                    <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Toplam Nöbet</span>
                <span className="text-lg font-bold text-gray-900">{totalThisWeek.total}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">Dolu Pozisyon</span>
                <span className="text-lg font-bold text-emerald-600">
                  {totalThisWeek.filled}
                  <span className="text-sm font-normal text-gray-400"> / {totalThisWeek.total}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
