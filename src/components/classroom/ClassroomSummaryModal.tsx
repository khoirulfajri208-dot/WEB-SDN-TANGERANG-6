import React, { useMemo } from 'react';
import {
  Printer, X, Award, CheckCircle2, TrendingUp,
  AlertTriangle, School, BookOpen, Clock, BarChart2
} from 'lucide-react';
import { Account, ClassroomSubmission } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { STANDARD_CLASSES } from '../../services/accountService';

interface ClassroomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  onSelectClass?: (kelas: string) => void;
  account: Account;
  students: Account[];
}

export const ClassroomSummaryModal: React.FC<ClassroomSummaryModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onSelectClass,
  account,
  students,
}) => {
  if (!isOpen) return null;

  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  // Retrieve submissions and calculate metrics
  const allSubmissions = useMemo(() => classroomService.getSubmissions(), []);
  
  const studentMetrics = useMemo(() => {
    return students.map((s) => {
      const report = classroomService.getStudentReportCard(s.ID, s.NAMA, s.KELAS || selectedClass);
      const studentSubs = allSubmissions.filter((sub) => sub.SISWA_ID === s.ID);
      const attStats = classroomService.getStudentAttendanceStats(s.ID, s.KELAS || selectedClass);
      
      return {
        student: s,
        report,
        submissionsCount: studentSubs.length,
        attendance: attStats,
        avgScore: report.nilaiAkhir,
        predikat: report.predikat,
        presensiPct: report.presensiPct,
      };
    });
  }, [students, selectedClass, allSubmissions]);

  // Aggregate Stats
  const totalStudents = studentMetrics.length;
  const avgClassScore = useMemo(() => {
    if (totalStudents === 0) return 0;
    const sum = studentMetrics.reduce((acc, curr) => acc + curr.avgScore, 0);
    return Math.round((sum / totalStudents) * 10) / 10;
  }, [studentMetrics, totalStudents]);

  const highestScore = useMemo(() => {
    if (totalStudents === 0) return 0;
    return Math.max(...studentMetrics.map((m) => m.avgScore));
  }, [studentMetrics, totalStudents]);

  const lowestScore = useMemo(() => {
    if (totalStudents === 0) return 0;
    return Math.min(...studentMetrics.map((m) => m.avgScore));
  }, [studentMetrics, totalStudents]);

  const avgAttendance = useMemo(() => {
    if (totalStudents === 0) return 0;
    const sum = studentMetrics.reduce((acc, curr) => acc + curr.presensiPct, 0);
    return Math.round((sum / totalStudents) * 10) / 10;
  }, [studentMetrics, totalStudents]);

  // Grade Distribution
  const gradeDistribution = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    studentMetrics.forEach((m) => {
      counts[m.predikat] = (counts[m.predikat] || 0) + 1;
    });

    return [
      {
        grade: 'A',
        label: 'Sangat Baik (85 - 100)',
        count: counts.A,
        pct: totalStudents > 0 ? Math.round((counts.A / totalStudents) * 100) : 0,
        color: 'bg-emerald-600',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
      },
      {
        grade: 'B',
        label: 'Baik (70 - 84)',
        count: counts.B,
        pct: totalStudents > 0 ? Math.round((counts.B / totalStudents) * 100) : 0,
        color: 'bg-blue-600',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50',
      },
      {
        grade: 'C',
        label: 'Cukup (55 - 69)',
        count: counts.C,
        pct: totalStudents > 0 ? Math.round((counts.C / totalStudents) * 100) : 0,
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50',
      },
      {
        grade: 'D',
        label: 'Perlu Bimbingan (< 55)',
        count: counts.D,
        pct: totalStudents > 0 ? Math.round((counts.D / totalStudents) * 100) : 0,
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
        borderColor: 'border-rose-200',
        bgColor: 'bg-rose-50',
      },
    ];
  }, [studentMetrics, totalStudents]);

  // Attendance Aggregates
  const attendanceAggregates = useMemo(() => {
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;
    let totalSessions = 0;

    studentMetrics.forEach((m) => {
      totalHadir += m.attendance.hadir;
      totalSakit += m.attendance.sakit;
      totalIzin += m.attendance.izin;
      totalAlpa += m.attendance.alpa;
      totalSessions += m.attendance.total;
    });

    const safeTotal = totalSessions || 1;
    return {
      hadir: totalHadir,
      hadirPct: Math.round((totalHadir / safeTotal) * 100),
      sakit: totalSakit,
      sakitPct: Math.round((totalSakit / safeTotal) * 100),
      izin: totalIzin,
      izinPct: Math.round((totalIzin / safeTotal) * 100),
      alpa: totalAlpa,
      alpaPct: Math.round((totalAlpa / safeTotal) * 100),
      totalSessions,
    };
  }, [studentMetrics]);

  // Tuntas KKM Count (>= 75)
  const tuntasCount = studentMetrics.filter((m) => m.avgScore >= 75).length;
  const tuntasPct = totalStudents > 0 ? Math.round((tuntasCount / totalStudents) * 100) : 0;
  const abkCount = studentMetrics.filter((m) => m.student.KEBUTUHAN_KHUSUS && m.student.KEBUTUHAN_KHUSUS !== 'REGULER').length;

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const waliKelasNama = isGuru ? account.NAMA : 'Nurul Hidayah, S.Pd.';
  const waliKelasNip = isGuru ? (account.NIP || '19850412 201101 2 003') : '19850412 201101 2 003';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Box */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
        
        {/* NON-PRINTABLE TOP TOOLBAR */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between gap-3 flex-wrap border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <School size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Ringkasan Kelas & Laporan Cetak</h3>
              <p className="text-[11px] text-slate-400">Pratinjau format siap cetak (Printer-Friendly View)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isKepsek && onSelectClass && (
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold mr-1">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-slate-900 text-white">Semua Kelas</option>
                  {STANDARD_CLASSES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> Cetak / Simpan PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTENT */}
        <div className="p-6 sm:p-8 md:p-10 space-y-6 text-slate-900 bg-white print:p-0 print:space-y-4">
          
          {/* 1. KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center space-y-0.5">
                <h4 className="text-xs font-bold tracking-wider uppercase text-slate-600">
                  PEMERINTAH KOTA TANGERANG • DINAS PENDIDIKAN
                </h4>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-serif">
                  SD NEGERI TANGERANG 6
                </h1>
                <p className="text-[11px] text-slate-600">
                  Jl. Nyi Mas Melati No. 12, Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118 • NPSN: 20606498
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Website: sdn6tangerang.sch.id • Email: info@sdntangerang6.sch.id • Akreditasi: A (Unggul)
                </p>
              </div>
            </div>
            {/* Double Border Line */}
            <div className="mt-3 border-t border-slate-300"></div>
          </div>

          {/* 2. DOKUMEN TITLE & METADATA */}
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 underline decoration-blue-700 decoration-2 underline-offset-4">
              LAPORAN RINGKASAN AKADEMIK & REKAPITULASI KELAS
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Periode Tahun Ajaran 2026/2027 • Semester Ganjil
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs print:bg-slate-100/60 print:border-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Rombongan Belajar:</span>
              <strong className="text-sm text-slate-900 font-black">{selectedClass}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Wali Kelas / Pengampu:</span>
              <strong className="text-xs text-slate-900 font-bold">{waliKelasNama}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Peserta Didik:</span>
              <strong className="text-sm text-slate-900 font-black">{totalStudents} Siswa</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Tanggal Rekapitulasi:</span>
              <strong className="text-xs text-slate-900 font-bold">{currentDateFormatted}</strong>
            </div>
          </div>

          {/* 3. KEY PERFORMANCE INDICATORS (KPI) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:grid-cols-5">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-center print:border-slate-300">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Rata-rata Kelas</span>
              <div className="text-2xl font-black text-blue-900 mt-0.5">{avgClassScore}</div>
              <span className="text-[9px] text-blue-600 font-semibold">Skala 100</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center print:border-slate-300">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Ketuntasan KKM</span>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">{tuntasPct}%</div>
              <span className="text-[9px] text-emerald-600 font-semibold">{tuntasCount}/{totalStudents} Siswa</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-center print:border-slate-300">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Rata-rata Kehadiran</span>
              <div className="text-2xl font-black text-teal-900 mt-0.5">{avgAttendance}%</div>
              <span className="text-[9px] text-teal-600 font-semibold">Presensi Semester</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-center print:border-slate-300">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Rentang Nilai</span>
              <div className="text-2xl font-black text-indigo-900 mt-0.5">{lowestScore} - {highestScore}</div>
              <span className="text-[9px] text-indigo-600 font-semibold">Min - Max</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-center print:border-slate-300">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Siswa Inklusi / ABK</span>
              <div className="text-2xl font-black text-purple-900 mt-0.5">{abkCount}</div>
              <span className="text-[9px] text-purple-600 font-semibold">Pendampingan Khusus</span>
            </div>
          </div>

          {/* 4. CHARTS & ANALYTICS: GRADE DISTRIBUTION & ATTENDANCE SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            {/* Grade Distribution Breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 print:border-slate-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-blue-600" /> Distribusi Nilai Akademik
                </h4>
                <span className="text-[10px] font-bold text-slate-500">Standar KKM: 75</span>
              </div>

              {/* Visual Distribution Bars */}
              <div className="space-y-2.5 pt-1">
                {gradeDistribution.map((item) => (
                  <div key={item.grade} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md ${item.bgColor} ${item.textColor} font-black text-[10px] flex items-center justify-center border ${item.borderColor}`}>
                          {item.grade}
                        </span>
                        <span className="font-bold text-slate-700 text-[11px]">{item.label}</span>
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {item.count} siswa <span className="text-slate-400 font-normal">({item.pct}%)</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${Math.max(item.pct, item.count > 0 ? 4 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary Breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 print:border-slate-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" /> Rekapitulasi Presensi Kelas
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {attendanceAggregates.totalSessions} Total Sesi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Hadir (H)</span>
                  <div className="text-lg font-black text-emerald-900">{attendanceAggregates.hadir}</div>
                  <span className="text-[10px] text-emerald-600 font-semibold">{attendanceAggregates.hadirPct}% dari total</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Sakit (S)</span>
                  <div className="text-lg font-black text-blue-900">{attendanceAggregates.sakit}</div>
                  <span className="text-[10px] text-blue-600 font-semibold">{attendanceAggregates.sakitPct}% dari total</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Izin (I)</span>
                  <div className="text-lg font-black text-amber-900">{attendanceAggregates.izin}</div>
                  <span className="text-[10px] text-amber-600 font-semibold">{attendanceAggregates.izinPct}% dari total</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Alpa (A)</span>
                  <div className="text-lg font-black text-rose-900">{attendanceAggregates.alpa}</div>
                  <span className="text-[10px] text-rose-600 font-semibold">{attendanceAggregates.alpaPct}% dari total</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. STUDENT LIST TABLE */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-900">
              Daftar Rekapitulasi Peserta Didik & Capaian Individu
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 print:bg-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">NIS / NISN</th>
                    <th className="py-2.5 px-3">Nama Lengkap Siswa</th>
                    <th className="py-2.5 px-3 text-center">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Tugas</th>
                    <th className="py-2.5 px-3 text-center">Nilai Rata-rata</th>
                    <th className="py-2.5 px-3 text-center">Predikat</th>
                    <th className="py-2.5 px-3 text-center">Presensi</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentMetrics.map((item, idx) => {
                    const isPassed = item.avgScore >= 75;
                    const kelulusan = item.student.STATUS_KELULUSAN || 'AKTIF';
                    const kebutuhan = item.student.KEBUTUHAN_KHUSUS || 'REGULER';

                    return (
                      <tr key={item.student.ID} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.student.NIP || '-'}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900">{item.student.NAMA}</span>
                          {item.student.CATATAN_INKLUSI && (
                            <span className="block text-[10px] text-purple-700 italic">
                              Catatan: {item.student.CATATAN_INKLUSI}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {kebutuhan === 'REGULER' ? (
                            <span className="text-[10px] text-slate-600 font-medium">Reguler</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                              {kebutuhan.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-700">
                          {item.submissionsCount} tgs
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                          <span className={item.avgScore >= 85 ? 'text-emerald-700' : item.avgScore >= 75 ? 'text-blue-700' : 'text-amber-700'}>
                            {item.avgScore}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-black">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : item.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.predikat}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700">
                          {item.presensiPct}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            kelulusan === 'LULUS'
                              ? 'bg-teal-100 text-teal-800'
                              : isPassed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {kelulusan === 'LULUS' ? 'LULUS' : isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. SIGNATURE / PENGESAHAN BLOCK */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs print:pt-4">
            <div>
              <p className="text-slate-600 mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala SD Negeri Tangerang 6</p>
              <div className="h-16 sm:h-20 flex items-end justify-center">
                <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Cap Sekolah ]</span>
              </div>
              <p className="font-black text-slate-900 underline">H. Bambang S., M.Pd.</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. 19720515 199803 1 004</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Tangerang, {currentDateFormatted}</p>
              <p className="font-bold text-slate-900">Guru Kelas / Wali Kelas</p>
              <div className="h-16 sm:h-20 flex items-end justify-center">
                <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
              </div>
              <p className="font-black text-slate-900 underline">{waliKelasNama}</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. {waliKelasNip}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
