import React, { useMemo, useState } from 'react';
import {
  Package,
  Box,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  Coins,
  Wrench,
  Layers,
  Activity,
  ArrowRight,
  ShoppingCart,
  ShieldAlert,
  AlertCircle,
  Warehouse,
  Flame,
  Check,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { accountService } from '../services/accountService';
import { classroomService } from '../services/classroomService';
import { ActivePage, Asset } from '../types';
import { Sparkline, AreaChart, DonutChart, BarChart, ProgressRing } from './charts';
import { AIInsightsPanel } from './AIInsightsPanel';
import { P5ProjectAnalyticsWidget } from './classroom/P5ProjectAnalyticsWidget';
import { AutomatedGradeTrendAnalyticsWidget } from './classroom/AutomatedGradeTrendAnalyticsWidget';

import { useTheme } from '../utils/theme';

interface DashboardViewProps {
  onNavigate: (page: ActivePage) => void;
  onOpenSheetsModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSheetsModal,
}) => {
  const { styles } = useTheme();
  const items = db.getItems();
  const assets = db.getAssets();
  const masukList = db.getBarangMasuk();
  const keluarList = db.getBarangKeluar();
  const stockSummary = db.getStockSummary();
  const tasks = db.getTodayTasks();
  const connectedSheetId = db.getConnectedGoogleSheetId();
  const config = db.getConfig();
  const procurementPlans = db.getProcurementPlans();
  const maintenanceLogs = db.getPemeliharaanAset();

  const [activeQuickTab, setActiveQuickTab] = useState<'ALL' | 'INVENTORY' | 'MAINTENANCE' | 'PROCUREMENT'>('ALL');

  // ─── Financial & Asset Calculations ───────────────────────
  const { totalAssetValue, totalAssetUnits, assetBaik, assetRusakRingan, assetRusakBerat, totalBarangRusak, healthRate } = useMemo(() => {
    const value = assets.reduce(
      (sum, a) => sum + (Number(a.TOTAL_NILAI) || Number(a.JUMLAH || 1) * Number(a.HARGA_SATUAN || 0)),
      0
    );
    const units = assets.reduce((sum, a) => sum + (Number(a.JUMLAH) || 1), 0);
    const baik = assets.filter((a) => a.KONDISI === 'BAIK');
    const rr = assets.filter((a) => a.KONDISI === 'RUSAK RINGAN');
    const rb = assets.filter((a) => a.KONDISI === 'RUSAK BERAT');
    
    return {
      totalAssetValue: value,
      totalAssetUnits: units,
      assetBaik: baik,
      assetRusakRingan: rr,
      assetRusakBerat: rb,
      totalBarangRusak: rr.length + rb.length,
      healthRate: assets.length > 0 ? Math.round((baik.length / assets.length) * 100) : 100
    };
  }, [assets]);

  // ─── Inventory (Persediaan Habis Pakai & ATK) ─────────────
  const totalStockUnits = useMemo(() => {
    return stockSummary.reduce((sum, s) => sum + Number(s.STOK || 0), 0);
  }, [stockSummary]);

  const totalStockValue = useMemo(() => {
    return stockSummary.reduce((sum, s) => {
      const itm = items.find((i) => i.KODE_BARANG === s.KODE_BARANG);
      const price = Number(itm?.HARGA_ESTIMASI || itm?.HARGA_STANDAR) || 35000;
      return sum + (s.STOK * price);
    }, 0);
  }, [stockSummary, items]);

  const { safeStockItems, lowStockItems, outOfStockItems, stockAvailabilityRate } = useMemo(() => {
    const safe = stockSummary.filter((s) => s.STATUS === 'AMAN');
    const low = stockSummary.filter((s) => s.STATUS === 'MINIMUM');
    const out = stockSummary.filter((s) => s.STOK === 0);
    return {
      safeStockItems: safe,
      lowStockItems: low,
      outOfStockItems: out,
      stockAvailabilityRate: stockSummary.length > 0 ? Math.round((safe.length / stockSummary.length) * 100) : 100
    };
  }, [stockSummary]);



  const totalCombinedValuation = totalAssetValue + totalStockValue;
  const totalCombinedUnits = totalAssetUnits + totalStockUnits;

  // ─── Pending Maintenance Calculations ────────────────────
  const damagedAssetsList = useMemo(() => {
    return assets.filter((a) => a.KONDISI === 'RUSAK RINGAN' || a.KONDISI === 'RUSAK BERAT');
  }, [assets]);

  const estRepairBudget = useMemo(() => {
    return damagedAssetsList.reduce((sum, a) => {
      const val = Number(a.TOTAL_NILAI) || Number(a.HARGA_SATUAN) || 500000;
      if (a.KONDISI === 'RUSAK RINGAN') {
        return sum + Math.max(100000, Math.round(val * 0.15));
      }
      return sum + Math.max(300000, Math.round(val * 0.4));
    }, 0);
  }, [damagedAssetsList]);

  // ─── Recent Procurement Alerts & Burn Rate ───────────────
  const procurementAlerts = useMemo(() => {
    return lowStockItems.map((s) => {
      const itm = items.find((i) => i.KODE_BARANG === s.KODE_BARANG);
      const keluar30Hari = keluarList
        .filter((k) => k.KODE_BARANG === s.KODE_BARANG && k.STATUS_TRANSAKSI === 'DISETUJUI')
        .reduce((sum, k) => sum + k.JUMLAH, 0);

      const dailyBurn = keluar30Hari > 0 ? keluar30Hari / 30 : 0.5;
      const daysLeft = s.STOK === 0 ? 0 : Math.max(1, Math.round(s.STOK / dailyBurn));
      const targetMin = Number(s.BATAS_MINIMUM) || 5;
      const recommendQty = Math.max(1, targetMin * 2 - s.STOK);
      const estPrice = Number(itm?.HARGA_ESTIMASI || itm?.HARGA_STANDAR) || 35000;
      const subtotalEst = recommendQty * estPrice;

      let urgency: 'EMERGENCY' | 'CRITICAL' | 'WARNING' = 'WARNING';
      if (s.STOK === 0) urgency = 'EMERGENCY';
      else if (daysLeft <= 5) urgency = 'CRITICAL';

      return {
        ...s,
        daysLeft,
        recommendQty,
        estPrice,
        subtotalEst,
        urgency,
        kodeRekening: itm?.KODE_REKENING_RKAS || '5.1.02.01.01.0024',
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [lowStockItems, keluarList, items]);

  const totalProcurementBudgetEst = useMemo(() => {
    return procurementAlerts.reduce((sum, a) => sum + a.subtotalEst, 0);
  }, [procurementAlerts]);

  const activePlansCount = procurementPlans.filter((p) => p.STATUS === 'DIAJUKAN').length;

  const now = useMemo(() => new Date(), []);
  
  // ─── Month-over-Month Trend ────────────────────────────────
  const { currentYM, prevYM, masukBulanIniList, masukBulanIni, totalNilaiMasukBulanIni, masukBulanLaluList, masukBulanLalu, growthPercentage } = useMemo(() => {
    const curYM = now.toISOString().slice(0, 7);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prYM = prevMonthDate.toISOString().slice(0, 7);

    const masukBulanIniList = masukList.filter((m) => m.TANGGAL.startsWith(curYM));
    const masukBulanIni = masukBulanIniList.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
    const totalNilaiMasukBulanIni = masukBulanIniList.reduce(
      (sum, m) => sum + (Number(m.TOTAL_PENGADAAN) || Number(m.JUMLAH || 0) * Number(m.HARGA_SATUAN || 0)),
      0
    );
    const masukBulanLaluList = masukList.filter((m) => m.TANGGAL.startsWith(prYM));
    const masukBulanLalu = masukBulanLaluList.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
    const growthPercentage = masukBulanLalu > 0
      ? Math.round(((masukBulanIni - masukBulanLalu) / masukBulanLalu) * 100)
      : masukBulanIni > 0 ? 100 : 0;
      
    return {
      currentYM: curYM,
      prevYM: prYM,
      masukBulanIniList,
      masukBulanIni,
      totalNilaiMasukBulanIni,
      masukBulanLaluList,
      masukBulanLalu,
      growthPercentage
    };
  }, [masukList, now]);

  // ─── 6-Month Trend for Area Chart ──────────────────────────
  const monthlyTrend = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const monthMasuk = masukList.filter((m) => m.TANGGAL.startsWith(ym));
      const qty = monthMasuk.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
      months.push({
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        value: qty,
      });
    }
    return months;
  }, [masukList, now]);

  // ─── Sparkline data for KPI cards ──────────────────────────
  const incomingSparkline = monthlyTrend.map((m) => m.value);
  const outgoingMonthly = useMemo(() => {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const qty = keluarList
        .filter((k) => k.TANGGAL.startsWith(ym) && k.STATUS_TRANSAKSI === 'DISETUJUI')
        .reduce((sum, k) => sum + k.JUMLAH, 0);
      months.push(qty);
    }
    return months;
  }, [keluarList, now]);

  const stockSparkline = useMemo(() => {
    return stockSummary.slice(0, 6).map((s) => s.STOK);
  }, [stockSummary]);

  const assetSparkline = useMemo(() => {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const count = assets.filter((a) => a.TANGGAL_BKU && a.TANGGAL_BKU.startsWith(ym)).length;
      months.push(count || Math.max(assets.length - i * 0.5, 1));
    }
    return months;
  }, [assets, now]);

  // ─── Asset Condition Donut Data ────────────────────────────
  const donutData = [
    { label: 'Baik', value: assetBaik.length, color: '#10b981' },
    { label: 'Rusak Ringan', value: assetRusakRingan.length, color: '#f59e0b' },
    { label: 'Rusak Berat', value: assetRusakBerat.length, color: '#ef4444' },
  ];

  // ─── Budget Utilization ────────────────────────────────────
  const budgetBySource = useMemo(() => {
    const sources: Record<string, number> = {};
    masukList.forEach((m) => {
      const src = m.SUMBER_ANGGARAN || 'Lainnya';
      sources[src] = (sources[src] || 0) + (Number(m.TOTAL_PENGADAAN) || 0);
    });
    return Object.entries(sources)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [masukList]);

  const totalBudget = budgetBySource.reduce((sum, b) => sum + b.value, 0) || 1;

  // ─── Category Distribution for Bar Chart ────────────────────
  const categoryBars = useMemo(() => {
    const cats: Record<string, number> = {};
    stockSummary.forEach((s) => {
      const item = items.find((i) => i.KODE_BARANG === s.KODE_BARANG);
      const cat = item?.KATEGORI || 'Lainnya';
      cats[cat] = (cats[cat] || 0) + s.STOK;
    });
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    return Object.entries(cats)
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [stockSummary, items]);

  // ─── Recent Activity Feed ──────────────────────────────────
  const recentActivity = useMemo(() => {
    const activities: { type: 'in' | 'out' | 'asset'; title: string; subtitle: string; date: string; amount?: string }[] = [];

    masukList.slice(-3).reverse().forEach((m) => {
      activities.push({
        type: 'in',
        title: `Barang Masuk: ${m.NAMA_BARANG}`,
        subtitle: `${m.JUMLAH} ${m.JENIS_SATUAN} dari ${m.NAMA_TOKO}`,
        date: m.TANGGAL,
        amount: `Rp ${(m.TOTAL_PENGADAAN / 1000000).toFixed(1)}jt`,
      });
    });

    keluarList.filter((k) => k.STATUS_TRANSAKSI === 'DISETUJUI').slice(-3).reverse().forEach((k) => {
      activities.push({
        type: 'out',
        title: `Barang Keluar: ${k.NAMA_BARANG}`,
        subtitle: `ke ${k.PENERIMA} (${k.UNIT_RUANGAN})`,
        date: k.TANGGAL,
      });
    });

    assets.slice(-2).reverse().forEach((a) => {
      activities.push({
        type: 'asset',
        title: `Aset Terdaftar: ${a.NAMA_BARANG}`,
        subtitle: `${a.MERK} — ${a.LOKASI}`,
        date: a.TANGGAL_BKU || a.NOMOR_BKU || '',
        amount: `Rp ${(a.TOTAL_NILAI / 1000000).toFixed(1)}jt`,
      });
    });

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [masukList, keluarList, assets]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val);

  const formatRupiahFull = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const keluarBulanIni = keluarList
    .filter((k) => k.TANGGAL.startsWith(currentYM) && k.STATUS_TRANSAKSI === 'DISETUJUI')
    .reduce((sum, k) => sum + k.JUMLAH, 0);

  const pendingApprovals = keluarList.filter((k) => k.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN');

  const activityIcon = {
    in: { icon: ArrowDownLeft, bg: 'bg-emerald-100', text: 'text-emerald-700' },
    out: { icon: ArrowUpRight, bg: 'bg-amber-100', text: 'text-amber-700' },
    asset: { icon: Box, bg: 'bg-sky-100', text: 'text-sky-700' },
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ─── Hero Banner ─────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${styles.heroGrad} text-white shadow-lg`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Aktif • {config.SCHOOL_NAME}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Dashboard Tata Kelola Barang & Inventaris
            </h2>
            <p className="text-xs text-emerald-100/70 max-w-2xl leading-relaxed">
              Monitoring terpusat persediaan habis pakai, aset tetap, antrean pemeliharaan, serta peringatan dini pengadaan BOS/ARKAS.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 shadow-xs"
            >
              <FileSpreadsheet size={16} />
              {connectedSheetId ? 'Kelola Sinkronisasi' : 'Hubungkan Sheets'}
            </button>
          </div>
        </div>

        {/* Top Summary Micro-Bar */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Total Valuasi Gabungan</div>
            <div className="text-lg font-black mt-0.5">{formatRupiah(totalCombinedValuation)}</div>
            <div className="text-[10px] text-emerald-200/60 mt-0.5">Aset Tetap + Persediaan</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Total Fisik Barang</div>
            <div className="text-lg font-black mt-0.5">{totalCombinedUnits} Unit</div>
            <div className="text-[10px] text-emerald-200/60 mt-0.5">{totalAssetUnits} Aset • {totalStockUnits} Stok</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Kesehatan Aset</div>
            <div className="text-lg font-black mt-0.5 flex items-center gap-1.5">
              <span>{healthRate}%</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${healthRate >= 80 ? 'bg-emerald-500/30 text-emerald-200' : 'bg-amber-500/30 text-amber-200'}`}>
                {healthRate >= 80 ? 'Sehat' : 'Perlu Servis'}
              </span>
            </div>
            <div className="text-[10px] text-emerald-200/60 mt-0.5">{assetBaik.length} dari {assets.length} Aset Baik</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Stok Ketersediaan</div>
            <div className="text-lg font-black mt-0.5 flex items-center gap-1.5">
              <span>{stockAvailabilityRate}%</span>
              {lowStockItems.length > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200">
                  {lowStockItems.length} Kritis
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">Aman</span>
              )}
            </div>
            <div className="text-[10px] text-emerald-200/60 mt-0.5">{safeStockItems.length} dari {stockSummary.length} SKU Aman</div>
          </div>
        </div>
      </div>



      {/* ─── OPTIMIZED 'QUICK STATS' COMMAND MONITORING PANEL ─────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  Quick Stats & Monitoring Pengawasan
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan komprehensif total inventaris, antrean pemeliharaan, dan peringatan dini restock
              </p>
            </div>
          </div>

          {/* Quick Filter Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveQuickTab('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeQuickTab === 'ALL'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Modul
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickTab('INVENTORY')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeQuickTab === 'INVENTORY'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventaris ({items.length + assets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickTab('MAINTENANCE')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeQuickTab === 'MAINTENANCE'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemeliharaan
              {totalBarangRusak > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickTab('PROCUREMENT')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeQuickTab === 'PROCUREMENT'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengadaan
              {lowStockItems.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 3 PRIMARY QUICK STATS MODULE CARDS ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. TOTAL INVENTORY SUMMARY */}
          {(activeQuickTab === 'ALL' || activeQuickTab === 'INVENTORY') && (
            <div className="rounded-xl p-4 bg-gradient-to-b from-slate-50 to-emerald-50/30 border border-emerald-100/80 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                      <Warehouse size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Total Inventaris & Stok
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {items.length} Master SKU
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-800">
                    {totalCombinedUnits.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-semibold text-slate-500">Unit Terkelola</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    Valuasi: {formatRupiahFull(totalCombinedValuation)}
                  </div>
                </div>

                {/* Sub metrics breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Persediaan ATK/Bahan</div>
                    <div className="font-black text-slate-700 mt-0.5">{totalStockUnits} Unit</div>
                    <div className="text-[10px] text-slate-500">{stockSummary.length} Jenis Barang</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Aset Tetap (KIB)</div>
                    <div className="font-black text-slate-700 mt-0.5">{totalAssetUnits} Unit</div>
                    <div className="text-[10px] text-slate-500">{assets.length} Register Aset</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Ketersediaan: <strong className="text-emerald-700">{stockAvailabilityRate}%</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('persediaan')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
                >
                  Detail Persediaan <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* 2. PENDING MAINTENANCE ITEMS */}
          {(activeQuickTab === 'ALL' || activeQuickTab === 'MAINTENANCE') && (
            <div className="rounded-xl p-4 bg-gradient-to-b from-slate-50 to-amber-50/40 border border-amber-200/80 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                      <Wrench size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Antrean Pemeliharaan
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      totalBarangRusak > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {totalBarangRusak > 0 ? `${totalBarangRusak} Perlu Tindakan` : 'Semua Berfungsi'}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-800">
                    {totalBarangRusak}{' '}
                    <span className="text-xs font-semibold text-slate-500">Aset Rusak</span>
                  </div>
                  <div className="text-xs font-bold text-amber-800 mt-0.5">
                    Est. Biaya Servis: {formatRupiah(estRepairBudget)}
                  </div>
                </div>

                {/* Sub metrics breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Rusak Ringan
                    </div>
                    <div className="font-black text-slate-800 mt-0.5">{assetRusakRingan.length} Aset</div>
                    <div className="text-[10px] text-slate-500">Dapat diservis</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Rusak Berat
                    </div>
                    <div className="font-black text-slate-800 mt-0.5">{assetRusakBerat.length} Aset</div>
                    <div className="text-[10px] text-slate-500">Usulan penghapusan</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {maintenanceLogs.length} riwayat servis tercatat
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('pemeliharaan')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 hover:underline"
                >
                  Kelola Pemeliharaan <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* 3. RECENT PROCUREMENT ALERTS */}
          {(activeQuickTab === 'ALL' || activeQuickTab === 'PROCUREMENT') && (
            <div className="rounded-xl p-4 bg-gradient-to-b from-slate-50 to-rose-50/40 border border-rose-200/80 hover:border-rose-400 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
                      <ShieldAlert size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                      Peringatan Pengadaan
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lowStockItems.length > 0
                        ? 'bg-rose-100 text-rose-900 border border-rose-200 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {lowStockItems.length > 0 ? `${lowStockItems.length} Stok Kritis` : 'Stok Cukup'}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-800">
                    {lowStockItems.length}{' '}
                    <span className="text-xs font-semibold text-slate-500">Item Di Bawah Minimum</span>
                  </div>
                  <div className="text-xs font-bold text-rose-800 mt-0.5">
                    Kebutuhan Belanja: {formatRupiah(totalProcurementBudgetEst)}
                  </div>
                </div>

                {/* Sub metrics breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                      <Flame size={11} className="text-rose-600" />
                      Habis Total (0 Qty)
                    </div>
                    <div className="font-black text-rose-900 mt-0.5">{outOfStockItems.length} Item</div>
                    <div className="text-[10px] text-rose-600">Perlu belanja instan</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                      <ShoppingCart size={11} className="text-slate-500" />
                      Rencana Aktif
                    </div>
                    <div className="font-black text-slate-800 mt-0.5">{activePlansCount} Usulan</div>
                    <div className="text-[10px] text-slate-500">Di Procurement Planner</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {outOfStockItems.length > 0 ? `${outOfStockItems.length} barang kosong` : 'Semua item siap'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('procurement_planner')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-900 hover:text-rose-950 hover:underline"
                >
                  Rencana Pengadaan <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── EXPANDED ACTIONABLE MONITORING FEED (ALERTS & ACTION CARDS) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Detailed Pending Maintenance Queue List */}
          <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={15} className="text-amber-800" />
                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Daftar Aset Butuh Servis ({damagedAssetsList.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pemeliharaan')}
                className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1"
              >
                Input Perbaikan <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {damagedAssetsList.length > 0 ? (
                damagedAssetsList.slice(0, 4).map((ast) => (
                  <div
                    key={ast.ID}
                    onClick={() => onNavigate('pemeliharaan')}
                    className="p-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{ast.NAMA_BARANG}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-mono">{ast.KODE_ASET}</span>
                        <span>•</span>
                        <span>{ast.LOKASI}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          ast.KONDISI === 'RUSAK RINGAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ast.KONDISI}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Seluruh sarana prasarana dalam kondisi prima.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Procurement Warning Feed */}
          <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={15} className="text-rose-700" />
                <h4 className="text-xs font-extrabold text-rose-950 uppercase tracking-wider">
                  Peringatan Dini Stok Kritis ({procurementAlerts.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('procurement_planner')}
                className="text-[11px] font-bold text-rose-900 hover:underline flex items-center gap-1"
              >
                Buat Rencana BOS <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {procurementAlerts.length > 0 ? (
                procurementAlerts.slice(0, 4).map((al) => (
                  <div
                    key={al.KODE_BARANG}
                    onClick={() => onNavigate('procurement_planner')}
                    className="p-2 rounded-lg bg-white border border-rose-100 hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{al.NAMA_BARANG}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Sisa: <strong className="text-rose-700 font-bold">{al.STOK} {al.JENIS_SATUAN}</strong> (Min: {al.BATAS_MINIMUM})</span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">Habis dlm ~{al.daysLeft} hari</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-700 block">
                        Beli +{al.recommendQty} {al.JENIS_SATUAN}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {formatRupiah(al.subtotalEst)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Persediaan aman di atas batas minimum.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards with Sparklines ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Master Barang */}
        <div
          onClick={() => onNavigate('master')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Master Barang</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{items.length}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">Jenis terdaftar</span>
            <div className="w-16">
              <Sparkline data={stockSparkline} color="#10b981" height={20} />
            </div>
          </div>
        </div>

        {/* Aset / Inventaris */}
        <div
          onClick={() => onNavigate('aset')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Aset / Inventaris</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Box size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{assets.length}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">
              {totalBarangRusak > 0 ? `${totalBarangRusak} perlu perbaikan` : 'Semua baik'}
            </span>
            <div className="w-16">
              <Sparkline data={assetSparkline} color="#3b82f6" height={20} />
            </div>
          </div>
        </div>

        {/* Barang Masuk */}
        <div
          onClick={() => onNavigate('barang_masuk')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Masuk Bulan Ini</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">+{masukBulanIni}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              {growthPercentage >= 0 ? (
                <TrendingUp size={11} className="text-emerald-600" />
              ) : (
                <TrendingDown size={11} className="text-rose-500" />
              )}
              {Math.abs(growthPercentage)}% vs bln lalu
            </span>
            <div className="w-16">
              <Sparkline data={incomingSparkline} color="#14b8a6" height={20} />
            </div>
          </div>
        </div>

        {/* Barang Keluar */}
        <div
          onClick={() => onNavigate('barang_keluar')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Keluar Bulan Ini</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">-{keluarBulanIni}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">
              {pendingApprovals.length > 0 ? `${pendingApprovals.length} menunggu` : 'Semua disetujui'}
            </span>
            <div className="w-16">
              <Sparkline data={outgoingMonthly} color="#f59e0b" height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row: Area Chart + Donut ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stock Movement Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Tren Pergerakan Barang Masuk</h3>
                <p className="text-[11px] text-slate-400">6 bulan terakhir</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('stock_ledger')}
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              Kartu Stok <ChevronRight size={12} />
            </button>
          </div>
          <AreaChart
            data={monthlyTrend}
            color="#10b981"
            height={210}
            valueFormatter={(v) => `${v}`}
          />
        </div>

        {/* Asset Condition Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Kondisi Aset</h3>
              <p className="text-[11px] text-slate-400">Distribusi status kelayakan</p>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <DonutChart
              data={donutData}
              size={150}
              thickness={20}
              centerValue={String(assets.length)}
              centerLabel="Total Aset"
            />
          </div>
          {totalBarangRusak > 0 && (
            <button
              onClick={() => onNavigate('pemeliharaan')}
              className="w-full mt-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Wrench size={13} />
              {totalBarangRusak} aset perlu perbaikan
            </button>
          )}
        </div>
      </div>

      {/* P5 Project Analytics Widget */}
      <P5ProjectAnalyticsWidget />

      {/* ─── Automated Grade Trend Analytics & Weekly Performance ──── */}
      <AutomatedGradeTrendAnalyticsWidget
        onNavigateToClassroom={() => onNavigate('e_rapor' as ActivePage)}
      />

      {/* ─── AI Insights + Critical Stock ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AIInsightsPanel onNavigate={onNavigate} />
        </div>

        {/* Critical Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <TrendingDown size={16} />
              </div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Stok Kritis</h3>
            </div>
            <button
              onClick={() => onNavigate('procurement_planner')}
              className="text-[11px] text-emerald-700 font-bold hover:underline"
            >
              Pengadaan
            </button>
          </div>
          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.KODE_BARANG}
                  onClick={() => onNavigate('procurement_planner')}
                  className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.NAMA_BARANG}</div>
                    <div className="text-[10px] text-slate-500">Min: {item.BATAS_MINIMUM} {item.JENIS_SATUAN}</div>
                  </div>
                  <span className="text-xs font-black text-rose-700 px-2 py-0.5 rounded-md bg-rose-100 shrink-0">
                    {item.STOK} {item.JENIS_SATUAN}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center">
                <CheckCircle2 size={28} className="text-emerald-500 mb-1.5" />
                Semua persediaan aman.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Category Distribution + Recent Activity ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Distribusi Stok per Kategori</h3>
                <p className="text-[11px] text-slate-400">Jumlah unit per kategori barang</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('persediaan')}
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              Detail <ChevronRight size={12} />
            </button>
          </div>
          {categoryBars.length > 0 ? (
            <BarChart
              data={categoryBars}
              height={200}
              valueFormatter={(v) => `${v} unit`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
              Belum ada data stok.
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Activity size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((act, i) => {
              const cfg = activityIcon[act.type];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{act.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{act.subtitle}</div>
                    <div className="text-[9px] text-slate-300 mt-0.5 flex items-center gap-2">
                      <Clock size={9} />
                      {act.date}
                      {act.amount && <span className="font-bold text-slate-500">{act.amount}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Budget Utilization + Quick Actions ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget by Source */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Coins size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Realisasi per Sumber Dana</h3>
          </div>
          {budgetBySource.length > 0 ? (
            <div className="space-y-3">
              {budgetBySource.map((src, i) => {
                const pct = Math.round((src.value / totalBudget) * 100);
                const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500'];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600 truncate">{src.label}</span>
                      <span className="font-bold text-slate-700">{formatRupiah(src.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{pct}% dari total</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data pengadaan.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Aksi Cepat & Inovasi</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNavigate('barang_masuk')}
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-slate-800 border border-emerald-200 text-left transition-all group shadow-xs"
            >
              <Sparkles size={18} className="text-emerald-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-black text-emerald-950">OCR Kwitansi AI</div>
              <div className="text-[10px] text-slate-500">Scan & Ekstrak Faktur</div>
            </button>
            <button
              onClick={() => onNavigate('arkas_siplah')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-300 text-left transition-all group"
            >
              <Building2 size={18} className="text-blue-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">ARKAS & SIPLah</div>
              <div className="text-[10px] text-slate-500">Realisasi BOS</div>
            </button>
            <button
              onClick={() => onNavigate('depresiasi_aset')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-800 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
            >
              <TrendingDown size={18} className="text-indigo-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">Depresiasi SAP</div>
              <div className="text-[10px] text-slate-500">Penyusutan Aset</div>
            </button>
            <button
              onClick={() => onNavigate('multi_school' as any)}
              className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
            >
              <ShieldCheck size={18} className="text-emerald-800 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">Konsolidasi</div>
              <div className="text-[10px] text-slate-500">Multi-Sekolah</div>
            </button>
          </div>

          {/* Tasks & Approvals */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Tugas & Antrean Persetujuan</h3>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {tasks.length} Terbuka
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.length > 0 ? (
                tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.ID}
                    onClick={() => onNavigate(task.MODULE as ActivePage)}
                    className="py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${task.TYPE === 'APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {task.TYPE === 'APPROVAL' ? <Clock size={14} /> : <AlertTriangle size={14} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{task.TITLE}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{task.DESCRIPTION}</p>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700 shrink-0 transition-colors flex items-center gap-1">
                      Buka <ArrowRight size={11} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center">
                  <CheckCircle2 size={28} className="text-emerald-500 mb-1.5" />
                  <p>Semua tugas hari ini telah selesai.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
