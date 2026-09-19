import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Filter,
  Loader,
  TriangleAlert,
  Mail,
  Phone,
  CalendarClock,
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import type { StaffInput } from '@/hooks/useStaffData';
import type { Staff, StaffWithGroup } from '@/lib/supabase';
import StaffFormModal from '@/components/StaffFormModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function StaffManagement() {
  const {
    staff,
    dutyGroups,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    getUpcomingDutyCount,
  } = useStaffData();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ id: String(Date.now()), type, message });
  }

  const roles = useMemo(() => {
    const set = new Set(staff.map((s) => s.title));
    return Array.from(set).sort();
  }, [staff]);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (search && !s.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (groupFilter && s.duty_group_id !== groupFilter) return false;
      if (roleFilter && s.title !== roleFilter) return false;
      return true;
    });
  }, [staff, search, groupFilter, roleFilter]);

  const activeCount = staff.filter((s) => s.active).length;

  function handleAdd() {
    setEditingStaff(null);
    setFormOpen(true);
  }

  function handleEdit(staffMember: Staff) {
    setEditingStaff(staffMember);
    setFormOpen(true);
  }

  async function handleSubmit(input: StaffInput): Promise<{ error: string | null }> {
    if (editingStaff) {
      const result = await updateStaff(editingStaff.id, input);
      if (result.error) {
        showToast('error', 'Güncelleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Personel güncellendi');
      }
      return result;
    } else {
      const result = await createStaff(input);
      if (result.error) {
        showToast('error', 'Ekleme başarısız: ' + result.error);
      } else {
        showToast('success', 'Yeni personel eklendi');
      }
      return result;
    }
  }

  async function handleDeleteClick(staffMember: StaffWithGroup) {
    setDeleteTarget(staffMember);
    setLoadingCount(true);
    const count = await getUpcomingDutyCount(staffMember.id);
    setUpcomingCount(count);
    setLoadingCount(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const result = await deleteStaff(deleteTarget.id);
    if (result.error) {
      showToast('error', 'Silme başarısız: ' + result.error);
    } else {
      showToast('success', 'Personel silindi');
    }
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Personel yükleniyor...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Personel Yönetimi</h1>
            <p className="mt-1 text-sm text-gray-500">
              Toplam {staff.length} personel · {activeCount} aktif · {staff.length - activeCount} pasif
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Personel Ekle
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsme göre ara..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="">Tüm Gruplar</option>
                  {dutyGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="">Tüm Görevler</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="mt-3 text-sm font-medium text-gray-500">
                {staff.length === 0 ? 'Henüz personel kaydı yok' : 'Sonuç bulunamadı'}
              </p>
              {staff.length === 0 && (
                <button
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  İlk personeli ekleyin
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Personel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Nöbet Grubu</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">İletişim</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Aylık Nöbet</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((member, i) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/50 transition-colors animate-fade-in opacity-0"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Name + Role */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {getInitials(member.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.full_name}</p>
                            <p className="text-xs text-gray-400">{member.title}</p>
                          </div>
                        </div>
                      </td>
                      {/* Duty Group */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {member.duty_groups ? (
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.duty_groups.color }} />
                            {member.duty_groups.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      {/* Contact */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="space-y-1">
                          {member.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </div>
                          )}
                          {!member.email && !member.phone && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      {/* Max duties */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                          {member.max_duties_per_month}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          member.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {member.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        editingStaff={editingStaff}
        dutyGroups={dutyGroups}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        staff={deleteTarget}
        upcomingCount={upcomingCount}
        loadingCount={loadingCount}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
