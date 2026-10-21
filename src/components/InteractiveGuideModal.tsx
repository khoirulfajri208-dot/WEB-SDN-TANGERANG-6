import React, { useState } from 'react';
import {
  BookOpen, HelpCircle, CheckCircle2, Search, X, GraduationCap,
  Briefcase, Award, Sparkles, Shield, QrCode, HardDrive, Smartphone,
  Layers, FileText, ChevronRight, Download, Printer, UserCheck, Check
} from 'lucide-react';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'GURU' | 'SISWA' | 'BENDAHARA' | 'KEPSEK';
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'GURU',
}) => {
  const [selectedRole, setSelectedRole] = useState<'GURU' | 'SISWA' | 'BENDAHARA' | 'KEPSEK'>(initialRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const guides = {
    GURU: {
      title: 'Panduan Operasional Guru & Wali Kelas',
      subtitle: 'Pengelolaan Kelas, Presensi Digital, CBT Online, & Kurikulum Merdeka',
      color: 'from-blue-900 to-indigo-950',
      icon: GraduationCap,
      modules: [
        {
          id: 'g-1',
          title: '1. Presensi Harian & Scan QR Cepat',
          desc: 'Gunakan pemindai QR kamera (shortcut Ctrl+Shift+S) atau Presensi Tap NFC di gerbang untuk mencatat kehadiran siswa secara otomatis tanpa kertas.',
          tips: 'Siswa dapat menunjukkan kartu pelajar fisik atau barcode dari smartphone.',
        },
        {
          id: 'g-2',
          title: '2. Pembuatan Tugas & Bank Soal CBT Online',
          desc: 'Buat materi interaktif, unggah modul bahan ajar, dan susun kuis pilihan ganda/esai pada menu Bank Soal CBT dengan timer otomatis dan anti-curang.',
          tips: 'Sistem otomatis menilai jawaban pilihan ganda secara instan saat siswa submit.',
        },
        {
          id: 'g-3',
          title: '3. AI Generator Modul Ajar & Remedial Terpadu',
          desc: 'Manfaatkan asisten AI Gemini di menu "Fitur Portal" untuk menyusun modul ajar Kurikulum Merdeka dan membuat materi remedial personal sesuai capaian KKTP siswa.',
          tips: 'Tersedia fallback cerdas tanpa kuota bila jaringan sedang offline.',
        },
        {
          id: 'g-4',
          title: '4. E-Rapor & Radar Profil Pelajar Pancasila (P5)',
          desc: 'Rekap capaian 6 dimensi P5 siswa, berikan penilaian portofolio berkas karya, dan cetak Laporan Capaian Belajar siswa format resmi.',
          tips: 'Nilai dapat diekspor langsung ke spreadsheet CSV atau disinkronkan ke Google Sheets.',
        },
      ],
    },
    SISWA: {
      title: 'Panduan Belajar Siswa & Wali Murid',
      subtitle: 'Akses Materi, Pengumpulan Tugas, Ujian CBT, & Portofolio Prestasi',
      color: 'from-emerald-900 to-teal-950',
      icon: Award,
      modules: [
        {
          id: 's-1',
          title: '1. Kartu Pelajar Digital & QR Presensi',
          desc: 'Lihat ID barcode kartu pelajar Anda di tab Profil. Kartu ini digunakan untuk tap kehadiran di gerbang sekolah dan peminjaman buku perpustakaan.',
          tips: 'Bisa disimpan atau di-screenshot di smartphone.',
        },
        {
          id: 's-2',
          title: '2. Mengerjakan Ujian CBT & Kuis Interaktif',
          desc: 'Buka menu CBT saat jadwal ujian dimulai. Jawab soal dengan teliti dan tekan tombol Kumpulkan sebelum batas waktu berakhir.',
          tips: 'Aplikasi dilengkapi fitur auto-save jika koneksi internet terputus di tengah ujian.',
        },
        {
          id: 's-3',
          title: '3. Unggah Tugas & Kumpulkan Portofolio',
          desc: 'Kirim dokumen jawaban atau foto bukti tugas. Foto yang diunggah otomatis dikompresi agar hemat kuota internet.',
          tips: 'Raih lencana prestasi (Badges) setiap kali mengumpulkan tugas tepat waktu!',
        },
        {
          id: 's-4',
          title: '4. Portal Notifikasi WhatsApp Wali Murid',
          desc: 'Orang tua dapat menerima rekapitulasi presensi harian dan pengumuman sekolah langsung melalui integrasi WhatsApp Gateway sekolah.',
          tips: 'Pastikan nomor HP orang tua terdaftar dengan benar di wali kelas.',
        },
      ],
    },
    BENDAHARA: {
      title: 'Panduan Bendahara Barang & Pengelola Aset',
      subtitle: 'Inventarisasi Aset, Cetak Label Stiker, SPJ ARKAS, & SIPLaH',
      color: 'from-amber-900 to-slate-950',
      icon: Briefcase,
      modules: [
        {
          id: 'b-1',
          title: '1. Penerimaan Barang Masuk & Scan Kuitansi AI',
          desc: 'Catat pengadaan barang baru dari nota/faktur. Gunakan fitur AI Scan Kuitansi untuk mendeteksi nama barang, jumlah, dan harga otomatis dari foto nota.',
          tips: 'Bisa langsung mencocokkan kode anggaran BOS/ARKAS Kemendikbud.',
        },
        {
          id: 'b-2',
          title: '2. Cetak Stiker Barcode (Printer Thermal & Kertas A4)',
          desc: 'Cetak label QR inventaris untuk ditempel pada meja, kursi, laptop, dan aset sekolah. Tersedia format Thermal POS 58mm/80mm dan format Kertas Label Stiker A4.',
          tips: 'Tidak wajib memiliki printer thermal khusus, printer kantor biasa dengan kertas stiker A4 sudah didukung penuh.',
        },
        {
          id: 'b-3',
          title: '3. Kartu Persediaan ATK & Barang Keluar',
          desc: 'Catat distribusi alat tulis kantor ke guru atau unit kelas. Sistem otomatis memperbarui sisa stok barang persediaan secara realtime.',
          tips: 'Gunakan fitur tanda tangan digital penerima barang untuk bukti serah terima.',
        },
        {
          id: 'b-4',
          title: '4. Pembuatan Berita Acara & Sinkronisasi Sheets',
          desc: 'Buat Berita Acara Serah Terima (BAST), Berita Acara Pemeriksaan, dan Berita Acara Penghapusan Aset dengan penomoran resmi otomatis.',
          tips: 'Data dapat disinkronkan dua arah ke Google Sheets dan Cloud Firestore.',
        },
      ],
    },
    KEPSEK: {
      title: 'Panduan Kepala Sekolah & Pengawas Pembina',
      subtitle: 'Supervisi Eksekutif, Early Warning System (EWS), & Pengambilan Kebijakan',
      color: 'from-purple-900 to-slate-950',
      icon: Shield,
      modules: [
        {
          id: 'k-1',
          title: '1. Dashboard Laporan Eksekutif Pengawas',
          desc: 'Pantau rekapitulasi menyeluruh: rasio ketercapaian KKTP per fase (A, B, C), tingkat kehadiran guru & siswa, dan total nilai aset sekolah.',
          tips: 'Dapat diekspor menjadi laporan cetak resmi PDF untuk dinas pendidikan.',
        },
        {
          id: 'k-2',
          title: '2. Early Warning System (EWS) Akademik & Presensi',
          desc: 'Sistem deteksi dini otomatis memberi peringatan jika terdapat siswa dengan absensi di bawah 75% atau capaian nilai tugas yang memerlukan intervensi khusus.',
          tips: 'Memudahkan guru BK dan wali kelas melakukan pembinaan preventif lebih cepat.',
        },
        {
          id: 'k-3',
          title: '3. AI Supervisi Pembelajaran & Analisis Tren',
          desc: 'Gunakan asisten AI Supervisi untuk menganalisis beban belajar siswa, efektivitas kurikulum merdeka, dan tren kemajuan belajar antar rombel.',
          tips: 'Membantu penyusunan Rencana Kerja Tahunan Sekolah (RKAS) berbasis data riil.',
        },
        {
          id: 'k-4',
          title: '4. Log Audit & Keamanan Otorisasi PIN / 2FA',
          desc: 'Seluruh aksi perubahan data sensitif, penghapusan inventaris, dan pengeditan nilai tercatat di log audit dengan enkripsi waktu dan identitas akun.',
          tips: 'Gunakan verifikasi PIN/2FA untuk otorisasi tindakan berkategori krusial.',
        },
      ],
    },
  };

  const currentGuide = guides[selectedRole];
  const filteredModules = currentGuide.modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tips.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${currentGuide.color} text-white flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Pusat Panduan & Buku Manual Interaktif</h3>
              <p className="text-xs text-blue-200">SDN Tangerang 6 • Panduan Lengkap Semua Modul Sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center gap-2 px-4 shrink-0">
          {(['GURU', 'SISWA', 'BENDAHARA', 'KEPSEK'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedRole === role
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {role === 'GURU' && <GraduationCap size={15} className="text-blue-600" />}
              {role === 'SISWA' && <Award size={15} className="text-emerald-600" />}
              {role === 'BENDAHARA' && <Briefcase size={15} className="text-amber-600" />}
              {role === 'KEPSEK' && <Shield size={15} className="text-purple-600" />}
              <span>{role === 'GURU' ? 'Guru & Wali Kelas' : role === 'SISWA' ? 'Siswa & Wali Murid' : role === 'BENDAHARA' ? 'Bendahara Aset' : 'Kepala Sekolah'}</span>
            </button>
          ))}
        </div>

        {/* Search and Title */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{currentGuide.title}</h4>
            <p className="text-xs text-slate-500">{currentGuide.subtitle}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik panduan..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-blue-700"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredModules.map((mod) => {
            const isDone = Boolean(completedSteps[mod.id]);
            return (
              <div
                key={mod.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{mod.title}</span>
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check size={10} /> Dipahami
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <Sparkles size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Tips Praktis:</strong> {mod.tips}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStep(mod.id)}
                    className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={isDone ? 'Tandai belum dibaca' : 'Tandai sudah dipahami'}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredModules.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ada topik panduan yang sesuai dengan kata kunci pencarian.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Terselesaikan:{' '}
            <strong className="text-slate-800 font-bold">
              {Object.values(completedSteps).filter(Boolean).length}
            </strong>{' '}
            topik
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Selesai Membaca
          </button>
        </div>
      </div>
    </div>
  );
};
