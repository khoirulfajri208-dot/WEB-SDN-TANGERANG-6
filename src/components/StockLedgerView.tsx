import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Download, Filter, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/localStorageService';
import { StockLedger, Item } from '../types';
import { pdfService } from '../services/pdfService';
import { excelService } from '../services/excelService';

export const StockLedgerView: React.FC = () => {
  const items = useMemo(() => db.getItems(), []);
  const [selectedSku, setSelectedSku] = useState<string>(items[0]?.KODE_BARANG || '');
  const [ledgers, setLedgers] = useState<StockLedger[]>(db.getStockLedger());

  const selectedItem = useMemo(() => {
    return items.find((i) => i.KODE_BARANG === selectedSku);
  }, [items, selectedSku]);

  const itemLedgers = useMemo(() => {
    return ledgers
      .filter((l) => l.KODE_BARANG === selectedSku)
      .sort((a, b) => new Date(a.TIMESTAMP).getTime() - new Date(b.TIMESTAMP).getTime());
  }, [ledgers, selectedSku]);

  const handleExportPDF = () => {

    if (!selectedItem) return;
    pdfService.generateKartuStok(selectedItem.KODE_BARANG);
  };

  const handleExportExcel = () => {
    const config = db.getConfig();
    const allStockLedgers = db.getStockLedger();
    const filtered = allStockLedgers.filter((l) => !selectedSku || l.KODE_BARANG === selectedSku);

    excelService.exportStockLedger(
      filtered,
      config,
      selectedItem ? `Kartu_Stok_${selectedItem.KODE_BARANG}` : 'Buku_Besar_Kartu_Stok'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen size={19} className="text-emerald-800" />
            Kartu Stok & Buku Mutasi Barang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat kronologis keluar-masuk barang per item dengan pencatatan nomor dokumen dan saldo berjalan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="Ekspor Kartu Stok ke format Excel"
          >
            <FileSpreadsheet size={15} /> Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={!selectedItem}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={15} /> Cetak Kartu Stok (PDF)
          </button>
        </div>
      </div>

      {/* SKU Selector Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Pilih Barang untuk Membuka Kartu Stok
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 focus:outline-emerald-700"
          >
            {items.map((i) => (
              <option key={i.ID} value={i.KODE_BARANG}>
                {i.KODE_BARANG} - {i.NAMA_BARANG} ({i.JENIS_SATUAN})
              </option>
            ))}
          </select>

          {selectedItem && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Kategori:</span>{' '}
                <strong className="text-slate-800">{selectedItem.KATEGORI}</strong>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500">Lokasi:</span>{' '}
                <strong className="text-slate-800">{selectedItem.LOKASI_DEFAULT}</strong>
              </div>
              <div className="font-black text-emerald-950 text-sm">
                Saldo: {itemLedgers[itemLedgers.length - 1]?.SALDO_SESUDAH ?? 0} {selectedItem.JENIS_SATUAN}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">No. Dokumen / Kwitansi</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4 text-center text-emerald-800">Masuk (In)</th>
                <th className="py-3 px-4 text-center text-amber-800">Keluar (Out)</th>
                <th className="py-3 px-4 text-center font-black text-slate-900">Saldo Akhir</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {itemLedgers.length > 0 ? (
                itemLedgers.map((l) => (
                  <tr key={l.LEDGER_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {l.TANGGAL} <span className="text-[10px] text-slate-400">({l.TIMESTAMP.slice(11, 16)})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {l.NOMOR_DOKUMEN || l.REF_ID}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          l.REF_TYPE === 'BARANG_MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.REF_TYPE === 'BARANG_KELUAR'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {l.REF_TYPE.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-bold">
                      {l.QTY_IN > 0 ? `+${l.QTY_IN} ${l.JENIS_SATUAN}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-800 font-bold">
                      {l.QTY_OUT > 0 ? `-${l.QTY_OUT} ${l.JENIS_SATUAN}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">
                      {l.SALDO_SESUDAH} {l.JENIS_SATUAN}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-semibold text-slate-500">{l.STATUS}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat mutasi untuk barang ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
