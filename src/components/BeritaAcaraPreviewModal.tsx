import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Settings2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle,
  Layout,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Building2,
  ShieldCheck,
  Award,
  PenTool,
  Upload,
  Trash2,
  BookmarkPlus,
  Hash,
  AlignLeft,
  Sliders,
  Check,
  CloudUpload,
  HardDrive,
  Share2,
} from 'lucide-react';
import { BeritaAcaraOptions, pdfService } from '../services/pdfService';
import { db } from '../services/localStorageService';
import { googleWorkspace } from '../services/googleWorkspace';
import { SignaturePad } from './SignaturePad';
import { BATemplate } from '../types';

interface BeritaAcaraPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: BeritaAcaraOptions;
  onSaveToRepository?: (updatedOptions: BeritaAcaraOptions) => void;
  onTemplateSaved?: (newTemplate: BATemplate) => void;
}

export const BeritaAcaraPreviewModal: React.FC<BeritaAcaraPreviewModalProps> = ({
  isOpen,
  onClose,
  options,
  onSaveToRepository,
  onTemplateSaved,
}) => {
  const config = db.getConfig();

  // Paper & Layout settings state
  const [paperSize, setPaperSize] = useState<'a4' | 'f4' | 'letter' | 'legal'>(
    options.paperSize || 'a4'
  );
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    options.orientation || 'portrait'
  );

  // Kop Surat settings state
  const [showKop, setShowKop] = useState<boolean>(
    options.kopSurat?.show !== false
  );
  const [kopAlignment, setKopAlignment] = useState<'dual_logo' | 'center' | 'left'>(
    options.kopSurat?.alignment || 'dual_logo'
  );
  const [kopBorderStyle, setKopBorderStyle] = useState<'double' | 'single' | 'bold' | 'none'>(
    options.kopSurat?.borderStyle || 'double'
  );
  const [logoMode, setLogoMode] = useState<'dual' | 'city' | 'school' | 'none'>(
    options.kopSurat?.logoMode || (options.kopSurat?.alignment === 'dual_logo' ? 'dual' : 'dual')
  );
  const [cityLogoUrl, setCityLogoUrl] = useState<string>(
    options.kopSurat?.cityLogoUrl || config.CITY_LOGO_URL || 'https://upload.wikimedia.org/wikipedia/commons/8/83/Lambang_Daerah_Kota_Tangerang.png'
  );
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string>(
    options.kopSurat?.schoolLogoUrl || config.SCHOOL_LOGO_URL || 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo-Tut-Wuri-Handayani-PNG-Warna.png'
  );
  const [line1, setLine1] = useState(
    options.kopSurat?.line1 || `PEMERINTAH KOTA ${(config.BA_DEFAULT_CITY || 'TANGERANG').toUpperCase()}`
  );
  const [line2, setLine2] = useState(
    options.kopSurat?.line2 || 'DINAS PENDIDIKAN'
  );
  const [line3, setLine3] = useState(
    options.kopSurat?.line3 || `UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME ? config.SCHOOL_NAME.toUpperCase() : 'SD NEGERI TANGERANG 6'}`
  );
  const [line4, setLine4] = useState(
    options.kopSurat?.line4 || `NPSN: ${config.SCHOOL_NPSN || '20606498'}  |  ${config.ADDRESS || 'Jl. Perintis Kemerdekaan No. 6'}`
  );

  // Styling state
  const [themeColor, setThemeColor] = useState<'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber'>(
    options.styling?.themeColor || 'emerald'
  );
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier'>(
    options.styling?.fontFamily || 'helvetica'
  );
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'spacious'>(
    options.styling?.tableDensity || 'normal'
  );
  const [watermark, setWatermark] = useState<string>(options.styling?.watermark || '');
  const [includeVerificationQR, setIncludeVerificationQR] = useState<boolean>(
    options.styling?.includeVerificationQR !== false
  );
  const [includeHeadmaster, setIncludeHeadmaster] = useState<boolean>(
    options.includeHeadmaster !== false
  );

  // Automatic Page Numbering
  const [autoPageNumbering, setAutoPageNumbering] = useState<boolean>(
    options.pageNumbering?.enabled !== false
  );
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom_center' | 'bottom_right' | 'top_right'>(
    options.pageNumbering?.position || 'bottom_center'
  );
  const [pageNumberFormat, setPageNumberFormat] = useState<'halaman_x_dari_y' | 'hal_x_per_y' | 'page_x_of_y' | 'simple_number'>(
    options.pageNumbering?.format || 'halaman_x_dari_y'
  );

  // Header & Footer Styling
  const [headerFooterEnabled, setHeaderFooterEnabled] = useState<boolean>(
    options.headerFooter?.enabled !== false
  );
  const [runningHeaderText, setRunningHeaderText] = useState<string>(
    options.headerFooter?.runningHeader || `Dokumen Berita Acara — ${config.SCHOOL_NAME || 'SDN Tangerang 6'}`
  );
  const [runningFooterText, setRunningFooterText] = useState<string>(
    options.headerFooter?.runningFooter || `Sistem Informasi Persediaan & Aset Sekolah (SIPERSEDA)`
  );
  const [headerFooterStyle, setHeaderFooterStyle] = useState<'formal_line' | 'minimal' | 'boxed' | 'none'>(
    options.headerFooter?.style || 'formal_line'
  );
  const [showTimestamp, setShowTimestamp] = useState<boolean>(
    options.headerFooter?.showTimestamp !== false
  );

  // Signature layout & Digital Signatures (Base64 data URLs)
  const [sigLayout, setSigLayout] = useState<'triangle' | 'side_by_side' | 'horizontal_3'>(
    options.signatures?.layout || 'triangle'
  );
  const [leftSignature, setLeftSignature] = useState<string>(
    options.signatures?.leftSignatureImage || ''
  );
  const [rightSignature, setRightSignature] = useState<string>(
    options.signatures?.rightSignatureImage || ''
  );
  const [centerSignature, setCenterSignature] = useState<string>(
    options.signatures?.centerSignatureImage || ''
  );
  const [activeSignerTab, setActiveSignerTab] = useState<'PIHAK_1' | 'PIHAK_2' | 'KEPALA_SEKOLAH'>('PIHAK_1');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');

  // Save template modal state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<BATemplate['category']>('PENGADAAN');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  // PDF Preview State & Zoom Controls
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'KERTAS' | 'KOP' | 'STYLING' | 'HALAMAN' | 'TTD'>('KERTAS');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [zoomMode, setZoomMode] = useState<'manual' | 'fit_page' | 'fit_width'>('fit_page');

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(200, prev + 15));
    setZoomMode('manual');
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 15));
    setZoomMode('manual');
  };

  const handleFitPage = () => {
    setZoomLevel(100);
    setZoomMode('fit_page');
  };

  const handleFitWidth = () => {
    setZoomLevel(130);
    setZoomMode('fit_width');
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setZoomMode('manual');
  };

  // File upload input ref for signatures
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate & Update PDF Blob URL whenever settings change
  useEffect(() => {
    if (!isOpen) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      return;
    }

    let isSubscribed = true;
    setIsRendering(true);

    const generatePreview = async () => {
      try {
        const fullOptions: BeritaAcaraOptions = {
          ...options,
          paperSize,
          orientation,
          includeHeadmaster,
          kopSurat: {
            show: showKop,
            alignment: kopAlignment,
            borderStyle: kopBorderStyle,
            logoMode,
            cityLogoUrl,
            schoolLogoUrl,
            line1,
            line2,
            line3,
            line4,
          },
          styling: {
            themeColor,
            fontFamily,
            tableDensity,
            watermark,
            includeVerificationQR,
          },
          pageNumbering: {
            enabled: autoPageNumbering,
            position: pageNumberPosition,
            format: pageNumberFormat,
          },
          headerFooter: {
            enabled: headerFooterEnabled,
            runningHeader: runningHeaderText,
            runningFooter: runningFooterText,
            style: headerFooterStyle,
            showTimestamp,
            documentCode: options.docNo ? `No: ${options.docNo}` : '',
          },
          signatures: {
            ...options.signatures,
            layout: sigLayout,
            leftSignatureImage: leftSignature,
            rightSignatureImage: rightSignature,
            centerSignatureImage: centerSignature,
          },
          autoSave: false,
          skipDownload: true,
        };

        const blobUrl = await pdfService.getBeritaAcaraBlobUrl(fullOptions);
        if (isSubscribed) {
          if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
          }
          setPdfBlobUrl(blobUrl);
        }
      } catch (err) {
        console.error('Error generating PDF preview:', err);
      } finally {
        if (isSubscribed) {
          setIsRendering(false);
        }
      }
    };

    const timer = setTimeout(() => {
      generatePreview();
    }, 180); // slight debounce for smooth responsive controls

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    paperSize,
    orientation,
    showKop,
    kopAlignment,
    kopBorderStyle,
    line1,
    line2,
    line3,
    line4,
    themeColor,
    fontFamily,
    tableDensity,
    watermark,
    includeVerificationQR,
    includeHeadmaster,
    autoPageNumbering,
    pageNumberPosition,
    pageNumberFormat,
    headerFooterEnabled,
    runningHeaderText,
    runningFooterText,
    headerFooterStyle,
    showTimestamp,
    sigLayout,
    leftSignature,
    rightSignature,
    centerSignature,
  ]);

  if (!isOpen) return null;

  const currentOptions: BeritaAcaraOptions = {
    ...options,
    paperSize,
    orientation,
    includeHeadmaster,
    kopSurat: {
      show: showKop,
      alignment: kopAlignment,
      borderStyle: kopBorderStyle,
      logoMode,
      cityLogoUrl,
      schoolLogoUrl,
      line1,
      line2,
      line3,
      line4,
    },
    styling: {
      themeColor,
      fontFamily,
      tableDensity,
      watermark,
      includeVerificationQR,
    },
    pageNumbering: {
      enabled: autoPageNumbering,
      position: pageNumberPosition,
      format: pageNumberFormat,
    },
    headerFooter: {
      enabled: headerFooterEnabled,
      runningHeader: runningHeaderText,
      runningFooter: runningFooterText,
      style: headerFooterStyle,
      showTimestamp,
      documentCode: options.docNo ? `No: ${options.docNo}` : '',
    },
    signatures: {
      ...options.signatures,
      layout: sigLayout,
      leftSignatureImage: leftSignature,
      rightSignatureImage: rightSignature,
      centerSignatureImage: centerSignature,
    },
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await pdfService.generateBeritaAcara({
        ...currentOptions,
        autoSave: true,
        skipDownload: false,
      });
      if (onSaveToRepository) {
        onSaveToRepository(currentOptions);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const handlePrint = () => {
    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  // Google Workspace Export states & handlers
  const [isExportingDocs, setIsExportingDocs] = useState(false);
  const [docsResultUrl, setDocsResultUrl] = useState<string | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveResultUrl, setDriveResultUrl] = useState<string | null>(null);
  const [showWorkspaceConfirm, setShowWorkspaceConfirm] = useState<'DOCS' | 'DRIVE' | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const handleInitiateDocsExport = () => {
    setShowWorkspaceConfirm('DOCS');
  };

  const handleInitiateDriveUpload = () => {
    setShowWorkspaceConfirm('DRIVE');
  };

  const handleExecuteExportGoogleDocs = async () => {
    setShowWorkspaceConfirm(null);
    setIsExportingDocs(true);
    setWorkspaceError(null);
    try {
      let token = googleWorkspace.getAccessToken();
      if (!token) {
        token = await googleWorkspace.signInWithGoogleWorkspace();
      }
      if (!token) {
        throw new Error('Gagal menghubungkan akun Google Workspace.');
      }

      const formattedContent = `
${currentOptions.title.toUpperCase()}
Nomor: ${currentOptions.docNo || '-'}
Tanggal: ${currentOptions.date || new Date().toLocaleDateString('id-ID')}

${currentOptions.description || ''}

RINCIAN BARANG / PEKERJAAN:
${currentOptions.tableData?.headers?.join(' | ') || ''}
${(currentOptions.tableData?.rows || []).map((r: any) => (Array.isArray(r) ? r.join(' | ') : Object.values(r).join(' | '))).join('\n')}

${currentOptions.closingNote || 'Demikian Berita Acara ini dibuat dengan sebenarnya.'}

Pihak Pertama: ${currentOptions.leftSigner?.name || '-'} (${currentOptions.leftSigner?.title || '-'})
Pihak Kedua: ${currentOptions.rightSigner?.name || '-'} (${currentOptions.rightSigner?.title || '-'})
${currentOptions.includeHeadmaster ? `Mengetahui: ${currentOptions.centerSigner?.name || config.HEADMASTER || '-'} (${currentOptions.centerSigner?.title || 'Kepala Sekolah'})` : ''}
      `.trim();

      const docTitle = `${currentOptions.title} - ${currentOptions.docNo || 'No-Draft'}`;
      const result = await googleWorkspace.createGoogleDoc(token, docTitle, formattedContent);
      setDocsResultUrl(result.url);
      db.logAudit('EXPORT', 'GOOGLE_DOCS', currentOptions.docNo || 'BA', { title: docTitle, url: result.url });
    } catch (err: any) {
      setWorkspaceError(err?.message || 'Gagal mengekspor dokumen ke Google Docs.');
    } finally {
      setIsExportingDocs(false);
    }
  };

  const handleExecuteUploadDrive = async () => {
    setShowWorkspaceConfirm(null);
    setIsUploadingDrive(true);
    setWorkspaceError(null);
    try {
      let token = googleWorkspace.getAccessToken();
      if (!token) {
        token = await googleWorkspace.signInWithGoogleWorkspace();
      }
      if (!token) {
        throw new Error('Gagal menghubungkan akun Google Workspace.');
      }

      const pdfBlob = await pdfService.getBeritaAcaraBlob(currentOptions);
      const cleanTitle = (currentOptions.title || 'Berita_Acara').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanDocNo = currentOptions.docNo ? currentOptions.docNo.replace(/[^a-zA-Z0-9_-]/g, '_') : Date.now();
      const fileName = `${cleanTitle}_${cleanDocNo}.pdf`;
      const result = await googleWorkspace.uploadBlobToDrive(token, fileName, 'application/pdf', pdfBlob, 'Dokumen Berita Acara Sekolah');
      setDriveResultUrl(result.url);
      db.logAudit('UPLOAD', 'GOOGLE_DRIVE', result.fileId, { fileName, url: result.url });
    } catch (err: any) {
      setWorkspaceError(err?.message || 'Gagal mengunggah berkas ke Google Drive.');
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (activeSignerTab === 'PIHAK_1') {
        setLeftSignature(dataUrl);
      } else if (activeSignerTab === 'PIHAK_2') {
        setRightSignature(dataUrl);
      } else if (activeSignerTab === 'KEPALA_SEKOLAH') {
        setCenterSignature(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) return;

    const saved = db.saveBATemplate({
      name: templateName.trim(),
      category: templateCategory,
      description: templateDesc.trim() || 'Template kustom disimpan dari Pratinjau Dokumen.',
      institutionName: line3.replace(/^UPT SATUAN PENDIDIKAN\s*/i, ''),
      institutionAddress: line4,
      institutionCity: config.BA_DEFAULT_CITY || 'Tangerang',
      governingBody: line1,
      institutionAgency: line2,
      title: options.title,
      docNumberPattern: options.docNo || '020/{NO}/BAST-INV/2026',
      openingClause: options.description,
      closingClause: options.footerText || 'Demikian Berita Acara ini dibuat untuk dipergunakan sebagaimana mestinya.',
      defaultHeaders: options.tableHeaders,
      defaultSampleRows: options.tableRows,
      leftSignerTitle: options.leftSigner?.title || 'Pihak Pertama,',
      leftSignerName: options.leftSigner?.name,
      leftSignerNip: options.leftSigner?.nip,
      rightSignerTitle: options.rightSigner?.title || 'Pihak Kedua,',
      rightSignerName: options.rightSigner?.name,
      rightSignerNip: options.rightSigner?.nip,
      centerSignerTitle: options.centerSigner?.title,
      centerSignerName: options.centerSigner?.name,
      centerSignerNip: options.centerSigner?.nip,
      includeHeadmaster,
      paperSize,
      orientation,
      kopAlignment,
      kopBorderStyle,
      themeColor,
      fontFamily,
      tableDensity,
      includeVerificationQR,
      autoPageNumbering,
      pageNumberPosition,
      headerFooterStyle,
      runningHeaderText,
      runningFooterText,
      watermark,
    });

    setSaveTemplateSuccess(true);
    if (onTemplateSaved) {
      onTemplateSaved(saved);
    }
    setTimeout(() => {
      setSaveTemplateSuccess(false);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDesc('');
    }, 1500);
  };

  const getSignerInfo = (tab: 'PIHAK_1' | 'PIHAK_2' | 'KEPALA_SEKOLAH') => {
    if (tab === 'PIHAK_1') {
      return {
        role: 'Pihak Pertama / Penyerang / Penyedia',
        title: options.leftSigner?.title || 'Pihak Pertama',
        name: options.leftSigner?.name || config.WAREHOUSE_OFFICER || 'Pengurus Barang',
        nip: options.leftSigner?.nip || config.WAREHOUSE_OFFICER_NIP || '-',
        currentSig: leftSignature,
        setSig: setLeftSignature,
      };
    }
    if (tab === 'PIHAK_2') {
      return {
        role: 'Pihak Kedua / Penerima / Rekanan',
        title: options.rightSigner?.title || 'Pihak Kedua',
        name: options.rightSigner?.name || config.TREASURER || 'Penerima Barang',
        nip: options.rightSigner?.nip || config.TREASURER_NIP || '-',
        currentSig: rightSignature,
        setSig: setRightSignature,
      };
    }
    return {
      role: 'Pengesahan Pimpinan / Kepala Sekolah',
      title: options.centerSigner?.title || `Kepala UPT Satuan Pendidikan`,
      name: options.centerSigner?.name || config.HEADMASTER || 'Kepala Sekolah',
      nip: options.centerSigner?.nip || config.HEADMASTER_NIP || '-',
      currentSig: centerSignature,
      setSig: setCenterSignature,
    };
  };

  const activeSigner = getSignerInfo(activeSignerTab);

  return (
    <div
      id="modal-ba-preview-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-3 overflow-y-auto animate-fade-in"
    >
      <div
        id="modal-ba-preview-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800">
                  Pratinjau & Kustomisasi Dokumen Berita Acara
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 shadow-xs">
                  {paperSize.toUpperCase()} {paperSize === 'f4' ? '(Folio Dinas)' : ''}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded-full">
                  Kop: {kopAlignment === 'dual_logo' ? 'Logo Ganda' : kopAlignment === 'center' ? 'Tengah' : 'Rata Kiri'}
                </span>
                {(leftSignature || rightSignature || centerSignature) && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                    <PenTool className="w-3 h-3" /> TTD Digital Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xl">
                {options.title} {options.docNo ? `• No: ${options.docNo}` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-save-as-template"
              onClick={() => setShowSaveTemplateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-emerald-700 rounded-lg shadow-xs transition-colors"
              title="Simpan pengaturan saat ini sebagai template reusable"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simpan sbg Template</span>
            </button>

            <button
              id="btn-print-ba"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              title="Cetak Dokumen (Print)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>

            <button
              id="btn-open-tab-ba"
              onClick={handleOpenInNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Tab Baru</span>
            </button>

            {/* Google Docs Direct Export Button */}
            <button
              id="btn-export-google-docs-ba"
              onClick={handleInitiateDocsExport}
              disabled={isExportingDocs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Ekspor format teks Berita Acara ke Google Docs"
            >
              <FileText className={`w-3.5 h-3.5 text-blue-600 ${isExportingDocs ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Google Docs</span>
            </button>

            {/* Google Drive PDF Backup Button */}
            <button
              id="btn-upload-google-drive-ba"
              onClick={handleInitiateDriveUpload}
              disabled={isUploadingDrive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Unggah salinan berkas PDF ke Google Drive sekolah"
            >
              <HardDrive className={`w-3.5 h-3.5 text-emerald-600 ${isUploadingDrive ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Google Drive</span>
            </button>

            <button
              id="btn-download-pdf-ba"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
                downloadSuccess
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyusun PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>PDF Berhasil Diunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF ({paperSize.toUpperCase()})</span>
                </>
              )}
            </button>

            <button
              id="btn-close-ba-preview"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Google Workspace Notification Banner */}
        {(docsResultUrl || driveResultUrl || workspaceError) && (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
            {docsResultUrl && (
              <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Dokumen Google Docs berhasil dibuat!</span>
                <a
                  href={docsResultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-blue-700 hover:text-blue-900 flex items-center gap-1 ml-1"
                >
                  <ExternalLink size={12} /> Buka di Google Docs
                </a>
              </div>
            )}
            {driveResultUrl && (
              <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>PDF berhasil diunggah ke Google Drive!</span>
                <a
                  href={driveResultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-emerald-700 hover:text-emerald-900 flex items-center gap-1 ml-1"
                >
                  <ExternalLink size={12} /> Buka di Google Drive
                </a>
              </div>
            )}
            {workspaceError && (
              <div className="flex items-center gap-2 text-rose-800 font-medium">
                <X className="w-4 h-4 text-rose-600" />
                <span>{workspaceError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setDocsResultUrl(null);
                setDriveResultUrl(null);
                setWorkspaceError(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body: Split View (Settings Sidebar + Live PDF Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Settings Panel */}
          <div className="w-full md:w-84 lg:w-96 border-r border-slate-200 bg-slate-50/60 flex flex-col overflow-hidden shrink-0">
            {/* Setting Tabs */}
            <div className="grid grid-cols-5 border-b border-slate-200 bg-white p-1 gap-1 text-[11px] font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('KERTAS')}
                className={`py-2 text-center rounded-md transition-all ${
                  activeSettingsTab === 'KERTAS'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                Kertas
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('KOP')}
                className={`py-2 text-center rounded-md transition-all ${
                  activeSettingsTab === 'KOP'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                Kop Surat
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('STYLING')}
                className={`py-2 text-center rounded-md transition-all ${
                  activeSettingsTab === 'STYLING'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                Gaya/QR
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('HALAMAN')}
                className={`py-2 text-center rounded-md transition-all ${
                  activeSettingsTab === 'HALAMAN'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                Hal/Header
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('TTD')}
                className={`py-2 text-center rounded-md transition-all relative ${
                  activeSettingsTab === 'TTD'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                TTD Digital
                {(leftSignature || rightSignature || centerSignature) && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: KERTAS & TATA LETAK */}
              {activeSettingsTab === 'KERTAS' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-emerald-600" />
                      Ukuran Kertas Standar Kedinasan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'a4', label: 'A4 Standar', desc: '210 × 297 mm (ISO)' },
                        { id: 'f4', label: 'F4 / Folio Dinas', desc: '215 × 330 mm (Resmi)' },
                        { id: 'letter', label: 'Letter / Kuarto', desc: '216 × 279 mm' },
                        { id: 'legal', label: 'Legal Panjang', desc: '216 × 356 mm' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaperSize(item.id as any)}
                          className={`p-2.5 rounded-lg text-left border transition-all ${
                            paperSize === item.id
                              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-800">{item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700">Orientasi Halaman</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrientation('portrait')}
                        className={`p-2.5 rounded-lg text-center border text-xs font-medium transition-all ${
                          orientation === 'portrait'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        📄 Portrait (Tegak)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation('landscape')}
                        className={`p-2.5 rounded-lg text-center border text-xs font-medium transition-all ${
                          orientation === 'landscape'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        📑 Landscape (Mendatar)
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700">Kerapatan Tabel Transaksi</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact', label: 'Padat' },
                        { id: 'normal', label: 'Standar' },
                        { id: 'spacious', label: 'Lapang' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTableDensity(item.id as any)}
                          className={`py-1.5 px-2 rounded-lg text-center border text-xs transition-all ${
                            tableDensity === item.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KOP SURAT */}
              {activeSettingsTab === 'KOP' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tampilkan Kop Surat Resmi
                      </label>
                      <input
                        type="checkbox"
                        checked={showKop}
                        onChange={(e) => setShowKop(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {showKop && (
                    <>
                      {/* Live Visual Kop Surat Preview Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Sparkles size={11} className="text-amber-500" /> Pratinjau Visual Kop Surat
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {kopAlignment === 'dual_logo' ? 'Dual Logo' : kopAlignment === 'center' ? 'Tengah' : 'Rata Kiri'}
                          </span>
                        </div>

                        {/* Visual Paper Simulation Box */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                          <div className="flex items-center justify-between gap-2">
                            {/* Left Logo */}
                            {(logoMode === 'dual' || logoMode === 'city') && (
                              <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                                {cityLogoUrl ? (
                                  <img
                                    src={cityLogoUrl}
                                    alt="Logo Pemda"
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-[8px] font-black">
                                    PEMDA
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Center / Left Text */}
                            <div className={`flex-1 min-w-0 ${kopAlignment === 'left' ? 'text-left' : 'text-center'}`}>
                              <div className="text-[9px] font-bold text-slate-800 leading-tight tracking-wider uppercase">
                                {line1}
                              </div>
                              <div className="text-[10px] font-extrabold text-slate-900 leading-tight uppercase">
                                {line2}
                              </div>
                              <div className="text-[11px] font-black text-slate-950 leading-tight uppercase mt-0.5">
                                {line3}
                              </div>
                              <div className="text-[8px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                                {line4}
                              </div>
                            </div>

                            {/* Right Logo */}
                            {(logoMode === 'dual' || logoMode === 'school') && (
                              <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                                {schoolLogoUrl ? (
                                  <img
                                    src={schoolLogoUrl}
                                    alt="Logo Sekolah"
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center text-[8px] font-black">
                                    SEKOLAH
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Double Border Representation */}
                          <div className="mt-2 space-y-0.5">
                            <div className="h-[2px] bg-slate-900 w-full" />
                            {kopBorderStyle === 'double' && (
                              <div className="h-[0.5px] bg-slate-900 w-full" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets for Official Letterhead */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                          Pilihan Cepat Standar Dinas
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLine1(`PEMERINTAH KOTA ${(config.BA_DEFAULT_CITY || 'TANGERANG').toUpperCase()}`);
                              setLine2('DINAS PENDIDIKAN');
                              setLine3(`UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME ? config.SCHOOL_NAME.toUpperCase() : 'SD NEGERI TANGERANG 6'}`);
                              setLine4(config.ADDRESS || 'Jl. Nyi Mas Melati No. 02, RT 05 / RW 08, Kel. Sukarasa, Kec. Tangerang');
                              setKopAlignment('dual_logo');
                              setLogoMode('dual');
                              setKopBorderStyle('double');
                            }}
                            className="p-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-left transition-all cursor-pointer"
                          >
                            <div className="text-[11px] font-black">Resmi Kota Tangerang</div>
                            <div className="text-[9px] text-emerald-700">Dual Logo + Garis Ganda</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setKopAlignment('center');
                              setLogoMode('school');
                              setKopBorderStyle('single');
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition-all cursor-pointer"
                          >
                            <div className="text-[11px] font-bold">Logo Sekolah Saja</div>
                            <div className="text-[9px] text-slate-500">Tengah + Garis Tunggal</div>
                          </button>
                        </div>
                      </div>

                      {/* Mode Logo */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <label className="text-xs font-bold text-slate-700">Konfigurasi Logo Kop Surat</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'dual', label: 'Logo Ganda', desc: 'Pemda (Kiri) + Sekolah (Kanan)' },
                            { id: 'city', label: 'Hanya Pemda', desc: 'Lambang Daerah Kota' },
                            { id: 'school', label: 'Hanya Sekolah', desc: 'Tut Wuri / Lambang Sekolah' },
                            { id: 'none', label: 'Tanpa Logo', desc: 'Teks Header Saja' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setLogoMode(item.id as any)}
                              className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                                logoMode === item.id
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="text-[11px] font-bold">{item.label}</div>
                              <div className="text-[9px] text-slate-500">{item.desc}</div>
                            </button>
                          ))}
                        </div>

                        {/* Logo URL Customization */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-600">URL Logo Pemda (Kiri):</span>
                            <div className="flex gap-1.5 mt-0.5">
                              <input
                                type="text"
                                value={cityLogoUrl}
                                onChange={(e) => setCityLogoUrl(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono text-[10px]"
                                placeholder="https://..."
                              />
                              <button
                                type="button"
                                onClick={() => setCityLogoUrl('https://upload.wikimedia.org/wikipedia/commons/8/83/Lambang_Daerah_Kota_Tangerang.png')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg shrink-0 cursor-pointer"
                                title="Kembalikan ke lambang resmi Kota Tangerang"
                              >
                                Reset
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-600">URL Logo Sekolah / Tut Wuri (Kanan):</span>
                            <div className="flex gap-1.5 mt-0.5">
                              <input
                                type="text"
                                value={schoolLogoUrl}
                                onChange={(e) => setSchoolLogoUrl(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono text-[10px]"
                                placeholder="https://..."
                              />
                              <button
                                type="button"
                                onClick={() => setSchoolLogoUrl('https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo-Tut-Wuri-Handayani-PNG-Warna.png')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg shrink-0 cursor-pointer"
                                title="Kembalikan ke logo resmi Tut Wuri Handayani"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alignment & Border */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <label className="text-xs font-bold text-slate-700">Tata Letak / Alignment Teks</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'dual_logo', label: 'Tengah Simetris', desc: 'Dual Logo' },
                            { id: 'center', label: 'Tengah', desc: 'Rata Tengah' },
                            { id: 'left', label: 'Rata Kiri', desc: 'Modern' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setKopAlignment(item.id as any)}
                              className={`p-2 rounded-lg text-center border transition-all cursor-pointer ${
                                kopAlignment === item.id
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                  : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="text-xs font-semibold">{item.label}</div>
                              <div className="text-[9px] text-slate-500">{item.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <label className="text-xs font-bold text-slate-700">Garis Pemisah Kop Surat</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'double', label: 'Garis Ganda Dinas' },
                            { id: 'bold', label: 'Garis Tunggal Tebal' },
                            { id: 'single', label: 'Garis Tipis' },
                            { id: 'none', label: 'Tanpa Garis' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setKopBorderStyle(item.id as any)}
                              className={`p-2 rounded-lg text-center border text-xs transition-all cursor-pointer ${
                                kopBorderStyle === item.id
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                  : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Header Lines */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                        <label className="text-xs font-bold text-slate-700">Teks Header Kop Surat</label>
                        <div>
                          <span className="text-[10px] text-slate-500">Baris 1 (Pemerintah/Penyelenggara):</span>
                          <input
                            type="text"
                            value={line1}
                            onChange={(e) => setLine1(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">Baris 2 (Dinas/Lembaga):</span>
                          <input
                            type="text"
                            value={line2}
                            onChange={(e) => setLine2(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">Baris 3 (Nama UPT / Satuan Pendidikan):</span>
                          <input
                            type="text"
                            value={line3}
                            onChange={(e) => setLine3(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-black text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">Baris 4 (Alamat / NPSN / Kontak):</span>
                          <input
                            type="text"
                            value={line4}
                            onChange={(e) => setLine4(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-[11px]"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: GAYA & VALIDASI QR */}
              {activeSettingsTab === 'STYLING' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700">Tema Warna Header Tabel</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'emerald', label: 'Emerald Dinas', bg: 'bg-emerald-700' },
                        { id: 'navy', label: 'Navy Formal', bg: 'bg-blue-900' },
                        { id: 'monochrome', label: 'Monokrom', bg: 'bg-slate-900' },
                        { id: 'slate', label: 'Slate Gray', bg: 'bg-slate-600' },
                        { id: 'amber', label: 'Gold / Amber', bg: 'bg-amber-700' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setThemeColor(item.id as any)}
                          className={`p-2 rounded-lg text-center border text-xs transition-all flex flex-col items-center gap-1.5 ${
                            themeColor === item.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${item.bg} shadow-xs`} />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700">Jenis Huruf (Font Family)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'helvetica', label: 'Helvetica (Modern)' },
                        { id: 'times', label: 'Times (Dinas Baku)' },
                        { id: 'courier', label: 'Courier (Teknis)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFontFamily(item.id as any)}
                          className={`p-2 rounded-lg text-center border text-xs transition-all ${
                            fontFamily === item.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          QR Code Validasi Digital
                        </label>
                        <p className="text-[10px] text-slate-500">Mencetak barcode verifikasi keabsahan dokumen</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeVerificationQR}
                        onChange={(e) => setIncludeVerificationQR(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <label className="text-xs font-bold text-slate-700">Watermark / Cap Latar Belakang</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {['', 'DRAFT', 'ASLI', 'ARSIP', 'SALINAN', 'RAHASIA'].map((w) => (
                        <button
                          key={w || 'none'}
                          type="button"
                          onClick={() => setWatermark(w)}
                          className={`py-1 text-center border rounded text-[11px] ${
                            watermark === w
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          {w || 'Tanpa Watermark'}
                        </button>
                      ))}
                    </div>
                    {watermark && (
                      <input
                        type="text"
                        value={watermark}
                        onChange={(e) => setWatermark(e.target.value)}
                        placeholder="Teks watermark kustom..."
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: NOMOR HALAMAN & HEADER / FOOTER */}
              {activeSettingsTab === 'HALAMAN' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Automatic Page Numbering Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" />
                          Penomoran Halaman Otomatis
                        </label>
                        <p className="text-[10px] text-slate-500">Mencetak nomor halaman untuk kepatuhan administrasi</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoPageNumbering}
                        onChange={(e) => setAutoPageNumbering(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {autoPageNumbering && (
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Posisi Nomor Halaman:</span>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {[
                              { id: 'bottom_center', label: 'Bawah Tengah' },
                              { id: 'bottom_right', label: 'Bawah Kanan' },
                              { id: 'top_right', label: 'Atas Kanan' },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => setPageNumberPosition(pos.id as any)}
                                className={`py-1.5 px-2 text-center rounded-lg border text-xs transition-all ${
                                  pageNumberPosition === pos.id
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                    : 'border-slate-200 text-slate-600 bg-white'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Format Penomoran:</span>
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {[
                              { id: 'halaman_x_dari_y', label: 'Halaman X dari Y' },
                              { id: 'hal_x_per_y', label: 'Hal. X/Y' },
                              { id: 'page_x_of_y', label: 'Page X of Y' },
                              { id: 'simple_number', label: 'Angka Saja (1, 2)' },
                            ].map((fmt) => (
                              <button
                                key={fmt.id}
                                type="button"
                                onClick={() => setPageNumberFormat(fmt.id as any)}
                                className={`p-1.5 text-center rounded-lg border text-xs transition-all ${
                                  pageNumberFormat === fmt.id
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                    : 'border-slate-200 text-slate-600 bg-white'
                                }`}
                              >
                                {fmt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Header & Footer Styling Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                          Gaya Header & Footer Berjalan
                        </label>
                        <p className="text-[10px] text-slate-500">Mencetak header sekunder & catatan kaki arsip</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={headerFooterEnabled}
                        onChange={(e) => setHeaderFooterEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {headerFooterEnabled && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Gaya Garis Pembatas:</span>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {[
                              { id: 'formal_line', label: 'Garis Formal' },
                              { id: 'minimal', label: 'Minimalis' },
                              { id: 'boxed', label: 'Kotak / Box' },
                            ].map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => setHeaderFooterStyle(st.id as any)}
                                className={`p-1.5 text-center rounded-lg border text-xs transition-all ${
                                  headerFooterStyle === st.id
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                    : 'border-slate-200 text-slate-600 bg-white'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500">Teks Running Header (Hal. 2 dst):</span>
                          <input
                            type="text"
                            value={runningHeaderText}
                            onChange={(e) => setRunningHeaderText(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 mt-0.5"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500">Teks Running Footer (Catatan Kaki):</span>
                          <input
                            type="text"
                            value={runningFooterText}
                            onChange={(e) => setRunningFooterText(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 mt-0.5"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-600">Sertakan Timestamp Cetak</span>
                          <input
                            type="checkbox"
                            checked={showTimestamp}
                            onChange={(e) => setShowTimestamp(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TANDA TANGAN & DIGITAL SIGNATURE PAD */}
              {activeSettingsTab === 'TTD' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-700">Tata Letak Penandatangan</label>
                    <div className="space-y-1.5">
                      {[
                        {
                          id: 'triangle',
                          label: 'Segitiga Hierarki (Resmi Kedinasan)',
                          desc: 'Pihak 1 & 2 berdampingan, Kepala Sekolah di bawah tengah',
                        },
                        {
                          id: 'side_by_side',
                          label: 'Berdampingan (2 Pihak)',
                          desc: 'Pihak Pertama di kiri, Pihak Kedua di kanan',
                        },
                        {
                          id: 'horizontal_3',
                          label: 'Sejajar 3 Kolom',
                          desc: 'Pihak 1, Pihak 2, dan Mengetahui dalam satu baris sejajar',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSigLayout(item.id as any)}
                          className={`w-full p-2 rounded-lg text-left border transition-all ${
                            sigLayout === item.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          Sertakan Pengesahan Kepala Sekolah
                        </label>
                        <p className="text-[10px] text-slate-500">
                          {config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeHeadmaster}
                        onChange={(e) => setIncludeHeadmaster(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Digital Signature Component Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs space-y-3 bg-emerald-50/20">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                        Bubuhkan Tanda Tangan Digital
                      </label>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Langsung Masuk PDF
                      </span>
                    </div>

                    {/* Signer Selector Sub-Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                      {[
                        { id: 'PIHAK_1', label: 'Pihak 1', hasSig: !!leftSignature },
                        { id: 'PIHAK_2', label: 'Pihak 2', hasSig: !!rightSignature },
                        { id: 'KEPALA_SEKOLAH', label: 'KepSek', hasSig: !!centerSignature },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveSignerTab(s.id as any)}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                            activeSignerTab === s.id
                              ? 'bg-white text-emerald-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>{s.label}</span>
                          {s.hasSig && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                        </button>
                      ))}
                    </div>

                    {/* Signer details */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        {activeSigner.role}
                      </div>
                      <div className="font-bold text-slate-800">{activeSigner.name}</div>
                      <div className="text-[11px] text-slate-500">{activeSigner.title}</div>
                      {activeSigner.nip && activeSigner.nip !== '-' && (
                        <div className="text-[10px] text-slate-400">NIP: {activeSigner.nip}</div>
                      )}
                    </div>

                    {/* Mode Toggle: Draw vs Upload */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          signatureMode === 'draw'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Gambar di Layar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('upload')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          signatureMode === 'upload'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Unggah Berkas/Cap</span>
                      </button>
                    </div>

                    {/* Active Signature Preview or Canvas */}
                    {activeSigner.currentSig ? (
                      <div className="bg-white p-3 rounded-xl border border-emerald-300 flex flex-col items-center gap-2 shadow-xs">
                        <div className="w-full flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tanda Tangan Tersemat
                          </span>
                          <button
                            type="button"
                            onClick={() => activeSigner.setSig('')}
                            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                        <div className="h-24 w-full bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200 p-2">
                          <img
                            src={activeSigner.currentSig}
                            alt="Signature Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Tanda tangan ini otomatis dicetak di atas nama penandatangan pada PDF.
                        </p>
                      </div>
                    ) : signatureMode === 'draw' ? (
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <SignaturePad
                          key={activeSignerTab}
                          label={`Goreskan Tanda Tangan (${activeSigner.name})`}
                          onSave={(dataUrl) => {
                            activeSigner.setSig(dataUrl);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 text-center space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={handleSignatureUpload}
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-xs font-semibold text-slate-700">
                          Pilih Foto TTD atau Cap Stempel (PNG Transparan Disarankan)
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                        >
                          Pilih File Gambar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Footer Info */}
            <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
              <span>Status: Siap Cetak & Unduh</span>
              <button
                type="button"
                onClick={() => {
                  setPaperSize('a4');
                  setOrientation('portrait');
                  setShowKop(true);
                  setKopAlignment('dual_logo');
                  setKopBorderStyle('double');
                  setThemeColor('emerald');
                  setFontFamily('helvetica');
                  setTableDensity('normal');
                  setWatermark('');
                  setIncludeVerificationQR(true);
                  setIncludeHeadmaster(true);
                  setAutoPageNumbering(true);
                  setPageNumberPosition('bottom_center');
                  setPageNumberFormat('halaman_x_dari_y');
                  setHeaderFooterEnabled(true);
                  setHeaderFooterStyle('formal_line');
                  setLeftSignature('');
                  setRightSignature('');
                  setCenterSignature('');
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* Right Live PDF Viewer Area with Zoom Controls */}
          <div className="flex-1 bg-slate-900 flex flex-col relative overflow-hidden">
            {/* Floating Top Zoom Controls Toolbar */}
            <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 border-b border-slate-800 flex items-center justify-between z-20 shrink-0 text-white text-xs">
              {/* Left Zoom Tools */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspeksi:</span>
                </span>

                <button
                  id="btn-zoom-out-ba"
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                  title="Perkecil Tampilan (Zoom Out)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Quick Zoom Dropdown */}
                <select
                  id="select-zoom-level-ba"
                  value={zoomLevel}
                  onChange={(e) => {
                    setZoomLevel(Number(e.target.value));
                    setZoomMode('manual');
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-400 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={90}>90%</option>
                  <option value={100}>100% (Normal)</option>
                  <option value={115}>115%</option>
                  <option value={130}>130%</option>
                  <option value={150}>150% (Detail)</option>
                  <option value={175}>175%</option>
                  <option value={200}>200% (Maksimal)</option>
                </select>

                <button
                  id="btn-zoom-in-ba"
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                  title="Perbesar Tampilan (Zoom In)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Preset Zoom Modes */}
                <button
                  id="btn-fit-page-ba"
                  type="button"
                  onClick={handleFitPage}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    zoomMode === 'fit_page' && zoomLevel === 100
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Sesuaikan Satu Halaman Penuh"
                >
                  Fit Halaman
                </button>

                <button
                  id="btn-fit-width-ba"
                  type="button"
                  onClick={handleFitWidth}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    zoomMode === 'fit_width'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Sesuaikan Lebar Kertas"
                >
                  Fit Lebar (130%)
                </button>

                <button
                  id="btn-reset-zoom-ba"
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
                  title="Kembalikan ke Skala 100%"
                >
                  100%
                </button>
              </div>

              {/* Right Format & Dimension Tag */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="hidden sm:inline bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                  {paperSize === 'a4'
                    ? 'A4 (210 × 297 mm)'
                    : paperSize === 'f4'
                    ? 'F4 / Folio Dinas (215 × 330 mm)'
                    : paperSize === 'letter'
                    ? 'Letter (216 × 279 mm)'
                    : 'Legal (216 × 356 mm)'}{' '}
                  • {orientation === 'portrait' ? 'Tegak' : 'Mendatar'}
                </span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold">
                  {zoomLevel}%
                </span>
              </div>
            </div>

            {/* Rendering Overlay */}
            {isRendering && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-white gap-2">
                <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Memperbarui pratinjau Berita Acara ({paperSize.toUpperCase()})...
                </span>
              </div>
            )}

            {/* Scrollable Viewport with Dynamic Zoom Scale */}
            {pdfBlobUrl ? (
              <div
                className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/90 custom-scrollbar"
                style={{ minHeight: '400px' }}
              >
                <div
                  className="transition-all duration-150 ease-out origin-top shadow-2xl rounded-sm overflow-hidden"
                  style={{
                    width: `${zoomLevel}%`,
                    height: `${zoomLevel}%`,
                    minWidth: zoomLevel < 100 ? `${zoomLevel}%` : '100%',
                    minHeight: zoomLevel < 100 ? `${zoomLevel}%` : '100%',
                  }}
                >
                  <iframe
                    id="iframe-ba-preview"
                    src={`${pdfBlobUrl}#toolbar=0&navpanes=0&zoom=${zoomLevel}`}
                    className="w-full h-full border-none bg-white rounded shadow-md"
                    style={{ minHeight: '650px' }}
                    title="Berita Acara PDF Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm">Menyiapkan dokumen...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL SIMPAN SEBAGAI TEMPLATE BARU */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                <span>Simpan Sebagai Template Berita Acara</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveTemplateSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 text-sm">Template Berhasil Disimpan!</h4>
                <p className="text-xs text-slate-500">
                  Format Berita Acara ini kini tersimpan di Master Template dan dapat digunakan kembali kapan saja.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Nama Template / Format:</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Contoh: BAST Pengadaan ATK BOS 2026..."
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Kategori Dokumen:</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value as any)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PENGADAAN">Pengadaan & Belanja Barang (BOS/BOP)</option>
                    <option value="SERAH_TERIMA">Serah Terima / Distribusi ATK Guru</option>
                    <option value="PEMERIKSAAN">Pemeriksaan & Uji Fisik Barang</option>
                    <option value="STOCK_OPNAME">Inventarisasi Fisik / Stock Opname</option>
                    <option value="PENGHAPUSAN">Usulan Penghapusan BMD / Rusak</option>
                    <option value="MUTASI">Mutasi & Alih Status Ruangan</option>
                    <option value="LAINNYA">Lainnya / Format Khusus</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Keterangan / Catatan Template:</label>
                  <textarea
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder="Deskripsi singkat peruntukan format..."
                    rows={2}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-700">Pengaturan Tersimpan Termasuk:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px]">
                    <span className="bg-white px-2 py-0.5 rounded border">Kertas: {paperSize.toUpperCase()}</span>
                    <span className="bg-white px-2 py-0.5 rounded border">Kop: {kopAlignment}</span>
                    <span className="bg-white px-2 py-0.5 rounded border">Warna: {themeColor}</span>
                    <span className="bg-white px-2 py-0.5 rounded border">Nomor Hal: {autoPageNumbering ? 'Ya' : 'Tidak'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border">Header/Footer: {headerFooterEnabled ? 'Ya' : 'Tidak'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!templateName.trim()}
                    onClick={handleSaveAsTemplate}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs"
                  >
                    Simpan Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL KONFIRMASI GOOGLE WORKSPACE (DOCS / DRIVE) */}
      {showWorkspaceConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                {showWorkspaceConfirm === 'DOCS' ? (
                  <>
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Konfirmasi Ekspor ke Google Docs</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-5 h-5 text-emerald-600" />
                    <span>Konfirmasi Unggah ke Google Drive</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowWorkspaceConfirm(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              {showWorkspaceConfirm === 'DOCS' ? (
                <>
                  <p>
                    Aplikasi akan membuat dokumen baru di akun <strong>Google Docs</strong> Anda berisi naskah lengkap Berita Acara ini:
                  </p>
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-[11px] text-blue-900">
                    <p className="font-bold">{currentOptions.title}</p>
                    <p>Nomor: {currentOptions.docNo || 'DRAFT'}</p>
                    <p>Format: Google Document resmi (dapat diedit online bersama guru/staf).</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Operasi ini memerlukan persetujuan Anda untuk menulis data ke akun Google Workspace Anda.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Aplikasi akan mengunggah berkas PDF Berita Acara ke folder <strong>"Dokumen Berita Acara Sekolah"</strong> di <strong>Google Drive</strong> Anda:
                  </p>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-[11px] text-emerald-900">
                    <p className="font-bold">{currentOptions.title}</p>
                    <p>Ukuran Kertas: {paperSize.toUpperCase()}</p>
                    <p>Penyimpanan: Google Drive Cloud terenkripsi.</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Operasi ini memerlukan persetujuan Anda untuk menyimpan berkas ke Google Drive.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWorkspaceConfirm(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={
                  showWorkspaceConfirm === 'DOCS'
                    ? handleExecuteExportGoogleDocs
                    : handleExecuteUploadDrive
                }
                className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs transition-colors ${
                  showWorkspaceConfirm === 'DOCS'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {showWorkspaceConfirm === 'DOCS' ? 'Buat di Google Docs' : 'Unggah ke Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
