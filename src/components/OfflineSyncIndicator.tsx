import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  ShieldCheck,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import { offlineSyncManager, OfflineSyncState } from '../services/offlineSyncManager';
import { useToast } from './ToastContext';

export const useOfflineSync = () => {
  const [state, setState] = useState<OfflineSyncState>(offlineSyncManager.getState());

  useEffect(() => {
    const unsub = offlineSyncManager.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  const triggerSync = async (isManual = true) => {
    return await offlineSyncManager.syncAll(isManual);
  };

  return { ...state, triggerSync };
};

interface OfflineSyncIndicatorProps {
  compact?: boolean;
  className?: string;
  showDetailsButton?: boolean;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({
  compact = false,
  className = '',
  showDetailsButton = true,
}) => {
  const { isOnline, isSyncing, lastSyncedTime, lastSyncedRelative, pendingCount, pendingChanges, triggerSync } =
    useOfflineSync();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncStatusMsg('Menyinkronkan data...');
    const res = await triggerSync(true);
    if (res.success) {
      toast.success(res.message, 'Sinkronisasi Berhasil');
      setSyncStatusMsg('Sinkronisasi selesai!');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } else {
      toast.error(res.message, 'Pemberitahuan Sinkronisasi');
      setSyncStatusMsg(res.message);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  const exactFormattedTime = offlineSyncManager.formatExactTime(lastSyncedTime);

  // Compact indicator for headers/navbars
  if (compact) {
    return (
      <>
        <div
          onClick={() => (showDetailsButton ? setShowModal(true) : handleManualSync())}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
            !isOnline
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : isSyncing
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : pendingCount > 0
              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
              : 'bg-emerald-50/90 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
          } ${className}`}
          title={
            !isOnline
              ? 'Bekerja Offline: Data tersimpan aman di penyimpanan lokal.'
              : `Terakhir disinkronkan: ${exactFormattedTime}`
          }
        >
          {isSyncing ? (
            <RefreshCw size={12} className="animate-spin text-blue-600 shrink-0" />
          ) : !isOnline ? (
            <WifiOff size={12} className="text-amber-600 shrink-0" />
          ) : (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}

          <div className="flex items-center gap-1">
            <span className="hidden sm:inline font-semibold">
              {!isOnline ? 'Offline' : isSyncing ? 'Sinkron...' : 'Sinkron:'}
            </span>
            <span className="font-extrabold text-[11px]">
              {!isOnline ? 'Lokal Aktif' : isSyncing ? 'Memproses' : lastSyncedRelative}
            </span>
          </div>

          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black">
              {pendingCount}
            </span>
          )}
        </div>

        {showModal && (
          <SyncTransparencyModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSync={handleManualSync}
            isOnline={isOnline}
            isSyncing={isSyncing}
            lastSyncedTime={lastSyncedTime}
            lastSyncedRelative={lastSyncedRelative}
            exactFormattedTime={exactFormattedTime}
            pendingCount={pendingCount}
            pendingChanges={pendingChanges}
            syncStatusMsg={syncStatusMsg}
          />
        )}
      </>
    );
  }

  // Expanded banner view
  return (
    <>
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
          !isOnline
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : isSyncing
            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
            : 'bg-slate-50/90 border-slate-200 text-slate-900'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                !isOnline
                  ? 'bg-amber-100 text-amber-800'
                  : isSyncing
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {!isOnline ? (
                <WifiOff size={20} />
              ) : isSyncing ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Wifi size={20} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  {!isOnline
                    ? 'Mode Offline Mandiri (Tersimpan Lokal)'
                    : isSyncing
                    ? 'Menyinkronkan Data...'
                    : 'Sinkronisasi Data Aktif'}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    !isOnline
                      ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {!isOnline ? 'Offline Safe' : 'Online Real-Time'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Clock size={12} className="text-slate-400" />
                  Terakhir Disinkronkan: <strong className="text-slate-800">{lastSyncedRelative}</strong>
                </span>
                {pendingCount > 0 && (
                  <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                    {pendingCount} perubahan antrean offline
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDetailsButton && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Info size={13} />
                <span>Detail</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkron Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <SyncTransparencyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSync={handleManualSync}
          isOnline={isOnline}
          isSyncing={isSyncing}
          lastSyncedTime={lastSyncedTime}
          lastSyncedRelative={lastSyncedRelative}
          exactFormattedTime={exactFormattedTime}
          pendingCount={pendingCount}
          pendingChanges={pendingChanges}
          syncStatusMsg={syncStatusMsg}
        />
      )}
    </>
  );
};

// Transparency Modal explaining data reliability and exact timestamps
const SyncTransparencyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedTime: string | null;
  lastSyncedRelative: string;
  exactFormattedTime: string;
  pendingCount: number;
  pendingChanges: any[];
  syncStatusMsg: string | null;
}> = ({
  onClose,
  onSync,
  isOnline,
  isSyncing,
  lastSyncedRelative,
  exactFormattedTime,
  pendingCount,
  pendingChanges,
  syncStatusMsg,
}) => {
  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shadow-xs">
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Pusat Transparansi & Sinkronisasi Data
              </h3>
              <p className="text-[11px] text-slate-500">SDN Tangerang 6 Digital System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0 pr-1 text-xs">
          {/* Status Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Konektivitas Internet:</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'ONLINE (Terhubung)' : 'OFFLINE (Mode Mandiri)'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Waktu Sinkron Terakhir:</span>
              <strong className="text-slate-900 font-bold">{lastSyncedRelative}</strong>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <Clock size={12} className="text-indigo-600 shrink-0" />
              <span>{exactFormattedTime}</span>
            </div>
          </div>

          {/* Reliability Explanation Card */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Jaminan Keamanan & Keandalan Data Offline</span>
            </div>
            <p className="text-indigo-950/80 text-[11px] leading-relaxed">
              Aplikasi ini beroperasi dengan arsitektur <em>Offline-First</em>. Semua input nilai siswa, kehadiran,
              transaksi inventaris, dan pembuatan dokumen tersimpan seketika di memori lokal terenkripsi perangkat Anda
              sehingga tetap aman tanpa risiko kehilangan data saat jaringan putus.
            </p>
          </div>

          {/* Pending Changes Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                Antrean Perubahan Tertunda ({pendingCount})
              </span>
              {pendingCount > 0 && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  Menunggu Sinkronisasi
                </span>
              )}
            </div>

            {pendingChanges.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
                <CheckCircle2 size={20} className="text-emerald-600 mx-auto" />
                <p className="text-emerald-900 font-bold text-xs">Semua Data Telah Sinkron Sempurna</p>
                <p className="text-emerald-700 text-[10px]">
                  Tidak ada antrean perubahan offline. Data lokal dan cloud selaras.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {pendingChanges.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{item.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {syncStatusMsg && (
            <div className="p-2.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold text-center animate-in fade-in">
              {syncStatusMsg}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
