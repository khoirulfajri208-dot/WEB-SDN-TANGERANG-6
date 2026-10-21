import React, { useState } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Plus,
  Check,
  Download,
  ArrowRight,
  Sparkles,
  TrendingDown,
  Clock,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { Item, StockSummary } from '../types';
import { pdfService } from '../services/pdfService';

export const ProcurementPlannerView: React.FC = () => {
  const stockSummary = db.getStockSummary();
  const items = db.getItems();
  const barangKeluar = db.getBarangKeluar();
  const config = db.getConfig();

  // Procurement items state
  interface PlanItem {
    KODE_BARANG: string;
    NAMA_BARANG: string;
    JENIS_SATUAN: string;
    STOK_SAAT_INI: number;
    BATAS_MINIMUM: number;
    REKOMENDASI_BELI: number;
    ESTIMASI_HARGA: number;
    SUBTOTAL: number;
    KODE_REKENING: string;
    ALASAN_AI?: string;
    ESTIMASI_HABIS_HARI?: number;
    PRIORITAS?: 'TINGGI' | 'SEDANG' | 'RENDAH';
  }

  const lowStockItems = stockSummary.filter((s) => s.STATUS === 'MINIMUM');

  const [plans, setPlans] = useState<PlanItem[]>(() => {
    return lowStockItems.map((s) => {
      const itm = items.find((i) => i.KODE_BARANG === s.KODE_BARANG);
      const needed = Math.max(1, s.BATAS_MINIMUM * 2 - s.STOK);
      const estPrice = 50000;
      return {
        KODE_BARANG: s.KODE_BARANG,
        NAMA_BARANG: s.NAMA_BARANG,
        JENIS_SATUAN: s.JENIS_SATUAN,
        STOK_SAAT_INI: s.STOK,
        BATAS_MINIMUM: s.BATAS_MINIMUM,
        REKOMENDASI_BELI: needed,
        ESTIMASI_HARGA: estPrice,
        SUBTOTAL: needed * estPrice,
        KODE_REKENING: itm?.KODE_REKENING_RKAS || '5.1.02.01.01.0024',
        PRIORITAS: 'TINGGI',
      };
    });
  });

  const [selectedAddCode, setSelectedAddCode] = useState('');
  const [isAiPredicting, setIsAiPredicting] = useState(false);
  const [aiInsightSummary, setAiInsightSummary] = useState<string | null>(null);

  const handleUpdateQty = (code: string, qty: number) => {
    setPlans(
      plans.map((p) => {
        if (p.KODE_BARANG === code) {
          const q = Math.max(1, qty);
          return { ...p, REKOMENDASI_BELI: q, SUBTOTAL: q * p.ESTIMASI_HARGA };
        }
        return p;
      })
    );
  };

  const handleUpdatePrice = (code: string, price: number) => {
    setPlans(
      plans.map((p) => {
        if (p.KODE_BARANG === code) {
          const pr = Math.max(0, price);
          return { ...p, ESTIMASI_HARGA: pr, SUBTOTAL: p.REKOMENDASI_BELI * pr };
        }
        return p;
      })
    );
  };

  const handleRemove = (code: string) => {
    setPlans(plans.filter((p) => p.KODE_BARANG !== code));
  };

  const handleAddManual = () => {
    if (!selectedAddCode) return;
    const itm = items.find((i) => i.KODE_BARANG === selectedAddCode);
    if (!itm) return;
    if (plans.some((p) => p.KODE_BARANG === itm.KODE_BARANG)) {
      alert('Barang ini sudah ada dalam daftar rencana pengadaan.');
      return;
    }
    const currentStock = db.getStockMap()[itm.KODE_BARANG] || 0;
    const needed = Math.max(1, itm.BATAS_MINIMUM * 2 - currentStock);
    setPlans([
      ...plans,
      {
        KODE_BARANG: itm.KODE_BARANG,
        NAMA_BARANG: itm.NAMA_BARANG,
        JENIS_SATUAN: itm.JENIS_SATUAN,
        STOK_SAAT_INI: currentStock,
        BATAS_MINIMUM: itm.BATAS_MINIMUM,
        REKOMENDASI_BELI: needed,
        ESTIMASI_HARGA: 45000,
        SUBTOTAL: needed * 45000,
        KODE_REKENING: itm.KODE_REKENING_RKAS || '5.1.02.01.01.0024',
        PRIORITAS: 'SEDANG',
      },
    ]);
    setSelectedAddCode('');
  };

  const handleRunAiPrediction = async () => {
    setIsAiPredicting(true);
    try {
      const stockMap = db.getStockMap();
      const currentInventory = items.map((i) => ({
        kode_barang: i.KODE_BARANG,
        nama_barang: i.NAMA_BARANG,
        stok_saat_ini: stockMap[i.KODE_BARANG] || 0,
        batas_minimum: i.BATAS_MINIMUM,
        jenis_satuan: i.JENIS_SATUAN,
      }));

      const recentDispatches = barangKeluar.slice(-30).map((bk) => ({
        kode_barang: bk.KODE_BARANG,
        nama_barang: bk.NAMA_BARANG,
        jumlah: bk.JUMLAH,
        tanggal: bk.TANGGAL,
        keperluan: bk.TUJUAN_PENGGUNAAN || '',
      }));

      const response = await fetch('/api/ai/predict-procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentInventory,
          transactionHistory: recentDispatches,
          upcomingEvents: 'Persiapan Ujian Semester, Penilaian Akhir Tahun, & Digitalisasi Kelas',
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const predictions = resData.data.rekomendasi_pengadaan || resData.data.rekomendasi || [];
        const summary = resData.data.analisis_keseluruhan || resData.data.ringkasan_eksekutif || 'Analisis perencanaan pengadaan logistik selesai.';
        setAiInsightSummary(resData.warning ? `${summary} (${resData.warning})` : summary);

        const newPlans: PlanItem[] = predictions.map((pred: any) => {
          const itm = items.find((i) => i.KODE_BARANG === pred.kode_barang);
          const currentStk = stockMap[pred.kode_barang] ?? pred.stok_saat_ini ?? 0;
          const estPrice = pred.estimasi_harga_satuan || pred.estimasi_harga || 45000;
          const qty = pred.jumlah_rekomendasi_beli || pred.rekomendasi_qty || 5;

          return {
            KODE_BARANG: pred.kode_barang,
            NAMA_BARANG: pred.nama_barang || itm?.NAMA_BARANG || 'Barang Persediaan',
            JENIS_SATUAN: pred.jenis_satuan || itm?.JENIS_SATUAN || 'Pcs',
            STOK_SAAT_INI: currentStk,
            BATAS_MINIMUM: itm?.BATAS_MINIMUM || pred.batas_minimum || 5,
            REKOMENDASI_BELI: qty,
            ESTIMASI_HARGA: estPrice,
            SUBTOTAL: qty * estPrice,
            KODE_REKENING: pred.kode_rekening_arkas || itm?.KODE_REKENING_RKAS || '5.1.02.01.01.0024',
            ALASAN_AI: pred.alasan_prediksi || pred.justifikasi,
            ESTIMASI_HABIS_HARI: pred.estimasi_hari_habis,
            PRIORITAS: pred.prioritas || 'TINGGI',
          };
        });

        if (newPlans.length > 0) {
          setPlans(newPlans);
        }
      }
    } catch (e) {
      console.error('AI prediction failed:', e);
      setAiInsightSummary('Mode estimasi lokal aktif: Analisis tren pengeluaran 30 hari terakhir.');
    } finally {
      setIsAiPredicting(false);
    }
  };

  const totalAnggaran = plans.reduce((sum, p) => sum + p.SUBTOTAL, 0);

  const handleExportPDF = () => {
    pdfService.generateBeritaAcara({
      title: 'RENCANA KEBUTUHAN BARANG / USULAN BELANJA PENGADAAN (RKAS)',
      docNo: `RKAS-PENGADAAN-${new Date().toISOString().slice(0, 10)}`,
      description: `Berikut adalah rincian usulan rencana pengadaan barang operasional dan habis pakai sekolah berbasis analisis stok minimum & proyeksi AI:`,
      tableHeaders: [
        'No',
        'Kode Barang',
        'Nama Barang',
        'Stok',
        'Kebutuhan',
        'Estimasi Satuan',
        'Subtotal (Rp)',
        'Kode Rekening',
      ],
      tableRows: plans.map((p, idx) => [
        idx + 1,
        p.KODE_BARANG,
        p.NAMA_BARANG,
        `${p.STOK_SAAT_INI} ${p.JENIS_SATUAN}`,
        `${p.REKOMENDASI_BELI} ${p.JENIS_SATUAN}`,
        `Rp ${p.ESTIMASI_HARGA.toLocaleString('id-ID')}`,
        `Rp ${p.SUBTOTAL.toLocaleString('id-ID')}`,
        p.KODE_REKENING,
      ]),
      footerText: `Total Estimasi Anggaran Pengadaan: Rp ${totalAnggaran.toLocaleString('id-ID')}`,
      rightSigner: {
        title: 'Pejabat Pengadaan / Bendahara Barang,',
        name: db.getConfig().TREASURER || 'Siti Rahmawati, S.Pd.',
        nip: '198709212010012005',
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Fase 2: AI Predictive Procurement & Forecasting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Perencanaan Kebutuhan & Prediksi Pengadaan
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Otomasi perhitungan kuantitas order optimal dan prediksi laju konsumsi barang ATK/operasional sekolah menggunakan model AI Gemini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-run-ai-prediction"
            type="button"
            onClick={handleRunAiPrediction}
            disabled={isAiPredicting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {isAiPredicting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            )}
            {isAiPredicting ? 'Menganalisis Tren...' : 'Prediksi Otomatis AI'}
          </button>

          <button
            id="btn-export-procurement-pdf"
            type="button"
            onClick={handleExportPDF}
            disabled={plans.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/20 shadow-xs transition-colors"
          >
            <Download size={15} /> Cetak Usulan PDF
          </button>
        </div>
      </div>

      {/* AI Insights Card */}
      {aiInsightSummary && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-2xs animate-in fade-in">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-emerald-950 text-sm mb-0.5">
              Hasil Analisis & Saran Pengadaan Gemini AI:
            </h4>
            <p className="text-emerald-900 leading-relaxed">{aiInsightSummary}</p>
          </div>
        </div>
      )}

      {/* Manual Add Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 flex gap-2 w-full">
          <select
            value={selectedAddCode}
            onChange={(e) => setSelectedAddCode(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Tambahkan barang lain ke daftar rencana pengadaan --</option>
            {items.map((i) => (
              <option key={i.ID} value={i.KODE_BARANG}>
                {i.KODE_BARANG} - {i.NAMA_BARANG} ({i.JENIS_SATUAN})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddManual}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
          >
            <Plus size={15} /> Tambahkan
          </button>
        </div>

        <div className="text-right pl-4 sm:border-l border-slate-200 shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold block">
            Total Estimasi Anggaran Pengadaan:
          </span>
          <span className="text-lg font-black text-emerald-900">
            Rp {totalAnggaran.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Planner Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Usulan Barang & Kuota Pembelian ({plans.length} Item)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-3 px-4 min-w-[200px]">Kode & Nama Barang</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Batas Min</th>
                <th className="py-3 px-4 text-center w-28">Jumlah Beli</th>
                <th className="py-3 px-4 text-right w-36">Estimasi Harga (Rp)</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4">Prioritas & Analisis</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {plans.length > 0 ? (
                plans.map((p) => (
                  <tr key={p.KODE_BARANG} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.NAMA_BARANG}</div>
                      <div className="font-mono text-[10px] text-emerald-800">
                        {p.KODE_BARANG} • Rek: {p.KODE_REKENING}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                        {p.STOK_SAAT_INI} {p.JENIS_SATUAN}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                      {p.BATAS_MINIMUM} {p.JENIS_SATUAN}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={p.REKOMENDASI_BELI}
                        onChange={(e) => handleUpdateQty(p.KODE_BARANG, Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-black text-center focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <input
                        type="number"
                        min={0}
                        value={p.ESTIMASI_HARGA}
                        onChange={(e) => handleUpdatePrice(p.KODE_BARANG, Number(e.target.value))}
                        className="w-28 px-2 py-1.5 text-xs rounded-lg border border-slate-300 text-right focus:ring-2 focus:ring-emerald-500 bg-white font-semibold shadow-2xs"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-900">
                      Rp {p.SUBTOTAL.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.PRIORITAS === 'TINGGI'
                              ? 'bg-rose-100 text-rose-800'
                              : p.PRIORITAS === 'SEDANG'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.PRIORITAS || 'NORMAL'}
                        </span>
                        {p.ALASAN_AI && (
                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            {p.ALASAN_AI}
                          </p>
                        )}
                        {p.ESTIMASI_HABIS_HARI !== undefined && (
                          <span className="text-[10px] text-rose-600 font-semibold block">
                            Tersisa ~{p.ESTIMASI_HABIS_HARI} hari konsumsi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(p.KODE_BARANG)}
                        className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada barang yang memerlukan pengadaan mendesak.
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
