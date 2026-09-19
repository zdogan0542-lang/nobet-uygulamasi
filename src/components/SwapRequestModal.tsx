import { useEffect, useMemo, useState } from 'react';
import { X, ArrowLeftRight, User, Users, TriangleAlert, CircleCheck, Clock, CalendarDays } from 'lucide-react';
import type { DutyGroup, DutyWithRelations, Staff } from '@/lib/supabase';
import { validateSwap } from '@/lib/scheduleRules';

export type SwapRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (toStaffId: string, reason: string | null) => Promise<{ error: string | null }>;
  duty: DutyWithRelations | null;
  staff: Staff[];
  dutyGroups: DutyGroup[];
  duties: DutyWithRelations[];
};

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const SHIFT_LABELS: Record<string, string> = { gunduz: 'Gündüz', gece: 'Gece', '24saat': '24 Saat' };

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${TR_DAYS[d.getDay()]}`;
}

export default function SwapRequestModal({
  open,
  onClose,
  onSubmit,
  duty,
  staff,
  dutyGroups,
  duties,
}: SwapRequestModalProps) {
  const [toStaffId, setToStaffId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setToStaffId('');
      setReason('');
      setSubmitError(null);
    }
  }, [open]);

  if (!open || !duty) return null;

  const fromStaff = staff.find((s) => s.id === duty.staff_id);
  const availableStaff = useMemo(
    () => staff.filter((s) => s.active && s.id !== duty.staff_id),
    [staff, duty.staff_id]
  );

  const validation = useMemo(() => {
    if (!toStaffId) return null;
    return validateSwap(duty, toStaffId, duties, staff, dutyGroups);
  }, [toStaffId, duty, duties, staff, dutyGroups]);

  async function handleSubmit() {
    if (!toStaffId) {
      setSubmitError('Lütfen hedef personel seçiniz.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit(toStaffId, reason.trim() || null);
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
              <ArrowLeftRight className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Nöbet Değişim Talebi</h2>
              <p className="text-xs text-gray-400">
                {duty.duty_date ? formatDateLabel(duty.duty_date) : ''}
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
          {/* Current duty info */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5" />
              Mevcut Nöbet
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                {fromStaff ? fromStaff.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{fromStaff?.full_name ?? 'Atanmamış'}</p>
                <p className="text-xs text-gray-400">
                  {SHIFT_LABELS[duty.shift_type] ?? duty.shift_type} · {duty.start_time.slice(0, 5)} - {duty.end_time.slice(0, 5)}
                </p>
              </div>
              {duty.duty_groups && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: duty.duty_groups.color }} />
                  {duty.duty_groups.name}
                </span>
              )}
            </div>
          </div>

          {/* Target staff */}
          <div>
            <label className={labelCls}>Hedef Personel <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={toStaffId}
                onChange={(e) => { setToStaffId(e.target.value); setSubmitError(null); }}
                className={fieldCls}
              >
                <option value="">Personel seçiniz</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} — {s.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={labelCls}>Değişim Nedeni (opsiyonel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn. Hastalık izni, acil durum..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Validation results */}
          {validation && (
            <div className="space-y-2">
              {validation.valid && validation.warnings.length === 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">Tüm kurallar uygun. Değişim talebi oluşturulabilir.</p>
                </div>
              )}

              {validation.warnings.map((w, i) => (
                <div key={`w-${i}`} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">{w}</p>
                </div>
              ))}

              {validation.errors.map((e, i) => (
                <div key={`e-${i}`} className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <TriangleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{e}</p>
                </div>
              ))}
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <TriangleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (validation !== null && !validation.valid)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Talep Gönder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
