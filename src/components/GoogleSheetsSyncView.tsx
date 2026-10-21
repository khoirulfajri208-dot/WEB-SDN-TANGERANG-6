import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  CloudDownload,
  FolderOpen,
  Check,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Clock,
  Zap,
  Radio,
  HardDrive,
  Activity,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar as CalendarIcon,
  Presentation,
  Video,
  Search,
  Plus,
  Loader2,
  Share2
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { googleWorkspace } from '../services/googleWorkspace';
import { offlineSyncManager } from '../services/offlineSyncManager';
import { archiveBackupService, SyncQueueStatus } from '../services/archiveBackupService';
import { DailyScanScheduleManager } from './DailyScanScheduleManager';
import { Download, Database, Layers } from 'lucide-react';

interface GoogleSheetsSyncViewProps {
  onOpenModal: () => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({ onOpenModal }) => {
  // Authentication & connections
  const [accessToken, setAccessToken] = useState<string | null>(db.getGoogleAccessToken());
  const [sheetId, setSheetId] = useState<string | null>(db.getConnectedGoogleSheetId());
  const [appsScriptUrl, setAppsScriptUrl] = useState<string | null>(db.getAppsScriptUrl());
  const [activeHubTab, setActiveHubTab] = useState<'SHEETS' | 'DOCS' | 'CALENDAR' | 'SLIDES' | 'PICKER' | 'DAILY_SCAN'>('SHEETS');

  // Existing states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const config = db.getConfig();
  const lastSync = db.getLastSyncTime();
  const autoSyncEnabled = config.AUTO_SYNC_ENABLED === 'YA';
  const autoSyncInterval = config.AUTO_SYNC_INTERVAL_MINUTES || 15;
  const realtimeEnabled = config.REALTIME_SYNC_ENABLED === 'YA';
  const [realtimeToggling, setRealtimeToggling] = useState(false);

  // Google Docs state
  const [documents, setDocuments] = useState<any[]>(db.getDocuments());
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Google Calendar & Meet state
  const [eventSummary, setEventSummary] = useState('Koordinasi Aset & Stock Opname');
  const [eventDescription, setEventDescription] = useState('Agenda rapat koordinasi internal untuk pencatatan fisik inventaris, rekonsiliasi BOS, pelabelan kode QR, dan pembukuan di SIPERSEDA.');
  const [eventLocation, setEventLocation] = useState('Ruang Rapat Kepala Sekolah, SDN Tangerang 6');
  const [eventStartTime, setEventStartTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [eventEndTime, setEventEndTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [addMeetLink, setAddMeetLink] = useState(true);
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);
  const [calendarResult, setCalendarResult] = useState<{ htmlLink: string; meetLink?: string } | null>(null);

  // Google Slides state
  const [slidesTheme, setSlidesTheme] = useState<'ASSET' | 'PLANNING'>('ASSET');
  const [isCreatingSlides, setIsCreatingSlides] = useState(false);
  const [createdSlidesUrl, setCreatedSlidesUrl] = useState<string | null>(null);

  // Google Picker state
  const [pickerFile, setPickerFile] = useState<{
    name: string;
    id: string;
    url: string;
    mimeType: string;
    sizeBytes?: number;
  } | null>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const handleToggleRealtime = () => {
    setRealtimeToggling(true);
    const newVal = !realtimeEnabled ? 'YA' : 'TIDAK';
    db.saveConfig({ REALTIME_SYNC_ENABLED: newVal });
    setTimeout(() => setRealtimeToggling(false), 400);
  };

  const [queueStatus, setQueueStatus] = useState<SyncQueueStatus>(() => archiveBackupService.getSyncQueueStatus());
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);

  useEffect(() => {
    setAccessToken(db.getGoogleAccessToken());
    setSheetId(db.getConnectedGoogleSheetId());
    setAppsScriptUrl(db.getAppsScriptUrl());
    setDocuments(db.getDocuments());

    const unsub = archiveBackupService.subscribe(() => {
      setQueueStatus(archiveBackupService.getSyncQueueStatus());
    });
    return unsub;
  }, []);

  const handleDownloadExcelArchive = () => {
    setIsExportingExcel(true);
    try {
      const res = archiveBackupService.downloadLargeDataExcel();
      setStatusMsg({
        type: 'success',
        text: `Arsip Multi-Sheet Excel (${res.totalRecords} rekod data besar) berhasil diunduh: "${res.fileName}"`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal membuat arsip Excel: ' + (err?.message || String(err)),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSyncAccountsOnly = async () => {
    setIsSyncingAccounts(true);
    setStatusMsg({ type: 'info', text: 'Menyinkronkan akun pengguna ke Cloud Firestore...' });
    try {
      const res = await archiveBackupService.syncAccountsToCloudOnly();
      setStatusMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal sinkronisasi akun: ' + (err?.message || String(err)),
      });
    } finally {
      setIsSyncingAccounts(false);
    }
  };

  const handleSyncLargeDataToSheets = async () => {
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Mengirim dan memperbarui data besar ke Google Spreadsheet...' });
    try {
      const res = await archiveBackupService.syncLargeDataToGoogleSheets(appsScriptUrl || undefined);
      setStatusMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal sinkronisasi data besar: ' + (err?.message || String(err)),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (accessToken) {
        const res = await googleWorkspace.testConnection('OAUTH', { token: accessToken, sheetId: sheetId || undefined });
        setTestResult(res);
      } else if (appsScriptUrl) {
        const res = await googleWorkspace.testConnection('APPS_SCRIPT', { appsScriptUrl });
        setTestResult(res);
      } else {
        onOpenModal();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal', latencyMs: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushData = async () => {
    if (accessToken && sheetId) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Mengunggah (Push) seluruh data ke Google Sheets via OAuth...' });
      try {
        await googleWorkspace.pushAllDataToSheet(accessToken, sheetId);
        setStatusMsg({
          type: 'success',
          text: 'Seluruh database lokal berhasil diunggah ke Google Sheets!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Push data: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (appsScriptUrl) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Mengunggah (Push) seluruh data ke Google Sheets via Apps Script...' });
      try {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PUSH');
        setStatusMsg({
          type: 'success',
          text: 'Seluruh database lokal berhasil disinkronkan ke Google Sheets via Apps Script!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Push data Apps Script: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      onOpenModal();
    }
  };

  const handlePullData = async () => {
    if (accessToken && sheetId) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets via OAuth...' });
      try {
        await googleWorkspace.pullDataFromSheet(accessToken, sheetId);
        setStatusMsg({
          type: 'success',
          text: 'Data dari Google Sheets berhasil ditarik dan diperbarui ke aplikasi!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Pull data: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (appsScriptUrl) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets via Apps Script...' });
      try {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PULL');
        setStatusMsg({
          type: 'success',
          text: 'Data dari Google Sheets berhasil ditarik dan diperbarui via Apps Script!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Pull data Apps Script: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      onOpenModal();
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Memulai sinkronisasi instan cepat dua arah (Sync Now)...' });
    try {
      const res = await offlineSyncManager.syncAll(true);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: 'Sinkronisasi instan sukses! Seluruh data lokal dan cloud telah selaras sempurna.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal sinkronisasi instan: ' + (err?.message || String(err)),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateDriveBackup = async () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Mencadangkan snapshot database ke Google Drive...' });
    try {
      const backup = await googleWorkspace.createDriveBackup(accessToken);
      setStatusMsg({
        type: 'success',
        text: `Cadangan berhasil disimpan di Google Drive: "${backup.fileName}"!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mencadangkan ke Google Drive: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Google Docs Export handler ---
  const handleExportToGoogleDocs = async () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }
    if (!selectedDocId) {
      alert('Pilih Berita Acara yang ingin diekspor.');
      return;
    }

    const docRecord = documents.find(d => d.ID === selectedDocId);
    if (!docRecord) return;

    setIsCreatingDoc(true);
    setCreatedDocUrl(null);
    try {
      // Build clean document content
      const content = `
${docRecord.JUDUL || 'BERITA ACARA'}
Nomor: ${docRecord.NOMOR || '-'}
Tanggal: ${docRecord.TANGGAL || '-'}

KETERANGAN:
${docRecord.DESKRIPSI || ''}

TABEL DATA:
${docRecord.TABEL_BARIS_RAW || 'Tidak ada data rincian.'}

PENUTUP:
${docRecord.CATATAN_PENUTUP || ''}

Pihak Pertama: ${docRecord.PIHAK_PERTAMA || '-'}
Pihak Kedua: ${docRecord.PIHAK_KEDUA || '-'}
Mengetahui: ${docRecord.MENGETAHUI || '-'}
      `.trim();

      const title = `${docRecord.JUDUL || 'Berita Acara'} - ${docRecord.NOMOR || docRecord.ID}`;
      const result = await googleWorkspace.createGoogleDoc(accessToken, title, content);
      setCreatedDocUrl(result.url);
      db.logAudit('EXPORT', 'GOOGLE_DOCS', docRecord.ID, { title, url: result.url });
    } catch (err: any) {
      alert('Gagal mengekspor dokumen ke Google Docs: ' + err.message);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // --- Google Calendar & Meet handler ---
  const handleCreateCalendarEvent = async () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }

    setIsCreatingCalendar(true);
    setCalendarResult(null);
    try {
      const result = await googleWorkspace.createCalendarEvent(accessToken, {
        summary: eventSummary,
        description: eventDescription,
        location: eventLocation,
        startTime: new Date(eventStartTime).toISOString(),
        endTime: new Date(eventEndTime).toISOString(),
        addMeetLink
      });
      setCalendarResult(result);
      db.logAudit('CREATE_EVENT', 'GOOGLE_CALENDAR', result.id, {
        summary: eventSummary,
        meetLink: result.meetLink
      });
    } catch (err: any) {
      alert('Gagal menambahkan acara ke Google Calendar: ' + err.message);
    } finally {
      setIsCreatingCalendar(false);
    }
  };

  // --- Google Slides generator ---
  const handleGenerateSlides = async () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }

    setIsCreatingSlides(true);
    setCreatedSlidesUrl(null);
    try {
      let title = '';
      let slidesData: Array<{ heading: string; bullets: string[] }> = [];

      if (slidesTheme === 'ASSET') {
        const assets = db.getAssets();
        const total = assets.length;
        const baik = assets.filter(a => a.KONDISI === 'BAIK').length;
        const rusak = assets.filter(a => a.KONDISI === 'RUSAK RINGAN' || a.KONDISI === 'RUSAK BERAT').length;

        title = 'Presentasi Laporan Kondisi Aset SDN Tangerang 6';
        slidesData = [
          {
            heading: 'Laporan Buku Induk Inventaris Sekolah',
            bullets: [
              `Total Aset Terdaftar: ${total} unit`,
              `Aset dalam Kondisi Baik: ${baik} unit`,
              `Aset memerlukan Perbaikan/Rusak: ${rusak} unit`,
              `Update Terakhir: ${new Date().toLocaleDateString('id-ID')}`
            ]
          },
          {
            heading: 'Rincian Aset Rusak & Perlu Tindak Lanjut',
            bullets: assets
              .filter(a => a.KONDISI === 'RUSAK RINGAN' || a.KONDISI === 'RUSAK BERAT')
              .slice(0, 4)
              .map(a => `${a.KODE_ASET} - ${a.NAMA_BARANG} (Kondisi: ${a.KONDISI})`)
              .concat(rusak > 4 ? [`Serta ${rusak - 4} barang rusak lainnya.`] : [])
          },
          {
            heading: 'Rekomendasi Pemeliharaan & Penghapusan',
            bullets: [
              'Jadwalkan pemeliharaan berkala untuk peralatan elektronik/komputer.',
              'Lakukan pengusulan penghapusan aset yang berkondisi Rusak Berat untuk efisiensi ruang kelas.',
              'Optimalkan pengawasan penggunaan barang inventaris oleh guru dan staf.'
            ]
          }
        ];
      } else {
        const items = db.getItems();
        const lowStock = db.getStockSummary().filter(s => s.STATUS === 'MINIMUM');

        title = 'Rencana Kebutuhan Belanja & Pengadaan ATK';
        slidesData = [
          {
            heading: 'Analisis Persediaan ATK Sekolah',
            bullets: [
              `Total Katalog ATK: ${items.length} jenis`,
              `Item Kritis (Stok Minimum): ${lowStock.length} jenis`,
              'Sumber Anggaran Pendanaan: Dana BOS Reguler',
              'Tujuan: Menjamin ketersediaan bahan ajar dan kelengkapan administrasi guru.'
            ]
          },
          {
            heading: 'Kebutuhan Belanja Prioritas Tinggi (Stok Kritis)',
            bullets: lowStock
              .slice(0, 4)
              .map(s => `${s.NAMA_BARANG} (Sisa Stok: ${s.STOK} ${s.JENIS_SATUAN || 'Unit'})`)
              .concat(lowStock.length > 4 ? [`Serta ${lowStock.length - 4} barang kritis lainnya.`] : [])
          },
          {
            heading: 'Langkah Aksi Pengadaan Barang',
            bullets: [
              'Buat pengajuan belanja persediaan di aplikasi ARKAS.',
              'Hubungi rekanan toko penyedia terdaftar melalui SIPLaH.',
              'Verifikasi kesesuaian spesifikasi barang sesaat setelah diterima di sekolah.'
            ]
          }
        ];
      }

      const result = await googleWorkspace.createInventorySlides(accessToken, title, slidesData);
      setCreatedSlidesUrl(result.url);
      db.logAudit('EXPORT', 'GOOGLE_SLIDES', result.id, { theme: slidesTheme });
    } catch (err: any) {
      alert('Gagal membuat Google Slides: ' + err.message);
    } finally {
      setIsCreatingSlides(false);
    }
  };

  // --- Google Picker API dynamic load & picker opener ---
  const handleOpenGooglePicker = () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }

    setIsPickerLoading(true);
    // @ts-ignore
    if (typeof gapi === 'undefined') {
      alert('Google API client belum termuat sempurna. Harap tunggu beberapa detik atau muat ulang.');
      setIsPickerLoading(false);
      return;
    }

    // @ts-ignore
    gapi.load('picker', {
      callback: () => {
        try {
          const pickerOrigin = window.location.origin;
          // @ts-ignore
          const picker = new google.picker.PickerBuilder()
            // @ts-ignore
            .addView(google.picker.ViewId.DOCS)
            // @ts-ignore
            .setOAuthToken(accessToken)
            .setCallback((data: any) => {
              // @ts-ignore
              if (data.action === google.picker.Action.PICKED) {
                const doc = data.docs[0];
                setPickerFile({
                  name: doc.name,
                  id: doc.id,
                  url: doc.embedUrl || doc.url,
                  mimeType: doc.mimeType,
                  sizeBytes: doc.sizeBytes
                });
                db.logAudit('PICK_FILE', 'GOOGLE_PICKER', doc.id, { name: doc.name });
              }
            })
            .setOrigin(pickerOrigin)
            .build();
          picker.setVisible(true);
        } catch (err: any) {
          alert('Gagal merender Google Picker: ' + err.message);
        } finally {
          setIsPickerLoading(false);
        }
      }
    });
  };

  const isConnected = !!accessToken || !!appsScriptUrl;

  return (
    <div className="space-y-5">
      {/* Workspace Hub Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
              <Sparkles size={18} />
            </span>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              Pusat Integrasi Google Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Sinergi penuh aplikasi Bendahara Barang Sekolah dengan Google Drive, Sheets, Docs, Calendar, Slides, Meet, dan Picker secara native.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isConnected && (
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Activity size={14} className={isTesting ? 'animate-spin text-emerald-800' : 'text-slate-500'} />
              Uji Koneksi
            </button>
          )}
          <button
            type="button"
            onClick={onOpenModal}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <FolderOpen size={15} /> Akun &amp; Client ID
          </button>
        </div>
      </div>

      {/* Tiered Storage Architecture: Cloud (Accounts) & Google Sheets / Drive (Large Data) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Arsitektur Penyimpanan Hybrid Sekolah
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Optimal &amp; Efisien
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pemisahan cerdas: Akun di Cloud Firestore, dan Data Operasional Besar di Google Spreadsheet &amp; Google Drive.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${queueStatus.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${queueStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {queueStatus.isOnline ? 'Online Ready' : 'Mode Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Cloud Tier (Accounts) */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck size={15} className="text-blue-400" />
                <span>Akun Pengguna (Cloud Firestore)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tersimpan di Cloud Database terenkripsi dengan respon instan untuk autentikasi guru, siswa, dan admin.
              </p>
              <div className="text-[11px] font-mono text-blue-300 font-semibold pt-1">
                {queueStatus.cloudAccountsCount} Akun Terdaftar
              </div>
            </div>
            <button
              type="button"
              disabled={isSyncingAccounts}
              onClick={handleSyncAccountsOnly}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              {isSyncingAccounts ? 'Menyinkronkan...' : 'Sinkronkan Akun'}
            </button>
          </div>

          {/* Large Data Tier (Spreadsheet & Drive) */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <FileSpreadsheet size={15} className="text-emerald-400" />
                <span>Data Besar (Spreadsheet &amp; Drive)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Stok barang, aset KIB, transaksi SPJ BKU, dan foto kwitansi diarsip rapi siap cetak untuk pelaporan dinas.
              </p>
              <div className="text-[11px] font-mono text-emerald-300 font-semibold pt-1">
                {queueStatus.largeDataTotalRecords} Total Baris Data Aktif
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isExportingExcel}
                onClick={handleDownloadExcelArchive}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Unduh seluruh tabel data dalam format multi-sheet Excel (.xlsx)"
              >
                <Download size={13} />
                <span>Unduh Excel</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncLargeDataToSheets}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Kirim pembaruan data ke Google Sheets yang terhubung"
              >
                <CloudUpload size={13} />
                <span>Kirim Sheets</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Hub Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-1 bg-white p-1 rounded-xl">
        <button
          onClick={() => setActiveHubTab('SHEETS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'SHEETS'
              ? 'bg-emerald-50 text-emerald-900 shadow-3xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet size={15} />
          Google Sheets &amp; Drive Backup
        </button>
        <button
          onClick={() => setActiveHubTab('DOCS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'DOCS'
              ? 'bg-emerald-50 text-emerald-900 shadow-3xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText size={15} />
          Google Docs
        </button>
        <button
          onClick={() => setActiveHubTab('CALENDAR')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'CALENDAR'
              ? 'bg-emerald-50 text-emerald-900 shadow-3xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarIcon size={15} />
          Google Calendar &amp; Meet
        </button>
        <button
          onClick={() => setActiveHubTab('SLIDES')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'SLIDES'
              ? 'bg-emerald-50 text-emerald-900 shadow-3xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Presentation size={15} />
          Google Slides
        </button>
        <button
          onClick={() => setActiveHubTab('PICKER')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'PICKER'
              ? 'bg-emerald-50 text-emerald-900 shadow-3xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search size={15} />
          Google Picker API
        </button>
        <button
          onClick={() => setActiveHubTab('DAILY_SCAN')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeHubTab === 'DAILY_SCAN'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
          }`}
        >
          <Clock size={15} />
          Jadwal Log Scan PDF (15:00)
        </button>
      </div>

      {/* Tab Contents */}
      {activeHubTab === 'SHEETS' && (
        <div className="space-y-4">
          {statusMsg && (
            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <div className="mt-0.5">
                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : statusMsg.type === 'error' ? <AlertCircle size={16} /> : <RefreshCw size={16} />}
              </div>
              <div className="flex-1 font-semibold">{statusMsg.text}</div>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
                testResult.success
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity size={15} className={testResult.success ? 'text-emerald-700' : 'text-rose-600'} />
                <span className="font-bold">{testResult.message}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-bold">
                {testResult.latencyMs} ms
              </span>
            </div>
          )}

          {/* Real-Time Auto-Sync Card */}
          <div className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
            realtimeEnabled ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-colors ${realtimeEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {realtimeEnabled ? <Radio size={18} className="animate-pulse" /> : <Zap size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">Sinkronisasi Real-Time Otomatis (Live Sync)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      realtimeEnabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {realtimeEnabled ? 'AKTIF' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {realtimeEnabled
                    ? 'Setiap penambahan atau mutasi inventaris otomatis dikirim ke Google Sheets dalam 5 detik.'
                    : 'Aktifkan untuk mengirim setiap transaksi langsung ke cloud tanpa harus menekan tombol Push manual.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={realtimeToggling}
              onClick={handleToggleRealtime}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${
                realtimeEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  realtimeEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sync Status Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Connection Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Saluran Koneksi
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    accessToken
                      ? 'bg-emerald-100 text-emerald-800'
                      : appsScriptUrl
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {accessToken ? 'OAuth 2.0 Aktif' : appsScriptUrl ? 'Apps Script Aktif' : 'Belum Terhubung'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  {accessToken ? (
                    <>
                      <KeyRound size={15} className="text-emerald-700" />
                      Google OAuth &amp; Drive Terhubung
                    </>
                  ) : appsScriptUrl ? (
                    <>
                      <Sparkles size={15} className="text-emerald-700" />
                      Google Apps Script Web App Terhubung
                    </>
                  ) : (
                    'Belum Ada Saluran Spreadsheet'
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sheetId
                    ? `Target Spreadsheet ID: ${sheetId.slice(0, 16)}...`
                    : appsScriptUrl
                    ? 'Terhubung via Apps Script Web App.'
                    : 'Hubungkan Google Sheets Anda untuk mengaktifkan sinkronisasi otomatis ke cloud.'}
                </p>
              </div>

              {lastSync && (
                <div className="text-[11px] text-slate-500 font-medium">
                  Sinkronisasi Terakhir:{' '}
                  <strong className="text-slate-700">{new Date(lastSync).toLocaleString('id-ID')}</strong>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {sheetId ? (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-3xs"
                  >
                    <ExternalLink size={14} /> Buka Spreadsheet di Tab Baru
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenModal}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Mulai Hubungkan Google Sheets
                  </button>
                )}
              </div>
            </div>

            {/* Right: Two-Way Actions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Aksi Sinkronisasi &amp; Cadangan
              </span>

              <div className="space-y-2.5">
                {/* Sync Now Button */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border-2 border-emerald-500/30 flex items-center justify-between gap-3 shadow-3xs">
                  <div>
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Zap size={14} className="text-emerald-600 animate-bounce" />
                      Sync Now (Sinkronisasi Instan)
                    </div>
                    <div className="text-[11px] text-emerald-900/80 mt-1 font-medium">
                      Picu pengunggahan &amp; rekonsiliasi data lokal ke Google Sheets saat ini juga.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncNow}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black flex items-center gap-1 shrink-0 shadow-md shadow-emerald-700/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Sync Now
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Push (Unggah ke Cloud)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Kirim seluruh transaksi, aset, dan stok lokal ke Google Sheets.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handlePushData}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition-all"
                  >
                    <CloudUpload size={14} /> Push
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Pull (Tarik dari Cloud)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Perbarui database lokal dari data di Google Sheets.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handlePullData}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                  >
                    <CloudDownload size={14} /> Pull
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-950">Cadangkan ke Google Drive</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Simpan file snapshot JSON ke folder Google Drive Anda.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleCreateDriveBackup}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs transition-all"
                  >
                    <HardDrive size={13} /> Cadangkan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Schema Structure Documentation Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-800" />
              Struktur Lembar Kerja Database Google Sheets
            </h3>
            <p className="text-xs text-slate-500">
              Sistem secara otomatis mengelola sinkronisasi tabel relasional berikut di dalam Google Spreadsheet Anda:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">1. CONFIG &amp; USERS</strong>
                <span className="text-slate-500 text-[11px]">Identitas sekolah &amp; hak akses pengguna</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">2. SUPPLIERS &amp; ITEMS</strong>
                <span className="text-slate-500 text-[11px]">Master rekanan toko &amp; katalog barang</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">3. BARANG_MASUK</strong>
                <span className="text-slate-500 text-[11px]">Log pengadaan &amp; nomor BKU/Kwitansi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">4. BARANG_KELUAR</strong>
                <span className="text-slate-500 text-[11px]">Log penyaluran barang, paraf &amp; no dokumen</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">5. ASET &amp; MUTASI</strong>
                <span className="text-slate-500 text-[11px]">Buku induk inventaris &amp; perpindahan lokasi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 block">6. STOCK_LEDGER &amp; SUMMARY</strong>
                <span className="text-slate-500 text-[11px]">Kartu stok mutasi berjalan &amp; saldo akhir</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'DOCS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <FileText size={16} className="text-emerald-800" />
              Ekspor Berita Acara ke Google Docs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih salah satu arsip Berita Acara (BAST, Penghapusan, Mutasi) dan jadikan Google Document formal yang bisa diedit bersama secara online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Berita Acara (Arsip Terkini)
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    setCreatedDocUrl(null);
                  }}
                  className="w-full text-xs rounded-xl border-slate-300 shadow-3xs focus:border-emerald-500 focus:ring-emerald-500 p-2.5"
                >
                  <option value="">-- Pilih Berita Acara --</option>
                  {documents.map((doc) => (
                    <option key={doc.ID} value={doc.ID}>
                      {doc.NOMOR || doc.ID} - {doc.JUDUL?.slice(0, 50)}...
                    </option>
                  ))}
                </select>
                {documents.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> Belum ada Berita Acara di aplikasi. Silakan buat dokumen terlebih dahulu di menu Pusat Dokumen.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleExportToGoogleDocs}
                disabled={isCreatingDoc || !selectedDocId}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isCreatingDoc ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Membuat Dokumen Google Docs...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Ekspor Sekarang ke Google Docs
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-4 min-h-[160px]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Detail Dokumen Ekspor
                </span>
                {selectedDocId ? (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs font-black text-slate-800">
                      {documents.find(d => d.ID === selectedDocId)?.JUDUL}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Nomor: <strong className="text-slate-700">{documents.find(d => d.ID === selectedDocId)?.NOMOR || '-'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tanggal: <strong className="text-slate-700">{documents.find(d => d.ID === selectedDocId)?.TANGGAL || '-'}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">
                    Belum ada dokumen terpilih. Sila pilih Berita Acara di samping kiri.
                  </p>
                )}
              </div>

              {createdDocUrl && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-2 animate-in fade-in">
                  <p className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <Check size={14} /> Dokumen Google Docs Berhasil Dibuat!
                  </p>
                  <a
                    href={createdDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-black underline"
                  >
                    <ExternalLink size={13} /> Buka &amp; Edit Dokumen di Google Docs
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'CALENDAR' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <CalendarIcon size={16} className="text-emerald-800" />
              Sinergi Google Calendar &amp; Google Meet Video
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Buat agenda stock opname, pemeliharaan sarpras, rapat pengadaan, dan lampirkan link ruang pertemuan virtual Google Meet secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Agenda Acara
                </label>
                <input
                  type="text"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 shadow-3xs"
                  placeholder="Contoh: Rapat Koordinasi ATK Triwulan II"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full text-xs rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 shadow-3xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu Selesai
                  </label>
                  <input
                    type="datetime-local"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full text-xs rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 shadow-3xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Pelaksanaan
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 shadow-3xs"
                  placeholder="Contoh: Ruang Guru SDN Tangerang 6"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Agenda Pembahasan
                </label>
                <textarea
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 shadow-3xs resize-none"
                  placeholder="Tulis agenda rapat atau uraian di sini..."
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="chk-meet"
                  checked={addMeetLink}
                  onChange={(e) => setAddMeetLink(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="chk-meet" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center gap-1.5">
                  <Video size={14} className="text-emerald-800 animate-pulse" />
                  Buat Tautan Google Meet Otomatis (Rapat Online)
                </label>
              </div>

              <button
                type="button"
                onClick={handleCreateCalendarEvent}
                disabled={isCreatingCalendar}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isCreatingCalendar ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan Agenda ke Cloud...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tambahkan ke Google Calendar
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between min-h-[350px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Preview Agenda Google Calendar
                  </span>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-black text-slate-800">{eventSummary || 'Koordinasi Aset'}</h4>
                      <span className="p-1 bg-emerald-50 text-emerald-800 rounded-lg">
                        <CalendarIcon size={14} />
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      <p>⏱️ <strong className="text-slate-700">{new Date(eventStartTime).toLocaleString('id-ID')}</strong> s.d. <strong className="text-slate-700">{new Date(eventEndTime).toLocaleString('id-ID')}</strong></p>
                      <p>📍 <span className="text-slate-700">{eventLocation || 'UPT SDN Tangerang 6'}</span></p>
                      <p className="line-clamp-3 text-[11px] leading-relaxed mt-2 border-t border-slate-100 pt-2 italic">
                        "{eventDescription || 'Tidak ada deskripsi.'}"
                      </p>
                    </div>
                  </div>
                </div>

                {calendarResult && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-3 animate-in fade-in mt-4">
                    <p className="text-emerald-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-700" /> Agenda Berhasil Didaftarkan ke Kalender!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={calendarResult.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-emerald-800 text-white text-center font-bold text-[11px] flex-1 flex items-center justify-center gap-1"
                      >
                        <CalendarIcon size={13} /> Buka Kalender
                      </a>

                      {calendarResult.meetLink && (
                        <a
                          href={calendarResult.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-white text-emerald-800 border border-emerald-300 text-center font-black text-[11px] flex-1 flex items-center justify-center gap-1 shadow-3xs"
                        >
                          <Video size={13} /> Gabung Google Meet
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'SLIDES' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <Presentation size={16} className="text-emerald-800" />
              Generator Google Slides Presentation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kompilasi otomatis data fisik aset, rasio kecukupan stok, belanja ATK prioritas menjadi presentasi Google Slides yang siap digunakan untuk laporan ke Dinas Pendidikan atau Komite Sekolah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Topik Presentasi Data
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="slidesTheme"
                      checked={slidesTheme === 'ASSET'}
                      onChange={() => {
                        setSlidesTheme('ASSET');
                        setCreatedSlidesUrl(null);
                      }}
                      className="text-emerald-800 focus:ring-emerald-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Laporan Kondisi &amp; Volume Aset Sekolah</span>
                      <span className="text-[11px] text-slate-500">Mencakup statistik buku induk inventaris, rasio aset dalam kondisi baik/rusak, dan rekomendasi sarpras.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="slidesTheme"
                      checked={slidesTheme === 'PLANNING'}
                      onChange={() => {
                        setSlidesTheme('PLANNING');
                        setCreatedSlidesUrl(null);
                      }}
                      className="text-emerald-800 focus:ring-emerald-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Rencana Kebutuhan Belanja ATK &amp; Inventaris</span>
                      <span className="text-[11px] text-slate-500">Analisis stok kritis berstatus minimum, perkiraan kebutuhan, dan usulan pengadaan via ARKAS.</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateSlides}
                disabled={isCreatingSlides}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isCreatingSlides ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyusun Slide Dek Presentasi...
                  </>
                ) : (
                  <>
                    <Presentation size={16} />
                    Ekspor Presentasi ke Google Slides
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between min-h-[200px]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Struktur Slide Dek yang Akan Dibuat
                </span>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p>🎞️ <strong>Slide 1:</strong> Judul Laporan Formal &amp; Instansi Sekolah</p>
                  {slidesTheme === 'ASSET' ? (
                    <>
                      <p>🎞️ <strong>Slide 2:</strong> Ringkasan Eksekutif Aset Buku Induk (Volume &amp; Rasio)</p>
                      <p>🎞️ <strong>Slide 3:</strong> Daftar Aset Rusak Berat yang Memerlukan Tindakan</p>
                      <p>🎞️ <strong>Slide 4:</strong> Rekomendasi Pemeliharaan &amp; Efisiensi Ruang Kelas</p>
                    </>
                  ) : (
                    <>
                      <p>🎞️ <strong>Slide 2:</strong> Status Persediaan Berjalan (Total Katalog vs Stok Kritis)</p>
                      <p>🎞️ <strong>Slide 3:</strong> Usulan Rencana Belanja Kebutuhan Prioritas Utama</p>
                      <p>🎞️ <strong>Slide 4:</strong> Standard Operating Procedure (SOP) Penerimaan Barang</p>
                    </>
                  )}
                </div>
              </div>

              {createdSlidesUrl && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-2 animate-in fade-in mt-4">
                  <p className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <Check size={14} /> Slide Presentasi Google Slides Berhasil Disiapkan!
                  </p>
                  <a
                    href={createdSlidesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-black underline"
                  >
                    <ExternalLink size={13} /> Buka &amp; Presentasikan Laporan Slides
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'PICKER' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <Search size={16} className="text-emerald-800" />
              Natively Integrated Google Drive Picker API
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jelajahi, pilih, dan hubungkan file atau gambar dari cloud penyimpanan Google Drive Anda langsung dari dialog overlay native yang aman.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col justify-center items-center p-8 border-2 border-dashed border-slate-300 rounded-2xl space-y-4 bg-slate-50">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-800 shadow-3xs">
                <FolderOpen size={24} />
              </div>
              <div className="text-center">
                <h4 className="text-xs font-black text-slate-700">Pilih Dokumen dari Google Drive</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                  Aman, cepat, dan terhubung langsung tanpa mengunggah ulang file secara manual dari komputer Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenGooglePicker}
                disabled={isPickerLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isPickerLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menghubungi Google...
                  </>
                ) : (
                  <>
                    <FolderOpen size={14} />
                    Pilih File dengan Google Picker
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Informasi File Terpilih
                </span>

                {pickerFile ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-2.5 animate-in fade-in">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      📄 {pickerFile.name}
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-1 font-semibold">
                      <p>ID File: <span className="font-mono text-slate-700">{pickerFile.id}</span></p>
                      <p>MIME Type: <span className="text-slate-700">{pickerFile.mimeType}</span></p>
                      {pickerFile.sizeBytes !== undefined && (
                        <p>Ukuran File: <span className="text-slate-700">{(pickerFile.sizeBytes / 1024).toFixed(1)} KB</span></p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">
                    Belum ada file Google Drive yang dipilih. Klik tombol di sebelah kiri untuk membuka Picker.
                  </p>
                )}
              </div>

              {pickerFile && (
                <a
                  href={pickerFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-3xs transition-colors"
                >
                  <ExternalLink size={14} /> Buka Tautan File di Google Drive
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'DAILY_SCAN' && (
        <DailyScanScheduleManager />
      )}
    </div>
  );
};
