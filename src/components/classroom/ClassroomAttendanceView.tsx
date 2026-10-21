import React, { useState } from 'react';
import {
  UserCheck, CheckCircle2, Clock, Calendar, AlertCircle, Users, Check,
  Download, Filter, ChevronDown, Sparkles, Award, Printer, FileSpreadsheet,
  X, School, FileText, CheckCheck, RefreshCw
} from 'lucide-react';
import { Account, AttendanceRecord, AttendanceStatus } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';
import { SecureMaskedField } from '../common/SecureMaskedField';

interface ClassroomAttendanceViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomAttendanceView: React.FC<ClassroomAttendanceViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [session, setSession] = useState<string>('Presensi Pagi');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [exportType, setExportType] = useState<'HARIAN' | 'SEMESTER'>('HARIAN');

  const currentClassTarget = isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas;

  // Student list for current selected class
  const classStudents = accountService.getStudents(currentClassTarget);

  // Existing attendance records for date & class
  const records = classroomService.getAttendanceRecords(currentClassTarget, selectedDate);

  // Map student ID to record
  const studentStatusMap: { [siswaId: string]: { status: AttendanceStatus; catatan: string } } = {};
  classStudents.forEach((s) => {
    const existing = records.find((r) => r.SISWA_ID === s.ID && r.SESI === session);
    studentStatusMap[s.ID] = {
      status: existing ? existing.STATUS : 'HADIR',
      catatan: existing?.CATATAN || '',
    };
  });

  const [localStatuses, setLocalStatuses] = useState<{ [siswaId: string]: { status: AttendanceStatus; catatan: string } }>(
    studentStatusMap
  );

  // Update status for a student
  const handleStatusChange = (siswaId: string, status: AttendanceStatus) => {
    setLocalStatuses({
      ...localStatuses,
      [siswaId]: {
        ...localStatuses[siswaId],
        status,
      },
    });
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setLocalStatuses({
      ...localStatuses,
      [siswaId]: {
        ...(localStatuses[siswaId] || { status: 'HADIR' }),
        catatan,
      },
    });
  };

  // Bulk Mark All as Hadir
  const handleMarkAllHadir = () => {
    const updated = { ...localStatuses };
    classStudents.forEach((s) => {
      updated[s.ID] = { status: 'HADIR', catatan: 'Hadir tepat waktu' };
    });
    setLocalStatuses(updated);
  };

  // Save Attendance to Service
  const handleSaveAttendance = () => {
    const recordsToSave: Omit<AttendanceRecord, 'ID' | 'RECORDED_AT'>[] = classStudents.map((s) => ({
      KELAS: currentClassTarget,
      TANGGAL: selectedDate,
      SESI: session,
      SISWA_ID: s.ID,
      SISWA_NAMA: s.NAMA,
      STATUS: localStatuses[s.ID]?.status || 'HADIR',
      CATATAN: localStatuses[s.ID]?.catatan || '',
      RECORDED_BY: account.NAMA,
    }));

    classroomService.bulkSaveAttendance(recordsToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  // Siswa Self-Checkin
  const handleSelfCheckin = () => {
    if (!account.KELAS) return;
    classroomService.recordSingleAttendance({
      KELAS: account.KELAS,
      TANGGAL: selectedDate,
      SESI: 'Presensi Mandiri Pagi',
      SISWA_ID: account.ID,
      SISWA_NAMA: account.NAMA,
      STATUS: 'HADIR',
      CATATAN: `Absen mandiri siswa via portal pada ${new Date().toLocaleTimeString('id-ID')}`,
      RECORDED_BY: 'Siswa Mandiri',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  // Student Attendance Recap for current student
  const studentRecap = isSiswa ? classroomService.getStudentAttendanceStats(account.ID, account.KELAS) : null;

  // Class Summary Counts for current date
  const totalStudents = classStudents.length;
  let hadirCount = 0;
  let sakitCount = 0;
  let izinCount = 0;
  let alpaCount = 0;

  classStudents.forEach((s) => {
    const st = localStatuses[s.ID]?.status || 'HADIR';
    if (st === 'HADIR') hadirCount++;
    else if (st === 'SAKIT') sakitCount++;
    else if (st === 'IZIN') izinCount++;
    else if (st === 'ALPA') alpaCount++;
  });

  // Calculate Semester Attendance Stats for all students in class
  const classSemesterStats = classStudents.map((s) => {
    const stats = classroomService.getStudentAttendanceStats(s.ID, currentClassTarget);
    return {
      ...s,
      stats,
    };
  });

  // ========================================================
  // === EXPORT REKAP PRESENSI TO CSV (TABLE ARCHIVE) ===
  // ========================================================
  const handleDownloadRekapCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    if (exportType === 'HARIAN') {
      csvContent += `REKAP PRESENSI HARIAN SISWA - SDN TANGERANG 6\n`;
      csvContent += `Kelas: ${currentClassTarget},Tanggal: ${selectedDate},Sesi: ${session}\n`;
      csvContent += `Dicatat Oleh: ${account.NAMA} (${account.ROLE})\n\n`;
      csvContent += `No,NISN / ID,Nama Siswa,Kelas,Status Kehadiran,Catatan Guru\n`;

      classStudents.forEach((siswa, idx) => {
        const current = localStatuses[siswa.ID] || { status: 'HADIR', catatan: '' };
        const cleanCatatan = (current.catatan || '-').replace(/"/g, '""');
        csvContent += `${idx + 1},"${siswa.NIP || siswa.ID}","${siswa.NAMA}","${currentClassTarget}","${current.status}","${cleanCatatan}"\n`;
      });

      csvContent += `\nRingkasan Kehadiran: Total Siswa: ${totalStudents}, Hadir: ${hadirCount}, Sakit: ${sakitCount}, Izin: ${izinCount}, Alpa: ${alpaCount}\n`;
    } else {
      csvContent += `REKAPITULASI PRESENSI SEMESTER SISWA - SDN TANGERANG 6\n`;
      csvContent += `Kelas: ${currentClassTarget},Tahun Ajaran: 2026/2027 (Semester Ganjil)\n\n`;
      csvContent += `No,NISN / ID,Nama Siswa,Kelas,Total Hadir (Hari),Sakit (Hari),Izin (Hari),Alpa (Hari),Persentase Kehadiran (%)\n`;

      classSemesterStats.forEach((item, idx) => {
        csvContent += `${idx + 1},"${item.NIP || item.ID}","${item.NAMA}","${currentClassTarget}",${item.stats.hadir},${item.stats.sakit},${item.stats.izin},${item.stats.alpa},${item.stats.percentage}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Presensi_${currentClassTarget.replace(/\s+/g, '_')}_${exportType === 'HARIAN' ? selectedDate : 'Semester'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kepala Sekolah: Download All Classes Attendance Summary
  const handleDownloadAllClassesCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += `REKAPITULASI PRESENSI SELURUH KELAS - SDN TANGERANG 6\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')},Otoritas: ${account.NAMA} (Kepala Sekolah)\n\n`;
    csvContent += `No,Tingkat Kelas,Jumlah Siswa,Rata-rata Kehadiran Semester (%),Keterangan Disiplin\n`;

    STANDARD_CLASSES.forEach((cls, idx) => {
      const studs = accountService.getStudents(cls);
      const avgPct =
        studs.length > 0
          ? Math.round(
              studs.reduce((acc, s) => acc + classroomService.getStudentAttendanceStats(s.ID, cls).percentage, 0) /
                studs.length
            )
          : 95;
      csvContent += `${idx + 1},"${cls}",${studs.length},${avgPct}%,"Tercatat di Sistem E-Rapor"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Presensi_Semua_Kelas_SDN_Tangerang_6.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Presensi & Kehadiran Siswa</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {currentClassTarget}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pencatatan daftar hadir harian, persentase keaktifan & rekap e-Rapor SDN Tangerang 6
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Rekap Presensi Button for Guru & Kepsek */}
          {(isGuru || isKepsek) && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs transition active:scale-95 shadow-2xs"
            >
              <Download size={14} className="text-blue-600" />
              <span>Unduh Rekap Presensi</span>
            </button>
          )}

          {isKepsek && (
            <button
              onClick={handleDownloadAllClassesCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-xs transition active:scale-95"
            >
              <FileSpreadsheet size={14} />
              <span>Rekap Semua Kelas (CSV)</span>
            </button>
          )}

          {isSiswa && (
            <button
              onClick={handleSelfCheckin}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <CheckCircle2 size={16} /> Isi Presensi Mandiri Hari Ini
            </button>
          )}

          {(isGuru || isKepsek) && (
            <>
              <button
                onClick={handleMarkAllHadir}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
              >
                Set Hadir Semua
              </button>
              <button
                onClick={handleSaveAttendance}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <Check size={16} /> Simpan Presensi
              </button>
            </>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Presensi berhasil disimpan dan disinkronkan ke rekapitulasi nilai rapor!
        </div>
      )}

      {/* KEPALA SEKOLAH EXECUTIVE OVERVIEW BANNER */}
      {isKepsek && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-1">
                <School size={15} /> Monitoring Presensi Eksekutif Kepala Sekolah
              </div>
              <h3 className="text-base font-black text-white">
                Rata-rata Tingkat Kehadiran Sekolah: <span className="text-emerald-400">96.2%</span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Total 24 siswa aktif di 6 rombongan belajar (Kelas 1 s/d Kelas 6) siap diekspor ke format arsip resmi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedKelas('Kelas 1'); setShowArchiveModal(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition"
              >
                Lihat Format Cetak Arsip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SISWA VIEW: MY ATTENDANCE SUMMARY */}
      {isSiswa && studentRecap && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Tingkat Kehadiran</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{studentRecap.percentage}%</span>
              <span className="text-[10px] text-slate-500 font-semibold">Semester Ini</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${studentRecap.percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Hadir</span>
            <div className="text-2xl font-black text-slate-800">{studentRecap.hadir} <span className="text-xs font-normal text-slate-400">Hari</span></div>
            <span className="text-[10px] text-emerald-600 font-bold">Disiplin Belajar</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Sakit & Izin</span>
            <div className="text-2xl font-black text-amber-600">{studentRecap.sakit + studentRecap.izin} <span className="text-xs font-normal text-slate-400">Hari</span></div>
            <span className="text-[10px] text-slate-400 font-semibold">Tercatat Surat</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Tanpa Keterangan</span>
            <div className="text-2xl font-black text-slate-800">{studentRecap.alpa} <span className="text-xs font-normal text-slate-400">Hari</span></div>
            <span className="text-[10px] text-slate-400 font-semibold">Alpa: 0</span>
          </div>
        </div>
      )}

      {/* FILTER BAR FOR DATE & CLASS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Presensi</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {!account.KELAS && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sesi Pelajaran</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Presensi Pagi">Presensi Pagi & Apel</option>
              <option value="Sesi Tematik 1">Sesi Pembelajaran 1</option>
              <option value="Sesi Tematik 2">Sesi Pembelajaran 2</option>
            </select>
          </div>
        </div>

        {/* Quick Summary Pill & Quick Download Shortcut */}
        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">Hadir: {hadirCount}</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">Sakit: {sakitCount}</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">Izin: {izinCount}</span>
          <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800">Alpa: {alpaCount}</span>

          <button
            onClick={handleDownloadRekapCSV}
            title="Download CSV Tabel Ringkas"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center gap-1 text-[11px]"
          >
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">NISN / ID</th>
                <th className="p-4 text-center">Status Kehadiran</th>
                <th className="p-4">Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada data siswa terdaftar di kelas ini.
                  </td>
                </tr>
              ) : (
                classStudents.map((siswa, idx) => {
                  const current = localStatuses[siswa.ID] || { status: 'HADIR', catatan: '' };
                  const isCurrentAccount = siswa.ID === account.ID;

                  return (
                    <tr key={siswa.ID} className={`hover:bg-slate-50/80 transition ${isCurrentAccount ? 'bg-emerald-50/30' : ''}`}>
                      <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {siswa.NAMA.charAt(0)}
                          </div>
                          <span>{siswa.NAMA}</span>
                          {isCurrentAccount && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        <SecureMaskedField
                          value={siswa.NIP || siswa.ID}
                          type="nis"
                          fieldId={`att-nis-${siswa.ID}`}
                          label="NIS/NISN Siswa"
                          monospace
                          showDlpBadge
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          {(['HADIR', 'SAKIT', 'IZIN', 'ALPA'] as AttendanceStatus[]).map((st) => {
                            const isSelected = current.status === st;
                            const colorClass =
                              st === 'HADIR'
                                ? isSelected
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'hover:bg-emerald-50 text-slate-600'
                                : st === 'SAKIT'
                                ? isSelected
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'hover:bg-blue-50 text-slate-600'
                                : st === 'IZIN'
                                ? isSelected
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'hover:bg-amber-50 text-slate-600'
                                : isSelected
                                ? 'bg-red-600 text-white shadow-2xs'
                                : 'hover:bg-red-50 text-slate-600';

                            return (
                              <button
                                key={st}
                                type="button"
                                disabled={isSiswa && !isCurrentAccount}
                                onClick={() => handleStatusChange(siswa.ID, st)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${colorClass} ${
                                  isSiswa && !isCurrentAccount ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          disabled={isSiswa && !isCurrentAccount}
                          placeholder={isGuru ? 'Catatan kesehatan / izin...' : '-'}
                          value={current.catatan}
                          onChange={(e) => handleCatatanChange(siswa.ID, e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:bg-transparent disabled:border-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: UNDUH & PRATINJAU ARSIP REKAP PRESENSI KELAS (OFFICIAL SHEET) */}
      {/* ========================================================================= */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Unduh Rekap Presensi & Arsip Kelas</h3>
                  <p className="text-[10px] text-slate-400">
                    Format tabel ringkas untuk arsip wali kelas & laporan ke Kepala Sekolah
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setExportType('HARIAN')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      exportType === 'HARIAN' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Rekap Harian
                  </button>
                  <button
                    onClick={() => setExportType('SEMESTER')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      exportType === 'SEMESTER' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Rekap Semester
                  </button>
                </div>

                <button
                  onClick={handleDownloadRekapCSV}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Download size={13} /> Unduh File CSV (Excel)
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer size={13} /> Cetak Lembar Arsip
                </button>

                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-800 space-y-6 print:p-0">
              {/* Header Surat Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base font-black tracking-wider uppercase">PEMERINTAH KOTA TANGERANG</h2>
                <h3 className="text-sm font-black tracking-wide uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                <h1 className="text-lg font-black text-slate-900">SD NEGERI TANGERANG 6</h1>
                <p className="text-[10px] text-slate-500 font-serif">
                  Jl. Nyimas Melati No. 25, RT.002/RW.001, Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118
                </p>
              </div>

              {/* Title & Metadata */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase underline tracking-wider">
                  {exportType === 'HARIAN'
                    ? 'LEMBAR REKAPITULASI PRESENSI HARIAN KELAS'
                    : 'REKAPITULASI TINGKAT KEHADIRAN SISWA SATU SEMESTER'}
                </h4>
                <div className="flex justify-center items-center gap-4 text-xs text-slate-600 font-medium">
                  <span><strong>Kelas:</strong> {currentClassTarget}</span>
                  <span>•</span>
                  <span><strong>Tahun Ajaran:</strong> 2026/2027</span>
                  <span>•</span>
                  <span><strong>{exportType === 'HARIAN' ? 'Tanggal:' : 'Periode:'}</strong> {exportType === 'HARIAN' ? selectedDate : 'Semester Ganjil'}</span>
                </div>
              </div>

              {/* Summary Badges Box */}
              <div className="grid grid-cols-4 gap-3 text-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Total Siswa</span>
                  <span className="text-slate-800 font-black text-sm">{totalStudents} Siswa</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Hadir</span>
                  <span className="text-emerald-700 font-black text-sm">{exportType === 'HARIAN' ? hadirCount : '96% Rata-rata'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Sakit & Izin</span>
                  <span className="text-amber-700 font-black text-sm">{exportType === 'HARIAN' ? sakitCount + izinCount : 'Tercatat'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Tanpa Keterangan</span>
                  <span className="text-slate-700 font-black text-sm">{exportType === 'HARIAN' ? alpaCount : '0 Hari'}</span>
                </div>
              </div>

              {/* Archive Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">NISN / ID</th>
                      <th className="p-3">Nama Lengkap Siswa</th>
                      <th className="p-3 text-center">Kelas</th>
                      {exportType === 'HARIAN' ? (
                        <>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Keterangan / Catatan</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 text-center">Hadir</th>
                          <th className="p-3 text-center">Sakit</th>
                          <th className="p-3 text-center">Izin</th>
                          <th className="p-3 text-center">Alpa</th>
                          <th className="p-3 text-center">Kehadiran (%)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {exportType === 'HARIAN'
                      ? classStudents.map((siswa, idx) => {
                          const current = localStatuses[siswa.ID] || { status: 'HADIR', catatan: '' };
                          return (
                            <tr key={siswa.ID} className="hover:bg-slate-50">
                              <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                              <td className="p-2.5 font-mono text-[11px]">
                                <SecureMaskedField
                                  value={siswa.NIP || siswa.ID}
                                  type="nis"
                                  fieldId={`att-rec-nis-${siswa.ID}`}
                                  label="NIS/NISN Siswa"
                                  monospace
                                />
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">{siswa.NAMA}</td>
                              <td className="p-2.5 text-center">{currentClassTarget}</td>
                              <td className="p-2.5 text-center font-black">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] ${
                                    current.status === 'HADIR'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : current.status === 'SAKIT'
                                      ? 'bg-blue-100 text-blue-800'
                                      : current.status === 'IZIN'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {current.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px]">{current.catatan || '-'}</td>
                            </tr>
                          );
                        })
                      : classSemesterStats.map((item, idx) => (
                          <tr key={item.ID} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-[11px]">{item.NIP || item.ID}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.NAMA}</td>
                            <td className="p-2.5 text-center">{currentClassTarget}</td>
                            <td className="p-2.5 text-center font-semibold text-emerald-700">{item.stats.hadir}</td>
                            <td className="p-2.5 text-center">{item.stats.sakit}</td>
                            <td className="p-2.5 text-center">{item.stats.izin}</td>
                            <td className="p-2.5 text-center">{item.stats.alpa}</td>
                            <td className="p-2.5 text-center font-black text-emerald-700">{item.stats.percentage}%</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-8">
                <div>
                  <p className="text-slate-500 mb-16">
                    Mengetahui,<br />Kepala Sekolah SDN Tangerang 6,
                  </p>
                  <p className="font-bold underline">Liestya Kusuma Sari, S.Pd., M.Pd.</p>
                  <p className="text-[10px] text-slate-400">NIP. 19740520 199803 2 004</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-16">
                    Tangerang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />
                    Guru Kelas / Wali Kelas,
                  </p>
                  <p className="font-bold underline">{account.ROLE === 'GURU' ? account.NAMA : 'Nurul Hidayah, S.Pd.'}</p>
                  <p className="text-[10px] text-slate-400">NIP. {account.ROLE === 'GURU' ? (account.NIP || '-') : '19850412 201101 2 003'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
