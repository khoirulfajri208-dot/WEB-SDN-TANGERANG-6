import React, { useState } from 'react';
import { Wrench, Trash2, Plus, Search, Check, FileCheck } from 'lucide-react';
import { db } from '../services/localStorageService';
import { PemeliharaanAset, PenghapusanAset, Asset } from '../types';
import { pdfService } from '../services/pdfService';

export const PemeliharaanPenghapusanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pemeliharaan' | 'penghapusan'>('pemeliharaan');
  const [maintenances, setMaintenances] = useState<PemeliharaanAset[]>(db.getPemeliharaanAset());
  const [disposals, setDisposals] = useState<PenghapusanAset[]>(db.getPenghapusanAset());
  const [isAddingMaint, setIsAddingMaint] = useState(false);
  const [isAddingDisp, setIsAddingDisp] = useState(false);

  const assets = db.getAssets();

  // Form State for Maintenance
  const [maintAssetId, setMaintAssetId] = useState('');
  const [maintTanggal, setMaintTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [maintJenis, setMaintJenis] = useState<'RUTIN' | 'PERBAIKAN' | 'PENGGANTIAN_SPAREPART'>('PERBAIKAN');
  const [maintKerusakan, setMaintKerusakan] = useState('');
  const [maintBiaya, setMaintBiaya] = useState<number>(0);
  const [maintBengkel, setMaintBengkel] = useState('');
  const [maintKondisi, setMaintKondisi] = useState<'BAIK' | 'RUSAK RINGAN' | 'RUSAK BERAT'>('BAIK');

  // Form State for Disposal
  const [dispAssetId, setDispAssetId] = useState('');
  const [dispTanggal, setDispTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [dispAlasan, setDispAlasan] = useState('');
  const [dispMetode, setDispMetode] = useState<'LELANG' | 'HIBAH' | 'PEMUSNAHAN'>('PEMUSNAHAN');

  const refreshData = () => {
    setMaintenances(db.getPemeliharaanAset());
    setDisposals(db.getPenghapusanAset());
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const ast = assets.find((a) => a.ID === maintAssetId);
    if (!ast) {
      alert('Pilih aset yang diperbaiki.');
      return;
    }

    db.createPemeliharaanAset({
      TANGGAL: maintTanggal,
      ASET_ID: ast.ID,
      KODE_ASET: ast.KODE_ASET,
      NAMA_BARANG: ast.NAMA_BARANG,
      JENIS_PEMELIHARAAN: maintJenis,
      URAIAN_KERUSAKAN: maintKerusakan,
      BIAYA: maintBiaya,
      BENGKEL_PELAKSANA: maintBengkel,
      KONDISI_SETELAH: maintKondisi,
    });

    alert('Catatan pemeliharaan aset berhasil disimpan dan kondisi aset diperbarui.');
    setIsAddingMaint(false);
    setMaintKerusakan('');
    setMaintBiaya(0);
    setMaintBengkel('');
    refreshData();
  };

  const handleSaveDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    const ast = assets.find((a) => a.ID === dispAssetId);
    if (!ast) {
      alert('Pilih aset yang akan dihapus.');
      return;
    }

    const docNo = db.createPenghapusanAset({
      TANGGAL: dispTanggal,
      ASET_ID: ast.ID,
      KODE_ASET: ast.KODE_ASET,
      NAMA_BARANG: ast.NAMA_BARANG,
      ALASAN_PENGHAPUSAN: dispAlasan,
      METODE: dispMetode,
    });

    alert(`Usulan penghapusan aset berhasil dicatat dengan Berita Acara: ${docNo}`);
    setIsAddingDisp(false);
    setDispAlasan('');
    refreshData();
  };

  const handlePrintBAPenghapusan = (disp: PenghapusanAset) => {
    pdfService.generateBeritaAcara({
      title: 'BERITA ACARA USULAN PENGHAPUSAN DAN PEMUSNAHAN BARANG',
      docNo: disp.NOMOR_BA_PENGHAPUSAN,
      description: `Pada hari ini, ${disp.TANGGAL}, Panitia Penghapusan Barang Milik Sekolah telah melakukan pemeriksaan fisik terhadap aset yang diusulkan untuk dihapus dari Buku Induk Inventaris:`,
      tableHeaders: ['No', 'Kode Aset', 'Nama Barang', 'Alasan Penghapusan', 'Metode Tindak Lanjut', 'Status'],
      tableRows: [
        [
          1,
          disp.KODE_ASET,
          disp.NAMA_BARANG,
          disp.ALASAN_PENGHAPUSAN,
          disp.METODE,
          disp.STATUS_PERSETUJUAN,
        ],
      ],
      footerText:
        'Aset di atas dinyatakan telah rusak berat/tidak ekonomis untuk diperbaiki dan disetujui untuk dihapuskan sesuai ketentuan peraturan perundang-undangan.',
      rightSigner: {
        title: 'Ketua Panitia / Pengurus Barang,',
        name: db.getConfig().TREASURER || 'Pengurus Barang',
        nip: '',
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench size={19} className="text-amber-600" />
            Pemeliharaan & Penghapusan Aset
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log servis berkala, pencatatan biaya reparasi, dan penatausahaan Berita Acara Usulan Penghapusan (Afkir).
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pemeliharaan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pemeliharaan'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Log Pemeliharaan & Servis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('penghapusan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'penghapusan'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Penghapusan & Afkir Aset
          </button>
        </div>
      </div>

      {activeTab === 'pemeliharaan' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddingMaint(!isAddingMaint)}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} /> {isAddingMaint ? 'Tutup Form' : 'Catat Pemeliharaan Aset'}
            </button>
          </div>

          {isAddingMaint && (
            <form
              onSubmit={handleSaveMaintenance}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-200 shadow-md space-y-4 animate-in fade-in"
            >
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                Formulir Catatan Pemeliharaan & Servis
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Servis</label>
                  <input
                    type="date"
                    required
                    value={maintTanggal}
                    onChange={(e) => setMaintTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Aset</label>
                  <select
                    required
                    value={maintAssetId}
                    onChange={(e) => setMaintAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-emerald-700"
                  >
                    <option value="">-- Pilih Aset --</option>
                    {assets.map((a) => (
                      <option key={a.ID} value={a.ID}>
                        {a.KODE_ASET} - {a.NAMA_BARANG}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Pemeliharaan</label>
                  <select
                    value={maintJenis}
                    onChange={(e) => setMaintJenis(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white font-medium"
                  >
                    <option value="RUTIN">Servis Rutin / Berkala</option>
                    <option value="PERBAIKAN">Perbaikan Kerusakan</option>
                    <option value="PENGGANTIAN_SPAREPART">Penggantian Suku Cadang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bengkel / Teknisi Pelaksana</label>
                  <input
                    type="text"
                    placeholder="Contoh: CV. Komputer Sentosa / Teknisi Sekolah"
                    value={maintBengkel}
                    onChange={(e) => setMaintBengkel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Servis (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={maintBiaya}
                      onChange={(e) => setMaintBiaya(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Setelah</label>
                    <select
                      value={maintKondisi}
                      onChange={(e) => setMaintKondisi(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white"
                    >
                      <option value="BAIK">Baik</option>
                      <option value="RUSAK RINGAN">Rusak Ringan</option>
                      <option value="RUSAK BERAT">Rusak Berat</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Uraian Kerusakan & Tindakan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan detail kerusakan dan komponen yang diperbaiki"
                  value={maintKerusakan}
                  onChange={(e) => setMaintKerusakan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMaint(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={15} /> Simpan Catatan Servis
                </button>
              </div>
            </form>
          )}

          {/* Maintenance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Aset</th>
                    <th className="py-3 px-4">Jenis Servis</th>
                    <th className="py-3 px-4">Uraian</th>
                    <th className="py-3 px-4 text-right">Biaya</th>
                    <th className="py-3 px-4">Teknisi / Bengkel</th>
                    <th className="py-3 px-4 text-center">Hasil Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {maintenances.length > 0 ? (
                    maintenances.map((m) => (
                      <tr key={m.ID} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-600">{m.TANGGAL}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{m.NAMA_BARANG}</div>
                          <div className="font-mono text-[10px] text-slate-500">{m.KODE_ASET}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {m.JENIS_PEMELIHARAAN}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{m.URAIAN_KERUSAKAN}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          Rp {m.BIAYA.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{m.BENGKEL_PELAKSANA || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              m.KONDISI_SETELAH === 'BAIK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {m.KONDISI_SETELAH}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada catatan pemeliharaan aset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'penghapusan' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddingDisp(!isAddingDisp)}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} /> {isAddingDisp ? 'Tutup Form' : 'Buat Usulan Penghapusan Aset'}
            </button>
          </div>

          {isAddingDisp && (
            <form
              onSubmit={handleSaveDisposal}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-rose-200 shadow-md space-y-4 animate-in fade-in"
            >
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                Formulir Usulan Penghapusan (Afkir) Barang Milik Sekolah
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Usulan</label>
                  <input
                    type="date"
                    required
                    value={dispTanggal}
                    onChange={(e) => setDispTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Aset yang Dihapus</label>
                  <select
                    required
                    value={dispAssetId}
                    onChange={(e) => setDispAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-emerald-700"
                  >
                    <option value="">-- Pilih Aset --</option>
                    {assets.map((a) => (
                      <option key={a.ID} value={a.ID}>
                        {a.KODE_ASET} - {a.NAMA_BARANG} (Kondisi: {a.KONDISI})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Penghapusan</label>
                  <select
                    value={dispMetode}
                    onChange={(e) => setDispMetode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700 bg-white font-medium"
                  >
                    <option value="PEMUSNAHAN">Pemusnahan Fisik</option>
                    <option value="LELANG">Lelang / Penjualan Terbuka</option>
                    <option value="HIBAH">Hibah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penghapusan & Pertimbangan Teknis
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Barang mengalami kerusakan total terbakar/patah komponen dan biaya perbaikan melebihi 70% harga beli"
                  value={dispAlasan}
                  onChange={(e) => setDispAlasan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDisp(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check size={15} /> Simpan Usulan & Terbitkan BA
                </button>
              </div>
            </form>
          )}

          {/* Disposal Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No. BA Penghapusan</th>
                    <th className="py-3 px-4">Aset</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Berita Acara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {disposals.length > 0 ? (
                    disposals.map((d) => (
                      <tr key={d.ID} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-600">{d.TANGGAL}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {d.NOMOR_BA_PENGHAPUSAN}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{d.NAMA_BARANG}</div>
                          <div className="font-mono text-[10px] text-slate-500">{d.KODE_ASET}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{d.ALASAN_PENGHAPUSAN}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {d.METODE}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            {d.STATUS_PERSETUJUAN}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintBAPenghapusan(d)}
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
                        Belum ada riwayat penghapusan aset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
