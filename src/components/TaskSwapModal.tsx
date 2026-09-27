import { useState, useEffect } from 'react';
import { X, ArrowLeftRight, User, Users, TriangleAlert } from 'lucide-react';
import type { Staff, TaskTurn } from '@/lib/supabase';

type SwapMode = 'individual' | 'unit';

type TaskSwapModalProps = {
  open: boolean;
  onClose: () => void;
  turns: TaskTurn[];
  staff: Staff[];
  currentTurnIndex: number;
  onSwapIndividual: (turnId: string, newMemberIds: string[]) => Promise<{ error: string | null }>;
  onSwapUnit: (turnAId: string, turnAPosition: number, turnBId: string, turnBPosition: number) => Promise<{ error: string | null }>;
};

export default function TaskSwapModal({
  open,
  onClose,
  turns,
  staff,
  currentTurnIndex,
  onSwapIndividual,
  onSwapUnit,
}: TaskSwapModalProps) {
  const [mode, setMode] = useState<SwapMode>('individual');
  const [selectedTurnId, setSelectedTurnId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [unitAId, setUnitAId] = useState('');
  const [unitBId, setUnitBId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode('individual');
      const current = turns[currentTurnIndex];
      setSelectedTurnId(current?.id ?? '');
      setSelectedMemberIds(current?.member_ids ?? []);
      setUnitAId(current?.id ?? '');
      setUnitBId('');
      setSubmitError(null);
    }
  }, [open, turns, currentTurnIndex]);

  if (!open) return null;

  const activeStaff = staff.filter((s) => s.active);

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    if (mode === 'individual') {
      if (!selectedTurnId) {
        setSubmitError('Lütfen bir birim seçin.');
        setSubmitting(false);
        return;
      }
      const result = await onSwapIndividual(selectedTurnId, selectedMemberIds);
      setSubmitting(false);
      if (result.error) {
        setSubmitError(result.error);
      } else {
        onClose();
      }
    } else {
      if (!unitAId || !unitBId || unitAId === unitBId) {
        setSubmitError('Lütfen iki farklı birim seçin.');
        setSubmitting(false);
        return;
      }
      const turnA = turns.find((t) => t.id === unitAId);
      const turnB = turns.find((t) => t.id === unitBId);
      if (!turnA || !turnB) {
        setSubmitError('Birimler bulunamadı.');
        setSubmitting(false);
        return;
      }
      const result = await onSwapUnit(turnA.id, turnA.position, turnB.id, turnB.position);
      setSubmitting(false);
      if (result.error) {
        setSubmitError(result.error);
      } else {
        onClose();
      }
    }
  }

  const fieldCls =
    'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

  function memberName(id: string): string {
    return staff.find((s) => s.id === id)?.full_name ?? id;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Nöbet Değişimi</h2>
              <p className="text-xs text-gray-400">Kişisel veya birim değişimi yapın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setMode('individual'); setSubmitError(null); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'individual'
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              Kişisel Değişim
            </button>
            <button
              type="button"
              onClick={() => { setMode('unit'); setSubmitError(null); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'unit'
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Birim / Ekip Değişimi
            </button>
          </div>

          {mode === 'individual' ? (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Birim Seçin</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedTurnId}
                    onChange={(e) => {
                      setSelectedTurnId(e.target.value);
                      const t = turns.find((tt) => tt.id === e.target.value);
                      setSelectedMemberIds(t?.member_ids ?? []);
                    }}
                    className={fieldCls}
                  >
                    <option value="">Birim seçiniz</option>
                    {turns.map((t, i) => (
                      <option key={t.id} value={t.id}>
                        {i + 1}. {t.label}
                        {t.member_ids.length > 0 && ` (${t.member_ids.map(memberName).join(', ')})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTurnId && (
                <div>
                  <label className={labelCls}>Üyeleri Değiştir</label>
                  <p className="text-xs text-gray-400 mb-2">
                    Mevcut üyeleri değiştirin veya yeni personel ekleyin.
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
                    {activeStaff.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(s.id)}
                          onChange={() => toggleMember(s.id)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700">{s.full_name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{s.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {turns.length < 2 ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Birim değişimi için en az 2 birim gereklidir.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>1. Birim</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={unitAId}
                        onChange={(e) => { setUnitAId(e.target.value); setSubmitError(null); }}
                        className={fieldCls}
                      >
                        <option value="">Birim seçiniz</option>
                        {turns.map((t, i) => (
                          <option key={t.id} value={t.id}>
                            {i + 1}. {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>2. Birim</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={unitBId}
                        onChange={(e) => { setUnitBId(e.target.value); setSubmitError(null); }}
                        className={fieldCls}
                      >
                        <option value="">Birim seçiniz</option>
                        {turns
                          .filter((t) => t.id !== unitAId)
                          .map((t, i) => (
                            <option key={t.id} value={t.id}>
                              {turns.findIndex((tt) => tt.id === t.id) + 1}. {t.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Seçilen iki birim sıradaki yerlerini birbiriyle değiştirecektir.
                  </p>
                </>
              )}
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <TriangleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (mode === 'unit' && turns.length < 2)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uygulanıyor...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Değişimi Uygula
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
