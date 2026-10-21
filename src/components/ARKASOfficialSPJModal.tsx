import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
export interface Transaction {
  id?: string;
  tanggal: string;
  noBukti: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldo: number;
}

export interface ARKASOfficialSPJModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
}

export const ARKASOfficialSPJModal: React.FC<ARKASOfficialSPJModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
}) => {
  const [docType, setDocType] = useState<'BKU' | 'K7A' | 'SPJ_BOS'>('BKU');
  const [bulan, setBulan] = useState<string>('Agustus 2026');
  const [sumberDana, setSumberDana] = useState<string>('BOS Reguler');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'No,Tanggal,No Bukti,Uraian Transaksi,Penerimaan (Rp),Pengeluaran (Rp),Saldo (Rp)\n' +
      '1,01/08/2026,BOS-001,Penerimaan Dana BOS Reguler Tahap II,45000000,0,45000000\n' +
      '2,05/08/2026,BOS-002,Pembelian ATK & Kertas F4/A4 LabKom,0,2450000,42550000\n' +
      '3,12/08/2026,BOS-003,Pemeliharaan AC Kelas & Perbaikan Proyektor,0,1800000,40750000\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SPJ_BOS_${docType}_${bulan.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-800/80 text-amber-300 ring-1 ring-indigo-500/30">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Generator Laporan Official SPJ BOS & ARKAS K7a
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                Dokumen Baku Pertanggungjawaban Keuangan Siap Cetak & Siap Audit Dinas
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

        {/* Options Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Jenis Dokumen SPJ:
            </label>
            <select
              value={docType}
              onChange={(e: any) => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
            >
              <option value="BKU">Buku Kas Umum (BKU BOS)</option>
              <option value="K7A">Buku Kas Pembantu Tunai (K7a)</option>
              <option value="SPJ_BOS">SPTJM & Berita Acara Kas</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Periode Bulan:</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
            >
              <option value="Juli 2026">Juli 2026</option>
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="September 2026">September 2026</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Sumber Dana:</label>
            <select
              value={sumberDana}
              onChange={(e) => setSumberDana(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
            >
              <option value="BOS Reguler">BOS Reguler Tahap II</option>
              <option value="BOS Kinerja">BOS Kinerja Sekolah</option>
              <option value="BOPD">BOPD Kota Tangerang</option>
            </select>
          </div>
        </div>

        {/* Printable Document Sheet Preview */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-6 bg-white rounded-xl border-2 border-slate-800 shadow-md font-serif text-slate-900 space-y-4 print:p-0 print:border-none print:shadow-none">
            {/* Kop Surat Sekolah */}
            <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                PEMERINTAH KOTA TANGERANG • DINAS PENDIDIKAN
              </h4>
              <h2 className="font-black text-base text-slate-900 uppercase">
                SD NEGERI TANGERANG 6
              </h2>
              <p className="text-[10px] font-sans text-slate-500">
                Jl. Asrama Kodim No. 6, RT 002 / RW 003, Sukasari, Kec. Tangerang, Kota Tangerang
              </p>
              <div className="mt-2 text-xs font-bold font-sans uppercase border-t border-slate-300 pt-1">
                {docType === 'BKU'
                  ? 'BUKU KAS UMUM (BKU) DANA BOS'
                  : docType === 'K7A'
                  ? 'BUKU KAS PEMBANTU TUNAI (FORMULIR K7A)'
                  : 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)'}
              </div>
              <p className="text-[11px] font-sans font-semibold text-slate-700">
                PERIODE: {bulan.toUpperCase()} • SUMBER DANA: {sumberDana.toUpperCase()}
              </p>
            </div>

            {/* Document Content Table */}
            <div className="font-sans text-xs">
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-slate-900 p-2">No</th>
                    <th className="border border-slate-900 p-2">Tanggal</th>
                    <th className="border border-slate-900 p-2">No. Kode / Bukti</th>
                    <th className="border border-slate-900 p-2">Uraian Transaksi</th>
                    <th className="border border-slate-900 p-2">Penerimaan (Rp)</th>
                    <th className="border border-slate-900 p-2">Pengeluaran (Rp)</th>
                    <th className="border border-slate-900 p-2">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-1.5 text-center">1</td>
                    <td className="border border-slate-900 p-1.5 text-center">01/08/2026</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">BOS-001</td>
                    <td className="border border-slate-900 p-1.5 font-semibold">Penerimaan Dana BOS Reguler Tahap II</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">45.000.000</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">0</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono font-bold">45.000.000</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-1.5 text-center">2</td>
                    <td className="border border-slate-900 p-1.5 text-center">05/08/2026</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">BOS-002</td>
                    <td className="border border-slate-900 p-1.5">Pembelian ATK & Kertas HVS F4/A4 Kebutuhan Pembelajaran</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">0</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">2.450.000</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono font-bold">42.550.000</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-1.5 text-center">3</td>
                    <td className="border border-slate-900 p-1.5 text-center">12/08/2026</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">BOS-003</td>
                    <td className="border border-slate-900 p-1.5">Pemeliharaan AC Ruang Kelas & Servis Proyektor Pembelajaran</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">0</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">1.800.000</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono font-bold">40.750.000</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="border border-slate-900 p-2 text-right">TOTAL KUMULATIF:</td>
                    <td className="border border-slate-900 p-2 text-right font-mono">45.000.000</td>
                    <td className="border border-slate-900 p-2 text-right font-mono">4.250.000</td>
                    <td className="border border-slate-900 p-2 text-right font-mono text-emerald-800">40.750.000</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-4 text-center font-sans text-[11px] pt-6">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala SD Negeri Tangerang 6</p>
                <div className="h-16" />
                <p className="font-black underline">Hj. YULIA, S.Pd., M.M.</p>
                <p className="text-[10px] text-slate-500">NIP. 19680512 199303 2 004</p>
              </div>
              <div>
                <p>Tangerang, 31 Agustus 2026</p>
                <p className="font-bold">Bendahara BOS Sekolah</p>
                <div className="h-16" />
                <p className="font-black underline">NURHAYATI, S.Pd.</p>
                <p className="text-[10px] text-slate-500">NIP. 19790420 200801 2 015</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium">Format Sesuai Petunjuk Teknis Juknis BOS Kemendikbudristek</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet size={14} /> Ekspor CSV / Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} /> Cetak Dokumen SPJ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
