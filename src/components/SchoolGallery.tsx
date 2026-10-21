import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  Trash2,
  Maximize2,
  Check,
  Sparkles,
  Filter,
  User,
  Building2,
  Award,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { User as UserType } from '../types';

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'FASILITAS' | 'GURU' | 'KEGIATAN';
  description: string;
  imageUrl: string;
  capturedAt: string;
  isCustomCaptured?: boolean;
}

const DEFAULT_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'GAL-001',
    title: 'Gedung Utama & Halaman Sekolah',
    category: 'FASILITAS',
    description: 'Tampak depan gedung utama SD Negeri Tangerang 6 dengan halaman hijau yang luas dan asri.',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-15',
  },
  {
    id: 'GAL-002',
    title: 'Ruang Kelas Digital & Interaktif',
    category: 'FASILITAS',
    description: 'Suasana kelas ber-AC yang nyaman dilengkapi proyektor dan papan tulis interaktif.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-10',
  },
  {
    id: 'GAL-003',
    title: 'Laboratorium Komputer & Chromebook',
    category: 'FASILITAS',
    description: 'Fasilitas Lab Komputer dengan koneksi internet cepat untuk ANBK dan literasi digital.',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-01',
  },
  {
    id: 'GAL-004',
    title: 'Perpustakaan & Pojok Baca Literasi',
    category: 'FASILITAS',
    description: 'Perpustakaan ramah anak dengan koleksi buku tematik, ensiklopedia, dan cerita rakyat.',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-07-28',
  },
  {
    id: 'GAL-005',
    title: 'Kepala Sekolah & Jajaran Manajerial',
    category: 'GURU',
    description: 'Foto bersama Kepala Sekolah dan jajaran pimpinan UPT Satuan Pendidikan SDN Tangerang 6.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-20',
  },
  {
    id: 'GAL-006',
    title: 'Dewan Guru Pembimbing Kelas',
    category: 'GURU',
    description: 'Para guru kelas profesional yang siap membimbing dan mengajar murid secara kontekstual.',
    imageUrl: 'https://images.unsplash.com/photo-1580894732475-80252b415a20?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-18',
  },
  {
    id: 'GAL-007',
    title: 'Upacara Bendera Hari Kemerdekaan',
    category: 'KEGIATAN',
    description: 'Dokumentasi upacara bendera khidmat diikuti seluruh dewan guru dan peserta didik.',
    imageUrl: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-17',
  },
  {
    id: 'GAL-008',
    title: 'Pentas Seni & Budaya Nusantara',
    category: 'KEGIATAN',
    description: 'Pertunjukan tari tradisional dan kreasi musik daerah oleh siswa-siswi berprestasi.',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
    capturedAt: '2026-08-05',
  },
];

const STORAGE_KEY = 'BB_SCHOOL_GALLERY_PHOTOS_V1';

interface SchoolGalleryProps {
  users?: UserType[];
}

