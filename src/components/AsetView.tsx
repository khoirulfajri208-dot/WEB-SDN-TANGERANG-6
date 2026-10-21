import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  X,
  Check,
  Filter,
  Camera,
  Download,
  Image as ImageIcon,
  Upload,
  Printer,
  FolderOpen,
  ExternalLink,
  CheckSquare,
  Square,
  FileSpreadsheet,
  ArrowRightLeft,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { Asset, Item, User } from '../types';
import { QRStickerModal } from './QRStickerModal';
import { ThermalStickerModal } from './ThermalStickerModal';
import { BulkAssetStickersModal } from './BulkAssetStickersModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PinAuthModal } from './PinAuthModal';
import { Pagination } from './Pagination';
import { pdfService } from '../services/pdfService';
import { excelService } from '../services/excelService';
import { useToast } from './ToastContext';
import { SearchableItemPicker } from './SearchableItemPicker';
import { SearchableEmployeePicker } from './SearchableEmployeePicker';

export const AsetView: React.FC = () => {
  const { toast, confirm } = useToast();
  const [assets, setAssets] = useState<Asset[]>(db.getAssets());
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [activeKibTab, setActiveKibTab] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
  const [selectedQRAsset, setSelectedQRAsset] = useState<Asset | null>(null);
  const [selectedThermalAsset, setSelectedThermalAsset] = useState<Asset | null>(null);
  const [isThermalBatchOpen, setIsThermalBatchOpen] = useState(false);
  const [isBulkA4Open, setIsBulkA4Open] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Multi-Selection State for Bulk Operations
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isBulkMutateOpen, setIsBulkMutateOpen] = useState(false);
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkPj, setBulkPj] = useState('');

  // PIN security protection
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<(() => void) | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const refreshData = () => {
    setAssets(db.getAssets());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const config = db.getConfig();

  const handleOpenAdd = () => {
    const year = new Date().getFullYear();
    const nextNum = String(assets.length + 1).padStart(4, '0');
    setEditingAsset({
      KODE_ASET: `AST-${year}-${nextNum}`,
      KODE_BARANG: `BRG-0001`,
      NAMA_BARANG: '',
      KIB_KATEGORI: activeKibTab !== 'ALL' ? activeKibTab : 'KIB B',
      MERK_SPESIFIKASI: '',
      JUMLAH: 1,
      JENIS_SATUAN: 'Unit',
      HARGA_PEROLEHAN: 0,
      TOTAL_NILAI: 0,
      TAHUN_PEROLEHAN: String(year),
      LOKASI: 'Ruang Lab Komputer',
      PENANGGUNG_JAWAB: 'Pengelola Lab',
      KONDISI: 'BAIK',
      SUMBER_PEROLEHAN: 'BOS Reguler',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ast: Asset) => {
    setEditingAsset({ ...ast });
    setIsModalOpen(true);
  };

  const executeWithPin = (action: () => void) => {
    setPendingPinAction(() => action);
    setIsPinModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Hapus Aset Inventaris',
      message: `Apakah Anda yakin ingin menghapus data aset "${name}" secara permanen?`,
      variant: 'danger',
      confirmLabel: 'Ya, Hapus Aset',
      onConfirm: () => {
        executeWithPin(() => {
          db.deleteAsset(id);
          toast.success(`Aset "${name}" berhasil dihapus.`);
          refreshData();
        });
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedAssetIds.length === 0) return;
    confirm({
      title: 'Hapus Massal Aset Terpilih',
      message: `Yakin ingin menghapus ${selectedAssetIds.length} data aset yang dipilih secara permanen?`,
      variant: 'danger',
      confirmLabel: 'Ya, Hapus Semua Terpilih',
      onConfirm: () => {
        executeWithPin(() => {
          selectedAssetIds.forEach((id) => db.deleteAsset(id));
          toast.success(`${selectedAssetIds.length} aset terpilih berhasil dihapus.`);
          setSelectedAssetIds([]);
          refreshData();
        });
      },
    });
  };

  const handleBulkMutateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkLocation && !bulkPj) {
      toast.warning('Isi lokasi ruangan baru atau nama penanggung jawab baru.');
      return;
    }

    selectedAssetIds.forEach((id) => {
      const ast = assets.find((a) => a.ID === id);
      if (ast) {
        db.saveAsset({
          ...ast,
          LOKASI: bulkLocation || ast.LOKASI,
          PENANGGUNG_JAWAB: bulkPj || ast.PENANGGUNG_JAWAB,
        });
      }
    });

    toast.success(`Mutasi massal sukses diterapkan pada ${selectedAssetIds.length} aset.`);
    setIsBulkMutateOpen(false);
    setSelectedAssetIds([]);
    setBulkLocation('');
    setBulkPj('');
    refreshData();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset?.NAMA_BARANG || !editingAsset.KODE_ASET) {
      toast.error('Kode Aset dan Nama Barang wajib diisi.');
      return;
    }
    db.saveAsset(editingAsset);
    setIsModalOpen(false);
    setEditingAsset(null);
    toast.success('Data aset inventaris berhasil disimpan.');
    refreshData();
  };

  const handleExportPDF = () => {
    pdfService.generateLaporanAset(filtered, 'Laporan Inventaris Aset Sekolah');
    toast.info('Laporan PDF Inventaris Aset sedang diunduh.');
  };

  const handleExportExcel = () => {
    excelService.exportAssets(
      selectedAssetIds.length > 0 ? assets.filter((a) => selectedAssetIds.includes(a.ID)) : filtered,
      config,
      activeKibTab
    );
    toast.success('Berkas Excel (.xlsx) Inventaris Aset berhasil diunduh.');
  };

  // Filter Logic
  const filtered = useMemo(() => assets.filter((a) => {
    const matchSearch =
      !search ||
      a.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      a.KODE_ASET.toLowerCase().includes(search.toLowerCase()) ||
      a.LOKASI.toLowerCase().includes(search.toLowerCase()) ||
      a.PENANGGUNG_JAWAB.toLowerCase().includes(search.toLowerCase());
    const matchCond = filterCondition === 'ALL' || a.KONDISI === filterCondition;
    const matchKib =
      activeKibTab === 'ALL' ||
      a.KIB_KATEGORI === activeKibTab ||
      (activeKibTab === 'KIB B' && !a.KIB_KATEGORI);
    return matchSearch && matchCond && matchKib;
  }), [assets, search, filterCondition, activeKibTab]);

  // Pagination slicing
  const totalItems = filtered.length;
  const paginatedAssets = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalNilaiAset = assets.reduce((sum, a) => sum + (a.TOTAL_NILAI || a.HARGA_PEROLEHAN || 0), 0);

  const stats = useMemo(() => {
    return {
      baik: assets.filter((a) => a.KONDISI === 'BAIK').length,
      rusak: assets.filter((a) => a.KONDISI !== 'BAIK').length,
      totalNilai: assets.reduce((sum, a) => sum + (a.TOTAL_NILAI || a.HARGA_PEROLEHAN || 0), 0)
    };
  }, [assets]);

  const kibTabs = useMemo(() => [
    { id: 'ALL', label: 'Semua Aset', count: assets.length },
    { id: 'KIB A', label: 'KIB A (Tanah)', count: assets.filter((a) => a.KIB_KATEGORI === 'KIB A').length },
    {
      id: 'KIB B',
      label: 'KIB B (Peralatan & Mesin)',
      count: assets.filter((a) => a.KIB_KATEGORI === 'KIB B' || !a.KIB_KATEGORI).length,
    },
    { id: 'KIB C', label: 'KIB C (Gedung & Bangunan)', count: assets.filter((a) => a.KIB_KATEGORI === 'KIB C').length },
    { id: 'KIB D', label: 'KIB D (Jalan & Jaringan)', count: assets.filter((a) => a.KIB_KATEGORI === 'KIB D').length },
    { id: 'KIB E', label: 'KIB E (Aset Lainnya)', count: assets.filter((a) => a.KIB_KATEGORI === 'KIB E').length },
  ], [assets]);

  const handleToggleSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds = paginatedAssets.map((a) => a.ID);
    const allSelected = pageIds.every((id) => selectedAssetIds.includes(id));
    if (allSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Box size={19} className="text-blue-700" />
            Inventaris & Aset Tetap Sekolah (Standar KIB)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen Kartu Inventaris Barang (KIB A–E Permendagri 47/2021), mutasi massal, cetak stiker QR A4 & POS, serta ekspor Excel murni.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkA4Open(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <QrCode size={15} /> Cetak Stiker A4 Massal
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-300"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" /> Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download size={15} /> Buku Inventaris (PDF)
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={16} /> Tambah Aset
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Register Aset</span>
          <div className="text-xl font-black text-slate-800 mt-1">{assets.length} Item</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Nilai Perolehan Aset</span>
          <div className="text-xl font-black text-emerald-950 mt-1">
            Rp {stats.totalNilai.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Kondisi Baik</span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {stats.baik} Unit
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Rusak / Perlu Servis</span>
          <div className="text-xl font-black text-rose-700 mt-1">
            {stats.rusak} Unit
          </div>
        </div>
      </div>

      {/* Golongan KIB Tabs (Permendagri 47/2021) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        {kibTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveKibTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeKibTab === tab.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeKibTab === tab.id ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kode aset, nama barang, merk, lokasi, atau penanggung jawab..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterCondition}
            onChange={(e) => {
              setFilterCondition(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-emerald-700 shadow-2xs"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="BAIK">Baik</option>
            <option value="RUSAK RINGAN">Rusak Ringan</option>
            <option value="RUSAK BERAT">Rusak Berat</option>
          </select>
        </div>
      </div>

      {/* Floating Multi-Select Action Bar */}
      {selectedAssetIds.length > 0 && (
        <div className="p-3 bg-emerald-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-3 duration-200 border border-emerald-800">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare size={16} className="text-emerald-400" />
            <span>{selectedAssetIds.length} Aset Terpilih</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkA4Open(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <QrCode size={14} /> Cetak Stiker A4 ({selectedAssetIds.length})
            </button>
            <button
              type="button"
              onClick={() => setIsBulkMutateOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft size={14} /> Mutasi Massal
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button
              type="button"
              onClick={() => setSelectedAssetIds([])}
              className="px-2 py-1.5 rounded-xl text-white/70 hover:text-white text-xs"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAllCurrentPage}
                    className="text-slate-400 hover:text-emerald-700 transition-colors"
                    title="Pilih Semua di Halaman Ini"
                  >
                    {paginatedAssets.length > 0 &&
                    paginatedAssets.every((a) => selectedAssetIds.includes(a.ID)) ? (
                      <CheckSquare size={16} className="text-emerald-700" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Kode Register</th>
                <th className="py-3 px-4">Nama Aset & Golongan KIB</th>
                <th className="py-3 px-4">Lokasi Ruangan</th>
                <th className="py-3 px-4">Penanggung Jawab</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4 text-right">Nilai Perolehan</th>
                <th className="py-3 px-4 text-center">Label QR</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedAssets.length > 0 ? (
                paginatedAssets.map((ast) => {
                  const isSelected = selectedAssetIds.includes(ast.ID);
                  return (
                    <tr
                      key={ast.ID}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(ast.ID)}
                          className="text-slate-400 hover:text-emerald-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-emerald-700" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {ast.KODE_ASET}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {ast.NAMA_BARANG}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {ast.KIB_KATEGORI || 'KIB B'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ast.MERK || ast.MERK_SPESIFIKASI || '-'} • Thn {ast.TAHUN_PEROLEHAN || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{ast.LOKASI}</td>
                      <td className="py-3 px-4 text-slate-700">{ast.PENANGGUNG_JAWAB}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            ast.KONDISI === 'BAIK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ast.KONDISI === 'RUSAK RINGAN'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {ast.KONDISI}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        Rp {(ast.TOTAL_NILAI || ast.HARGA_PEROLEHAN || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedQRAsset(ast)}
                            className="px-2 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors inline-flex items-center gap-1"
                            title="Cetak Stiker Label QR Dual-Mode"
                          >
                            <QrCode size={13} /> QR
                          </button>
                          {ast.DRIVE_FILE_URL && (
                            <a
                              href={ast.DRIVE_FILE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                              title="Buka Berkas Google Drive"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedThermalAsset(ast)}
                            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Cetak Thermal POS (50x30 / 58mm)"
                          >
                            <Printer size={14} className="text-emerald-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ast)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ast.ID, ast.NAMA_BARANG)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data aset yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={(page) => setCurrentPage(page)}
          onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
        />
      </div>

      {/* Bulk Mutate Modal */}
      {isBulkMutateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <ArrowRightLeft size={17} className="text-blue-700" />
                <span>Mutasi Massal ({selectedAssetIds.length} Aset)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkMutateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkMutateSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Pindahkan seluruh aset terpilih ke lokasi ruangan baru atau ganti penanggung jawab secara serentak.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruangan / Lokasi Baru (Kosongkan jika tidak berubah)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lab Komputer 2"
                  value={bulkLocation}
                  onChange={(e) => setBulkLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penanggung Jawab Baru (Kosongkan jika tidak berubah)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahmawati, S.Pd (NIP: ...)"
                  value={bulkPj}
                  onChange={(e) => setBulkPj(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkMutateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  Terapkan Mutasi Massal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingAsset.ID ? 'Edit Data Aset Inventaris' : 'Tambah Aset Inventaris Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Register Aset</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.KODE_ASET || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, KODE_ASET: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Golongan KIB</label>
                  <select
                    value={editingAsset.KIB_KATEGORI || 'KIB B'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, KIB_KATEGORI: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white font-bold"
                  >
                    <option value="KIB A">KIB A (Tanah)</option>
                    <option value="KIB B">KIB B (Peralatan & Mesin)</option>
                    <option value="KIB C">KIB C (Gedung & Bangunan)</option>
                    <option value="KIB D">KIB D (Jalan & Jaringan)</option>
                    <option value="KIB E">KIB E (Aset Tetap Lainnya)</option>
                  </select>
                </div>
              </div>

              <div>
                <SearchableItemPicker
                  selectedItemCode={editingAsset.KODE_BARANG}
                  onSelectItem={(item) => {
                    if (item) {
                      setEditingAsset({
                        ...editingAsset,
                        KODE_BARANG: item.KODE_BARANG,
                        NAMA_BARANG: item.NAMA_BARANG,
                        JENIS_SATUAN: item.JENIS_SATUAN || editingAsset.JENIS_SATUAN || 'Unit',
                        MERK_SPESIFIKASI: item.MERK || editingAsset.MERK_SPESIFIKASI || '',
                        HARGA_PEROLEHAN: item.HARGA_STANDAR || editingAsset.HARGA_PEROLEHAN || 0,
                        TOTAL_NILAI: (editingAsset.JUMLAH || 1) * (item.HARGA_STANDAR || editingAsset.HARGA_PEROLEHAN || 0),
                      });
                    }
                  }}
                  label="Pilih Barang dari Master (Opsional)"
                  placeholder="Ketik nama atau kode barang..."
                  id="asset-item-picker"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang / Aset</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laptop Asus VivoBook Core i5"
                  value={editingAsset.NAMA_BARANG || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, NAMA_BARANG: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Merk & Spesifikasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Asus Core i5 RAM 8GB"
                    value={editingAsset.MERK_SPESIFIKASI || editingAsset.MERK || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, MERK_SPESIFIKASI: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Perolehan</label>
                  <input
                    type="number"
                    value={editingAsset.TAHUN_PEROLEHAN || String(new Date().getFullYear())}
                    onChange={(e) => setEditingAsset({ ...editingAsset, TAHUN_PEROLEHAN: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={editingAsset.JUMLAH || 1}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const price = editingAsset.HARGA_PEROLEHAN || 0;
                      setEditingAsset({
                        ...editingAsset,
                        JUMLAH: qty,
                        TOTAL_NILAI: qty * price,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingAsset.HARGA_PEROLEHAN || 0}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      const qty = editingAsset.JUMLAH || 1;
                      setEditingAsset({
                        ...editingAsset,
                        HARGA_PEROLEHAN: price,
                        TOTAL_NILAI: qty * price,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Nilai</label>
                  <input
                    type="text"
                    readOnly
                    value={`Rp ${(editingAsset.TOTAL_NILAI || editingAsset.HARGA_PEROLEHAN || 0).toLocaleString('id-ID')}`}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <SearchableEmployeePicker
                  onSelectUser={(u) => {
                    if (u) {
                      setEditingAsset({
                        ...editingAsset,
                        PENANGGUNG_JAWAB: `${u.NAMA}${u.NIP ? ` (NIP: ${u.NIP})` : ''}`,
                        LOKASI: editingAsset.LOKASI || u.JABATAN || 'Ruang Guru',
                      });
                    }
                  }}
                  onCustomInputChange={(name, nip, jab) => {
                    setEditingAsset({
                      ...editingAsset,
                      PENANGGUNG_JAWAB: `${name}${nip ? ` (NIP: ${nip})` : ''}`,
                      LOKASI: editingAsset.LOKASI || jab || 'Ruang Guru',
                    });
                  }}
                  label="Pilih Guru / Pegawai Penanggung Jawab"
                  placeholder="Ketik nama pegawai atau NIP..."
                  id="asset-employee-picker"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Ruangan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Lab Komputer 1"
                      value={editingAsset.LOKASI || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, LOKASI: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Penanggung Jawab & NIP</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso, S.Kom"
                      value={editingAsset.PENANGGUNG_JAWAB || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, PENANGGUNG_JAWAB: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Aset</label>
                  <select
                    value={editingAsset.KONDISI || 'BAIK'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, KONDISI: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK RINGAN">Rusak Ringan</option>
                    <option value="RUSAK BERAT">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Perolehan</label>
                  <select
                    value={editingAsset.SUMBER_PEROLEHAN || 'BOS Reguler'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, SUMBER_PEROLEHAN: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white font-semibold"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja">BOS Kinerja</option>
                    <option value="BOS Daerah">BOS Daerah</option>
                    <option value="Hibah / Bantuan">Hibah / Bantuan</option>
                  </select>
                </div>
              </div>

              {/* Google Drive Link */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <FolderOpen size={15} className="text-emerald-700" />
                  Link Berkas Google Drive / Bukti Digital (Dual-Mode QR)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... atau https://..."
                  value={editingAsset.DRIVE_FILE_URL || ''}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, DRIVE_FILE_URL: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={15} /> Simpan Data Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQRAsset && (
        <QRStickerModal
          isOpen={true}
          onClose={() => setSelectedQRAsset(null)}
          asset={selectedQRAsset}
        />
      )}

      {isBulkA4Open && (
        <BulkAssetStickersModal
          isOpen={true}
          onClose={() => setIsBulkA4Open(false)}
          assets={selectedAssetIds.length > 0 ? assets.filter((a) => selectedAssetIds.includes(a.ID)) : filtered}
        />
      )}

      {(selectedThermalAsset || isThermalBatchOpen) && (
        <ThermalStickerModal
          isOpen={true}
          onClose={() => {
            setSelectedThermalAsset(null);
            setIsThermalBatchOpen(false);
          }}
          asset={selectedThermalAsset}
          batchAssets={isThermalBatchOpen ? filtered : []}
        />
      )}

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setEditingAsset((prev) => (prev ? { ...prev, FOTO_LINK: dataUrl } : null))}
        title="Foto Fisik Aset Inventaris"
      />

      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingPinAction(null);
        }}
        onSuccess={() => {
          if (pendingPinAction) pendingPinAction();
          setPendingPinAction(null);
        }}
      />
    </div>
  );
};
