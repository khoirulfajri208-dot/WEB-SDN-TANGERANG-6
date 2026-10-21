import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Check,
  Building2,
  UserCheck,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { autoSyncService, AutoSyncStatus } from '../services/autoSyncService';
import { Config } from '../types';

export const ConfigView: React.FC = () => {
  const [config, setConfig] = useState<Config>(db.getConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<AutoSyncStatus>(autoSyncService.getStatus());
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncTestResult, setSyncTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = autoSyncService.subscribe(() => {
      setAutoSyncStatus(autoSyncService.getStatus());
    });
    return unsubscribe;
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveConfig(config);
    setSaveSuccess(true);
    setAutoSyncStatus(autoSyncService.getStatus());
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestAutoSyncNow = async () => {
    setIsTestingSync(true);
    setSyncTestResult(null);
    try {
      const res = await autoSyncService.triggerSync(true);
      setSyncTestResult(res);
      setAutoSyncStatus(autoSyncService.getStatus());
    } catch (err: any) {
      setSyncTestResult({ success: false, message: err?.message || 'Gagal menjalankan uji sinkronisasi.' });
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleExportJSON = () => {
    const raw = db.exportAllDataAsJSON();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-bendahara-barang-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        db.importAllDataFromJSON(text);
        alert('Data cadangan (backup) berhasil dipulihkan!');
        window.location.reload();
      } catch (err) {
        alert('Gagal memulihkan file cadangan: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin memuat ulang database ke Data Resmi Sekolah (SDN Tangerang 6)? Data inputan manual baru akan diperbarui.'
      )
    ) {
      db.loadOfficialSchoolData();
      alert('Database berhasil diatur ulang dan diisi dengan Data Resmi Sekolah SD Negeri Tangerang 6.');
      window.location.reload();
    }
  };

  const handleApplyOfficialData = () => {
    if (
      confirm(
        'Apakah Anda ingin menerapkan & memperbarui seluruh Master Data Resmi SDN Tangerang 6 (Pegawai, Penyedia, Master Barang, Barang Masuk, Barang Keluar, dan Aset Sekolah)?'
      )
    ) {
      db.loadOfficialSchoolData();
      alert('Data Resmi Sekolah SD Negeri Tangerang 6 berhasil dimuat ke dalam aplikasi.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings size={19} className="text-slate-700" />
            Pengaturan Profil Sekolah & Pejabat Penandatangan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi kop surat resmi, pejabat penanggung jawab BAST, NIP, serta manajemen cadangan (backup & restore).
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check size={15} /> Pengaturan Disimpan!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* School Profile */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-emerald-800" />
            Identitas Sekolah (Kop Surat Resmi)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Instansi / Sekolah</label>
              <input
                type="text"
                required
                value={config.SCHOOL_NAME || ''}
                onChange={(e) => setConfig({ ...config, SCHOOL_NAME: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold focus:outline-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NPSN Sekolah</label>
              <input
                type="text"
                value={config.SCHOOL_NPSN || ''}
                onChange={(e) => setConfig({ ...config, SCHOOL_NPSN: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
            <input
              type="text"
              required
              value={config.ADDRESS || ''}
              onChange={(e) => setConfig({ ...config, ADDRESS: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kota Penandatanganan</label>
              <input
                type="text"
                required
                value={config.REPORT_SIGNATURE_CITY || ''}
                onChange={(e) => setConfig({ ...config, REPORT_SIGNATURE_CITY: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi Sekolah</label>
              <input
                type="text"
                value={config.SCHOOL_EMAIL || ''}
                onChange={(e) => setConfig({ ...config, SCHOOL_EMAIL: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website Sekolah</label>
              <input
                type="text"
                value={config.SCHOOL_WEBSITE || ''}
                onChange={(e) => setConfig({ ...config, SCHOOL_WEBSITE: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-700"
              />
            </div>
          </div>

          {/* Logo Pemda & Logo Sekolah Customization */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Logo Kedinasan & Lambang Sekolah (Untuk Kop Surat & Dokumen Resmi)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Pemda */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  {config.CITY_LOGO_URL ? (
                    <img
                      src={config.CITY_LOGO_URL}
                      alt="Logo Pemda"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">No Logo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Logo Pemda (Kiri)</label>
                  <input
                    type="text"
                    value={config.CITY_LOGO_URL || ''}
                    onChange={(e) => setConfig({ ...config, CITY_LOGO_URL: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white font-mono"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, CITY_LOGO_URL: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Lambang_Daerah_Kota_Tangerang.png' })}
                    className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                  >
                    Gunakan Lambang Resmi Kota Tangerang
                  </button>
                </div>
              </div>

              {/* Logo Sekolah */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  {config.SCHOOL_LOGO_URL ? (
                    <img
                      src={config.SCHOOL_LOGO_URL}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">No Logo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Logo Sekolah (Kanan)</label>
                  <input
                    type="text"
                    value={config.SCHOOL_LOGO_URL || ''}
                    onChange={(e) => setConfig({ ...config, SCHOOL_LOGO_URL: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white font-mono"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, SCHOOL_LOGO_URL: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo-Tut-Wuri-Handayani-PNG-Warna.png' })}
                    className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
                  >
                    Gunakan Logo Resmi Tut Wuri Handayani
                  </button>
                </div>
              </div>
            </div>

            {/* Live Kop Surat Preview */}
            <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Simulasi Pratinjau Kop Surat Resmi Dokumen:
              </span>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    {config.CITY_LOGO_URL ? (
                      <img src={config.CITY_LOGO_URL} alt="Pemda" className="w-9 h-9 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-emerald-800 text-white flex items-center justify-center text-[7px] font-black">PEMDA</div>
                    )}
                  </div>
                  <div className="flex-1 text-center min-w-0">
                    <div className="text-[10px] font-bold text-slate-800 tracking-wider">
                      PEMERINTAH KOTA {(config.REPORT_SIGNATURE_CITY || 'TANGERANG').toUpperCase()}
                    </div>
                    <div className="text-[11px] font-black text-slate-900">
                      DINAS PENDIDIKAN
                    </div>
                    <div className="text-[12px] font-black text-slate-950 mt-0.5">
                      UPT SATUAN PENDIDIKAN {(config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6').toUpperCase()}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {config.ADDRESS || 'Jl. Nyi Mas Melati No. 02, RT 05 / RW 08, Kel. Sukarasa, Kec. Tangerang'} | NPSN: {config.SCHOOL_NPSN || '20606498'}
                    </div>
                  </div>
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    {config.SCHOOL_LOGO_URL ? (
                      <img src={config.SCHOOL_LOGO_URL} alt="Sekolah" className="w-9 h-9 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-blue-800 text-white flex items-center justify-center text-[7px] font-black">SEKOLAH</div>
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-0.5">
                  <div className="h-[2px] bg-slate-900 w-full" />
                  <div className="h-[0.5px] bg-slate-900 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Google Sheets Auto-Sync Configuration Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-800" />
                Otomatisasi Sinkronisasi Google Sheets (Auto-Sync)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengunggah perubahan data secara otomatis di latar belakang ke Google Sheets tanpa mengganggu aktivitas operator.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  config.AUTO_SYNC_ENABLED === 'YA'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    config.AUTO_SYNC_ENABLED === 'YA' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                {config.AUTO_SYNC_ENABLED === 'YA' ? 'Auto-Sync Aktif' : 'Auto-Sync Nonaktif'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle Auto Sync */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Status Sinkronisasi Otomatis (Background Auto-Push)
              </label>
              <p className="text-[11px] text-slate-500">
                Pilih apakah aplikasi akan mengunggah data secara berkala ke database Google Spreadsheet.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, AUTO_SYNC_ENABLED: 'YA' })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    config.AUTO_SYNC_ENABLED === 'YA'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 size={14} /> Aktif (YA)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, AUTO_SYNC_ENABLED: 'TIDAK' })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    config.AUTO_SYNC_ENABLED !== 'YA'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Nonaktif (TIDAK)
                </button>
              </div>
            </div>

            {/* Interval Selection */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-800" />
                Interval Waktu Sinkronisasi Otomatis
              </label>
              <p className="text-[11px] text-slate-500">
                Frekuensi waktu pembaruan data ke Google Sheets di latar belakang.
              </p>
              <select
                value={config.AUTO_SYNC_INTERVAL_MINUTES || 15}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    AUTO_SYNC_INTERVAL_MINUTES: parseInt(e.target.value, 10),
                  })
                }
                disabled={config.AUTO_SYNC_ENABLED !== 'YA'}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold transition-all focus:outline-emerald-700 ${
                  config.AUTO_SYNC_ENABLED === 'YA'
                    ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value={5}>Setiap 5 Menit (Sangat Cepat / Realtime)</option>
                <option value={15}>Setiap 15 Menit (Rekomendasi Standar)</option>
                <option value={30}>Setiap 30 Menit (Hemat Bandwidth)</option>
                <option value={60}>Setiap 60 Menit (1 Jam Sekali)</option>
              </select>
            </div>
          </div>

          {/* Real-time Status and Test Trigger */}
          <div className="p-4 rounded-xl bg-emerald-900/5 border border-emerald-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">Status Koneksi:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">
                  {autoSyncStatus.connectionType === 'OAUTH'
                    ? 'Google OAuth 2.0 Terhubung'
                    : autoSyncStatus.connectionType === 'APPS_SCRIPT'
                    ? 'Apps Script Web App Terhubung'
                    : 'Belum Terhubung ke Google Sheets'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {autoSyncStatus.lastSyncTime
                  ? `Sinkronisasi terakhir: ${new Date(autoSyncStatus.lastSyncTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })} WIB`
                  : 'Belum ada riwayat sinkronisasi.'}
                {config.AUTO_SYNC_ENABLED === 'YA' && autoSyncStatus.connectionType !== 'NONE' && (
                  <span className="ml-2 text-emerald-700 font-medium">
                    (Sinkron otomatis berikutnya: berkala tiap {config.AUTO_SYNC_INTERVAL_MINUTES || 15} menit)
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestAutoSyncNow}
              disabled={isTestingSync || autoSyncStatus.connectionType === 'NONE'}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                autoSyncStatus.connectionType === 'NONE'
                  ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-400'
              }`}
            >
              <RefreshCw size={14} className={isTestingSync ? 'animate-spin text-emerald-800' : 'text-emerald-700'} />
              {isTestingSync ? 'Menyinkronkan...' : 'Uji Sinkronisasi Sekarang'}
            </button>
          </div>

          {syncTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                syncTestResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {syncTestResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-700 shrink-0" />
              )}
              <span>{syncTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Officials & Signatories */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-800" />
              Pejabat Penandatangan & Pengurus Barang
            </h3>
            <span className="text-[11px] text-slate-500">
              NIP otomatis tertera pada seluruh cetakan PDF & Berita Acara
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Kepala Sekolah (Mengetahui)</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama & Gelar</label>
                <input
                  type="text"
                  required
                  value={config.HEADMASTER || ''}
                  onChange={(e) => setConfig({ ...config, HEADMASTER: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold focus:outline-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 19680412 199303 2 005"
                  value={config.HEADMASTER_NIP || ''}
                  onChange={(e) => setConfig({ ...config, HEADMASTER_NIP: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold focus:outline-emerald-700"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Pengurus Barang / Bendahara</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama & Gelar</label>
                <input
                  type="text"
                  required
                  value={config.TREASURER || ''}
                  onChange={(e) => setConfig({ ...config, TREASURER: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold focus:outline-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIP Pengurus / Bendahara</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 19870921 201001 2 005"
                  value={config.TREASURER_NIP || ''}
                  onChange={(e) => setConfig({ ...config, TREASURER_NIP: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold focus:outline-emerald-700"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Petugas Gudang / Verifikator</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama & Gelar</label>
                <input
                  type="text"
                  required
                  value={config.WAREHOUSE_OFFICER || ''}
                  onChange={(e) => setConfig({ ...config, WAREHOUSE_OFFICER: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold focus:outline-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIP Petugas Gudang</label>
                <input
                  type="text"
                  placeholder="Contoh: 19920311 201903 1 008"
                  value={config.WAREHOUSE_OFFICER_NIP || ''}
                  onChange={(e) => setConfig({ ...config, WAREHOUSE_OFFICER_NIP: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold focus:outline-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Save size={16} /> Simpan Pengaturan
          </button>
        </div>
      </form>

      {/* Backup & Restore Management */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert size={16} className="text-slate-600" />
          Cadangan Data & Pemulihan (Backup & Restore)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <Sparkles size={14} className="text-emerald-700" />
                Data Resmi SDN Tangerang 6
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-1">
                Muat ulang seluruh Master Data resmi (Pegawai, Penyedia, ATK, Aset, Kwitansi, BKU).
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyOfficialData}
              className="mt-3 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles size={14} /> Terapkan Data Resmi
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <strong className="text-xs text-slate-800 block">Cadangkan Database (JSON)</strong>
              <p className="text-[11px] text-slate-500 mt-1">
                Unduh seluruh data master, transaksi, aset, dan riwayat mutasi dalam bentuk berkas JSON mandiri.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="mt-3 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download size={14} /> Unduh Backup JSON
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <strong className="text-xs text-slate-800 block">Pulihkan Database (JSON)</strong>
              <p className="text-[11px] text-slate-500 mt-1">
                Unggah file cadangan JSON untuk memulihkan seluruh data aplikasi secara instan.
              </p>
            </div>
            <label className="mt-3 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload size={14} /> Pilih File Cadangan
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
            <div>
              <strong className="text-xs text-rose-900 block">Reset Database</strong>
              <p className="text-[11px] text-rose-700/80 mt-1">
                Kosongkan dan inisialisasi ulang seluruh penyimpanan lokal ke data awal resmi.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} /> Reset Ulang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
