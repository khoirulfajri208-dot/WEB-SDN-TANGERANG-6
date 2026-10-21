import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CloudUpload,
  CloudDownload,
  GitMerge,
  Loader2,
  X,
  Clock,
  CheckCircle,
  Wifi
} from 'lucide-react';
import { useOfflineSync } from './OfflineSyncIndicator';
import { offlineSyncManager } from '../services/offlineSyncManager';
import { useToast } from './ToastContext';

export const DataReconciliationDialog: React.FC = () => {
  const { reconciliationRequired, pendingChanges, pendingCount, lastSyncedRelative } = useOfflineSync();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'FORCE_PUSH' | 'FORCE_PULL' | 'MERGE' | null>(null);

  useEffect(() => {
    if (reconciliationRequired) {
      setIsOpen(true);
    }
  }, [reconciliationRequired]);

  if (!isOpen) return null;

  const handleResolve = async (choice: 'FORCE_PUSH' | 'FORCE_PULL' | 'MERGE') => {
    setSelectedChoice(choice);
    setIsProcessing(true);
    try {
      const res = await offlineSyncManager.resolveReconciliation(choice);
      if (res.success) {
        toast.success(res.message, 'Rekonsiliasi Sukses');
        setIsOpen(false);
      } else {
        toast.error(res.message, 'Rekonsiliasi Gagal');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan rekonsiliasi.', 'Error');
    } finally {
      setIsProcessing(false);
      setSelectedChoice(null);
    }
  };

  return (
    <div id="reconciliation-modal" className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 p-5 shrink-0 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
            <AlertTriangle size={24} className="animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-black tracking-wide uppercase">
                Konflik Koneksi Kembali
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold">
                <Wifi size={12} className="text-emerald-600 shrink-0" /> Online Kembali
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-snug">
              Butuh Rekonsiliasi &amp; Penyelarasan Data
            </h3>
            <p className="text-xs text-amber-900/80 mt-0.5">
              Anda baru saja terhubung kembali ke internet. Terdapat <strong>{pendingCount} perubahan lokal</strong> yang dikerjakan saat offline yang mungkin bertabrakan dengan data remote di Google Sheets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-amber-900/60 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition cursor-pointer"
            disabled={isProcessing}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700 min-h-0">
          
          {/* Audit Timestamp Check */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <Clock size={16} className="text-slate-500 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-800">Sinkronisasi Terakhir Sebelum Putus</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{lastSyncedRelative}</div>
            </div>
          </div>

          {/* Pending Changes List */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Daftar Perubahan Lokal Terdeteksi ({pendingCount})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
              {pendingChanges.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-medium">Tidak ada rincian perubahan.</div>
              ) : (
                pendingChanges.map((chg) => (
                  <div key={chg.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-[11px]">{chg.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block">
                        {new Date(chg.timestamp).toLocaleTimeString('id-ID')} - {chg.id}
                      </span>
                    </div>
                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-100 uppercase shrink-0">
                      {chg.type.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reconciliation Options */}
          <div className="space-y-2.5">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Pilih Aturan Penyelesaian Konflik
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Force Push */}
              <button
                type="button"
                onClick={() => handleResolve('FORCE_PUSH')}
                disabled={isProcessing}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer select-none active:scale-98 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors shadow-2xs">
                  {isProcessing && selectedChoice === 'FORCE_PUSH' ? (
                    <Loader2 size={18} className="animate-spin text-emerald-800" />
                  ) : (
                    <CloudUpload size={18} />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-xs">Gunakan Lokal</div>
                <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Unggah paksa data lokal. Menimpa data di Google Sheets dengan perubahan baru perangkat ini.
                </div>
              </button>

              {/* Option 2: Force Pull */}
              <button
                type="button"
                onClick={() => handleResolve('FORCE_PULL')}
                disabled={isProcessing}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer select-none active:scale-98 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors shadow-2xs">
                  {isProcessing && selectedChoice === 'FORCE_PULL' ? (
                    <Loader2 size={18} className="animate-spin text-blue-800" />
                  ) : (
                    <CloudDownload size={18} />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-xs">Tarik dari Cloud</div>
                <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Tarik data cloud terbaru. Batalkan semua perubahan lokal offline dan timpa dengan spreadsheet.
                </div>
              </button>

              {/* Option 3: Merge */}
              <button
                type="button"
                onClick={() => handleResolve('MERGE')}
                disabled={isProcessing}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all cursor-pointer select-none active:scale-98 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors shadow-2xs">
                  {isProcessing && selectedChoice === 'MERGE' ? (
                    <Loader2 size={18} className="animate-spin text-indigo-800" />
                  ) : (
                    <GitMerge size={18} />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-xs">Gabung Otomatis</div>
                <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Penyelarasan cerdas dua arah. Mencoba menggabungkan perubahan tanpa menghapus data.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-slate-400" />
            <span>Pilihan Anda direkam dalam audit log sistem.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer disabled:opacity-50 text-xs"
          >
            Tunda Rekonsiliasi
          </button>
        </div>
      </div>
    </div>
  );
};
