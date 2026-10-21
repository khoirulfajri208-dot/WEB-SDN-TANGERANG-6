import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Database,
  Radio,
  Clock,
  Layers,
  HardDrive,
  Users,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { firebaseService, FirebaseSyncStatus } from '../services/firebaseService';

interface FirebaseCloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseCloudSyncModal: React.FC<FirebaseCloudSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<FirebaseSyncStatus>(firebaseService.getStatus());
  const [loadingAction, setLoadingAction] = useState<'push' | 'pull' | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = firebaseService.subscribe(() => {
      setStatus(firebaseService.getStatus());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handlePush = async () => {
    setLoadingAction('push');
    setToastMessage(null);
    const res = await firebaseService.pushAllToCloud(true);
    setLoadingAction(null);
    if (res.success) {
      setToastMessage({ type: 'success', text: res.message });
    } else {
      setToastMessage({ type: 'error', text: res.message });
    }
  };

  const handlePull = async () => {
    setLoadingAction('pull');
    setToastMessage(null);
    const res = await firebaseService.pullAllFromCloud();
    setLoadingAction(null);
    if (res.success) {
      setToastMessage({ type: 'success', text: res.message });
    } else {
      setToastMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Cloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Firebase Firestore Cloud
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Realtime Live
                </span>
              </div>
              <h3 className="text-base font-black mt-1">Sinkronisasi Database Cloud Terpusat</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
          {toastMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{toastMessage.text}</span>
            </div>
          )}

          {/* Connection Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">Status Sinkronisasi Multi-Perangkat</div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <Clock size={12} /> Terakhir Disinkronkan: <strong className="text-slate-700">{status.lastSyncTime || 'Belum tersinkron'}</strong>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> AKTIF
            </span>
          </div>

          {/* Statistics Grid */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Modul Data Terhubung di Cloud
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <HardDrive size={13} className="text-blue-600" /> Barang & Aset
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {(status.cloudStats.inventoryItems || 0) + (status.cloudStats.assets || 0)}
                </div>
                <span className="text-[9px] text-slate-400">Item Inventaris</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Layers size={13} className="text-emerald-600" /> Transaksi
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {status.cloudStats.transactions || 0}
                </div>
                <span className="text-[9px] text-slate-400">Masuk & Keluar</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <BookOpen size={13} className="text-purple-600" /> Kelas & Tugas
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {status.cloudStats.assignments || 0}
                </div>
                <span className="text-[9px] text-slate-400">Penugasan Siswa</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Users size={13} className="text-amber-600" /> Siswa Terdaftar
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {status.cloudStats.students || 0}
                </div>
                <span className="text-[9px] text-slate-400">Akun Siswa</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Operasi Sinkronisasi Manual
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Push Button */}
              <button
                onClick={handlePush}
                disabled={Boolean(loadingAction)}
                className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-900 font-bold transition flex flex-col items-start gap-1 shadow-2xs group disabled:opacity-50 text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-black text-blue-800">
                    <CloudUpload size={16} /> Unggah ke Cloud
                  </span>
                  {loadingAction === 'push' && <RefreshCw size={14} className="animate-spin text-blue-600" />}
                </div>
                <p className="text-[11px] text-blue-700/80 font-normal">
                  Kirim perubahan data lokal (inventaris, kelas, nilai) ke server Firebase Firestore.
                </p>
              </button>

              {/* Pull Button */}
              <button
                onClick={handlePull}
                disabled={Boolean(loadingAction)}
                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-bold transition flex flex-col items-start gap-1 shadow-2xs group disabled:opacity-50 text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                    <CloudDownload size={16} /> Unduh dari Cloud
                  </span>
                  {loadingAction === 'pull' && <RefreshCw size={14} className="animate-spin text-emerald-600" />}
                </div>
                <p className="text-[11px] text-emerald-700/80 font-normal">
                  Tarik salinan data terbaru dari server Cloud ke penyimpanan browser perangkat ini.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Database size={13} className="text-slate-400" />
            <span>Database ID: <strong>ai-studio-bendaharabarang</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
