import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Loader,
  TriangleAlert,
  Sun,
  Moon,
  Clock,
  Pencil,
  CalendarDays,
  LayoutGrid,
  Sparkles,
  Download,
  Printer,
} from 'lucide-react';
import { useScheduleData } from '@/hooks/useScheduleData';
import type { DutyInput } from '@/hooks/useScheduleData';
import type { DutyWithRelations, ShiftType } from '@/lib/supabase';
import DutyAssignModal from '@/components/DutyAssignModal';
import AutoGenerateModal from '@/components/AutoGenerateModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';
import { buildConflictMap, exportScheduleCSV, printSchedule, type Conflict } from '@/lib/scheduleRules';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const SHIFT_LABELS: Record<ShiftType, string> = {
  gunduz: 'Gündüz',
  gece: 'Gece',
  '24saat': '24 Saat',
};

const SHIFT_ICONS: Record<ShiftType, typeof Sun> = {
  gunduz: Sun,
  gece: Moon,
  '24saat': Clock,
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  active: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  upcoming: { label: 'Bekleyen', cls: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-500' },
  completed: { label: 'Tamamlandı', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  missed: { label: 'Boş', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const REASON_LABELS: Record<string, string> = {
  consecutive: 'Ardışık nöbet ihlali (24s dinlenme)',
  monthly_limit: 'Aylık nöbet limiti aşıldı',
  duplicate_same_day: 'Aynı gün çakışması',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type ViewMode = 'month' | 'week';

type ModalState = {
  open: boolean;
  editingDuty: DutyWithRelations | null;
  prefillDate: string | null;
  prefillShiftType: ShiftType | null;
  prefillDepartmentId: string | null;
};

export default function SchedulePage() {
  const { staff, departments, duties, loading, error, createDuty, updateDuty, deleteDuty, bulkCreateDuties } = useScheduleData();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState<ModalState>({
    open: false,
    editingDuty: null,
    prefillDate: null,
    prefillShiftType: null,
    prefillDepartmentId: null,
  });
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ id: String(Date.now()), type, message });
  }

  const roles = useMemo(() => {
    const set = new Set(staff.map((s) => s.title));
    return Array.from(set).sort();
  }, [staff]);

  // Build conflict map for all duties
  const conflictMap = useMemo(() => buildConflictMap(duties, staff), [duties, staff]);

  // Filter duties
  const filteredDuties = useMemo(() => {
    return duties.filter((d) => {
      if (deptFilter && d.department_id !== deptFilter) return false;
      if (roleFilter) {
        const dutyStaff = staff.find((s) => s.id === d.staff_id);
        if (!dutyStaff || dutyStaff.title !== roleFilter) return false;
      }
      return true;
    });
  }, [duties, deptFilter, roleFilter, staff]);

  // Group duties by date
  const dutiesByDate = useMemo(() => {
    const map = new Map<string, DutyWithRelations[]>();
    for (const d of filteredDuties) {
      if (!map.has(d.duty_date)) map.set(d.duty_date, []);
      map.get(d.duty_date)!.push(d);
    }
    return map;
  }, [filteredDuties]);

  // Calendar grid for month view
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, month, i), inMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
    return cells;
  }, [currentDate]);

  // Week grid
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return days;
  }, [currentDate]);

  const todayStr = dateToStr(new Date());

  function navigatePrev() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  }

  function navigateNext() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  }

  function navigateToday() {
    setCurrentDate(new Date());
  }

  function handleSlotClick(date: string, shiftType: ShiftType, departmentId: string | null) {
    setModal({
      open: true,
      editingDuty: null,
      prefillDate: date,
      prefillShiftType: shiftType,
      prefillDepartmentId: departmentId,
    });
  }

  function handleDutyClick(duty: DutyWithRelations) {
    setModal({
      open: true,
      editingDuty: duty,
      prefillDate: null,
      prefillShiftType: null,
      prefillDepartmentId: null,
    });
  }

  async function handleSubmit(input: DutyInput): Promise<{ error: string | null }> {
    if (modal.editingDuty) {
      const result = await updateDuty(modal.editingDuty.id, input);
      if (result.error) {
        showToast('error', 'Güncelleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Nöbet güncellendi');
      }
      return result;
    } else {
      const result = await createDuty(input);
      if (result.error) {
        showToast('error', 'Atama başarısız: ' + result.error);
      } else {
        showToast('success', 'Nöbet atandı');
      }
      return result;
    }
  }

  async function handleDelete(id: string): Promise<{ error: string | null }> {
    const result = await deleteDuty(id);
    if (result.error) {
      showToast('error', 'Silme başarısız: ' + result.error);
    } else {
      showToast('success', 'Nöbet silindi');
    }
    return result;
  }

  async function handleAutoGenerate(duties: DutyInput[]): Promise<{ error: string | null; count: number }> {
    const result = await bulkCreateDuties(duties);
    if (result.error) {
      showToast('error', 'Otomatik oluşturma başarısız: ' + result.error);
    } else {
      showToast('success', `${result.count} nöbet otomatik atandı`);
    }
    return result;
  }

  function handleExportCSV() {
    setExportMenuOpen(false);
    const monthDuties = filteredDuties.filter((d) => {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      return d.duty_date.slice(0, 7) === monthStr;
    });
    if (monthDuties.length === 0) {
      showToast('error', 'Bu ay için dışa aktarılacak nöbet bulunmuyor');
      return;
    }
    exportScheduleCSV(monthDuties, TR_MONTHS[currentDate.getMonth()], currentDate.getFullYear());
    showToast('success', 'CSV dosyası indirildi');
  }

  function handlePrint() {
    setExportMenuOpen(false);
    printSchedule();
  }

  // Stats
  const stats = useMemo(() => {
    const active = filteredDuties.filter((d) => d.status === 'active').length;
    const upcoming = filteredDuties.filter((d) => d.status === 'upcoming').length;
    const missed = filteredDuties.filter((d) => d.status === 'missed').length;
    const completed = filteredDuties.filter((d) => d.status === 'completed').length;
    return { active, upcoming, missed, completed, total: filteredDuties.length };
  }, [filteredDuties]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Çizelge yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <TriangleAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-gray-900">Veriler yüklenemedi</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const headerLabel = viewMode === 'month'
    ? `${TR_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${weekDays[0].getDate()} ${TR_MONTHS[weekDays[0].getMonth()]} — ${weekDays[6].getDate()} ${TR_MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

  // Render conflict tooltip content for a duty
  function renderConflictTooltip(dutyId: string): React.ReactNode {
    const conflicts = conflictMap.get(dutyId);
    if (!conflicts || conflicts.length === 0) return null;
    return (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 hidden group-hover:block animate-fade-in">
        <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 max-w-[220px]">
          {conflicts.map((c: Conflict, i: number) => (
            <div key={i} className={i > 0 ? 'mt-1.5 pt-1.5 border-t border-gray-700' : ''}>
              <p className="font-semibold flex items-center gap-1">
                <TriangleAlert className={`w-3 h-3 ${c.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                {REASON_LABELS[c.reason] ?? 'Kural İhlali'}
              </p>
              <p className="text-gray-300 mt-0.5">{c.message}</p>
            </div>
          ))}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nöbet Çizelgesi</h1>
            <p className="mt-1 text-sm text-gray-500">
              Toplam {stats.total} nöbet · {stats.active} aktif · {stats.upcoming} bekleyen · {stats.missed} boş
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoGenOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-semibold hover:from-brand-700 hover:to-brand-800 transition-all hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Otomatik Oluştur
            </button>
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-30 animate-fade-in-up">
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                      CSV / Excel
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-gray-400" />
                      PDF / Yazdır
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setModal({ open: true, editingDuty: null, prefillDate: todayStr, prefillShiftType: 'gunduz', prefillDepartmentId: deptFilter || null })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Nöbet Ata
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'month' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Aylık
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'week' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Haftalık
              </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button onClick={navigatePrev} className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-gray-900 min-w-[180px] text-center">{headerLabel}</span>
              <button onClick={navigateNext} className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={navigateToday} className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors">
                Bugün
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 lg:ml-auto">
              <div className="relative flex-1 lg:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[150px]"
                >
                  <option value="">Tüm Bölümler</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 lg:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[150px]"
                >
                  <option value="">Tüm Görevler</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-medium text-gray-600">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <TriangleAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-gray-600">Kural ihlali (üzerine gelin)</span>
            </div>
          </div>
        </div>

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {TR_DAYS_SHORT.map((day, i) => (
                <div key={day} className={`px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-rose-400' : 'text-gray-500'}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGrid.map((cell, i) => {
                const dateStr = dateToStr(cell.date);
                const dayDuties = dutiesByDate.get(dateStr) ?? [];
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={i}
                    className={`min-h-[110px] border-r border-b border-gray-50 p-1.5 ${
                      cell.inMonth ? 'bg-white' : 'bg-gray-50/50'
                    } ${isToday ? 'ring-2 ring-inset ring-brand-400' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${
                        !cell.inMonth ? 'text-gray-300'
                        : isToday ? 'text-brand-600'
                        : cell.date.getDay() === 0 || cell.date.getDay() === 6 ? 'text-rose-400'
                        : 'text-gray-700'
                      }`}>
                        {cell.date.getDate()}
                      </span>
                      {dayDuties.length > 0 && (
                        <span className="text-[10px] font-medium text-gray-400">{dayDuties.length}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayDuties.slice(0, 4).map((duty) => {
                        const statusCfg = STATUS_CONFIG[duty.status] ?? STATUS_CONFIG.upcoming;
                        const ShiftIcon = SHIFT_ICONS[duty.shift_type];
                        const conflicts = conflictMap.get(duty.id);
                        const hasConflict = conflicts && conflicts.length > 0;
                        return (
                          <div key={duty.id} className="group relative">
                            {renderConflictTooltip(duty.id)}
                            <button
                              onClick={() => handleDutyClick(duty)}
                              className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium border ${statusCfg.cls} hover:shadow-sm transition-all text-left`}
                            >
                              <ShiftIcon className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate flex-1">
                                {duty.staff ? getInitials(duty.staff.full_name) : 'Boş'}
                              </span>
                              {hasConflict && <TriangleAlert className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                            </button>
                          </div>
                        );
                      })}
                      {dayDuties.length > 4 && (
                        <p className="text-[10px] text-gray-400 px-1">+{dayDuties.length - 4} daha</p>
                      )}
                      {dayDuties.length === 0 && cell.inMonth && (
                        <button
                          onClick={() => handleSlotClick(dateStr, 'gunduz', deptFilter || null)}
                          className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10px] text-gray-300 hover:text-brand-500 hover:bg-brand-50 transition-colors border border-dashed border-gray-200 hover:border-brand-300"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          Ekle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {weekDays.map((day, i) => {
                const dateStr = dateToStr(day);
                const isToday = dateStr === todayStr;
                const dayDuties = dutiesByDate.get(dateStr) ?? [];
                return (
                  <div key={i} className={`px-3 py-3 border-r border-gray-50 ${isToday ? 'bg-brand-50/50' : ''}`}>
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase ${i === 0 || i === 6 ? 'text-rose-400' : 'text-gray-500'}`}>
                          {TR_DAYS_SHORT[i]}
                        </p>
                        <p className={`text-lg font-bold ${isToday ? 'text-brand-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSlotClick(dateStr, 'gunduz', deptFilter || null)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{dayDuties.length} nöbet</p>
                  </div>
                );
              })}
            </div>
            {/* Shift rows */}
            <div className="divide-y divide-gray-50">
              {(['gunduz', 'gece', '24saat'] as ShiftType[]).map((shiftType) => {
                const ShiftIcon = SHIFT_ICONS[shiftType];
                return (
                  <div key={shiftType} className="grid grid-cols-7">
                    {weekDays.map((day, dayIdx) => {
                      const dateStr = dateToStr(day);
                      const dayDuties = dutiesByDate.get(dateStr) ?? [];
                      const shiftDuties = dayDuties.filter((d) => d.shift_type === shiftType);
                      return (
                        <div key={dayIdx} className="min-h-[100px] p-2 border-r border-gray-50 space-y-1.5">
                          {shiftDuties.length === 0 ? (
                            <button
                              onClick={() => handleSlotClick(dateStr, shiftType, deptFilter || null)}
                              className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 text-gray-300 hover:text-brand-500 hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                            >
                              <ShiftIcon className="w-4 h-4" />
                              <span className="text-[10px] font-medium">{SHIFT_LABELS[shiftType]}</span>
                              <Plus className="w-3 h-3" />
                            </button>
                          ) : (
                            shiftDuties.map((duty) => {
                              const statusCfg = STATUS_CONFIG[duty.status] ?? STATUS_CONFIG.upcoming;
                              const conflicts = conflictMap.get(duty.id);
                              const hasConflict = conflicts && conflicts.length > 0;
                              return (
                                <div key={duty.id} className="group relative">
                                  {renderConflictTooltip(duty.id)}
                                  <button
                                    onClick={() => handleDutyClick(duty)}
                                    className={`w-full text-left p-2 rounded-lg border ${statusCfg.cls} hover:shadow-md transition-all`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        <ShiftIcon className="w-3 h-3" />
                                        <span className="text-[10px] font-semibold">{SHIFT_LABELS[duty.shift_type]}</span>
                                      </div>
                                      {hasConflict && <TriangleAlert className="w-3 h-3 text-amber-500" />}
                                    </div>
                                    {duty.staff ? (
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-[8px] font-bold shrink-0">
                                          {getInitials(duty.staff.full_name)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-semibold text-gray-900 truncate">{duty.staff.full_name}</p>
                                          <p className="text-[9px] text-gray-400 truncate">{duty.staff.title}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] font-medium text-rose-600">Atama Bekliyor</p>
                                    )}
                                    {duty.departments && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: duty.departments.color }} />
                                        <span className="text-[9px] text-gray-500 truncate">{duty.departments.name}</span>
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick add hint */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Pencil className="w-3.5 h-3.5" />
          <span>Boş bir slota tıklayarak nöbet atayın, dolu bir slota tıklayarak düzenleyin veya silin. Kural ihlali simgesinin üzerine gelerek detayları görün.</span>
        </div>
      </div>

      <DutyAssignModal
        open={modal.open}
        onClose={() => setModal({ open: false, editingDuty: null, prefillDate: null, prefillShiftType: null, prefillDepartmentId: null })}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        editingDuty={modal.editingDuty}
        prefillDate={modal.prefillDate}
        prefillShiftType={modal.prefillShiftType}
        prefillDepartmentId={modal.prefillDepartmentId}
        staff={staff}
        departments={departments}
        duties={duties}
      />

      <AutoGenerateModal
        open={autoGenOpen}
        onClose={() => setAutoGenOpen(false)}
        onGenerate={handleAutoGenerate}
        staff={staff}
        departments={departments}
        duties={duties}
        year={currentDate.getFullYear()}
        month={currentDate.getMonth()}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
