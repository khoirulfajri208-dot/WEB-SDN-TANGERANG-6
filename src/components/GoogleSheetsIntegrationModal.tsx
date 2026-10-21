import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  CloudDownload,
  FolderOpen,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Code2,
  KeyRound,
  Sparkles,
  HelpCircle,
  HardDrive,
  BookOpen,
  ArrowRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Database,
  Layers,
  Activity,
  FileText,
  Trash2,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { googleWorkspace } from '../services/googleWorkspace';

interface GoogleSheetsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const GoogleSheetsIntegrationModal: React.FC<GoogleSheetsIntegrationModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'appscript' | 'oauth' | 'drive' | 'script' | 'faq'>('guide');
  const [clientIdInput, setClientIdInput] = useState<string>('');
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string | null>(db.getGoogleAccessToken());
  const [sheetId, setSheetId] = useState<string | null>(db.getConnectedGoogleSheetId());
  const [spreadsheets, setSpreadsheets] = useState<Array<{ id: string; name: string }>>([]);
  const [driveBackups, setDriveBackups] = useState<Array<{ id: string; name: string; size: string; createdTime: string; webViewLink: string }>>([]);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number; details?: any } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const aiStudioOrigin = 'https://aistudio.google.com';
  const sharedOrigin = 'https://ais-pre-kluaacgg2gxcgvx3bswkmc-497968879468.asia-southeast1.run.app';
  const allOriginsText = `${currentOrigin}\n${aiStudioOrigin}\n${sharedOrigin}`;

  const [copiedAllOrigins, setCopiedAllOrigins] = useState(false);

  const copyAllOrigins = () => {
    navigator.clipboard.writeText(allOriginsText);
    setCopiedAllOrigins(true);
    setTimeout(() => setCopiedAllOrigins(false), 2000);
  };

  const loadUserSpreadsheets = async (token: string) => {
    setIsLoading(true);
    try {
      const files = await googleWorkspace.listUserSpreadsheets(token);
      setSpreadsheets(files);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Gagal memuat daftar Google Sheets: ' + (err.message || String(err)),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDriveBackups = async (token: string) => {
    try {
      const backups = await googleWorkspace.listDriveBackups(token);
      setDriveBackups(backups);
      const folderUrl = await googleWorkspace.getDriveFolderUrl(token);
      setDriveFolderUrl(folderUrl);
    } catch (err) {
      console.error('Drive backup list error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const savedClientId = db.getGoogleClientId() || '';
      const savedAppsScriptUrl = db.getAppsScriptUrl() || '';
      const token = db.getGoogleAccessToken();
      const currentSheetId = db.getConnectedGoogleSheetId();

      setClientIdInput(savedClientId);
      setAppsScriptUrlInput(savedAppsScriptUrl);
      setAccessToken(token);
      setSheetId(currentSheetId);
      setTestResult(null);

      if (token) {
        loadUserSpreadsheets(token);
        loadDriveBackups(token);
      }
    }
  }, [isOpen]);

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Silakan masukkan Google OAuth 2.0 Client ID Anda.',
      });
      return;
    }
    db.setGoogleClientId(clientIdInput.trim());
    setStatusMsg({
      type: 'success',
      text: 'OAuth Client ID berhasil disimpan. Anda dapat mengklik "Hubungkan Akun Google".',
    });
  };

  const handleConnectGoogle = async () => {
    const trimmedId = clientIdInput.trim();
    if (!trimmedId) {
      setStatusMsg({
        type: 'error',
        text: 'OAuth Client ID wajib diisi terlebih dahulu.',
      });
      return;
    }

    db.setGoogleClientId(trimmedId);
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Membuka jendela otorisasi akun Google...' });

    try {
      const token = await googleWorkspace.requestOAuthToken(trimmedId);
      setAccessToken(token);
      setStatusMsg({
        type: 'success',
        text: 'Akun Google berhasil terhubung! Izin Google Sheets & Google Drive aktif.',
      });
      await loadUserSpreadsheets(token);
      await loadDriveBackups(token);
    } catch (err: any) {
      const errorText = err.message || String(err);
      if (errorText.includes('invalid_client') || errorText.includes('client was not found')) {
        setStatusMsg({
          type: 'error',
          text: 'OAuth Client ID tidak ditemukan di Google Cloud. Pastikan Client ID sesuai dan Authorized JavaScript Origins telah ditambahkan.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Koneksi gagal: ' + errorText,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestOAuth = async () => {
    if (!accessToken) {
      setStatusMsg({ type: 'error', text: 'Hubungkan akun Google terlebih dahulu.' });
      return;
    }
    setIsTesting(true);
    try {
      const res = await googleWorkspace.testConnection('OAUTH', { token: accessToken, sheetId: sheetId || undefined });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Uji koneksi gagal.',
        latencyMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAppsScript = async () => {
    const url = appsScriptUrlInput.trim() || db.getAppsScriptUrl();
    if (!url) {
      setStatusMsg({ type: 'error', text: 'Masukkan Web App URL Apps Script terlebih dahulu.' });
      return;
    }
    setIsTesting(true);
    try {
      const res = await googleWorkspace.testConnection('APPS_SCRIPT', { appsScriptUrl: url });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Uji koneksi Apps Script gagal.',
        latencyMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Sedang membuat Google Spreadsheet baru beserta 9 lembar kerja skema...' });
    try {
      const schoolName = db.getConfig().SCHOOL_NAME || 'Sekolah';
      const created = await googleWorkspace.createCompleteDatabaseSpreadsheet(
        accessToken,
        `Database Bendahara Barang - ${schoolName}`
      );
      setSheetId(created.id);
      db.setConnectedGoogleSheetId(created.id);
      setStatusMsg({
        type: 'success',
        text: `Google Spreadsheet berhasil dibuat: "${created.title}". Seluruh data lokal telah disinkronkan!`,
      });
      await loadUserSpreadsheets(accessToken);
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal membuat Google Sheet: ' + err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExistingSheet = async (id: string) => {
    if (!accessToken || !id) return;
    setSheetId(id);
    db.setConnectedGoogleSheetId(id);
    setStatusMsg({ type: 'info', text: 'Spreadsheet berhasil dipilih. Anda dapat melakukan Push atau Pull data.' });
  };

  const handlePushData = async () => {
    if (!accessToken || !sheetId) return;
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Mengunggah (Push) seluruh data lokal ke Google Sheets...' });
    try {
      await googleWorkspace.pushAllDataToSheet(accessToken, sheetId);
      setStatusMsg({
        type: 'success',
        text: 'Seluruh data lokal berhasil disinkronkan ke Google Sheets!',
      });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal Push data: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!accessToken || !sheetId) return;
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets ke database lokal...' });
    try {
      await googleWorkspace.pullDataFromSheet(accessToken, sheetId);
      setStatusMsg({
        type: 'success',
        text: 'Data dari Google Sheets berhasil ditarik dan diperbarui ke aplikasi!',
      });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal Pull data: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateDriveBackup = async () => {
    if (!accessToken) {
      setStatusMsg({ type: 'error', text: 'Hubungkan akun Google terlebih dahulu untuk mencadangkan ke Google Drive.' });
      return;
    }
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Sedang membuat snapshot cadangan JSON ke Google Drive...' });
    try {
      const backup = await googleWorkspace.createDriveBackup(accessToken);
      setStatusMsg({
        type: 'success',
        text: `Cadangan database berhasil disimpan di Google Drive: "${backup.fileName}" (${(backup.sizeBytes / 1024).toFixed(1)} KB)!`,
      });
      await loadDriveBackups(accessToken);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mencadangkan ke Google Drive: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!accessToken || !fileId) return;
    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin memulihkan database dari file cadangan Google Drive "${fileName}"? Data lokal saat ini akan ditimpa.`)) {
      return;
    }
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: `Memulihkan database dari file "${fileName}"...` });
    try {
      await googleWorkspace.restoreFromDriveBackup(accessToken, fileId);
      setStatusMsg({
        type: 'success',
        text: `Database lokal berhasil dipulihkan dari cadangan Google Drive "${fileName}"!`,
      });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal memulihkan cadangan: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    db.setGoogleAccessToken(null);
    db.setConnectedGoogleSheetId(null);
    setAccessToken(null);
    setSheetId(null);
    setSpreadsheets([]);
    setDriveBackups([]);
    setDriveFolderUrl(null);
    setTestResult(null);
    setStatusMsg({ type: 'info', text: 'Koneksi Google Sheets & Drive diputus.' });
    if (onSyncComplete) onSyncComplete();
  };

  const handleSaveAppsScriptUrl = () => {
    const url = appsScriptUrlInput.trim();
    if (!url) {
      setStatusMsg({ type: 'error', text: 'Masukkan Web App URL dari Google Apps Script.' });
      return;
    }
    db.setAppsScriptUrl(url);
    setStatusMsg({ type: 'success', text: 'URL Apps Script Web App berhasil disimpan!' });
  };

  const handleAppsScriptPush = async () => {
    const url = appsScriptUrlInput.trim() || db.getAppsScriptUrl();
    if (!url) {
      setStatusMsg({ type: 'error', text: 'Masukkan Web App URL Apps Script terlebih dahulu.' });
      return;
    }
    db.setAppsScriptUrl(url);
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Mengunggah (Push) data ke Google Sheets via Apps Script...' });
    try {
      await googleWorkspace.syncWithAppsScript(url, 'PUSH');
      setStatusMsg({ type: 'success', text: 'Data berhasil disinkronkan ke Google Sheets via Apps Script Web App!' });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal Push Apps Script: ' + err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAppsScriptPull = async () => {
    const url = appsScriptUrlInput.trim() || db.getAppsScriptUrl();
    if (!url) {
      setStatusMsg({ type: 'error', text: 'Masukkan Web App URL Apps Script terlebih dahulu.' });
      return;
    }
    db.setAppsScriptUrl(url);
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets via Apps Script...' });
    try {
      await googleWorkspace.syncWithAppsScript(url, 'PULL');
      setStatusMsg({ type: 'success', text: 'Data berhasil ditarik dari Google Sheets dan diperbarui!' });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal Pull Apps Script: ' + err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const appsScriptCode = `/**
 * =========================================================================
 * APPS SCRIPT WEB APP & OTOMASI GOOGLE SHEETS + GOOGLE DRIVE
 * Sistem Aplikasi Bendahara Barang Sekolah
 * =========================================================================
 *
 * CARA PAKAI CEPAT (3 MENIT):
 * 1. Buka Google Spreadsheet baru di browser: https://sheets.new
 * 2. Klik menu Ekstensi (Extensions) > Apps Script
 * 3. Hapus kode bawaan Code.gs, tempel seluruh kode di bawah ini, lalu klik Simpan (💾)
 * 4. Klik tombol "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 5. Pilih tipe: "Web app" (Aplikasi Web)
 * 6. Atur:
 *    - Execute as (Jalankan sebagai): 'Me' (Saya)
 *    - Who has access (Yang memiliki akses): 'Anyone' (Siapa saja)
 * 7. Klik "Deploy", izinkan akses Google Akun Anda, lalu salin Web App URL-nya
 * 8. Tempel Web App URL ke aplikasi Bendahara Barang pada tab "Metode 1: Apps Script"!
 */

const SCHEMAS = {
  CONFIG: ['KEY', 'VALUE'],
  USERS: ['ID', 'NIP', 'NAMA', 'EMAIL', 'ROLE', 'STATUS'],
  SUPPLIERS: ['ID', 'NAMA_TOKO', 'ALAMAT', 'TELEPON', 'NARAHUBUNG', 'STATUS'],
  ITEMS: ['ID', 'KODE_BARANG', 'NAMA_BARANG', 'KATEGORI', 'JENIS_SATUAN', 'TIPE', 'KODE_REKENING_RKAS', 'BATAS_MINIMUM', 'LOKASI_DEFAULT', 'STATUS'],
  BARANG_MASUK: ['ID', 'TIMESTAMP', 'TANGGAL', 'BULAN_PENGADAAN', 'NAMA_TOKO', 'KODE_BARANG', 'NAMA_BARANG', 'JUMLAH', 'JENIS_SATUAN', 'HARGA_SATUAN', 'TOTAL_PENGADAAN', 'NAMA_SEKOLAH', 'SUMBER_ANGGARAN', 'KODE_REKENING_RKAS', 'NOMOR_BKU', 'NOMOR_KWITANSI', 'FOTO_LINK', 'PETUGAS', 'KETERANGAN', 'STOCK_SYNC_STATUS', 'STOCK_SYNC_AT'],
  BARANG_KELUAR: ['ID', 'TIMESTAMP', 'TANGGAL', 'KODE_BARANG', 'NAMA_BARANG', 'JUMLAH', 'JENIS_SATUAN', 'PENERIMA', 'UNIT_RUANGAN', 'TUJUAN_PENGGUNAAN', 'PETUGAS', 'FOTO_LINK', 'PARAF_LINK', 'KETERANGAN', 'STATUS_TRANSAKSI', 'NOMOR_DOKUMEN', 'DISETUJUI_OLEH', 'WAKTU_PERSETUJUAN', 'CATATAN_PERSETUJUAN', 'STOCK_SYNC_STATUS', 'STOCK_SYNC_AT'],
  ASET: ['ID', 'KODE_ASET', 'KODE_BARANG', 'NAMA_BARANG', 'SUB_KEGIATAN', 'KODE_REKENING', 'KODE_LOKASI', 'TANGGAL_BKU', 'NOMOR_BKU', 'NOMOR_KWITANSI', 'NAMA_TOKO', 'NAMA_BARANG_RKAS', 'MERK', 'SPESIFIKASI', 'JUMLAH', 'JENIS_SATUAN', 'HARGA_SATUAN', 'TOTAL_NILAI', 'LOKASI', 'PENANGGUNG_JAWAB', 'KONDISI', 'STATUS', 'FOTO_LINK', 'KETERANGAN', 'QR_TOKEN', 'QR_URL', 'QR_TARGET_URL', 'QR_TYPE'],
  MUTASI: ['ID', 'TIMESTAMP', 'TANGGAL', 'KODE_BARANG', 'KODE_ASET', 'NAMA_BARANG', 'DARI_LOKASI', 'KE_LOKASI', 'DARI_PJ', 'KE_PJ', 'PETUGAS', 'FOTO_LINK', 'ALASAN', 'KETERANGAN'],
  STOCK_LEDGER: ['LEDGER_ID', 'TIMESTAMP', 'TANGGAL', 'KODE_BARANG', 'NAMA_BARANG', 'JENIS_SATUAN', 'QTY_IN', 'QTY_OUT', 'SALDO_SESUDAH', 'REF_TYPE', 'REF_ID', 'NOMOR_DOKUMEN', 'STATUS', 'SOURCE', 'LEDGER_KEY'],
  STOCK_SUMMARY: ['KODE_BARANG', 'NAMA_BARANG', 'JENIS_SATUAN', 'TOTAL_MASUK', 'TOTAL_KELUAR', 'TOTAL_ADJUSTMENT', 'STOK', 'BATAS_MINIMUM', 'LAST_MOVEMENT', 'UPDATED_AT']
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'PULL';
    if (action === 'PING') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Google Apps Script Web App Online & Siap Digunakan!',
        timestamp: new Date().toISOString(),
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupAllSheets();
    const result = {};
    Object.keys(SCHEMAS).forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet && sheet.getLastRow() > 1) {
        const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SCHEMAS[name].length).getValues();
        result[name.toLowerCase()] = values;
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupAllSheets();
    
    if (postData.action === 'PUSH' && postData.data) {
      const d = postData.data;
      if (d.users) syncTable(ss, 'USERS', SCHEMAS.USERS, d.users.map(u => [u.ID, u.NIP, u.NAMA, u.EMAIL, u.ROLE, u.STATUS]));
      if (d.suppliers) syncTable(ss, 'SUPPLIERS', SCHEMAS.SUPPLIERS, d.suppliers.map(s => [s.ID, s.NAMA_TOKO, s.ALAMAT, s.TELEPON, s.NARAHUBUNG, s.STATUS]));
      if (d.items) syncTable(ss, 'ITEMS', SCHEMAS.ITEMS, d.items.map(i => [i.ID, i.KODE_BARANG, i.NAMA_BARANG, i.KATEGORI, i.JENIS_SATUAN, i.TIPE, i.KODE_REKENING_RKAS || '', i.BATAS_MINIMUM, i.LOKASI_DEFAULT, i.STATUS]));
      if (d.barangMasuk) syncTable(ss, 'BARANG_MASUK', SCHEMAS.BARANG_MASUK, d.barangMasuk.map(m => [m.ID, m.TIMESTAMP, m.TANGGAL, m.BULAN_PENGADAAN || '', m.NAMA_TOKO, m.KODE_BARANG, m.NAMA_BARANG, m.JUMLAH, m.JENIS_SATUAN, m.HARGA_SATUAN, m.TOTAL_PENGADAAN, m.NAMA_SEKOLAH, m.SUMBER_ANGGARAN, m.KODE_REKENING_RKAS, m.NOMOR_BKU, m.NOMOR_KWITANSI, m.FOTO_LINK || '', m.PETUGAS, m.KETERANGAN || '', m.STOCK_SYNC_STATUS || 'SYNCED', m.STOCK_SYNC_AT || '']));
      if (d.barangKeluar) syncTable(ss, 'BARANG_KELUAR', SCHEMAS.BARANG_KELUAR, d.barangKeluar.map(k => [k.ID, k.TIMESTAMP, k.TANGGAL, k.KODE_BARANG, k.NAMA_BARANG, k.JUMLAH, k.JENIS_SATUAN, k.PENERIMA, k.UNIT_RUANGAN, k.TUJUAN_PENGGUNAAN, k.PETUGAS, k.FOTO_LINK || '', k.PARAF_LINK || '', k.KETERANGAN || '', k.STATUS_TRANSAKSI, k.NOMOR_DOKUMEN, k.DISETUJUI_OLEH || '', k.WAKTU_PERSETUJUAN || '', k.CATATAN_PERSETUJUAN || '', k.STOCK_SYNC_STATUS || 'SYNCED', k.STOCK_SYNC_AT || '']));
      if (d.assets) syncTable(ss, 'ASET', SCHEMAS.ASET, d.assets.map(a => [a.ID, a.KODE_ASET, a.KODE_BARANG, a.NAMA_BARANG, a.SUB_KEGIATAN || '', a.KODE_REKENING || '', a.KODE_LOKASI || '', a.TANGGAL_BKU || '', a.NOMOR_BKU || '', a.NOMOR_KWITANSI || '', a.NAMA_TOKO || '', a.NAMA_BARANG_RKAS || '', a.MERK || '', a.SPESIFIKASI || '', a.JUMLAH, a.JENIS_SATUAN, a.HARGA_SATUAN, a.TOTAL_NILAI, a.LOKASI, a.PENANGGUNG_JAWAB, a.KONDISI, a.STATUS, a.FOTO_LINK || '', a.KETERANGAN || '', a.QR_TOKEN || a.KODE_ASET, a.QR_URL || '', a.QR_TARGET_URL || '', a.QR_TYPE || 'DETAIL_ASSET']));
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data inventaris berhasil disinkronkan ke Google Sheets!' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aksi tidak dikenali' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function syncTable(ss, sheetName, headers, rows) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#166534').setFontColor('#ffffff');
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMAS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() < 1) {
      sheet.getRange(1, 1, 1, SCHEMAS[name].length).setValues([SCHEMAS[name]]);
      sheet.getRange(1, 1, 1, SCHEMAS[name].length).setFontWeight('bold').setBackground('#166534').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📦 Bendahara Barang')
    .addItem('⚙️ Inisialisasi Seluruh Sheet', 'setupAllSheets')
    .addItem('💾 Backup Database ke Google Drive', 'backupDatabaseToDrive')
    .addToUi();
}

function backupDatabaseToDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folderName = 'Backup Bendahara Barang';
  const it = DriveApp.getFoldersByName(folderName);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(folderName);
  const file = DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' - Backup ' + new Date().toISOString(), folder);
  SpreadsheetApp.getUi().alert('Backup otomatis tersimpan di Google Drive: ' + file.getName());
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const downloadScriptFile = () => {
    const element = document.createElement('a');
    const file = new Blob([appsScriptCode], { type: 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = 'Code.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyOriginUrl = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-white shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Pusat Koneksi & Integrasi Google Sheets & Drive
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  2-Way Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih metode koneksi praktis untuk sinkronisasi inventaris, kartu stok, dan pencadangan Google Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2 overflow-x-auto gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={15} /> 1. Panduan Langkah Demi Langkah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appscript')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'appscript'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={15} /> 2. Metode Apps Script (Paling Mudah)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'oauth'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound size={15} /> 3. Metode OAuth 2.0 (Google Cloud)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'drive'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive size={15} /> 4. Google Drive &amp; Cadangan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'script'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code2 size={15} /> 5. Kode Code.gs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'faq'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle size={15} /> Solusi Error &amp; FAQ
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message Notification */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <div className="mt-0.5">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : statusMsg.type === 'error' ? (
                  <AlertCircle size={16} />
                ) : (
                  <Activity size={16} />
                )}
              </div>
              <div className="flex-1 font-semibold">{statusMsg.text}</div>
            </div>
          )}

          {/* Test Diagnostic Result */}
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
                <div>
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.details?.email && (
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Akun: <strong>{testResult.details.email}</strong> {testResult.details.sheetTitle && `| Sheet: ${testResult.details.sheetTitle}`}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-bold">
                {testResult.latencyMs} ms
              </span>
            </div>
          )}

          {/* TAB 1: PANDUAN LANGKAH DEMI LANGKAH */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <Sparkles size={17} className="text-emerald-700" />
                  Pilihan Cara Terkoneksi ke Google Spreadsheet &amp; Google Drive
                </h4>
                <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                  Aplikasi menyediakan 2 metode integrasi yang fleksibel. Anda dapat memilih metode yang paling praktis sesuai preferensi:
                </p>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method 1 Card */}
                <div className="p-4 rounded-2xl bg-white border-2 border-emerald-600/30 hover:border-emerald-600 shadow-xs transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        Sangat Direkomendasikan
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Metode 1</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-emerald-700" />
                      Google Apps Script Web App
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Tanpa Google Cloud Console</strong> dan tanpa konfigurasi OAuth Client ID. Cukup buat Google Sheets baru, tempel kode Apps Script, klik Deploy Web App, lalu tempel URL-nya!
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1 pt-1">
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Setup instan kurang dari 3 menit
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Bebas blokir popup atau verifikasi domain
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Sinkronisasi 2 arah otomatis (Push &amp; Pull)
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('appscript')}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    Buka Setup Apps Script <ArrowRight size={14} />
                  </button>
                </div>

                {/* Method 2 Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                        Google Cloud Native
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Metode 2</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <KeyRound size={16} className="text-blue-700" />
                      Google OAuth 2.0 Client ID
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Login langsung menggunakan akun Google resmi. Memerlukan pembuatan <strong>OAuth Client ID</strong> di Google Cloud Console.
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1 pt-1">
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Pembuatan spreadsheet otomatis dari aplikasi
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Upload foto nota &amp; paraf langsung ke Google Drive
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" /> Cadangan snapshot database ke Google Drive
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('oauth')}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    Buka Setup OAuth 2.0 <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-800" />
                  Alur Kerja Sinkronisasi Database
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <div className="font-bold text-slate-800">Database Lokal (Cepat)</div>
                    <p className="text-[11px] text-slate-500">Aplikasi bekerja 100% responsif secara lokal saat input barang, paraf, dan aset.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <div className="font-bold text-slate-800">Google Sheets (Arsip &amp; Rekap)</div>
                    <p className="text-[11px] text-slate-500">Data dikirim otomatis (Push) ke spreadsheet sehingga kepala sekolah/auditor bisa memantau online.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <div className="font-bold text-slate-800">Google Drive (Pencadangan)</div>
                    <p className="text-[11px] text-slate-500">Folder Google Drive menyimpan bukti fisik nota belanja, tanda terima paraf, dan backup JSON.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METODE APPS SCRIPT WEB APP */}
          {activeTab === 'appscript' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                    <Sparkles size={16} className="text-emerald-800" />
                    Langkah Pemasangan Google Apps Script Web App (3 Menit):
                  </div>
                  <button
                    type="button"
                    onClick={downloadScriptFile}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-900 transition-colors"
                  >
                    <Download size={12} /> Unduh Code.gs
                  </button>
                </div>

                <ol className="text-xs text-emerald-900 list-decimal list-inside space-y-1.5 leading-relaxed pt-1">
                  <li>
                    Buka Google Sheets Anda atau buat baru di{' '}
                    <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-bold inline-flex items-center gap-0.5 text-emerald-800">
                      sheets.new <ExternalLink size={10} />
                    </a>
                  </li>
                  <li>
                    Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Hapus isi bawaan file <code>Code.gs</code>, salin kode dari tab <em>"5. Kode Code.gs"</em> dan tempel ke editor, lalu klik <strong>Simpan (💾)</strong>.
                  </li>
                  <li>
                    Klik tombol biru <strong>Deploy (Terapkan)</strong> &gt; <strong>New deployment (Penerapan baru)</strong> &gt; Pilih tipe <strong>Web app (Aplikasi Web)</strong>.
                  </li>
                  <li>
                    Setel <em>Execute as</em>: <strong>Me (Saya)</strong> dan <em>Who has access</em>: <strong>Anyone (Siapa saja)</strong>.
                  </li>
                  <li>Klik <strong>Deploy</strong>, izinkan akses akun Google Anda, lalu salin <strong>Web App URL</strong> dan tempel di bawah ini!</li>
                </ol>
              </div>

              {/* Input URL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tempel Web App URL Google Apps Script Anda:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={appsScriptUrlInput}
                    onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono focus:outline-emerald-700 shadow-2xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAppsScriptUrl}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors shrink-0"
                    >
                      Simpan URL
                    </button>
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={handleTestAppsScript}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                    >
                      <Activity size={13} className={isTesting ? 'animate-spin' : ''} />
                      Uji Koneksi
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleAppsScriptPush}
                    disabled={isSyncing}
                    className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <CloudUpload size={16} /> Unggah (Push) Data Lokal ke Spreadsheet
                  </button>
                  <button
                    type="button"
                    onClick={handleAppsScriptPull}
                    disabled={isSyncing}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 shadow-xs transition-colors"
                  >
                    <CloudDownload size={16} /> Tarik (Pull) Data dari Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OAUTH 2.0 */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {/* Step 1: Client ID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={14} className="text-emerald-800" />
                    1. Konfigurasi Google Cloud OAuth 2.0 Client ID
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dibuat di{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 underline font-bold inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console &gt; Credentials <ExternalLink size={10} />
                    </a>{' '}
                    dengan tipe <em>Web application</em>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Contoh: 1234567890-abcdefg.apps.googleusercontent.com"
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono focus:outline-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors shrink-0"
                    >
                      Simpan Client ID
                    </button>
                  </div>

                  {/* Copy Origin Helper & Error 401 Guide */}
                  <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5 text-[11px]">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={15} className="text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-950 block font-bold">
                          Mengatasi "Error 401: invalid_client" atau "no registered origin":
                        </strong>
                        <p className="text-amber-900/90 mt-0.5 leading-relaxed">
                          Google mewajibkan domain asal didaftarkan di Google Cloud Console pada bagian <strong>"Authorized JavaScript origins" (Asal JavaScript yang diotorisasi)</strong>:
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 space-y-1.5 font-mono text-[10px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-slate-700 font-semibold">{currentOrigin}</span>
                        <button
                          type="button"
                          onClick={copyOriginUrl}
                          className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-sans font-bold shrink-0 flex items-center gap-1 transition-colors"
                        >
                          {copiedOrigin ? <Check size={11} /> : <Copy size={11} />}
                          {copiedOrigin ? 'Tersalin!' : 'Salin URL Utama'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100">
                        <span className="truncate text-slate-700 font-semibold">https://aistudio.google.com</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('https://aistudio.google.com');
                            alert('URL https://aistudio.google.com tersalin ke clipboard!');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans font-bold shrink-0 flex items-center gap-1 transition-colors"
                        >
                          <Copy size={11} /> Salin AI Studio URL
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={copyAllOrigins}
                        className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedAllOrigins ? <Check size={12} /> : <Copy size={12} />}
                        {copiedAllOrigins ? 'Semua URL Tersalin!' : 'Salin Semua URL Sekaligus'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('appscript')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Sparkles size={12} /> Atau Gunakan Metode 1: Apps Script (Bebas Error)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Connect Account */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Status Otorisasi Akun Google
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {accessToken
                      ? 'Akun Google aktif terhubung. Izin Google Sheets & Google Drive siap digunakan.'
                      : 'Klik tombol di samping untuk masuk dengan akun Google Anda.'}
                  </p>
                </div>
                {accessToken ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={handleTestOAuth}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 transition-colors"
                    >
                      <Activity size={13} className={isTesting ? 'animate-spin' : ''} />
                      Uji Koneksi
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      Putuskan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    {isLoading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
                  </button>
                )}
              </div>

              {/* Step 3: Spreadsheet Selector & Sync */}
              {accessToken && (
                <div className="p-4 rounded-2xl bg-emerald-900/5 border border-emerald-800/20 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    3. Target Spreadsheet &amp; Sinkronisasi Data
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleCreateNewSheet}
                      disabled={isLoading || isSyncing}
                      className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <PlusCircle size={16} /> Buat Spreadsheet Database Baru Otomatis
                    </button>

                    {sheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 transition-colors shadow-2xs"
                      >
                        <ExternalLink size={15} /> Buka Spreadsheet di Tab Baru
                      </a>
                    )}
                  </div>

                  {spreadsheets.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Atau pilih Spreadsheet yang sudah ada di Google Drive Anda:
                      </label>
                      <select
                        value={sheetId || ''}
                        onChange={(e) => handleSelectExistingSheet(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
                      >
                        <option value="">-- Pilih Spreadsheet --</option>
                        {spreadsheets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (ID: {s.id.slice(0, 8)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sheetId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-800/10">
                      <button
                        type="button"
                        onClick={handlePushData}
                        disabled={isSyncing || isLoading}
                        className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <CloudUpload size={16} /> Unggah (Push) Data Lokal ke Sheets
                      </button>
                      <button
                        type="button"
                        onClick={handlePullData}
                        disabled={isSyncing || isLoading}
                        className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 shadow-xs transition-colors"
                      >
                        <CloudDownload size={16} /> Tarik (Pull) Data dari Sheets
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE & CADANGAN */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive size={15} className="text-emerald-800" />
                    Pencadangan Snapshot Database ke Google Drive
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simpan salinan database lengkap sekolah Anda secara periodik ke folder khusus di Google Drive Anda.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {driveFolderUrl && (
                    <a
                      href={driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <FolderOpen size={14} /> Buka Folder di Drive
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateDriveBackup}
                    disabled={isSyncing || !accessToken}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    <CloudUpload size={14} /> Cadangkan Sekarang
                  </button>
                </div>
              </div>

              {/* Backups List */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Database size={14} className="text-slate-600" />
                    Daftar File Cadangan di Folder "Backup Bendahara Barang"
                  </h5>
                  {accessToken && (
                    <button
                      type="button"
                      onClick={() => loadDriveBackups(accessToken)}
                      className="text-xs text-emerald-800 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Segarkan Daftar
                    </button>
                  )}
                </div>

                {!accessToken ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Hubungkan akun Google OAuth 2.0 terlebih dahulu untuk melihat dan mengelola file cadangan Google Drive.
                  </div>
                ) : driveBackups.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada file cadangan di Google Drive. Klik tombol <strong>"Cadangkan Sekarang"</strong> di atas untuk membuat salinan pertama Anda.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {driveBackups.map((b) => (
                      <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={18} className="text-emerald-700 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{b.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(b.createdTime).toLocaleString('id-ID')} &bull; {b.size}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={b.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Lihat
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRestoreFromDrive(b.id, b.name)}
                            disabled={isSyncing}
                            className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <CloudDownload size={11} /> Pulihkan Data
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CODE.GS */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Kode Sumber Google Apps Script (Code.gs)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salin kode di bawah ini atau unduh file langsung untuk dipasang di editor Google Apps Script Anda.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={downloadScriptFile}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} /> Unduh File
                  </button>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                    {copiedScript ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: FAQ & TROUBLESHOOTING */}
          {activeTab === 'faq' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">1. Apa perbedaan Metode Apps Script vs OAuth 2.0?</strong>
                <p className="text-slate-600 leading-relaxed">
                  Metode <strong>Apps Script Web App</strong> tidak memerlukan registrasi project di Google Cloud Console, sehingga sangat mudah dan bebas dari kendala konfigurasi domain. Metode <strong>OAuth 2.0</strong> memberikan integrasi langsung dengan Google Identity dan Drive API untuk upload berkas foto dan pembuatan spreadsheet otomatis.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">2. Muncul pesan "Popup closed by user" atau "redirect_uri_mismatch"?</strong>
                <p className="text-slate-600 leading-relaxed">
                  Pastikan pop-up browser Anda tidak diblokir. Pada Google Cloud Console di bagian <em>Credentials &gt; OAuth 2.0 Client IDs</em>, pastikan <strong>Authorized JavaScript origins</strong> diisi dengan URL browser saat ini (klik tombol <em>"Salin Asal URL"</em> di tab OAuth).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">3. Apakah data inventaris lokal aman jika browser ditutup?</strong>
                <p className="text-slate-600 leading-relaxed">
                  Ya, seluruh data tersimpan di LocalStorage peramban Anda. Dengan mengaktifkan <strong>Sinkronisasi Real-Time</strong> atau <strong>Auto-Sync</strong>, data juga otomatis dikirim ke Google Sheets dan Google Drive Anda sebagai cadangan cloud terpusat.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">4. Bagaimana cara memulihkan data jika berganti laptop atau komputer?</strong>
                <p className="text-slate-600 leading-relaxed">
                  Cukup buka aplikasi di laptop baru &gt; buka menu <em>Integrasi Google Sheets &amp; Drive</em> &gt; hubungkan spreadsheet Anda &gt; lalu klik tombol <strong>"Tarik (Pull) Data dari Sheets"</strong> atau pulihkan dari tab <strong>"Google Drive &amp; Cadangan"</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${accessToken || appsScriptUrlInput ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span>{accessToken ? 'Google OAuth Terhubung' : appsScriptUrlInput ? 'Apps Script Terpasang' : 'Belum Terhubung'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
