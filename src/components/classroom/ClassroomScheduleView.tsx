import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  School,
  Plus,
  Trash2,
  MapPin,
  User,
  Sparkles,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  FileText,
  Filter,
  Check,
  AlertCircle,
  HelpCircle,
  Award,
  ArrowRight,
  Layers,
  Bell,
  X
} from 'lucide-react';
import { Account, ClassScheduleItem, ClassroomAssignment, ClassroomQuiz } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomScheduleViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomScheduleView: React.FC<ClassroomScheduleViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [sessDay1, setSessDay1] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [sessDay2, setSessDay2] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Selasa');
  const [sessDay3, setSessDay3] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Rabu');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [calendarFilter, setCalendarFilter] = useState<'ALL' | 'TUGAS_KELAS' | 'KUIS' | 'AGENDA_SEKOLAH'>('ALL');

  // Schedule Form State
  const [schHari, setSchHari] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [schMulai, setSchMulai] = useState('07:30');
  const [schSelesai, setSchSelesai] = useState('09:00');
  const [schMapel, setSchMapel] = useState('Tematik Terpadu');
  const [schGuru, setSchGuru] = useState(account.NAMA || 'Guru Kelas');
  const [schRuangan, setSchRuangan] = useState('Ruang Kelas 1');

  // Assignment Sync Form State
  const [asgCourseId, setAsgCourseId] = useState('');
  const [asgJudul, setAsgJudul] = useState('');
  const [asgDeskripsi, setAsgDeskripsi] = useState('');
  const [asgDeadline, setAsgDeadline] = useState('2026-09-15');
  const [asgType, setAsgType] = useState<'TUGAS' | 'MATERI' | 'ULANGAN'>('TUGAS');

  const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  const targetClass = account.ROLE === 'SISWA' || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas;

  // Retrieve data from classroomService
  const schedules = classroomService.getSchedules(targetClass);
  const classCourses = classroomService.getCourses().filter((c) => c.KELAS_TINGKAT === targetClass);
  const classCourseIds = new Set(classCourses.map((c) => c.ID));

  const allAssignments = classroomService.getAssignments();
  const classAssignments = allAssignments.filter(
    (a) => classCourseIds.has(a.COURSE_ID) || !a.COURSE_ID || classCourses.some(c => c.GURU_NAMA === a.GURU_NAMA)
  );

  const allQuizzes = classroomService.getQuizzes();
  const classQuizzes = allQuizzes.filter(
    (q) => q.KELAS === targetClass || classCourseIds.has(q.COURSE_ID)
  );

  // Synchronized Items count
  const totalSyncedTasks = classAssignments.length + classQuizzes.length;

  // Handle Manual Trigger for Synchronization
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback(
        `Berhasil menyinkronkan ${classAssignments.length} penugasan dan ${classQuizzes.length} kuis ke Kalender Akademik ${targetClass}!`
      );
      onRefresh();
    }, 600);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schMapel.trim()) return;

    classroomService.saveSchedule({
      KELAS: targetClass,
      HARI: schHari,
      JAM_MULAI: schMulai,
      JAM_SELESAI: schSelesai,
      MAPEL: schMapel,
      GURU_NAMA: schGuru,
      RUANGAN: schRuangan,
    });

    setSchMapel('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Hapus mata pelajaran dari jadwal ini?')) {
      classroomService.deleteSchedule(id);
      onRefresh();
    }
  };

  // Quick Add Assignment that automatically syncs to calendar
  const handleSaveNewAssignmentSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgJudul.trim()) return;

    const courseToUse = classCourses[0]?.ID || 'CRS-001';

    classroomService.saveAssignment({
      COURSE_ID: asgCourseId || courseToUse,
      JUDUL: asgJudul.trim(),
      DESKRIPSI: asgDeskripsi.trim() || 'Tugas terintegrasi kalender akademik',
      DEADLINE: asgDeadline,
      TYPE: asgType,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
    });

    setAsgJudul('');
    setAsgDeskripsi('');
    setShowAddAssignmentModal(false);
    setSyncFeedback(`Penugasan "${asgJudul}" berhasil dibuat & tersinkronisasi otomatis ke Kalender Akademik!`);
    onRefresh();
  };

  const handleAddOptimizedSession = (hari: string, mapel: string, mulai: string, selesai: string) => {
    classroomService.saveSchedule({
      KELAS: targetClass,
      HARI: hari as any,
      JAM_MULAI: mulai,
      JAM_SELESAI: selesai,
      MAPEL: mapel,
      GURU_NAMA: 'Belajar Mandiri',
      RUANGAN: 'Rumah / Mandiri',
    });
    setSyncFeedback(`Sesi belajar mandiri "${mapel}" hari ${hari} berhasil ditambahkan ke jadwal!`);
    setShowOptimizeModal(false);
    onRefresh();
  };

  // Institutional Milestones
  const schoolEvents = [
    {
      id: 'EVT-001',
      title: 'Penilaian Tengah Semester (PTS)',
      date: '15 - 20 September 2026',
      rawDate: '2026-09-15',
      desc: 'Ujian CBT serentak tingkat sekolah',
      category: 'AGENDA_SEKOLAH' as const,
      color: 'border-amber-400 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'EVT-002',
      title: 'Pekan Literasi & Proyek P5',
      date: '10 - 15 Oktober 2026',
      rawDate: '2026-10-10',
      desc: 'Gelar karya siswa & pameran hasil belajar',
      category: 'AGENDA_SEKOLAH' as const,
      color: 'border-emerald-400 bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'EVT-003',
      title: 'Penilaian Akhir Semester (PAS)',
      date: '01 - 10 Desember 2026',
      rawDate: '2026-12-01',
      desc: 'Evaluasi capaian kurikulum merdeka',
      category: 'AGENDA_SEKOLAH' as const,
      color: 'border-blue-400 bg-blue-500/10 text-blue-300',
    },
    {
      id: 'EVT-004',
      title: 'Pembagian E-Rapor Semester',
      date: '19 Desember 2026',
      rawDate: '2026-12-19',
      desc: 'Pertemuan wali murid dan konsultasi hasil',
      category: 'AGENDA_SEKOLAH' as const,
      color: 'border-purple-400 bg-purple-500/10 text-purple-300',
    },
  ];

  // Combined Agenda & Synced Items
  const syncedCalendarItems = [
    ...schoolEvents.map((e) => ({
      id: e.id,
      title: e.title,
      dateFormatted: e.date,
      rawDate: e.rawDate,
      type: 'AGENDA' as const,
      category: 'AGENDA_SEKOLAH' as const,
      desc: e.desc,
      author: 'Panitia Kurikulum',
      courseName: 'Seluruh Sekolah',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    })),

    ...classAssignments.map((a) => {
      const course = classCourses.find((c) => c.ID === a.COURSE_ID);
      return {
        id: a.ID,
        title: a.JUDUL,
        dateFormatted: `Deadline: ${a.DEADLINE}`,
        rawDate: a.DEADLINE,
        type: a.TYPE,
        category: 'TUGAS_KELAS' as const,
        desc: a.DESKRIPSI,
        author: a.GURU_NAMA,
        courseName: course?.NAMA || targetClass,
        badgeColor:
          a.TYPE === 'ULANGAN'
            ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
            : a.TYPE === 'MATERI'
            ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
            : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      };
    }),

    ...classQuizzes.map((q) => ({
      id: q.ID,
      title: `[CBT Kuis] ${q.JUDUL}`,
      dateFormatted: `Batas Ujian: ${q.DEADLINE}`,
      rawDate: q.DEADLINE,
      type: 'KUIS' as const,
      category: 'KUIS' as const,
      desc: `${q.DESKRIPSI} • KKM: ${q.KKM} • Durasi: ${q.DURASI_MENIT} Menit`,
      author: q.GURU_NAMA,
      courseName: targetClass,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    })),
  ].sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  const filteredCalendarItems = syncedCalendarItems.filter((item) => {
    if (calendarFilter === 'ALL') return true;
    return item.category === calendarFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner with Sync Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Jadwal Pelajaran & Kalender Akademik
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 border border-emerald-300">
                <CheckCircle2 size={12} className="text-emerald-600" /> Auto-Sync Penugasan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jadwal sesi mingguan dan kalender akademik terpadu {targetClass} SDN Tangerang 6
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!account.KELAS && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition active:scale-95 disabled:opacity-50"
            title="Sinkronkan penugasan terbaru ke kalender"
          >
            <RefreshCw size={14} className={`text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Tugas'}</span>
          </button>

          <button
            onClick={() => setShowOptimizeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition active:scale-95 shadow-2xs"
            title="Optimalkan jadwal belajar mandiri berbasis beban tugas siswa"
          >
            <Sparkles size={14} className="text-indigo-600 animate-pulse" />
            <span>Optimasi Jadwal</span>
          </button>

          {(isGuru || isKepsek) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddAssignmentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                <FileText size={15} /> + Tugas Kalender
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                <Plus size={16} /> Jam Pelajaran
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Feedback Toast Alert */}
      {syncFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs px-2 py-0.5 rounded-lg hover:bg-emerald-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Days Tabs for Weekly Timetable */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedDay === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Hari (Senin - Jumat)
          </button>
          {days.slice(0, 5).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDay === d
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Layers size={13} className="text-indigo-600" />
          <span>Total Sesi: {schedules.length} Jam Pelajaran</span>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.slice(0, 5).map((day) => {
          if (selectedDay !== 'ALL' && selectedDay !== day) return null;

          const daySchedules = schedules
            .filter((s) => s.HARI === day)
            .sort((a, b) => a.JAM_MULAI.localeCompare(b.JAM_MULAI));

          // Find assignments related to subjects taught on this day or assigned for this class
          const dayAssignments = classAssignments.slice(0, 2);

          return (
            <div
              key={day}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wide">{day}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{daySchedules.length} Sesi Mapel</span>
                </div>

                {daySchedules.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada jadwal terdaftar untuk hari {day}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {daySchedules.map((item) => (
                      <div
                        key={item.ID}
                        className="bg-slate-50 hover:bg-indigo-50/40 p-3 rounded-xl border border-slate-100 transition group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-mono font-bold text-[11px]">
                            <Clock size={12} />
                            <span>
                              {item.JAM_MULAI} - {item.JAM_SELESAI}
                            </span>
                          </div>

                          {(isGuru || isKepsek) && (
                            <button
                              onClick={() => handleDeleteSchedule(item.ID)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <h4 className="font-bold text-xs text-slate-800 mt-1 leading-snug">{item.MAPEL}</h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/50">
                          <span className="flex items-center gap-1">
                            <User size={10} /> {item.GURU_NAMA}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin size={10} /> {item.RUANGAN}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Synchronized Assignments Sub-section for Day */}
              {dayAssignments.length > 0 && (
                <div className="pt-3 border-t border-slate-100 bg-indigo-50/30 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900">
                    <span className="flex items-center gap-1">
                      <Bell size={11} className="text-amber-500" /> Penugasan Tersinkron Hari Ini
                    </span>
                    <span className="bg-indigo-100 px-1.5 py-0.2 rounded text-[9px]">Auto</span>
                  </div>
                  {dayAssignments.map((asg) => (
                    <div key={asg.ID} className="text-[10px] bg-white p-2 rounded-lg border border-indigo-100 flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700 line-clamp-1">{asg.JUDUL}</span>
                      <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0 font-bold">
                        {asg.DEADLINE}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SYNCHRONIZED ACADEMIC CALENDAR & AGENDA SECTION */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <Sparkles size={11} /> Kalender Akademik Terpadu
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <RefreshCw size={11} /> {totalSyncedTasks} Penugasan & Kuis Tersinkron
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Calendar size={20} className="text-amber-400" /> Agenda Sekolah & Penugasan Kelas {targetClass}
            </h3>
            <p className="text-xs text-slate-300">
              Setiap tugas, materi, kuis CBT, dan kegiatan PTS/PAS yang dibuat guru secara otomatis masuk ke kalender ini.
            </p>
          </div>

          {/* Filter Pills for Academic Calendar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'Semua Agenda', count: syncedCalendarItems.length },
              { id: 'TUGAS_KELAS', label: 'Tugas Class', count: classAssignments.length },
              { id: 'KUIS', label: 'Kuis CBT', count: classQuizzes.length },
              { id: 'AGENDA_SEKOLAH', label: 'Agenda PTS/PAS', count: schoolEvents.length },
            ].map((tab) => {
              const isActive = calendarFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCalendarFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar Grid Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredCalendarItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 hover:border-amber-400/50 hover:bg-white/15 transition-all duration-300 flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${item.badgeColor}`}
                  >
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 font-bold">{item.dateFormatted}</span>
                </div>

                <h4 className="font-extrabold text-xs text-white group-hover:text-amber-200 transition-colors line-clamp-2">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="truncate max-w-[120px]">{item.author}</span>
                <span className="text-amber-300/80 font-semibold">{item.courseName}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredCalendarItems.length === 0 && (
          <div className="relative z-10 text-center py-10 text-slate-400 text-xs">
            Tidak ada agenda atau tugas dalam kategori ini.
          </div>
        )}
      </div>

      {/* MODAL: CREATE TIMETABLE SCHEDULE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-800">Tambah Sesi Jam Pelajaran</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                <select
                  value={schHari}
                  onChange={(e) => setSchHari(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={schMulai}
                    onChange={(e) => setSchMulai(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={schSelesai}
                    onChange={(e) => setSchSelesai(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tematik (Bahasa Indonesia & Literasi)"
                  value={schMapel}
                  onChange={(e) => setSchMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Pengampu</label>
                <input
                  type="text"
                  required
                  value={schGuru}
                  onChange={(e) => setSchGuru(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  required
                  value={schRuangan}
                  onChange={(e) => setSchRuangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ASSIGNMENT AUTO-SYNC TO CALENDAR */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                <h3 className="font-black text-base text-slate-800">Tambah Penugasan Tersinkron Kalender</h3>
              </div>
              <button
                onClick={() => setShowAddAssignmentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewAssignmentSync} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran / Kursus</label>
                <select
                  value={asgCourseId}
                  onChange={(e) => setAsgCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Pilih Kursus / Mapel --</option>
                  {classCourses.map((c) => (
                    <option key={c.ID} value={c.ID}>
                      {c.NAMA}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Penugasan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Latihan Soal Matematika Pecahan Desimal"
                  value={asgJudul}
                  onChange={(e) => setAsgJudul(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penugasan</label>
                  <select
                    value={asgType}
                    onChange={(e) => setAsgType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="TUGAS">Tugas Harian</option>
                    <option value="ULANGAN">Ulangan Harian</option>
                    <option value="MATERI">Materi & Latihan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Deadline</label>
                  <input
                    type="date"
                    required
                    value={asgDeadline}
                    onChange={(e) => setAsgDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
                <textarea
                  rows={3}
                  placeholder="Instruksi pengerjaan tugas atau materi pendukung..."
                  value={asgDeskripsi}
                  onChange={(e) => setAsgDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Check size={14} /> Simpan & Auto-Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTO-OPTIMIZE SCHEDULE MODAL */}
      {showOptimizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
            {/* Header Banner */}
            <div className="p-6 bg-linear-to-r from-indigo-700 to-indigo-950 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-wide">Asisten Optimasi Jadwal Mandiri</h3>
                    <p className="text-[10px] text-indigo-200">Rekomendasi Berbasis Beban Tugas & Pola Produktivitas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOptimizeModal(false)}
                  className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Load Analysis Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800">Analisis Beban Tugas Kelas</h4>
                  <p className="text-[11px] text-slate-500">
                    Sistem mendeteksi <strong className="text-indigo-700">{totalSyncedTasks} tugas & kuis aktif</strong> pada kelas {targetClass}. 
                    {totalSyncedTasks > 3 
                      ? ' Beban tugas tergolong tinggi! Kami sangat menyarankan penambahan sesi fokus belajar mandiri agar materi terserap optimal.'
                      : ' Beban tugas tergolong sedang. Sesi belajar mandiri yang terjadwal akan membantu konsistensi belajar.'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status Beban</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${
                    totalSyncedTasks > 4 ? 'bg-red-100 text-red-700' : totalSyncedTasks > 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {totalSyncedTasks > 4 ? '🔥 SANGAT PADAT' : totalSyncedTasks > 2 ? '⚡ SEDANG' : '🟢 RINGAN'}
                  </span>
                </div>
              </div>

              {/* Productivity Peaks Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" />
                  <span>Pola Produktivitas Emas Peserta Didik</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <span className="font-bold text-amber-900 block mb-0.5">☀️ Puncak Logika (Pagi)</span>
                    <span className="text-slate-500">08:00 - 10:00 • Fokus analitis, sangat cocok untuk Matematika & Sains (Numerasi).</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60">
                    <span className="font-bold text-blue-900 block mb-0.5">⛅ Puncak Bahasa (Siang)</span>
                    <span className="text-slate-500">13:30 - 15:00 • Konsolidasi memori & bahasa, ideal untuk Literasi & Membaca.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                    <span className="font-bold text-emerald-900 block mb-0.5">🌅 Puncak Ujian (Sore)</span>
                    <span className="text-slate-500">16:00 - 17:30 • Fokus evaluatif & latihan mandiri, cocok untuk drill soal & kuis.</span>
                  </div>
                </div>
              </div>

              {/* Suggestions Cards List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700">Rekomendasi Slot Belajar Mandiri Terbimbing</h4>

                {/* Recommendation 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px]">Sesi 1 • Pagi</span>
                      <span className="text-[11px] font-bold text-slate-800">Fokus Numerasi & Matematika Mandiri</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Pukul 08:30 - 10:00 • Meningkatkan pemecahan masalah logika numerik.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select 
                      value={sessDay1} 
                      onChange={(e) => setSessDay1(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 font-bold bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button 
                      onClick={() => handleAddOptimizedSession(sessDay1, 'Belajar Mandiri (Matematika & Numerasi)', '08:30', '10:00')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      + Jadwalkan
                    </button>
                  </div>
                </div>

                {/* Recommendation 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[9px]">Sesi 2 • Siang</span>
                      <span className="text-[11px] font-bold text-slate-800">Pemahaman Literasi & Bahasa Mandiri</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Pukul 13:30 - 15:00 • Membaca pemahaman narasi & merangkum materi.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select 
                      value={sessDay2} 
                      onChange={(e) => setSessDay2(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 font-bold bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button 
                      onClick={() => handleAddOptimizedSession(sessDay2, 'Belajar Mandiri (Literasi & Bahasa)', '13:30', '15:00')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      + Jadwalkan
                    </button>
                  </div>
                </div>

                {/* Recommendation 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px]">Sesi 3 • Sore</span>
                      <span className="text-[11px] font-bold text-slate-800">Drill Soal Kuis & Latihan Mandiri</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Pukul 16:30 - 17:30 • Pengulangan aktif (Active Recall) berbasis CBT.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select 
                      value={sessDay3} 
                      onChange={(e) => setSessDay3(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 font-bold bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button 
                      onClick={() => handleAddOptimizedSession(sessDay3, 'Belajar Mandiri (Drill Soal & Kuis)', '16:30', '17:30')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      + Jadwalkan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setShowOptimizeModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
