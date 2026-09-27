import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Sparkles,
  ArrowLeftRight,
  Plus,
  Trash2,
  Pencil,
  Loader,
  TriangleAlert,
  CalendarClock,
  ListChecks,
  Users,
  Check,
  Clock,
} from 'lucide-react';
import { useTaskListDetail, confirmCurrentTurn, recordPreviousDuty, recordExtraCleaning } from '@/hooks/useTaskListDetail';
import { swapUnitSlots, swapIndividualMember, createTurn, updateTurn, deleteTurn } from '@/hooks/useTaskListDetail';
import type { Staff, TaskTurn } from '@/lib/supabase';
import TaskSwapModal from '@/components/TaskSwapModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';

type TaskListDetailProps = {
  taskListId: string;
  onBack: () => void;
};

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${TR_DAYS[d.getDay()]}`;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function TaskListDetail({ taskListId, onBack }: TaskListDetailProps) {
  const { taskList, turns, extras, staff, loading, error, refetch } = useTaskListDetail(taskListId);
  const [swapOpen, setSwapOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraLabel, setExtraLabel] = useState('');
  const [extraStaffId, setExtraStaffId] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevTurnId, setPrevTurnId] = useState('');
  const [addTurnOpen, setAddTurnOpen] = useState(false);
  const [editTurn, setEditTurn] = useState<TaskTurn | null>(null);
  const [turnLabel, setTurnLabel] = useState('');
  const [turnMembers, setTurnMembers] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ id: String(Date.now()), type, message });
  }

  function memberName(id: string): string {
    return staff.find((s) => s.id === id)?.full_name ?? 'Bilinmeyen';
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Görev detayı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !taskList) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <TriangleAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-gray-900">Görev listesi yüklenemedi</p>
          <p className="mt-1 text-sm text-gray-500">{error ?? 'Görev listesi bulunamadı'}</p>
        </div>
      </div>
    );
  }

  const currentIndex = taskList.current_turn_index;
  const currentTurn = turns[currentIndex];
  const activeStaff = staff.filter((s) => s.active);

  async function handleConfirmCurrent() {
    if (!currentTurn || !taskList) return;
    setActionLoading(true);
    const result = await confirmCurrentTurn(taskListId, turns, taskList);
    setActionLoading(false);
    if (result.error) {
      showToast('error', 'Nöbet tamamlanamadı: ' + result.error);
    } else {
      showToast('success', 'Nöbet tamamlandı, sıra ilerletildi');
      await refetch();
    }
  }

  async function handleRecordPrevious() {
    if (!prevTurnId) return;
    setActionLoading(true);
    const result = await recordPreviousDuty(prevTurnId);
    setActionLoading(false);
    if (result.error) {
      showToast('error', 'Kayıt yapılamadı: ' + result.error);
    } else {
      showToast('success', 'Önceki nöbet kaydedildi');
      setPrevOpen(false);
      await refetch();
    }
  }

  async function handleExtraCleaning() {
    if (!taskList) return;
    setActionLoading(true);
    const result = await recordExtraCleaning(
      taskListId,
      taskList,
      extraLabel.trim(),
      extraStaffId || null,
      extraNote.trim() || null
    );
    setActionLoading(false);
    if (result.error) {
      showToast('error', 'Ek temizlik kaydedilemedi: ' + result.error);
    } else {
      showToast('success', 'Ek temizlik kaydedildi');
      setExtraOpen(false);
      setExtraLabel('');
      setExtraStaffId('');
      setExtraNote('');
      await refetch();
    }
  }

  async function handleSwapIndividual(turnId: string, newMemberIds: string[]) {
    const result = await swapIndividualMember(turnId, newMemberIds);
    if (result.error) {
      showToast('error', 'Değişim başarısız: ' + result.error);
    } else {
      showToast('success', 'Kişisel değişim uygulandı');
      await refetch();
    }
    return result;
  }

  async function handleSwapUnit(aId: string, aPos: number, bId: string, bPos: number) {
    const result = await swapUnitSlots(aId, aPos, bId, bPos);
    if (result.error) {
      showToast('error', 'Değişim başarısız: ' + result.error);
    } else {
      showToast('success', 'Birim değişimi uygulandı');
      await refetch();
    }
    return result;
  }

  function openAddTurn() {
    setEditTurn(null);
    setTurnLabel('');
    setTurnMembers([]);
    setAddTurnOpen(true);
  }

  function openEditTurn(turn: TaskTurn) {
    setEditTurn(turn);
    setTurnLabel(turn.label);
    setTurnMembers(turn.member_ids);
    setAddTurnOpen(true);
  }

  async function handleSaveTurn() {
    if (!turnLabel.trim()) {
      showToast('error', 'Birim adı gerekli');
      return;
    }
    setActionLoading(true);
    if (editTurn) {
      const result = await updateTurn(editTurn.id, turnLabel.trim(), turnMembers);
      if (result.error) {
        showToast('error', 'Güncellenemedi: ' + result.error);
      } else {
        showToast('success', 'Birim güncellendi');
        setAddTurnOpen(false);
      }
    } else {
      const nextPos = turns.length > 0 ? Math.max(...turns.map((t) => t.position)) + 1 : 0;
      const result = await createTurn(taskListId, turnLabel.trim(), turnMembers, nextPos);
      if (result.error) {
        showToast('error', 'Eklenemedi: ' + result.error);
      } else {
        showToast('success', 'Birim eklendi');
        setAddTurnOpen(false);
      }
    }
    setActionLoading(false);
    await refetch();
  }

  async function handleDeleteTurn(turn: TaskTurn) {
    setActionLoading(true);
    const result = await deleteTurn(turn.id);
    setActionLoading(false);
    if (result.error) {
      showToast('error', 'Silinemedi: ' + result.error);
    } else {
      showToast('success', 'Birim silindi');
      await refetch();
    }
  }

  function toggleTurnMember(id: string) {
    setTurnMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Back + header */}
        <div className="animate-fade-in-up">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Gruba Dön
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <ListChecks className="w-6 h-6 text-brand-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{taskList.name}</h1>
              {taskList.description && (
                <p className="mt-0.5 text-sm text-gray-500 truncate">{taskList.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Turn Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-6 py-7 shadow-xl shadow-brand-900/20 animate-fade-in-up">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-brand-100 text-xs font-medium uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Şu anki Nöbetçi
            </div>
            {turns.length === 0 ? (
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">Henüz nöbetçi eklenmedi</p>
                <p className="mt-1 text-sm text-brand-100">
                  Aşağıdan birim ekleyerek nöbet sırasını oluşturun.
                </p>
              </div>
            ) : currentTurn ? (
              <div className="mt-4">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {currentTurn.label}
                </p>
                {currentTurn.member_ids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentTurn.member_ids.map((id) => {
                      const s = staff.find((st) => st.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm"
                        >
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                            {s ? getInitials(s.full_name) : '?'}
                          </span>
                          {s?.full_name ?? 'Bilinmeyen'}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-sm text-brand-100">
                  <CalendarClock className="w-4 h-4" />
                  <span>Sıradaki dönem: {formatDate(taskList.next_cycle_date)}</span>
                  <span className="text-brand-300">·</span>
                  <span>{taskList.cycle_days} günlük dönem</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-lg text-white">—</p>
            )}

            {/* Action buttons */}
            {turns.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmCurrent}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-brand-700 text-sm font-semibold hover:bg-brand-50 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Yaptım
                </button>
                <button
                  onClick={() => { setPrevTurnId(currentTurn?.id ?? ''); setPrevOpen(true); }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                >
                  <History className="w-4 h-4" />
                  Önceki Nöbetimi Yaptım
                </button>
              </div>
            )}

            {turns.length > 0 && (
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setExtraOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/90 text-white text-sm font-semibold hover:bg-emerald-500 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Gönüllü / Ekstra Temizlik
                </button>
                <button
                  onClick={() => setSwapOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Nöbet Değişimi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Roster */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Nöbet Sırası</h2>
              <p className="text-sm text-gray-400">Sıradaki birimler ve tamamlanan durumlar</p>
            </div>
            <button
              onClick={openAddTurn}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Birim Ekle
            </button>
          </div>

          {turns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm text-gray-400">Henüz nöbet sırası oluşturulmadı</p>
              <button
                onClick={openAddTurn}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                İlk birimi ekleyin
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {turns.map((turn, i) => {
                const isCurrent = i === currentIndex;
                return (
                  <div
                    key={turn.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                      isCurrent ? 'bg-brand-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{turn.label}</p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700">
                            AKTİF
                          </span>
                        )}
                        {turn.completed && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      {turn.member_ids.length > 0 && (
                        <p className="text-xs text-gray-400 truncate">
                          {turn.member_ids.map(memberName).join(', ')}
                        </p>
                      )}
                      {turn.last_completed_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Son tamamlama: {new Date(turn.last_completed_at).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditTurn(turn)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTurn(turn)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Extra cleaning log */}
        {extras.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">Ek Temizlik Kayıtları</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {extras.map((ex) => {
                const s = staff.find((st) => st.id === ex.performed_by_staff_id);
                return (
                  <div key={ex.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ex.label ?? s?.full_name ?? 'Ek temizlik'}
                      </p>
                      {ex.note && <p className="text-xs text-gray-400 truncate">{ex.note}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(ex.performed_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Swap modal */}
      <TaskSwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        turns={turns}
        staff={staff}
        currentTurnIndex={currentIndex}
        onSwapIndividual={handleSwapIndividual}
        onSwapUnit={handleSwapUnit}
      />

      {/* Previous duty modal */}
      {prevOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setPrevOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <History className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Önceki Nöbet Kaydı</h2>
              </div>
              <button onClick={() => setPrevOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">Hangi birimin nöbetini tamamladığınızı seçin.</p>
              <select
                value={prevTurnId}
                onChange={(e) => setPrevTurnId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              >
                {turns.map((t, i) => (
                  <option key={t.id} value={t.id}>
                    {i + 1}. {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setPrevOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button
                onClick={handleRecordPrevious}
                disabled={actionLoading || !prevTurnId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra cleaning modal */}
      {extraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setExtraOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Ekstra Temizlik</h2>
              </div>
              <button onClick={() => setExtraOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Yapan kişi / ekip (opsiyonel)</label>
                <input
                  type="text"
                  value={extraLabel}
                  onChange={(e) => setExtraLabel(e.target.value)}
                  placeholder="Örn. Gönüllü ekip"
                  className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Personel seç (opsiyonel)</label>
                <select
                  value={extraStaffId}
                  onChange={(e) => setExtraStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="">Personel seçiniz</option>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Not (opsiyonel)</label>
                <textarea
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  placeholder="Ek temizlik hakkında not..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
              <p className="text-xs text-gray-400">
                Bu kayıt nöbet sırasını etkilemez, sadece bir sonraki dönem tarihini ileri taşır.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setExtraOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button
                onClick={handleExtraCleaning}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit turn modal */}
      {addTurnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setAddTurnOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editTurn ? 'Birimi Düzenle' : 'Yeni Birim'}
                </h2>
              </div>
              <button onClick={() => setAddTurnOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Birim / Ekip Adı</label>
                <input
                  type="text"
                  value={turnLabel}
                  onChange={(e) => setTurnLabel(e.target.value)}
                  placeholder="Örn. A Ekibi"
                  className="w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Üyeler (opsiyonel)</label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
                  {activeStaff.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={turnMembers.includes(s.id)}
                        onChange={() => toggleTurnMember(s.id)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">{s.full_name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setAddTurnOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button
                onClick={handleSaveTurn}
                disabled={actionLoading || !turnLabel.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
