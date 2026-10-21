import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  CheckSquare,
  Square,
  Building2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  MapPin,
  Flame,
  FileCheck,
} from 'lucide-react';
import { Asset, Item, User } from '../types';
import { db } from '../services/localStorageService';

interface BatchStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocNumber?: string;
  suggestedCodes?: string[];
  onSuccess?: (msg: string) => void;
}

export const BatchStatusUpdateModal: React.FC<BatchStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  currentDocNumber,
  suggestedCodes = [],
  onSuccess,
}) => {
  const assets = db.getAssets();
  const items = db.getItems();
  const users = db.getUsers();

  const [mode, setMode] = useState<'ASSETS' | 'ITEMS'>('ASSETS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Update target values
  const [targetStatus, setTargetStatus] = useState<string>('UNCHANGED');
  const [targetKondisi, setTargetKondisi] = useState<string>('UNCHANGED');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [targetPj, setTargetPj] = useState<string>('');
  const [docRef, setDocRef] = useState<string>(currentDocNumber || '');
  const [customNote, setCustomNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select suggested codes when modal opens
  useEffect(() => {
    if (isOpen && suggestedCodes.length > 0) {
      if (mode === 'ASSETS') {
        const matched = assets
          .filter((a) => suggestedCodes.some((sc) => a.KODE_ASET.includes(sc) || sc.includes(a.KODE_ASET)))
          .map((a) => a.ID);
        if (matched.length > 0) setSelectedIds(matched);
      } else {
        const matched = items
          .filter((i) => suggestedCodes.some((sc) => i.KODE_BARANG.includes(sc) || sc.includes(i.KODE_BARANG)))
          .map((i) => i.ID);
        if (matched.length > 0) setSelectedIds(matched);
      }
    }
  }, [isOpen, suggestedCodes, mode]);

  useEffect(() => {
    if (currentDocNumber) {
      setDocRef(currentDocNumber);
    }
  }, [currentDocNumber]);

  if (!isOpen) return null;

  const categories = mode === 'ASSETS'
    ? Array.from(new Set(assets.map((a) => a.KATEGORI).filter(Boolean)))
    : Array.from(new Set(items.map((i) => i.KATEGORI).filter(Boolean)));

  const locations = Array.from(new Set(assets.map((a) => a.LOKASI).filter(Boolean)));

  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      !search ||
      a.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      a.KODE_ASET.toLowerCase().includes(search.toLowerCase()) ||
      (a.PENANGGUNG_JAWAB && a.PENANGGUNG_JAWAB.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === 'ALL' || a.KATEGORI === filterCategory;
    return matchSearch && matchCat;
  });

  const filteredItems = items.filter((i) => {
    const matchSearch =
      !search ||
      i.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      i.KODE_BARANG.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || i.KATEGORI === filterCategory;
    return matchSearch && matchCat;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const currentList = mode === 'ASSETS' ? filteredAssets : filteredItems;
    const ids = currentList.map((x) => x.ID);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleSelectFromCurrentBA = () => {
    if (suggestedCodes.length === 0) {
      alert('Tidak ada kode item terdeteksi dari Berita Acara saat ini.');
      return;
    }

    if (mode === 'ASSETS') {
      const matched = assets
        .filter((a) => suggestedCodes.some((sc) => a.KODE_ASET.toLowerCase().includes(sc.toLowerCase()) || sc.toLowerCase().includes(a.KODE_ASET.toLowerCase())))
        .map((a) => a.ID);
      setSelectedIds(matched);
    } else {
      const matched = items
        .filter((i) => suggestedCodes.some((sc) => i.KODE_BARANG.toLowerCase().includes(sc.toLowerCase()) || sc.toLowerCase().includes(i.KODE_BARANG.toLowerCase())))
        .map((i) => i.ID);
      setSelectedIds(matched);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Pilih setidaknya 1 aset atau item untuk diperbarui.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'ASSETS') {
        const updates: any = {};
        if (targetStatus !== 'UNCHANGED') updates.STATUS = targetStatus;
        if (targetKondisi !== 'UNCHANGED') updates.KONDISI = targetKondisi;
        if (targetLocation.trim()) updates.LOKASI = targetLocation;
        if (targetPj.trim()) updates.PENANGGUNG_JAWAB = targetPj;
        if (customNote.trim()) updates.KETERANGAN = customNote;

        const result = db.batchUpdateAssets(selectedIds, updates, docRef);
        if (result.success) {
          const msg = `Berhasil memperbarui ${result.count} aset secara massal sesuai ${docRef || 'Berita Acara'}!`;
          if (onSuccess) onSuccess(msg);
          onClose();
        }
      } else {
        const updates: any = {};
        if (targetStatus !== 'UNCHANGED') updates.STATUS = targetStatus as any;
        if (targetLocation.trim()) updates.LOKASI_DEFAULT = targetLocation;

        const result = db.batchUpdateItems(selectedIds, updates, docRef);
        if (result.success) {
          const msg = `Berhasil memperbarui ${result.count} data barang master secara massal!`;
          if (onSuccess) onSuccess(msg);
          onClose();
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal memperbarui status: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pembaruan Status Massal Aset & Persediaan (Batch Update)
              </h3>
              <p className="text-xs text-slate-500">
                Ubah status, kondisi, lokasi, atau penanggung jawab aset sekaligus pasca penerbitan Berita Acara
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs custom-scrollbar">
          {/* 1. Mode Switcher & Quick Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('ASSETS');
                  setSelectedIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'ASSETS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Daftar Aset ({assets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('ITEMS');
                  setSelectedIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'ITEMS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Master Barang ({items.length})</span>
              </button>
            </div>

            {suggestedCodes.length > 0 && (
              <button
                type="button"
                onClick={handleSelectFromCurrentBA}
                className="px-3 py-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 font-bold rounded-lg transition-colors flex items-center gap-1"
                title="Pilih otomatis item yang tercantum pada Berita Acara saat ini"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Pilih Item dari BA Saat Ini ({suggestedCodes.length})</span>
              </button>
            )}
          </div>

          {/* 2. Select Items to Update */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Pilih Target ({selectedIds.length} Terpilih)
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                Pilih Semua yang Ditampilkan
              </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode, nama, penanggung jawab..."
                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 max-w-[140px]"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50 custom-scrollbar">
              {mode === 'ASSETS' ? (
                filteredAssets.map((ast) => {
                  const isChecked = selectedIds.includes(ast.ID);
                  return (
                    <div
                      key={ast.ID}
                      onClick={() => handleToggleSelect(ast.ID)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-100/80 text-emerald-950 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-mono font-bold text-emerald-800 mr-1.5">
                            {ast.KODE_ASET}
                          </span>
                          <span className="truncate">{ast.NAMA_BARANG}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0 ml-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {ast.LOKASI}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            ast.KONDISI === 'BAIK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ast.KONDISI}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                filteredItems.map((itm) => {
                  const isChecked = selectedIds.includes(itm.ID);
                  return (
                    <div
                      key={itm.ID}
                      onClick={() => handleToggleSelect(itm.ID)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-100/80 text-emerald-950 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-mono font-bold text-emerald-800 mr-1.5">
                            {itm.KODE_BARANG}
                          </span>
                          <span className="truncate">{itm.NAMA_BARANG}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {itm.JENIS_SATUAN}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. New Status & Attribute Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block">
              Nilai Baru yang Diterapkan ke Seluruh Item Terpilih:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status Operasional</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-700"
                >
                  <option value="UNCHANGED">-- Tidak Diubah --</option>
                  <option value="AKTIF">AKTIF (Digunakan / Sesuai BA)</option>
                  <option value="TIDAK AKTIF">TIDAK AKTIF (Disimpan / Non-Operasional)</option>
                  <option value="DIHAPUS">DIHAPUS (Sesuai BA Penghapusan / Musnah)</option>
                </select>
              </div>

              {mode === 'ASSETS' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kondisi Fisik</label>
                  <select
                    value={targetKondisi}
                    onChange={(e) => setTargetKondisi(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-700"
                  >
                    <option value="UNCHANGED">-- Tidak Diubah --</option>
                    <option value="BAIK">BAIK (Layak Pakai)</option>
                    <option value="RUSAK RINGAN">RUSAK RINGAN (Dalam Perbaikan)</option>
                    <option value="RUSAK BERAT">RUSAK BERAT (Usul Hapus)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lokasi Ruangan Baru</label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="Kosongkan jika tidak ada mutasi ruangan"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700"
                />
              </div>

              {mode === 'ASSETS' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Penanggung Jawab Baru</label>
                  <input
                    type="text"
                    value={targetPj}
                    onChange={(e) => setTargetPj(e.target.value)}
                    placeholder="Nama Guru / Pegawai Penerima"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Nomor Referensi Berita Acara & Catatan Audit
                </label>
                <input
                  type="text"
                  value={docRef}
                  onChange={(e) => setDocRef(e.target.value)}
                  placeholder="Contoh: 027/BAST-BOS/SDN6/2026/001"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500">
              {selectedIds.length} item akan diperbarui secara permanen ke database lokal.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedIds.length === 0}
                className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Terapkan Pembaruan ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
