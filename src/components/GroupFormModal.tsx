import { useState, useEffect } from 'react';
import { X, Users, Palette, CalendarClock, Clock } from 'lucide-react';
import type { DutyGroup } from '@/lib/supabase';
import type { DutyGroupInput } from '@/hooks/useDutyGroups';

type GroupFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DutyGroupInput) => Promise<{ error: string | null }>;
  editingGroup: DutyGroup | null;
};

const COLOR_OPTIONS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

const emptyForm: DutyGroupInput = {
  name: '',
  color: '#3b82f6',
  max_duties_per_month: 10,
  min_rest_hours: 24,
};

export default function GroupFormModal({
  open,
  onClose,
  onSubmit,
  editingGroup,
}: GroupFormModalProps) {
  const [form, setForm] = useState<DutyGroupInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingGroup) {
      setForm({
        name: editingGroup.name,
        color: editingGroup.color,
        max_duties_per_month: editingGroup.max_duties_per_month,
        min_rest_hours: editingGroup.min_rest_hours,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingGroup, open]);

  if (!open) return null;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Grup adı zorunludur';
    if (form.max_duties_per_month < 0) e.max_duties_per_month = '0 veya daha büyük olmalıdır';
    if (form.max_duties_per_month > 31) e.max_duties_per_month = '31\'den büyük olamaz';
    if (form.min_rest_hours < 0) e.min_rest_hours = '0 veya daha büyük olmalıdır';
    if (form.min_rest_hours > 72) e.min_rest_hours = '72\'den büyük olamaz';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const input: DutyGroupInput = {
      ...form,
      name: form.name.trim(),
    };
    const { error } = await onSubmit(input);
    setSubmitting(false);
    if (error) return;
    onClose();
  }

  const fieldCls = 'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
  const errorCls = 'mt-1 text-xs text-rose-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingGroup ? 'Nöbet Grubu Düzenle' : 'Nöbet Grubu Ekle'}
              </h2>
              <p className="text-xs text-gray-400">
                {editingGroup ? editingGroup.name : 'Yeni nöbet grubu oluşturun'}
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
          {/* Name */}
          <div>
            <label className={labelCls}>Grup Adı <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Örn. Acil Nöbet Grubu"
                className={fieldCls}
              />
            </div>
            {errors.name && <p className={errorCls}>{errors.name}</p>}
          </div>

          {/* Color */}
          <div>
            <label className={labelCls}>Renk</label>
            <div className="relative">
              <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2 pl-10 py-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-7 h-7 rounded-lg transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Aylık Maks. Nöbet</label>
              <div className="relative">
                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={form.max_duties_per_month}
                  onChange={(e) => setForm({ ...form, max_duties_per_month: parseInt(e.target.value) || 0 })}
                  className={fieldCls}
                />
              </div>
              {errors.max_duties_per_month && <p className={errorCls}>{errors.max_duties_per_month}</p>}
            </div>
            <div>
              <label className={labelCls}>Min. Dinlenme (Saat)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={form.min_rest_hours}
                  onChange={(e) => setForm({ ...form, min_rest_hours: parseInt(e.target.value) || 0 })}
                  className={fieldCls}
                />
              </div>
              {errors.min_rest_hours && <p className={errorCls}>{errors.min_rest_hours}</p>}
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
