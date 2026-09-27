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
  ArrowLeft,
  ListChecks,
  ChevronRight,
} from 'lucide-react';
import { useDutyGroups } from '@/hooks/useDutyGroups';
import type { DutyGroupInput } from '@/hooks/useDutyGroups';
import type { DutyGroup, TaskList } from '@/lib/supabase';
import { useTaskLists } from '@/hooks/useTaskLists';
import type { TaskListInput } from '@/hooks/useTaskLists';
import GroupFormModal from '@/components/GroupFormModal';
import TaskListFormModal from '@/components/TaskListFormModal';
import TaskListDetail from '@/components/TaskListDetail';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';

export default function GroupManagement() {
  const { dutyGroups, loading, error, createGroup, updateGroup, deleteGroup } = useDutyGroups();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DutyGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DutyGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Drill-down state
  const [selectedGroup, setSelectedGroup] = useState<DutyGroup | null>(null);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string | null>(null);

  // Task list form state
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTaskList, setEditingTaskList] = useState<TaskList | null>(null);

  const taskListsHook = useTaskLists(selectedGroup?.id ?? null);

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

  function handleOpenGroup(group: DutyGroup) {
    setSelectedGroup(group);
    setSelectedTaskListId(null);
  }

  function handleBackToGroups() {
    setSelectedGroup(null);
    setSelectedTaskListId(null);
  }

  function handleOpenTaskList(taskListId: string) {
    setSelectedTaskListId(taskListId);
  }

  function handleBackToTaskLists() {
    setSelectedTaskListId(null);
  }

  function handleAddTaskList() {
    setEditingTaskList(null);
    setTaskFormOpen(true);
  }

  function handleEditTaskList(taskList: TaskList) {
    setEditingTaskList(taskList);
    setTaskFormOpen(true);
  }

  async function handleSubmitGroup(input: DutyGroupInput): Promise<{ error: string | null }> {
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

  async function handleSubmitTaskList(input: TaskListInput): Promise<{ error: string | null }> {
    if (editingTaskList) {
      const result = await taskListsHook.updateList(editingTaskList.id, input);
      if (result.error) {
        showToast('error', 'Güncelleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Görev listesi güncellendi');
      }
      return result;
    } else {
      const result = await taskListsHook.createList(input);
      if (result.error) {
        showToast('error', 'Ekleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Yeni görev listesi eklendi');
      }
      return result;
    }
  }

  async function handleDeleteTaskList(taskList: TaskList) {
    const result = await taskListsHook.deleteList(taskList.id);
    if (result.error) {
      showToast('error', 'Silme başarısız: ' + result.error);
    } else {
      showToast('success', 'Görev listesi silindi');
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

  // --- Task List Detail view ---
  if (selectedTaskListId) {
    return (
      <TaskListDetail taskListId={selectedTaskListId} onBack={handleBackToTaskLists} />
    );
  }

  // --- Task Lists view (inside a group) ---
  if (selectedGroup) {
    const { taskLists, loading: tlLoading, error: tlError } = taskListsHook;

    if (tlLoading) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Görev listeleri yükleniyor...</p>
          </div>
        </div>
      );
    }

    if (tlError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <TriangleAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="mt-3 text-sm font-medium text-gray-900">Veriler yüklenemedi</p>
            <p className="mt-1 text-sm text-gray-500">{tlError}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="animate-fade-in-up">
            <button
              onClick={handleBackToGroups}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Gruplara Dön
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selectedGroup.color + '20' }}
                >
                  <Users className="w-6 h-6" style={{ color: selectedGroup.color }} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{selectedGroup.name}</h1>
                  <p className="mt-0.5 text-sm text-gray-500">Görev Listeleri · {taskLists.length} görev</p>
                </div>
              </div>
              <button
                onClick={handleAddTaskList}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                Görev Ekle
              </button>
            </div>
          </div>

          {taskLists.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center animate-fade-in-up">
              <ListChecks className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="mt-3 text-sm font-medium text-gray-500">Henüz görev listesi yok</p>
              <p className="mt-1 text-sm text-gray-400">Bu gruba nöbet görevleri ekleyin (örn. Lavabo Nöbeti, Mutfak Nöbeti)</p>
              <button
                onClick={handleAddTaskList}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                İlk görevi ekleyin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {taskLists.map((tl, i) => (
                <div
                  key={tl.id}
                  className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in-up opacity-0 cursor-pointer"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => handleOpenTaskList(tl.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <ListChecks className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tl.name}</p>
                        {tl.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{tl.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditTaskList(tl)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTaskList(tl)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">{tl.cycle_days} günlük dönem</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TaskListFormModal
          open={taskFormOpen}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={handleSubmitTaskList}
          editingList={editingTaskList}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // --- Groups list view (default) ---
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
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-grid-pattern pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
                className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in-up opacity-0 cursor-pointer"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => handleOpenGroup(group)}
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-brand-600">Görev listelerini gör</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GroupFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitGroup}
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
