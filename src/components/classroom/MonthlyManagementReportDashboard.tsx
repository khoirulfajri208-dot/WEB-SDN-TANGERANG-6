import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  BookOpen,
  School,
  X,
  Share2,
  Filter,
  Check,
  Compass,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { monthlyManagementService, MonthlyManagementReportData } from '../../services/monthlyManagementService';
import { pdfService } from '../../services/pdfService';

export interface MonthlyManagementReportDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const MonthlyManagementReportDashboard: React.FC<MonthlyManagementReportDashboardProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Filters State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [gradeFilter, setGradeFilter] = useState<string>('ALL'); // 'ALL', '1', '2', '3', '4', '5', '6'
  const [activeTab, setActiveTab] = useState<'EXECUTIVE' | 'ATTENDANCE' | 'ASSIGNMENTS' | 'P5'>('EXECUTIVE');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Months in Indonesian
  const monthOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Year-Month formatted
  const yearMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Fetch / Calculate Report Data
  const reportData: MonthlyManagementReportData = useMemo(() => {
    return monthlyManagementService.getMonthlyReportData(yearMonthStr);
  }, [yearMonthStr]);

  // Filtered Classes based on Grade Level and Search
  const filteredAttendance = useMemo(() => {
    return reportData.attendance.classes.filter((c) => {
      const matchGrade = gradeFilter === 'ALL' || c.rombel.includes(`Kelas ${gradeFilter}`);
      const matchSearch = searchTerm === '' || c.rombel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [reportData.attendance.classes, gradeFilter, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return reportData.assignments.classes.filter((c) => {
      const matchGrade = gradeFilter === 'ALL' || c.rombel.includes(`Kelas ${gradeFilter}`);
      const matchSearch = searchTerm === '' || c.rombel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [reportData.assignments.classes, gradeFilter, searchTerm]);

  const filteredP5 = useMemo(() => {
    return reportData.p5.classes.filter((c) => {
      const matchGrade = gradeFilter === 'ALL' || c.rombel.includes(`Kelas ${gradeFilter}`);
      const matchSearch =
        searchTerm === '' ||
        c.rombel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.judul.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [reportData.p5.classes, gradeFilter, searchTerm]);

  // Handle PDF Generation (One-Click)
  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      await pdfService.generateMonthlyManagementReportPdf(reportData);
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Copy Executive Summary Text
  const handleCopySummary = () => {
    const text = `LAPORAN MANAJEMEN BULANAN KEPALA SEKOLAH\n${reportData.schoolName}\nPeriode: ${reportData.period} (TA ${reportData.schoolYear})\nNomor Dokumen: ${reportData.docNo}\n\n[INDIKATOR KINERJA UTAMA]\n1. Rata-rata Kehadiran Siswa: ${reportData.kpi.avgAttendanceRate}% (${reportData.kpi.attendanceQuality})\n2. Rata-rata Nilai Tugas: ${reportData.kpi.avgAssignmentScore} (Ketuntasan: ${reportData.kpi.academicPassRate}%)\n3. Tingkat Pengumpulan Tugas: ${reportData.kpi.avgSubmissionRate}%\n4. Progres Projek P5: ${reportData.kpi.avgP5Progress}% (${reportData.kpi.p5TargetStatus})\n\n[RINGKASAN EKSEKUTIF]\n${reportData.executiveSummaryText}\n\n[ARAHAN SUPERVISI KEPALA SEKOLAH]\n${reportData.supervisoryRecommendations.join('\n')}\n\nMengetahui,\nKepala Sekolah: ${reportData.headmasterName} (NIP. ${reportData.headmasterNip})\nPengawas Pembina: ${reportData.supervisorName} (NIP. ${reportData.supervisorNip})`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <School size={13} className="text-indigo-400" />
                PORTAL KEPALA SEKOLAH
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck size={11} />
                Dokumen Resmi Dinas
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-mono">No: {reportData.docNo}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Dashboard Laporan Manajemen Bulanan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Supervisi & rekapitulasi terpadu kinerja sekolah: <span className="text-white font-semibold">Absensi Kehadiran</span>,{' '}
              <span className="text-white font-semibold">Capaian Nilai Tugas</span>, dan{' '}
              <span className="text-white font-semibold">Progres Projek P5</span> di 24 rombongan belajar {reportData.schoolName}.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer disabled:opacity-60"
              title="Unduh dokumen resmi PDF berstandar dinas dengan kop dan tanda tangan"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Unduh PDF Sekali Klik</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 cursor-pointer"
              title="Cetak langsung dokumen laporan"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Copy Summary */}
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 cursor-pointer"
              title="Salin ringkasan teks untuk grup WA & koordinasi pimpinan"
            >
              {copyFeedback ? (
                <>
                  <Check size={15} className="text-emerald-400" />
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  <span className="hidden sm:inline">Salin Teks</span>
                </>
              )}
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar Inside Header */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-indigo-400" />
              Periode Supervisi:
            </span>

            {/* Bulan Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Pilih Bulan Supervisi"
              className="bg-slate-800/90 hover:bg-slate-800 text-white font-semibold rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            {/* Tahun Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Pilih Tahun Supervisi"
              className="bg-slate-800/90 hover:bg-slate-800 text-white font-semibold rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={2025} className="bg-slate-900 text-white">2025</option>
              <option value={2026} className="bg-slate-900 text-white">2026</option>
              <option value={2027} className="bg-slate-900 text-white">2027</option>
            </select>

            {/* Tingkat Kelas Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/70 p-0.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Jenjang:</span>
              {(['ALL', '1', '2', '3', '4', '5', '6'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setGradeFilter(lvl)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    gradeFilter === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {lvl === 'ALL' ? 'Semua' : `Kls ${lvl}`}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            Tahun Ajaran <span className="font-bold text-white">{reportData.schoolYear}</span> (Semester {reportData.semester})
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE 4-PILLAR KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kehadiran Siswa */}
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              1. Kehadiran Siswa
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {reportData.kpi.avgAttendanceRate}%
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800">
              {reportData.kpi.attendanceQuality}
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span>Hadir: <strong className="text-slate-800">{reportData.attendance.totalHadir.toLocaleString('id-ID')}</strong></span>
            <span>• Sakit: <strong className="text-slate-800">{reportData.attendance.totalSakit}</strong></span>
            <span>• Alpa: <strong className="text-rose-600">{reportData.attendance.totalAlpa}</strong></span>
          </div>
        </div>

        {/* KPI 2: Rerata Nilai Tugas */}
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              2. Rerata Nilai Tugas
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {reportData.kpi.avgAssignmentScore}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800">
              KKTP: {reportData.kpi.academicPassRate}%
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Top Rombel: <strong className="text-slate-800">{reportData.assignments.topPerformingClass}</strong></span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
              <TrendingUp size={12} /> Tuntas
            </span>
          </div>
        </div>

        {/* KPI 3: Pengumpulan Tugas */}
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
              3. Pengumpulan Tugas
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {reportData.kpi.avgSubmissionRate}%
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800">
              Terkumpul
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Total Kumpul: <strong className="text-slate-800">{reportData.assignments.totalSubmitted.toLocaleString('id-ID')}</strong></span>
            <span>Dinilai: <strong className="text-slate-800">{reportData.assignments.totalGraded.toLocaleString('id-ID')}</strong></span>
          </div>
        </div>

        {/* KPI 4: Progres Projek P5 */}
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              4. Progres Projek P5
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Compass size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {reportData.kpi.avgP5Progress}%
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
              {reportData.kpi.p5TargetStatus}
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Kesiapan Gelar Karya: <strong className="text-amber-800 font-bold">{reportData.p5.showcaseReadiness}%</strong></span>
            <span>24 Rombel</span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('EXECUTIVE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'EXECUTIVE'
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'EXECUTIVE' ? 'text-amber-400' : 'text-slate-400'} />
            Ringkasan Eksekutif & Rekomendasi
          </button>

          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users size={14} />
            Rekapitulasi Absensi ({filteredAttendance.length})
          </button>

          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ASSIGNMENTS'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award size={14} />
            Nilai & Tugas Siswa ({filteredAssignments.length})
          </button>

          <button
            onClick={() => setActiveTab('P5')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'P5'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass size={14} />
            Progres Projek P5 ({filteredP5.length})
          </button>
        </div>

        {/* Search input if viewing table tabs */}
        {activeTab !== 'EXECUTIVE' && (
          <div className="relative shrink-0 w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas / tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: RINGKASAN EKSEKUTIF & REKOMENDASI KEPSEK */}
      {activeTab === 'EXECUTIVE' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive Narrative & Supervisory Insight */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <School size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Evaluasi Supervisi Manajerial Kepala Sekolah — {reportData.period}
                </h3>
                <p className="text-xs text-slate-500">
                  Analisis komprehensif implementasi Kurikulum Merdeka dan mutu manajemen satuan pendidikan
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              {reportData.executiveSummaryText}
            </div>

            {/* Strategic Recommendations Checklist */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Arahan Tindak Lanjut & Rekomendasi Supervisi Kepala Sekolah:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {reportData.supervisoryRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-slate-700 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights & Comparisons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Peringkat Kehadiran Kelas */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Users size={14} className="text-teal-600" />
                  Kelas Teladan Presensi
                </h4>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                  Disiplin Tinggi
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {reportData.attendance.classes
                  .slice(0, 3)
                  .map((c, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{c.rombel}</span>
                      </div>
                      <span className="font-mono font-bold text-teal-700">{c.rate}%</span>
                    </div>
                  ))}
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                <span>Perlu Pendampingan:</span>
                <strong className="font-bold">{reportData.attendance.lowestAttendanceClass}</strong>
              </div>
            </div>

            {/* Box 2: Rerata Mapel Terbaik */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Award size={14} className="text-blue-600" />
                  Capaian Mata Pelajaran
                </h4>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  Kurikulum
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {reportData.assignments.subjectsSummary.slice(0, 3).map((sub, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{sub.mapel}</span>
                    <span className="font-mono font-bold text-blue-800">{sub.avgScore}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Fokus Remedial: <span className="font-bold text-slate-700">Matematika (81.4)</span>
              </div>
            </div>

            {/* Box 3: Fase Kurikulum P5 */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Compass size={14} className="text-amber-600" />
                  Progres P5 per Fase
                </h4>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  Merdeka
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {reportData.p5.phaseHighlights.map((ph, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{ph.phase}</span>
                      <span className="font-mono font-bold text-amber-800">{ph.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ph.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI ABSENSI SISWA */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-teal-600" />
                  Rekapitulasi Presensi & Kehadiran Siswa per Rombongan Belajar
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredAttendance.length} rombel • Rerata Kehadiran Sekolah: <strong>{reportData.kpi.avgAttendanceRate}%</strong>
                </p>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &gt;97% Sangat Disiplin
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 93-97% Tertib
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &lt;93% Bimbingan
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-4">Rombel</th>
                    <th className="py-3 px-3 text-center">Jml Siswa</th>
                    <th className="py-3 px-3 text-center text-teal-700">Hadir</th>
                    <th className="py-3 px-3 text-center text-blue-700">Sakit</th>
                    <th className="py-3 px-3 text-center text-amber-700">Izin</th>
                    <th className="py-3 px-3 text-center text-rose-700">Alpa</th>
                    <th className="py-3 px-4 text-center">% Kehadiran</th>
                    <th className="py-3 px-4 text-center">Status Disiplin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((item, idx) => (
                    <tr key={item.rombel} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.rombel}</td>
                      <td className="py-3 px-3 text-center font-mono">{item.totalStudents}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-teal-800">{item.hadir}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">{item.sakit}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">{item.izin}</td>
                      <td className="py-3 px-3 text-center font-mono text-rose-600 font-bold">{item.alpa}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{item.rate}%</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                item.rate >= 97 ? 'bg-emerald-500' : item.rate >= 93 ? 'bg-teal-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, item.rate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'SANGAT_BAIK'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'BAIK'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.status === 'SANGAT_BAIK' ? 'Sangat Disiplin' : item.status === 'BAIK' ? 'Tertib' : 'Bimbingan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Siswa Perhatian Khusus Alpa */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Catatan Kewaspadaan Absensi:</strong> Terdeteksi 3 siswa dengan riwayat alpa &gt;2 kali bulan ini yang memerlukan koordinasi wali kelas.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {reportData.attendance.studentsNeedingAttention.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 text-[11px]">
                  {s.name} ({s.rombel} - {s.alpaCount}x)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REKAPITULASI NILAI & TUGAS */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Award size={16} className="text-blue-600" />
                  Rekapitulasi Penugasan, Pengumpulan & Capaian Nilai Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredAssignments.length} rombel • Rerata Nilai Sekolah: <strong>{reportData.kpi.avgAssignmentScore}</strong> • Tingkat Pengumpulan: <strong>{reportData.kpi.avgSubmissionRate}%</strong>
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Standar Ketercapaian Tujuan Pembelajaran (KKTP): <strong>&gt;= 75</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-4">Rombel</th>
                    <th className="py-3 px-3 text-center">Jml Tugas</th>
                    <th className="py-3 px-3 text-center">Terkumpul</th>
                    <th className="py-3 px-4 text-center">% Pengumpulan</th>
                    <th className="py-3 px-4 text-center">Rerata Nilai</th>
                    <th className="py-3 px-4 text-center">Ketuntasan KKTP</th>
                    <th className="py-3 px-4 text-center">Evaluasi Akademik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((item, idx) => (
                    <tr key={item.rombel} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.rombel}</td>
                      <td className="py-3 px-3 text-center font-mono">{item.totalAssignments}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{item.totalSubmissions}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-700">
                        {item.submissionRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900 text-sm">{item.avgScore}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-emerald-700">{item.passRate}%</span>
                        <span className="text-[10px] text-slate-400 block">({item.passCount} dari {item.passCount + item.remedialCount} siswa)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'OPTIMAL'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : item.status === 'TERJADWAL'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.status === 'OPTIMAL' ? 'Sangat Baik' : item.status === 'TERJADWAL' ? 'Tuntas KKTP' : 'Remedial AI'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAPITULASI PROGRES PROYEK P5 */}
      {activeTab === 'P5' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Compass size={16} className="text-amber-600" />
                  Rekapitulasi Projek Penguatan Profil Pelajar Pancasila (P5)
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredP5.length} rombel • Rerata Capaian: <strong>{reportData.kpi.avgP5Progress}%</strong> • Status: <strong>{reportData.kpi.p5TargetStatus}</strong>
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Tahapan Utama: <strong>1. Orientasi &bull; 2. Kontekstualisasi &bull; 3. Aksi Nyata &bull; 4. Gelar Karya</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-4">Rombel</th>
                    <th className="py-3 px-4">Tema & Judul Projek P5</th>
                    <th className="py-3 px-3">Dimensi Karakter Pancasila</th>
                    <th className="py-3 px-4 text-center">Tahapan Berjalan</th>
                    <th className="py-3 px-4 text-center">% Capaian</th>
                    <th className="py-3 px-4 text-center">Status Gelar Karya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredP5.map((item, idx) => (
                    <tr key={item.rombel} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{item.rombel}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-950 block">{item.tema}</span>
                        <span className="text-[11px] text-slate-500 leading-snug block line-clamp-1">{item.judul}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.dimensi.map((d, dIdx) => (
                            <span key={dIdx} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-medium border border-slate-200">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-800 text-[11px] block">{item.activeStageName}</span>
                        <span className="text-[10px] text-slate-400">({item.stagesCompleted}/{item.totalStages} tahap)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-amber-900">{item.percentage}%</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'SELESAI'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'TAHAP_AKSI'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {item.status === 'SELESAI' ? 'Gelar Karya' : item.status === 'TAHAP_AKSI' ? 'Aksi Nyata' : 'Kontekstual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER VERIFIKASI & LEGALITAS SEKOLAH */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
            <FileText size={18} />
          </div>
          <div>
            <div className="font-bold text-slate-800">
              Dokumen Sah Laporan Bulanan {reportData.schoolName}
            </div>
            <div className="text-[11px]">
              Diterbitkan untuk Pengawas Pembina Dinas Pendidikan Kota Tangerang & Arsip Akreditasi Sekolah
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="font-bold text-slate-900">{reportData.headmasterName}</div>
            <div className="text-[11px] text-slate-400">NIP. {reportData.headmasterNip}</div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            <Download size={13} />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
        <div className="bg-slate-100 rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-y-auto p-4 sm:p-6 my-auto shadow-2xl border border-slate-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
