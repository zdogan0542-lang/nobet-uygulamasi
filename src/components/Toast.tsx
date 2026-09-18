import { useEffect } from 'react';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastProps = {
  toast: ToastMessage | null;
  onClose: () => void;
};

const config = {
  success: { icon: CircleCheck, cls: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  error: { icon: CircleX, cls: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50' },
  info: { icon: Info, cls: 'text-brand-600', border: 'border-brand-200', bg: 'bg-brand-50' },
} as const;

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const cfg = config[toast.type];
  const Icon = cfg.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border ${cfg.border} ${cfg.bg} shadow-lg max-w-sm`}>
        <Icon className={`w-5 h-5 ${cfg.cls} shrink-0`} />
        <p className="text-sm font-medium text-gray-900 flex-1">{toast.message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
