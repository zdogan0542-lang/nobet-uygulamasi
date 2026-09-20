import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Loader,
  TriangleAlert,
  Clock,
  CircleCheck,
  CircleX,
  Trash2,
  User,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { useSwapRequests } from '@/hooks/useSwapRequests';
import { useScheduleData } from '@/hooks/useScheduleData';
import type { DutyWithRelations, SwapRequestWithRelations, SwapStatus } from '@/lib/supabase';
import SwapRequestModal from '@/components/SwapRequestModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const SHIFT_LABELS: Record<string, string> = { gunduz: 'Gündüz', gece: 'Gece', '24saat': '24 Saat' };

const STATUS_CONFIG: Record<SwapStatus, { label: string; cls: string; dot: string; icon: typeof Clock }> = {
  pending: { label: 'Beklemede', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Clock },
  approved: { label: 'Onaylandı', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CircleCheck },
  rejected: { label: 'Reddedildi', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: CircleX },
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${TR_DAYS[d.getDay()]}`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

type FilterStatus = 'all' | SwapStatus;

export default function SwapRequestsPage() {
  const { swapRequests, loading, error, createSwapRequest, updateSwapStatus, deleteSwapRequest } = useSwapRequests();
  const { duties, staff, dutyGroups, refetch: refetchSchedule } = useScheduleData();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<DutyWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ id: String(Date.now()), type, message });
  }

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') return swapRequests;
    return swapRequests.filter((r) => r.status === filterStatus);
  }, [swapRequests, filterStatus]);

  // Enrich swap requests with staff/duty data from schedule hook
  const enrichedRequests = useMemo(() => {
    return filteredRequests.map((r) => ({
      ...r,
      from_staff: r.from_staff ?? staff.find((s) => s.id === r.from_staff_id) ?? null,
      to_staff: r.to_staff ?? staff.find((s) => s.id === r.to_staff_id) ?? null,
      duty: r.duty ?? duties.find((d) => d.id === r.duty_id) ?? null,
    }));
  }, [filteredRequests, staff, duties]);

  // Duties that can be swapped (must have an assigned staff, status not completed)
  const swappableDuties = useMemo(() => {
    return duties
      .filter((d) => d.staff_id !== null && d.status !== 'completed')
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date));
  }, [duties]);

  const stats = useMemo(() => {
    return {
      total: swapRequests.length,
      pending: swapRequests.filter((r) => r.status === 'pending').length,
      approved: swapRequests.filter((r) => r.status === 'approved').length,
      rejected: swapRequests.filter((r) => r.status === 'rejected').length,
    };
  }, [swapRequests]);

  function handleNewSwap(duty: DutyWithRelations) {
    setSelectedDuty(duty);
    setModalOpen(true);
  }

  async function handleSubmitSwap(toStaffId: string, reason: string | null): Promise<{ error: string | null }> {
    if (!selectedDuty || !selectedDuty.staff_id) {
      return { error: 'Nöbet veya personel bilgisi eksik.' };
    }
    const result = await createSwapRequest({
      duty_id: selectedDuty.id,
      from_staff_id: selectedDuty.staff_id,
      to_staff_id: toStaffId,
      reason,
    });
    if (result.error) {
      showToast('error', 'Talep oluşturulamadı: ' + result.error);
    } else {
      showToast('success', 'Değişim talebi oluşturuldu');
    }
    return result;
  }

  async function handleApprove(request: SwapRequestWithRelations) {
    setActionLoading(request.id);
    const result = await updateSwapStatus(request.id, 'approved');
    setActionLoading(null);
    if (result.error) {
      showToast('error', 'Onaylama başarısız: ' + result.error);
    } else {
      showToast('success', 'Değişim onaylandı ve nöbet güncellendi');
      await refetchSchedule();
    }
  }

  async function handleReject(request: SwapRequestWithRelations) {
    setActionLoading(request.id);
    const result = await updateSwapStatus(request.id, 'rejected');
    setActionLoading(null);
    if (result.error) {
      showToast('error', 'Reddetme başarısız: ' + result.error);
    } else {
      showToast('info', 'Değişim talebi reddedildi');
    }
  }

  async function handleDelete(request: SwapRequestWithRelations) {
    setActionLoading(request.id);
    const result = await deleteSwapRequest(request.id);
    setActionLoading(null);
    if (result.error) {
      showToast('error', 'Silme başarısız: ' + result.error);
    } else {
      showToast('success', 'Değişim talebi silindi');
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Değişim talepleri yükleniyor...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nöbet Değişim Talepleri</h1>
            <p className="mt-1 text-sm text-gray-500">
              Toplam {stats.total} talep · {stats.pending} beklemede · {stats.approved} onaylandı · {stats.rejected} reddedildi
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { label: 'Toplam Talep', value: stats.total, icon: ArrowLeftRight, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Beklemede', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Onaylandı', value: stats.approved, icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Reddedildi', value: stats.rejected, icon: CircleX, color: 'text-rose-600', bg: 'bg-rose-50' },
          ] as const).map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* New Swap Request - Duty Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-semibold text-gray-900">Yeni Değişim Talebi</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Değişim yapmak istediğiniz nöbeti seçiniz. Sadece personel atanmış ve tamamlanmamış nöbetler listelenir.
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
            {swappableDuties.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-400">Değişime uygun nöbet bulunmuyor</p>
              </div>
            ) : (
              swappableDuties.slice(0, 30).map((duty) => {
                const dutyStaff = staff.find((s) => s.id === duty.staff_id);
                return (
                  <button
                    key={duty.id}
                    onClick={() => handleNewSwap(duty)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                      {dutyStaff ? getInitials(dutyStaff.full_name) : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dutyStaff?.full_name ?? 'Atanmamış'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatShortDate(duty.duty_date)} · {SHIFT_LABELS[duty.shift_type] ?? duty.shift_type} · {duty.start_time.slice(0, 5)}-{duty.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <ArrowLeftRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors shrink-0" />
                  </button>
                );
              })
            )}
          </div>
          {swappableDuties.length > 30 && (
            <p className="mt-2 text-xs text-gray-400">İlk 30 nöbet gösteriliyor. Daha fazla için takvimden seçim yapınız.</p>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 animate-fade-in-up">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center animate-fade-in-up">
              <ArrowLeftRight className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="mt-3 text-sm font-medium text-gray-500">
                {filterStatus === 'all' ? 'Henüz değişim talebi yok' : 'Bu filtrede talep bulunmuyor'}
              </p>
            </div>
          ) : (
            enrichedRequests.map((request, i) => {
              const cfg = STATUS_CONFIG[request.status];
              const StatusIcon = cfg.icon;
              const duty = request.duty;
              const fromStaff = request.from_staff;
              const toStaff = request.to_staff;
              const isPending = request.status === 'pending';

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Status badge */}
                    <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:w-32 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 hidden lg:block">
                        {formatDateTime(request.created_at)}
                      </span>
                    </div>

                    {/* Swap content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* From staff */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {fromStaff ? getInitials(fromStaff.full_name) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{fromStaff?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{fromStaff?.title}</p>
                          </div>
                        </div>

                        <ArrowLeftRight className="w-4 h-4 text-gray-300 shrink-0" />

                        {/* To staff */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                            {toStaff ? getInitials(toStaff.full_name) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{toStaff?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{toStaff?.title}</p>
                          </div>
                        </div>
                      </div>

                      {/* Duty info */}
                      {duty && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatShortDate(duty.duty_date)}</span>
                          <span className="text-gray-300">·</span>
                          <span>{SHIFT_LABELS[duty.shift_type] ?? duty.shift_type}</span>
                          <span className="text-gray-300">·</span>
                          <span>{duty.start_time.slice(0, 5)} - {duty.end_time.slice(0, 5)}</span>
                          {duty.duty_groups && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: duty.duty_groups.color }} />
                                {duty.duty_groups.name}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Reason */}
                      {request.reason && (
                        <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                          <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <span>{request.reason}</span>
                        </div>
                      )}

                      {/* Resolved timestamp */}
                      {request.resolved_at && (
                        <p className="mt-2 text-xs text-gray-400">
                          {request.status === 'approved' ? 'Onaylanma' : 'Reddedilme'} tarihi: {formatDateTime(request.resolved_at)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-col lg:items-end shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={actionLoading === request.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === request.id ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CircleCheck className="w-3.5 h-3.5" />
                            )}
                            Onayla
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            disabled={actionLoading === request.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <CircleX className="w-3.5 h-3.5" />
                            Reddet
                          </button>
                        </>
                      )}
                      {!isPending && (
                        <button
                          onClick={() => handleDelete(request)}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 text-sm font-medium transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          {actionLoading === request.id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <SwapRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitSwap}
        duty={selectedDuty}
        staff={staff}
        dutyGroups={dutyGroups}
        duties={duties}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
