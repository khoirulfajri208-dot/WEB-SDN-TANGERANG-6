import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Download,
  Printer,
  X,
  RefreshCw,
  FolderOpen,
  Sliders,
  Sparkles,
  Layout,
  Palette,
  Check,
  Eye,
  FileText,
  ShieldCheck,
  Layers,
  UserCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckSquare,
  Square,
  Info,
  Smartphone,
  CheckCircle2,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Plus,
  RotateCcw,
  Tag,
  SlidersHorizontal,
  Image as ImageIcon,
  Upload,
  Shield,
  Sparkle,
} from 'lucide-react';
import { Asset, User, QRStickerPreset } from '../types';
import { db } from '../services/localStorageService';
import { qrService, QRStickerCustomLayout } from '../services/qrService';
import jsPDF from 'jspdf';

interface QRStickerModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRStickerModal: React.FC<QRStickerModalProps> = ({ asset, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const config = db.getConfig();
  const users = db.getUsers();

  // Active sub-tab in customization sidebar
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'qr' | 'presets' | 'drive'>('content');

  // Preview Mode: 'sticker' (single sticker live canvas) or 'sheet_a4' (A4 multi-sticker preview)
  const [previewMode, setPreviewMode] = useState<'sticker' | 'sheet_a4'>('sticker');
  const [previewZoom, setPreviewZoom] = useState<number>(100); // 75, 100, 125, 150

  // Customization Options State
  const [layoutMode, setLayoutMode] = useState<'landscape_left' | 'landscape_right' | 'portrait_top' | 'badge'>('landscape_left');
  const [colorTheme, setColorTheme] = useState<'emerald' | 'navy' | 'slate' | 'monochrome' | 'amber'>('emerald');
  const [borderStyle, setBorderStyle] = useState<'double' | 'single' | 'rounded' | 'none'>('double');
  const [size, setSize] = useState<'1024x320' | '1600x500' | '2048x640' | '1200x800'>('1600x500');

  // QR Code Customization State
  const [qrFgColor, setQrFgColor] = useState<string>('#14532d');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [includeLogoInQR, setIncludeLogoInQR] = useState<boolean>(true);
  const [logoSource, setLogoSource] = useState<'school' | 'city' | 'tutwuri' | 'custom'>('school');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');

  // Content Visibility & Custom text fields
  const [showKop, setShowKop] = useState(true);
  const [kopText, setKopText] = useState('UPT SATUAN PENDIDIKAN');
  const [showSchoolName, setShowSchoolName] = useState(true);
  const [schoolName, setSchoolName] = useState(config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6');
  const [showNpsn, setShowNpsn] = useState(true);
  const [npsnText, setNpsnText] = useState(config.SCHOOL_NPSN || '20606498');

  const [showAssetCode, setShowAssetCode] = useState(true);
  const [showAssetName, setShowAssetName] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showSpecification, setShowSpecification] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showPj, setShowPj] = useState(true);
  const [showNip, setShowNip] = useState(true);
  const [customPj, setCustomPj] = useState('');
  const [customNip, setCustomNip] = useState('');
  const [showYear, setShowYear] = useState(true);
  const [showCondition, setShowCondition] = useState(true);
  const [showPrice, setShowPrice] = useState(false);

  const [driveUrl, setDriveUrl] = useState(asset?.DRIVE_FILE_URL || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Preset Management State
  const [presets, setPresets] = useState<QRStickerPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('preset_official');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [presetSuccessMsg, setPresetSuccessMsg] = useState<string>('');

  // Load presets from DB
  const loadPresets = useCallback(() => {
    const list = db.getQRStickerPresets();
    setPresets(list);
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Auto detect NIP based on asset's PJ or match with employees
  const detectNipForPj = useCallback((pjName: string): string => {
    if (!pjName) return '';
    const matchedUser = users.find((u) => {
      const name = (u as any).NAMA_LENGKAP || u.NAMA || '';
      return name.toLowerCase().includes(pjName.toLowerCase()) ||
        pjName.toLowerCase().includes(name.toLowerCase());
    });
    return matchedUser?.NIP || '';
  }, [users]);

  // Sync initial state when asset changes or modal opens
  useEffect(() => {
    if (asset && isOpen) {
      setSchoolName(config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6');
      setNpsnText(config.SCHOOL_NPSN || '20606498');
      setDriveUrl(asset.DRIVE_FILE_URL || '');
      const initialPj = asset.PENANGGUNG_JAWAB || 'Pengurus Barang';
      setCustomPj(initialPj);
      const detectedNip = (asset as any).NIP || detectNipForPj(initialPj);
      setCustomNip(detectedNip);
    }
  }, [asset, isOpen, config.SCHOOL_NAME, config.SCHOOL_NPSN, detectNipForPj]);

  // Draw sticker on canvas
  const drawSticker = useCallback(async () => {
    if (!asset) return;
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust resolution based on portrait vs landscape
    let targetSize = size;
    if (layoutMode === 'portrait_top' && !size.includes('800')) {
      targetSize = '1200x800';
    } else if (layoutMode !== 'portrait_top' && size.includes('800')) {
      targetSize = '1600x500';
    }

    const [w, h] = targetSize.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;

    const updatedAsset = { ...asset, DRIVE_FILE_URL: driveUrl };

    const layoutOptions: QRStickerCustomLayout = {
      showKop,
      kopText,
      showSchoolName,
      schoolName,
      showNpsn,
      npsnText,
      showAssetCode,
      showAssetName,
      showCategory,
      showSpecification,
      showLocation,
      showPj,
      showNip,
      customPj,
      customNip,
      showYear,
      showCondition,
      showPrice,
      layoutMode,
      colorTheme,
      borderStyle,
      qrFgColor,
      qrErrorCorrectionLevel: errorCorrectionLevel,
      includeLogoInQR,
      logoSource,
      customLogoUrl,
    };

    await qrService.drawAssetSticker(canvas, updatedAsset, config, layoutOptions);
    setIsGenerating(false);
    setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
  }, [
    asset,
    driveUrl,
    size,
    layoutMode,
    colorTheme,
    borderStyle,
    qrFgColor,
    errorCorrectionLevel,
    includeLogoInQR,
    logoSource,
    customLogoUrl,
    showKop,
    kopText,
    showSchoolName,
    schoolName,
    showNpsn,
    npsnText,
    showAssetCode,
    showAssetName,
    showCategory,
    showSpecification,
    showLocation,
    showPj,
    showNip,
    customPj,
    customNip,
    showYear,
    showCondition,
    showPrice,
    config,
  ]);

  useEffect(() => {
    if (asset && isOpen) {
      drawSticker();
    }
  }, [asset, isOpen, drawSticker]);

  // Apply a specific preset configuration
  const applyPresetConfig = (preset: QRStickerPreset) => {
    setActivePresetId(preset.ID);
    setLayoutMode(preset.LAYOUT_MODE as any);
    setColorTheme(preset.COLOR_THEME as any);
    setBorderStyle(preset.BORDER_STYLE as any);

    // Map size
    if (preset.LAYOUT_MODE === 'portrait_top') {
      setSize('1200x800');
    } else if (preset.SIZE === 'large') {
      setSize('2048x640');
    } else if (preset.SIZE === 'small') {
      setSize('1024x320');
    } else {
      setSize('1600x500');
    }

    if (preset.QR_FG_COLOR) setQrFgColor(preset.QR_FG_COLOR);
    if (preset.QR_ERROR_CORRECTION) setErrorCorrectionLevel(preset.QR_ERROR_CORRECTION);
    if (preset.INCLUDE_LOGO_IN_QR !== undefined) setIncludeLogoInQR(preset.INCLUDE_LOGO_IN_QR);
    if (preset.LOGO_SOURCE) setLogoSource(preset.LOGO_SOURCE);
    if (preset.CUSTOM_LOGO_URL !== undefined) setCustomLogoUrl(preset.CUSTOM_LOGO_URL);

    setShowKop(preset.SHOW_KOP);
    if (preset.KOP_TEXT) setKopText(preset.KOP_TEXT);
    setShowSchoolName(preset.SHOW_SCHOOL_NAME);
    setShowNpsn(preset.SHOW_NPSN);
    setShowAssetCode(preset.SHOW_ASSET_CODE);
    setShowAssetName(preset.SHOW_ASSET_NAME);
    setShowCategory(preset.SHOW_CATEGORY);
    setShowSpecification(preset.SHOW_SPECIFICATION);
    setShowLocation(preset.SHOW_LOCATION);
    setShowPj(preset.SHOW_PJ);
    setShowNip(preset.SHOW_NIP);
    setShowYear(preset.SHOW_YEAR);
    setShowCondition(preset.SHOW_CONDITION);
    setShowPrice(preset.SHOW_PRICE);

    setPresetSuccessMsg(`Preset "${preset.NAME}" berhasil diterapkan!`);
    setTimeout(() => setPresetSuccessMsg(''), 3000);
  };

  // Save current configuration as a new custom preset
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    // Convert size string to preset size category
    let sizeCategory: 'standard' | 'compact' | 'small' | 'large' = 'standard';
    if (size === '1024x320') sizeCategory = 'small';
    else if (size === '2048x640') sizeCategory = 'large';

    const newPreset = db.saveQRStickerPreset({
      NAME: newPresetName.trim(),
      DESCRIPTION: newPresetDescription.trim() || `Kombinasi ${layoutMode} • ${colorTheme.toUpperCase()} • ${activeCount} bidang`,
      SIZE: sizeCategory,
      LAYOUT_MODE: layoutMode,
      COLOR_THEME: colorTheme,
      BORDER_STYLE: borderStyle,
      FONT_SIZE_SCALE: 1.0,
      QR_SIZE_RATIO: 'normal',
      QR_FG_COLOR: qrFgColor,
      QR_ERROR_CORRECTION: errorCorrectionLevel,
      INCLUDE_LOGO_IN_QR: includeLogoInQR,
      LOGO_SOURCE: logoSource,
      CUSTOM_LOGO_URL: customLogoUrl,
      SHOW_KOP: showKop,
      KOP_TEXT: kopText,
      SHOW_SCHOOL_NAME: showSchoolName,
      SHOW_NPSN: showNpsn,
      SHOW_ASSET_CODE: showAssetCode,
      SHOW_ASSET_NAME: showAssetName,
      SHOW_CATEGORY: showCategory,
      SHOW_SPECIFICATION: showSpecification,
      SHOW_LOCATION: showLocation,
      SHOW_PJ: showPj,
      SHOW_NIP: showNip,
      SHOW_YEAR: showYear,
      SHOW_CONDITION: showCondition,
      SHOW_PRICE: showPrice,
    });

    loadPresets();
    setActivePresetId(newPreset.ID);
    setIsSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDescription('');
    setPresetSuccessMsg(`Preset kustom "${newPreset.NAME}" berhasil disimpan!`);
    setTimeout(() => setPresetSuccessMsg(''), 4000);
  };

  // Handle local logo file upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          setCustomLogoUrl(base64);
          setLogoSource('custom');
          setIncludeLogoInQR(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete a custom preset
  const handleDeletePreset = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus preset "${name}"?`)) {
      db.deleteQRStickerPreset(id);
      loadPresets();
      if (activePresetId === id) {
        setActivePresetId('preset_official');
      }
      setPresetSuccessMsg(`Preset "${name}" berhasil dihapus.`);
      setTimeout(() => setPresetSuccessMsg(''), 3000);
    }
  };

  // Reset presets to default
  const handleResetPresets = () => {
    if (confirm('Kembalikan semua preset bawaan sistem? (Preset kustom yang Anda buat akan terhapus)')) {
      db.resetDefaultQRStickerPresets();
      loadPresets();
      setActivePresetId('preset_official');
      setPresetSuccessMsg('Preset bawaan berhasil dipulihkan.');
      setTimeout(() => setPresetSuccessMsg(''), 3000);
    }
  };

  // Toggle all content fields ON or OFF
  const handleToggleAllFields = (enable: boolean) => {
    setShowKop(enable);
    setShowSchoolName(enable);
    setShowNpsn(enable);
    setShowAssetCode(enable);
    setShowAssetName(enable);
    setShowCategory(enable);
    setShowSpecification(enable);
    setShowLocation(enable);
    setShowPj(enable);
    setShowNip(enable);
    setShowYear(enable);
    setShowCondition(enable);
    setShowPrice(enable ? false : false);
  };

  const handleSaveDriveUrl = () => {
    if (asset) {
      setIsSavingDrive(true);
      db.saveAsset({ ...asset, DRIVE_FILE_URL: driveUrl });
      setTimeout(() => {
        setIsSavingDrive(false);
        drawSticker();
      }, 300);
    }
  };

  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!asset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL(`image/${format}`, 0.98);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `STIKER_${asset.KODE_ASET}_${layoutMode}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    a.click();
  };

  const handlePrint = () => {
    if (!asset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stiker Label Aset - ${asset.KODE_ASET}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { margin: 0; padding: 20px; text-align: center; font-family: system-ui, sans-serif; background: #fff; }
            img { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            @media print {
              body { padding: 0; }
              img { box-shadow: none; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportA4PDF = () => {
    if (!asset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = 210;
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const cols = layoutMode === 'portrait_top' ? 3 : 2;
    const gap = 4;
    const itemWidth = (usableWidth - (cols - 1) * gap) / cols;
    const itemHeight = layoutMode === 'portrait_top' ? 55 : (itemWidth * canvas.height) / canvas.width;

    const rowsPerPage = Math.floor((297 - margin * 2) / (itemHeight + gap));
    const totalSlots = cols * rowsPerPage;

    for (let i = 0; i < totalSlots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (itemWidth + gap);
      const y = margin + row * (itemHeight + gap);
      doc.addImage(dataUrl, 'PNG', x, y, itemWidth, itemHeight);
    }

    doc.save(`LEMBAR_A4_STIKER_${asset.KODE_ASET}.pdf`);
  };

  // Count active fields
  const activeFieldsList = [
    { label: 'Kop', active: showKop, toggle: () => setShowKop(!showKop) },
    { label: 'Sekolah', active: showSchoolName, toggle: () => setShowSchoolName(!showSchoolName) },
    { label: 'NPSN', active: showNpsn, toggle: () => setShowNpsn(!showNpsn) },
    { label: 'Kode Aset', active: showAssetCode, toggle: () => setShowAssetCode(!showAssetCode) },
    { label: 'Nama Barang', active: showAssetName, toggle: () => setShowAssetName(!showAssetName) },
    { label: 'Kategori KIB', active: showCategory, toggle: () => setShowCategory(!showCategory) },
    { label: 'Spesifikasi', active: showSpecification, toggle: () => setShowSpecification(!showSpecification) },
    { label: 'Lokasi/Ruang', active: showLocation, toggle: () => setShowLocation(!showLocation) },
    { label: 'PJ', active: showPj, toggle: () => setShowPj(!showPj) },
    { label: 'NIP', active: showNip, toggle: () => setShowNip(!showNip) },
    { label: 'Tahun', active: showYear, toggle: () => setShowYear(!showYear) },
    { label: 'Kondisi', active: showCondition, toggle: () => setShowCondition(!showCondition) },
    { label: 'Harga/Nilai', active: showPrice, toggle: () => setShowPrice(!showPrice) },
  ];

  const activeCount = activeFieldsList.filter((f) => f.active).length;

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border border-slate-200 my-4 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-800 text-emerald-200">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                Kustomisasi Tata Letak & Preset Stiker QR
                <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-mono px-2 py-0.5 rounded-full">
                  {asset.KODE_ASET}
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Atur ukuran label, kombinasi bidang data, simpan sebagai preset kustom, atau pilih layout siap pakai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success / Notification Banner */}
        {presetSuccessMsg && (
          <div className="bg-emerald-800 text-white px-5 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-300" />
              <span>{presetSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setPresetSuccessMsg('')}
              className="text-emerald-200 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Live Canvas Preview & Quick Presets (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3.5">
            {/* Live Preview Card */}
            <div className="border-2 border-emerald-700/40 rounded-2xl p-4 bg-slate-900 text-white flex flex-col shadow-lg relative overflow-hidden">
              {/* Preview Top Toolbar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Eye size={14} /> Pratinjau Desain Real-Time
                  </span>
                  {lastUpdatedTime && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      • {size} • {colorTheme.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* View Mode & Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sticker')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      previewMode === 'sticker'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Label Stiker
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sheet_a4')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      previewMode === 'sheet_a4'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kisi Lembar A4
                  </button>

                  <div className="h-3 w-px bg-slate-700 mx-1" />

                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(60, z - 15))}
                    title="Perkecil Pratinjau"
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-center">{previewZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(150, z + 15))}
                    title="Perbesar Pratinjau"
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    title="Reset Zoom 100%"
                    className="px-1.5 py-0.5 text-[9px] text-slate-400 hover:text-white rounded-md hover:bg-slate-700 font-mono"
                  >
                    1:1
                  </button>
                </div>
              </div>

              {/* Main Canvas / A4 Preview Box */}
              <div className="w-full flex items-center justify-center p-3 sm:p-5 my-2 min-h-60 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-auto relative">
                {previewMode === 'sticker' ? (
                  <div
                    className="transition-transform duration-150 flex items-center justify-center"
                    style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'center' }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto rounded-xl shadow-2xl bg-white block transition-all"
                      style={{ maxHeight: '310px' }}
                    />
                  </div>
                ) : (
                  <div
                    className="bg-white p-3 rounded-lg shadow-xl text-slate-900 grid gap-2 border border-slate-300 transition-transform duration-150"
                    style={{
                      width: '320px',
                      transform: `scale(${previewZoom / 100})`,
                      transformOrigin: 'center',
                    }}
                  >
                    <div className="text-[9px] font-bold text-center border-b pb-1 text-slate-500 uppercase tracking-widest">
                      Simulasi Tata Letak Lembar Cetak A4 (Grid Otomatis)
                    </div>
                    <div className={`grid ${layoutMode === 'portrait_top' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
                      {Array.from({ length: layoutMode === 'portrait_top' ? 9 : 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="border border-slate-300 rounded p-1 bg-slate-50 text-[7px] flex items-center gap-1"
                        >
                          <div className="w-4 h-4 bg-emerald-900 rounded shrink-0 flex items-center justify-center text-[6px] text-white">
                            QR
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            <div className="font-bold truncate text-slate-800">{asset.NAMA_BARANG}</div>
                            <div className="text-[6px] text-slate-500 truncate">{asset.KODE_ASET}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[8px] text-center text-slate-500 pt-1 border-t">
                      Format siap unduh sebagai PDF multi-halaman
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center rounded-xl z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-900 px-4 py-2 rounded-xl shadow-2xl border border-emerald-500/30">
                      <RefreshCw size={15} className="animate-spin text-emerald-400" />
                      Memperbarui Pratinjau Real-Time...
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Element Badges */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5">
                  <span className="font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    Elemen Data Aktif ({activeCount} Bidang):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAllFields(true)}
                      className="text-[10px] text-emerald-400 hover:underline hover:text-emerald-300 font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllFields(false)}
                      className="text-[10px] text-slate-400 hover:underline hover:text-slate-200"
                    >
                      Bersihkan
                    </button>
                  </div>
                </div>

                {/* Clickable Badge Tags to fast-toggle elements */}
                <div className="flex flex-wrap gap-1.5">
                  {activeFieldsList.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={f.toggle}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1 ${
                        f.active
                          ? 'bg-emerald-800 text-emerald-100 border border-emerald-600 shadow-2xs hover:bg-emerald-700'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200 line-through opacity-60'
                      }`}
                      title={`Klik untuk ${f.active ? 'menonaktifkan' : 'mengaktifkan'} ${f.label}`}
                    >
                      {f.active ? <Check size={10} className="text-emerald-300" /> : <X size={10} />}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Presets Quick Selector Bar */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  Pilihan Cepat Preset Tata Letak
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <BookmarkPlus size={13} /> Simpan Konfigurasi Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Kelola ({presets.length})
                  </button>
                </div>
              </div>

              {/* Horizontal Preset Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.slice(0, 6).map((preset) => {
                  const isActive = activePresetId === preset.ID;
                  return (
                    <button
                      key={preset.ID}
                      type="button"
                      onClick={() => applyPresetConfig(preset)}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between relative group ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-700 shadow-xs ring-1 ring-emerald-600/50'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5 w-full">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-[11px] truncate flex items-center gap-1 ${
                              isActive ? 'text-emerald-950' : 'text-slate-800'
                            }`}
                          >
                            {preset.IS_SYSTEM ? '🏛️' : '⭐'} {preset.NAME}
                          </span>
                          {isActive && (
                            <span className="bg-emerald-700 text-white rounded-full p-0.5 shrink-0">
                              <Check size={9} />
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1">
                          {preset.DESCRIPTION || `${preset.LAYOUT_MODE} • ${preset.COLOR_THEME}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500">
                        <span className="bg-slate-100 px-1 rounded text-[8px] font-mono uppercase">
                          {preset.LAYOUT_MODE.replace('_', ' ')}
                        </span>
                        <span className="bg-slate-100 px-1 rounded text-[8px] font-mono uppercase">
                          {preset.COLOR_THEME}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download size={14} /> Unduh PNG HD
              </button>
              <button
                type="button"
                onClick={() => handleDownload('jpeg')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download size={14} /> Unduh JPG
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer size={14} /> Cetak Stiker
              </button>
              <button
                type="button"
                onClick={handleExportA4PDF}
                className="py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Layers size={14} /> Lembar A4 (PDF)
              </button>
            </div>
          </div>

          {/* Right Column: Customization Sidebar (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            {/* Sub-Tabs */}
            <div className="flex p-1 bg-slate-200/80 rounded-xl gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === 'content'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={12} /> Bidang Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === 'layout'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layout size={12} /> Tata Letak
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === 'qr'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders size={12} /> QR & Logo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === 'presets'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark size={12} /> Preset ({presets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('drive')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === 'drive'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderOpen size={12} /> Drive
              </button>
            </div>

            {/* TAB 1: KUSTOMISASI KONTEN INFORMASI */}
            {activeTab === 'content' && (
              <div className="space-y-3.5 animate-in fade-in duration-100">
                {/* Header & Instansi */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">Kop & Nama Sekolah</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showKop}
                        onChange={(e) => setShowKop(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Kop Instansi
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNpsn}
                        onChange={(e) => setShowNpsn(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Nomor NPSN
                    </label>
                  </div>
                  {showKop && (
                    <input
                      type="text"
                      value={kopText}
                      onChange={(e) => setKopText(e.target.value)}
                      placeholder="Teks Kop Atas"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-emerald-600"
                    />
                  )}
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Nama Sekolah"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-emerald-600 font-semibold"
                  />
                </div>

                {/* Informasi Identitas Aset */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">Identitas Aset & Klasifikasi KIB</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAssetCode}
                        onChange={(e) => setShowAssetCode(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Kode Register
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAssetName}
                        onChange={(e) => setShowAssetName(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Nama Barang/Aset
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCategory}
                        onChange={(e) => setShowCategory(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Kategori / KIB
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSpecification}
                        onChange={(e) => setShowSpecification(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Merk / Spesifikasi
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLocation}
                        onChange={(e) => setShowLocation(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Ruangan / Lokasi
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showYear}
                        onChange={(e) => setShowYear(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Tahun Perolehan
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCondition}
                        onChange={(e) => setShowCondition(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Status Kondisi
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPrice}
                        onChange={(e) => setShowPrice(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      Nilai / Harga Aset
                    </label>
                  </div>
                </div>

                {/* Kustomisasi Penanggung Jawab & NIP */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <UserCheck size={13} className="text-emerald-700" /> Penanggung Jawab (PJ) & NIP
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPj}
                          onChange={(e) => setShowPj(e.target.checked)}
                          className="rounded text-emerald-700"
                        />
                        PJ
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showNip}
                          onChange={(e) => setShowNip(e.target.checked)}
                          className="rounded text-emerald-700"
                        />
                        NIP
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Nama Penanggung Jawab
                      </label>
                      <input
                        type="text"
                        value={customPj}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomPj(val);
                          const detected = detectNipForPj(val);
                          if (detected) setCustomNip(detected);
                        }}
                        placeholder="Contoh: Liestya Kusuma Sari, S.Pd., M.Pd."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        NIP Penanggung Jawab
                      </label>
                      <input
                        type="text"
                        value={customNip}
                        onChange={(e) => setCustomNip(e.target.value)}
                        placeholder="Contoh: 198406192009022007"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TATA LETAK & GAYA VISUAL */}
            {activeTab === 'layout' && (
              <div className="space-y-3.5 animate-in fade-in duration-100">
                {/* Posisi QR Code */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">Posisi QR Code</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLayoutMode('landscape_left')}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                        layoutMode === 'landscape_left'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">L</div>
                      QR di Kiri (Standar)
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayoutMode('landscape_right')}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                        layoutMode === 'landscape_right'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-4 h-4 rounded bg-blue-700 text-white flex items-center justify-center text-[9px] font-bold">R</div>
                      QR di Kanan
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayoutMode('portrait_top')}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                        layoutMode === 'portrait_top'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-4 h-4 rounded bg-purple-700 text-white flex items-center justify-center text-[9px] font-bold">T</div>
                      QR di Atas (Vertikal)
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayoutMode('badge')}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                        layoutMode === 'badge'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-4 h-4 rounded bg-amber-700 text-white flex items-center justify-center text-[9px] font-bold">B</div>
                      Kartu Badge BMD
                    </button>
                  </div>
                </div>

                {/* Tema Warna */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">Tema Warna Stiker</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-700', text: 'text-emerald-900' },
                      { id: 'navy', label: 'Navy', bg: 'bg-blue-800', text: 'text-blue-900' },
                      { id: 'slate', label: 'Slate', bg: 'bg-slate-700', text: 'text-slate-900' },
                      { id: 'monochrome', label: 'Hitam B/W', bg: 'bg-black', text: 'text-black' },
                      { id: 'amber', label: 'Amber', bg: 'bg-amber-700', text: 'text-amber-900' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setColorTheme(t.id as any)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
                          colorTheme === t.id
                            ? 'border-emerald-800 bg-emerald-50 ring-2 ring-emerald-600/30'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${t.bg} shadow-xs`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gaya Bingkai / Border */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">Gaya Bingkai (Border)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'double', label: 'Garis Ganda' },
                      { id: 'single', label: 'Garis Tunggal' },
                      { id: 'rounded', label: 'Melengkung' },
                      { id: 'none', label: 'Tanpa Border' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBorderStyle(b.id as any)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                          borderStyle === b.id
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolusi Canvas */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800 block">Ukuran Label & Kualitas Resolusi</span>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-emerald-600 font-semibold text-slate-800"
                  >
                    <option value="1024x320">Kecil / Compact (1024 × 320 px) - Label Mini</option>
                    <option value="1600x500">Standar HD (1600 × 500 px) - Rekomendasi Utama</option>
                    <option value="2048x640">Besar / Ultra HD (2048 × 640 px) - Plat Aset Besar</option>
                    <option value="1200x800">Format Vertikal / Card (1200 × 800 px) - Pintu/Lemari</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 3: KUSTOMISASI QR CODE & LOGO */}
            {activeTab === 'qr' && (
              <div className="space-y-3.5 animate-in fade-in duration-100">
                {/* 1. Warna Foreground QR */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Palette size={13} className="text-emerald-700" />
                      Warna Foreground QR Code
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const themeColorMap: Record<string, string> = {
                          emerald: '#14532d',
                          navy: '#1e3a8a',
                          slate: '#334155',
                          monochrome: '#000000',
                          amber: '#92400e',
                        };
                        setQrFgColor(themeColorMap[colorTheme] || '#14532d');
                      }}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Ikuti Warna Tema
                    </button>
                  </div>

                  {/* Swatches Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { hex: '#14532d', label: 'Emerald' },
                      { hex: '#1e3a8a', label: 'Navy' },
                      { hex: '#334155', label: 'Slate' },
                      { hex: '#000000', label: 'Hitam' },
                      { hex: '#881337', label: 'Burgundy' },
                      { hex: '#92400e', label: 'Amber' },
                      { hex: '#4338ca', label: 'Indigo' },
                      { hex: '#0f766e', label: 'Teal' },
                    ].map((c) => {
                      const isSelected = qrFgColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setQrFgColor(c.hex)}
                          className={`p-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-600 font-semibold shrink-0">Warna Kustom:</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="color"
                        value={qrFgColor}
                        onChange={(e) => setQrFgColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                        title="Pilih warna kustom"
                      />
                      <input
                        type="text"
                        value={qrFgColor}
                        onChange={(e) => setQrFgColor(e.target.value)}
                        placeholder="#000000"
                        className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-200 font-mono font-semibold bg-slate-50 text-slate-800 focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Level Koreksi Kesalahan (ECC) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-700" />
                      Tingkat Koreksi Kesalahan (ECC)
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                      Recovery Capacity
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'L', label: 'Level L', desc: '7% Pulih', note: 'Ringan' },
                      { id: 'M', label: 'Level M', desc: '15% Pulih', note: 'Standar' },
                      { id: 'Q', label: 'Level Q', desc: '25% Pulih', note: 'Tahan Gores' },
                      { id: 'H', label: 'Level H', desc: '30% Pulih', note: 'Maksimal' },
                    ].map((ecc) => {
                      const isSelected = errorCorrectionLevel === ecc.id;
                      return (
                        <button
                          key={ecc.id}
                          type="button"
                          onClick={() => setErrorCorrectionLevel(ecc.id as any)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/40 text-emerald-950'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{ecc.id}</span>
                            {isSelected && <Check size={12} className="text-emerald-700" />}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-600">{ecc.desc}</div>
                          <div className="text-[9px] text-slate-600">{ecc.note}</div>
                        </button>
                      );
                    })}
                  </div>

                  {includeLogoInQR && (
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[10px] text-emerald-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-emerald-700 shrink-0" />
                      <span>
                        <strong>Logo Aktif:</strong> Level <strong>H (30%)</strong> otomatis diterapkan saat rendering agar QR tetap terbaca 100% cepat & akurat.
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Logo di Tengah QR Code */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-emerald-700" />
                      Logo di Tengah QR Code
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLogoInQR}
                        onChange={(e) => setIncludeLogoInQR(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  {includeLogoInQR && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-700 block">Pilih Sumber Logo:</span>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setLogoSource('school')}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            logoSource === 'school'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="text-base mb-0.5">🎓</div>
                          <div className="text-[10px] leading-tight">Sekolah / Lembaga</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLogoSource('city')}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            logoSource === 'city'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="text-base mb-0.5">🏛️</div>
                          <div className="text-[10px] leading-tight">Pemerintah Kota</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLogoSource('custom')}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            logoSource === 'custom'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="text-base mb-0.5">✨</div>
                          <div className="text-[10px] leading-tight">Kustom / Upload</div>
                        </button>
                      </div>

                      {/* Custom Logo URL / Upload */}
                      {logoSource === 'custom' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[10px] font-semibold text-slate-600">
                            URL Gambar Logo atau Unggah Berkas:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="url"
                              value={customLogoUrl}
                              onChange={(e) => setCustomLogoUrl(e.target.value)}
                              placeholder="https://.../logo.png"
                              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-emerald-600"
                            />
                            <button
                              type="button"
                              onClick={() => logoFileInputRef.current?.click()}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                            >
                              <Upload size={12} /> Unggah
                            </button>
                            <input
                              type="file"
                              ref={logoFileInputRef}
                              onChange={handleLogoFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                          {customLogoUrl && (
                            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600">
                              <img
                                src={customLogoUrl}
                                alt="Custom Logo Preview"
                                className="w-5 h-5 rounded object-contain border bg-white"
                                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                              />
                              <span className="truncate flex-1 font-mono">Logo kustom aktif</span>
                              <button
                                type="button"
                                onClick={() => setCustomLogoUrl('')}
                                className="text-rose-600 hover:underline"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: DAFTAR & MANAJEMEN PRESET */}
            {activeTab === 'presets' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-emerald-700" /> Daftar Preset Tersimpan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSaveModalOpen(true)}
                      className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Plus size={12} /> Buat Preset
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPresets}
                      title="Kembalikan preset bawaan"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {presets.map((preset) => {
                    const isActive = activePresetId === preset.ID;
                    return (
                      <div
                        key={preset.ID}
                        className={`p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-emerald-50/70 border-emerald-600 shadow-2xs ring-1 ring-emerald-500/40'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                {preset.IS_SYSTEM ? '🏛️' : '⭐'} {preset.NAME}
                              </span>
                              {preset.IS_SYSTEM ? (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  Bawaan Sistem
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                                  Kustom
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-bold">
                                  Aktif
                                </span>
                              )}
                            </div>
                            {preset.DESCRIPTION && (
                              <p className="text-[10px] text-slate-500 leading-tight">
                                {preset.DESCRIPTION}
                              </p>
                            )}

                            {/* Preset attributes summary */}
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 flex-wrap pt-1">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                {preset.LAYOUT_MODE.replace('_', ' ')}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono uppercase">
                                {preset.COLOR_THEME}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                Border: {preset.BORDER_STYLE}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => applyPresetConfig(preset)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700'
                              }`}
                            >
                              {isActive ? 'Diterapkan' : 'Terapkan'}
                            </button>
                            {!preset.IS_SYSTEM && (
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(preset.ID, preset.NAME)}
                                title="Hapus preset kustom"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: DUAL-MODE GOOGLE DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-700" />
                      Fitur Dual-Mode QR
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                      Drive + App
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    • <strong>Scan dari Aplikasi:</strong> Langsung membuka kartu riwayat aset, mutasi, dan pencatatan BKU.<br />
                    • <strong>Scan dari Kamera HP / Luar:</strong> Otomatis dialihkan membuka berkas resmi di Google Drive.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Tautan Berkas Google Drive / Bukti Pembelian:
                  </label>
                  <div className="relative">
                    <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700" />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono focus:outline-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDriveUrl}
                    disabled={isSavingDrive}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    {isSavingDrive ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    {isSavingDrive ? 'Menyimpan...' : 'Simpan Link & Perbarui QR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Preset Dialog Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <BookmarkPlus size={18} className="text-emerald-700" />
                <h4 className="font-bold text-sm">Simpan Konfigurasi Sebagai Preset</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsPreset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Preset <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Label Ruang Lab & Komputer"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Format landscape navy dengan PJ, NIP & merk spesifikasi"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-emerald-700"
                />
              </div>

              {/* Summary of Configuration to be Saved */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                <span className="font-bold text-slate-700 block">Ringkasan Konfigurasi Saat Ini:</span>
                <div className="grid grid-cols-2 gap-1 text-slate-600 text-[10px]">
                  <div>• Ukuran: <strong>{size}</strong></div>
                  <div>• Tata Letak: <strong>{layoutMode}</strong></div>
                  <div>• Tema: <strong>{colorTheme}</strong></div>
                  <div>• Bingkai: <strong>{borderStyle}</strong></div>
                  <div>• Warna QR: <strong className="font-mono">{qrFgColor}</strong></div>
                  <div>• Koreksi ECC: <strong>Level {errorCorrectionLevel}</strong></div>
                  <div className="col-span-2">
                    • Logo QR: <strong>{includeLogoInQR ? `Aktif (${logoSource})` : 'Non-aktif'}</strong> • Aktif: <strong>{activeCount} Bidang</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} /> Simpan Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
