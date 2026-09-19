import { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, Users, Sun, Moon, Clock, CalendarClock, TriangleAlert, CircleCheck, Loader } from 'lucide-react';
import type { DutyGroup, DutyWithRelations, Staff } from '@/lib/supabase';
import type { DutyInput } from '@/hooks/useScheduleData';
import { generateAutoSchedule, type AutoGenerateResult, type ShiftTypeOption } from '@/lib/scheduleRules';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

type AutoGenerateModalProps = {
  open: boolean;
  onClose: () => void;
  onGenerate: (duties: DutyInput[]) => Promise<{ error: string | null; count: number }>;
  staff: Staff[];
  dutyGroups: DutyGroup[];
  duties: DutyWithRelations[];
  year: number;
  month: number;
};

export default function AutoGenerateModal({
  open,
  onClose,
  onGenerate,
  staff,
  dutyGroups,
  duties,
  year,
  month,
}: AutoGenerateModalProps) {
  const [dutyGroupId, setDutyGroupId] = useState<string>('');
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeOption[]>([
    { type: 'gunduz', enabled: true },
    { type: 'gece', enabled: true },
    { type: '24saat', enabled: false },
  ]);
  const [result, setResult] = useState<AutoGenerateResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const monthName = TR_MONTHS[month];
  const eligibleStaff = useMemo(() => {
    let list = staff.filter((s) => s.active);
    if (dutyGroupId) {
      list = list.filter((s) => s.duty_group_id === dutyGroupId || s.duty_group_id === null);
    }
    return list;
  }, [staff, dutyGroupId]);

  function handlePreview() {
    const res = generateAutoSchedule(
      { year, month, dutyGroupId: dutyGroupId || null, shiftTypes },
      staff,
      dutyGroups,
      duties
    );
    setResult(res);
  }

  async function handleApply() {
    if (!result || result.duties.length === 0) return;
    setGenerating(true);
    setError(null);
    const inputs: DutyInput[] = result.duties.map((d) => ({
      staff_id: d.staff_id,
      duty_group_id: d.duty_group_id,
      duty_date: d.duty_date,
      start_time: d.start_time,
      end_time: d.end_time,
      status: 'upcoming',
      shift_type: d.shift_type,
      notes: null,
    }));
    const res = await onGenerate(inputs);
    setGenerating(false);
    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  }

  const shiftIcons: Record<string, typeof Sun> = { gunduz: Sun, gece: Moon, '24saat': Clock };
  const shiftLabels: Record<string, string> = { gunduz: 'Gündüz', gece: 'Gece', '24saat': '24 Saat' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Otomatik Çizelge Oluştur</h2>
              <p className="text-xs text-gray-400">{monthName} {year} · {eligibleStaff.length} uygun personel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-50 border border-brand-200">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-brand-800">Otomatik Atama</p>
              <p className="text-sm text-brand-700 mt-0.5">
                Sistem, aktif personel arasında nöbetleri otomatik dağıtır. Seçilen grubun aylık maksimum nöbet limiti ve minimum dinlenme süresi kuralları gözetilir.
              </p>
            </div>
          </div>

          {/* Duty Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nöbet Grubu</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={dutyGroupId}
                onChange={(e) => { setDutyGroupId(e.target.value); setResult(null); }}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              >
                <option value="">Tüm Gruplar</option>
                {dutyGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            {dutyGroupId && (() => {
              const grp = dutyGroups.find((g) => g.id === dutyGroupId);
              if (!grp) return null;
              return (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                    Maks. {grp.max_duties_per_month} nöbet/ay
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Min. {grp.min_rest_hours} saat dinlenme
                  </span>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nöbet Türleri</label>
            <div className="space-y-2">
              {shiftTypes.map((st, i) => {
                const Icon = shiftIcons[st.type];
                return (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => { setShiftTypes((prev) => prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p)); setResult(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      st.enabled ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{shiftLabels[st.type]}</span>
                    <div className={`relative w-9 h-5 rounded-full transition-colors ${st.enabled ? 'bg-brand-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform`} style={{ transform: st.enabled ? 'translateX(18px)' : 'translateX(2px)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview button */}
          <button
            onClick={handlePreview}
            disabled={eligibleStaff.length === 0 || !shiftTypes.some((s) => s.enabled)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Önizleme Oluştur
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-3 animate-fade-in-up">
              {result.duties.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-800">
                      {result.duties.length} nöbet otomatik atandı · {result.unassigned.length} slot atananamaz
                    </p>
                  </div>

                  {/* Preview list */}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
                    {result.duties.slice(0, 10).map((d, i) => {
                      const s = staff.find((st) => st.id === d.staff_id);
                      const Icon = shiftIcons[d.shift_type];
                      return (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs">
                          <Icon className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-gray-600 font-mono">{d.duty_date}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-900 font-medium truncate flex-1">{s?.full_name ?? '—'}</span>
                          <span className="text-gray-400">{shiftLabels[d.shift_type]}</span>
                        </div>
                      );
                    })}
                    {result.duties.length > 10 && (
                      <div className="px-3 py-1.5 text-xs text-gray-400">+{result.duties.length - 10} daha...</div>
                    )}
                  </div>

                  {result.unassigned.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">{result.unassigned.length} slot atananamadı</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Bazı günlerde tüm personel dolu veya kural ihlali nedeniyle atama yapılamadı.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Bu ay için atama yapılamadı. Personel limitleri veya mevcut nöbetler nedeniyle uygun slot bulunmuyor.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <TriangleAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button
            onClick={handleApply}
            disabled={!result || result.duties.length === 0 || generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Çizelgeyi Oluştur
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
