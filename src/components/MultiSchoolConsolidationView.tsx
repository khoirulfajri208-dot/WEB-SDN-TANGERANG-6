import React, { useState } from 'react';
import {
  Building2,
  Share2,
  Layers,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { SchoolUnitConsolidation } from '../types';

export const MultiSchoolConsolidationView: React.FC = () => {
  const [schools, setSchools] = useState<SchoolUnitConsolidation[]>(db.getConsolidatedSchools());
  const [searchTerm, setSearchTerm] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolUnitConsolidation | null>(null);

  const totalAssetsAll = schools.reduce((acc, cur) => acc + cur.TOTAL_NILAI_ASET, 0);
  const totalInventoryAll = schools.reduce((acc, cur) => acc + cur.TOTAL_NILAI_PERSEDIAAN, 0);
  const totalGrand = totalAssetsAll + totalInventoryAll;
  const avgBosAbsorption = (
    schools.reduce((acc, cur) => acc + cur.PENYERAPAN_BOS_PCT, 0) / (schools.length || 1)
  ).toFixed(1);

  const filteredSchools = schools.filter((s) => {
    const matchSearch =
      s.NAMA_SEKOLAH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.NPSN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.KECAMATAN.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenjang = jenjangFilter === 'ALL' || s.JENJANG === jenjangFilter;
    return matchSearch && matchJenjang;
  });

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated = schools.map((s) => ({
        ...s,
        STATUS_SINKRON: 'TERHUBUNG' as const,
        TERAKHIR_SINKRON: new Date().toISOString(),
      }));
      setSchools(updated);
      updated.forEach((s) => db.saveConsolidatedSchool(s));
      setIsSyncing(false);
    }, 1200);
  };

  const exportCSV = () => {
    const headers = [
      'NPSN',
      'Nama Sekolah / Unit',
      'Jenjang',
      'Kecamatan',
      'Kepala Sekolah',
      'Bendahara',
      'Total Nilai Aset (Rp)',
      'Total Persediaan (Rp)',
      'Penyerapan BOS (%)',
      'Kondisi Baik (%)',
      'Status Sinkron',
    ];
    const rows = schools.map((s) => [
      `"${s.NPSN}"`,
      `"${s.NAMA_SEKOLAH}"`,
      s.JENJANG,
      s.KECAMATAN,
      `"${s.KEPALA_SEKOLAH}"`,
      `"${s.BENDAHARA}"`,
      s.TOTAL_NILAI_ASET,
      s.TOTAL_NILAI_PERSEDIAAN,
      s.PENYERAPAN_BOS_PCT + '%',
      s.KONDISI_BAIK_PCT + '%',
      s.STATUS_SINKRON,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_konsolidasi_aset_sekolah_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Fase 3: Multi-School & Korwil Dinas Consolidation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Konsolidasi Aset & Persediaan Wilayah
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Dasbor agregasi data inventaris, barang persediaan, dan realisasi anggaran BOS antar sekolah di bawah naungan Korwil Pendidikan & Dinas BPKAD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-consolidation"
            onClick={exportCSV}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs border border-white/20 transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Ekspor Laporan Gabungan
          </button>
          <button
            id="btn-sync-all-schools"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Unit'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Aset Gabungan
            </span>
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Rp {totalAssetsAll.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Dari {schools.length} Satuan Pendidikan Terdaftar
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Persediaan Gudang
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-2">
            Rp {totalInventoryAll.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Stok ATK, Logistik & Perlengkapan Belajar
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata Serapan BOS
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {avgBosAbsorption}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Target Triwulan Terpenuhi
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Sinkronisasi Real-Time
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
            {schools.filter((s) => s.STATUS_SINKRON === 'TERHUBUNG').length} / {schools.length} Aktif
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Protokol API Cloud Sync Terhubung
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NPSN, nama sekolah, atau kecamatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {['ALL', 'SD', 'SMP', 'SMK', 'DINAS'].map((j) => (
              <button
                key={j}
                onClick={() => setJenjangFilter(j)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  jenjangFilter === j
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {j === 'ALL' ? 'Semua' : j}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table of Consolidated Schools */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Satuan Pendidikan & Cadangan Logistik Wilayah ({filteredSchools.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-28">NPSN</th>
                <th className="py-3 px-4 min-w-[220px]">Nama Satuan Pendidikan</th>
                <th className="py-3 px-4 w-24">Jenjang</th>
                <th className="py-3 px-4 w-28">Kecamatan</th>
                <th className="py-3 px-4 w-32 text-right">Nilai Aset (Rp)</th>
                <th className="py-3 px-4 w-32 text-right">Nilai Persediaan</th>
                <th className="py-3 px-4 w-28 text-center">Serapan BOS</th>
                <th className="py-3 px-4 w-28 text-center">Kondisi Baik</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-20 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{s.NPSN}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{s.NAMA_SEKOLAH}</div>
                    <div className="text-[10px] text-slate-500">
                      Kepsek: {s.KEPALA_SEKOLAH} • Bendahara: {s.BENDAHARA}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {s.JENJANG}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{s.KECAMATAN}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                    Rp {s.TOTAL_NILAI_ASET.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-teal-700">
                    Rp {s.TOTAL_NILAI_PERSEDIAAN.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                    {s.PENYERAPAN_BOS_PCT}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-emerald-700">{s.KONDISI_BAIK_PCT}%</span>
                    <span className="text-[10px] text-rose-500 ml-1">
                      ({s.KONDISI_RUSAK_PCT}% rusak)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.STATUS_SINKRON === 'TERHUBUNG'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.STATUS_SINKRON === 'TERHUBUNG' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      {s.STATUS_SINKRON}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedSchool(s)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Lihat Rincian Unit"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* School Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-teal-950 text-white">
              <div>
                <h3 className="font-bold text-base">{selectedSchool.NAMA_SEKOLAH}</h3>
                <p className="text-xs text-teal-200">
                  NPSN: {selectedSchool.NPSN} • Kec. {selectedSchool.KECAMATAN}
                </p>
              </div>
              <button
                onClick={() => setSelectedSchool(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Kepala Sekolah</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedSchool.KEPALA_SEKOLAH}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Bendahara Barang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedSchool.BENDAHARA}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="text-[10px] text-teal-700 font-bold uppercase">Total Nilai Aset Tetap</div>
                  <div className="text-base font-black text-teal-900 mt-1">
                    Rp {selectedSchool.TOTAL_NILAI_ASET.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-teal-600 mt-0.5">
                    {selectedSchool.TOTAL_ITEM_ASET} Item Tercatat
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Total Nilai Persediaan</div>
                  <div className="text-base font-black text-blue-900 mt-1">
                    Rp {selectedSchool.TOTAL_NILAI_PERSEDIAAN.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">
                    {selectedSchool.TOTAL_ITEM_PERSEDIAAN} Item Stok ATK
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Realisasi Serapan BOS:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedSchool.PENYERAPAN_BOS_PCT}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kondisi Fisik Baik:</span>
                  <span className="font-bold text-slate-800">
                    {selectedSchool.KONDISI_BAIK_PCT}% ({selectedSchool.KONDISI_RUSAK_PCT}% Rusak)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sinkronisasi Terakhir:</span>
                  <span className="font-mono text-slate-600">
                    {new Date(selectedSchool.TERAKHIR_SINKRON).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSchool(null)}
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
