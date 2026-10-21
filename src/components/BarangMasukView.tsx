import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownLeft, Plus, Search, Check, Camera, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';
import { db } from '../services/localStorageService';
import { BarangMasuk, Item } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { SearchableItemPicker } from './SearchableItemPicker';

export const BarangMasukView: React.FC = () => {
  const [list, setList] = useState<BarangMasuk[]>(db.getBarangMasuk());
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const items = db.getItems();
  const suppliers = db.getSuppliers();
  const config = db.getConfig();

  const refreshData = () => {
    setList(db.getBarangMasuk());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  // Form State
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlah, setJumlah] = useState<number>(1);
  const [hargaSatuan, setHargaSatuan] = useState<number>(0);
  const [sumberAnggaran, setSumberAnggaran] = useState('BOS Reguler');
  const [kodeRekening, setKodeRekening] = useState('');
  const [nomorBku, setNomorBku] = useState('');
  const [nomorKwitansi, setNomorKwitansi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoLink, setFotoLink] = useState('');

  const handleApplyScannedReceipt = (data: any) => {
    setSupplierName(data.nama_penyedia || '');
    setTanggal(data.tanggal || new Date().toISOString().slice(0, 10));
    setNomorKwitansi(data.nomor_faktur || '');
    setNomorBku(data.nomor_siplah || '');
    setSumberAnggaran(data.sumber_anggaran || 'BOS Reguler');
    setKodeRekening(data.kode_rekening_arkas || '5.1.02.01.01.0024');
    setKeterangan(data.catatan || (data.nomor_siplah ? `Pesanan SIPLah: ${data.nomor_siplah}` : ''));

    // If items were extracted, pick the first or create batch
    if (data.items && data.items.length > 0) {
      const first = data.items[0];
      const matched = items.find(
        (i) =>
          i.NAMA_BARANG.toLowerCase().includes(first.nama_barang.toLowerCase()) ||
          first.nama_barang.toLowerCase().includes(i.NAMA_BARANG.toLowerCase())
      );
      if (matched) {
        setSelectedItemCode(matched.KODE_BARANG);
      } else if (items.length > 0) {
        setSelectedItemCode(items[0].KODE_BARANG);
      }
      setJumlah(first.jumlah || 1);
      setHargaSatuan(first.harga_satuan || 0);

      // If more than 1 item, auto-save the remaining items into database
      if (data.items.length > 1) {
        for (let i = 1; i < data.items.length; i++) {
          const itemObj = data.items[i];
          const itmMatch = items.find(
            (it) =>
              it.NAMA_BARANG.toLowerCase().includes(itemObj.nama_barang.toLowerCase()) ||
              itemObj.nama_barang.toLowerCase().includes(it.NAMA_BARANG.toLowerCase())
          );
          const kBarang = itmMatch?.KODE_BARANG || `BRG-${Date.now().toString().slice(-4)}-${i}`;
          const nBarang = itmMatch?.NAMA_BARANG || itemObj.nama_barang;

          db.createBarangMasuk({
            TANGGAL: data.tanggal || new Date().toISOString().slice(0, 10),
            NAMA_TOKO: data.nama_penyedia,
            KODE_BARANG: kBarang,
            NAMA_BARANG: nBarang,
            JUMLAH: itemObj.jumlah || 1,
            JENIS_SATUAN: itemObj.jenis_satuan || 'Pcs',
            HARGA_SATUAN: itemObj.harga_satuan || 0,
            NAMA_SEKOLAH: config.SCHOOL_NAME,
            SUMBER_ANGGARAN: data.sumber_anggaran || 'BOS Reguler',
            KODE_REKENING_RKAS: data.kode_rekening_arkas || '5.1.02.01.01.0024',
            NOMOR_BKU: data.nomor_siplah || '',
            NOMOR_KWITANSI: data.nomor_faktur || '',
            FOTO_LINK: '',
            KETERANGAN: `Item ke-${i + 1} dari Faktur ${data.nomor_faktur}`,
          });
        }
      }
    }

    setIsAdding(true);
    refreshData();
  };

  const selectedMaster = items.find((i) => i.KODE_BARANG === selectedItemCode);

  const handleItemSelect = (item: Item | null) => {
    if (!item) {
      setSelectedItemCode('');
      return;
    }
    setSelectedItemCode(item.KODE_BARANG);
    if (item.KODE_REKENING_RKAS) {
      setKodeRekening(item.KODE_REKENING_RKAS);
    }
    if (item.HARGA_ESTIMASI && item.HARGA_ESTIMASI > 0 && hargaSatuan === 0) {
      setHargaSatuan(item.HARGA_ESTIMASI);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaster) {
      alert('Pilih barang terlebih dahulu.');
      return;
    }
    if (jumlah <= 0) {
      alert('Jumlah barang harus lebih dari 0.');
      return;
    }

    db.createBarangMasuk({
      TANGGAL: tanggal,
      NAMA_TOKO: supplierName,
      KODE_BARANG: selectedMaster.KODE_BARANG,
      NAMA_BARANG: selectedMaster.NAMA_BARANG,
      JUMLAH: jumlah,
      JENIS_SATUAN: selectedMaster.JENIS_SATUAN,
      HARGA_SATUAN: hargaSatuan,
      NAMA_SEKOLAH: config.SCHOOL_NAME,
      SUMBER_ANGGARAN: sumberAnggaran,
      KODE_REKENING_RKAS: kodeRekening,
      NOMOR_BKU: nomorBku,
      NOMOR_KWITANSI: nomorKwitansi,
      FOTO_LINK: fotoLink,
      KETERANGAN: keterangan,
    });

    alert('Transaksi Barang Masuk berhasil disimpan dan stok telah diperbarui.');
    setIsAdding(false);
    resetForm();
    refreshData();
  };

  const resetForm = () => {
    setSelectedItemCode('');
    setSupplierName('');
    setTanggal(new Date().toISOString().slice(0, 10));
    setJumlah(1);
    setHargaSatuan(0);
    setNomorBku('');
    setNomorKwitansi('');
    setKeterangan('');
    setFotoLink('');
  };

  const filtered = useMemo(() => list.filter(
    (m) =>
      !search ||
      m.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      m.KODE_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      m.NAMA_TOKO.toLowerCase().includes(search.toLowerCase()) ||
      m.NOMOR_KWITANSI.toLowerCase().includes(search.toLowerCase())
  ), [list, search]);

  const totalPengadaanFormatted = (jumlah * hargaSatuan).toLocaleString('id-ID');

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowDownLeft size={19} className="text-emerald-800" />
            Penerimaan Barang Masuk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan pengadaan barang, penambahan stok otomatis, dan sinkronisasi buku persediaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <Sparkles size={16} className="text-emerald-200 animate-pulse" />
            Scan Kwitansi AI
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={16} /> {isAdding ? 'Tutup Formulir' : 'Catat Barang Masuk'}
          </button>
        </div>
      </div>

      {/* Input Form Panel */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-800/30 shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Formulir Penerimaan Barang Masuk</h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Update Stok Otomatis
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terima</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penyedia / Toko</label>
                <input
                  type="text"
                  list="supplierList"
                  required
                  placeholder="Pilih atau ketik nama toko"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
                <datalist id="supplierList">
                  {suppliers.map((s) => (
                    <option key={s.ID} value={s.NAMA_TOKO} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Anggaran</label>
                <select
                  value={sumberAnggaran}
                  onChange={(e) => setSumberAnggaran(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-slate-50 font-medium"
                >
                  <option value="BOS Reguler">BOS Reguler</option>
                  <option value="BOS Kinerja">BOS Kinerja</option>
                  <option value="BOSDA">BOSDA (APBD)</option>
                  <option value="Bantuan Komite / Hibah">Bantuan Komite / Hibah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Item Selection & Calculations */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <SearchableItemPicker
                    selectedItemCode={selectedItemCode}
                    onSelectItem={handleItemSelect}
                    label="Pilih Barang (Master Data Persediaan & Aset)"
                    placeholder="Ketik untuk mencari nama atau kode barang..."
                    id="barang-masuk-item-picker"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Qty)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={1}
                        required
                        value={jumlah}
                        onChange={(e) => setJumlah(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs rounded-l-xl border border-slate-300 bg-white font-bold focus:outline-emerald-700"
                      />
                      <span className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-r-xl border border-l-0 border-slate-300">
                        {selectedMaster?.JENIS_SATUAN || 'Satuan'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hargaSatuan}
                      onChange={(e) => setHargaSatuan(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {selectedMaster && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <div className="text-slate-500">
                    Kategori: <span className="font-semibold text-slate-700">{selectedMaster.KATEGORI}</span> • Lokasi:{' '}
                    <span className="font-semibold text-slate-700">{selectedMaster.LOKASI_DEFAULT}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Estimasi Total Pembelian:</span>
                    <span className="text-sm font-black text-emerald-900">Rp {totalPengadaanFormatted}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Administrasi Pembukuan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kwitansi</label>
                <input
                  type="text"
                  placeholder="KW-08/2026/..."
                  value={nomorKwitansi}
                  onChange={(e) => setNomorKwitansi(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor BKU</label>
                <input
                  type="text"
                  placeholder="BKU-08/..."
                  value={nomorBku}
                  onChange={(e) => setNomorBku(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Rekening RKAS</label>
                <input
                  type="text"
                  placeholder="5.1.02..."
                  value={kodeRekening}
                  onChange={(e) => setKodeRekening(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Rincian</label>
              <textarea
                rows={2}
                placeholder="Rincian pengadaan atau catatan tambahan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>

            {/* Foto Bukti Nota / Fisik */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Foto Bukti Nota / Kwitansi / Fisik Barang
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Camera size={14} /> Ambil Foto Kamera
                </button>

                <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer">
                  <Upload size={14} /> Unggah Nota (Gambar)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setFotoLink(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {fotoLink && (
                  <button
                    type="button"
                    onClick={() => setFotoLink('')}
                    className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold"
                  >
                    Hapus Lampiran
                  </button>
                )}
              </div>

              {fotoLink && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 max-w-xs">
                  <img
                    src={fotoLink}
                    alt="Pratinjau Nota"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg border border-emerald-300"
                  />
                  <div className="text-[11px] text-emerald-800 font-bold">
                    Foto bukti nota terlampir
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Check size={16} /> Simpan Penerimaan Barang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Table */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari riwayat penerimaan berdasarkan nama barang, toko, kwitansi..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Penyedia / Toko</th>
                  <th className="py-3 px-4">No Kwitansi</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item.ID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">{item.TANGGAL}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.KODE_BARANG}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.NAMA_BARANG}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          +{item.JUMLAH} {item.JENIS_SATUAN}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">Rp {item.HARGA_SATUAN.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-950">
                        Rp {item.TOTAL_PENGADAAN.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.NAMA_TOKO}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {item.NOMOR_KWITANSI || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.PETUGAS}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Belum ada transaksi barang masuk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setFotoLink(dataUrl)}
        title="Foto Nota Pembelian / Bukti Fisik Barang"
      />

      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyData={handleApplyScannedReceipt}
      />
    </div>
  );
};
