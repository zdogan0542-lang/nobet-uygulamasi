import { useState, useEffect } from 'react';
import { TriangleAlert, Trash2, X, Loader } from 'lucide-react';
import type { Staff } from '@/lib/supabase';

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  staff: Staff | null;
  upcomingCount: number;
  loadingCount: boolean;
};

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  staff,
  upcomingCount,
  loadingCount,
}: DeleteConfirmModalProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  if (!open || !staff) return null;

  const hasUpcoming = upcomingCount > 0;

  async function handleConfirm() {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Personel Sil</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{staff.full_name}</span> adlı personeli silmek üzeresiniz.
            Bu işlem geri alınamaz.
          </p>

          {loadingCount ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              Nöbet kayıtları kontrol ediliyor...
            </div>
          ) : hasUpcoming ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Yaklaşan nöbet uyarısı</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Bu personelin <span className="font-semibold">{upcomingCount}</span> yaklaşan/aktif nöbeti bulunuyor.
                  Silme işlemi bu nöbet atamalarını boşaltacaktır.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <TriangleAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">
                Bu personelin yaklaşan nöbeti bulunmuyor. Güvenle silebilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? (
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
  );
}
