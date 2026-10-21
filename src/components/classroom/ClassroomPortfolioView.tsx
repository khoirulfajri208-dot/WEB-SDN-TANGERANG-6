import React, { useState, useEffect } from 'react';
import {
  Palette,
  Heart,
  MessageCircle,
  Plus,
  Sparkles,
  ExternalLink,
  Code,
  BookOpen,
  FlaskConical,
  Trash2,
  Award,
  Send,
  Image as ImageIcon,
  User,
} from 'lucide-react';
import { Account, StudentPortfolioItem } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { STANDARD_CLASSES } from '../../services/accountService';
import { P5RadarChartWidget } from './P5RadarChartWidget';

interface ClassroomPortfolioViewProps {
  account: Account;
}

export const ClassroomPortfolioView: React.FC<ClassroomPortfolioViewProps> = ({ account }) => {
  const isGuruOrAdmin = account.ROLE === 'GURU' || account.ROLE === 'ADMIN' || account.ROLE === 'OPERATOR';
  const isSiswa = account.ROLE === 'SISWA';
  const userKelas = account.KELAS || 'Kelas 1A';

  const [items, setItems] = useState<StudentPortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>(userKelas);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<StudentPortfolioItem | null>(null);

  // Form State
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<
    'KARYA_SENI' | 'PROYEK_KODING' | 'ESAI_LITERASI' | 'PRAKTIKUM' | 'DESAIN' | 'LAINNYA'
  >('KARYA_SENI');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Comment Input
  const [newComment, setNewComment] = useState('');

  const loadPortfolios = () => {
    const data = classroomService.getPortfolioItems(filterKelas);
    setItems(data);
  };

  useEffect(() => {
    loadPortfolios();

    const handleSync = () => loadPortfolios();
    window.addEventListener('bb_storage_sync', handleSync);
    return () => window.removeEventListener('bb_storage_sync', handleSync);
  }, [filterKelas]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !deskripsi) return;

    const newItem: StudentPortfolioItem = {
      ID: 'PORT-' + Date.now(),
      SISWA_ID: account.ID,
      SISWA_NAMA: account.NAMA,
      KELAS: userKelas,
      JUDUL: judul,
      DESKRIPSI: deskripsi,
      KATEGORI: kategori,
      IMAGE_URL: imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      ATTACHMENT_URL: attachmentUrl,
      LIKES: [],
      COMMENTS: [],
      CREATED_AT: new Date().toISOString(),
      IS_FEATURED: isGuruOrAdmin,
    };

    classroomService.savePortfolioItem(newItem);
    setShowAddModal(false);
    setJudul('');
    setDeskripsi('');
    setImageUrl('');
    setAttachmentUrl('');
    loadPortfolios();
  };

  const handleToggleLike = (portfolioId: string) => {
    classroomService.togglePortfolioLike(portfolioId, account.ID);
    loadPortfolios();
    if (selectedDetailItem && selectedDetailItem.ID === portfolioId) {
      const updated = classroomService.getPortfolioItems().find(p => p.ID === portfolioId);
      if (updated) setSelectedDetailItem(updated);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedDetailItem) return;

    classroomService.addPortfolioComment(
      selectedDetailItem.ID,
      account.ID,
      account.NAMA,
      account.ROLE,
      newComment.trim()
    );

    setNewComment('');
    loadPortfolios();
    const updated = classroomService.getPortfolioItems().find(p => p.ID === selectedDetailItem.ID);
    if (updated) setSelectedDetailItem(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus karya portofolio ini?')) {
      classroomService.deletePortfolioItem(id);
      setSelectedDetailItem(null);
      loadPortfolios();
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'SEMUA' && item.KATEGORI !== selectedCategory) return false;
    return true;
  });

  const getCategoryIcon = (kat: string) => {
    switch (kat) {
      case 'KARYA_SENI':
        return <Palette size={14} className="text-rose-500" />;
      case 'PROYEK_KODING':
        return <Code size={14} className="text-purple-500" />;
      case 'ESAI_LITERASI':
        return <BookOpen size={14} className="text-blue-500" />;
      case 'PRAKTIKUM':
        return <FlaskConical size={14} className="text-emerald-500" />;
      default:
        return <Sparkles size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-200 text-xs font-extrabold mb-2 border border-white/20">
              <Sparkles size={14} /> Galeri Kreativitas & Portofolio Siswa
            </div>
            <h1 className="text-2xl font-black tracking-tight">Portofolio Karya Digital Siswa</h1>
            <p className="text-amber-100 text-sm mt-1 max-w-2xl">
              Ruang apresiasi pameran hasil karya lukisan, proyek koding, esai literasi, dan eksperimen sains siswa antarkelas.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-black text-sm shadow-lg hover:bg-amber-50 transition duration-200 cursor-pointer shrink-0"
          >
            <Plus size={18} className="text-rose-600" />
            <span>Unggah Karya Baru</span>
          </button>
        </div>
      </div>

      {/* P5 RADAR CHART WIDGET */}
      <P5RadarChartWidget
        studentName={account.NAMA}
        studentClass={account.KELAS || 'Kelas 4B'}
      />

      {/* FILTER TABS & KELAS BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'SEMUA', label: 'Semua Karya' },
            { id: 'KARYA_SENI', label: '🎨 Lukisan & Seni' },
            { id: 'PROYEK_KODING', label: '💻 Koding Scratch' },
            { id: 'ESAI_LITERASI', label: '📝 Esai & Cerita' },
            { id: 'PRAKTIKUM', label: '🔬 Eksperimen Sains' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
          <span>Kelas:</span>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none font-bold"
          >
            {STANDARD_CLASSES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PORTFOLIO MASONRY / GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <Palette size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Portofolio di Kategori Ini</h3>
          <p className="text-xs text-slate-500 mt-1">
            Jadilah siswa pertama yang mengunggah karya lukisan atau proyek kreatifmu!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const hasLiked = item.LIKES?.includes(account.ID);
            return (
              <div
                key={item.ID}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={item.IMAGE_URL}
                      alt={item.JUDUL}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs">
                      {getCategoryIcon(item.KATEGORI)}
                      <span>{item.KATEGORI.replace('_', ' ')}</span>
                    </div>

                    {item.IS_FEATURED && (
                      <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Award size={12} /> Karya Unggulan
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <User size={12} className="text-blue-500" /> {item.SISWA_NAMA}
                      </span>
                      <span>{item.KELAS}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-1">{item.JUDUL}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.DESKRIPSI}</p>
                  </div>
                </div>

                {/* Footer Interactions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(item.ID)}
                      className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                        hasLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
                      <span>{item.LIKES?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => setSelectedDetailItem(item)}
                      className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      <span>{item.COMMENTS?.length || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedDetailItem(item)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETAIL KARYA & KOMENTAR */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  {getCategoryIcon(selectedDetailItem.KATEGORI)}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{selectedDetailItem.JUDUL}</h3>
                  <p className="text-xs text-slate-500">Oleh: <strong>{selectedDetailItem.SISWA_NAMA}</strong> ({selectedDetailItem.KELAS})</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetailItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Media Image */}
              {selectedDetailItem.IMAGE_URL && (
                <div className="rounded-xl overflow-hidden max-h-80 bg-slate-100 border border-slate-200">
                  <img src={selectedDetailItem.IMAGE_URL} alt={selectedDetailItem.JUDUL} className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-slate-700 text-sm leading-relaxed">{selectedDetailItem.DESKRIPSI}</p>

              {selectedDetailItem.ATTACHMENT_URL && (
                <a
                  href={selectedDetailItem.ATTACHMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                >
                  <ExternalLink size={14} />
                  <span>Buka Tautan Lampiran Proyek</span>
                </a>
              )}

              {/* COMMENTS SECTION */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageCircle size={16} className="text-blue-600" />
                  Diskusi & Apresiasi ({selectedDetailItem.COMMENTS?.length || 0})
                </h4>

                <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
                  {selectedDetailItem.COMMENTS?.length === 0 ? (
                    <p className="text-slate-400 italic">Belum ada komentar. Berikan apresiasi pertamamu!</p>
                  ) : (
                    selectedDetailItem.COMMENTS?.map((c) => (
                      <div key={c.ID} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                          <span>{c.AUTHOR_NAMA} ({c.AUTHOR_ROLE})</span>
                          <span className="text-slate-400 text-[10px]">{new Date(c.CREATED_AT).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{c.CONTENT}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tulis pesan apresiasi untuk karya ini..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1"
                  >
                    <Send size={14} />
                    <span>Kirim</span>
                  </button>
                </form>
              </div>
            </div>

            {/* DELETE BUTTON IF AUTHOR / GURU */}
            {(isGuruOrAdmin || account.ID === selectedDetailItem.SISWA_ID) && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(selectedDetailItem.ID)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold"
                >
                  <Trash2 size={14} /> Hapus Portofolio
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL UNGGAH KARYA BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={20} className="text-rose-600" />
                Unggah Karya Portofolio Siswa
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Karya / Proyek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lukisan Pemandangan Desa & Sungai"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Karya</label>
                <select
                  value={kategori}
                  onChange={(e: any) => setKategori(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  <option value="KARYA_SENI">🎨 Karya Seni & Lukisan</option>
                  <option value="PROYEK_KODING">💻 Proyek Koding Scratch</option>
                  <option value="ESAI_LITERASI">📝 Esai & Cerita Pendek</option>
                  <option value="PRAKTIKUM">🔬 Praktikum & Sains</option>
                  <option value="DESAIN">🖼️ Desain Grafis / Poster</option>
                  <option value="LAINNYA">⭐ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Cerita Proses Pembuatan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan bahan yang digunakan dan pesan dari karyamu..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Gambar Karya (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan Lampiran / Proyek (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://scratch.mit.edu/..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  Publikasikan Karya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
