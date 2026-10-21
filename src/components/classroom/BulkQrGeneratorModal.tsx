import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode, X, Download, RefreshCw, CheckCircle2, AlertCircle,
  FolderArchive, School, User, Layers, Printer, Eye, ArrowLeft,
  Scissors, Tag, Sliders, Sparkles, FileText, Check, Palette
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Account } from '../../types/classroom';

export type PaperSize = 'A4' | 'LETTER' | 'F4';
export type LayoutTemplate = 'CARD_4' | 'STICKER_8' | 'STICKER_12' | 'STICKER_24';

export interface QrColorPreset {
  id: string;
  name: string;
  fg: string;
  bg: string;
  badge: string;
  headerBg?: string;
}

export const QR_COLOR_PRESETS: QrColorPreset[] = [
  { id: 'navy', name: 'Navy & Putih', fg: '#0f172a', bg: '#ffffff', badge: 'bg-slate-900 text-white', headerBg: '#1e3a8a' },
  { id: 'royal_blue', name: 'Biru Royal', fg: '#1e3a8a', bg: '#eff6ff', badge: 'bg-blue-900 text-blue-100', headerBg: '#1e40af' },
  { id: 'emerald', name: 'Emerald', fg: '#065f46', bg: '#ecfdf5', badge: 'bg-emerald-900 text-emerald-100', headerBg: '#065f46' },
  { id: 'purple', name: 'Ungu Elegan', fg: '#581c87', bg: '#faf5ff', badge: 'bg-purple-900 text-purple-100', headerBg: '#6b21a8' },
  { id: 'maroon', name: 'Maroon', fg: '#881337', bg: '#fff1f2', badge: 'bg-rose-900 text-rose-100', headerBg: '#9f1239' },
  { id: 'amber', name: 'Amber Cokelat', fg: '#78350f', bg: '#fffbeb', badge: 'bg-amber-900 text-amber-100', headerBg: '#854d0e' },
  { id: 'teal', name: 'Teal Modern', fg: '#134e4a', bg: '#f0fdfa', badge: 'bg-teal-900 text-teal-100', headerBg: '#0f766e' },
  { id: 'monochrome', name: 'Hitam Standar', fg: '#000000', bg: '#ffffff', badge: 'bg-black text-white', headerBg: '#1e293b' },
];

interface BulkQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Account[];
  selectedClass?: string;
  items?: Array<{ id: string; name: string; code: string; location?: string; category?: string }>;
  title?: string;
}

interface GeneratedItemData {
  id: string;
  name: string;
  code: string;
  subtitle: string;
  extraInfo: string;
  qrDataUrl: string;
  cardDataUrl: string;
  rawPayload: string;
}

