import React, { useState } from 'react';
import { Store, Plus, Search, Edit2, Trash2, X, Check, Phone, MapPin } from 'lucide-react';
import { db } from '../services/localStorageService';
import { Supplier } from '../types';

export const PenyediaView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(db.getSuppliers());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const refreshData = () => {
    setSuppliers(db.getSuppliers());
  };

  const handleOpenAdd = () => {
    setEditingSupplier({
      NAMA_TOKO: '',
      ALAMAT: '',
      TELEPON: '',
      NARAHUBUNG: '',
      STATUS: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier({ ...sup });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus penyedia / toko "${name}"?`)) {
      db.deleteSupplier(id);
      refreshData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.NAMA_TOKO) {
      alert('Nama Toko / Penyedia wajib diisi.');
      return;
    }
    db.saveSupplier(editingSupplier);
    setIsModalOpen(false);
    setEditingSupplier(null);
    refreshData();
  };

  const filtered = suppliers.filter(
    (s) =>
      !search ||
      s.NAMA_TOKO.toLowerCase().includes(search.toLowerCase()) ||
      s.NARAHUBUNG.toLowerCase().includes(search.toLowerCase()) ||
      s.ALAMAT.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Store size={19} className="text-emerald-800" />
            Data Penyedia & Toko Mitra
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar toko rekanan belanja pengadaan barang, ATK, sarana, dan jasa perbaikan sekolah.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus size={16} /> Tambah Toko / Rekanan
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama toko, narahubung, atau alamat..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.ID}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{sup.NAMA_TOKO}</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {sup.STATUS}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                {sup.NARAHUBUNG && (
                  <div className="text-[11px] text-slate-700 font-semibold">
                    Kontak: {sup.NARAHUBUNG}
                  </div>
                )}
                {sup.TELEPON && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Phone size={13} className="text-slate-400" />
                    <span>{sup.TELEPON}</span>
                  </div>
                )}
                {sup.ALAMAT && (
                  <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{sup.ALAMAT}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(sup)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sup.ID, sup.NAMA_TOKO)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingSupplier.ID ? 'Edit Data Penyedia' : 'Tambah Toko / Penyedia Baru'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko / Perusahaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Buku & ATK Mitra Mandiri"
                  value={editingSupplier.NAMA_TOKO || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, NAMA_TOKO: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Narahubung (PIC)</label>
                  <input
                    type="text"
                    placeholder="Nama kontak"
                    value={editingSupplier.NARAHUBUNG || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, NARAHUBUNG: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={editingSupplier.TELEPON || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, TELEPON: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Toko</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap toko / rekanan"
                  value={editingSupplier.ALAMAT || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, ALAMAT: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
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
                  <Check size={15} /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
