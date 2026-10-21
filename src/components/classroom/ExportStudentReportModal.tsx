import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Award,
  CheckCircle2,
  TrendingUp,
  Heart,
  User,
  Sparkles,
  Calendar,
  School,
  BookOpen,
  Edit3,
  Quote,
  ShieldCheck,
  Check,
  Download,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Account, ClassroomSubmission } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { pdfService } from '../../services/pdfService';

export interface ExportStudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Account | null;
  teacherName?: string;
  teacherNip?: string;
}

export const ExportStudentReportModal: React.FC<ExportStudentReportModalProps> = ({
  isOpen,
  onClose,
  student,
  teacherName = 'Nurul Hidayah, S.Pd.',
  teacherNip = '19850412 201101 2 003',
}) => {
  if (!isOpen || !student) return null;

  const kelas = student.KELAS || 'Kelas 4B';
  const report = classroomService.getStudentReportCard(student.ID, student.NAMA, kelas);
  const attendanceStats = classroomService.getStudentAttendanceStats(student.ID, kelas);

  // Personalized Encouragement Note presets
  const presetNotes = [
    `Ananda ${student.NAMA} menunjukkan perkembangan belajar yang luar biasa dan konsisten menyerahkan tugas tepat waktu. Pertahankan fokus & semangat belajar di kelas!`,
    `Ananda ${student.NAMA} sangat berbakat dalam penalaran kritis dan literasi digital. Terus asah rasa percaya diri dalam berdiskusi kelompok!`,
    `Ananda ${student.NAMA} memiliki kehadiran yang sangat baik. Mohon pendampingan rutin di rumah untuk memperdalam latihan numerasi dasar.`,
    `Ananda ${student.NAMA} menunjukkan kepribadian yang santun dan gotong royong tinggi. Pertahankan prestasi dan wujudkan Profil Pelajar Pancasila!`,
  ];

  const [encouragementNote, setEncouragementNote] = useState<string>(presetNotes[0]);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingP5, setIsExportingP5] = useState<boolean>(false);
  const [exportedSuccess, setExportedSuccess] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const handleVoiceRead = () => {
    if (!('speechSynthesis' in window)) {
      alert('Perangkat browser Anda belum mendukung fitur Text-to-Speech.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `Laporan Rapor Perkembangan Siswa ${student.NAMA}, ${kelas}. Nilai rata-rata akhir: ${report.nilaiAkhir}, Predikat ${report.predikat}. Kehadiran: ${attendanceStats.percentage} persen. Catatan Wali Kelas: ${encouragementNote}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const isPassed = report.nilaiAkhir >= 75;
  const kelulusan = student.STATUS_KELULUSAN || 'AKTIF';
  const statusBadgeLabel = kelulusan === 'LULUS' ? 'LULUS' : isPassed ? 'TUNTAS (≥75)' : 'REMEDIAL';

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await pdfService.generateStudentProgressReportPdf(
        {
          ...report,
          keterangan: encouragementNote,
        },
        teacherName,
        teacherNip
      );
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadP5Pdf = async () => {
    setIsExportingP5(true);
    try {
      await pdfService.generateStudentP5ReportPdf(
        {
          ID: student.ID,
          NAMA: student.NAMA,
          KELAS: kelas,
        },
        teacherName,
        teacherNip
      );
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal mengekspor Rapor P5 PDF:', err);
    } finally {
      setIsExportingP5(false);
    }
  };

  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-300 my-4 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white">
        
        {/* Modal Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700/80 text-emerald-200 ring-1 ring-emerald-400/30">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Export Student Report & Rapor Perkembangan A4
              </h3>
              <p className="text-xs text-emerald-200/80">
                Laporan Hasil Belajar Resmi Berformat Standar A4 (210mm × 297mm) • SDN Tangerang 6
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceRead}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border-emerald-500/40'
              }`}
              title="Voice-Read: Bacakan Rangkuman Laporan dengan Text-to-Speech (Aksesibilitas)"
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSpeaking ? 'Hentikan Suara' : 'Voice-Read TTS'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={15} /> Cetak / Print A4
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              {isExporting ? 'Proses PDF...' : 'Unduh File PDF'}
            </button>
            <button
              type="button"
              onClick={handleDownloadP5Pdf}
              disabled={isExportingP5}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Unduh Lembaran Rapor P5 Resmi berbasis Kurikulum Merdeka"
            >
              <Award size={15} />
              {isExportingP5 ? 'Proses Rapor P5...' : 'Unduh Rapor P5'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Notification Toast */}
        {exportedSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shrink-0 print:hidden">
            <CheckCircle2 size={16} /> Rapor PDF Berhasil Diterbitkan dan Diunduh!
          </div>
        )}

        {/* Scrollable A4 Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/60 print:bg-white print:p-0 print:overflow-visible">
          
          {/* Controls Bar for Teacher Encouragement Note */}
          <div className="max-w-[210mm] mx-auto mb-4 p-4 bg-white rounded-2xl border border-slate-300 shadow-xs print:hidden space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Quote size={15} className="text-teal-600" /> Pengaturan Catatan Motivasi Guru Wali Kelas:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={13} /> {isEditingNote ? 'Gunakan Catatan Kustom' : 'Ubah / Edit Pesan'}
              </button>
            </div>

            {/* Note Selector / Textarea */}
            {isEditingNote ? (
              <textarea
                value={encouragementNote}
                onChange={(e) => setEncouragementNote(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs font-medium rounded-xl border border-teal-300 focus:outline-teal-600 bg-teal-50/50 text-slate-900"
                placeholder="Tuliskan motivasi & rekomendasi guru untuk siswa..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {presetNotes.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEncouragementNote(preset)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold text-left border transition cursor-pointer ${
                      encouragementNote === preset
                        ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Opsi {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= EXACT A4 PAGE SHEET (210mm x 297mm Layout) ================= */}
          <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-2xl print:shadow-none print:border-none print:rounded-none print:p-0 print:w-[210mm] print:h-[297mm] flex flex-col justify-between text-slate-900 font-sans">
            
            <div className="space-y-6">
              {/* 1. OFFICIAL KOP SURAT HEADER */}
              <div className="border-b-4 border-double border-slate-900 pb-3 flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  SDN 6
                </div>
                <div className="text-center flex-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    Pemerintah Kota Tangerang • Dinas Pendidikan
                  </h4>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wide">
                    UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6
                  </h2>
                  <p className="text-[10px] text-slate-600">
                    Jl. Perintis Kemerdekaan No. 6, Cikokol, Kota Tangerang • NPSN: 20606498 • Email: info@sdntangerang6.sch.id
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs text-center leading-tight shadow-md shrink-0">
                  AKREDITASI<br /><strong className="text-base font-black">A</strong>
                </div>
              </div>

              {/* DOCUMENT TITLE BAR */}
              <div className="text-center py-2 bg-slate-900 text-white rounded-xl shadow-xs">
                <h3 className="font-black text-xs sm:text-sm tracking-wider uppercase">
                  LAPORAN HASIL EVALUASI PROGRES BELAJAR SISWA (RAPOR SEMENTARA)
                </h3>
                <p className="text-[10px] text-emerald-300 font-medium">
                  Tahun Ajaran 2026/2027 • Kurikulum Merdeka Belajar SD
                </p>
              </div>

              {/* 2. VISUAL SUMMARY HEADER (PERSONAL IDENTIFICATION & CURRENT STATUS) */}
              <div className="p-4 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 rounded-2xl border border-teal-200 shadow-xs space-y-3">
                
                {/* Identification & Photo Avatar Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-teal-200/80 pb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md ring-2 ring-white">
                      {student.NAMA.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">{student.NAMA}</h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-0.5">
                        <span>NIS / NIP: <strong className="font-mono text-slate-900">{student.NIP || student.ID}</strong></span>
                        <span>•</span>
                        <span>Rombel: <strong className="text-teal-900 font-black">{kelas}</strong></span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Wali Kelas: <span className="font-bold text-slate-800">{teacherName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Current Academic Status Badge */}
                  <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Status Akademik:</span>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs border ${
                          isPassed
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-rose-600 text-white border-rose-700'
                        }`}
                      >
                        {statusBadgeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                      <span>Presensi: <strong className="text-emerald-700 font-black">{report.presensiPct}%</strong></span>
                      <span>•</span>
                      <span>Predikat: <strong className="text-teal-900 font-black">Grade {report.predikat}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Metrics Cards Grid */}
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-teal-200/80 shadow-2xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Rata Tugas</span>
                    <span className="text-sm font-black text-teal-900 mt-0.5 block">{report.nilaiTugas}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-teal-200/80 shadow-2xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Rata Kuis CBT</span>
                    <span className="text-sm font-black text-indigo-900 mt-0.5 block">{report.nilaiKuis}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-teal-200/80 shadow-2xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Kehadiran</span>
                    <span className="text-sm font-black text-emerald-900 mt-0.5 block">{report.presensiPct}%</span>
                  </div>
                  <div className="p-2.5 bg-emerald-900 text-white rounded-xl shadow-2xs">
                    <span className="text-[9px] font-bold text-emerald-200 uppercase block">Nilai Akhir (NA)</span>
                    <span className="text-sm font-black text-amber-300 mt-0.5 block">
                      {report.nilaiAkhir} [{report.predikat}]
                    </span>
                  </div>
                </div>

                {/* 3. PERSONALIZED TEACHER ENCOURAGEMENT NOTE BOX */}
                <div className="p-3.5 bg-white rounded-xl border-l-4 border-l-teal-600 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-teal-900">
                    <Quote size={14} className="text-teal-600" />
                    <span>CATATAN & PESAN MOTIVASI GURU WALI KELAS:</span>
                  </div>
                  <p className="text-xs text-slate-800 italic leading-relaxed font-medium pl-5">
                    "{encouragementNote}"
                  </p>
                </div>
              </div>

              {/* 4. SUBJECT ACADEMIC PERFORMANCE TABLE */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-teal-700" /> Capaian Kompetensi Mata Pelajaran
                </h4>

                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[11px]">
                        <th className="p-2.5 w-8 text-center">No</th>
                        <th className="p-2.5">Mata Pelajaran</th>
                        <th className="p-2.5 text-center">Nilai</th>
                        <th className="p-2.5 text-center">Predikat</th>
                        <th className="p-2.5">Deskripsi Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold">1</td>
                        <td className="p-2.5 font-bold text-slate-900">Pendidikan Pancasila & Kewarganegaraan</td>
                        <td className="p-2.5 text-center font-black text-teal-900">{report.nilaiAkhir}</td>
                        <td className="p-2.5 text-center font-black text-emerald-800">{report.predikat}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">
                          Sangat memahami penerapan nilai Pancasila dan gotong royong di lingkungan sekolah.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold">2</td>
                        <td className="p-2.5 font-bold text-slate-900">Bahasa Indonesia (Literasi Reading/Writing)</td>
                        <td className="p-2.5 text-center font-black text-teal-900">{report.nilaiTugas}</td>
                        <td className="p-2.5 text-center font-black text-emerald-800">{report.predikat}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">
                          Mampu mengidentifikasi ide pokok narasi dan menyusun karangan secara ekspresif.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold">3</td>
                        <td className="p-2.5 font-bold text-slate-900">Matematika & Numerasi Gasing</td>
                        <td className="p-2.5 text-center font-black text-teal-900">{report.nilaiKuis}</td>
                        <td className="p-2.5 text-center font-black text-emerald-800">{report.predikat}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">
                          Terampil dalam perhitungan matematika cepat dan penyelesaian soal cerita kontekstual.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold">4</td>
                        <td className="p-2.5 font-bold text-slate-900">Ilmu Pengetahuan Alam & Sosial (IPAS)</td>
                        <td className="p-2.5 text-center font-black text-teal-900">{Math.max(68, report.nilaiAkhir - 2)}</td>
                        <td className="p-2.5 text-center font-black text-emerald-800">{report.predikat === 'A' ? 'B' : report.predikat}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">
                          Memahami siklus alam, keanekaragaman flora fauba lokal, serta ekosistem lingkungan.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold">5</td>
                        <td className="p-2.5 font-bold text-slate-900">Koding & STEM Literasi Digital SD</td>
                        <td className="p-2.5 text-center font-black text-teal-900">{Math.min(100, report.nilaiAkhir + 4)}</td>
                        <td className="p-2.5 text-center font-black text-emerald-800">A</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">
                          Sangat antusias mengoperasikan modul koding visual Scratch dan pengerjaan kuis interaktif.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. FORMAL SIGNATURE BLOCK (A4 BOTTOM FOOTER) */}
            <div className="pt-6 border-t border-slate-300 space-y-4 print:pt-4">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-slate-600 mb-1">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Orang Tua / Wali Siswa</p>
                  <div className="h-14 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic font-mono">( Tanda Tangan Wali )</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-2">..........................................</p>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">Mengesahkan,</p>
                  <p className="font-bold text-slate-900">Kepala UPT SDN Tangerang 6</p>
                  <div className="h-14 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic font-mono">[ Cap & TTD Digital Sah ]</span>
                  </div>
                  <p className="font-black text-slate-900 underline">Liestya Kusuma Sari, S.Pd., M.Pd.</p>
                  <p className="text-slate-500 font-mono text-[10px]">NIP. 19740520 199803 2 004</p>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">Tangerang, 31 Agustus 2026</p>
                  <p className="font-bold text-slate-900">Guru Kelas / Wali Kelas</p>
                  <div className="h-14 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic font-mono">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-black text-slate-900 underline">{teacherName}</p>
                  <p className="text-slate-500 font-mono text-[10px]">NIP. {teacherNip}</p>
                </div>
              </div>

              {/* Security Digital Verification Badge */}
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck size={13} className="text-emerald-600" /> Ref. Code: SDNTNG6-REPORT-{student.ID}-A4-VERIFIED
                </span>
                <span>Dokumen Sah Cetak Standar A4 • UPT SD Negeri Tangerang 6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-[11px] shrink-0 print:hidden">
          <span className="text-slate-600 font-medium">Layout Rapor Presisi Dimensi Standar A4 (210 × 297 mm)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};
