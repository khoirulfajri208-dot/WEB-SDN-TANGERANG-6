import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  School,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Sparkles,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Account } from '../../types/classroom';
import { accountService } from '../../services/accountService';
import { securityService } from '../../services/securityService';
import { db } from '../../services/localStorageService';

interface ClassroomPortalLoginProps {
  onSuccess: (account: Account) => void;
  onBack: () => void;
}

export const ClassroomPortalLogin: React.FC<ClassroomPortalLoginProps> = ({ onSuccess, onBack }) => {
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa' | 'kepsek'>('guru');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const config = db.getConfig();

  const handlePerformLogin = (userQuery: string, passQuery: string) => {
    setError(null);
    setIsLoggingIn(true);

    // Check brute force lockout
    const lockCheck = securityService.checkAccountLockout(userQuery);
    if (lockCheck.locked) {
      setIsLoggingIn(false);
      setError(
        `🔒 Akun ini dikunci sementara karena beberapa kali salah kata sandi. Tunggu ${Math.ceil(
          lockCheck.lockTimeRemainingSeconds / 60
        )} menit, atau klik 'Pulihkan Akun & Hapus Blokir' di bawah.`
      );
      return;
    }

    setTimeout(() => {
      const authenticated = accountService.authenticate('CLASSROOM', userQuery, passQuery);
      if (authenticated) {
        accountService.setActiveClassroomAccount(authenticated);
        securityService.recordSuccessfulLogin(authenticated.USERNAME, authenticated.ROLE);
        db.logAudit('LOGIN', 'PORTAL_CLASSROOM', authenticated.NAMA, {
          username: authenticated.USERNAME,
          role: authenticated.ROLE,
          kelas: authenticated.KELAS,
        });
        setIsLoggingIn(false);
        onSuccess(authenticated);
      } else {
        setIsLoggingIn(false);
        securityService.recordFailedAttempt(userQuery);
        setError('Username, NIP, atau kata sandi tidak cocok. Silakan periksa kembali identitas akun dan kata sandi Anda.');
      }
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Harap masukkan identitas pengguna dan kata sandi.');
      return;
    }
    handlePerformLogin(username, password);
  };

  const handleDiagnosticReset = () => {
    try {
      securityService.clearAllLockouts();
      accountService.initAccounts();
      setError(null);
      setResetMessage('🔧 Diagnostik selesai: Semua akun default dipulihkan dan proteksi lockout telah dibersihkan.');
      setTimeout(() => setResetMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Bar with Logos */}
        <div className="bg-gradient-to-r from-blue-900/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 p-6 sm:p-8 text-center space-y-3 relative">
          <button
            type="button"
            onClick={onBack}
            className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Website</span>
          </button>

          <div className="flex items-center justify-center gap-3">
            {config.CITY_LOGO_URL ? (
              <img
                src={config.CITY_LOGO_URL}
                alt="Logo Pemkot Tangerang"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-800/60 border border-blue-600/40 flex items-center justify-center text-blue-300 font-bold">
                <School size={24} />
              </div>
            )}
            {config.SCHOOL_LOGO_URL ? (
              <img
                src={config.SCHOOL_LOGO_URL}
                alt="Logo Tut Wuri Handayani"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-800/60 border border-indigo-600/40 flex items-center justify-center text-indigo-300 font-bold">
                <GraduationCap size={24} />
              </div>
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1.5">
              <Sparkles size={11} className="text-blue-400 animate-pulse" />
              Portal Pembelajaran & Kelas Digital
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ruang Belajar Digital, Penugasan CBT, Absensi & E-Rapor Terpadu
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('guru');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'guru'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen size={14} />
              <span>Guru / Pendidik</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('siswa');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap size={14} />
              <span>Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('kepsek');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'kepsek'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Kepala Sekolah</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Reset Success Message */}
          {resetMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-semibold leading-relaxed flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{resetMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username / NIP / NISN / Nama Lengkap
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  activeTab === 'guru'
                    ? 'Contoh: nurul atau NIP Guru'
                    : activeTab === 'siswa'
                    ? 'Contoh: 3150148820 (NISN) atau Nama Siswa'
                    : 'Contoh: NIP Kepala Sekolah'
                }
                className="w-full px-4 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full px-4 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Masuk Classroom</span>
                </>
              )}
            </button>
          </form>

          {/* Diagnostic & Self-Healing Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleDiagnosticReset}
              className="text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Pulihkan Akun & Hapus Blokir</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="text-slate-500 hover:text-slate-300 transition-colors text-[11px] font-semibold cursor-pointer"
            >
              Kembali ke Beranda Website
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
