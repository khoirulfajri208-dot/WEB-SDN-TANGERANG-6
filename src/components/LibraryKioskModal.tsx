import React, { useState } from 'react';
import {
  X,
  BookOpen,
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Book,
  User,
  CreditCard,
  Printer,
  Download,
} from 'lucide-react';
import { Account } from '../types/classroom';

export interface LibraryKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStudents?: Account[];
}

interface BookItem {
  id: string;
  code: string;
  title: string;
  author: string;
  category: string;
  available: boolean;
}

export const LibraryKioskModal: React.FC<LibraryKioskModalProps> = ({
  isOpen,
  onClose,
  allStudents = [],
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Account | null>(allStudents[0] || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [borrowedSuccess, setBorrowedSuccess] = useState<string>('');

  const booksList: BookItem[] = [
    {
      id: 'b-1',
      code: 'BK-2026-001',
      title: 'Matematika Gasing & Literasi Numerasi SD Kelas 4',
      author: 'Prof. Yohanes Surya',
      category: 'Buku Teks Utama',
      available: true,
    },
    {
      id: 'b-2',
      code: 'BK-2026-002',
      title: 'Ensiklopedia Sains Anak: Tata Surya & Alam Semesta',
      author: 'Dr. Ahmad Subagyo',
      category: 'Sains & Teknologi',
      available: true,
    },
    {
      id: 'b-3',
      code: 'BK-2026-003',
      title: 'Kumpulan Cerita Rakyat Nusantara & Nilai Pancasila',
      author: 'Retno Hapsari, M.Pd.',
      category: 'Literasi & Budaya',
      available: true,
    },
    {
      id: 'b-4',
      code: 'BK-2026-004',
      title: 'Kit Praktikum Robotika Sederhana & Coding Scratch',
      author: 'Tim Laboratorium STEM',
      category: 'Kit Media Belajar',
      available: false,
    },
  ];

  if (!isOpen) return null;

  const handleBorrowBook = (book: BookItem) => {
    const name = selectedStudent?.NAMA || 'Ahmad Fauzi';
    setBorrowedSuccess(`Berhasil meminjam "${book.title}" untuk ${name}. Bukti diproses!`);
    setTimeout(() => setBorrowedSuccess(''), 3000);
  };

  const filteredBooks = booksList.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800/80 text-teal-200 ring-1 ring-teal-400/30">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Kios Mandiri Perpustakaan Digital & Media Belajar
              </h3>
              <p className="text-[11px] text-teal-200/80">
                Peminjaman & Pengembalian Buku Mandiri Berbasis Scan Tap QR / NFC Kartu Pelajar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Select Student */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-teal-700" />
              <span className="text-xs font-bold text-slate-800">Identitas Peminjam:</span>
              <select
                value={selectedStudent?.ID || ''}
                onChange={(e) => {
                  const found = allStudents.find((s) => s.ID === e.target.value);
                  if (found) setSelectedStudent(found);
                }}
                className="px-3 py-1 text-xs font-bold rounded-xl border border-slate-300 bg-white"
              >
                {allStudents.length > 0 ? (
                  allStudents.map((s) => (
                    <option key={s.ID} value={s.ID}>
                      {s.NAMA} — {s.KELAS || 'Siswa'}
                    </option>
                  ))
                ) : (
                  <option value="">Ahmad Fauzi (Kelas 4B)</option>
                )}
              </select>
            </div>

            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200">
              Batas Pinjam: 3 Buku / 7 Hari
            </span>
          </div>

          {/* Alert */}
          {borrowedSuccess && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl font-bold text-xs flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{borrowedSuccess}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul buku, pengarang, atau kode barcode perpustakaan..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Book Catalog List */}
          <div className="space-y-2.5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-teal-400 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <Book size={20} />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-slate-900">{book.title}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pengarang: {book.author} • Kode: <span className="font-mono">{book.code}</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{book.category}</span>
                  </div>
                </div>

                <div>
                  {book.available ? (
                    <button
                      type="button"
                      onClick={() => handleBorrowBook(book)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Pinjam Buku
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs border border-slate-200">
                      Dipinjam Siswa Lain
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium">Sistem Integrasi Katalog Barcode Perpustakaan SDN Tangerang 6</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup Kios
          </button>
        </div>
      </div>
    </div>
  );
};
