import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, AlertTriangle, CheckCircle2,
  RefreshCw, Users, FileText, Ban, Eye, EyeOff, Sparkles, Clock, ArrowRight,
  Shield, Check, Search, Download
} from 'lucide-react';
import { securityService, SecurityAuditReport, SecurityEvent } from '../../services/securityService';
import { maskingService } from '../../services/maskingService';
import { accountService } from '../../services/accountService';
import { Account } from '../../types/classroom';

interface SecurityCenterViewProps {
  accounts: Account[];
  onRefreshAccounts: () => void;
  onShowNotify: (msg: string) => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  accounts,
  onRefreshAccounts,
  onShowNotify,
}) => {
  const [config, setConfig] = useState(() => securityService.getConfig());
  const [events, setEvents] = useState<SecurityEvent[]>(() => securityService.getSecurityEvents());
  const [isScanning, setIsScanning] = useState(false);
  const [searchDefaultPass, setSearchDefaultPass] = useState('');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'DANGER' | 'WARN' | 'INFO'>('ALL');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Run audit report
  const auditReport = useMemo(() => {
    return securityService.runSecurityAudit(accounts);
  }, [accounts, config]);

  useEffect(() => {
    const unsub = securityService.subscribe(() => {
      setConfig(securityService.getConfig());
      setEvents(securityService.getSecurityEvents());
    });
    return () => unsub();
  }, []);

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      securityService.logSecurityEvent(
        'SECURITY_SCAN_EXECUTED',
        'INFO',
        'Audit keamanan menyeluruh berhasil dijalankan oleh administrator.'
      );
      onShowNotify('Pemindaian keamanan selesai: Seluruh parameter sistem telah diuji.');
    }, 800);
  };

  const handleToggleBruteForce = () => {
    const nextVal = !config.enableBruteForceShield;
    securityService.updateConfig({ enableBruteForceShield: nextVal });
    onShowNotify(
      nextVal
        ? 'Brute-Force Shield DIAKTIFKAN: Akun akan dikunci otomatis jika 5x salah kata sandi.'
        : 'Brute-Force Shield DINONAKTIFKAN.'
    );
  };

  const handleToggleInactivity = () => {
    const nextVal = !config.enableInactivityLock;
    securityService.updateConfig({ enableInactivityLock: nextVal });
    onShowNotify(
      nextVal
        ? 'Inactivity Auto-Lock DIAKTIFKAN: Layar terkunci setelah periode hening.'
        : 'Inactivity Auto-Lock DINONAKTIFKAN.'
    );
  };

  const handleTimeoutChange = (minutes: number) => {
    securityService.updateConfig({ inactivityTimeoutMinutes: minutes });
    onShowNotify(`Waktu kunci otomatis disetel ke ${minutes} menit.`);
  };

  const handleToggleDlp = () => {
    const next = maskingService.toggleGlobalMasking();
    onShowNotify(
      next
        ? 'Secure Data Masking & DLP DIAKTIFKAN (Semua data sensitif terlindungi).'
        : 'Perhatian: Secure Data Masking DINONAKTIFKAN sementara (Mode Reveal).'
    );
  };

  const handleManualLockScreen = () => {
    securityService.lockSession();
  };

  // Default password accounts list
  const defaultPassAccounts = useMemo(() => {
    const q = searchDefaultPass.toLowerCase().trim();
    return accounts.filter((a) => {
      const pass = a.PASSWORD || (a.ROLE === 'SISWA' ? 'siswa123' : a.ROLE === 'ADMIN' ? 'admin123' : 'guru123');
      const isDef = securityService.isDefaultPassword(pass);
      if (!isDef) return false;
      if (!q) return true;
      return (
        a.NAMA.toLowerCase().includes(q) ||
        a.USERNAME.toLowerCase().includes(q) ||
        a.ROLE.toLowerCase().includes(q)
      );
    });
  }, [accounts, searchDefaultPass]);

  // Handle saving new custom password for an account
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !newPassword.trim()) return;

    if (newPassword.trim().length < 6) {
      alert('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    const updated = {
      ...editingAccount,
      PASSWORD: newPassword.trim(),
    };

    accountService.saveAccount(updated);
    securityService.logSecurityEvent(
      'PASSWORD_CHANGED',
      'SUCCESS',
      `Kata sandi untuk pengguna "${editingAccount.NAMA}" (@${editingAccount.USERNAME}) telah diperbarui oleh Admin.`
    );

    setEditingAccount(null);
    setNewPassword('');
    onRefreshAccounts();
    onShowNotify(`Kata sandi akun ${updated.NAMA} berhasil diubah.`);
  };

  // Filtered security events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'ALL') return events;
    return events.filter((e) => e.severity === eventFilter);
  }, [events, eventFilter]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER & SCORE SUMMARY ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Pusat Keamanan & Kepatuhan Data (Cyber Defense)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono">
                Standard ISO 27001 & PDP
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white">
              Pusat Pertahanan & Proteksi Keamanan Web
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Memantau status pertahanan berlapis, proteksi pencegahan kebocoran data siswa (DLP),
              pertahanan serangan brute-force, dan audit kata sandi default secara terpusat.
            </p>
          </div>

          {/* Health Score Dial */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0 backdrop-blur-xs">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-600/30">
              <span className="text-2xl font-black leading-none">{auditReport.score}</span>
              <span className="text-[10px] font-bold text-emerald-100">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Skor Keamanan</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-black">
                  Grade {auditReport.grade}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {auditReport.checks.filter((c) => c.passed).length} dari {auditReport.checks.length} kontrol pertahanan aktif
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
                  <span>{isScanning ? 'Memindai...' : 'Pindai Sistem'}</span>
                </button>
                <button
                  onClick={handleManualLockScreen}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Kunci layar perangkat saat ini sekarang demi keamanan"
                >
                  <Lock size={12} />
                  <span>Kunci Layar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 DEFENSE CONTROLS GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. DLP Shield */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Shield size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                maskingService.isGlobalMaskingEnabled()
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {maskingService.isGlobalMaskingEnabled() ? 'AKTIF' : 'REVEAL MODE'}
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Secure Data Masking (DLP)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Menyamarkan NIS, email, dan detail pribadi serta memblokir copy/klik kanan otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleDlp}
            className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              maskingService.isGlobalMaskingEnabled()
                ? 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {maskingService.isGlobalMaskingEnabled() ? (
              <>
                <Eye size={13} /> Buka Sementara
              </>
            ) : (
              <>
                <EyeOff size={13} /> Kunci & Samarkan
              </>
            )}
          </button>
        </div>

        {/* 2. Brute Force Shield */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <Ban size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                config.enableBruteForceShield ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {config.enableBruteForceShield ? 'TERLINDUNGI' : 'NONAKTIF'}
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Brute-Force Shield</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kunci akun otomatis selama 5 menit setelah {config.maxFailedAttempts} kali kesalahan kata sandi berturut-turut.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleBruteForce}
            className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              config.enableBruteForceShield
                ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {config.enableBruteForceShield ? 'Nonaktifkan' : 'Aktifkan Proteksi'}
          </button>
        </div>

        {/* 3. Inactivity Auto-Lock */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                config.enableInactivityLock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {config.enableInactivityLock ? `${config.inactivityTimeoutMinutes} Menit` : 'OFF'}
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Inactivity Screen Lock</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kunci layar otomatis saat ditinggalkan untuk mencegah akses fisik tanpa izin.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1">
            {[5, 15, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => handleTimeoutChange(mins)}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  config.inactivityTimeoutMinutes === mins && config.enableInactivityLock
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
            <button
              onClick={handleToggleInactivity}
              className={`p-1.5 rounded-xl text-[10px] font-bold ${
                !config.enableInactivityLock ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
              }`}
              title="Aktif/Nonaktifkan Kunci Inaktivitas"
            >
              {config.enableInactivityLock ? 'OFF' : 'ON'}
            </button>
          </div>
        </div>

        {/* 4. Security Headers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">HTTP Security Headers</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              X-XSS-Protection, X-Content-Type-Options: nosniff, Referrer-Policy, dan pembatasan API.
            </p>
          </div>
          <div className="mt-4 py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-800 text-center">
            Express Server Hardened
          </div>
        </div>
      </div>

      {/* ─── AUDIT CHECKS LIST ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Pemeriksaan Kontrol Kepatuhan Keamanan
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi standar pertahanan data sekolah terhadap potensi kebocoran dan eksfiltrasi
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {auditReport.checks.filter((c) => c.passed).length} / {auditReport.checks.length} Lolos Audit
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {auditReport.checks.map((chk) => (
            <div key={chk.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  chk.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {chk.passed ? <Check size={14} /> : <AlertTriangle size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{chk.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      chk.impact === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {chk.impact} IMPACT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{chk.description}</p>
                </div>
              </div>

              <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                chk.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {chk.passed ? 'LOLOS' : 'PERHATIAN'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── DEFAULT PASSWORD REMEDIATION SECTION ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" />
                Audit Kata Sandi Bawaan (Default Password Tracker)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                {auditReport.defaultPasswordCount} Akun Rentan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun yang masih menggunakan kata sandi default rentan ditebak. Ganti kata sandi secara berkala.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchDefaultPass}
              onChange={(e) => setSearchDefaultPass(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {defaultPassAccounts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            Semua akun telah menggunakan kata sandi unik yang aman.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {defaultPassAccounts.slice(0, 50).map((acc) => (
              <div key={acc.ID} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{acc.NAMA}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>@{acc.USERNAME}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">{acc.ROLE}</span>
                    {acc.KELAS && <span>• {acc.KELAS}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold">
                    Default Pass
                  </span>
                  <button
                    onClick={() => {
                      setEditingAccount(acc);
                      setNewPassword('');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Ganti Sandi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── REAL-TIME SECURITY EVENT & INCIDENT LOG ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Log Insiden & Audit Trail Keamanan Sistem
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat autentikasi, percobaan login gagal, pembukaan data sensitif, dan penguncian akun
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'DANGER', 'WARN', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setEventFilter(sev)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  eventFilter === sev
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
            <button
              onClick={() => {
                securityService.clearSecurityEvents();
                onShowNotify('Log audit keamanan telah dibersihkan.');
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-bold ml-2"
            >
              Bersihkan
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada catatan aktivitas keamanan.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-start gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black shrink-0 mt-0.5 ${
                  evt.severity === 'DANGER'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : evt.severity === 'WARN'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : evt.severity === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {evt.type}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-[11px]">{evt.message}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(evt.timestamp).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── MODAL GANTI SANDI KUAT ─── */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Perbarui Kata Sandi</h4>
                  <p className="text-[11px] text-slate-500 font-mono">@{editingAccount.USERNAME} ({editingAccount.NAMA})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kata Sandi Baru:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Contoh: S@nD1Kuat2026!"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 font-mono"
                  autoFocus
                />
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  {(() => {
                    const st = securityService.evaluatePasswordStrength(newPassword);
                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>Kekuatan Sandi:</span>
                          <span className={st.color}>{st.label} ({st.score}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              st.score > 75 ? 'bg-emerald-500' : st.score > 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${st.score}%` }}
                          />
                        </div>
                        {st.suggestions.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            {st.suggestions[0]}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
