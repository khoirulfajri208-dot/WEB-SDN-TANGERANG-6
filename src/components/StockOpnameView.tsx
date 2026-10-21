import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { StockOpname, Item } from '../types';
import { pdfService } from '../services/pdfService';

export const StockOpnameView: React.FC = () => {
  const [opnameList, setOpnameList] = useState<StockOpname[]>(db.getStockOpname());
  const [isNewOpnameOpen, setIsNewOpnameOpen] = useState(false);
  const [search, setSearch] = useState('');

  const items = db.getItems();
  const stockMap = db.getStockMap();

  // Opname session form state
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [petugas, setPetugas] = useState(db.getActiveUser().NAMA);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [lokasiFilter, setLokasiFilter] = useState('ALL');
  const [opnameFilterOnlyDiff, setOpnameFilterOnlyDiff] = useState(false);
  const [opnameSearch, setOpnameSearch] = useState('');

  const refreshData = () => {
    setOpnameList(db.getStockOpname());
  };

  const handleStartOpname = () => {
    // initialize counts with current system stock
    const initialCounts: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};
    items.forEach((item) => {
      initialCounts[item.KODE_BARANG] = stockMap[item.KODE_BARANG] || 0;
      initialNotes[item.KODE_BARANG] = 'Fisik cocok sesuai catatan buku persediaan';
    });
    setCounts(initialCounts);
    setNotes(initialNotes);
    setIsNewOpnameOpen(true);
  };

  const handleSaveOpname = (e: React.FormEvent) => {
    e.preventDefault();
    const opnameItems = items.map((item) => {
      const sistemQty = stockMap[item.KODE_BARANG] || 0;
      const fisikQty = counts[item.KODE_BARANG] ?? sistemQty;
      const selisih = fisikQty - sistemQty;
      return {
        KODE_BARANG: item.KODE_BARANG,
        NAMA_BARANG: item.NAMA_BARANG,
        STOK_SISTEM: sistemQty,
        STOK_FISIK: fisikQty,
        SELISIH: selisih,
        JENIS_SATUAN: item.JENIS_SATUAN,
        KETERANGAN: notes[item.KODE_BARANG] || '',
      };
    });

    try {
      const docNo = db.createStockOpname({
        TANGGAL: tanggal,
        PETUGAS: petugas,
        ITEMS: opnameItems,
      });

      alert(`Stock Opname berhasil disimpan dan direkonsiliasi dengan No: ${docNo}`);
      setIsNewOpnameOpen(false);
      refreshData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handlePrintBAOpname = (docNo: string) => {
    const listForDoc = opnameList.filter((o) => o.NOMOR_OPNAME === docNo);
    if (listForDoc.length === 0) return;
    const first = listForDoc[0];

    pdfService.generateBeritaAcara({
      title: 'BERITA ACARA HASIL STOCK OPNAME PERSEDIAAN',
      docNo: first.NOMOR_OPNAME,
      description: `Pada hari ini, ${first.TANGGAL}, telah dilaksanakan pemeriksaan dan perhitungan fisik (Stock Opname) persediaan barang habis pakai sekolah oleh Tim Pemeriksa Barang (${first.PETUGAS}).`,
      tableHeaders: ['No', 'Kode Barang', 'Nama Barang', 'Stok Sistem', 'Stok Fisik', 'Selisih', 'Keterangan'],
      tableRows: listForDoc.map((o, idx) => [
        idx + 1,
        o.KODE_BARANG,
        o.NAMA_BARANG,
        `${o.STOK_SISTEM} ${o.JENIS_SATUAN}`,
        `${o.STOK_FISIK} ${o.JENIS_SATUAN}`,
        o.SELISIH !== 0 ? (o.SELISIH > 0 ? `+${o.SELISIH}` : o.SELISIH) : '0 (Sesuai)',
        o.KETERANGAN || '-',
      ]),
      footerText:
        'Seluruh hasil perhitungan fisik di atas telah dicocokkan bersama dan saldo buku persediaan disesuaikan sebagaimana mestinya.',
      rightSigner: {
        title: 'Petugas / Tim Opname,',
        name: first.PETUGAS,
        nip: '',
      },
    });
  };

  // Group history by NOMOR_OPNAME
  const groupedHistory: Record<string, StockOpname[]> = {};
  opnameList.forEach((o) => {
    groupedHistory[o.NOMOR_OPNAME] = groupedHistory[o.NOMOR_OPNAME] || [];
    groupedHistory[o.NOMOR_OPNAME].push(o);
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <QrCode size={19} className="text-emerald-800" />
            Stock Opname & Verifikasi Fisik Gudang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencocokan kuantitas persediaan sistem dengan stok riil di gudang / lemari dan auto-rekonsiliasi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartOpname}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus size={16} /> Mulai Sesi Stock Opname Baru
        </button>
      </div>

      {/* New Opname Form */}
      {isNewOpnameOpen && (
        <form
          onSubmit={handleSaveOpname}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-800/30 shadow-md space-y-4 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Lembar Kerja Stock Opname Fisik</h3>
              <p className="text-xs text-slate-500">
                Ketik jumlah fisik riil yang ditemukan di lemari / rak. Sistem akan menghitung selisih otomatis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Tanggal Opname:</span>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              />
            </div>
          </div>

          {/* Opname Filter and Helpers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Cari barang di lembar opname..."
                value={opnameSearch}
                onChange={(e) => setOpnameSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-emerald-700 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOpnameFilterOnlyDiff(!opnameFilterOnlyDiff)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  opnameFilterOnlyDiff
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opnameFilterOnlyDiff ? 'Tampilkan Semua Barang' : 'Hanya Yang Ada Selisih'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const resetCounts: Record<string, number> = {};
                  const resetNotes: Record<string, string> = {};
                  items.forEach((item) => {
                    resetCounts[item.KODE_BARANG] = stockMap[item.KODE_BARANG] || 0;
                    resetNotes[item.KODE_BARANG] = 'Fisik cocok sesuai catatan buku persediaan';
                  });
                  setCounts(resetCounts);
                  setNotes(resetNotes);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
              >
                Setel Ulang Sesuai Sistem
              </button>
            </div>
          </div>

          {/* Opname Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                  <th className="py-2.5 px-3 text-center w-28">Stok Fisik (Riil)</th>
                  <th className="py-2.5 px-3 text-center">Selisih</th>
                  <th className="py-2.5 px-3">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items
                  .filter((item) => {
                    const sysQty = stockMap[item.KODE_BARANG] || 0;
                    const physQty = counts[item.KODE_BARANG] ?? sysQty;
                    const diff = physQty - sysQty;

                    if (opnameFilterOnlyDiff && diff === 0) return false;
                    if (
                      opnameSearch &&
                      !item.NAMA_BARANG.toLowerCase().includes(opnameSearch.toLowerCase()) &&
                      !item.KODE_BARANG.toLowerCase().includes(opnameSearch.toLowerCase())
                    ) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => {
                    const sysQty = stockMap[item.KODE_BARANG] || 0;
                    const physQty = counts[item.KODE_BARANG] ?? sysQty;
                    const diff = physQty - sysQty;

                    return (
                      <tr key={item.ID} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.KODE_BARANG}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.NAMA_BARANG}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          {sysQty} {item.JENIS_SATUAN}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            value={physQty}
                            onChange={(e) =>
                              setCounts({
                                ...counts,
                                [item.KODE_BARANG]: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 font-black text-center focus:outline-emerald-700 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              diff === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : diff < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {diff !== 0 ? (diff > 0 ? `+${diff}` : diff) : 'Cocok'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={notes[item.KODE_BARANG] || ''}
                            onChange={(e) =>
                              setNotes({ ...notes, [item.KODE_BARANG]: e.target.value })
                            }
                            placeholder="Catatan kondisi fisik / selisih..."
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-emerald-700"
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewOpnameOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Simpan Hasil Opname & Rekonsiliasi
            </button>
          </div>
        </form>
      )}

      {/* History Opnames */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Riwayat Berita Acara Stock Opname</h3>

        <div className="space-y-3">
          {Object.keys(groupedHistory).length > 0 ? (
            Object.keys(groupedHistory).map((docNo) => {
              const itemsOfDoc = groupedHistory[docNo];
              const first = itemsOfDoc[0];
              const totalDiscrepancies = itemsOfDoc.filter((o) => o.SELISIH !== 0).length;

              return (
                <div
                  key={docNo}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs">{docNo}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          totalDiscrepancies > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {totalDiscrepancies > 0
                          ? `${totalDiscrepancies} Item Selisih`
                          : '100% Cocok'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Tanggal: <strong className="text-slate-700">{first.TANGGAL}</strong> • Petugas:{' '}
                      <strong className="text-slate-700">{first.PETUGAS}</strong> • Total{' '}
                      {itemsOfDoc.length} jenis barang diperiksa.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePrintBAOpname(docNo)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FileCheck size={14} /> Cetak BA Opname (PDF)
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada riwayat stock opname yang tersimpan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
