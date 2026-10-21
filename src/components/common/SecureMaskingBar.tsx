import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, Unlock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useDataMasking } from '../../hooks/useDataMasking';
import { maskingService } from '../../services/maskingService';

interface SecureMaskingBarProps {
  compact?: boolean;
  className?: string;
  scopeLabel?: string;
}

export const SecureMaskingBar: React.FC<SecureMaskingBarProps> = ({
  compact = false,
  className = '',
  scopeLabel = 'Data Siswa & Kredensial',
}) => {
  const { isGlobalMasking, toggleGlobalMasking } = useDataMasking();
  const [showAuditModal, setShowAuditModal] = useState(false);

  const auditLogs = maskingService.getAuditLogs();

  return (
    <>
      <div
        className={`bg-gradient-to-r ${
          isGlobalMasking
            ? 'from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-900/50'
            : 'from-amber-950 via-slate-900 to-amber-950 text-amber-100 border-amber-800/60'
        } p-3 sm:p-3.5 rounded-2xl border shadow-sm transition-all duration-200 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isGlobalMasking
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isGlobalMasking ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-wide">
                  Secure Data Masking & Anti-Exfiltration
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isGlobalMasking
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isGlobalMasking ? (
                    <>
                      <Lock size={10} /> TERLINDUNGI
                    </>
                  ) : (
                    <>
                      <Unlock size={10} /> REVEAL MODE
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {isGlobalMasking
                  ? `Data NIS, Email, & Data Pribadi pada ${scopeLabel} disamarkan secara otomatis. Klik ikon mata untuk melihat data per-item.`
                  : `Seluruh data pada ${scopeLabel} terbuka sementara. Harap jaga kerahasiaan layar.`}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* DLP Information Tag */}
            <div className="hidden lg:flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded-lg text-slate-300 border border-white/5">
              <Lock size={10} className="text-indigo-300" />
              <span>Copy & Klik Kanan Dinonaktifkan</span>
            </div>

            {/* Audit Log Trigger */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer text-xs"
              title="Lihat Log Audit DLP & Masking"
            >
              <FileText size={14} />
            </button>

            {/* Master Toggle Button */}
            <button
              type="button"
              onClick={toggleGlobalMasking}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isGlobalMasking
                  ? 'bg-white hover:bg-slate-100 text-slate-900'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
              }`}
            >
              {isGlobalMasking ? (
                <>
                  <Eye size={13} />
                  <span>Buka Semua Data</span>
                </>
              ) : (
                <>
                  <EyeOff size={13} />
                  <span>Kunci & Samarkan Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Log Audit Perlindungan Data (DLP)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Riwayat buka-tutup data dan percobaan eksfiltrasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada aktivitas tercatat. Semua data aman terlindungi.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-start gap-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                        log.action.includes('PREVENT')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : log.action === 'REVEAL'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {log.action}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-[11px]">
                        {log.details || log.fieldName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                Pencegahan eksfiltrasi data melindungi NIS, NISN, Email, dan informasi identitas peserta didik sesuai standar perlindungan data pribadi (PDP).
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
