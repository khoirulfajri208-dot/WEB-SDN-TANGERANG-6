import React, { useState, useEffect } from 'react';
import {
  Clock,
  Mail,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Calendar,
  UserCheck,
  ShieldCheck,
  Download,
  Eye,
  Check,
  Sparkles,
  ExternalLink,
  Trash2,
  HardDrive,
  QrCode,
  Users,
  Building,
  CheckSquare,
  Square,
} from 'lucide-react';
import { dailyScanSchedulerService } from '../services/dailyScanSchedulerService';
import { DailyScanDeliveryLog, DailyScanScheduleConfig } from '../types';
import { db } from '../services/localStorageService';
import { QRScanLogItem } from '../services/pdfService';

export const DailyScanScheduleManager: React.FC = () => {
  const [config, setConfig] = useState<DailyScanScheduleConfig>(dailyScanSchedulerService.getConfig());
  const [logs, setLogs] = useState<DailyScanDeliveryLog[]>(dailyScanSchedulerService.getDeliveryLogs());
  const [todayScans, setTodayScans] = useState<QRScanLogItem[]>([]);
  const [nextRunInfo, setNextRunInfo] = useState(dailyScanSchedulerService.getNextRunInfo());
  const [isExecuting, setIsExecuting] = useState(dailyScanSchedulerService.getIsExecuting());

  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);

  const loadData = () => {
    setConfig(dailyScanSchedulerService.getConfig());
    setLogs(dailyScanSchedulerService.getDeliveryLogs());
    setTodayScans(dailyScanSchedulerService.getTodayScans());
    setNextRunInfo(dailyScanSchedulerService.getNextRunInfo());
    setIsExecuting(dailyScanSchedulerService.getIsExecuting());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dailyScanSchedulerService.subscribe(() => {
      loadData();
    });

    const interval = setInterval(() => {
      setNextRunInfo(dailyScanSchedulerService.getNextRunInfo());
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSaveConfig = () => {
    setIsSaving(true);
    try {
      dailyScanSchedulerService.updateConfig(config);
      setActionMessage({
        type: 'success',
        text: 'Konfigurasi penjadwalan otomatis berhasil disimpan.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e: any) {
      setActionMessage({
        type: 'error',
        text: 'Gagal menyimpan konfigurasi: ' + e.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerManual = async () => {
    setIsExecuting(true);
    setActionMessage({
      type: 'info',
      text: 'Sedang mengekspor PDF rekapitulasi dan memproses pengiriman ke email Kepala Sekolah...',
    });

    try {
      const result = await dailyScanSchedulerService.executeScheduledJob(true);
      setActionMessage({
        type: 'success',
        text: `Laporan harian berhasil dikirim ke ${result.targetEmail} (${result.totalScans} data pemindaian terlampir)!`,
      });
      loadData();
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Gagal mengirim laporan: ' + (err.message || 'Kesalahan jaringan'),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsPreviewingPdf(true);
    try {
      const { doc, fileName } = await dailyScanSchedulerService.generateDailyReportPDF();
      doc.save(fileName);
      setActionMessage({
        type: 'success',
        text: `Dokumen PDF "${fileName}" berhasil diunduh ke perangkat Anda.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Gagal mengunduh PDF: ' + err.message,
      });
    } finally {
      setIsPreviewingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider text-emerald-200">
              <Clock size={12} className="text-emerald-300 animate-spin" />
              <span>Otomasi Terjadwal Harian • 15:00 WIB</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ekspor Log Scan Harian ke Email Kepala Sekolah
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Sistem secara otomatis mengagregasi seluruh aktivitas pemindaian presensi siswa, verifikasi aset sarpras,
              dan evaluasi tugas menjadi dokumen PDF ber-Kop resmi, lalu mengirimkannya setiap hari pada pukul 15.00 ke
              email Kepala Sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isPreviewingPdf}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isPreviewingPdf ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Pratinjau / Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerManual}
              disabled={isExecuting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-900 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-slate-900" />
                  <span>Memproses Pengiriman...</span>
                </>
              ) : (
                <>
                  <Send size={14} className="text-slate-900" />
                  <span>Kirim Sekarang (Uji Coba)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <div>
              <div className="text-[10px] text-emerald-200 uppercase font-bold">Status Penjadwalan</div>
              <div className="font-bold text-white">{config.enabled ? 'AKTIF (Otomatis)' : 'NONAKTIF'}</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <Clock size={16} className="text-amber-300 shrink-0" />
            <div>
              <div className="text-[10px] text-emerald-200 uppercase font-bold">Jadwal Pengiriman Berikutnya</div>
              <div className="font-bold text-white">{nextRunInfo.text}</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <Mail size={16} className="text-teal-300 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-emerald-200 uppercase font-bold">Penerima Laporan (Kepsek)</div>
              <div className="font-bold text-white truncate" title={config.targetEmail}>
                {config.targetEmail}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Notification Toast */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : actionMessage.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          ) : (
            <RefreshCw size={18} className="text-blue-600 shrink-0 animate-spin" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Two Columns: Configuration & Today's Scan Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule Settings (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Pengaturan Penjadwalan & Email</h3>
                <p className="text-[11px] text-slate-500">Sesuaikan waktu dan tujuan pengiriman otomatis laporan harian</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">{config.enabled ? 'Aktif' : 'Nonaktif'}</span>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Pengiriman Otomatis (WIB)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Default resmi: 15.00 WIB setiap sore hari kerja</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Kepala Sekolah (Penerima)
              </label>
              <input
                type="email"
                value={config.targetEmail}
                onChange={(e) => setConfig({ ...config, targetEmail: e.target.value })}
                placeholder="sdnegeritangerang6@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-emerald-600 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Kepala Sekolah: {config.targetName}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Kategori Log Pemindaian yang Disertakan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.includeStudentAttendance}
                  onChange={(e) => setConfig({ ...config, includeStudentAttendance: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Presensi & Kehadiran Siswa</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.includeAssetScans}
                  onChange={(e) => setConfig({ ...config, includeAssetScans: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Verifikasi Fisik Aset Sarpras</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.includeAssignmentScans}
                  onChange={(e) => setConfig({ ...config, includeAssignmentScans: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Evaluasi Tugas & CBT Digital</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.includeStockOpname}
                  onChange={(e) => setConfig({ ...config, includeStockOpname: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Stock Opname & Cek Gudang</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50/60 border border-teal-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoDriveBackup}
                onChange={(e) => setConfig({ ...config, autoDriveBackup: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-teal-900">Arsipkan Salinan PDF ke Google Drive</div>
                <div className="text-[11px] text-teal-700">
                  Otomatis menyimpan salinan PDF di folder &quot;Laporan Harian Kepala Sekolah&quot; pada Google Drive terhubung.
                </div>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Terakhir Terkirim: {config.lastSentDate ? `${config.lastSentDate} (${config.lastSentTimestamp ? new Date(config.lastSentTimestamp).toLocaleTimeString('id-ID') : ''})` : 'Belum pernah dikirim'}
            </span>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>

        {/* Right Column: Today's Summary & Scans (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">Aktivitas Scan Hari Ini</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                {todayScans.length} Scan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 my-3.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Presensi Siswa</div>
                <div className="text-lg font-black text-slate-900">
                  {todayScans.filter((s) => s.type === 'STUDENT').length}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Aset & Sarpras</div>
                <div className="text-lg font-black text-slate-900">
                  {todayScans.filter((s) => s.type === 'ASSET').length}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {todayScans.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada aktivitas pemindaian yang tercatat hari ini.
                </div>
              ) : (
                todayScans.slice(0, 8).map((sc, idx) => (
                  <div
                    key={sc.id || idx}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <div className="font-bold text-slate-900 truncate">{sc.title}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">{sc.code}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {new Date(sc.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              Format dokumen PDF telah disesuaikan dengan Kop Surat Kota Tangerang, nomor naskah dinas resmi, dan lembar
              tanda tangan Kepala Sekolah.
            </div>
          </div>
        </div>
      </div>

      {/* Delivery History Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-slate-800" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Riwayat Pengiriman Laporan Terjadwal</h3>
              <p className="text-[11px] text-slate-500">Catatan riwayat dokumen PDF yang telah dikirimkan ke Kepala Sekolah</p>
            </div>
          </div>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => dailyScanSchedulerService.clearDeliveryLogs()}
              className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Belum ada riwayat pengiriman laporan. Pengiriman terjadwal akan otomatis tercatat setiap hari pukul 15.00 WIB,
            atau Anda dapat mengklik tombol &quot;Kirim Sekarang (Uji Coba)&quot; di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Waktu & Tanggal</th>
                  <th className="py-2.5 px-3">Penerima</th>
                  <th className="py-2.5 px-3">Total Scan</th>
                  <th className="py-2.5 px-3">Dokumen PDF</th>
                  <th className="py-2.5 px-3">Layanan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                      <div>{log.date}</div>
                      <div className="text-[10px] text-slate-400">{log.time} WIB</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{log.targetName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{log.targetEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {log.totalScans} scan
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 text-[11px] truncate max-w-xs">
                      {log.pdfFileName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {log.serviceUsed}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 size={13} />
                          <span>Terkirim</span>
                        </span>
                      ) : log.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Memproses</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]" title={log.error}>
                          <AlertCircle size={13} />
                          <span>Gagal</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {log.driveFileUrl ? (
                        <a
                          href={log.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                        >
                          <HardDrive size={12} />
                          <span>Buka Drive</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="text-xs text-slate-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={12} />
                          <span>Unduh PDF</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
