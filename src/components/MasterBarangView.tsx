import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, Check, Filter, QrCode, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/localStorageService';
import { Item } from '../types';
import { A4ItemLabelsModal } from './A4ItemLabelsModal';
import { excelService } from '../services/excelService';

export const MasterBarangView: React.FC = () => {
  const [items, setItems] = useState<Item[]>(db.getItems());
  const [stockMap, setStockMap] = useState<Record<string, number>>(db.getStockMap());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.KATEGORI).filter(Boolean)));

  const refreshData = () => {
    setItems(db.getItems());
    setStockMap(db.getStockMap());
  };

  const handleExportExcel = () => {
    const config = db.getConfig();
    excelService.exportPersediaan(items, stockMap, config, 'Master_Data_Barang_Persediaan');
  };

  const handleOpenAdd = () => {
    setEditingItem({
      KODE_BARANG: `BRG-${String(items.length + 1).padStart(4, '0')}`,
      NAMA_BARANG: '',
      KATEGORI: 'ATK / Kertas',
      JENIS_SATUAN: 'Pcs',
      TIPE: 'Habis Pakai',
      BATAS_MINIMUM: 5,
      LOKASI_DEFAULT: 'Gudang Utama',
      STATUS: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus master barang "${name}"?`)) {
      db.deleteItem(id);
      refreshData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.NAMA_BARANG || !editingItem.KODE_BARANG) {
      alert('Kode dan Nama Barang wajib diisi.');
      return;
    }
    db.saveItem(editingItem);
    setIsModalOpen(false);
    setEditingItem(null);
    refreshData();
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !search ||
      item.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      item.KODE_BARANG.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.KATEGORI === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package size={19} className="text-emerald-800" />
            Master Data Barang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database acuan satu sumber untuk jenis barang, satuan, dan batas minimum stok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="Ekspor master barang dan saldo stok ke format Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} /> Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setIsLabelsModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <QrCode size={16} className="text-emerald-800" /> Cetak Label A4 (QR Code)
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={16} /> Tambah Barang Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau nama barang..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-emerald-700 shadow-2xs"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Batas Min</th>
                <th className="py-3 px-4">Lokasi Default</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const stock = stockMap[item.KODE_BARANG] || 0;
                  const isLow = stock <= item.BATAS_MINIMUM;
                  return (
                    <tr key={item.ID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.KODE_BARANG}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.NAMA_BARANG}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {item.KATEGORI}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 whitespace-nowrap">{item.JENIS_SATUAN}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`font-mono tabular-nums font-black text-sm ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {stock}
                        </span>
                        <span className="text-slate-400 font-semibold ml-1 text-[11px]">{item.JENIS_SATUAN}</span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-mono tabular-nums font-bold text-slate-700">{item.BATAS_MINIMUM}</span>
                        <span className="text-slate-400 font-medium ml-1 text-[11px]">{item.JENIS_SATUAN}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.LOKASI_DEFAULT}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.ID, item.NAMA_BARANG)}
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
                    Tidak ada data barang yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingItem.ID ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={editingItem.KODE_BARANG || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, KODE_BARANG: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rim, Lusin, Pcs"
                    value={editingItem.JENIS_SATUAN || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, JENIS_SATUAN: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kertas HVS A4 70gr PaperOne"
                  value={editingItem.NAMA_BARANG || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, NAMA_BARANG: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: ATK / Kertas"
                    value={editingItem.KATEGORI || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, KATEGORI: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.BATAS_MINIMUM || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, BATAS_MINIMUM: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Default</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gudang Utama - Rak A1"
                    value={editingItem.LOKASI_DEFAULT || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, LOKASI_DEFAULT: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Rekening RKAS</label>
                  <input
                    type="text"
                    placeholder="5.1.02.01.01.0024"
                    value={editingItem.KODE_REKENING_RKAS || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, KODE_REKENING_RKAS: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check size={15} /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 QR Code Labels Modal */}
      <A4ItemLabelsModal
        isOpen={isLabelsModalOpen}
        onClose={() => setIsLabelsModalOpen(false)}
        items={items}
      />
    </div>
  );
};