export const BulkQrGeneratorModal: React.FC<BulkQrGeneratorModalProps> = ({
  isOpen,
  onClose,
  students = [],
  selectedClass = 'Semua Kelas',
  items = [],
  title,
}) => {
  if (!isOpen) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [currentItemName, setCurrentItemName] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItemData[]>([]);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Color Customization State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('navy');
  const [qrFgColor, setQrFgColor] = useState<string>('#0f172a');
  const [qrBgColor, setQrBgColor] = useState<string>('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [sampleQrDataUrl, setSampleQrDataUrl] = useState<string>('');

  // Print & Sheet Configuration State
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [layoutTemplate, setLayoutTemplate] = useState<LayoutTemplate>('CARD_4');
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);
  const [showSchoolHeader, setShowSchoolHeader] = useState<boolean>(true);
  const [sheetMargin, setSheetMargin] = useState<'compact' | 'normal'>('compact');

  // Compute contrast ratio helper
  const contrastRatio = useMemo(() => {
    const getLuminance = (hex: string) => {
      const cleanHex = hex.replace('#', '');
      const fullHex = cleanHex.length === 3 ? cleanHex.split('').map((c) => c + c).join('') : cleanHex;
      const r = parseInt(fullHex.substring(0, 2), 16) / 255;
      const g = parseInt(fullHex.substring(2, 4), 16) / 255;
      const b = parseInt(fullHex.substring(4, 6), 16) / 255;
      const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    try {
      const l1 = getLuminance(qrFgColor);
      const l2 = getLuminance(qrBgColor);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return Math.round(ratio * 10) / 10;
    } catch {
      return 15;
    }
  }, [qrFgColor, qrBgColor]);

  // Update sample live QR preview when colors change
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL('https://sdntangerang6.sch.id/sample', {
      width: 140,
      margin: 1,
      color: {
        dark: qrFgColor,
        light: qrBgColor,
      },
    })
      .then((url) => {
        if (isMounted) setSampleQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to generate sample QR preview:', err));
    return () => {
      isMounted = false;
    };
  }, [qrFgColor, qrBgColor]);

  const handleSelectPreset = (preset: QrColorPreset) => {
    setSelectedPresetId(preset.id);
    setQrFgColor(preset.fg);
    setQrBgColor(preset.bg);
  };

  const handleSwapColors = () => {
    const prevFg = qrFgColor;
    const prevBg = qrBgColor;
    setQrFgColor(prevBg);
    setQrBgColor(prevFg);
    setSelectedPresetId('custom');
  };

  const handleResetColors = () => {
    setSelectedPresetId('navy');
    setQrFgColor('#0f172a');
    setQrBgColor('#ffffff');
  };

  // Normalize target records: either students or custom items
  const targetRecords = useMemo(() => {
    if (students && students.length > 0) {
      return students.map((s) => ({
        id: s.ID,
        name: s.NAMA,
        code: s.NIP || s.ID,
        subtitle: `Kelas: ${s.KELAS || selectedClass}`,
        extraInfo: `@${s.USERNAME} • NIS: ${s.NIP || '-'}`,
        account: s,
      }));
    }
    if (items && items.length > 0) {
      return items.map((itm) => ({
        id: itm.id,
        name: itm.name,
        code: itm.code,
        subtitle: itm.location || 'Lokasi Sekolah',
        extraInfo: itm.category || 'Aset / Inventaris',
        account: undefined,
      }));
    }
    return [];
  }, [students, items, selectedClass]);

  const totalItems = targetRecords.length;

  const startBulkGeneration = async () => {
    if (targetRecords.length === 0) return;
    setIsProcessing(true);
    setIsCompleted(false);
    setErrorMsg(null);
    setProgressCount(0);
    setGeneratedItems([]);

    const zip = new JSZip();
    const folderName = `QR_${(selectedClass || 'Batch').replace(/\s+/g, '_')}`;
    const folder = zip.folder(folderName) || zip;
    const collectedList: GeneratedItemData[] = [];

    try {
      for (let i = 0; i < targetRecords.length; i++) {
        const record = targetRecords[i];
        setCurrentItemName(record.name);
        setProgressCount(i + 1);

        // 1. Generate QR Payload
        const payload = record.account
          ? JSON.stringify({
              app: 'SDN_TANGERANG_6_CLASSROOM',
              type: 'STUDENT_ID_QR',
              studentId: record.account.ID,
              studentName: record.account.NAMA,
              studentNis: record.account.NIP || '-',
              studentKelas: record.account.KELAS || selectedClass,
              username: record.account.USERNAME,
              verifiedAt: new Date().toISOString(),
            })
          : JSON.stringify({
              app: 'SDN_TANGERANG_6_INVENTARIS',
              type: 'ASSET_ITEM_QR',
              itemId: record.id,
              itemName: record.name,
              itemCode: record.code,
              location: record.subtitle,
              verifiedAt: new Date().toISOString(),
            });

        // 2. Generate QR Code Data URL with customizable FG and BG colors
        const qrDataUrl = await QRCode.toDataURL(payload, {
          width: 340,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: qrFgColor,
            light: qrBgColor,
          },
        });

        // 3. Render High Resolution ID Card Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 650;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const activePreset = QR_COLOR_PRESETS.find((p) => p.id === selectedPresetId);
          const headerFill = activePreset?.headerBg || (qrFgColor !== '#ffffff' ? qrFgColor : '#1e3a8a');

          // Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 650, 800);

          // Card Outer Border
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(10, 10, 630, 780, 24);
          ctx.stroke();

          // Header Themed Background
          ctx.fillStyle = headerFill;
          ctx.beginPath();
          ctx.roundRect(10, 10, 630, 120, [24, 24, 0, 0]);
          ctx.fill();

          // Header Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SD NEGERI TANGERANG 6', 325, 48);

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#93c5fd';
          ctx.fillText(
            record.account ? 'KARTU IDENTITAS DIGITAL & QR TUGAS SISWA' : 'LABEL IDENTITAS ASET & INVENTARIS RESMI',
            325,
            78
          );

          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#bfdbfe';
          ctx.fillText('Tahun Ajaran 2026/2027 • Dinas Pendidikan Kota Tangerang', 325, 102);

          // Info Box
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(40, 150, 570, 130, 16);
          ctx.fill();
          ctx.stroke();

          // Main Name
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(record.name.toUpperCase(), 325, 185);

          // Details
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(`${record.subtitle}    •    ID/NIS: ${record.code}`, 325, 215);

          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#2563eb';
          ctx.fillText(`${record.extraInfo}    •    Status: TERDATA AKTIF`, 325, 245);

          // QR Code Border Wrapper themed with background and foreground colors
          ctx.fillStyle = qrBgColor;
          ctx.strokeStyle = qrFgColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(165, 300, 320, 320, 20);
          ctx.fill();
          ctx.stroke();

          // Draw QR Image onto Canvas
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          ctx.drawImage(img, 180, 315, 290, 290);

          // Badge / Verification Stamp
          ctx.fillStyle = '#065f46';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓ TERVERIFIKASI RESMI DIGITAL', 325, 655);

          // Instructions
          ctx.fillStyle = '#64748b';
          ctx.font = '12px sans-serif';
          ctx.fillText(
            record.account
              ? 'Gunakan kartu ini untuk presensi harian & pemindaian status tugas cepat.'
              : 'Pindai tag QR ini untuk inventarisasi & pemeriksaan kondisi berkala.',
            325,
            695
          );
          ctx.fillText(`ID Dokumen: ${record.id} • Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 325, 725);

          // Footer Strip
          ctx.fillStyle = headerFill;
          ctx.beginPath();
          ctx.roundRect(10, 755, 630, 35, [0, 0, 24, 24]);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SISTEM INFORMASI AKADEMIK SDN TANGERANG 6', 325, 777);

          // Convert Canvas to PNG Base64 and add to ZIP
          const cardDataUrl = canvas.toDataURL('image/png');
          const base64Data = cardDataUrl.replace(/^data:image\/png;base64,/, '');

          const cleanName = record.name.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `QR_${(selectedClass || 'Item').replace(/\s+/g, '_')}_${record.code}_${cleanName}.png`;
          folder.file(fileName, base64Data, { base64: true });

          collectedList.push({
            id: record.id,
            name: record.name,
            code: record.code,
            subtitle: record.subtitle,
            extraInfo: record.extraInfo,
            qrDataUrl,
            cardDataUrl,
            rawPayload: payload,
          });
        }
      }

      setGeneratedItems(collectedList);

      // Generate ZIP archive blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Failed to generate bulk QR ZIP:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pembuatan QR ZIP');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !isCompleted && !isProcessing && progressCount === 0) {
      startBulkGeneration();
    }
  }, [isOpen]);

  const percentage = totalItems > 0 ? Math.round((progressCount / totalItems) * 100) : 0;

  // Items per page based on layout template
  const itemsPerPage = useMemo(() => {
    switch (layoutTemplate) {
      case 'CARD_4':
        return 4;
      case 'STICKER_8':
        return 8;
      case 'STICKER_12':
        return 12;
      case 'STICKER_24':
        return 24;
      default:
        return 4;
    }
  }, [layoutTemplate]);

  const totalPages = Math.ceil(generatedItems.length / itemsPerPage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Printable CSS style for window.print() with specific Paper Size support */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'A4' ? 'A4 portrait' : paperSize === 'LETTER' ? 'letter portrait' : '215mm 330mm portrait'};
            margin: ${sheetMargin === 'compact' ? '6mm' : '10mm'};
          }
          body * {
            visibility: hidden;
          }
          #bulk-qr-print-area, #bulk-qr-print-area * {
            visibility: visible;
          }
          #bulk-qr-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Main Container */}
      <div
        className={`bg-white w-full ${
          isPrintPreview ? 'max-w-5xl max-h-[94vh]' : 'max-w-2xl max-h-[92vh]'
        } rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 my-auto`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-black text-sm border border-indigo-400/30 shadow-xs">
              <FolderArchive size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {title || 'Bulk QR Generator & Cetak Lembar Stiker'}
              </h3>
              <p className="text-xs text-slate-300 font-semibold">
                {selectedClass} • {totalItems} Data Siap Diproses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPrintPreview && (
              <button
                type="button"
                onClick={() => setIsPrintPreview(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isPrintPreview ? (
          /* PRINT PREVIEW WITH PAPER SIZE, COLOR THEME & TEMPLATE SELECTION */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Control Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Printer size={15} className="text-indigo-600" />
                    Pengaturan Cetak Lembar Stiker QR ({generatedItems.length} Tag)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pilih ukuran kertas, tata letak stiker, opsi warna, dan garis potong sesuai kebutuhan pencetakan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer transition active:scale-95"
                  >
                    <Printer size={14} /> Cetak Sekarang ({paperSize} • {totalPages} Halaman)
                  </button>
                </div>
              </div>

              {/* Selector Tools: Paper Size, Template, Colors, Cut Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
                {/* 1. Paper Size Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Ukuran Kertas
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-indigo-600 shadow-2xs"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="LETTER">Letter (8.5 × 11 in)</option>
                    <option value="F4">F4 / Folio (215 × 330 mm)</option>
                  </select>
                </div>

                {/* 2. Layout Template Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Template Tata Letak
                  </label>
                  <select
                    value={layoutTemplate}
                    onChange={(e) => setLayoutTemplate(e.target.value as LayoutTemplate)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-indigo-600 shadow-2xs"
                  >
                    <option value="CARD_4">🪪 Kartu ID (4 / lembar)</option>
                    <option value="STICKER_8">🏷️ Stiker Meja (8 / lembar)</option>
                    <option value="STICKER_12">🔖 Stiker Tag (12 / lembar)</option>
                    <option value="STICKER_24">📦 Mini QR Tag (24 / lembar)</option>
                  </select>
                </div>

                {/* 3. Color Theme Quick Switcher */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Tema Warna QR
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => {
                      const preset = QR_COLOR_PRESETS.find((p) => p.id === e.target.value);
                      if (preset) {
                        handleSelectPreset(preset);
                      } else {
                        setSelectedPresetId('custom');
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-indigo-600 shadow-2xs"
                  >
                    {QR_COLOR_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="custom">Kustom (FG: {qrFgColor})</option>
                  </select>
                </div>

                {/* 4. Cut Marks Toggle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Garis Potong
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCutMarks(!showCutMarks)}
                    className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center justify-between transition-colors shadow-2xs ${
                      showCutMarks
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Scissors size={13} className={showCutMarks ? 'text-indigo-600' : 'text-slate-400'} />
                      <span>{showCutMarks ? 'Aktif' : 'Tanpa Garis'}</span>
                    </span>
                    {showCutMarks && <Check size={13} className="text-indigo-600" />}
                  </button>
                </div>

                {/* 5. Margin Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Margin Cetak
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSheetMargin('compact')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition ${
                        sheetMargin === 'compact'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Rapat (6mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetMargin('normal')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition ${
                        sheetMargin === 'normal'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Standar (10mm)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Sheet Preview & Printable Area */}
            <div
              id="bulk-qr-print-area"
              className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-8 bg-slate-100/70"
            >
              {/* Render Sheets / Pages */}
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const pageItems = generatedItems.slice(
                  pageIdx * itemsPerPage,
                  (pageIdx + 1) * itemsPerPage
                );

                return (
                  <div
                    key={`page-${pageIdx}`}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mx-auto max-w-4xl ${
                      pageIdx < totalPages - 1 ? 'page-break' : ''
                    }`}
                  >
                    {/* Header Sheet Info (Hidden in print) */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-[11px] text-slate-400 font-bold no-print">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <School size={14} className="text-indigo-600" />
                        SD NEGERI TANGERANG 6 — Lembar {pageIdx + 1} dari {totalPages} ({paperSize})
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600">
                        {pageItems.length} Tag di Lembar Ini
                      </span>
                    </div>

                    {/* TEMPLATE 1: CARD_4 (4 Full Cards per page / 2x2 Grid) */}
                    {layoutTemplate === 'CARD_4' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pageItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`bg-white p-2 rounded-2xl flex flex-col items-center break-inside-avoid ${
                              showCutMarks ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                            }`}
                          >
                            <img
                              src={item.cardDataUrl}
                              alt={`Kartu QR ${item.name}`}
                              className="w-full h-auto rounded-xl shadow-xs object-contain"
                            />
                            {showCutMarks && (
                              <div className="w-full mt-1.5 px-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold no-print">
                                <span>#{pageIdx * itemsPerPage + idx + 1} {item.name}</span>
                                <span>✂️ Garis Potong</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TEMPLATE 2: STICKER_8 (8 Desk/Book Stickers per page / 2x4 Grid) */}
                    {layoutTemplate === 'STICKER_8' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {pageItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`bg-white p-3 rounded-2xl flex items-center gap-3 break-inside-avoid shadow-2xs ${
                              showCutMarks ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                            }`}
                          >
                            {/* QR Code */}
                            <div
                              className="w-20 h-20 shrink-0 rounded-xl p-1 border border-slate-200 flex items-center justify-center"
                              style={{ backgroundColor: qrBgColor }}
                            >
                              <img src={item.qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            {/* Sticker Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  SDN TANGERANG 6
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  #{pageIdx * itemsPerPage + idx + 1}
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-slate-900 truncate leading-tight">
                                {item.name}
                              </h5>
                              <p className="text-[10px] font-bold text-slate-600 truncate">{item.subtitle}</p>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                                <span>ID: {item.code}</span>
                                <span className="text-emerald-700 font-bold">✓ RESMI DIGITAL</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TEMPLATE 3: STICKER_12 (12 Tag Stickers per page / 3x4 Grid) */}
                    {layoutTemplate === 'STICKER_12' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {pageItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`bg-white p-2.5 rounded-xl flex flex-col items-center text-center break-inside-avoid ${
                              showCutMarks ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                            }`}
                          >
                            <div className="w-full flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                              <span className="text-blue-700 font-bold">SDN TANGERANG 6</span>
                              <span>#{pageIdx * itemsPerPage + idx + 1}</span>
                            </div>
                            <div
                              className="w-16 h-16 rounded-lg p-0.5 border border-slate-100 flex items-center justify-center"
                              style={{ backgroundColor: qrBgColor }}
                            >
                              <img src={item.qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            <h6 className="text-[11px] font-black text-slate-900 truncate w-full mt-1">
                              {item.name}
                            </h6>
                            <p className="text-[9px] text-slate-500 truncate w-full">{item.subtitle}</p>
                            <span className="text-[8px] font-mono text-indigo-700 font-bold">{item.code}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TEMPLATE 4: STICKER_24 (24 Mini Asset/Student QR Tags / 4x6 Grid) */}
                    {layoutTemplate === 'STICKER_24' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {pageItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`bg-white p-2 rounded-xl flex flex-col items-center text-center break-inside-avoid ${
                              showCutMarks ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-md p-0.5 border border-slate-100 flex items-center justify-center"
                              style={{ backgroundColor: qrBgColor }}
                            >
                              <img src={item.qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[9px] font-black text-slate-900 truncate w-full mt-0.5">
                              {item.name}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500 font-semibold">{item.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STANDARD PROGRESS, DOWNLOAD & COLOR CUSTOMIZATION VIEW */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
            {/* 1. COLOR CUSTOMIZATION ACCORDION / PANEL */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Palette size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      Kustomisasi Warna QR Code & Estetika Cetak
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pilih palet resmi atau tentukan warna foreground & background sesuai stiker sekolah.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      contrastRatio >= 4.5
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Kontras: {contrastRatio}:1 {contrastRatio >= 4.5 ? '✓ Optimal' : '⚠️ Rendah'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
                  >
                    {showColorPicker ? 'Tutup Pilihan Warna' : 'Pilih Warna Kustom'}
                  </button>
                </div>
              </div>

              {/* Color Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QR_COLOR_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-100/70 border-slate-200 text-slate-700'
                      }`}
                    >
                      {/* Swatch */}
                      <div
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-xs"
                          style={{ backgroundColor: preset.fg }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">
                          {preset.fg}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Expandable Custom Color Pickers & Live Preview */}
              {showColorPicker && (
                <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border">
                  {/* Foreground Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Warna QR (Foreground)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrFgColor}
                        disabled={isProcessing}
                        onChange={(e) => {
                          setQrFgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={qrFgColor}
                        disabled={isProcessing}
                        onChange={(e) => {
                          setQrFgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-800 focus:outline-indigo-600"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  {/* Background Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Warna Latar (Background)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrBgColor}
                        disabled={isProcessing}
                        onChange={(e) => {
                          setQrBgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={qrBgColor}
                        disabled={isProcessing}
                        onChange={(e) => {
                          setQrBgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-800 focus:outline-indigo-600"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Live Mini Preview & Swap Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block text-center">
                        Pratinjau Hasil
                      </label>
                      <div
                        className="w-16 h-16 rounded-xl p-1 border border-slate-200 flex items-center justify-center shadow-2xs mx-auto"
                        style={{ backgroundColor: qrBgColor }}
                      >
                        {sampleQrDataUrl ? (
                          <img
                            src={sampleQrDataUrl}
                            alt="Sample QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode size={30} style={{ color: qrFgColor }} />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleSwapColors}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 cursor-pointer"
                        title="Tukar warna Foreground & Background"
                      >
                        <RefreshCw size={12} /> Tukar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleResetColors}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 transition text-center cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action: Regenerate with new colors button (if completed) */}
              {isCompleted && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500">
                    Warna QR saat ini:{' '}
                    <strong className="font-mono text-slate-800">{qrFgColor}</strong> pada{' '}
                    <strong className="font-mono text-slate-800">{qrBgColor}</strong>
                  </p>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={startBulkGeneration}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={13} /> Terapkan Warna & Buat Ulang ({totalItems} Tag)
                  </button>
                </div>
              )}
            </div>

            {/* 2. PROGRESS / COMPLETION / ERROR CARDS */}
            {isProcessing ? (
              <div className="p-6 space-y-4 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-inner animate-pulse">
                  <RefreshCw size={24} className="animate-spin" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">
                    Membuat Tag & Kartu QR ({progressCount} / {totalItems})
                  </h4>
                  <p className="text-xs text-slate-500 truncate max-w-xs mx-auto">
                    Memproses: <strong className="text-blue-700 font-bold">{currentItemName || 'Menyiapkan...'}</strong>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 max-w-md mx-auto">
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-200"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                    <span>Progres Pembuatan</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              </div>
            ) : isCompleted ? (
              <div className="p-6 space-y-4 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                  <CheckCircle2 size={30} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">
                    Tag & Kartu QR Berhasil Digenerasi!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Semua <strong className="text-slate-800 font-bold">{totalItems} tag QR</strong> telah digenerasi dengan warna kustom dalam resolusi tinggi dan siap dicetak ke lembar stiker (A4 / Letter) atau diunduh sebagai file ZIP.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1 text-left max-w-lg mx-auto">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                    Pilihan Layout Lembar Stiker Siap Cetak:
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed pl-4">
                    Tersedia template Kartu ID (4/lembar), Stiker Meja/Buku (8/lembar), Stiker Tag (12/lembar), dan Mini QR Aset (24/lembar) dengan ukuran kertas A4, Letter, atau F4.
                  </p>
                </div>

                {/* Actions: Open Print Layout Sheet or Download ZIP */}
                <div className="space-y-2 pt-1 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setIsPrintPreview(true)}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
                  >
                    <Printer size={15} /> Cetak Lembar Stiker QR (Pilih Ukuran A4 / Letter)
                  </button>

                  {downloadUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `QR_Tag_${(selectedClass || 'Batch').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
                        link.click();
                      }}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      <Download size={14} /> Unduh Seluruh File PNG (.zip)
                    </button>
                  )}
                </div>
              </div>
            ) : errorMsg ? (
              <div className="p-6 space-y-3 text-center bg-white rounded-2xl border border-rose-200">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle size={24} />
                </div>
                <h4 className="text-sm font-bold text-rose-900">Gagal Membuat QR</h4>
                <p className="text-xs text-slate-500">{errorMsg}</p>
                <button
                  type="button"
                  onClick={startBulkGeneration}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
          <span className="text-[10px] text-slate-400 font-medium">
            Format: Lembar Stiker (A4/Letter) & PNG High DPI • Warna Kustom
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
