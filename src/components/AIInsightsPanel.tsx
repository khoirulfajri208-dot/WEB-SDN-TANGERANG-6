import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Package, Brain, Zap } from 'lucide-react';
import { db } from '../services/localStorageService';
import { ActivePage } from '../types';

interface AIInsightsPanelProps {
  onNavigate?: (page: ActivePage) => void;
}

interface InsightRecommendation {
  kode_barang: string;
  nama_barang: string;
  jenis_satuan?: string;
  stok_saat_ini: number;
  rekomendasi_qty: number;
  prioritas: string;
  justifikasi: string;
  estimasi_total: number;
}

interface AIInsightsData {
  ringkasan_eksekutif: string;
  total_estimasi_anggaran: number;
  rekomendasi: InsightRecommendation[];
}

// Client-side instant heuristic prediction calculator
function computeLocalInsights(): AIInsightsData {
  const stockSummary = db.getStockSummary();
  const recentOut = db.getBarangKeluar();

  const recommendations: InsightRecommendation[] = stockSummary.map((item) => {
    const kode = item.KODE_BARANG || 'BRG-001';
    const nama = item.NAMA_BARANG || 'Barang Persediaan';
    const satuan = item.JENIS_SATUAN || 'Pcs';
    const currentStock = Number(item.STOK ?? 0);
    const minLimit = Number(item.BATAS_MINIMUM ?? 5);

    const matchedOut = recentOut.filter((k) => k.KODE_BARANG === kode);
    const totalOut = matchedOut.reduce((acc, cur) => acc + Number(cur.JUMLAH || 0), 0);
    const outAvg = totalOut > 0 ? Math.ceil(totalOut / 2) : Math.max(2, Math.ceil(minLimit / 2));

    const safetyStock = Math.ceil(minLimit * 1.5);
    const recommendedQty = Math.max(1, (outAvg * 3 + safetyStock) - currentStock);
    const estPrice = (item as any).HARGA_BELI_TERAKHIR || (item as any).HARGA_SATUAN || 45000;
    const priority = currentStock <= minLimit ? 'MENDESAK' : currentStock <= minLimit * 1.5 ? 'TINGGI' : 'NORMAL';

    return {
      kode_barang: kode,
      nama_barang: nama,
      jenis_satuan: satuan,
      stok_saat_ini: currentStock,
      rekomendasi_qty: recommendedQty,
      prioritas: priority,
      justifikasi: currentStock <= minLimit
        ? `Stok saat ini (${currentStock} ${satuan}) di bawah batas minimum (${minLimit} ${satuan}). Perlu pengadaan prioritas.`
        : `Laju pemakaian rata-rata ${outAvg} ${satuan}/bulan. Proyeksi stok aman untuk operasional KBM.`,
      estimasi_total: recommendedQty * estPrice,
    };
  });

  const totalAnggaran = recommendations.reduce((acc, cur) => acc + cur.estimasi_total, 0);
  const urgentCount = recommendations.filter((r) => r.prioritas === 'MENDESAK' || r.prioritas === 'TINGGI').length;
  const summaryText = `Berdasarkan analisis laju konsumsi dan stok riil sekolah, terdapat ${urgentCount} barang prioritas pengadaan dengan estimasi anggaran ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAnggaran)}.`;

  return {
    ringkasan_eksekutif: summaryText,
    total_estimasi_anggaran: totalAnggaran,
    rekomendasi: recommendations,
  };
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ onNavigate }) => {
  const [insights, setInsights] = useState<AIInsightsData>(() => computeLocalInsights());
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    const localData = computeLocalInsights();

    try {
      const stockSummary = db.getStockSummary();
      const recentOut = db.getBarangKeluar().slice(0, 20);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/ai/predict-procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          stockSummary: stockSummary.map((s) => ({
            KODE_BARANG: s.KODE_BARANG,
            NAMA_BARANG: s.NAMA_BARANG,
            JENIS_SATUAN: s.JENIS_SATUAN,
            STOK: s.STOK,
            BATAS_MINIMUM: s.BATAS_MINIMUM,
            TOTAL_KELUAR: s.TOTAL_KELUAR,
            STATUS: s.STATUS,
          })),
          recentOutTransactions: recentOut.map((k) => ({
            KODE_BARANG: k.KODE_BARANG,
            NAMA_BARANG: k.NAMA_BARANG,
            JUMLAH: k.JUMLAH,
            TANGGAL: k.TANGGAL,
          })),
          targetPeriod: 'Semester Ganjil 2026/2027',
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setInsights(json.data);
          setIsFallback(Boolean(json.isFallback));
          return;
        }
      }

      // If response not ok or no data, use local computed
      setInsights(localData);
      setIsFallback(true);
    } catch {
      // Gracefully fallback to local analytics calculation on network error/timeout
      setInsights(localData);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val);

  const priorityConfig: Record<string, { bg: string; text: string; border: string }> = {
    MENDESAK: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    TINGGI: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    NORMAL: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    CUKUP: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-800 text-emerald-300 shadow-xs">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              AI Insight & Rekomendasi Cerdas
              {isFallback && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] font-bold border border-amber-200">
                  Mode Heuristik
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Analisis prediktif pengadaan berbasis tren konsumsi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors disabled:opacity-50"
          title="Segarkan analisis AI"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-lg shimmer-bg w-3/4" />
            <div className="h-4 bg-slate-100 rounded-lg shimmer-bg w-1/2" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="h-20 bg-slate-100 rounded-xl shimmer-bg" />
              <div className="h-20 bg-slate-100 rounded-xl shimmer-bg" />
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Executive Summary */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Sparkles size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">{insights.ringkasan_eksekutif}</p>
            </div>

            {/* Budget Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Estimasi Anggaran</span>
                </div>
                <div className="text-lg font-black text-emerald-900 mt-1">
                  {formatRupiah(insights.total_estimasi_anggaran || 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                <div className="flex items-center gap-1.5 text-sky-700">
                  <Package size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Item Direkomendasikan</span>
                </div>
                <div className="text-lg font-black text-sky-900 mt-1">
                  {insights.rekomendasi?.length || 0} Barang
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioritas Pengadaan</span>
              {insights.rekomendasi?.slice(0, 4).map((rec, i) => {
                const pCfg = priorityConfig[rec.prioritas] || priorityConfig.NORMAL;
                return (
                  <div
                    key={i}
                    onClick={() => onNavigate?.('procurement_planner')}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer group"
                  >
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${pCfg.bg} ${pCfg.text} ${pCfg.border}`}>
                      {rec.prioritas}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">{rec.nama_barang}</div>
                      <div className="text-[10px] text-slate-400 truncate">{rec.justifikasi}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-slate-700">+{rec.rekomendasi_qty}</div>
                      <div className="text-[9px] text-slate-400">{rec.jenis_satuan || 'Pcs'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => onNavigate?.('procurement_planner')}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap size={14} />
              Buat Rencana Pengadaan AI
            </button>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <AlertTriangle size={28} className="text-slate-300" />
            <p>Gagal memuat insight AI. Coba segarkan kembali.</p>
          </div>
        )}
      </div>
    </div>
  );
};
