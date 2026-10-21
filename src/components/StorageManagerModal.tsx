import React, { useState, useEffect } from 'react';
import {
  HardDrive, Zap, Trash2, CheckCircle2, AlertTriangle, X, RefreshCw,
  FileImage, ShieldCheck, Database, Layers, ArrowDownRight, Sparkles
} from 'lucide-react';
import { mediaStorageService, StorageBreakdown } from '../services/mediaStorageService';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose }) => {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<{ freedFormatted: string; removedItems: number } | null>(null);
  const [testCompressionResult, setTestCompressionResult] = useState<{
    originalSize: string;
    compressedSize: string;
    ratio: number;
  } | null>(null);

  const loadData = () => {
    const data = mediaStorageService.getStorageBreakdown();
    setBreakdown(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setOptimizeResult(null);
      setTestCompressionResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !breakdown) return null;

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const result = mediaStorageService.optimizeStorage();
      loadData();
      setIsOptimizing(false);
      setOptimizeResult({
        freedFormatted: result.freedFormatted,
        removedItems: result.removedItems,
      });
    }, 600);
  };

  const handleTestCompressUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await mediaStorageService.compressImage(file);
      setTestCompressionResult({
        originalSize: mediaStorageService.formatBytes(res.originalSize),
        compressedSize: mediaStorageService.formatBytes(res.compressedSize),
        ratio: res.compressionRatio,
      });
    } catch (err) {
      alert('Gagal mengompres gambar: ' + String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Manajemen Penyimpanan & Kompresi Cerdas</h3>
              <p className="text-xs text-emerald-200">
                Kapasitas Memori Offline, Optimasi Cache & Proteksi Kuota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Storage Meter Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-slate-700" />
                <span className="text-sm font-bold text-slate-800">Total Penggunaan Memori Browser</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
                {breakdown.totalFormatted} / ~10 MB
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex">
                {breakdown.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                    title={`${cat.name}: ${cat.formatted} (${cat.percentage}%)`}
                    className="h-full transition-all duration-500"
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>{breakdown.usagePercentage}% Terpakai</span>
                <span className="text-emerald-800 font-bold">Status: Sangat Aman & Lapang</span>
              </div>
            </div>

            {/* Category Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {breakdown.categories.map((cat, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-700 truncate">{cat.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cat.formatted} ({cat.percentage}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Optimizer Action */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-800" />
                <h4 className="text-sm font-bold text-slate-900">1-Click Pembersih Cache & Log Lama</h4>
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                Membersihkan preview foto sementara, antrean sinkronisasi lama, dan merapikan log audit tanpa menghapus data penting sekolah.
              </p>
            </div>
            <button
              onClick={handleRunOptimizer}
              disabled={isOptimizing}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isOptimizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>{isOptimizing ? 'Mengoptimalkan...' : 'Jalankan Optimasi'}</span>
            </button>
          </div>

          {optimizeResult && (
            <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-800 shrink-0" />
              <div>
                <strong className="font-bold">Optimasi Berhasil:</strong> Berhasil membersihkan{' '}
                {optimizeResult.freedFormatted} memori dari {optimizeResult.removedItems} item cache yang tidak terpakai.
              </div>
            </div>
          )}

          {/* Auto Image Compression Feature Test */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <FileImage size={18} className="text-blue-700" />
              <h4 className="text-sm font-bold text-slate-900">Teknologi Kompresi Otomatis</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap foto bukti kuitansi barang, foto profil siswa, atau bukti fisik tugas yang diunggah otomatis diperkecil resolusinya (maks. 1280px) dan dikompres hingga <strong>80–90% lebih hemat memori</strong> tanpa mengurangi ketajaman teks.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                <FileImage size={14} />
                <span>Uji Kompresi Foto</span>
                <input type="file" accept="image/*" onChange={handleTestCompressUpload} className="hidden" />
              </label>

              {testCompressionResult && (
                <div className="flex items-center gap-2 text-xs font-mono bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl">
                  <span>{testCompressionResult.originalSize}</span>
                  <ArrowDownRight size={14} className="text-emerald-800 font-bold" />
                  <span className="font-bold text-emerald-800">{testCompressionResult.compressedSize}</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
                    Hemat {testCompressionResult.ratio}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
