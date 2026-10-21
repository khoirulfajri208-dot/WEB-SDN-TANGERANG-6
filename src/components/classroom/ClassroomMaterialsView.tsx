import React, { useState, useEffect } from 'react';
import {
  BookOpen, Video, FileText, Download, Plus, Search, Filter, Trash2, ExternalLink,
  Sparkles, CheckCircle2, Bookmark, Eye, X, Moon, Sun, Type, Sliders, Check,
  Maximize2, Play, Volume2, VolumeX, Maximize, Compass, Feather, PlayCircle
} from 'lucide-react';
import { Account, LearningMaterial } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

class AmbientAudioSynth {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  public toggleRainSound(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    try {
      // @ts-expect-error fallback webkitAudioContext
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      whiteNoise.start();
      this.noiseNode = whiteNoise;
      this.isPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isPlaying = false;
  }
}

const ambientSynth = new AmbientAudioSynth();

interface ClassroomMaterialsViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomMaterialsView: React.FC<ClassroomMaterialsViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);

  // Focus Mode State
  const [focusMaterial, setFocusMaterial] = useState<LearningMaterial | null>(null);
  const [focusTheme, setFocusTheme] = useState<'sepia' | 'dark' | 'light' | 'emerald'>('sepia');
  const [focusFontSize, setFocusFontSize] = useState<number>(18);
  const [focusFontFamily, setFocusFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');

  // Zen Mode State (Full-screen immersion without sidebars or top navigation)
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [zenMaterialId, setZenMaterialId] = useState<string>('');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);

  // Smart Video Guide State
  const [smartVideoMaterial, setSmartVideoMaterial] = useState<LearningMaterial | null>(null);

  // Quick View State
  const [quickViewMaterial, setQuickViewMaterial] = useState<LearningMaterial | null>(null);

  // Reading Progress State trigger
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  // Create Material Form State
  const [matJudul, setMatJudul] = useState('');
  const [matMapel, setMatMapel] = useState('Tematik Terpadu');
  const [matDeskripsi, setMatDeskripsi] = useState('');
  const [matTipe, setMatTipe] = useState<'VIDEO' | 'EBOOK' | 'LKPD' | 'RANGKUMAN'>('EBOOK');
  const [matKelas, setMatKelas] = useState(account.KELAS || 'Kelas 1');
  const [matLink, setMatLink] = useState('');
  const [matRingkasan, setMatRingkasan] = useState('');

  const materials = classroomService.getMaterials(account.ROLE === 'SISWA' || isGuru ? account.KELAS : undefined);

  // Escape key listener to close Zen Mode / Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZenMode(false);
        setFocusMaterial(null);
        setSmartVideoMaterial(null);
        setQuickViewMaterial(null);
        if (isAmbientPlaying) {
          ambientSynth.stop();
          setIsAmbientPlaying(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAmbientPlaying]);

  // Helper to retrieve reading progress from localStorage
  const getReadingProgress = (materialId: string): { progress: number; completed: boolean } => {
    try {
      const saved = localStorage.getItem(`mat_progress_${account.ID}_${materialId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { progress: 0, completed: false };
  };

  // Helper to save reading progress
  const saveReadingProgress = (materialId: string, progress: number) => {
    const p = Math.min(100, Math.max(0, progress));
    const record = { progress: p, completed: p >= 100, lastReadAt: new Date().toISOString() };
    try {
      localStorage.setItem(`mat_progress_${account.ID}_${materialId}`, JSON.stringify(record));
    } catch {
      // ignore
    }
    setProgressRefreshKey((k) => k + 1);
  };

  const filteredMaterials = materials.filter((m) => {
    if (selectedType !== 'ALL' && m.TIPE !== selectedType) return false;
    if (
      searchQuery &&
      !m.JUDUL.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !m.MAPEL.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !m.DESKRIPSI.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeZenMaterial = materials.find((m) => m.ID === zenMaterialId) || materials[0] || filteredMaterials[0];

  const handleToggleAmbient = () => {
    const playing = ambientSynth.toggleRainSound();
    setIsAmbientPlaying(playing);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matJudul.trim()) return;

    classroomService.saveMaterial({
      KELAS: account.KELAS || matKelas,
      MAPEL: matMapel,
      JUDUL: matJudul,
      DESKRIPSI: matDeskripsi,
      TIPE: matTipe,
      URL_LINK: matLink || 'https://buku.kemdikbud.go.id',
      FILE_SIZE: matTipe === 'VIDEO' ? '12 Menit' : '2.1 MB',
      RINGKASAN_KONTEN: matRingkasan,
      GURU_NAMA: account.NAMA,
    });

    setMatJudul('');
    setMatDeskripsi('');
    setMatLink('');
    setMatRingkasan('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Hapus bahan ajar ini?')) {
      classroomService.deleteMaterial(id);
      onRefresh();
    }
  };

  const getTypeIcon = (tipe: string) => {
    switch (tipe) {
      case 'VIDEO':
        return <Video size={18} className="text-rose-600" />;
      case 'LKPD':
        return <FileText size={18} className="text-amber-600" />;
      case 'RANGKUMAN':
        return <Bookmark size={18} className="text-emerald-600" />;
      default:
        return <BookOpen size={18} className="text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Bahan Ajar & Modul Digital (E-Library)</h2>
            <p className="text-xs text-slate-500">
              Koleksi buku teks Kurikulum Merdeka, LKPD interaktif, Smart Video Guide YouTube, dan Mode Zen imersif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (filteredMaterials.length > 0) {
                setZenMaterialId(filteredMaterials[0].ID);
              }
              setIsZenMode(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer active:scale-95"
            title="Aktifkan Mode Zen (Tampilan Membaca Modul Imersif Bebas Navigasi & Distraksi)"
          >
            <Maximize2 size={16} /> <span>Mode Zen (Bebas Distraksi)</span>
          </button>

          {(isGuru || isKepsek) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95"
            >
              <Plus size={16} /> Unggah Bahan Ajar / Modul
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Semua Koleksi' },
            { id: 'EBOOK', label: 'E-Book / Modul PDF' },
            { id: 'VIDEO', label: 'Video Pembelajaran' },
            { id: 'LKPD', label: 'Lembar Kerja (LKPD)' },
            { id: 'RANGKUMAN', label: 'Rangkuman Materi' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi, mapel, judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">Tidak Ada Bahan Ajar Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau filter kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.ID}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getTypeIcon(mat.TIPE)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{mat.MAPEL}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {mat.KELAS}
                      </span>
                    </div>
                  </div>

                  {(isGuru || isKepsek) && (
                    <button
                      onClick={() => handleDeleteMaterial(mat.ID)}
                      title="Hapus Bahan Ajar"
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{mat.JUDUL}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{mat.DESKRIPSI}</p>

                {/* Smart Video Guide YouTube Embed Preview if link is YouTube */}
                {(() => {
                  const ytId = extractYouTubeId(mat.URL_LINK);
                  if (ytId) {
                    return (
                      <div className="mb-3 rounded-2xl overflow-hidden border border-rose-200 bg-slate-900 relative shadow-sm group">
                        <div className="aspect-video w-full relative bg-slate-950">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                            title={mat.JUDUL}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                        <div className="px-3 py-1.5 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1.5 text-rose-300">
                            <Video size={13} className="text-rose-400" /> Smart Video Guide
                          </span>
                          <button
                            onClick={() => setSmartVideoMaterial(mat)}
                            className="text-white hover:text-rose-200 flex items-center gap-1 font-bold text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md transition cursor-pointer"
                          >
                            <Play size={10} className="fill-white" /> Putar Layar Penuh
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {mat.RINGKASAN_KONTEN && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 mb-4 line-clamp-2">
                    <span className="font-bold text-slate-700">Ringkasan: </span>
                    {mat.RINGKASAN_KONTEN}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              {(() => {
                const { progress, completed } = getReadingProgress(mat.ID);
                const ytId = extractYouTubeId(mat.URL_LINK);

                return (
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    {progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 flex items-center gap-1">
                            <BookOpen size={10} className="text-indigo-600" /> Progres Baca
                          </span>
                          <span className={completed ? 'text-emerald-600' : 'text-indigo-600'}>
                            {completed ? '✓ Selesai 100%' : `${progress}%`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${completed ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{mat.FILE_SIZE || 'Format Digital'}</span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ytId && (
                          <button
                            onClick={() => setSmartVideoMaterial(mat)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                            title="Putar Smart Video Guide YouTube"
                          >
                            <PlayCircle size={14} className="text-rose-600" /> Smart Video
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setZenMaterialId(mat.ID);
                            setIsZenMode(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs transition cursor-pointer"
                          title="Buka Mode Zen (Membaca Bebas Distraksi & Sidebar)"
                        >
                          <Maximize2 size={13} className="text-purple-600" /> Mode Zen
                        </button>

                        <button
                          onClick={() => setQuickViewMaterial(mat)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                          title="Pratinjau Singkat Dokumen (Quick View)"
                        >
                          <Eye size={13} className="text-indigo-600" /> Pratinjau
                        </button>

                        {mat.URL_LINK && (
                          <a
                            href={mat.URL_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                            title="Buka Link Sumber Kemendikbud"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MATERIAL MODAL */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {getTypeIcon(previewMaterial.TIPE)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {previewMaterial.MAPEL} • {previewMaterial.KELAS}
                  </span>
                  <h3 className="font-black text-base text-slate-800">{previewMaterial.JUDUL}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">{previewMaterial.DESKRIPSI}</p>

              {previewMaterial.RINGKASAN_KONTEN && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-blue-600" /> Ringkasan Isi Pembelajaran:
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {previewMaterial.RINGKASAN_KONTEN}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 p-3 rounded-xl">
                <span>Pengunggah: <b>{previewMaterial.GURU_NAMA}</b></span>
                <span>Ukuran / Estimasi: <b>{previewMaterial.FILE_SIZE}</b></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              {previewMaterial.URL_LINK && (
                <a
                  href={previewMaterial.URL_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  <ExternalLink size={14} /> Kunjungi Sumber Materi Digital
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MATERIAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-800">Tambah Bahan Ajar & Modul Digital</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Bahan Ajar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar Tematik: Siklus Air & Cuaca"
                  value={matJudul}
                  onChange={(e) => setMatJudul(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: IPAS / Matematika"
                    value={matMapel}
                    onChange={(e) => setMatMapel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Tipe</label>
                  <select
                    value={matTipe}
                    onChange={(e) => setMatTipe(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="EBOOK">📚 E-Book / Modul PDF</option>
                    <option value="VIDEO">🎥 Video Pembelajaran</option>
                    <option value="LKPD">📝 Lembar Kerja (LKPD)</option>
                    <option value="RANGKUMAN">🔖 Rangkuman Catatan</option>
                  </select>
                </div>
              </div>

              {!account.KELAS && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={matKelas}
                    onChange={(e) => setMatKelas(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Semua Kelas'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan capaian materi yang dibahas..."
                  value={matDeskripsi}
                  onChange={(e) => setMatDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Materi / Poin Penting</label>
                <textarea
                  rows={3}
                  placeholder="Rangkuman teks yang dapat langsung dibaca siswa..."
                  value={matRingkasan}
                  onChange={(e) => setMatRingkasan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tautan / Link Sumber (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={matLink}
                  onChange={(e) => setMatLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                >
                  Simpan Bahan Ajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOCUS MODE (MODE BACA CEPAT) OVERLAY MODAL */}
      {focusMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          {(() => {
            const currentProg = getReadingProgress(focusMaterial.ID).progress;
            const themeClasses =
              focusTheme === 'sepia'
                ? 'bg-[#FAF4EB] text-[#362B1D] border-[#EADCC7]'
                : focusTheme === 'dark'
                ? 'bg-[#121316] text-[#E4E4E7] border-zinc-800'
                : 'bg-white text-slate-900 border-slate-200';

            const headerThemeClasses =
              focusTheme === 'sepia'
                ? 'bg-[#F2E5D5] text-[#362B1D] border-[#EADCC7]'
                : focusTheme === 'dark'
                ? 'bg-[#1C1D22] text-zinc-200 border-zinc-800'
                : 'bg-slate-100 text-slate-800 border-slate-200';

            return (
              <div
                className={`w-full max-w-4xl h-[92vh] max-h-[850px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${themeClasses}`}
              >
                {/* Focus Reader Controls Toolbar Header */}
                <div
                  className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${headerThemeClasses}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                      <Sparkles size={20} className="fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                        Mode Baca Cepat • Ramah Mata
                      </span>
                      <h3 className="font-extrabold text-sm sm:text-base line-clamp-1">{focusMaterial.JUDUL}</h3>
                    </div>
                  </div>

                  {/* Toolbar Actions: Theme, Font Size, Font Family */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Theme selector */}
                    <div className="flex items-center bg-black/5 p-1 rounded-xl gap-1">
                      <button
                        onClick={() => setFocusTheme('sepia')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          focusTheme === 'sepia' ? 'bg-[#E5D2BA] text-amber-950 shadow-xs' : 'opacity-70 hover:opacity-100'
                        }`}
                        title="Tema Warm Sepia (Nyaman untuk membaca lama)"
                      >
                        Warm
                      </button>
                      <button
                        onClick={() => setFocusTheme('dark')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          focusTheme === 'dark' ? 'bg-zinc-800 text-white shadow-xs' : 'opacity-70 hover:opacity-100'
                        }`}
                        title="Tema Dark Mode (Redam cahaya malam)"
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setFocusTheme('light')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          focusTheme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'
                        }`}
                        title="Tema Terang (Kontras tinggi)"
                      >
                        Light
                      </button>
                    </div>

                    {/* Font Size Selector */}
                    <div className="flex items-center bg-black/5 p-1 rounded-xl gap-1 text-xs">
                      <button
                        onClick={() => setFocusFontSize((s) => Math.max(14, s - 2))}
                        className="px-2 py-0.5 rounded-lg hover:bg-black/10 font-black cursor-pointer"
                        title="Kecilkan Huruf"
                      >
                        A-
                      </button>
                      <span className="px-1 font-bold text-[11px]">{focusFontSize}px</span>
                      <button
                        onClick={() => setFocusFontSize((s) => Math.min(26, s + 2))}
                        className="px-2 py-0.5 rounded-lg hover:bg-black/10 font-black cursor-pointer"
                        title="Besarkan Huruf"
                      >
                        A+
                      </button>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setFocusMaterial(null)}
                      className="p-2 rounded-xl hover:bg-black/10 transition cursor-pointer"
                      title="Keluar dari Mode Baca Cepat"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Status Header Bar */}
                <div className="bg-amber-500/10 px-5 py-2.5 flex items-center justify-between gap-3 text-xs border-b border-amber-500/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-amber-600" />
                    <span className="font-bold">Progres Membaca Saya:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-extrabold text-[11px]">
                      {currentProg}% {currentProg >= 100 ? '(Selesai)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveReadingProgress(focusMaterial.ID, Math.min(100, currentProg + 25))}
                      className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
                    >
                      +25% Tambah
                    </button>
                    <button
                      onClick={() => saveReadingProgress(focusMaterial.ID, 100)}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1"
                    >
                      <Check size={13} /> Selesai (100%)
                    </button>
                  </div>
                </div>

                {/* Main Focus Reading Article Content Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-3xl mx-auto w-full">
                  {/* Article Title Header */}
                  <div className="space-y-2 border-b border-black/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 text-xs font-extrabold uppercase tracking-wider">
                        {focusMaterial.MAPEL}
                      </span>
                      <span className="text-xs font-semibold opacity-70">• {focusMaterial.KELAS}</span>
                      <span className="text-xs font-semibold opacity-70">• Pengunggah: {focusMaterial.GURU_NAMA}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">{focusMaterial.JUDUL}</h1>
                  </div>

                  {/* Material Ringkasan Teks & Content */}
                  <div
                    style={{ fontSize: `${focusFontSize}px`, lineHeight: 1.75 }}
                    className={`space-y-4 font-${focusFontFamily}`}
                  >
                    <div className="p-4 rounded-2xl bg-black/5 border border-black/10">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-600 mb-1">
                        📌 Pengantar & Deskripsi Modul:
                      </h4>
                      <p className="opacity-90">{focusMaterial.DESKRIPSI}</p>
                    </div>

                    {focusMaterial.RINGKASAN_KONTEN ? (
                      <div className="space-y-3">
                        <h3 className="text-lg font-black border-l-4 border-amber-500 pl-3">Rangkuman Pembelajaran Inti</h3>
                        <div className="whitespace-pre-line opacity-95 leading-relaxed font-normal">
                          {focusMaterial.RINGKASAN_KONTEN}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-black/5 text-center space-y-2">
                        <p className="opacity-80 italic">
                          "Bahan ajar ini tersedia sebagai dokumen digital terstruktur. Klik tombol di bawah untuk membuka sumber asli Kemendikbud."
                        </p>
                      </div>
                    )}

                    {focusMaterial.URL_LINK && (
                      <div className="pt-4 flex justify-center">
                        <a
                          href={focusMaterial.URL_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/20 transition cursor-pointer"
                        >
                          <ExternalLink size={16} /> Buka Sumber Buku / Media Lengkap
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Progress Slider */}
                <div className={`p-4 border-t flex items-center justify-between gap-4 shrink-0 ${headerThemeClasses}`}>
                  <span className="text-xs font-bold opacity-75 shrink-0">Atur Progres Membaca:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentProg}
                    onChange={(e) => saveReadingProgress(focusMaterial.ID, parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-600 h-2 bg-black/10 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-black w-12 text-right shrink-0">{currentProg}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* QUICK VIEW (PRATINJAU CEPAT) MODAL */}
      {quickViewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                  <Eye size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
                    Pratinjau Cepat • {quickViewMaterial.MAPEL}
                  </span>
                  <h3 className="font-extrabold text-base truncate text-white">{quickViewMaterial.JUDUL}</h3>
                </div>
              </div>
              <button
                onClick={() => setQuickViewMaterial(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {quickViewMaterial.KELAS}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                  Tipe: {quickViewMaterial.TIPE}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                  Ukuran: {quickViewMaterial.FILE_SIZE || 'Digital'}
                </span>
                <span className="text-slate-400 font-medium ml-auto">
                  Pengunggah: <strong className="text-slate-700">{quickViewMaterial.GURU_NAMA}</strong>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Ringkasan Materi:</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{quickViewMaterial.DESKRIPSI}</p>
              </div>

              {quickViewMaterial.RINGKASAN_KONTEN && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" /> Poin Kunci Pembelajaran:
                  </h4>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {quickViewMaterial.RINGKASAN_KONTEN}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <button
                onClick={() => {
                  const m = quickViewMaterial;
                  setQuickViewMaterial(null);
                  setFocusMaterial(m);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Sparkles size={15} /> Buka Mode Baca Cepat
              </button>

              <div className="flex items-center gap-2">
                {quickViewMaterial.URL_LINK && (
                  <a
                    href={quickViewMaterial.URL_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink size={14} /> Sumber Lengkap
                  </a>
                )}
                <button
                  onClick={() => setQuickViewMaterial(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART VIDEO GUIDE YOUTUBE MODAL PLAYER */}
      {smartVideoMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95">
            {/* Modal Topbar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <PlayCircle size={22} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase text-rose-400 tracking-wider block">
                    Smart Video Guide • YouTube Player
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-white truncate">{smartVideoMaterial.JUDUL}</h3>
                </div>
              </div>

              <button
                onClick={() => setSmartVideoMaterial(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player & Notes Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 sm:p-6">
              {(() => {
                const ytId = extractYouTubeId(smartVideoMaterial.URL_LINK);
                return (
                  <div className="space-y-4">
                    {/* 16:9 YouTube iFrame Embed Player */}
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
                      {ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                          title={smartVideoMaterial.JUDUL}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
                          <Video size={48} className="text-slate-600 mb-2" />
                          <p className="text-xs">Tautan YouTube tidak valid.</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Summary Box */}
                    <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between text-xs text-rose-300 font-bold border-b border-slate-700/60 pb-2">
                        <span>Mata Pelajaran: {smartVideoMaterial.MAPEL}</span>
                        <span>{smartVideoMaterial.KELAS}</span>
                        <span>Pengunggah: {smartVideoMaterial.GURU_NAMA}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{smartVideoMaterial.DESKRIPSI}</p>

                      {smartVideoMaterial.RINGKASAN_KONTEN && (
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-1">
                          <span className="font-extrabold text-rose-400 block uppercase tracking-wider text-[10px]">
                            💡 Poin Pembelajaran Penting:
                          </span>
                          <p className="leading-relaxed">{smartVideoMaterial.RINGKASAN_KONTEN}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 font-medium">SDN Tangerang 6 • Smart Classroom Video Guide</span>
              <button
                onClick={() => setSmartVideoMaterial(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup Video Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZEN MODE (BEBAS DISTRAKSI) FULL-SCREEN WORKSPACE OVERLAY */}
      {isZenMode && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-300 font-sans ${
            focusTheme === 'sepia'
              ? 'bg-[#FAF4EB] text-[#362B1D]'
              : focusTheme === 'dark'
              ? 'bg-[#0B0F19] text-[#E2E8F0]'
              : focusTheme === 'emerald'
              ? 'bg-[#062C1E] text-[#ECFDF5]'
              : 'bg-white text-slate-900'
          }`}
        >
          {/* Zen Top Header Controls */}
          <div
            className={`px-6 py-3 border-b flex items-center justify-between gap-4 shrink-0 shadow-xs ${
              focusTheme === 'sepia'
                ? 'bg-[#F2E5D5] border-[#E5D2BA] text-[#362B1D]'
                : focusTheme === 'dark'
                ? 'bg-[#131927] border-slate-800 text-slate-200'
                : focusTheme === 'emerald'
                ? 'bg-[#0A3D2B] border-emerald-900 text-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            {/* Zen Logo & Material Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-600 flex items-center justify-center font-bold">
                <Maximize2 size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 block">
                  Zen Mode • Imersif Bebas Distraksi
                </span>
                <select
                  value={activeZenMaterial.ID}
                  onChange={(e) => setZenMaterialId(e.target.value)}
                  className="bg-transparent font-bold text-xs sm:text-sm focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate"
                >
                  {materials.map((m) => (
                    <option key={m.ID} value={m.ID} className="bg-slate-900 text-white">
                      {m.JUDUL} ({m.MAPEL})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zen Toolbar Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Theme Buttons */}
              <div className="flex items-center bg-black/10 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setFocusTheme('sepia')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    focusTheme === 'sepia' ? 'bg-[#E5D2BA] text-amber-950 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Tema Warm Sepia"
                >
                  Warm
                </button>
                <button
                  onClick={() => setFocusTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    focusTheme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Tema Dark Mode"
                >
                  Dark
                </button>
                <button
                  onClick={() => setFocusTheme('emerald')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    focusTheme === 'emerald' ? 'bg-emerald-800 text-white shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Tema Emerald Forest"
                >
                  Emerald
                </button>
                <button
                  onClick={() => setFocusTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    focusTheme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Tema Light Mode"
                >
                  Light
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center bg-black/10 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setFocusFontSize((s) => Math.max(14, s - 2))}
                  className="px-2 py-0.5 rounded-lg hover:bg-black/10 font-black cursor-pointer"
                  title="Kecilkan Teks"
                >
                  A-
                </button>
                <span className="px-1 font-bold text-[11px]">{focusFontSize}px</span>
                <button
                  onClick={() => setFocusFontSize((s) => Math.min(28, s + 2))}
                  className="px-2 py-0.5 rounded-lg hover:bg-black/10 font-black cursor-pointer"
                  title="Besarkan Teks"
                >
                  A+
                </button>
              </div>

              {/* Ambient Focus Audio Synthesizer */}
              <button
                onClick={handleToggleAmbient}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isAmbientPlaying
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-black/10 hover:bg-black/20 text-current'
                }`}
                title="Suara Alam Hujan / Musik Fokus Sintesis"
              >
                {isAmbientPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span className="hidden sm:inline">{isAmbientPlaying ? 'Audio Fokus Aktif' : 'Musik Fokus'}</span>
              </button>

              {/* Fullscreen Trigger */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="p-2 rounded-xl bg-black/10 hover:bg-black/20 transition cursor-pointer"
                title="Layar Penuh Browser"
              >
                <Maximize size={16} />
              </button>

              {/* Exit Zen Mode */}
              <button
                onClick={() => {
                  setIsZenMode(false);
                  if (isAmbientPlaying) {
                    ambientSynth.stop();
                    setIsAmbientPlaying(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition"
              >
                <X size={15} />
                <span>Keluar Zen (Esc)</span>
              </button>
            </div>
          </div>

          {/* Zen Reading Body Container */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-14 space-y-8 max-w-4xl mx-auto w-full">
            {/* Header Title Section */}
            <div className="space-y-3 border-b border-current/15 pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                  {activeZenMaterial.MAPEL}
                </span>
                <span className="text-xs font-bold opacity-75">• {activeZenMaterial.KELAS}</span>
                <span className="text-xs font-bold opacity-75">• Pengunggah: {activeZenMaterial.GURU_NAMA}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{activeZenMaterial.JUDUL}</h1>
              <p className="text-sm opacity-85 leading-relaxed font-medium">{activeZenMaterial.DESKRIPSI}</p>
            </div>

            {/* Smart Video Guide Embed if available */}
            {(() => {
              const ytId = extractYouTubeId(activeZenMaterial.URL_LINK);
              if (ytId) {
                return (
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm flex items-center gap-2 text-rose-500">
                      <Video size={16} /> Smart Video Guide YouTube:
                    </h3>
                    <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                        title={activeZenMaterial.JUDUL}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Rangkuman / Ringkasan Content Text */}
            <div style={{ fontSize: `${focusFontSize}px`, lineHeight: 1.8 }} className="space-y-6">
              {activeZenMaterial.RINGKASAN_KONTEN ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-black/5 border border-current/10 space-y-4">
                  <h3 className="text-xl font-black flex items-center gap-2 border-b border-current/15 pb-3">
                    <BookOpen size={20} className="text-purple-500" /> Ringkasan & Poin Kunci Pembelajaran
                  </h3>
                  <div className="whitespace-pre-line leading-relaxed opacity-95">
                    {activeZenMaterial.RINGKASAN_KONTEN}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-black/5 text-center space-y-2 opacity-80">
                  <p className="italic">
                    "Selamat membaca modul ini secara mendalam tanpa gangguan. Buka tautan sumber lengkap untuk dokumen tambahan."
                  </p>
                </div>
              )}

              {activeZenMaterial.URL_LINK && (
                <div className="pt-6 flex justify-center">
                  <a
                    href={activeZenMaterial.URL_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition cursor-pointer"
                  >
                    <ExternalLink size={16} /> Kunjungi Sumber Digital Kemendikbud
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Zen Bottom Reading Progress Footer */}
          {(() => {
            const { progress, completed } = getReadingProgress(activeZenMaterial.ID);
            return (
              <div
                className={`p-4 border-t flex items-center justify-between gap-4 shrink-0 ${
                  focusTheme === 'sepia'
                    ? 'bg-[#F2E5D5] border-[#E5D2BA]'
                    : focusTheme === 'dark'
                    ? 'bg-[#131927] border-slate-800'
                    : focusTheme === 'emerald'
                    ? 'bg-[#0A3D2B] border-emerald-900'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-80">Progres Baca Modul:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-xs">
                    {progress}% {completed ? '(Selesai 100%)' : ''}
                  </span>
                </div>

                <div className="flex-1 max-w-md mx-4 hidden sm:block">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => saveReadingProgress(activeZenMaterial.ID, parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 h-2 bg-black/20 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveReadingProgress(activeZenMaterial.ID, Math.min(100, progress + 25))}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer transition"
                  >
                    +25%
                  </button>
                  <button
                    onClick={() => saveReadingProgress(activeZenMaterial.ID, 100)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition flex items-center gap-1"
                  >
                    <Check size={14} /> Tandai Selesai
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
