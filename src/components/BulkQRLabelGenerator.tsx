import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  Palette,
  Eye,
  Building2,
  Tag,
  Package,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Item, Asset, Config } from '../types';
import { db } from '../services/localStorageService';
import { qrService } from '../services/qrService';
import jsPDF from 'jspdf';

interface BulkQRLabelGeneratorProps {
  onBackToGenerator?: () => void;
}

export const BulkQRLabelGenerator: React.FC<BulkQRLabelGeneratorProps> = ({ onBackToGenerator }) => {
  const config = db.getConfig();
  const items = db.getItems();
  const assets = db.getAssets();

  // Mode: Master Barang (Persediaan) vs Daftar Aset (Inventaris)
  const [sourceMode, setSourceMode] = useState<'ITEMS' | 'ASSETS'>('ITEMS');

  // Selected IDs
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');

  // Sheet & Layout Settings
  const [layoutPreset, setLayoutPreset] = useState<'a4_2x5' | 'a4_3x7' | 'a4_4x8' | 'tj_108' | 'tj_121' | 'thermal_50x30'>('a4_2x5');
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [colorTheme, setColorTheme] = useState<'emerald' | 'navy' | 'monochrome' | 'slate'>('emerald');
  const [borderStyle, setBorderStyle] = useState<'double' | 'single' | 'rounded'>('double');

  // Fields to include on label
  const [includeSchoolKop, setIncludeSchoolKop] = useState(true);
  const [includeCode, setIncludeCode] = useState(true);
  const [includeName, setIncludeName] = useState(true);
  const [includeCategory, setIncludeCategory] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeTahun, setIncludeTahun] = useState(true);
  const [includeCondition, setIncludeCondition] = useState(true);

  // Zoom & Preview state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize selection
  useEffect(() => {
    if (sourceMode === 'ITEMS') {
      setSelectedItemIds(items.slice(0, 10).map((i) => i.ID));
    } else {
      setSelectedAssetIds(assets.slice(0, 10).map((a) => a.ID));
    }
  }, [sourceMode]);

  // Generate QR codes
  useEffect(() => {
    let isMounted = true;
    const generateAllQr = async () => {
      const urls: Record<string, string> = {};
      const targetList = sourceMode === 'ITEMS' ? items : assets;

      for (const record of targetList) {
        const code = sourceMode === 'ITEMS' ? (record as Item).KODE_BARANG : (record as Asset).KODE_ASET;
        const qrContent =
          sourceMode === 'ITEMS'
            ? `${window.location.origin}/?page=master_barang&code=${encodeURIComponent(code)}`
            : `${window.location.origin}/?scan=${encodeURIComponent(code)}`;

        try {
          const dataUrl = await qrService.generateQRCode(qrContent, 200);
          urls[code] = dataUrl;
        } catch (e) {
          console.error(e);
        }
      }

      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };

    generateAllQr();
    return () => {
      isMounted = false;
    };
  }, [sourceMode, items.length, assets.length]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Categories & Locations for filter
  const itemCategories = Array.from(new Set(items.map((i) => i.KATEGORI).filter(Boolean)));
  const assetCategories = Array.from(new Set(assets.map((a) => a.KATEGORI).filter(Boolean)));
  const assetLocations = Array.from(new Set(assets.map((a) => a.LOKASI).filter(Boolean)));

  const currentCategories = sourceMode === 'ITEMS' ? itemCategories : assetCategories;

  // Filtered lists
  const filteredItems = items.filter((item) => {
    const matchSearch =
      !search ||
      item.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      item.KODE_BARANG.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.KATEGORI === filterCategory;
    return matchSearch && matchCat;
  });

  const filteredAssets = assets.filter((asset) => {
    const matchSearch =
      !search ||
      asset.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      asset.KODE_ASET.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || asset.KATEGORI === filterCategory;
    const matchLoc = filterLocation === 'ALL' || asset.LOKASI === filterLocation;
    return matchSearch && matchCat && matchLoc;
  });

  // Toggle selection
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (sourceMode === 'ITEMS') {
      const filteredIds = filteredItems.map((i) => i.ID);
      const allSelected = filteredIds.every((id) => selectedItemIds.includes(id));
      if (allSelected) {
        setSelectedItemIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      } else {
        setSelectedItemIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
      }
    } else {
      const filteredIds = filteredAssets.map((a) => a.ID);
      const allSelected = filteredIds.every((id) => selectedAssetIds.includes(id));
      if (allSelected) {
        setSelectedAssetIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      } else {
        setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
      }
    }
  };

  // Compile final print cards
  interface PrintLabelData {
    code: string;
    name: string;
    category?: string;
    location?: string;
    tahun?: string;
    condition?: string;
    unit?: string;
  }

  const labelsToPrint: PrintLabelData[] = [];

  if (sourceMode === 'ITEMS') {
    const selected = items.filter((i) => selectedItemIds.includes(i.ID));
    selected.forEach((item) => {
      for (let c = 0; c < copiesPerItem; c++) {
        labelsToPrint.push({
          code: item.KODE_BARANG,
          name: item.NAMA_BARANG,
          category: item.KATEGORI,
          location: item.LOKASI_DEFAULT || 'Gudang Utama',
          unit: item.JENIS_SATUAN,
          condition: 'Baik / Aktif',
        });
      }
    });
  } else {
    const selected = assets.filter((a) => selectedAssetIds.includes(a.ID));
    selected.forEach((asset) => {
      for (let c = 0; c < copiesPerItem; c++) {
        labelsToPrint.push({
          code: asset.KODE_ASET,
          name: asset.NAMA_BARANG,
          category: asset.KATEGORI,
          location: asset.LOKASI,
          tahun: asset.TAHUN_PEROLEHAN?.toString(),
          condition: asset.KONDISI,
          unit: asset.JENIS_SATUAN,
        });
      }
    });
  }

  // Grid columns based on layout
  const gridColsClass =
    layoutPreset === 'a4_2x5'
      ? 'grid-cols-2'
      : layoutPreset === 'a4_3x7'
      ? 'grid-cols-3'
      : layoutPreset === 'a4_4x8'
      ? 'grid-cols-4'
      : layoutPreset === 'tj_108'
      ? 'grid-cols-3'
      : layoutPreset === 'tj_121'
      ? 'grid-cols-2'
      : 'grid-cols-1';

  // Direct Browser Print
  const handlePrintDirect = () => {
    window.print();
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    if (labelsToPrint.length === 0) {
      alert('Pilih setidaknya 1 barang atau aset untuk dicetak.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 10;
      const marginY = 10;

      let cols = 2;
      let rows = 5;

      if (layoutPreset === 'a4_3x7' || layoutPreset === 'tj_108') {
        cols = 3;
        rows = 7;
      } else if (layoutPreset === 'a4_4x8') {
        cols = 4;
        rows = 8;
      }

      const cardWidth = (pageWidth - marginX * 2 - (cols - 1) * 4) / cols;
      const cardHeight = (pageHeight - marginY * 2 - (rows - 1) * 4) / rows;
      const labelsPerPage = cols * rows;

      for (let i = 0; i < labelsToPrint.length; i++) {
        if (i > 0 && i % labelsPerPage === 0) {
          doc.addPage();
        }

        const pageIndex = i % labelsPerPage;
        const col = pageIndex % cols;
        const row = Math.floor(pageIndex / cols);

        const x = marginX + col * (cardWidth + 4);
        const y = marginY + row * (cardHeight + 4);

        // Draw Card Border
        if (colorTheme === 'emerald') {
          doc.setDrawColor(16, 120, 90);
        } else if (colorTheme === 'navy') {
          doc.setDrawColor(30, 41, 59);
        } else {
          doc.setDrawColor(120, 120, 120);
        }
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'S');

        // Header Background
        if (includeSchoolKop) {
          if (colorTheme === 'emerald') {
            doc.setFillColor(236, 253, 245);
            doc.setTextColor(6, 78, 59);
          } else if (colorTheme === 'navy') {
            doc.setFillColor(238, 242, 255);
            doc.setTextColor(30, 27, 75);
          } else {
            doc.setFillColor(245, 245, 245);
            doc.setTextColor(40, 40, 40);
          }
          doc.rect(x, y, cardWidth, 6, 'F');
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.text(config.SCHOOL_NAME || 'SDN TANGERANG 6', x + cardWidth / 2, y + 4.2, { align: 'center' });
        }

        const currentLabel = labelsToPrint[i];
        const qrDataUrl = qrCodeDataUrls[currentLabel.code];

        // Draw QR Code
        const qrSize = Math.min(cardHeight - (includeSchoolKop ? 9 : 3), cardWidth * 0.32);
        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', x + 2, y + (includeSchoolKop ? 7.5 : 2.5), qrSize, qrSize);
        }

        // Draw Text Details
        const textX = x + qrSize + 4;
        let textY = y + (includeSchoolKop ? 9.5 : 5);

        doc.setTextColor(20, 20, 20);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        const splitTitle = doc.splitTextToSize(currentLabel.name, cardWidth - qrSize - 6);
        doc.text(splitTitle.slice(0, 2), textX, textY);
        textY += splitTitle.slice(0, 2).length * 3.2;

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);

        if (includeCode) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(colorTheme === 'emerald' ? 16 : 30);
          doc.text(`Kode: ${currentLabel.code}`, textX, textY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(70, 70, 70);
          textY += 2.8;
        }

        if (includeLocation && currentLabel.location) {
          doc.text(`Lokasi: ${currentLabel.location}`, textX, textY);
          textY += 2.8;
        }

        if (includeCategory && currentLabel.category) {
          doc.text(`Kategori: ${currentLabel.category}`, textX, textY);
          textY += 2.8;
        }

        if (includeCondition && currentLabel.condition) {
          doc.text(`Kondisi: ${currentLabel.condition}`, textX, textY);
        }
      }

      const filename = `LABEL_QR_${sourceMode}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showToast(`PDF Berhasil diunduh: ${filename}`);
    } catch (e: any) {
      console.error(e);
      alert('Gagal menghasilkan PDF Label: ' + e.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentSelectedCount = sourceMode === 'ITEMS' ? selectedItemIds.length : selectedAssetIds.length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slide-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Bulk QR Code & Printable Asset Label Generator
            </h3>
            <p className="text-xs text-slate-500">
              Cetak label stiker inventaris dan persediaan massal dengan layout grid stiker A4 & Tom-Jerry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBackToGenerator && (
            <button
              type="button"
              onClick={onBackToGenerator}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Kembali ke Generator BA
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || labelsToPrint.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            {isGeneratingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Unduh PDF ({labelsToPrint.length} Label)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDirect}
            disabled={labelsToPrint.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Langsung (Print)</span>
          </button>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Data Selection & Settings */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Source Mode Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Sumber Data Label:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceMode('ITEMS')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  sourceMode === 'ITEMS'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Master Barang ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceMode('ASSETS')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  sourceMode === 'ASSETS'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Daftar Aset ({assets.length})</span>
              </button>
            </div>
          </div>

          {/* 2. Items / Assets Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Pilih Item ({currentSelectedCount} Dipilih)
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                {sourceMode === 'ITEMS'
                  ? filteredItems.every((i) => selectedItemIds.includes(i.ID))
                    ? 'Batal Semua'
                    : 'Pilih Semua Filter'
                  : filteredAssets.every((a) => selectedAssetIds.includes(a.ID))
                  ? 'Batal Semua'
                  : 'Pilih Semua Filter'}
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode / nama..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 max-w-[120px]"
              >
                <option value="ALL">Semua Kategori</option>
                {currentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-1 bg-slate-50/50 custom-scrollbar">
              {sourceMode === 'ITEMS' ? (
                filteredItems.map((item) => {
                  const isChecked = selectedItemIds.includes(item.ID);
                  return (
                    <div
                      key={item.ID}
                      onClick={() => handleToggleSelectItem(item.ID)}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-100/70 text-blue-950 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-mono text-[10px] text-blue-700 mr-1.5 font-bold">
                            {item.KODE_BARANG}
                          </span>
                          <span className="truncate">{item.NAMA_BARANG}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {item.JENIS_SATUAN}
                      </span>
                    </div>
                  );
                })
              ) : (
                filteredAssets.map((asset) => {
                  const isChecked = selectedAssetIds.includes(asset.ID);
                  return (
                    <div
                      key={asset.ID}
                      onClick={() => handleToggleSelectAsset(asset.ID)}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-100/70 text-blue-950 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-mono text-[10px] text-blue-700 mr-1.5 font-bold">
                            {asset.KODE_ASET}
                          </span>
                          <span className="truncate">{asset.NAMA_BARANG}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {asset.LOKASI}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Sheet Layout & Visual Customizer */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Format Tata Letak & Grid Stiker</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Ukuran & Preset Kertas</label>
                <select
                  value={layoutPreset}
                  onChange={(e) => setLayoutPreset(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700"
                >
                  <option value="a4_2x5">A4 - Grid 2×5 (10 Stiker Besar)</option>
                  <option value="a4_3x7">A4 - Grid 3×7 (21 Stiker Sedang)</option>
                  <option value="a4_4x8">A4 - Grid 4×8 (32 Stiker Kompak)</option>
                  <option value="tj_108">Tom & Jerry 108 (38×19 mm)</option>
                  <option value="tj_121">Tom & Jerry 121 (38×75 mm)</option>
                  <option value="thermal_50x30">Thermal Roll (50×30 mm)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Jumlah Salinan / Item</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={copiesPerItem}
                  onChange={(e) => setCopiesPerItem(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700"
                />
              </div>
            </div>

            {/* Field Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Atribut Label yang Ditampilkan
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeSchoolKop}
                    onChange={(e) => setIncludeSchoolKop(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Kop / Nama Sekolah</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeCode}
                    onChange={(e) => setIncludeCode(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Kode Barang / Aset</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeCategory}
                    onChange={(e) => setIncludeCategory(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Kategori / Golongan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Lokasi Ruangan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeCondition}
                    onChange={(e) => setIncludeCondition(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Status / Kondisi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeTahun}
                    onChange={(e) => setIncludeTahun(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Tahun Perolehan</span>
                </label>
              </div>
            </div>

            {/* Theme & Border */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Warna Aksen</label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                >
                  <option value="emerald">Hijau Dinas (Emerald)</option>
                  <option value="navy">Biru Resmi (Navy)</option>
                  <option value="slate">Abu-abu (Slate)</option>
                  <option value="monochrome">Hitam Putih (Monochrome)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Gaya Bingkai</label>
                <select
                  value={borderStyle}
                  onChange={(e) => setBorderStyle(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                >
                  <option value="double">Garis Ganda (Double)</option>
                  <option value="single">Garis Tunggal (Single)</option>
                  <option value="rounded">Sudut Melengkung (Rounded)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Sheet Preview */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden relative">
          {/* Top Zoom Controls */}
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between text-white text-xs mb-3 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Pratinjau Lembar Stiker:</span>
              </span>

              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-blue-400 font-bold px-1.5">{zoomLevel}%</span>

              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(180, prev + 15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400"
              >
                100%
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Total <strong className="text-white">{labelsToPrint.length}</strong> Stiker Siap Cetak
            </div>
          </div>

          {/* Printable Canvas Container */}
          <div className="flex-1 overflow-auto bg-slate-800/60 rounded-xl p-4 flex justify-center custom-scrollbar">
            <div
              id="printable-label-sheet"
              className="bg-white text-slate-900 shadow-2xl p-4 transition-all duration-150 origin-top rounded-sm"
              style={{
                width: `${zoomLevel}%`,
                minWidth: '320px',
                maxWidth: '800px',
              }}
            >
              {labelsToPrint.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Belum ada item yang dipilih untuk dicetak</p>
                  <p className="text-[11px]">Silakan pilih barang atau aset pada panel sebelah kiri</p>
                </div>
              ) : (
                <div className={`grid ${gridColsClass} gap-2.5`}>
                  {labelsToPrint.map((label, idx) => {
                    const qrUrl = qrCodeDataUrls[label.code];
                    return (
                      <div
                        key={idx}
                        className={`bg-white p-2.5 flex flex-col justify-between transition-all ${
                          borderStyle === 'double'
                            ? 'border-2 border-double'
                            : borderStyle === 'rounded'
                            ? 'border rounded-xl'
                            : 'border'
                        } ${
                          colorTheme === 'emerald'
                            ? 'border-emerald-700'
                            : colorTheme === 'navy'
                            ? 'border-blue-900'
                            : colorTheme === 'monochrome'
                            ? 'border-black'
                            : 'border-slate-700'
                        }`}
                        style={{ minHeight: '110px' }}
                      >
                        {/* Header Kop */}
                        {includeSchoolKop && (
                          <div
                            className={`text-[9px] font-bold text-center py-0.5 px-1 rounded-xs tracking-wider mb-1.5 ${
                              colorTheme === 'emerald'
                                ? 'bg-emerald-100 text-emerald-900'
                                : colorTheme === 'navy'
                                ? 'bg-blue-100 text-blue-900'
                                : colorTheme === 'monochrome'
                                ? 'bg-slate-200 text-black'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {config.SCHOOL_NAME || 'SDN TANGERANG 6'}
                          </div>
                        )}

                        {/* Content Body */}
                        <div className="flex items-center gap-2">
                          {/* QR Code */}
                          <div className="shrink-0 bg-white p-1 border border-slate-200 rounded">
                            {qrUrl ? (
                              <img
                                src={qrUrl}
                                alt={`QR-${label.code}`}
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 animate-pulse rounded" />
                            )}
                          </div>

                          {/* Text Data */}
                          <div className="text-[10px] space-y-0.5 truncate leading-tight flex-1">
                            <div className="font-bold text-slate-800 truncate" title={label.name}>
                              {label.name}
                            </div>
                            {includeCode && (
                              <div className="font-mono text-[9px] font-bold text-blue-700">
                                {label.code}
                              </div>
                            )}
                            {includeLocation && label.location && (
                              <div className="text-[9px] text-slate-500 truncate">
                                📍 {label.location}
                              </div>
                            )}
                            {includeCategory && label.category && (
                              <div className="text-[9px] text-slate-500 truncate">
                                🏷️ {label.category}
                              </div>
                            )}
                            {includeCondition && label.condition && (
                              <div className="text-[8px] font-medium text-emerald-700">
                                ✓ {label.condition}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Subtext */}
                        <div className="text-[7.5px] text-slate-400 text-right pt-1 border-t border-slate-100 mt-1">
                          Inventaris Resmi Sekolah
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
