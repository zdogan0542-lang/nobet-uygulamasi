import { useState, useEffect } from 'react';
import { X, ListChecks, AlignLeft, CalendarClock } from 'lucide-react';
import type { TaskList } from '@/lib/supabase';
import type { TaskListInput } from '@/hooks/useTaskLists';

type TaskListFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TaskListInput) => Promise<{ error: string | null }>;
  editingList: TaskList | null;
};

const emptyForm: TaskListInput = {
  name: '',
  description: null,
  cycle_days: 7,
  sort_order: 0,
};

export default function TaskListFormModal({
  open,
  onClose,
  onSubmit,
  editingList,
}: TaskListFormModalProps) {
  const [form, setForm] = useState<TaskListInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingList) {
      setForm({
        name: editingList.name,
        description: editingList.description,
        cycle_days: editingList.cycle_days,
        sort_order: editingList.sort_order,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingList, open]);

  if (!open) return null;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Görev adı zorunludur';
    if (form.cycle_days < 1) e.cycle_days = '1 veya daha büyük olmalıdır';
    if (form.cycle_days > 365) e.cycle_days = '365\'den büyük olamaz';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const input: TaskListInput = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };
    const { error } = await onSubmit(input);
    setSubmitting(false);
    if (error) return;
    onClose();
  }

  const fieldCls =
    'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
  const errorCls = 'mt-1 text-xs text-rose-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingList ? 'Görev Listesini Düzenle' : 'Yeni Görev Listesi'}
              </h2>
              <p className="text-xs text-gray-400">
                {editingList ? editingList.name : 'Nöbet görevi oluşturun (örn. Lavabo Nöbeti)'}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>
              Görev Adı <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Örn. Lavabo Nöbeti"
                className={fieldCls}
              />
            </div>
            {errors.name && <p className={errorCls}>{errors.name}</p>}
          </div>

          <div>
            <label className={labelCls}>Açıklama</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Opsiyonel açıklama"
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dönem Süresi (Gün)</label>
              <div className="relative">
                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.cycle_days}
                  onChange={(e) => setForm({ ...form, cycle_days: parseInt(e.target.value) || 1 })}
                  className={fieldCls}
                />
              </div>
              {errors.cycle_days && <p className={errorCls}>{errors.cycle_days}</p>}
            </div>
            <div>
              <label className={labelCls}>Sıra No</label>
              <div className="relative">
                <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className={fieldCls}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
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
              'Kaydet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
