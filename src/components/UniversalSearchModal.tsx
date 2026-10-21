import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Package,
  Box,
  FileText,
  User as UserIcon,
  ArrowRight,
  GraduationCap,
  BookOpen,
  QrCode,
  Printer,
  Bot,
  Sparkles,
  Globe,
  RefreshCw,
  Lock,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { accountService } from '../services/accountService';
import { classroomService } from '../services/classroomService';
import { ActivePage } from '../types';
import { playFeedback } from '../utils/feedback';

export interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: ActivePage, query?: string) => void;
  onOpenQRScanner?: () => void;
  onOpenBulkQRPrint?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenGoogleSync?: () => void;
  onSwitchViewMode?: (mode: 'app' | 'website' | 'classroom' | 'admin') => void;
}

export type SearchItemType =
  | 'BARANG'
  | 'ASET'
  | 'TRANSAKSI'
  | 'PEGAWAI'
  | 'DOKUMEN'
  | 'SISWA'
  | 'TUGAS'
  | 'AKSI';

export interface SearchResult {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle: string;
  badge?: string;
  targetPage?: ActivePage;
  queryParam?: string;
  action?: () => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQRScanner,
  onOpenBulkQRPrint,
  onOpenAIAssistant,
  onOpenGoogleSync,
  onSwitchViewMode,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DATA' | 'SISWA' | 'AKSI'>('ALL');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const performSearch = useCallback(
    (q: string, filter: 'ALL' | 'DATA' | 'SISWA' | 'AKSI') => {
      const term = q.trim().toLowerCase();
      const list: SearchResult[] = [];

      // 1. Quick Action Commands
      const actions: SearchResult[] = [
        {
          id: 'action-qr-scanner',
          type: 'AKSI',
          title: 'Buka Pemindai Kamera & QR Code',
          subtitle: 'Scan presensi siswa, submisi tugas, dan verifikasi aset fisik seketika',
          badge: 'Ctrl+Shift+S',
          action: () => {
            if (onOpenQRScanner) onOpenQRScanner();
            onClose();
          },
        },
        {
          id: 'action-bulk-qr-print',
          type: 'AKSI',
          title: 'Cetak Massal Riwayat QR Code (Bulk Print PDF)',
          subtitle: 'Buka dialog pratinjau rekapitulasi PDF resmi dan ekspor data pemindaian',
          badge: 'PDF / Cetak',
          action: () => {
            if (onOpenBulkQRPrint) onOpenBulkQRPrint();
            else if (onOpenQRScanner) onOpenQRScanner();
            onClose();
          },
        },
        {
          id: 'action-ai-assistant',
          type: 'AKSI',
          title: 'Tanya Asisten AI Gemini SDN 6',
          subtitle: 'Konsultasi pengadaan BOS, analisis stok, dan pembuatan draf Berita Acara',
          badge: 'AI Assistant',
          action: () => {
            if (onOpenAIAssistant) onOpenAIAssistant();
            onClose();
          },
        },
        {
          id: 'action-classroom',
          type: 'AKSI',
          title: 'Buka Smart Classroom LMS & Portofolio Siswa',
          subtitle: 'Masuk ke portal pembelajaran kelas, tugas interaktif, dan presensi',
          badge: 'Classroom',
          action: () => {
            if (onSwitchViewMode) onSwitchViewMode('classroom');
            onClose();
          },
        },
        {
          id: 'action-website',
          type: 'AKSI',
          title: 'Buka Portal & Website Publik SDN 6',
          subtitle: 'Tampilan profil sekolah, berita kegiatan, dan transparansi sarpras',
          badge: 'Website',
          action: () => {
            if (onSwitchViewMode) onSwitchViewMode('website');
            onClose();
          },
        },
        {
          id: 'action-google-sync',
          type: 'AKSI',
          title: 'Sinkronisasi Google Sheets & Cloud Drive',
          subtitle: 'Koneksi data dua arah langsung dengan spreadsheet inventaris sekolah',
          badge: 'Cloud Sync',
          action: () => {
            if (onOpenGoogleSync) onOpenGoogleSync();
            onClose();
          },
        },
        {
          id: 'action-lock-screen',
          type: 'AKSI',
          title: 'Kunci Layar Aplikasi (DLP Security Lock)',
          subtitle: 'Amankan sesi aktif dengan proteksi autentikasi PIN / Sandi',
          badge: 'Keamanan',
          action: () => {
            window.dispatchEvent(new CustomEvent('app_security_lock_requested'));
            onClose();
          },
        },
      ];

      // Add matching actions
      if (filter === 'ALL' || filter === 'AKSI') {
        actions.forEach((act) => {
          if (!term || act.title.toLowerCase().includes(term) || act.subtitle.toLowerCase().includes(term)) {
            list.push(act);
          }
        });
      }

      if (filter !== 'AKSI') {
        // 2. Search Master Items
        if (filter === 'ALL' || filter === 'DATA') {
          const items = db.getItems();
          const stockMap = db.getStockMap();
          items.forEach((item) => {
            if (
              !term ||
              item.NAMA_BARANG.toLowerCase().includes(term) ||
              item.KODE_BARANG.toLowerCase().includes(term) ||
              item.KATEGORI.toLowerCase().includes(term)
            ) {
              list.push({
                id: item.ID,
                type: 'BARANG',
                title: item.NAMA_BARANG,
                subtitle: `${item.KODE_BARANG} • Stok: ${stockMap[item.KODE_BARANG] || 0} ${item.JENIS_SATUAN} • ${item.LOKASI_DEFAULT}`,
                badge: item.TIPE,
                targetPage: 'persediaan',
                queryParam: item.KODE_BARANG,
              });
            }
          });

          // 3. Search Assets
          const assets = db.getAssets();
          assets.forEach((ast) => {
            if (
              !term ||
              ast.NAMA_BARANG.toLowerCase().includes(term) ||
              ast.KODE_ASET.toLowerCase().includes(term) ||
              ast.LOKASI.toLowerCase().includes(term) ||
              ast.PENANGGUNG_JAWAB.toLowerCase().includes(term)
            ) {
              list.push({
                id: ast.ID,
                type: 'ASET',
                title: ast.NAMA_BARANG,
                subtitle: `${ast.KODE_ASET} • ${ast.LOKASI} • PJ: ${ast.PENANGGUNG_JAWAB}`,
                badge: ast.KONDISI,
                targetPage: 'aset',
                queryParam: ast.KODE_ASET,
              });
            }
          });

          // 4. Search Employees / Users
          const users = db.getUsers();
          users.forEach((usr) => {
            if (!term || usr.NAMA.toLowerCase().includes(term) || usr.NIP.toLowerCase().includes(term)) {
              list.push({
                id: usr.ID,
                type: 'PEGAWAI',
                title: usr.NAMA,
                subtitle: `NIP: ${usr.NIP || '-'} • ${usr.JABATAN || usr.ROLE}`,
                badge: usr.ROLE,
                targetPage: 'pegawai',
              });
            }
          });

          // 5. Search Transactions
          const keluar = db.getBarangKeluar();
          keluar.forEach((bk) => {
            if (
              term &&
              (bk.NOMOR_DOKUMEN.toLowerCase().includes(term) ||
                bk.NAMA_BARANG.toLowerCase().includes(term) ||
                bk.PENERIMA.toLowerCase().includes(term))
            ) {
              list.push({
                id: bk.ID,
                type: 'TRANSAKSI',
                title: `Pengeluaran: ${bk.NOMOR_DOKUMEN}`,
                subtitle: `${bk.NAMA_BARANG} (${bk.JUMLAH} ${bk.JENIS_SATUAN}) kepada ${bk.PENERIMA} • ${bk.TANGGAL}`,
                badge: bk.STATUS_TRANSAKSI,
                targetPage: 'barang_keluar',
              });
            }
          });

          const masuk = db.getBarangMasuk();
          masuk.forEach((bm) => {
            if (
              term &&
              (bm.NOMOR_BKU.toLowerCase().includes(term) ||
                bm.NOMOR_KWITANSI.toLowerCase().includes(term) ||
                bm.NAMA_BARANG.toLowerCase().includes(term) ||
                bm.NAMA_TOKO.toLowerCase().includes(term))
            ) {
              list.push({
                id: bm.ID,
                type: 'TRANSAKSI',
                title: `Penerimaan: ${bm.NOMOR_KWITANSI || bm.NOMOR_BKU || bm.ID}`,
                subtitle: `${bm.NAMA_BARANG} (${bm.JUMLAH} ${bm.JENIS_SATUAN}) dari ${bm.NAMA_TOKO} • ${bm.TANGGAL}`,
                badge: 'MASUK',
                targetPage: 'barang_masuk',
              });
            }
          });

          // 6. Search Documents
          const documents = db.getDocuments();
          documents.forEach((doc) => {
            if (
              term &&
              (doc.NOMOR_DOKUMEN.toLowerCase().includes(term) ||
                doc.JENIS_DOKUMEN.toLowerCase().includes(term) ||
                doc.KETERANGAN.toLowerCase().includes(term))
            ) {
              list.push({
                id: doc.ID,
                type: 'DOKUMEN',
                title: `${doc.JENIS_DOKUMEN} - ${doc.NOMOR_DOKUMEN}`,
                subtitle: `${doc.KETERANGAN} • Dibuat oleh ${doc.DIBUAT_OLEH}`,
                badge: doc.STATUS,
                targetPage: 'document_center',
              });
            }
          });
        }

        // 7. Search Students & Classroom Assignments
        if (filter === 'ALL' || filter === 'SISWA') {
          try {
            const students = accountService.getStudents();
            students.forEach((std) => {
              if (
                !term ||
                std.NAMA.toLowerCase().includes(term) ||
                (std.NIP && std.NIP.toLowerCase().includes(term)) ||
                (std.USERNAME && std.USERNAME.toLowerCase().includes(term)) ||
                (std.KELAS && std.KELAS.toLowerCase().includes(term))
              ) {
                list.push({
                  id: std.ID,
                  type: 'SISWA',
                  title: std.NAMA,
                  subtitle: `ID/NIP: ${std.NIP || std.USERNAME || '-'} • Kelas: ${std.KELAS || '-'} • Presensi Aktif`,
                  badge: std.KELAS || 'Siswa',
                  action: () => {
                    if (onSwitchViewMode) onSwitchViewMode('classroom');
                    onClose();
                  },
                });
              }
            });
          } catch {}

          try {
            const assignments = classroomService.getAssignments();
            assignments.forEach((asg) => {
              if (
                !term ||
                asg.JUDUL.toLowerCase().includes(term) ||
                (asg.DESKRIPSI && asg.DESKRIPSI.toLowerCase().includes(term))
              ) {
                list.push({
                  id: asg.ID,
                  type: 'TUGAS',
                  title: `Tugas: ${asg.JUDUL}`,
                  subtitle: `Batas Waktu: ${asg.DEADLINE || 'Fleksibel'} • Tipe: ${asg.TYPE || 'TUGAS'} • oleh ${asg.GURU_NAMA || 'Guru'}`,
                  badge: asg.TYPE || 'Tugas',
                  action: () => {
                    if (onSwitchViewMode) onSwitchViewMode('classroom');
                    onClose();
                  },
                });
              }
            });
          } catch {}
        }
      }

      setResults(list.slice(0, 30));
      setSelectedIndex(0);
    },
    [
      onClose,
      onOpenAIAssistant,
      onOpenBulkQRPrint,
      onOpenGoogleSync,
      onOpenQRScanner,
      onSwitchViewMode,
    ]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      performSearch(query, categoryFilter);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen, performSearch, query, categoryFilter]);

  const handleSelect = (item: SearchResult) => {
    playFeedback('click');
    if (item.action) {
      item.action();
    } else if (item.targetPage) {
      onNavigate(item.targetPage, item.queryParam);
      onClose();
    }
  };

  // Keyboard navigation inside Omnibar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getIcon = (type: SearchItemType) => {
    switch (type) {
      case 'BARANG':
        return <Package size={15} className="text-emerald-700" />;
      case 'ASET':
        return <Box size={15} className="text-blue-700" />;
      case 'TRANSAKSI':
        return <FileText size={15} className="text-amber-700" />;
      case 'PEGAWAI':
        return <UserIcon size={15} className="text-purple-700" />;
      case 'SISWA':
        return <GraduationCap size={15} className="text-teal-700" />;
      case 'TUGAS':
        return <BookOpen size={15} className="text-indigo-700" />;
      case 'AKSI':
        return <Sparkles size={15} className="text-rose-600" />;
      default:
        return <FileText size={15} className="text-slate-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/90 text-slate-800 flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              performSearch(e.target.value, categoryFilter);
            }}
            placeholder="Cari aset, barang, siswa, guru, kwitansi, atau perintah aksi..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-semibold"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/80 border-b border-slate-100 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              performSearch(query, 'ALL');
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('DATA');
              performSearch(query, 'DATA');
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'DATA'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Aset & Logistik
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('SISWA');
              performSearch(query, 'SISWA');
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'SISWA'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-50'
            }`}
          >
            Siswa & Kelas
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('AKSI');
              performSearch(query, 'AKSI');
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'AKSI'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            Aksi Cepat & Perintah
          </button>
        </div>

        {/* Results list with keyboard navigation */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
          {results.length > 0 ? (
            results.map((res, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={`${res.type}-${res.id}-${index}`}
                  data-selected={isSelected}
                  onClick={() => handleSelect(res)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-2.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/80 border border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100'
                      }`}
                    >
                      {getIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-950' : 'text-slate-800'
                          }`}
                        >
                          {res.title}
                        </h4>
                        {res.badge && (
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border ${
                              res.type === 'AKSI'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : res.type === 'SISWA'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {res.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    {isSelected && (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CornerDownLeft size={10} /> Enter
                      </span>
                    )}
                    <ArrowRight size={14} className={isSelected ? 'text-emerald-700' : ''} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search size={28} className="mx-auto mb-2 text-slate-300 opacity-60" />
              <p className="font-semibold text-slate-600">Tidak ada hasil ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tidak ada data atau perintah yang cocok dengan "{query}".
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">↓</kbd>
              <span>Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">↵</kbd>
              <span>Pilih</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-3xs">Esc</kbd>
              <span>Tutup</span>
            </span>
          </div>
          <span className="font-bold text-slate-600">{results.length} hasil ditemukan</span>
        </div>
      </div>
    </div>
  );
};
