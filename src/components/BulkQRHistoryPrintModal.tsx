import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  Search,
  CheckSquare,
  Square,
  Sliders,
  FileText,
  User,
  BookOpen,
  Package,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Eye,
  List,
  Copy,
  FileSpreadsheet,
  Calendar,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RecentScanItem } from './QRScannerModal';
import { pdfService } from '../services/pdfService';
import { playFeedback } from '../utils/feedback';
import { db } from '../services/localStorageService';
import { dailyScanSchedulerService } from '../services/dailyScanSchedulerService';

export interface BulkQRHistoryPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  scans: RecentScanItem[];
  initialSelectedIds?: string[];
  operatorName?: string;
  operatorRole?: string;
}

export const BulkQRHistoryPrintModal: React.FC<BulkQRHistoryPrintModalProps> = ({
  isOpen,
  onClose,
  scans,
  initialSelectedIds = [],
  operatorName,
  operatorRole,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STUDENT' | 'ASSIGNMENT' | 'ASSET' | 'OTHER'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [activeTab, setActiveTab] = useState<'list' | 'preview'>('list');

  // PDF Configuration Settings
  const [showSettings, setShowSettings] = useState(false);
  const [docTitle, setDocTitle] = useState('LAPORAN REKAPITULASI & LOG PEMINDAIAN QR CODE');
  const [paperSize, setPaperSize] = useState<'a4' | 'f4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [themeColor, setThemeColor] = useState<'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber'>('emerald');
  const [operator, setOperator] = useState(operatorName || 'Petugas Operator QR');
  const [role, setRole] = useState(operatorRole || 'Pengawas / Guru Piket');
  const [notes, setNotes] = useState('');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeVerificationQR, setIncludeVerificationQR] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Initialize selected IDs on open
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedIds.length > 0) {
        setSelectedIds(new Set(initialSelectedIds));
      } else {
        // Default: select all scans
        setSelectedIds(new Set(scans.map((s) => s.id)));
      }
      setSuccessNotice(null);
      setCopiedCodes(false);
    }
  }, [isOpen, initialSelectedIds, scans]);

  // Update default operator from db if not provided
  useEffect(() => {
    if (!operatorName) {
      try {
        const config = db.getConfig();
        if (config.WAREHOUSE_OFFICER) {
          setOperator(config.WAREHOUSE_OFFICER);
        }
      } catch {}
    }
  }, [operatorName]);

  // Filtered list based on search, category, and date
  const filteredScans = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return scans.filter((item) => {
      // Date filter check
      if (dateFilter === 'TODAY') {
        const isToday = now - item.timestamp < oneDayMs;
        if (!isToday) return false;
      } else if (dateFilter === '7DAYS') {
        const isPastWeek = now - item.timestamp < 7 * oneDayMs;
        if (!isPastWeek) return false;
      } else if (dateFilter === '30DAYS') {
        const isPastMonth = now - item.timestamp < 30 * oneDayMs;
        if (!isPastMonth) return false;
      }

      // Category check
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'OTHER') {
          if (item.type === 'STUDENT' || item.type === 'ASSIGNMENT' || item.type === 'ASSET') {
            return false;
          }
        } else if (item.type !== categoryFilter) {
          return false;
        }
      }

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || '').toLowerCase().includes(q);
      const matchPayload = (item.rawPayload || '').toLowerCase().includes(q);

      return matchTitle || matchCode || matchSubtitle || matchPayload;
    });
  }, [scans, categoryFilter, dateFilter, searchQuery]);

  // Selected scan objects
  const selectedScans = useMemo(() => {
    return scans.filter((s) => selectedIds.has(s.id));
  }, [scans, selectedIds]);

  // Selection statistics
  const stats = useMemo(() => {
    const student = selectedScans.filter((s) => s.type === 'STUDENT').length;
    const assignment = selectedScans.filter((s) => s.type === 'ASSIGNMENT').length;
    const asset = selectedScans.filter((s) => s.type === 'ASSET').length;
    const other = selectedScans.filter(
      (s) => s.type !== 'STUDENT' && s.type !== 'ASSIGNMENT' && s.type !== 'ASSET'
    ).length;

    return { total: selectedScans.length, student, assignment, asset, other };
  }, [selectedScans]);

  // Toggle single item
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered items
  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredScans.forEach((s) => next.add(s.id));
      return next;
    });
    playFeedback('click');
  };

  // Deselect all filtered items
  const handleDeselectFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredScans.forEach((s) => next.delete(s.id));
      return next;
    });
    playFeedback('click');
  };

  // Invert selection among filtered items
  const handleInvertFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredScans.forEach((s) => {
        if (next.has(s.id)) next.delete(s.id);
        else next.add(s.id);
      });
      return next;
    });
    playFeedback('click');
  };

  const isAllFilteredSelected =
    filteredScans.length > 0 && filteredScans.every((s) => selectedIds.has(s.id));

  // Copy selected QR codes to clipboard
  const handleCopyCodes = () => {
    if (selectedScans.length === 0) return;
    const codes = selectedScans.map((s) => s.code).join('\n');
    navigator.clipboard.writeText(codes);
    setCopiedCodes(true);
    playFeedback('success');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Export selected to CSV (Excel compatible with UTF-8 BOM)
  const handleExportCSV = () => {
    if (selectedScans.length === 0) return;
    playFeedback('click');

    const headers = ['No', 'Tanggal Waktu', 'Kategori', 'Judul', 'Kode QR', 'Keterangan', 'Status'];
    const rows = selectedScans.map((item, idx) => {
      const d = new Date(item.timestamp);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        idx + 1,
        escape(timeStr),
        escape(item.type),
        escape(item.title || ''),
        escape(item.code || ''),
        escape(item.subtitle || ''),
        escape('Terverifikasi'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Scan_QR_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessNotice(`File CSV (${selectedScans.length} data) berhasil diunduh.`);
    playFeedback('success');
  };

  // Export selected to JSON
  const handleExportJSON = () => {
    if (selectedScans.length === 0) return;
    playFeedback('click');

    const dataStr = JSON.stringify(selectedScans, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Scan_QR_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessNotice(`File JSON (${selectedScans.length} data) berhasil diunduh.`);
    playFeedback('success');
  };

  // Export / Print PDF Handler
  const handleGeneratePDF = async (autoPrint: boolean = false) => {
    if (selectedScans.length === 0) {
      playFeedback('warning');
      return;
    }

    setIsGenerating(true);
    setSuccessNotice(null);

    try {
      playFeedback('click');

      const categoryFilterLabel =
        categoryFilter === 'ALL'
          ? 'Semua Kategori Pemindaian'
          : categoryFilter === 'STUDENT'
          ? 'Khusus Presensi Siswa'
          : categoryFilter === 'ASSIGNMENT'
          ? 'Khusus Submisi Tugas Siswa'
          : categoryFilter === 'ASSET'
          ? 'Khusus Verifikasi Inventaris Aset'
          : 'Kategori Lainnya';

      await pdfService.generateQRScanLogsPDF(selectedScans, {
        title: docTitle,
        categoryFilter: categoryFilterLabel,
        paperSize,
        orientation,
        themeColor,
        operatorName: operator,
        operatorRole: role,
        notes: notes.trim() || undefined,
        includeSignatures,
        includeVerificationQR,
        autoPrint,
      });

      playFeedback('success');
      setSuccessNotice(
        autoPrint
          ? `Laporan berhasil disiapkan dan dialog pencetakan (Print) telah dibuka untuk ${selectedScans.length} data pemindaian.`
          : `Dokumen PDF ringkasan (${selectedScans.length} data pemindaian) berhasil diunduh ke perangkat Anda.`
      );
    } catch (err) {
      console.error('Failed to export QR scan logs PDF:', err);
      playFeedback('error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                <Printer size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                    Cetak Massal Riwayat QR Code (Bulk Print PDF)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedScans.length} Terpilih
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Pilih log pemindaian untuk diekspor ke dalam ringkasan dokumen PDF resmi berstandar sekolah.
                </p>
              </div>
            </div>

            {/* View Mode Toggle: List vs Live Paper Preview */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'list'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan daftar entri"
                >
                  <List size={13} />
                  <span className="hidden sm:inline">Daftar Log</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'preview'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Pratinjau visual tata letak kertas cetak"
                >
                  <Eye size={13} />
                  <span className="hidden sm:inline">Pratinjau Kertas</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Tutup dialog"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Success / Info Notification */}
          {successNotice && (
            <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900 font-semibold shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Controls: Search, Category Filters, Selection Toolbar */}
          <div className="p-5 pb-2 space-y-3 border-b border-slate-100 bg-slate-50/50">
            {/* Search + PDF Settings Toggle */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa, tugas, aset, kode QR, atau detail..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Date Presets Dropdown */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                title="Saring rentang tanggal pemindaian"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="TODAY">Hari Ini (24 Jam)</option>
                <option value="7DAYS">7 Hari Terakhir</option>
                <option value="30DAYS">30 Hari Terakhir</option>
              </select>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  showSettings
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Sesuaikan tata letak kertas, orientasi, dan data penandatangan"
              >
                <Sliders size={13} />
                <span>Opsi Format PDF</span>
                {showSettings ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Collapsible Format Settings Strip */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Judul Dokumen
                        </label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Ukuran & Orientasi Kertas
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as any)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="a4">A4 (210×297)</option>
                            <option value="f4">F4 / Folio (215×330)</option>
                            <option value="letter">Letter</option>
                          </select>
                          <select
                            value={orientation}
                            onChange={(e) => setOrientation(e.target.value as any)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="portrait">Tegak (Portrait)</option>
                            <option value="landscape">Mendatar (Landscape)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Tema Warna Dokumen
                        </label>
                        <select
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="emerald">Emerald Green (Resmi Sekolah)</option>
                          <option value="navy">Navy Blue (Formal Klasik)</option>
                          <option value="slate">Slate Dark (Netral Minimalis)</option>
                          <option value="amber">Amber Gold (Elegan)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Nama Operator / Petugas
                        </label>
                        <input
                          type="text"
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Jabatan Petugas
                        </label>
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Catatan Tambahan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Misal: Digunakan untuk arsip mingguan..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pt-2 border-t border-slate-100 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeSignatures}
                          onChange={(e) => setIncludeSignatures(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-slate-700">
                          Sertakan Kolom Tanda Tangan (Kepala Sekolah & Operator)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeVerificationQR}
                          onChange={(e) => setIncludeVerificationQR(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-slate-700">
                          Sertakan QR Validasi Digital Resmi
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Filter Pills & Selection Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    categoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({scans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('STUDENT')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    categoryFilter === 'STUDENT'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <User size={12} />
                  <span>Presensi ({scans.filter((s) => s.type === 'STUDENT').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ASSIGNMENT')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    categoryFilter === 'ASSIGNMENT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen size={12} />
                  <span>Tugas ({scans.filter((s) => s.type === 'ASSIGNMENT').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ASSET')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    categoryFilter === 'ASSET'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Package size={12} />
                  <span>Aset ({scans.filter((s) => s.type === 'ASSET').length})</span>
                </button>
              </div>

              {/* Multi-Selection Controls & Quick Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={isAllFilteredSelected ? handleDeselectFiltered : handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer shadow-3xs"
                  title={isAllFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua entri yang tampil'}
                >
                  {isAllFilteredSelected ? (
                    <>
                      <CheckSquare size={13} className="text-emerald-600" />
                      <span>Batalkan ({filteredScans.length})</span>
                    </>
                  ) : (
                    <>
                      <Square size={13} className="text-slate-400" />
                      <span>Pilih Semua ({filteredScans.length})</span>
                    </>
                  )}
                </button>

                {selectedIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleInvertFiltered}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer shadow-3xs"
                      title="Balikkan pilihan item"
                    >
                      <RotateCcw size={12} />
                      <span>Inversi</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCodes}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer shadow-3xs"
                      title="Salin seluruh kode QR terpilih ke clipboard"
                    >
                      {copiedCodes ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedCodes ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar for Selected Items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <User size={12} /> Presensi
                </span>
                <span className="text-xs font-extrabold text-emerald-900">{stats.student} item</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                  <BookOpen size={12} /> Tugas
                </span>
                <span className="text-xs font-extrabold text-blue-900">{stats.assignment} item</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                  <Package size={12} /> Aset
                </span>
                <span className="text-xs font-extrabold text-amber-900">{stats.asset} item</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                  <QrCode size={12} /> Total Dicetak
                </span>
                <span className="text-xs font-extrabold text-purple-900">{stats.total} item</span>
              </div>
            </div>
          </div>

          {/* MAIN BODY: List Tab OR Live Paper Preview Tab */}
          <div className="flex-1 overflow-y-auto p-5 pt-3 min-h-[240px]">
            {activeTab === 'preview' ? (
              /* LIVE PAPER SIMULATION PREVIEW */
              <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-300 text-slate-800 text-[11px] font-sans relative">
                {/* Visual Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <span className="text-7xl font-black rotate-[-25deg] uppercase">SDN 6 BANYUASIN</span>
                </div>

                {/* Kop Surat Header Mockup */}
                <div className="border-b-2 border-slate-900 pb-3 text-center mb-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    PEMERINTAH KABUPATEN BANYUASIN • DINAS PENDIDIKAN DAN KEBUDAYAAN
                  </h4>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    SD NEGERI 6 BANYUASIN III
                  </h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Alamat: Jl. KH. Sulaiman No. 44 RT 08 RW 03, Kel. Kedondong Raye, Kec. Banyuasin III, Kab. Banyuasin, Prov. Sumatera Selatan 30911
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    NPSN: 10600123 • Email: sdn6banyuasin3@gmail.com
                  </p>
                </div>

                {/* Document Title & Meta */}
                <div className="text-center mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wide underline underline-offset-4 text-slate-900">
                    {docTitle}
                  </h4>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">
                    Nomor: {new Date().getFullYear()}/REKAP-QR/SDN6/{new Date().getMonth() + 1}
                  </p>
                  <p className="text-[9px] font-semibold text-emerald-800 mt-0.5">
                    Kategori: {categoryFilter === 'ALL' ? 'Semua Kategori Pemindaian' : categoryFilter} • Total Entri: {selectedScans.length}
                  </p>
                </div>

                {/* Mini Stat Cards on Document */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-500 block">Presensi</span>
                    <strong className="text-xs font-bold text-slate-800">{stats.student}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-500 block">Tugas</span>
                    <strong className="text-xs font-bold text-slate-800">{stats.assignment}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-500 block">Aset</span>
                    <strong className="text-xs font-bold text-slate-800">{stats.asset}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[9px] text-slate-500 block">Total</span>
                    <strong className="text-xs font-bold text-slate-800">{stats.total}</strong>
                  </div>
                </div>

                {/* Document Table Preview */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-left border-collapse text-[9px]">
                    <thead className="bg-emerald-800 text-white font-bold">
                      <tr>
                        <th className="p-1.5 text-center w-6 border-r border-emerald-700">No</th>
                        <th className="p-1.5 w-24 border-r border-emerald-700">Waktu</th>
                        <th className="p-1.5 w-16 border-r border-emerald-700">Tipe</th>
                        <th className="p-1.5 border-r border-emerald-700">Judul / Subjek</th>
                        <th className="p-1.5 w-24 border-r border-emerald-700">Kode QR</th>
                        <th className="p-1.5 text-center w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedScans.slice(0, 8).map((sc, i) => {
                        const d = new Date(sc.timestamp);
                        const time = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                        return (
                          <tr key={sc.id} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="p-1.5 text-center border-r border-slate-200 font-bold">{i + 1}</td>
                            <td className="p-1.5 border-r border-slate-200">{time}</td>
                            <td className="p-1.5 border-r border-slate-200 font-semibold">{sc.type}</td>
                            <td className="p-1.5 border-r border-slate-200 truncate max-w-[140px] font-medium">{sc.title || sc.code}</td>
                            <td className="p-1.5 border-r border-slate-200 font-mono text-[8px] font-bold text-slate-700">{sc.code}</td>
                            <td className="p-1.5 text-center font-bold text-emerald-700">Valid</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {selectedScans.length > 8 && (
                    <div className="p-1.5 bg-slate-100 text-center text-[9px] text-slate-500 italic border-t border-slate-200">
                      ... dan {selectedScans.length - 8} baris data lainnya tercantum lengkap pada dokumen PDF cetak.
                    </div>
                  )}
                </div>

                {/* Additional Notes if any */}
                {notes.trim() && (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-[9px]">
                    <span className="font-bold text-slate-700">Catatan: </span>
                    <span className="text-slate-600">{notes}</span>
                  </div>
                )}

                {/* Signatures & QR Verification Strip */}
                {includeSignatures && (
                  <div className="flex items-start justify-between mt-6 pt-4 border-t border-slate-200 text-[9px]">
                    <div className="text-center w-40">
                      <p className="text-slate-500">Mengetahui,</p>
                      <p className="font-bold text-slate-800">Kepala Sekolah SDN 6 Banyuasin III</p>
                      <div className="h-12 flex items-center justify-center">
                        <span className="text-[8px] text-emerald-700 font-mono italic">[Tanda Tangan & Cap Digital]</span>
                      </div>
                      <p className="font-bold underline text-slate-900">Hj. Rohmatun, M.Pd.</p>
                      <p className="text-slate-500 font-mono">NIP. 19680512 199303 2 005</p>
                    </div>

                    {includeVerificationQR && (
                      <div className="text-center p-2 rounded-lg border border-emerald-200 bg-emerald-50/50">
                        <QrCode size={36} className="mx-auto text-emerald-800 mb-1" />
                        <span className="text-[8px] font-mono text-emerald-900 block font-bold">DIGITAL VERIFIED</span>
                        <span className="text-[7px] text-slate-500">Scan untuk cek keaslian</span>
                      </div>
                    )}

                    <div className="text-center w-40">
                      <p className="text-slate-500">Banyuasin, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold text-slate-800">{role}</p>
                      <div className="h-12 flex items-center justify-center">
                        <span className="text-[8px] text-slate-400 font-mono italic">[Petugas Pelaksana]</span>
                      </div>
                      <p className="font-bold underline text-slate-900">{operator}</p>
                      <p className="text-slate-500 font-mono">Petugas Terdaftar</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TABLE / LIST OF SCAN LOGS WITH CHECKBOXES */
              <>
                {filteredScans.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <QrCode size={36} className="mx-auto text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">Tidak Ada Log Pemindaian Cocok</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `Tidak ditemukan riwayat pemindaian dengan kata kunci "${searchQuery}". Silakan sesuaikan pencarian Anda.`
                        : 'Belum ada riwayat pemindaian tersimpan untuk kategori dan filter ini.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                      >
                        Reset Pencarian
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 select-none">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center">#</span>
                        <span>Item Pemindaian & Kategori</span>
                      </div>
                      <span>Waktu & Status</span>
                    </div>

                    {filteredScans.map((item, idx) => {
                      const isSelected = selectedIds.has(item.id);

                      const typeColor =
                        item.type === 'STUDENT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : item.type === 'ASSIGNMENT'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : item.type === 'ASSET'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-200';

                      const TypeIcon =
                        item.type === 'STUDENT'
                          ? User
                          : item.type === 'ASSIGNMENT'
                          ? BookOpen
                          : item.type === 'ASSET'
                          ? Package
                          : QrCode;

                      let timeStr = '-';
                      try {
                        const d = new Date(item.timestamp);
                        timeStr = `${d.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                      } catch {
                        timeStr = String(item.timestamp);
                      }

                      return (
                        <div
                          key={`${item.id}-${item.timestamp}-${idx}`}
                          onClick={() => toggleSelect(item.id)}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs ring-1 ring-emerald-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90'
                          }`}
                        >
                          {/* Checkbox + Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>

                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${typeColor}`}
                            >
                              <TypeIcon size={15} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs font-bold text-slate-800 truncate">
                                  {item.title || item.code}
                                </h5>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border shrink-0 ${typeColor}`}
                                >
                                  {item.type === 'STUDENT'
                                    ? 'Presensi'
                                    : item.type === 'ASSIGNMENT'
                                    ? 'Tugas'
                                    : item.type === 'ASSET'
                                    ? 'Aset'
                                    : 'Umum'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-slate-600 font-semibold">{item.code}</span>
                                {item.subtitle && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{item.subtitle}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Meta: Timestamp & Valid Status */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              <span>{timeStr}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-1.5 py-0.2 rounded-full">
                              <CheckCircle2 size={10} /> Terverifikasi
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar with Action Buttons */}
          <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-700">
                {selectedScans.length} dari {scans.length} item dipilih
              </span>
              {selectedScans.length === 0 && (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>Pilih minimal 1 item untuk diekspor</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* CSV Export Button */}
              {selectedScans.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  title="Ekspor data terpilih ke lembar kerja Excel / CSV"
                >
                  <FileSpreadsheet size={13} />
                  <span className="hidden sm:inline">Ekspor CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsGenerating(true);
                    const result = await dailyScanSchedulerService.executeScheduledJob(true);
                    alert(`Laporan scan (${result.totalScans} item) berhasil dikirimkan ke email Kepala Sekolah (${result.targetEmail})!`);
                  } catch (e: any) {
                    alert('Gagal mengirim email: ' + (e.message || 'Kesalahan sistem'));
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                title="Kirim dokumen rekapitulasi ke email Kepala Sekolah sekarang (Jadwal Otomatis 15:00)"
              >
                <Mail size={13} className="text-teal-700" />
                <span className="hidden sm:inline">Kirim ke Kepsek (15:00)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={() => handleGeneratePDF(true)}
                disabled={selectedScans.length === 0 || isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Buka dialog pencetakan printer sistem langsung"
              >
                <Printer size={14} className="text-emerald-700" />
                <span>{isGenerating ? 'Menyiapkan...' : 'Cetak (Print)'}</span>
              </button>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={() => handleGeneratePDF(false)}
                disabled={selectedScans.length === 0 || isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Unduh laporan ringkasan pemindaian format PDF"
              >
                <Download size={14} />
                <span>{isGenerating ? 'Mengekspor PDF...' : 'Unduh Ringkasan PDF'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
