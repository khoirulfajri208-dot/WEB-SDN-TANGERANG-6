import React, { useState } from 'react';
import {
  TrendingDown,
  Calculator,
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  Building,
  Laptop,
  Car,
  Armchair,
  Book,
  Box,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { AssetDepreciation } from '../types';

export const DepresiasiAsetView: React.FC = () => {
  const [depreciations] = useState<AssetDepreciation[]>(db.getAssetDepreciations());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<AssetDepreciation | null>(null);

  const totalAcquisition = depreciations.reduce((acc, cur) => acc + cur.HARGA_PEROLEHAN, 0);
  const totalAccumulated = depreciations.reduce((acc, cur) => acc + cur.AKUMULASI_PENYUSUTAN, 0);
  const totalBookValue = depreciations.reduce((acc, cur) => acc + cur.NILAI_BUKU, 0);
  const totalAnnualExpense = depreciations.reduce((acc, cur) => acc + cur.PENYUSUTAN_PER_TAHUN, 0);

  const filteredData = depreciations.filter((item) => {
    const matchSearch =
      item.KODE_ASET.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.NAMA_BARANG.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.LOKASI.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      categoryFilter === 'ALL' || item.KATEGORI_SAP === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getCategoryIcon = (category: AssetDepreciation['KATEGORI_SAP']) => {
    switch (category) {
      case 'PERALATAN_MESIN':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'KENDARAAN':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'MEBELAIR':
        return <Armchair className="w-4 h-4 text-amber-600" />;
      case 'BUKU':
        return <Book className="w-4 h-4 text-purple-600" />;
      case 'GEDUNG_BANGUNAN':
        return <Building className="w-4 h-4 text-rose-600" />;
      default:
        return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryLabel = (category: AssetDepreciation['KATEGORI_SAP']) => {
    switch (category) {
      case 'PERALATAN_MESIN':
        return 'Peralatan & Mesin (IT)';
      case 'KENDARAAN':
        return 'Kendaraan Dinas';
      case 'MEBELAIR':
        return 'Mebelair & Perlengkapan';
      case 'BUKU':
        return 'Buku Perpustakaan';
      case 'GEDUNG_BANGUNAN':
        return 'Gedung & Bangunan';
      default:
        return 'Aset Tetap Lainnya';
    }
  };

  const exportCSV = () => {
    const headers = [
      'Kode Aset',
      'Nama Barang / Aset',
      'Kategori SAP',
      'Tanggal Perolehan',
      'Nilai Perolehan (Rp)',
      'Masa Manfaat (Tahun)',
      'Umur Berjalan (Bulan)',
      'Beban Penyusutan / Thn (Rp)',
      'Akumulasi Penyusutan (Rp)',
      'Nilai Buku Saat Ini (Rp)',
      'Status',
    ];
    const rows = depreciations.map((d) => [
      `"${d.KODE_ASET}"`,
      `"${d.NAMA_BARANG}"`,
      d.KATEGORI_SAP,
      d.TANGGAL_PEROLEHAN,
      d.HARGA_PEROLEHAN,
      d.MASA_MANFAAT_TAHUN,
      d.UMUR_BERJALAN_BULAN,
      d.PENYUSUTAN_PER_TAHUN,
      d.AKUMULASI_PENYUSUTAN,
      d.NILAI_BUKU,
      d.STATUS_PENYUSUTAN,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penyusutan_aset_sap_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Fase 3: Tata Kelola Aset Standar SAP / Permendagri
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Penyusutan Nilai Aset (Depresiasi Otomatis)
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Perhitungan nilai buku aset tetap sekolah menggunakan <b>Metode Garis Lurus (Straight-Line)</b> sesuai Standar Akuntansi Pemerintahan (SAP) & pelaporan BPKAD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-depresiasi"
            onClick={exportCSV}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/20 transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Ekspor Rekapitulasi Depresiasi (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Perolehan Awal
            </span>
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Rp {totalAcquisition.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {depreciations.length} Unit Aset Terdaftar KIB
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Akumulasi Penyusutan
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-2">
            - Rp {totalAccumulated.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-1">
            {totalAcquisition > 0
              ? ((totalAccumulated / totalAcquisition) * 100).toFixed(1)
              : 0}
            % dari Total Nilai Perolehan
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nilai Buku Bersih Terkini
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            Rp {totalBookValue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Nilai wajar aset dalam Neraca Keuangan
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Beban Penyusutan / Tahun
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-2">
            Rp {totalAnnualExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Beban operasional tahun berjalan
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode aset, nama barang inventaris, atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">Semua Kategori SAP</option>
            <option value="PERALATAN_MESIN">Peralatan Mesin & Komputer (4-5 Thn)</option>
            <option value="KENDARAAN">Kendaraan Dinas (7 Thn)</option>
            <option value="MEBELAIR">Mebelair & Kursi Meja (5 Thn)</option>
            <option value="BUKU">Buku Perpustakaan (5 Thn)</option>
            <option value="GEDUNG_BANGUNAN">Gedung Bangunan (50 Thn)</option>
          </select>
        </div>
      </div>

      {/* Main Depreciation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Jadwal Penyusutan & Nilai Buku Aset ({filteredData.length} Aset)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-32">Kode Aset</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Barang & Kategori</th>
                <th className="py-3 px-4 w-28">Tgl Perolehan</th>
                <th className="py-3 px-4 w-24 text-center">Manfaat</th>
                <th className="py-3 px-4 w-32 text-right">Nilai Perolehan</th>
                <th className="py-3 px-4 w-32 text-right">Penyusutan / Thn</th>
                <th className="py-3 px-4 w-32 text-right">Akumulasi Depresiasi</th>
                <th className="py-3 px-4 w-32 text-right">Nilai Buku Saat Ini</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-20 text-center">Simulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => {
                const depPct =
                  item.HARGA_PEROLEHAN > 0
                    ? Math.min(100, (item.AKUMULASI_PENYUSUTAN / item.HARGA_PEROLEHAN) * 100)
                    : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                      {item.KODE_ASET}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.KATEGORI_SAP)}
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {item.NAMA_BARANG}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {getCategoryLabel(item.KATEGORI_SAP)} • {item.LOKASI}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.TANGGAL_PEROLEHAN}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {item.MASA_MANFAAT_TAHUN} Thn
                      <div className="text-[10px] text-slate-400">
                        ({item.UMUR_BERJALAN_BULAN} bln berjalan)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      Rp {item.HARGA_PEROLEHAN.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      Rp {item.PENYUSUTAN_PER_TAHUN.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      - Rp {item.AKUMULASI_PENYUSUTAN.toLocaleString('id-ID')}
                      <div className="text-[10px] text-rose-500 font-normal">
                        ({depPct.toFixed(0)}% terdepresiasi)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800">
                      Rp {item.NILAI_BUKU.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.STATUS_PENYUSUTAN === 'HABIS_MANFAAT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.STATUS_PENYUSUTAN === 'HABIS_MANFAAT'
                          ? 'Habis Manfaat'
                          : 'Aktif Menyusut'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedAsset(item)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Schedule Simulation Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-indigo-950 text-white">
              <div>
                <h3 className="font-bold text-base">
                  Simulasi Jadwal Depresiasi SAP: {selectedAsset.NAMA_BARANG}
                </h3>
                <p className="text-xs text-indigo-200 font-mono">
                  Kode: {selectedAsset.KODE_ASET} | Masa Manfaat: {selectedAsset.MASA_MANFAAT_TAHUN} Tahun
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Harga Perolehan</div>
                  <div className="text-sm font-bold text-slate-800">
                    Rp {selectedAsset.HARGA_PEROLEHAN.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Akumulasi Depresiasi</div>
                  <div className="text-sm font-bold text-rose-700">
                    - Rp {selectedAsset.AKUMULASI_PENYUSUTAN.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Nilai Buku Saat Ini</div>
                  <div className="text-sm font-bold text-emerald-700">
                    Rp {selectedAsset.NILAI_BUKU.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tabel Proyeksi Penyusutan Tahunan (Garis Lurus):
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Tahun Ke-</th>
                        <th className="p-2.5 text-right">Nilai Awal</th>
                        <th className="p-2.5 text-right">Beban Penyusutan</th>
                        <th className="p-2.5 text-right">Akumulasi Depresiasi</th>
                        <th className="p-2.5 text-right">Nilai Buku Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: selectedAsset.MASA_MANFAAT_TAHUN }).map((_, yearIdx) => {
                        const yearNum = yearIdx + 1;
                        const depYear = selectedAsset.PENYUSUTAN_PER_TAHUN;
                        const accum = Math.min(
                          selectedAsset.HARGA_PEROLEHAN - 1,
                          depYear * yearNum
                        );
                        const startVal =
                          selectedAsset.HARGA_PEROLEHAN - depYear * (yearNum - 1);
                        const endBookVal = Math.max(1, selectedAsset.HARGA_PEROLEHAN - accum);

                        return (
                          <tr key={yearNum} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">Tahun {yearNum}</td>
                            <td className="p-2.5 text-right text-slate-600">
                              Rp {startVal.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-medium text-rose-600">
                              Rp {depYear.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-bold text-rose-700">
                              Rp {accum.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-800">
                              Rp {endBookVal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
