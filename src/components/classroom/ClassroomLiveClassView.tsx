import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Radio,
  Copy,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';
import { Account, VirtualLiveClassSession } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { STANDARD_CLASSES } from '../../services/accountService';

interface ClassroomLiveClassViewProps {
  account: Account;
}

export const ClassroomLiveClassView: React.FC<ClassroomLiveClassViewProps> = ({ account }) => {
  const isGuruOrAdmin = account.ROLE === 'GURU' || account.ROLE === 'ADMIN' || account.ROLE === 'OPERATOR';
  const userKelas = account.KELAS || 'Kelas 1A';

  const [sessions, setSessions] = useState<VirtualLiveClassSession[]>([]);
  const [filterKelas, setFilterKelas] = useState<string>(isGuruOrAdmin ? userKelas : userKelas);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [mapel, setMapel] = useState('Tematik & Bahasa Indonesia');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jamMulai, setJamMulai] = useState('08:30');
  const [jamSelesai, setJamSelesai] = useState('09:30');
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/abc-defg-hij');
  const [platform, setPlatform] = useState<'GOOGLE_MEET' | 'ZOOM' | 'WEBRTC' | 'TEAMS'>('GOOGLE_MEET');

  const loadSessions = () => {
    const data = classroomService.getLiveClasses(isGuruOrAdmin ? filterKelas : userKelas);
    setSessions(data);
  };

  useEffect(() => {
    loadSessions();

    const handleSync = () => loadSessions();
    window.addEventListener('bb_storage_sync', handleSync);
    return () => window.removeEventListener('bb_storage_sync', handleSync);
  }, [filterKelas, userKelas]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !meetUrl) return;

    const newSession: VirtualLiveClassSession = {
      ID: 'LIVE-' + Date.now(),
      KELAS: isGuruOrAdmin ? filterKelas : userKelas,
      MAPEL: mapel,
      JUDUL: judul,
      DESKRIPSI: deskripsi,
      TANGGAL: tanggal,
      JAM_MULAI: jamMulai,
      JAM_SELESAI: jamSelesai,
      MEET_URL: meetUrl,
      PLATFORM: platform,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
      STATUS: 'BERLANGSUNG',
      CREATED_AT: new Date().toISOString(),
    };

    classroomService.saveLiveClass(newSession);
    setShowAddModal(false);
    setJudul('');
    setDeskripsi('');
    loadSessions();
  };

  const handleToggleStatus = (session: VirtualLiveClassSession, newStatus: 'JADWAL' | 'BERLANGSUNG' | 'SELESAI') => {
    classroomService.saveLiveClass({ ...session, STATUS: newStatus });
    loadSessions();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal tatap muka ini?')) {
      classroomService.deleteLiveClass(id);
      loadSessions();
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformBadge = (p: string) => {
    switch (p) {
      case 'GOOGLE_MEET':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Google Meet</span>;
      case 'ZOOM':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Zoom Cloud</span>;
      case 'WEBRTC':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">WebRTC Live Stream</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">Teams</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/30">
              <Radio size={14} className="animate-pulse text-rose-400" /> Tatap Muka Daring Real-Time
            </div>
            <h1 className="text-2xl font-black tracking-tight">Ruang Kelas Daring (Virtual Live Class)</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Fasilitas tatap muka langsung via Google Meet / Zoom terintegrasi untuk pembelajaran interaktif, presentasi materi, dan sesi tanya jawab live.
            </p>
          </div>

          {isGuruOrAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg transition duration-200 cursor-pointer"
            >
              <Plus size={18} />
              <span>Jadwalkan Live Class</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & STATS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Kelas:</span>
          {isGuruOrAdmin ? (
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua Kelas</option>
              {STANDARD_CLASSES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
              {userKelas}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Berlangsung: <strong>{sessions.filter((s) => s.STATUS === 'BERLANGSUNG').length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Terjadwal: <strong>{sessions.filter((s) => s.STATUS === 'JADWAL').length}</strong></span>
          </div>
        </div>
      </div>

      {/* SESSIONS GRID */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Video size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-700">Belum Ada Sesi Live Class</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isGuruOrAdmin
              ? 'Klik "Jadwalkan Live Class" di atas untuk membuat tautan Google Meet / Zoom baru.'
              : 'Belum ada jadwal tatap muka daring aktif untuk kelas Anda hari ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((s) => {
            const isLiveNow = s.STATUS === 'BERLANGSUNG';
            return (
              <div
                key={s.ID}
                className={`bg-white rounded-2xl p-6 border transition-all duration-200 shadow-sm hover:shadow-md relative flex flex-col justify-between ${
                  isLiveNow ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Status Banner */}
                  <div className="flex items-center justify-between mb-3">
                    {getPlatformBadge(s.PLATFORM)}
                    {isLiveNow ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                        <Radio size={14} /> LIVE SEKARANG
                      </span>
                    ) : s.STATUS === 'SELESAI' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                        Selesai
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Terjadwal
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-blue-600 mb-1">{s.KELAS} • {s.MAPEL}</div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{s.JUDUL}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{s.DESKRIPSI}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{s.TANGGAL}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      <span>{s.JAM_MULAI} - {s.JAM_SELESAI} WIB</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Users size={14} className="text-slate-400" />
                      <span>Pengampu: <strong>{s.GURU_NAMA}</strong></span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={s.MEET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-xs ${
                        isLiveNow
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Video size={16} />
                      <span>Buka Ruang Tatap Muka</span>
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => handleCopyLink(s.MEET_URL, s.ID)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      title="Salin Tautan Meet"
                    >
                      {copiedId === s.ID ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>

                    {isGuruOrAdmin && (
                      <button
                        onClick={() => handleDelete(s.ID)}
                        className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Sesi Live"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {isGuruOrAdmin && (
                    <div className="flex items-center justify-end gap-2 text-xs pt-1">
                      <span className="text-slate-400 font-semibold">Ubah Status:</span>
                      <button
                        onClick={() => handleToggleStatus(s, 'BERLANGSUNG')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          s.STATUS === 'BERLANGSUNG' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Live
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s, 'JADWAL')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          s.STATUS === 'JADWAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Jadwal
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s, 'SELESAI')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          s.STATUS === 'SELESAI' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Selesai
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL JADWALKAN LIVE CLASS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video size={20} className="text-blue-600" />
                Jadwalkan Tatap Muka Live
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Sesi Tatap Muka</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sesi Live Storytelling Tematik"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Instruksi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas agenda pertemuan..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Platform Video</label>
                  <select
                    value={platform}
                    onChange={(e: any) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom Cloud</option>
                    <option value="WEBRTC">WebRTC Stream</option>
                    <option value="TEAMS">MS Teams</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan / Link Pertemuan (URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/..."
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    placeholder="09:30"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Simpan & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
