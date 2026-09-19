import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Loader,
  TriangleAlert,
  CalendarClock,
  Clock,
} from 'lucide-react';
import { useDutyGroups } from '@/hooks/useDutyGroups';
import type { DutyGroupInput } from '@/hooks/useDutyGroups';
import type { DutyGroup } from '@/lib/supabase';
import GroupFormModal from '@/components/GroupFormModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';

export default function GroupManagement() {
  const { dutyGroups, loading, error, createGroup, updateGroup, deleteGroup } = useDutyGroups();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DutyGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DutyGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ id: String(Date.now()), type, message });
  }

  function handleAdd() {
    setEditingGroup(null);
    setFormOpen(true);
  }

  function handleEdit(group: DutyGroup) {
    setEditingGroup(group);
    setFormOpen(true);
  }

  async function handleSubmit(input: DutyGroupInput): Promise<{ error: string | null }> {
    if (editingGroup) {
      const result = await updateGroup(editingGroup.id, input);
      if (result.error) {
        showToast('error', 'Güncelleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Nöbet grubu güncellendi');
      }
      return result;
    } else {
      const result = await createGroup(input);
      if (result.error) {
        showToast('error', 'Ekleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Yeni nöbet grubu eklendi');
      }
      return result;
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteGroup(deleteTarget.id);
    setDeleting(false);
    if (result.error) {
      showToast('error', 'Silme başarısız: ' + result.error);
    } else {
      showToast('success', 'Nöbet grubu silindi');
    }
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Nöbet grupları yükleniyor...</p>
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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nöbet Grupları</h1>
            <p className="mt-1 text-sm text-gray-500">
              Toplam {dutyGroups.length} nöbet grubu
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Grup Ekle
          </button>
        </div>

        {/* Grid of group cards */}
        {dutyGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center animate-fade-in-up">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm font-medium text-gray-500">Henüz nöbet grubu yok</p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              İlk grubu ekleyin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dutyGroups.map((group, i) => (
              <div
                key={group.id}
                className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: group.color + '20' }}
                    >
                      <Users className="w-5 h-5" style={{ color: group.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="text-xs text-gray-400">Aktif</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      title="Düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(group)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Aylık Maks.</p>
                      <p className="text-sm font-semibold text-gray-900">{group.max_duties_per_month} nöbet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Min. Dinlenme</p>
                      <p className="text-sm font-semibold text-gray-900">{group.min_rest_hours} saat</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GroupFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        editingGroup={editingGroup}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Nöbet Grubu Sil</h2>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{deleteTarget.name}</span> adlı nöbet grubunu silmek üzeresiniz.
                Bu işleme bağlı personelin grup ataması kaldırılacaktır.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Bu gruba atanmış personelin ve nöbetlerin grup bağlantısı kaldırılır, ancak kayıtlar silinmez.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
