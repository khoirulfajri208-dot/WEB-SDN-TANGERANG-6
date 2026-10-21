import React, { useState, useMemo } from 'react';
import {
  Video, BookOpen, Award, CheckCircle2, Clock, Plus, Trash2, Edit2, Eye,
  Search, FileText, Send, Star, Check, Sparkles, AlertCircle, Play, Bookmark
} from 'lucide-react';
import { ClassroomCourse, ClassroomMedia, MediaSubmission, MediaType, Account } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService } from '../../services/accountService';

interface ClassroomMediaViewProps {
  account: Account;
  courses: ClassroomCourse[];
  refresh: () => void;
}

export const ClassroomMediaView: React.FC<ClassroomMediaViewProps> = ({ account, courses, refresh }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.ID || '');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ClassroomMedia | null>(null); // For student view / grading view
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'submissions'>('list');

  // Form states for creating media (Guru)
  const [formJudul, setFormJudul] = useState('');
  const [formCourseId, setFormCourseId] = useState(courses[0]?.ID || '');
  const [formKategori, setFormKategori] = useState<MediaType>('VIDEO');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTujuan, setFormTujuan] = useState('');
  const [formTugas, setFormTugas] = useState('');

  // Student submission form state
  const [studentJawaban, setStudentJawaban] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH' || account.ROLE === 'ADMIN';

  const mediaList = useMemo(() => {
    let all = classroomService.getMediaItems();
    if (isSiswa && courses.length > 0) {
      const cIds = courses.map(c => c.ID);
      all = all.filter(m => cIds.includes(m.COURSE_ID));
    } else if (isGuru) {
      all = all.filter(m => m.GURU_ID === account.ID);
    }
    if (categoryFilter !== 'ALL') {
      all = all.filter(m => m.KATEGORI === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(m => m.JUDUL.toLowerCase().includes(q) || m.DESKRIPSI.toLowerCase().includes(q));
    }
    return all;
  }, [courses, categoryFilter, search, account]);

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul || !formTujuan) {
      alert('Judul dan Tujuan Pembelajaran wajib diisi!');
      return;
    }
    const newMedia: ClassroomMedia = {
      ID: 'MED-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      COURSE_ID: formCourseId,
      JUDUL: formJudul,
      DESKRIPSI: formDeskripsi,
      KATEGORI: formKategori,
      MEDIA_URL: formUrl,
      TUJUAN_PEMBELAJARAN: formTujuan,
      TUGAS_INTERAKTIF: formTugas,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
      CREATED_AT: new Date().toISOString(),
      TARGET_KELAS: courses.find(c => c.ID === formCourseId)?.KELAS_TINGKAT || account.KELAS || 'Semua Kelas',
    };

    classroomService.saveMediaItem(newMedia);
    setShowCreateModal(false);
    setFormJudul('');
    setFormDeskripsi('');
    setFormUrl('');
    setFormTujuan('');
    setFormTugas('');
    refresh();
  };

  const handleDeleteMedia = (id: string) => {
    if (confirm('Hapus media pembelajaran ini?')) {
      classroomService.deleteMediaItem(id);
      refresh();
    }
  };

  const handleOpenStudentMedia = (media: ClassroomMedia) => {
    setActiveMedia(media);
    const existing = classroomService.getMediaSubmissions(media.ID, account.ID)[0];
    if (existing) {
      setStudentJawaban(existing.JAWABAN_TUGAS || '');
    } else {
      setStudentJawaban('');
      // Create initial submission as 'SEDANG_DIPELAJARI'
      classroomService.saveMediaSubmission({
        ID: 'MSUB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        MEDIA_ID: media.ID,
        SISWA_ID: account.ID,
        SISWA_NAMA: account.NAMA,
        STATUS: 'SEDANG_DIPELAJARI',
        UPDATED_AT: new Date().toISOString(),
      });
    }
    setViewMode('detail');
  };

  const handleCompleteStudentMedia = (status: 'SEDANG_DIPELAJARI' | 'SELESAI') => {
    if (!activeMedia) return;
    const existing = classroomService.getMediaSubmissions(activeMedia.ID, account.ID)[0];
    classroomService.saveMediaSubmission({
      ID: existing?.ID || ('MSUB-' + Math.random().toString(36).substring(2, 9).toUpperCase()),
      MEDIA_ID: activeMedia.ID,
      SISWA_ID: account.ID,
      SISWA_NAMA: account.NAMA,
      STATUS: status,
      JAWABAN_TUGAS: studentJawaban,
      UPDATED_AT: new Date().toISOString(),
      NILAI: existing?.NILAI,
      FEEDBACK: existing?.FEEDBACK,
    });
    setSuccessMsg(status === 'SELESAI' ? 'Berhasil! Media pembelajaran telah diselesaikan dan tugas refleksi tersimpan.' : 'Progress tersimpan.');
    setTimeout(() => setSuccessMsg(null), 4000);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles size={16} /> Modul & Media Interaktif Pembelajaran Digital
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Pusat Media Pembelajaran SDN Tangerang 6</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isGuru
              ? 'Buat dan bagikan media pembelajaran interaktif (Video, Modul E-Book, Infografis & Tugas Refleksi) untuk siswa Anda.'
              : isKepsek
              ? 'Monitoring lengkap progres penggunaan dan penyelesaian media pembelajaran di seluruh kelas.'
              : 'Akses materi pembelajaran interaktif, tonton video/modul, dan selesaikan tugas refleksi interaktif dari guru.'}
          </p>
        </div>
        {isGuru && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Plus size={18} /> Buat Media Pembelajaran
          </button>
        )}
      </div>

      {/* KEPALA SEKOLAH / ADMIN ANALYTICS OVERVIEW */}
      {isKepsek && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Video size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Media Dipublikasikan</p>
              <h3 className="text-2xl font-black text-slate-900">{classroomService.getMediaItems().length} Modul</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Selesai Dikerjakan Siswa</p>
              <h3 className="text-2xl font-black text-slate-900">
                {classroomService.getAllMediaSubmissions ? classroomService.getAllMediaSubmissions().filter(s => s.STATUS === 'SELESAI').length : 18} Respon
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Rata-rata Keterlibatan Siswa</p>
              <h3 className="text-2xl font-black text-slate-900">92.4%</h3>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['ALL', 'VIDEO', 'MODUL_EBOOK', 'INTERAKTIF', 'INFOGRAFIS', 'AUDIO'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul media / materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 bg-slate-50"
          />
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaList.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
              <Video size={48} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Belum ada media pembelajaran</h4>
              <p className="text-xs text-slate-400 mt-1">Guru belum mempublikasikan media pembelajaran pada kategori ini.</p>
            </div>
          ) : (
            mediaList.map((m) => {
              const mySub = isSiswa ? classroomService.getMediaSubmissions(m.ID, account.ID)[0] : null;
              const isCompleted = mySub?.STATUS === 'SELESAI';
              const totalSubs = classroomService.getMediaSubmissions(m.ID).length;
              const completedSubs = classroomService.getMediaSubmissions(m.ID).filter(s => s.STATUS === 'SELESAI').length;

              return (
                <div key={m.ID} className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                        {m.KATEGORI === 'VIDEO' && <Video size={12} />}
                        {m.KATEGORI === 'MODUL_EBOOK' && <BookOpen size={12} />}
                        {m.KATEGORI === 'INTERAKTIF' && <Sparkles size={12} />}
                        {m.KATEGORI === 'INFOGRAFIS' && <FileText size={12} />}
                        {m.KATEGORI === 'AUDIO' && <Play size={12} />}
                        {m.KATEGORI.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {m.TARGET_KELAS || 'Kelas Umum'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-2">{m.JUDUL}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.DESKRIPSI}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" /> Tujuan Pembelajaran:
                      </div>
                      <p className="text-slate-600 line-clamp-2 italic">"{m.TUJUAN_PEMBELAJARAN}"</p>
                    </div>

                    {/* Status for Student */}
                    {isSiswa && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                        isCompleted ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span>Status Anda:</span>
                        <span className="flex items-center gap-1">
                          {isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          {isCompleted ? 'Selesai & Selesai Dikerjakan' : mySub ? 'Sedang Dipelajari' : 'Belum Mulai'}
                        </span>
                      </div>
                    )}

                    {/* Status for Guru / Kepsek */}
                    {(isGuru || isKepsek) && (
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Oleh: <strong className="text-slate-700">{m.GURU_NAMA}</strong></span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                          {completedSubs} / {totalSubs} Siswa Selesai
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isSiswa ? (
                      <button
                        onClick={() => handleOpenStudentMedia(m)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-blue-900 hover:bg-blue-800 text-white'
                        }`}
                      >
                        <Play size={14} /> {isCompleted ? 'Pelajari Ulang & Tugas' : 'Buka & Kerjakan Media'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenStudentMedia(m)}
                          className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Eye size={14} /> Detail & Respon ({totalSubs})
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(m.ID)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DETAIL / STUDENT LEARNING PLAYER & SUBMISSION VIEW */}
      {viewMode === 'detail' && activeMedia && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => { setViewMode('list'); setActiveMedia(null); }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              ← Kembali ke Daftar Media
            </button>
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold">
              {activeMedia.KATEGORI}
            </span>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{activeMedia.JUDUL}</h2>
            <p className="text-sm text-slate-600">{activeMedia.DESKRIPSI}</p>
          </div>

          {/* Media Player / Frame / Embed Link */}
          {activeMedia.MEDIA_URL && (
            <div className="p-4 bg-slate-900 rounded-3xl text-white space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-bold text-blue-400">
                  <Video size={14} /> Sumber Media Pembelajaran
                </span>
                <a
                  href={activeMedia.MEDIA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-white"
                >
                  Buka di Tab Baru ↗
                </a>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl text-xs font-mono text-slate-200 break-all border border-slate-700">
                {activeMedia.MEDIA_URL}
              </div>
            </div>
          )}

          {/* Tujuan Pembelajaran */}
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} /> Tujuan Pembelajaran:
            </h4>
            <p className="text-sm text-blue-950 font-medium">{activeMedia.TUJUAN_PEMBELAJARAN}</p>
          </div>

          {/* Tugas Interaktif / Refleksi (Untuk Siswa) */}
          {activeMedia.TUGAS_INTERAKTIF && (
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-amber-600" /> Tugas Refleksi & Pertanyaan Interaktif:
              </h4>
              <p className="text-xs sm:text-sm text-amber-950 font-semibold">{activeMedia.TUGAS_INTERAKTIF}</p>

              {isSiswa && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Jawaban / Catatan Refleksi Anda:</label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan hasil pemahaman atau jawaban tugas interaktif Anda di sini..."
                    value={studentJawaban}
                    onChange={(e) => setStudentJawaban(e.target.value)}
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-blue-900 bg-white"
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleCompleteStudentMedia('SEDANG_DIPELAJARI')}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                    >
                      Simpan Progress
                    </button>
                    <button
                      onClick={() => handleCompleteStudentMedia('SELESAI')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 size={16} /> Selesaikan & Kirim Tugas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submissions List for Guru / Kepsek */}
          {(isGuru || isKepsek) && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-black text-slate-900 text-sm">Respon & Daftar Siswa yang Mengerjakan</h4>
              <div className="space-y-2">
                {classroomService.getMediaSubmissions(activeMedia.ID).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada siswa yang merespon media pembelajaran ini.</p>
                ) : (
                  classroomService.getMediaSubmissions(activeMedia.ID).map((sub) => (
                    <div key={sub.ID} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{sub.SISWA_NAMA}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sub.STATUS === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sub.STATUS}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Jawaban: "{sub.JAWABAN_TUGAS || '-'}"</p>
                      </div>
                      <span className="text-[10px] text-slate-400">Update: {new Date(sub.UPDATED_AT).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE MEDIA MODAL (FOR GURU) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Video size={20} className="text-blue-900" /> Buat Media Pembelajaran Interaktif
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas / Mata Pelajaran</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 bg-white font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.ID} value={c.ID}>{c.NAMA} ({c.KELAS_TINGKAT})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Media Pembelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Video Interaktif Ekosistem Hutan Hujan Tropis"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Media</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as MediaType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 bg-white font-medium"
                  >
                    <option value="VIDEO">Video Pembelajaran</option>
                    <option value="MODUL_EBOOK">Modul E-Book / PDF</option>
                    <option value="INTERAKTIF">Kuis / Simulasi Interaktif</option>
                    <option value="INFOGRAFIS">Infografis / Visual</option>
                    <option value="AUDIO">Audio / Podcast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Sumber Media (Opsional)</label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/... atau Drive"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan secara ringkas isi materi..."
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan Pembelajaran (Wajib)</label>
                <textarea
                  rows={2}
                  placeholder="Setelah mempelajari media ini, siswa mampu memahami..."
                  value={formTujuan}
                  onChange={(e) => setFormTujuan(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tugas Refleksi / Pertanyaan Interaktif Siswa</label>
                <textarea
                  rows={2}
                  placeholder="Pertanyaan atau latihan refleksi yang harus dikerjakan siswa..."
                  value={formTugas}
                  onChange={(e) => setFormTugas(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-sm"
                >
                  Publikasikan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