export const SchoolGallery: React.FC<SchoolGalleryProps> = ({ users = [] }) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'FASILITAS' | 'GURU' | 'KEGIATAN'>('ALL');
  const [activeLightbox, setActiveLightbox] = useState<GalleryPhoto | null>(null);

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'FASILITAS' | 'GURU' | 'KEGIATAN'>('FASILITAS');
  const [photoDesc, setPhotoDesc] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load photos from localStorage or default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotos(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load gallery photos', err);
    }
    setPhotos(DEFAULT_GALLERY_PHOTOS);
  }, []);

  // Save photos helper
  const savePhotos = (updated: GalleryPhoto[]) => {
    setPhotos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save gallery photos', err);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setCapturedDataUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak. Anda dapat mengunggah file foto dari perangkat sebagai alternatif.'
      );
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenCameraModal = () => {
    setIsCameraOpen(true);
    setPhotoTitle('');
    setPhotoDesc('');
    setPhotoCategory('FASILITAS');
    startCamera();
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCapturedDataUrl(null);
    setCameraError(null);
  };

  // Capture Photo Snapshot
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 800;
      canvas.height = video.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedDataUrl(dataUrl);
        stopCamera();
      }
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  // File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedDataUrl(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New Photo
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedDataUrl) {
      alert('Silakan ambil foto menggunakan kamera atau unggah gambar terlebih dahulu.');
      return;
    }
    if (!photoTitle.trim()) {
      alert('Judul foto wajib diisi.');
      return;
    }

    const newPhoto: GalleryPhoto = {
      id: `GAL-SNAP-${Date.now()}`,
      title: photoTitle.trim(),
      category: photoCategory,
      description: photoDesc.trim() || 'Foto dokumentasi terbaru diambil langsung via Kamera.',
      imageUrl: capturedDataUrl,
      capturedAt: new Date().toISOString().split('T')[0],
      isCustomCaptured: true,
    };

    const updated = [newPhoto, ...photos];
    savePhotos(updated);
    handleCloseCameraModal();
  };

  // Delete Custom Photo
  const handleDeletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus foto ini dari Galeri Sekolah?')) {
      const updated = photos.filter((p) => p.id !== id);
      savePhotos(updated);
      if (activeLightbox?.id === id) {
        setActiveLightbox(null);
      }
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Camera Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" /> SchoolGallery Digital
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Galeri Foto Fasilitas & Dewan Guru
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Dokumentasi visual sarana prasarana, ruang pembelajaran, serta jajaran pendidik SDN Tangerang 6 dengan integrasi kamera langsung.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleOpenCameraModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2.5 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 border border-blue-400/30"
          >
            <Camera size={18} className="animate-pulse text-amber-300" />
            <span>Tambah Foto Kamera</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'Semua Foto', icon: Filter },
            { id: 'FASILITAS', label: 'Fasilitas & Gedung', icon: Building2 },
            { id: 'GURU', label: 'Dewan Guru', icon: User },
            { id: 'KEGIATAN', label: 'Kegiatan Sekolah', icon: Calendar },
          ].map((cat) => {
            const Icon = cat.icon;
            const count = photos.filter((p) => cat.id === 'ALL' || p.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-800 text-white shadow-md shadow-blue-800/20 scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-300' : 'text-slate-400'} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Grid with Hover Transitions & Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setActiveLightbox(photo)}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-2xl hover:border-blue-400 transition-all duration-300 ease-out transform hover:-translate-y-1.5 cursor-pointer flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
            style={{ animationDelay: `${(index % 8) * 60}ms` }}
          >
            <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Category & Custom badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                    photo.category === 'FASILITAS'
                      ? 'bg-blue-600/90'
                      : photo.category === 'GURU'
                      ? 'bg-amber-600/90'
                      : 'bg-emerald-600/90'
                  }`}
                >
                  {photo.category}
                </span>
                {photo.isCustomCaptured && (
                  <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-600 text-white shadow-md flex items-center gap-1">
                    <Camera size={10} /> Kamera
                  </span>
                )}
              </div>

              {/* Hover Lightbox Icon */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors shadow-lg">
                  <Maximize2 size={14} />
                </div>
              </div>

              {/* Title overlay on bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="text-xs font-black line-clamp-1 drop-shadow-md group-hover:text-amber-200 transition-colors">
                  {photo.title}
                </h4>
                <p className="text-[10px] text-slate-300 font-medium">
                  {photo.capturedAt}
                </p>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {photo.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 group-hover:text-blue-700 font-bold transition-colors">
                  <ImageIcon size={12} /> Pratinjau Foto
                </span>
                {photo.isCustomCaptured && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    title="Hapus foto ini"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <ImageIcon size={48} className="mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">Belum ada foto dalam kategori ini</h4>
          <p className="text-xs text-slate-400">Gunakan tombol "Tambah Foto Kamera" untuk mendokumentasikan foto baru.</p>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Kamera Dokumen Sekolah</h3>
                  <p className="text-[11px] text-slate-400">Ambil foto langsung atau unggah gambar</p>
                </div>
              </div>
              <button
                onClick={handleCloseCameraModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewfinder / Capture Canvas */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
              {capturedDataUrl ? (
                <img
                  src={capturedDataUrl}
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : cameraStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <CameraOff size={40} className="mx-auto text-slate-500" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cameraError || 'Menghubungkan ke kamera perangkat...'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2"
                  >
                    <Upload size={14} /> Unggah File Gambar
                  </button>
                </div>
              )}

              {/* Shutter Overlay Controls */}
              {cameraStream && !capturedDataUrl && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl border-4 border-blue-500 hover:scale-110 active:scale-95 transition-all"
                    title="Jepret Foto"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white" />
                  </button>
                </div>
              )}

              {capturedDataUrl && (
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white hover:bg-black font-bold text-xs flex items-center gap-1.5 border border-white/20"
                  >
                    <RefreshCw size={13} /> Foto Ulang
                  </button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Form Details */}
            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Foto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Foto Gedung Kelas 5A / Bapak Supriyadi, S.Pd."
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-blue-500 font-bold"
                  >
                    <option value="FASILITAS">Fasilitas & Gedung</option>
                    <option value="GURU">Dewan Guru</option>
                    <option value="KEGIATAN">Kegiatan Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih File Alternatif</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-medium flex items-center justify-center gap-2 truncate"
                  >
                    <Upload size={14} /> Unggah dari Galeri
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan lokasi, ruangan, atau nama personel..."
                  value={photoDesc}
                  onChange={(e) => setPhotoDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCameraModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!capturedDataUrl}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Check size={16} /> Simpan ke Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX POPUP MODAL */}
      {activeLightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-0 my-auto">
            <div className="relative aspect-[16/10] bg-black">
              <img
                src={activeLightbox.imageUrl}
                alt={activeLightbox.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setActiveLightbox(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3 bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                  {activeLightbox.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Diambil: {activeLightbox.capturedAt}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{activeLightbox.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activeLightbox.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
