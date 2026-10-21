import React, { useState } from 'react';
import {
  FileSpreadsheet,
  DollarSign,
  PieChart,
  ShoppingBag,
  Layers,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Building2,
  Calendar,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { ARKASAccount, BarangMasuk, Asset } from '../types';
import { ARKASOfficialSPJModal } from './ARKASOfficialSPJModal';

export const ARKASSiPlahView: React.FC = () => {
  const [accounts, setAccounts] = useState<ARKASAccount[]>(db.getARKASAccounts());
  const [barangMasukList] = useState<BarangMasuk[]>(db.getBarangMasuk());
  const [assetsList] = useState<Asset[]>(db.getAssets());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OPERASIONAL' | 'MODAL_ASET'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSPJModal, setShowSPJModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ARKASAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState<ARKASAccount>({
    KODE_REKENING: '',
    NAMA_REKENING: '',
    KATEGORI_BELANJA: 'OPERASIONAL',
    SUMBER_DANA: 'BOS Reguler',
    PAGU_ANGGARAN: 10000000,
    REALISASI: 0,
    SISA_ANGGARAN: 10000000,
    STATUS: 'AKTIF',
  });

  const totalPagu = accounts.reduce((acc, cur) => acc + cur.PAGU_ANGGARAN, 0);
  const totalRealisasi = accounts.reduce((acc, cur) => acc + (cur.REALISASI || 0), 0);
  const totalSisa = Math.max(0, totalPagu - totalRealisasi);
  const pctAbsorption = totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(1) : '0';

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.KODE_REKENING.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.NAMA_REKENING.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.SUMBER_DANA.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      categoryFilter === 'ALL' || acc.KATEGORI_BELANJA === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      KODE_REKENING: '',
      NAMA_REKENING: '',
      KATEGORI_BELANJA: 'OPERASIONAL',
      SUMBER_DANA: 'BOS Reguler',
      PAGU_ANGGARAN: 10000000,
      REALISASI: 0,
      SISA_ANGGARAN: 10000000,
      STATUS: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: ARKASAccount) => {
    setEditingAccount(acc);
    setFormData(acc);
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.KODE_REKENING || !formData.NAMA_REKENING) return;

    db.saveARKASAccount(formData);
    setAccounts(db.getARKASAccounts());
    setIsModalOpen(false);
  };

  const exportCSV = () => {
    const headers = [
      'Kode Rekening',
      'Nama Rekening Belanja',
      'Kategori',
      'Sumber Dana',
      'Pagu Anggaran (Rp)',
      'Realisasi (Rp)',
      'Sisa Anggaran (Rp)',
      'Penyerapan (%)',
    ];
    const rows = accounts.map((a) => [
      `"${a.KODE_REKENING}"`,
      `"${a.NAMA_REKENING}"`,
      a.KATEGORI_BELANJA,
      a.SUMBER_DANA,
      a.PAGU_ANGGARAN,
      a.REALISASI,
      a.SISA_ANGGARAN,
      a.PAGU_ANGGARAN > 0 ? ((a.REALISASI / a.PAGU_ANGGARAN) * 100).toFixed(1) + '%' : '0%',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_arkas_bos_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Fase 2: Integrasi Ekosistem ARKAS & SIPLah
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Kode Rekening Belanja ARKAS & SIPLah
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Sinkronisasi pemetaan rekening belanja RKAS/ARKAS (Belanja Operasional ATK & Modal Aset) dengan pengadaan barang masuk dan pesanan daring SIPLah.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowSPJModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>Cetak SPJ BOS (ARKAS K7a)</span>
          </button>
          <button
            id="btn-export-arkas"
            onClick={exportCSV}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs border border-white/20 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            id="btn-add-arkas"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kode Rekening
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pagu RKAS / BOS
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
            Rp {totalPagu.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {accounts.length} Akun Belanja Terdaftar
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Realisasi Belanja
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            Rp {totalRealisasi.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Penyerapan: {pctAbsorption}% dari Pagu
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sisa Pagu Tersedia
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
            Rp {totalSisa.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Dapat digunakan untuk pengadaan triwulan berikutnya
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transaksi Pengadaan Masuk
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-2">
            {barangMasukList.length + assetsList.length} Faktur/BA
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Terhubung BKU & SIPLah
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode rekening, nama kegiatan, atau sumber dana..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-white font-bold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setCategoryFilter('OPERASIONAL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'OPERASIONAL'
                  ? 'bg-white font-bold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operasional (ATK)
            </button>
            <button
              onClick={() => setCategoryFilter('MODAL_ASET')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'MODAL_ASET'
                  ? 'bg-white font-bold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modal Aset
            </button>
          </div>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Kode Rekening ARKAS & Realisasi Belanja ({filteredAccounts.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-36">Kode Rekening</th>
                <th className="py-3 px-4 min-w-[240px]">Uraian Belanja / Kegiatan</th>
                <th className="py-3 px-4 w-28">Kategori</th>
                <th className="py-3 px-4 w-28">Sumber Dana</th>
                <th className="py-3 px-4 w-32 text-right">Pagu (Rp)</th>
                <th className="py-3 px-4 w-32 text-right">Realisasi (Rp)</th>
                <th className="py-3 px-4 w-32 text-right">Sisa (Rp)</th>
                <th className="py-3 px-4 w-36">Progres</th>
                <th className="py-3 px-4 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc, idx) => {
                const pct =
                  acc.PAGU_ANGGARAN > 0
                    ? Math.min(100, (acc.REALISASI / acc.PAGU_ANGGARAN) * 100)
                    : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {acc.KODE_REKENING}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {acc.NAMA_REKENING}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.KATEGORI_BELANJA === 'MODAL_ASET'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {acc.KATEGORI_BELANJA === 'MODAL_ASET' ? 'Modal Aset' : 'Operasional'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {acc.SUMBER_DANA}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      Rp {acc.PAGU_ANGGARAN.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      Rp {acc.REALISASI.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                      Rp {acc.SISA_ANGGARAN.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                          <span>{pct.toFixed(0)}%</span>
                          <span>
                            {pct >= 90 ? 'Mendekati Pagu' : pct >= 50 ? 'Sedang' : 'Tersedia'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90
                                ? 'bg-amber-500'
                                : pct >= 50
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Pagu Rekening"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
              <h3 className="font-bold text-base">
                {editingAccount ? 'Edit Kode Rekening ARKAS' : 'Tambah Kode Rekening ARKAS'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Rekening (Standar Permendagri / Kemendikbud)
                </label>
                <input
                  type="text"
                  required
                  value={formData.KODE_REKENING}
                  onChange={(e) => setFormData({ ...formData, KODE_REKENING: e.target.value })}
                  placeholder="Contoh: 5.1.02.01.01.0024"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Rekening / Kegiatan Belanja
                </label>
                <input
                  type="text"
                  required
                  value={formData.NAMA_REKENING}
                  onChange={(e) => setFormData({ ...formData, NAMA_REKENING: e.target.value })}
                  placeholder="Contoh: Belanja Alat Tulis Kantor (ATK)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori Belanja
                  </label>
                  <select
                    value={formData.KATEGORI_BELANJA}
                    onChange={(e) =>
                      setFormData({ ...formData, KATEGORI_BELANJA: e.target.value as any })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OPERASIONAL">Operasional (ATK/Habis Pakai)</option>
                    <option value="MODAL_ASET">Modal Aset Tetap (KIB/KIR)</option>
                    <option value="JASA">Jasa & Pemeliharaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sumber Dana
                  </label>
                  <select
                    value={formData.SUMBER_DANA}
                    onChange={(e) => setFormData({ ...formData, SUMBER_DANA: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja / Afirmasi">BOS Kinerja / Afirmasi</option>
                    <option value="BOS Daerah / APBD">BOS Daerah / APBD</option>
                    <option value="Komite Sekolah">Komite Sekolah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Pagu Anggaran (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.PAGU_ANGGARAN}
                    onChange={(e) =>
                      setFormData({ ...formData, PAGU_ANGGARAN: Number(e.target.value) })
                    }
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Realisasi Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.REALISASI}
                    onChange={(e) =>
                      setFormData({ ...formData, REALISASI: Number(e.target.value) })
                    }
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Simpan Kode Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARKAS Official SPJ BOS Document Generator Modal */}
      <ARKASOfficialSPJModal
        isOpen={showSPJModal}
        onClose={() => setShowSPJModal(false)}
      />
    </div>
  );
};
