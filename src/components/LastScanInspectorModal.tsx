import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  History,
  UserCheck,
  BookOpen,
  Package,
  QrCode,
  Clock,
  Volume2,
  Mic,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Edit3,
  ExternalLink,
  Scan,
} from 'lucide-react';
import { RecentScanItem } from './QRScannerModal';
import { Account } from '../types/classroom';
import { accountService } from '../services/accountService';
import { playFeedback } from '../utils/feedback';

export interface LastScanInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastScan: RecentScanItem | null;
  savedVoiceNotes?: Record<string, string>;
  onOpenQuickVoiceNote?: (item: RecentScanItem) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToAssignments?: (studentObj?: Account) => void;
  onQuickGrade?: (studentObj: Account) => void;
  onRescanMode?: (mode: 'STUDENT' | 'ASSIGNMENT' | 'ASSET' | 'ALL') => void;
}

export const LastScanInspectorModal: React.FC<LastScanInspectorModalProps> = ({
  isOpen,
  onClose,
  lastScan,
  savedVoiceNotes = {},
  onOpenQuickVoiceNote,
  onNavigateToAttendance,
  onNavigateToAssignments,
  onQuickGrade,
  onRescanMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!lastScan?.code) return;
    try {
      navigator.clipboard.writeText(lastScan.code);
      setCopied(true);
      playFeedback('click');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handlePlayVoiceNote = () => {
    if (!lastScan?.code || !savedVoiceNotes[lastScan.code]) return;
    try {
      const audio = new Audio(savedVoiceNotes[lastScan.code]);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play();
    } catch (err) {
      console.error('Error playing voice note:', err);
      setIsPlayingAudio(false);
    }
  };

  const typeConfig = (() => {
    if (!lastScan) {
      return {
        label: 'Tidak Ada Scan',
        badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
        iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
        Icon: History,
      };
    }
    const t = lastScan.type;
    if (t === 'STUDENT') {
      return {
        label: 'Presensi Siswa',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        Icon: UserCheck,
      };
    }
    if (t === 'ASSIGNMENT') {
      return {
        label: 'Tugas / Soal CBT',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        Icon: BookOpen,
      };
    }
    if (t === 'ASSET') {
      return {
        label: 'Aset / Sarpras',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        Icon: Package,
      };
    }
    return {
      label: 'QR Code Umum',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      Icon: QrCode,
    };
  })();

  const TypeIcon = typeConfig.Icon;

  const timeAgo = lastScan
    ? (() => {
        const diffSec = Math.floor((Date.now() - lastScan.timestamp) / 1000);
        if (diffSec < 60) return 'Baru saja';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit yang lalu`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam yang lalu`;
        return new Date(lastScan.timestamp).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      })()
    : '-';

  const studentObj = lastScan?.id ? accountService.getAccountById(lastScan.id) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <History size={17} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Hasil Pindai Terakhir</span>
                  <Sparkles size={13} className="text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400">Inspeksi detail & aksi cepat hasil scan QR</p>
              </div>
            </div>
            <button
              id="btn-close-last-scan-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {lastScan ? (
              <>
                {/* Main Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${typeConfig.iconBg}`}>
                        <TypeIcon size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${typeConfig.badgeClass}`}>
                          {typeConfig.label}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {lastScan.title || lastScan.code}
                        </h4>
                        {lastScan.subtitle && (
                          <p className="text-xs text-slate-400 truncate">{lastScan.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Code and Timestamp Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Kode QR / ID</span>
                      <div className="flex items-center justify-between mt-0.5 gap-1">
                        <span className="font-mono font-bold text-emerald-400 truncate text-[11px]">
                          {lastScan.code}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer shrink-0"
                          title="Salin Kode"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Waktu Pemindaian</span>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-300 text-[11px] font-semibold">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Note Section */}
                  {savedVoiceNotes[lastScan.code] && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300">
                          <Volume2 size={14} />
                        </div>
                        <span className="text-[11px] text-purple-200 font-bold">Catatan Suara Terlampir</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePlayVoiceNote}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-purple-500 text-white animate-pulse'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        <Volume2 size={12} />
                        <span>{isPlayingAudio ? 'Memutar...' : 'Putar Audio'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Aksi Lanjutan Cepat
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lastScan.type === 'STUDENT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToAttendance?.();
                          }}
                          className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck size={15} className="text-emerald-400" />
                            <span>Presensi Siswa</span>
                          </div>
                          <ChevronRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (studentObj) {
                              onQuickGrade?.(studentObj);
                            } else {
                              onNavigateToAssignments?.();
                            }
                          }}
                          className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Edit3 size={15} className="text-blue-400" />
                            <span>Beri Nilai Cepat</span>
                          </div>
                          <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </>
                    )}

                    {lastScan.type === 'ASSIGNMENT' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToAssignments?.();
                        }}
                        className="col-span-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-between group cursor-pointer shadow-lg shadow-blue-900/40"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen size={15} />
                          <span>Buka Lembar Tugas & Penilaian</span>
                        </div>
                        <ExternalLink size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenQuickVoiceNote?.(lastScan);
                      }}
                      className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mic size={15} className="text-purple-400" />
                        <span>Catat Audio</span>
                      </div>
                      <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRescanMode?.(lastScan.type === 'OTHER' ? 'ALL' : lastScan.type);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Scan size={15} className="text-amber-400" />
                        <span>Pindai Lagi</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center border border-slate-700">
                  <History size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Pemindaian</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Gunakan scanner QR untuk memindai kartu presensi siswa, lembar tugas, atau stiker inventaris aset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRescanMode?.('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/50 inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Scan size={15} />
                  <span>Mulai Pindai Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
