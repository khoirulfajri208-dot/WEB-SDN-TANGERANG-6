import React, { useState } from 'react';
import { RotateCw, Box, MapPin, User, Calendar, Wrench, ArrowRightLeft, Trash2 } from 'lucide-react';
import { db } from '../services/localStorageService';
import { Asset, MutasiAset, PemeliharaanAset, PenghapusanAset } from '../types';

export const AssetLifecycleView: React.FC = () => {
  const assets = db.getAssets();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.ID || '');

  const asset = assets.find((a) => a.ID === selectedAssetId);
  const mutations = db.getMutasiAset().filter((m) => m.ASET_ID === selectedAssetId);
  const maintenances = db.getPemeliharaanAset().filter((p) => p.ASET_ID === selectedAssetId);
  const disposals = db.getPenghapusanAset().filter((d) => d.ASET_ID === selectedAssetId);

  // Combine into a chronological lifecycle timeline
  interface TimelineEvent {
    id: string;
    date: string;
    type: 'ACQUISITION' | 'MUTATION' | 'MAINTENANCE' | 'DISPOSAL';
    title: string;
    description: string;
    badge: string;
    cost?: number;
  }

  const events: TimelineEvent[] = [];

  if (asset) {
    events.push({
      id: 'acq-' + asset.ID,
      date: asset.TANGGAL_BKU || '2026-01-01',
      type: 'ACQUISITION',
      title: 'Penerimaan & Registrasi Aset Baru',
      description: `Aset dibeli melalui ${(asset as any).SUMBER_DANA || asset.SUB_KEGIATAN || 'BOS Reguler'} dari ${asset.NAMA_TOKO || 'Penyedia Rekanan'} dengan nilai perolehan Rp ${asset.TOTAL_NILAI.toLocaleString('id-ID')}. Lokasi awal: ${asset.LOKASI}.`,
      badge: 'Registrasi',
    });

    mutations.forEach((m) => {
      events.push({
        id: m.ID,
        date: m.TANGGAL,
        type: 'MUTATION',
        title: `Mutasi Lokasi (${m.NOMOR_BA_MUTASI})`,
        description: `Dipindahkan dari [${m.LOKASI_LAMA} - PJ: ${m.PJ_LAMA}] ke [${m.LOKASI_BARU} - PJ: ${m.PJ_BARU}]. Alasan: ${m.ALASAN_MUTASI}`,
        badge: 'Mutasi',
      });
    });

    maintenances.forEach((p) => {
      events.push({
        id: p.ID,
        date: p.TANGGAL,
        type: 'MAINTENANCE',
        title: `Perawatan & Perbaikan (${p.JENIS_PEMELIHARAAN})`,
        description: `${p.URAIAN_KERUSAKAN}. Bengkel/Teknisi: ${p.BENGKEL_PELAKSANA || '-'}. Hasil: ${p.KONDISI_SETELAH}`,
        badge: 'Servis',
        cost: p.BIAYA,
      });
    });

    disposals.forEach((d) => {
      events.push({
        id: d.ID,
        date: d.TANGGAL,
        type: 'DISPOSAL',
        title: `Penghapusan / Usulan Afkir (${d.NOMOR_BA_PENGHAPUSAN})`,
        description: `Metode: ${d.METODE}. Alasan: ${d.ALASAN_PENGHAPUSAN}. Status: ${d.STATUS_PERSETUJUAN}`,
        badge: 'Penghapusan',
      });
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <RotateCw size={19} className="text-emerald-800" />
          Lifecycle & Riwayat Perjalanan Aset
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit jejak rekam aset terintegrasi: dari pengadaan, pemindahan ruangan, servis pemeliharaan hingga usulan penghapusan.
        </p>
      </div>

      {/* Asset Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Pilih Aset untuk Melihat Timeline
        </label>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 focus:outline-emerald-700"
        >
          {assets.map((a) => (
            <option key={a.ID} value={a.ID}>
              {a.KODE_ASET} - {a.NAMA_BARANG} ({a.LOKASI} • PJ: {a.PENANGGUNG_JAWAB})
            </option>
          ))}
        </select>

        {asset && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Lokasi Sekarang</span>
              <div className="font-bold text-slate-800 truncate mt-0.5">{asset.LOKASI}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Penanggung Jawab</span>
              <div className="font-bold text-slate-800 truncate mt-0.5">{asset.PENANGGUNG_JAWAB}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Kondisi Fisik</span>
              <div className="font-bold text-slate-800 truncate mt-0.5">{asset.KONDISI}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Nilai Perolehan</span>
              <div className="font-bold text-emerald-900 truncate mt-0.5">
                Rp {asset.TOTAL_NILAI.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
          Kronologis Perjalanan & Catatan Log
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
          {events.map((evt) => {
            return (
              <div key={evt.id} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    evt.type === 'ACQUISITION'
                      ? 'bg-emerald-600'
                      : evt.type === 'MUTATION'
                      ? 'bg-blue-600'
                      : evt.type === 'MAINTENANCE'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                />

                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          evt.type === 'ACQUISITION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : evt.type === 'MUTATION'
                            ? 'bg-blue-100 text-blue-800'
                            : evt.type === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evt.badge}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800">{evt.title}</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{evt.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                  {evt.cost !== undefined && evt.cost > 0 && (
                    <div className="text-xs font-bold text-amber-900 pt-1">
                      Biaya Perbaikan: Rp {evt.cost.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
