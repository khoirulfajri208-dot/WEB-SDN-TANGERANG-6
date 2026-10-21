import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Check,
  Camera,
  Trash2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  Upload,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { BarangKeluar, Item, User } from '../types';
import { SignaturePad } from './SignaturePad';
import { CameraCaptureModal } from './CameraCaptureModal';
import { pdfService } from '../services/pdfService';
import { SearchableItemPicker } from './SearchableItemPicker';
import { SearchableEmployeePicker } from './SearchableEmployeePicker';

export const BarangKeluarView: React.FC = () => {
  const [list, setList] = useState<BarangKeluar[]>(db.getBarangKeluar());
  const [activeTab, setActiveTab] = useState<'form' | 'approval' | 'history'>('form');
  const [search, setSearch] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const items = db.getItems();
  const users = db.getUsers();
  const stockMap = db.getStockMap();

  const refreshData = () => {
    setList(db.getBarangKeluar());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  // Multi-item cart state
  interface CartItem {
    KODE_BARANG: string;
    NAMA_BARANG: string;
    JUMLAH: number;
    JENIS_SATUAN: string;
    STOK_SAAT_INI: number;
  }

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);

  // Form Metadata State
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaNip, setPenerimaNip] = useState('');
  const [unitRuangan, setUnitRuangan] = useState('');
  const [tujuanPenggunaan, setTujuanPenggunaan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoLink, setFotoLink] = useState('');
  const [parafLink, setParafLink] = useState('');

  const handleAddItemToCart = () => {
    if (!selectedItemCode) return;
    const master = items.find((i) => i.KODE_BARANG === selectedItemCode);
    if (!master) return;

    const availableStock = stockMap[master.KODE_BARANG] || 0;
    if (availableStock <= 0) {
      alert(`Stok ${master.NAMA_BARANG} habis (0 ${master.JENIS_SATUAN})! Tidak dapat dikeluarkan.`);
      return;
    }

    if (itemQty > availableStock) {
      alert(`Jumlah melebihi stok tersedia (${availableStock} ${master.JENIS_SATUAN}).`);
      return;
    }

    const existingIdx = cart.findIndex((c) => c.KODE_BARANG === master.KODE_BARANG);
    if (existingIdx >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIdx].JUMLAH + itemQty;
      if (newQty > availableStock) {
        alert(`Total jumlah (${newQty}) melebihi stok tersedia (${availableStock}).`);
        return;
      }
      updated[existingIdx].JUMLAH = newQty;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          KODE_BARANG: master.KODE_BARANG,
          NAMA_BARANG: master.NAMA_BARANG,
          JUMLAH: itemQty,
          JENIS_SATUAN: master.JENIS_SATUAN,
          STOK_SAAT_INI: availableStock,
        },
      ]);
    }

    setSelectedItemCode('');
    setItemQty(1);
  };

  const handleRemoveFromCart = (code: string) => {
    setCart(cart.filter((c) => c.KODE_BARANG !== code));
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPenerimaNama(u.NAMA);
    setPenerimaNip(u.NIP || '');
    if (u.JABATAN) {
      setUnitRuangan(u.JABATAN);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Pilih minimal satu barang ke dalam daftar pengeluaran.');
      return;
    }
    if (!penerimaNama) {
      alert('Nama penerima / penanggung jawab wajib diisi.');
      return;
    }
    if (!parafLink) {
      alert('Tanda tangan / paraf penerima wajib diisi.');
      return;
    }

    try {
      const res = db.createBarangKeluar({
        TANGGAL: tanggal,
        PENERIMA: penerimaNama,
        PENERIMA_NIP: penerimaNip,
        UNIT_RUANGAN: unitRuangan,
        TUJUAN_PENGGUNAAN: tujuanPenggunaan,
        KETERANGAN: keterangan,
        FOTO_LINK: fotoLink,
        PARAF_LINK: parafLink,
        ITEMS: cart.map((c) => ({
          KODE_BARANG: c.KODE_BARANG,
          NAMA_BARANG: c.NAMA_BARANG,
          JUMLAH: c.JUMLAH,
          JENIS_SATUAN: c.JENIS_SATUAN,
        })),
      });

      alert(`Transaksi Barang Keluar berhasil disimpan dengan No. Dokumen: ${res.docNo}`);
      setCart([]);
      setFotoLink('');
      setParafLink('');
      setTujuanPenggunaan('');
      setKeterangan('');
      refreshData();
      setActiveTab('history');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleApprove = (docNo: string) => {
    const note = prompt('Catatan persetujuan (opsional):', 'Disetujui');
    if (note !== null) {
      db.approveBarangKeluar(docNo, note);
      refreshData();
      alert(`Dokumen ${docNo} telah disetujui.`);
    }
  };

  const handleReject = (docNo: string) => {
    const note = prompt('Alasan penolakan (wajib):', '');
    if (note) {
      db.rejectBarangKeluar(docNo, note);
      refreshData();
      alert(`Dokumen ${docNo} ditolak.`);
    }
  };

  const handlePrintBA = (docNo: string) => {
    const itemsOfDoc = list.filter((b) => b.NOMOR_DOKUMEN === docNo);
    if (itemsOfDoc.length === 0) return;
    const first = itemsOfDoc[0];

    pdfService.generateBeritaAcara({
      title: 'BERITA ACARA SERAH TERIMA PENGELUARAN BARANG',
      docNo: first.NOMOR_DOKUMEN,
      description: `Pada hari ini, ${first.TANGGAL}, telah diserahterimakan sejumlah barang persediaan sekolah kepada ${first.PENERIMA} (${first.UNIT_RUANGAN}) untuk keperluan ${first.TUJUAN_PENGGUNAAN}.`,
      tableHeaders: ['No', 'Kode Barang', 'Nama Barang', 'Banyaknya', 'Satuan', 'Keterangan'],
      tableRows: itemsOfDoc.map((itm, i) => [
        i + 1,
        itm.KODE_BARANG,
        itm.NAMA_BARANG,
        itm.JUMLAH,
        itm.JENIS_SATUAN,
        itm.KETERANGAN || '-',
      ]),
      footerText:
        'Barang tersebut telah diterima dalam keadaan baik dan menjadi tanggung jawab penerima dalam pemanfaatannya sesuai tata tertib sekolah.',
      rightSigner: {
        title: 'Yang Menerima,',
        name: first.PENERIMA,
        nip: first.PENERIMA_NIP || '',
      },
    });
  };

  const { pendingApprovals, groupedPending, filteredHistory } = useMemo(() => {
    const pending = list.filter((b) => b.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN');
    const grouped: Record<string, BarangKeluar[]> = {};
    pending.forEach((b) => {
      grouped[b.NOMOR_DOKUMEN] = grouped[b.NOMOR_DOKUMEN] || [];
      grouped[b.NOMOR_DOKUMEN].push(b);
    });

    const filtered = list.filter(
      (b) =>
        !search ||
        b.NOMOR_DOKUMEN.toLowerCase().includes(search.toLowerCase()) ||
        b.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
        b.PENERIMA.toLowerCase().includes(search.toLowerCase()) ||
        b.UNIT_RUANGAN.toLowerCase().includes(search.toLowerCase())
    );

    return { pendingApprovals: pending, groupedPending: grouped, filteredHistory: filtered };
  }, [list, search]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowUpRight size={19} className="text-amber-600" />
            Distribusi & Barang Keluar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengeluaran barang dengan kontrol stok, verifikasi penerima, tanda tangan digital, dan Berita Acara.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'form' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Form Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'approval' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Antrean Approval
            {Object.keys(groupedPending).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                {Object.keys(groupedPending).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Riwayat Dokumen
          </button>
        </div>
      </div>

      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Item Selection & Live Stock Guard */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">1. Pilih Barang yang Akan Dikeluarkan</h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <SearchableItemPicker
                  selectedItemCode={selectedItemCode}
                  onSelectItem={(itm) => setSelectedItemCode(itm ? itm.KODE_BARANG : '')}
                  requireStock={true}
                  label="Pilih Barang dari Persediaan (Stok Aktif)"
                  placeholder="Ketik nama atau kode barang..."
                  id="barang-keluar-item-picker"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah</label>
                <input
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-emerald-700 text-center shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <Plus size={15} /> Tambahkan
                </button>
              </div>
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3 text-center">Stok Gudang</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Dikeluarkan</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length > 0 ? (
                    cart.map((c) => (
                      <tr key={c.KODE_BARANG} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{c.KODE_BARANG}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.NAMA_BARANG}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {c.STOK_SAAT_INI} {c.JENIS_SATUAN}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                            {c.JUMLAH} {c.JENIS_SATUAN}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(c.KODE_BARANG)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Belum ada barang di dalam keranjang pengeluaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Recipient Details & Usage */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">2. Data Penerima & Tujuan Penggunaan</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Keluar</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
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
                  label="Pilih Pegawai / Guru Penerima (SD Negeri Tangerang 6)"
                  placeholder="Ketik untuk mencari nama guru, NIP, atau jabatan..."
                  id="barang-keluar-employee-picker"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Penerima
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap penerima"
                  value={penerimaNama}
                  onChange={(e) => setPenerimaNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Penerima
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19870921 201001 2 005"
                  value={penerimaNip}
                  onChange={(e) => setPenerimaNip(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono text-emerald-900 font-semibold focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Ruangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ruang Guru Kelas 4 / Lab Komputer"
                  value={unitRuangan}
                  onChange={(e) => setUnitRuangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tujuan Penggunaan</label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Digunakan untuk asesmen diagnostik dan cetak soal ujian semester"
                value={tujuanPenggunaan}
                onChange={(e) => setTujuanPenggunaan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>
          </div>

          {/* 3. Evidence: Signature Pad & Photo Capture */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">3. Verifikasi: Tanda Tangan & Foto Bukti</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <SignaturePad
                  onSave={(dataUrl) => setParafLink(dataUrl)}
                  initialValue={parafLink}
                  label="Tanda Tangan / Paraf Penerima (Wajib)"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Foto Bukti Penyerahan Fisik</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[144px]">
                  {fotoLink ? (
                    <div className="relative w-full h-32 flex items-center justify-center">
                      <img
                        src={fotoLink}
                        alt="Bukti"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoLink('')}
                        className="absolute right-1 top-1 px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 shadow-2xs"
                      >
                        <Camera size={15} /> Ambil dari Kamera
                      </button>

                      <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer">
                        <Upload size={15} /> Unggah Foto Berkas
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={cart.length === 0}
              className="px-8 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Check size={16} /> Simpan & Ajukan Pengeluaran Barang
            </button>
          </div>
        </form>
      )}

      {activeTab === 'approval' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Antrean Persetujuan Barang Keluar</h3>
              <p className="text-xs text-slate-500">
                Persetujuan pengeluaran barang oleh Kepala Sekolah atau Pengelola Barang.
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
              {Object.keys(groupedPending).length} Dokumen Menunggu
            </span>
          </div>

          <div className="space-y-4">
            {Object.keys(groupedPending).length > 0 ? (
              Object.keys(groupedPending).map((docNo) => {
                const docItems = groupedPending[docNo];
                const first = docItems[0];
                return (
                  <div
                    key={docNo}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono text-slate-800">{docNo}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                            Menunggu Persetujuan
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Pemohon: <span className="font-bold text-slate-800">{first.PENERIMA}</span> (
                          {first.UNIT_RUANGAN}) • Tgl: {first.TANGGAL}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(docNo)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <CheckCircle2 size={14} /> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(docNo)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-800">Daftar Barang Dimohon:</div>
                      <div className="flex flex-wrap gap-2">
                        {docItems.map((itm) => (
                          <span
                            key={itm.ID}
                            className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-slate-800 text-[11px] font-medium shadow-2xs"
                          >
                            {itm.NAMA_BARANG}: <strong className="text-emerald-900">{itm.JUMLAH} {itm.JENIS_SATUAN}</strong>
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Tujuan: {first.TUJUAN_PENGGUNAAN}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <p>Tidak ada dokumen barang keluar yang menunggu persetujuan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari riwayat dokumen pengeluaran berdasarkan nomor, penerima, atau barang..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No. Dokumen</th>
                    <th className="py-3 px-4">Barang</th>
                    <th className="py-3 px-4 text-center">Jumlah</th>
                    <th className="py-3 px-4">Penerima & Ruangan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Berita Acara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.ID} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-600">{item.TANGGAL}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.NOMOR_DOKUMEN}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.NAMA_BARANG}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                            {item.JUMLAH} {item.JENIS_SATUAN}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.PENERIMA}</div>
                          <div className="text-[10px] text-slate-500">{item.UNIT_RUANGAN}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              item.STATUS_TRANSAKSI === 'DISETUJUI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.STATUS_TRANSAKSI === 'DITOLAK'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.STATUS_TRANSAKSI}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.STATUS_TRANSAKSI === 'DISETUJUI' ? (
                            <button
                              type="button"
                              onClick={() => handlePrintBA(item.NOMOR_DOKUMEN)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors inline-flex items-center gap-1"
                            >
                              <FileCheck size={13} /> Cetak BA
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat pengeluaran barang.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setFotoLink(dataUrl)}
        title="Foto Bukti Penyerahan Barang Fisik"
      />
    </div>
  );
};
