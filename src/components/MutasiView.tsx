import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Plus, Search, Check, FileCheck, ArrowRight } from 'lucide-react';
import { db } from '../services/localStorageService';
import { MutasiAset, Asset } from '../types';
import { pdfService } from '../services/pdfService';

export const MutasiView: React.FC = () => {
  const [mutations, setMutations] = useState<MutasiAset[]>(db.getMutasiAset());
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  const assets = db.getAssets();

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [lokasiBaru, setLokasiBaru] = useState('');
  const [pjBaru, setPjBaru] = useState('');
  const [alasanMutasi, setAlasanMutasi] = useState('');

  const selectedAsset = assets.find((a) => a.ID === selectedAssetId);

  const refreshData = () => {
    setMutations(db.getMutasiAset());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      alert('Pilih aset yang akan dimutasi.');
      return;
    }
    if (!lokasiBaru || !pjBaru) {
      alert('Lokasi baru dan Penanggung Jawab baru wajib diisi.');
      return;
    }

    try {
      const docNo = db.createMutasiAset({
        TANGGAL: tanggal,
        ASET_ID: selectedAsset.ID,
        KODE_ASET: selectedAsset.KODE_ASET,
        NAMA_BARANG: selectedAsset.NAMA_BARANG,
        LOKASI_LAMA: selectedAsset.LOKASI,
        LOKASI_BARU: lokasiBaru,
        PJ_LAMA: selectedAsset.PENANGGUNG_JAWAB,
        PJ_BARU: pjBaru,
        ALASAN_MUTASI: alasanMutasi,
      });

      alert(`Mutasi aset berhasil dicatat dengan Berita Acara: ${docNo}`);
      setIsAdding(false);
      setSelectedAssetId('');
      setLokasiBaru('');
      setPjBaru('');
      setAlasanMutasi('');
      refreshData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handlePrintBAMutasi = (m: MutasiAset) => {
    pdfService.generateBeritaAcara({
      title: 'BERITA ACARA MUTASI DAN PEMINDAHAN ASET',
      docNo: m.NOMOR_BA_MUTASI,
      description: `Pada hari ini, ${m.TANGGAL}, telah dilaksanakan pemindahan dan serah terima penguasaan aset tetap sekolah dengan rincian sebagai berikut:`,
      tableHeaders: ['No', 'Kode Aset', 'Nama Aset', 'Lokasi Asal', 'Lokasi Tujuan', 'Alasan Pemindahan'],
      tableRows: [
        [
          1,
          m.KODE_ASET,
          m.NAMA_BARANG,
          `${m.LOKASI_LAMA} (${m.PJ_LAMA})`,
          `${m.LOKASI_BARU} (${m.PJ_BARU})`,
          m.ALASAN_MUTASI,
        ],
      ],
      footerText:
        'Aset tersebut telah diperiksa fisik dan fungsinya, serta dicatat dalam mutasi buku induk inventaris sekolah.',
      leftSigner: {
        title: 'Penanggung Jawab Lama,',
        name: m.PJ_LAMA,
        nip: '',
      },
      rightSigner: {
        title: 'Penanggung Jawab Baru,',
        name: m.PJ_BARU,
        nip: '',
      },
    });
  };

  const filtered = useMemo(() => mutations.filter(
    (m) =>
      !search ||
      m.KODE_ASET.toLowerCase().includes(search.toLowerCase()) ||
      m.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      m.NOMOR_BA_MUTASI.toLowerCase().includes(search.toLowerCase()) ||
      m.PJ_BARU.toLowerCase().includes(search.toLowerCase())
  ), [mutations, search]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowRightLeft size={19} className="text-blue-700" />
            Mutasi & Pemindahan Lokasi Aset
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan pemindahan fisik aset antar ruangan atau pergantian guru penanggung jawab disertai Berita Acara.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus size={16} /> {isAdding ? 'Tutup Formulir' : 'Catat Mutasi Aset'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-blue-200 shadow-md space-y-4 animate-in fade-in"
        >
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Formulir Mutasi & Pemindahan Aset
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pemindahan</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Aset yang Dimutasi</label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-emerald-700"
              >
                <option value="">-- Pilih Aset --</option>
                {assets.map((a) => (
                  <option key={a.ID} value={a.ID}>
                    {a.KODE_ASET} - {a.NAMA_BARANG} (Saat ini di: {a.LOKASI})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedAsset && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-blue-900 font-bold">Posisi Saat Ini:</span> {selectedAsset.LOKASI} (PJ:{' '}
                {selectedAsset.PENANGGUNG_JAWAB})
              </div>
              <div className="text-blue-900 font-bold">Kondisi: {selectedAsset.KONDISI}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi / Ruangan Baru</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ruang Perpustakaan"
                value={lokasiBaru}
                onChange={(e) => setLokasiBaru(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penanggung Jawab (PJ) Baru
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Siti Rahmawati, S.Pd"
                value={pjBaru}
                onChange={(e) => setPjBaru(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Pemindahan / Mutasi</label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Penataan ulang ruang komputer dan penguatan fasilitas literasi digital perpustakaan"
              value={alasanMutasi}
              onChange={(e) => setAlasanMutasi(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check size={15} /> Simpan Mutasi & Update Aset
            </button>
          </div>
        </form>
      )}

      {/* History Table */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor BA mutasi, nama barang, kode aset, atau penanggung jawab..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">No. BA Mutasi</th>
                  <th className="py-3 px-4">Kode & Nama Aset</th>
                  <th className="py-3 px-4">Lokasi Asal</th>
                  <th className="py-3 px-4">Lokasi Tujuan</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4 text-center">Berita Acara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length > 0 ? (
                  filtered.map((m) => (
                    <tr key={m.ID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600">{m.TANGGAL}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.NOMOR_BA_MUTASI}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.NAMA_BARANG}</div>
                        <div className="font-mono text-[10px] text-slate-500">{m.KODE_ASET}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{m.LOKASI_LAMA}</div>
                        <div className="text-[10px] text-slate-400">PJ: {m.PJ_LAMA}</div>
                      </td>
                      <td className="py-3 px-4 text-emerald-950 font-semibold">
                        <div>{m.LOKASI_BARU}</div>
                        <div className="text-[10px] text-emerald-700">PJ: {m.PJ_BARU}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">{m.ALASAN_MUTASI}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintBAMutasi(m)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <FileCheck size={13} /> Cetak BA
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada riwayat mutasi aset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
