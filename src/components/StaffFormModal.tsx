import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Users, Stethoscope, CalendarClock, Power } from 'lucide-react';
import type { DutyGroup, Staff } from '@/lib/supabase';
import type { StaffInput } from '@/hooks/useStaffData';

type StaffFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: StaffInput) => Promise<{ error: string | null }>;
  editingStaff: Staff | null;
  dutyGroups: DutyGroup[];
};

const ROLE_OPTIONS = [
  'Başhekim',
  'Uzman Doktor',
  'Asistan Doktor',
  'Pratisyen Doktor',
  'Hemşire',
  'Sağlık Memuru',
  'Teknisyen',
  'Tekniker',
  'Resepsiyonist',
  'Diğer',
];

const emptyForm: StaffInput = {
  full_name: '',
  title: 'Uzman Doktor',
  duty_group_id: null,
  phone: '',
  email: '',
  max_duties_per_month: 10,
  active: true,
};

export default function StaffFormModal({
  open,
  onClose,
  onSubmit,
  editingStaff,
  dutyGroups,
}: StaffFormModalProps) {
  const [form, setForm] = useState<StaffInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setForm({
        full_name: editingStaff.full_name,
        title: editingStaff.title,
        duty_group_id: editingStaff.duty_group_id,
        phone: editingStaff.phone ?? '',
        email: editingStaff.email ?? '',
        max_duties_per_month: editingStaff.max_duties_per_month,
        active: editingStaff.active,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingStaff, open]);

  if (!open) return null;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Ad Soyad zorunludur';
    if (!form.title.trim()) e.title = 'Görev/Ünvan zorunludur';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Geçerli bir e-posta adresi giriniz';
    }
    if (form.max_duties_per_month < 0) e.max_duties_per_month = '0 veya daha büyük olmalıdır';
    if (form.max_duties_per_month > 31) e.max_duties_per_month = '31\'den büyük olamaz';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const input: StaffInput = {
      ...form,
      full_name: form.full_name.trim(),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
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
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingStaff ? 'Personel Düzenle' : 'Personel Ekle'}
              </h2>
              <p className="text-xs text-gray-400">
                {editingStaff ? editingStaff.full_name : 'Yeni personel kaydı oluşturun'}
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
          {/* Full Name */}
          <div>
            <label className={labelCls}>Ad Soyad <span className="text-rose-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Örn. Dr. Ahmet Yılmaz"
                className={fieldCls}
              />
            </div>
            {errors.full_name && <p className={errorCls}>{errors.full_name}</p>}
          </div>

          {/* Role + Duty Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Görev / Ünvan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={fieldCls}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {errors.title && <p className={errorCls}>{errors.title}</p>}
            </div>
            <div>
              <label className={labelCls}>Nöbet Grubu</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.duty_group_id ?? ''}
                  onChange={(e) => setForm({ ...form, duty_group_id: e.target.value || null })}
                  className={fieldCls}
                >
                  <option value="">Grup seçiniz</option>
                  {dutyGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ornek@hastane.com"
                  className={fieldCls}
                />
              </div>
              {errors.email && <p className={errorCls}>{errors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0532 123 45 67"
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Max duties + Active */}
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
              <label className={labelCls}>Durum</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  form.active
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <Power className={`w-4 h-4 ${form.active ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${form.active ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {form.active ? 'Aktif' : 'Pasif'}
                </span>
              </button>
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
