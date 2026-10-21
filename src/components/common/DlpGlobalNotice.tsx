import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { maskingService, DlpAlert } from '../../services/maskingService';

export const DlpGlobalNotice: React.FC = () => {
  const [alert, setAlert] = useState<DlpAlert | null>(null);

  useEffect(() => {
    const unsub = maskingService.subscribeDlpAlert((newAlert) => {
      setAlert(newAlert);
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      setAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-md w-full px-4 pointer-events-none animate-slide-up">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-rose-500/40 flex items-start gap-3 pointer-events-auto backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
          <ShieldAlert size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-rose-300 uppercase tracking-wider">
              Data Loss Prevention (DLP)
            </span>
            <button
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
            {alert.message}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            Tindakan diblokir otomatis oleh Secure Data Masking Service
          </div>
        </div>
      </div>
    </div>
  );
};
