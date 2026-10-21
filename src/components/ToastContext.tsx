import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  confirm: (options: ConfirmDialogOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = React.useMemo(
    () => ({
      success: (message: string, title?: string) => addToast('success', message, title),
      error: (message: string, title?: string) => addToast('error', message, title, 5000),
      info: (message: string, title?: string) => addToast('info', message, title),
      warning: (message: string, title?: string) => addToast('warning', message, title, 4000),
    }),
    [addToast]
  );

  // Safely hook window.alert to non-blocking elegant toasts for seamless iFrame compatibility
  React.useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const messageStr = typeof msg === 'string' ? msg : String(msg ?? '');
      if (messageStr.toLowerCase().includes('gagal') || messageStr.toLowerCase().includes('error') || messageStr.toLowerCase().includes('habis')) {
        toast.error(messageStr, 'Pemberitahuan Sistem');
      } else if (messageStr.toLowerCase().includes('berhasil') || messageStr.toLowerCase().includes('sukses')) {
        toast.success(messageStr, 'Berhasil');
      } else if (messageStr.toLowerCase().includes('peringatan') || messageStr.toLowerCase().includes('wajib') || messageStr.toLowerCase().includes('mohon')) {
        toast.warning(messageStr, 'Perhatian');
      } else {
        toast.info(messageStr, 'Informasi');
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [toast]);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const handleConfirmAction = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog) {
      if (confirmDialog.onCancel) confirmDialog.onCancel();
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Floating Toasts View */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => {
          let bgClass = 'bg-emerald-900 border-emerald-700 text-white';
          let icon = <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />;

          if (t.type === 'error') {
            bgClass = 'bg-rose-950 border-rose-800 text-white';
            icon = <AlertCircle size={18} className="text-rose-300 shrink-0" />;
          } else if (t.type === 'warning') {
            bgClass = 'bg-amber-950 border-amber-800 text-white';
            icon = <AlertTriangle size={18} className="text-amber-300 shrink-0" />;
          } else if (t.type === 'info') {
            bgClass = 'bg-slate-900 border-slate-700 text-white';
            icon = <Info size={18} className="text-sky-300 shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl p-3.5 shadow-2xl border flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200 ${bgClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                {t.title && <div className="text-xs font-black tracking-tight leading-none mb-1">{t.title}</div>}
                <div className="text-xs text-slate-100 font-medium leading-relaxed">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-white/60 hover:text-white p-0.5 rounded-lg transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 text-center">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-100 text-rose-700'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {confirmDialog.variant === 'danger' ? (
                  <ShieldAlert size={26} />
                ) : confirmDialog.variant === 'warning' ? (
                  <AlertTriangle size={26} />
                ) : (
                  <CheckCircle2 size={26} />
                )}
              </div>
              <h3 className="text-base font-black text-slate-900">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>

            <div className="flex gap-2.5 p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelAction}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                {confirmDialog.cancelLabel || 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-colors shadow-xs ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-emerald-800 hover:bg-emerald-900'
                }`}
              >
                {confirmDialog.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
