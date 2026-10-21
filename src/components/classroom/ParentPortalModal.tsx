import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MessageSquare,
  Send,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Account } from '../../types/classroom';

export interface ParentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Account | null;
  allStudents?: Account[];
}

export const ParentPortalModal: React.FC<ParentPortalModalProps> = ({
  isOpen,
  onClose,
  student,
  allStudents = [],
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Account | null>(student || allStudents[0] || null);
  const [parentPhone, setParentPhone] = useState<string>('081234567890');
  const [notificationType, setNotificationType] = useState<'PRESENSI' | 'NILAI' | 'PENGUMUMAN'>('PRESENSI');
  const [messagePreview, setMessagePreview] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (student) {
      setSelectedStudent(student);
    } else if (allStudents.length > 0 && !selectedStudent) {
      setSelectedStudent(allStudents[0]);
    }
  }, [student, allStudents]);

  // Update Message Preview whenever inputs change
  React.useEffect(() => {
    if (!selectedStudent) return;

    const name = selectedStudent.NAMA;
    const kelas = selectedStudent.KELAS || 'Kelas SD';

    if (notificationType === 'PRESENSI') {
      setMessagePreview(
        `Yth. Bapak/Ibu Orang Tua/Wali dari *${name}* (${kelas}),\n\n` +
          `Laporan Presensi Kehadiran SDN Tangerang 6:\n` +
          `• Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
          `• Status: HADIR TEPAK WAKTU ✅\n` +
          `• Catatan Guru: ${name} mengikuti kegiatan belajar mengajar dengan sangat aktif hari ini.\n\n` +
          `Terima kasih atas kerja sama dan pendampingan Bapak/Ibu di rumah 🙏.\n\n` +
          `— SD Negeri Tangerang 6`
      );
    } else if (notificationType === 'NILAI') {
      setMessagePreview(
        `Yth. Bapak/Ibu Orang Tua/Wali dari *${name}* (${kelas}),\n\n` +
          `Pemberitahuan Hasil Evaluasi Pembelajaran SDN Tangerang 6:\n` +
          `• Mata Pelajaran: Matematika & Literasi\n` +
          `• Nilai Kuis CBT: 88/100 ⭐\n` +
          `• Status: Tuntas Melampaui KKM (75)\n\n` +
          `Mohon tetap diberikan motivasi belajar mandiri di rumah.\n\n` +
          `— SD Negeri Tangerang 6`
      );
    } else {
      setMessagePreview(
        `Yth. Bapak/Ibu Orang Tua/Wali dari *${name}* (${kelas}),\n\n` +
          `📢 *PENGUMUMAN KEGIATAN SEKOLAH* 📢\n` +
          `Diinformasikan bahwa pada besok Jumat, seluruh siswa mengenakan seragam Pramuka lengkap dan membawa perlengkapan kebersihan untuk kerja bakti lingkungan sekolah.\n\n` +
          `Atas perhatian dan partisipasinya kami ucapkan terima kasih.\n\n` +
          `— Wali Kelas & Komite SDN Tangerang 6`
      );
    }
  }, [selectedStudent, notificationType]);

  if (!isOpen) return null;

  const handleSendWhatsApp = () => {
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const encodedMsg = encodeURIComponent(messagePreview);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messagePreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 ring-1 ring-emerald-500/30">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Portal Orang Tua & Hub WhatsApp SD Negeri Tangerang 6
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Pemantauan Hasil Belajar, Presensi, & Kirim Notifikasi Langsung ke WhatsApp
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Select Student */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <User size={15} className="text-emerald-700" />
                Pilih Peserta Didik:
              </label>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Tahun Ajaran 2026/2027
              </span>
            </div>

            <select
              value={selectedStudent?.ID || ''}
              onChange={(e) => {
                const found = allStudents.find((s) => s.ID === e.target.value);
                if (found) setSelectedStudent(found);
              }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              {allStudents.length > 0 ? (
                allStudents.map((s) => (
                  <option key={s.ID} value={s.ID}>
                    {s.NAMA} — {s.KELAS || 'Kelas SD'} (NIS: {s.NIP || '-'})
                  </option>
                ))
              ) : (
                <option value="">Ahmad Fauzi (Kelas 4B)</option>
              )}
            </select>
          </div>

          {/* Student Progress Overview Cards */}
          {selectedStudent && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Presensi Hari Ini</span>
                <span className="text-xs font-black text-emerald-900 mt-0.5 block flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Hadir
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Rerata Nilai</span>
                <span className="text-xs font-black text-blue-900 mt-0.5 block">88 / 100</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">Badges Diraih</span>
                <span className="text-xs font-black text-purple-900 mt-0.5 block flex items-center justify-center gap-1">
                  <Award size={13} className="text-purple-600" /> 5 Lencana
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">Sikap & Profil</span>
                <span className="text-xs font-black text-amber-900 mt-0.5 block">Sangat Baik (A)</span>
              </div>
            </div>
          )}

          {/* WhatsApp Notification Hub */}
          <div className="p-4 bg-emerald-950/5 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Send size={15} className="text-emerald-700" /> Kirim Pesan WhatsApp ke Orang Tua
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">Terhubung WhatsApp API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp Orang Tua:
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Jenis Pesan Notifikasi:
                </label>
                <select
                  value={notificationType}
                  onChange={(e: any) => setNotificationType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="PRESENSI">Laporan Kehadiran Harian</option>
                  <option value="NILAI">Rekapitulasi Nilai & Kuis CBT</option>
                  <option value="PENGUMUMAN">Pengumuman & Kegiatan Kelas</option>
                </select>
              </div>
            </div>

            {/* Message Preview */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Pratinjau Pesan WhatsApp:
              </label>
              <textarea
                value={messagePreview}
                onChange={(e) => setMessagePreview(e.target.value)}
                rows={6}
                className="w-full p-3 text-xs font-mono rounded-xl border border-emerald-300 bg-white text-slate-800 leading-relaxed focus:outline-emerald-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Send size={14} />
                <span>Buka & Kirim WhatsApp</span>
                <ExternalLink size={12} className="opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" /> Aman & Terverifikasi Sekolah
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
