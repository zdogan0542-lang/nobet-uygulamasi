import { useEffect, useMemo, useState } from 'react';
import { X, User, Building2, Clock, TriangleAlert, Trash2, CalendarDays, CircleCheck } from 'lucide-react';
import type { Department, DutyWithRelations, ShiftType, Staff } from '@/lib/supabase';
import type { DutyInput } from '@/hooks/useScheduleData';
import { validateDuty, type Conflict } from '@/lib/scheduleRules';

export type DutyAssignModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DutyInput) => Promise<{ error: string | null }>;
  onDelete?: (id: string) => Promise<{ error: string | null }>;
  editingDuty: DutyWithRelations | null;
  prefillDate: string | null;
  prefillShiftType: ShiftType | null;
  prefillDepartmentId: string | null;
  staff: Staff[];
  departments: Department[];
  duties: DutyWithRelations[];
};

const SHIFT_TYPES: { value: ShiftType; label: string; time: string }[] = [
  { value: 'gunduz', label: 'Gündüz', time: '08:00 - 20:00' },
  { value: 'gece', label: 'Gece', time: '20:00 - 08:00' },
  { value: '24saat', label: '24 Saat', time: '08:00 - 08:00' },
];

const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  gunduz: { start: '08:00', end: '20:00' },
  gece: { start: '20:00', end: '08:00' },
  '24saat': { start: '08:00', end: '08:00' },
};

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${TR_DAYS[d.getDay()]}`;
}

const REASON_LABELS: Record<string, string> = {
  consecutive: 'Ardışık Nöbet İhlali',
  monthly_limit: 'Aylık Limit Aşıldı',
  duplicate_same_day: 'Aynı Gün Çakışması',
};

export default function DutyAssignModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  editingDuty,
  prefillDate,
  prefillShiftType,
  prefillDepartmentId,
  staff,
  departments,
  duties,
}: DutyAssignModalProps) {
  const [form, setForm] = useState<DutyInput>({
    staff_id: null,
    department_id: null,
    duty_date: '',
    start_time: '08:00',
    end_time: '20:00',
    status: 'upcoming',
    shift_type: 'gunduz',
    notes: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDuty) {
      setForm({
        staff_id: editingDuty.staff_id,
        department_id: editingDuty.department_id,
        duty_date: editingDuty.duty_date,
        start_time: editingDuty.start_time,
        end_time: editingDuty.end_time,
        status: editingDuty.status,
        shift_type: editingDuty.shift_type,
        notes: editingDuty.notes,
      });
    } else if (prefillDate) {
      const shiftType = prefillShiftType ?? 'gunduz';
      const times = SHIFT_TIMES[shiftType];
      setForm({
        staff_id: null,
        department_id: prefillDepartmentId,
        duty_date: prefillDate,
        start_time: times.start,
        end_time: times.end,
        status: 'upcoming',
        shift_type: shiftType,
        notes: null,
      });
    }
    setSubmitError(null);
  }, [editingDuty, prefillDate, prefillShiftType, prefillDepartmentId, open]);

  const isEditing = !!editingDuty;

  // Real-time validation using shared rule engine
  const validation = useMemo(() => {
    if (!form.staff_id || !form.duty_date) return null;
    return validateDuty(
      { ...form, id: editingDuty?.id },
      duties,
      staff
    );
  }, [form, duties, staff, editingDuty]);

  const conflicts: Conflict[] = validation?.conflicts ?? [];
  const hasError = validation?.hasError ?? false;
  const hasWarning = validation?.hasWarning ?? false;

  // Filter active staff, optionally by department
  const availableStaff = useMemo(() => {
    let list = staff.filter((s) => s.active);
    if (form.department_id) {
      list = list.filter((s) => s.department_id === form.department_id || s.department_id === null);
    }
    return list;
  }, [staff, form.department_id]);

  // Count this staff's duties in the same month
  const monthlyDutyCount = useMemo(() => {
    if (!form.staff_id || !form.duty_date) return 0;
    const month = form.duty_date.slice(0, 7);
    return duties.filter(
      (d) =>
        d.staff_id === form.staff_id &&
        d.id !== editingDuty?.id &&
        d.duty_date.slice(0, 7) === month
    ).length;
  }, [form.staff_id, form.duty_date, duties, editingDuty]);

  const selectedStaff = staff.find((s) => s.id === form.staff_id);
  const maxDuties = selectedStaff?.max_duties_per_month ?? 10;

  if (!open) return null;

  function handleShiftTypeChange(st: ShiftType) {
    const times = SHIFT_TIMES[st];
    setForm((f) => ({ ...f, shift_type: st, start_time: times.start, end_time: times.end }));
  }

  async function handleSubmit() {
    if (!form.department_id) {
      setSubmitError('Bölüm seçiniz');
      return;
    }
    if (!form.duty_date) {
      setSubmitError('Tarih gerekli');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit(form);
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
    } else {
      onClose();
    }
  }

  async function handleDelete() {
    if (!editingDuty || !onDelete) return;
    setSubmitting(true);
    const result = await onDelete(editingDuty.id);
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
    } else {
      onClose();
    }
  }

  const fieldCls = 'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEditing ? 'Nöbet Düzenle' : 'Nöbet Ata'}
              </h2>
              <p className="text-xs text-gray-400">
                {form.duty_date ? formatDateLabel(form.duty_date) : 'Yeni nöbet ataması'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Shift type selector */}
          <div>
            <label className={labelCls}>Nöbet Türü</label>
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_TYPES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => handleShiftTypeChange(st.value)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    form.shift_type === st.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {st.label}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{st.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className={labelCls}>Bölüm <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.department_id ?? ''}
                onChange={(e) => setForm({ ...form, department_id: e.target.value || null })}
                className={fieldCls}
              >
                <option value="">Bölüm seçiniz</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className={labelCls}>Personel</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.staff_id ?? ''}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value || null })}
                className={fieldCls}
              >
                <option value="">Atanmamış (Boş)</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} — {s.title}</option>
                ))}
              </select>
            </div>
            {form.staff_id && (
              <p className="mt-1.5 text-xs text-gray-400">
                Bu ayki nöbet sayısı: {monthlyDutyCount} / {maxDuties}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Tarih</label>
            <input
              type="date"
              value={form.duty_date}
              onChange={(e) => setForm({ ...form, duty_date: e.target.value })}
              className={fieldCls}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Başlangıç</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className={fieldCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Bitiş</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Durum</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DutyInput['status'] })}
              className={fieldCls}
            >
              <option value="upcoming">Bekleyen</option>
              <option value="active">Aktif</option>
              <option value="completed">Tamamlandı</option>
              <option value="missed">Boş / Atama Bekliyor</option>
            </select>
          </div>

          {/* Real-time validation results */}
          {form.staff_id && conflicts.length === 0 && !hasError && !hasWarning && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">Tüm kurallar uygun. Bu atama güvenle yapılabilir.</p>
            </div>
          )}

          {conflicts.map((conflict, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                conflict.severity === 'error'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <TriangleAlert className={`w-5 h-5 shrink-0 mt-0.5 ${
                conflict.severity === 'error' ? 'text-rose-600' : 'text-amber-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  conflict.severity === 'error' ? 'text-rose-800' : 'text-amber-800'
                }`}>
                  {REASON_LABELS[conflict.reason] ?? 'Kural İhlali'}
                </p>
                <p className={`text-sm mt-0.5 ${
                  conflict.severity === 'error' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {conflict.message}
                </p>
              </div>
            </div>
          ))}

          {submitError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <TriangleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          {isEditing && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
