import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Minus, Check, ShoppingBag, Search, Sparkles, Printer, Download } from 'lucide-react';
import { db } from '../services/localStorageService';
import { Item, User } from '../types';
import { SignaturePad } from './SignaturePad';
import { SearchableEmployeePicker } from './SearchableEmployeePicker';
import { pdfService } from '../services/pdfService';

export const PengambilanATKView: React.FC = () => {
  const [items, setItems] = useState<Item[]>(db.getItems());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [stockMap, setStockMap] = useState<Record<string, number>>(db.getStockMap());

  const refreshData = () => {
    setItems(db.getItems());
    setUsers(db.getUsers());
    setStockMap(db.getStockMap());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaNip, setPenerimaNip] = useState('');
  const [unitRuangan, setUnitRuangan] = useState('');
  const [tujuan, setTujuan] = useState('Keperluan KBM / Administrasi Kelas');
  const [parafLink, setParafLink] = useState('');
  const [submittedDoc, setSubmittedDoc] = useState<string | null>(null);
  const [submittedDetails, setSubmittedDetails] = useState<{
    docNo: string;
    penerima: string;
    nip: string;
    unit: string;
    tujuan: string;
    items: { KODE_BARANG: string; NAMA_BARANG: string; JUMLAH: number; JENIS_SATUAN: string }[];
    paraf: string;
  } | null>(null);

  const atkItems = items.filter(
    (i) =>
      i.TIPE === 'Habis Pakai' &&
      (!search ||
        i.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
        i.KODE_BARANG.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpdateQty = (code: string, delta: number) => {
    const current = cart[code] || 0;
    const maxStock = stockMap[code] || 0;
    const nextVal = Math.max(0, Math.min(maxStock, current + delta));

    const updated = { ...cart };
    if (nextVal === 0) {
      delete updated[code];
    } else {
      updated[code] = nextVal;
    }
    setCart(updated);
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPenerimaNama(u.NAMA);
    setPenerimaNip(u.NIP || '');
    if (u.JABATAN) setUnitRuangan(u.JABATAN);
  };

  const totalSelectedCount = Object.values(cart).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSelectedCount === 0) {
      alert('Pilih minimal satu barang yang ingin diambil.');
      return;
    }
    if (!penerimaNama) {
      alert('Nama penerima / guru wajib diisi.');
      return;
    }
    if (!parafLink) {
      alert('Tanda tangan / paraf wajib diisi.');
      return;
    }

    const cartItems = Object.keys(cart).map((code) => {
      const item = items.find((i) => i.KODE_BARANG === code)!;
      return {
        KODE_BARANG: item.KODE_BARANG,
        NAMA_BARANG: item.NAMA_BARANG,
        JUMLAH: cart[code],
        JENIS_SATUAN: item.JENIS_SATUAN,
      };
    });

    try {
      const res = db.createBarangKeluar({
        TANGGAL: new Date().toISOString().slice(0, 10),
        PENERIMA: penerimaNama,
        PENERIMA_NIP: penerimaNip,
        UNIT_RUANGAN: unitRuangan || 'Ruang Guru / Kelas',
        TUJUAN_PENGGUNAAN: tujuan,
        KETERANGAN: 'Pengambilan ATK Mandiri Guru & Staff',
        FOTO_LINK: '',
        PARAF_LINK: parafLink,
        ITEMS: cartItems,
      });

      setSubmittedDoc(res.docNo);
      setSubmittedDetails({
        docNo: res.docNo,
        penerima: penerimaNama,
        nip: penerimaNip,
        unit: unitRuangan || 'Ruang Guru / Kelas',
        tujuan,
        items: cartItems,
        paraf: parafLink,
      });
      setCart({});
      setParafLink('');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handlePrintSPB = () => {
    if (!submittedDetails) return;
    const config = db.getConfig();
    pdfService.generateBeritaAcara({
      title: 'SURAT PENYERAHAN BARANG (SPB) / BUKTI PENGAMBILAN ATK',
      docNo: submittedDetails.docNo,
      description: `Telah diserahkan perlengkapan bahan ajar / administrasi kantor kepada tenaga pendidik / kependidikan dengan rincian sebagai berikut:`,
      tableHeaders: ['No', 'Kode Barang', 'Nama Barang ATK', 'Jumlah', 'Satuan'],
      tableRows: submittedDetails.items.map((it, idx) => [
        idx + 1,
        it.KODE_BARANG,
        it.NAMA_BARANG,
        it.JUMLAH,
        it.JENIS_SATUAN,
      ]),
      footerText: `Tujuan Penggunaan: ${submittedDetails.tujuan}\nUnit / Ruangan: ${submittedDetails.unit}\nBarang telah diterima dalam kondisi baik dan langsung dipergunakan untuk kegiatan sekolah.`,
      leftSigner: {
        title: 'Petugas Pengelola Barang,',
        name: config.TREASURER || config.WAREHOUSE_OFFICER || 'Pengurus Barang',
        nip: config.TREASURER_NIP || config.WAREHOUSE_OFFICER_NIP || '-',
      },
      rightSigner: {
        title: 'Penerima Barang / Guru,',
        name: submittedDetails.penerima,
        nip: submittedDetails.nip || '-',
      },
      signatures: {
        rightSignatureImage: submittedDetails.paraf,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList size={19} className="text-emerald-800" />
          Layanan Cepat Pengambilan ATK Guru & Staff
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pilih perlengkapan kantor atau bahan ajar habis pakai yang dibutuhkan, lengkapi identitas, dan tanda tangan langsung di layar.
        </p>
      </div>

      {submittedDoc && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <h4 className="font-bold text-xs">Pengambilan ATK Berhasil Dicatat!</h4>
            <p className="text-xs text-emerald-800">
              No. Bukti Dokumen: <strong className="font-mono">{submittedDoc}</strong>. Stok gudang telah dipotong otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSPB}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer size={14} /> Cetak Bukti SPB (PDF)
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedDoc(null);
                setSubmittedDetails(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item Picker Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ATK (Spidol, Kertas, Penghapus, Tinta, Map...)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {atkItems.map((item) => {
              const stock = stockMap[item.KODE_BARANG] || 0;
              const selectedQty = cart[item.KODE_BARANG] || 0;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={item.ID}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    selectedQty > 0
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                      : isOutOfStock
                      ? 'bg-slate-100/60 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 leading-snug">{item.NAMA_BARANG}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isOutOfStock ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${stock} ${item.JENIS_SATUAN}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">{item.KODE_BARANG}</div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Ambil:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={selectedQty <= 0}
                        onClick={() => handleUpdateQty(item.KODE_BARANG, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-800 flex items-center justify-center font-bold"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900">
                        {selectedQty}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock || selectedQty >= stock}
                        onClick={() => handleUpdateQty(item.KODE_BARANG, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-30 text-white flex items-center justify-center font-bold"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Checkout & Signature */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={15} className="text-emerald-800" />
                Keranjang Pengambilan
              </h3>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                {totalSelectedCount} Item
              </span>
            </div>

            {/* Selected Items Summary */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {Object.keys(cart).length > 0 ? (
                Object.keys(cart).map((code) => {
                  const itm = items.find((i) => i.KODE_BARANG === code);
                  if (!itm) return null;
                  return (
                    <div
                      key={code}
                      className="p-2 rounded-xl bg-slate-50 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 truncate mr-2">{itm.NAMA_BARANG}</span>
                      <span className="font-bold text-emerald-900 shrink-0">
                        {cart[code]} {itm.JENIS_SATUAN}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Klik tanda <strong>+</strong> pada barang di sebelah kiri.
                </p>
              )}
            </div>

            {/* Teacher Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <SearchableEmployeePicker
                  selectedUser={selectedUser}
                  onSelectUser={(u) => {
                    if (u) {
                      handleSelectUser(u);
                    } else {
                      setSelectedUser(null);
                      setPenerimaNama('');
                      setPenerimaNip('');
                    }
                  }}
                  onCustomInputChange={(name, nip, jab) => {
                    setPenerimaNama(name);
                    setPenerimaNip(nip);
                    if (jab) setUnitRuangan(jab);
                  }}
                  label="Pilih Guru / Pegawai Pengambil"
                  placeholder="Ketik untuk mencari nama guru, NIP, atau jabatan..."
                  id="atk-employee-picker"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Guru / Pegawai
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={penerimaNama}
                    onChange={(e) => setPenerimaNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold focus:outline-emerald-700 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    placeholder="NIP (otomatis terisi)"
                    value={penerimaNip}
                    onChange={(e) => setPenerimaNip(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono text-emerald-900 font-semibold focus:outline-emerald-700 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ruangan / Kelas</label>
                <input
                  type="text"
                  placeholder="Ruang Guru / Lab / Kelas ..."
                  value={unitRuangan}
                  onChange={(e) => setUnitRuangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tujuan</label>
                <input
                  type="text"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>
            </div>

            {/* Signature */}
            <div className="pt-2">
              <SignaturePad
                onSave={(dataUrl) => setParafLink(dataUrl)}
                initialValue={parafLink}
                label="Paraf / Tanda Tangan Digital"
              />
            </div>

            <button
              type="submit"
              disabled={totalSelectedCount === 0}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} /> Konfirmasi Pengambilan ATK
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
