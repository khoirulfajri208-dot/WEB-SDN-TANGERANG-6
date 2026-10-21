import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  DollarSign,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart2,
} from 'lucide-react';

export interface ExecutiveSupervisorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveSupervisorReportModal: React.FC<ExecutiveSupervisorReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reportPeriod, setReportPeriod] = useState<string>('Semester Ganjil 2026/2027');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-800/80 text-purple-200 ring-1 ring-purple-500/30">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Dashboard & Laporan Eksekutif Pengawas Sekolah
              </h3>
              <p className="text-[11px] text-purple-200/80">
                Analitik Performa Kinerja Akademik, Tata Kelola Aset, & Realisasi BOS SDN Tangerang 6
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
              <span className="text-[10px] font-bold text-purple-700 block uppercase">Ketuntasan KKM</span>
              <span className="text-base font-black text-purple-950 mt-1 block">91.4%</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
                <TrendingUp size={11} /> +3.2% dari TW1
              </span>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 block uppercase">Kehadiran Siswa</span>
              <span className="text-base font-black text-blue-950 mt-1 block">97.8%</span>
              <span className="text-[10px] text-blue-800 font-bold mt-0.5 block">Disiplin Sekolah</span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase">Realisasi Dana BOS</span>
              <span className="text-base font-black text-emerald-950 mt-1 block">82.5%</span>
              <span className="text-[10px] text-emerald-800 font-bold mt-0.5 block">Sesuai RKAS</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 block uppercase">Aset Terverifikasi</span>
              <span className="text-base font-black text-amber-950 mt-1 block">98.2%</span>
              <span className="text-[10px] text-amber-800 font-bold mt-0.5 block">Siap Audit KIB</span>
            </div>
          </div>

          {/* Detailed Executive Printable Sheet */}
          <div className="p-5 bg-white rounded-2xl border-2 border-slate-800 shadow-sm space-y-4 font-sans text-xs">
            <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 uppercase">
                  LAPORAN PENGAWASAN & EVALUASI MUTU PENDIDIKAN
                </h4>
                <p className="text-[11px] text-slate-600">
                  SD NEGERI TANGERANG 6 • WILAYAH KECAMATAN TANGERANG
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300">
                {reportPeriod}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  1. Evaluasi Capaian Akademik & Kurikulum Merdeka
                </h5>
                <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Implementasi Kurikulum Merdeka berjalan sangat efektif di Fase A, B, dan C. Sebanyak 91.4% siswa mencapai Kriteria Ketercapaian Tujuan Pembelajaran (KKTP). Program remedial adaptif berbasis AI berhasil menuntaskan 85% siswa yang sebelumnya berada di bawah KKM.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  2. Tata Kelola Inventaris & Aset BMN/BMD
                </h5>
                <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Seluruh barang dan peralatan laboratorium/kelas telah terdata lengkap dalam Kartu Inventaris Barang (KIB A, B, C, D, E) dilengkapi label QR Code. Pemeliharaan berkas dan stiker barcode aset mencapai akurasi 98.2%.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  3. Transparansi Keuangan BOS & ARKAS SiPLah
                </h5>
                <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Realisasi penyerapan dana BOS Reguler Tahap II berjalan akuntabel dan sesuai petunjuk teknis Kemendikbudristek. Seluruh bukti transaksi telah terverifikasi dalam BKU dan K7a.
                </p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-4 text-center font-sans text-[11px] pt-4 border-t border-slate-200">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-12" />
                <p className="font-black underline">Hj. YULIA, S.Pd., M.M.</p>
                <p className="text-[10px] text-slate-500">NIP. 19680512 199303 2 004</p>
              </div>
              <div>
                <p className="text-slate-500">Pengawas Pembina SD</p>
                <p className="font-bold">Dinas Pendidikan Kota Tangerang</p>
                <div className="h-12" />
                <p className="font-black underline">Drs. H. DRS. SUPRIYADI, M.Pd.</p>
                <p className="text-[10px] text-slate-500">NIP. 19650310 198803 1 008</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium">Dokumen Siap Cetak untuk Laporan Pengawas Pembina</span>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer size={14} /> Cetak Laporan Pengawas
          </button>
        </div>
      </div>
    </div>
  );
};
