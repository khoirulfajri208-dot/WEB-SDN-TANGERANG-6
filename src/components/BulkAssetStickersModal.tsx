import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  X,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Filter,
  RefreshCw,
  FolderOpen,
  Sliders,
  Palette,
  Eye,
  UserCheck,
} from 'lucide-react';
import { Asset, Config, User } from '../types';
import { db } from '../services/localStorageService';
import { qrService } from '../services/qrService';
import jsPDF from 'jspdf';

interface BulkAssetStickersModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

export const BulkAssetStickersModal: React.FC<BulkAssetStickersModalProps> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const config = db.getConfig();
  const users = db.getUsers();

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [copiesPerAsset, setCopiesPerAsset] = useState<number>(1);
  const [gridColumns, setGridColumns] = useState<2 | 3>(2);

  // Layout & Content Toggles
  const [includeKop, setIncludeKop] = useState(true);
  const [kopText, setKopText] = useState('UPT SATUAN PENDIDIKAN');
  const [includeSchoolName, setIncludeSchoolName] = useState(true);
  const [includeCategory, setIncludeCategory] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includePj, setIncludePj] = useState(true);
  const [includeNip, setIncludeNip] = useState(true);
  const [includeTahun, setIncludeTahun] = useState(true);
  const [includeCondition, setIncludeCondition] = useState(true);

  // Styling
  const [colorTheme, setColorTheme] = useState<'emerald' | 'navy' | 'slate' | 'monochrome'>('emerald');
  const [borderStyle, setBorderStyle] = useState<'double' | 'single' | 'rounded'>('double');

  const [filterKib, setFilterKib] = useState('ALL');
  const [search, setSearch] = useState('');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper to find NIP for a given PJ name
  const findNip = (pjName?: string): string => {
    if (!pjName) return '';
    const u = users.find((user) => {
      const name = (user as any).NAMA_LENGKAP || user.NAMA || '';
      return (
        name.toLowerCase().includes(pjName.toLowerCase()) ||
        pjName.toLowerCase().includes(name.toLowerCase())
      );
    });
    return u?.NIP || '';
  };

  // Initialize selected assets when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAssetIds(assets.map((a) => a.ID));
    }
  }, [isOpen, assets]);

  // Generate QR codes for all assets with Dual-Mode URLs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateAllQr = async () => {
      const urls: Record<string, string> = {};
      const fg =
        colorTheme === 'emerald'
          ? '#14532d'
          : colorTheme === 'navy'
          ? '#1e3a8a'
          : colorTheme === 'monochrome'
          ? '#000000'
          : '#334155';

      for (const asset of assets) {
        let qrContent = `${window.location.origin}/?scan=${encodeURIComponent(asset.KODE_ASET)}`;
        if (asset.DRIVE_FILE_URL) {
          qrContent += `&drive=${encodeURIComponent(asset.DRIVE_FILE_URL)}`;
        }
        const dataUrl = await qrService.generateQRCode(qrContent, 240, fg);
        urls[asset.KODE_ASET] = dataUrl;
      }
      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };

    generateAllQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen, assets, colorTheme]);

  if (!isOpen) return null;

  const filteredAssets = assets.filter((asset) => {
    const matchSearch =
      !search ||
      asset.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      asset.KODE_ASET.toLowerCase().includes(search.toLowerCase()) ||
      asset.LOKASI.toLowerCase().includes(search.toLowerCase());
    const matchKib = filterKib === 'ALL' || asset.KIB_KATEGORI === filterKib || asset.KATEGORI === filterKib;
    return matchSearch && matchKib;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredAssets.map((a) => a.ID);
    const allSelected = filteredIds.every((id) => selectedAssetIds.includes(id));
    if (allSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const stickersToPrint: Asset[] = [];
  assets
    .filter((a) => selectedAssetIds.includes(a.ID))
    .forEach((asset) => {
      for (let c = 0; c < copiesPerAsset; c++) {
        stickersToPrint.push(asset);
      }
    });

  const handleExportPDF = async () => {
    if (stickersToPrint.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const cols = gridColumns;
      const gap = 4;
      const labelWidth = (usableWidth - (cols - 1) * gap) / cols;
      const labelHeight = cols === 2 ? 48 : 38;
      const rowsPerPage = Math.floor((pageHeight - margin * 2) / (labelHeight + gap));
      const labelsPerPage = cols * rowsPerPage;

      // Color pallete mapping
      const colors = {
        emerald: { primary: [20, 83, 45], accent: [22, 101, 52], line: [187, 247, 208] },
        navy: { primary: [30, 58, 138], accent: [37, 99, 235], line: [191, 219, 254] },
        slate: { primary: [51, 65, 85], accent: [71, 85, 105], line: [226, 232, 240] },
        monochrome: { primary: [0, 0, 0], accent: [20, 20, 20], line: [200, 200, 200] },
      }[colorTheme];

      let labelIndexOnPage = 0;

      for (let i = 0; i < stickersToPrint.length; i++) {
        const asset = stickersToPrint[i];

        if (labelIndexOnPage >= labelsPerPage) {
          doc.addPage();
          labelIndexOnPage = 0;
        }

        const colIndex = labelIndexOnPage % cols;
        const rowIndex = Math.floor(labelIndexOnPage / cols);
        const currentX = margin + colIndex * (labelWidth + gap);
        const currentY = margin + rowIndex * (labelHeight + gap);

        // Outer Container Box
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(borderStyle === 'double' ? 0.7 : 0.5);
        if (borderStyle === 'rounded') {
          doc.roundedRect(currentX, currentY, labelWidth, labelHeight, 2.5, 2.5, 'S');
        } else {
          doc.rect(currentX, currentY, labelWidth, labelHeight, 'S');
        }

        // Inner border if double
        if (borderStyle === 'double') {
          doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
          doc.setLineWidth(0.2);
          doc.rect(currentX + 0.8, currentY + 0.8, labelWidth - 1.6, labelHeight - 1.6, 'S');
        }

        // Draw Left QR code
        const qrSize = cols === 2 ? 32 : 23;
        const qrMargin = (labelHeight - qrSize) / 2;
        const qrDataUrl = qrCodeDataUrls[asset.KODE_ASET];

        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', currentX + 3, currentY + qrMargin, qrSize, qrSize);
        }

        // Draw vertical separator
        const textStartX = currentX + qrSize + 5;
        doc.setDrawColor(colors.line[0], colors.line[1], colors.line[2]);
        doc.setLineWidth(0.3);
        doc.line(textStartX - 1.5, currentY + 3, textStartX - 1.5, currentY + labelHeight - 3);

        const textWidth = labelWidth - (qrSize + 8);
        let textY = currentY + (cols === 2 ? 4.8 : 3.8);

        // 1. Kop Instansi
        if (includeKop) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(cols === 2 ? 5.8 : 5);
          doc.setTextColor(100, 116, 139);
          doc.text(kopText.toUpperCase(), textStartX, textY);
          textY += cols === 2 ? 3.2 : 2.6;
        }

        // 2. School Name
        if (includeSchoolName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(cols === 2 ? 7 : 5.8);
          doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.text(doc.splitTextToSize(config.SCHOOL_NAME.toUpperCase(), textWidth)[0], textStartX, textY);
          textY += cols === 2 ? 3.8 : 3;
        }

        // 3. Kode Aset
        doc.setFont('courier', 'bold');
        doc.setFontSize(cols === 2 ? 9.5 : 7.8);
        doc.setTextColor(15, 23, 42);
        doc.text(asset.KODE_ASET, textStartX, textY);
        textY += cols === 2 ? 4 : 3.2;

        // 4. Nama Aset + Kategori
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cols === 2 ? 7.8 : 6.5);
        doc.setTextColor(30, 41, 59);
        const catSuffix = includeCategory ? ` [${asset.KIB_KATEGORI || 'KIB B'}]` : '';
        const nameLines = doc.splitTextToSize(`${asset.NAMA_BARANG}${catSuffix}`, textWidth);
        doc.text(nameLines.slice(0, 2), textStartX, textY);
        textY += (cols === 2 ? 3.5 : 2.8) * Math.min(nameLines.length, 2);

        // 5. Penanggung Jawab & NIP
        const nip = findNip(asset.PENANGGUNG_JAWAB);
        if (includePj || (includeNip && nip)) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(cols === 2 ? 6 : 5.2);
          doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
          let pjStr = '';
          if (includePj) pjStr += `PJ: ${asset.PENANGGUNG_JAWAB || 'Pengurus'}`;
          if (includeNip && nip) pjStr += ` (NIP: ${nip})`;
          doc.text(doc.splitTextToSize(pjStr, textWidth)[0], textStartX, textY);
          textY += cols === 2 ? 3.2 : 2.6;
        }

        // 6. Meta Baris Bawah: Lokasi, Tahun, Kondisi
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(cols === 2 ? 5.8 : 5);
        doc.setTextColor(71, 85, 105);

        const metaParts = [
          includeLocation ? `Lok: ${asset.LOKASI}` : '',
          includeTahun ? `Thn: ${asset.TAHUN_PEROLEHAN}` : '',
          includeCondition ? `Kondisi: ${asset.KONDISI}` : '',
        ].filter(Boolean);

        if (metaParts.length > 0) {
          doc.text(doc.splitTextToSize(metaParts.join(' • '), textWidth)[0], textStartX, textY);
        }

        labelIndexOnPage++;
      }

      doc.save(`STIKER_ASET_MASSAL_A4_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-800 text-emerald-200">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Kustomisasi & Cetak Stiker QR Massal (Lembar A4)
              </h3>
              <p className="text-xs text-emerald-200/80">
                Atur informasi Nama Aset, Kategori KIB, NIP Penanggung Jawab, tema warna, dan kisi stiker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Customization Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Col 1: Grid & Layout */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-800" />
                Format Kisi & Tema Warna
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGridColumns(2)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gridColumns === 2
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  2 Kolom (Besar)
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(3)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gridColumns === 3
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  3 Kolom (Kompak)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tema Warna:
                  </label>
                  <select
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-emerald-700"
                  >
                    <option value="emerald">Emerald (Kedinasan)</option>
                    <option value="navy">Navy (Pemerintah)</option>
                    <option value="slate">Slate (Netral)</option>
                    <option value="monochrome">Hitam B/W (Hemat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kopi per Unit:
                  </label>
                  <select
                    value={copiesPerAsset}
                    onChange={(e) => setCopiesPerAsset(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-emerald-700"
                  >
                    <option value={1}>1 Stiker / Aset</option>
                    <option value={2}>2 Stiker / Aset</option>
                    <option value={3}>3 Stiker / Aset</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Col 2: Content Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-800" />
                Informasi yang Muncul:
              </label>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeKop}
                    onChange={(e) => setIncludeKop(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Kop Instansi
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSchoolName}
                    onChange={(e) => setIncludeSchoolName(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Nama Sekolah
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategory}
                    onChange={(e) => setIncludeCategory(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Kategori KIB
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Ruangan / Lokasi
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePj}
                    onChange={(e) => setIncludePj(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Nama Penanggung Jawab
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-bold text-emerald-950">
                  <input
                    type="checkbox"
                    checked={includeNip}
                    onChange={(e) => setIncludeNip(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  NIP Penanggung Jawab
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTahun}
                    onChange={(e) => setIncludeTahun(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Tahun Perolehan
                </label>
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCondition}
                    onChange={(e) => setIncludeCondition(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Status Kondisi
                </label>
              </div>
            </div>

            {/* Col 3: Export Summary */}
            <div className="flex flex-col justify-between space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ringkasan Lembar PDF
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  {selectedAssetIds.length} Aset Terpilih
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  Total {stickersToPrint.length} stiker • {gridColumns} Kolom A4
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf || stickersToPrint.length === 0}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Download size={15} className={isGeneratingPdf ? 'animate-bounce' : ''} />
                  {isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF Stiker Siap Cetak'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Selection Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  {filteredAssets.every((a) => selectedAssetIds.includes(a.ID)) ? (
                    <>
                      <CheckSquare size={14} /> Batalkan Semua ({filteredAssets.length})
                    </>
                  ) : (
                    <>
                      <Square size={14} /> Pilih Semua ({filteredAssets.length})
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedAssetIds.length} dari {assets.length} aset terpilih
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama aset, kode, ruang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700"
                />
                <select
                  value={filterKib}
                  onChange={(e) => setFilterKib(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-emerald-700"
                >
                  <option value="ALL">Semua Golongan KIB</option>
                  <option value="KIB A">KIB A (Tanah)</option>
                  <option value="KIB B">KIB B (Peralatan & Mesin)</option>
                  <option value="KIB C">KIB C (Gedung & Bangunan)</option>
                  <option value="KIB D">KIB D (Jalan & Jaringan)</option>
                  <option value="KIB E">KIB E (Aset Tetap Lainnya)</option>
                </select>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-xl">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.ID);
                const nip = findNip(asset.PENANGGUNG_JAWAB);
                return (
                  <button
                    key={asset.ID}
                    type="button"
                    onClick={() => handleToggleSelect(asset.ID)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 text-emerald-800">
                      {isSelected ? <CheckSquare size={15} /> : <Square size={15} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                        {asset.KODE_ASET}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate" title={asset.NAMA_BARANG}>
                        {asset.NAMA_BARANG}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {asset.LOKASI} • PJ: {asset.PENANGGUNG_JAWAB} {nip ? `(${nip})` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Label stiker siap tempel dan mendukung dual-mode scanning (In-App + Google Drive).
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
