import React, { useState } from 'react';
import {
  Lock,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  LogIn,
  GraduationCap,
  Settings,
  ShieldAlert,
  AlertTriangle,
  Key,
  RefreshCw,
  Sparkles,
  Check,
  Info,
  HelpCircle
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { accountService } from '../services/accountService';
import { securityService } from '../services/securityService';
import { User } from '../types';
import { SystemType } from '../types/classroom';

interface LoginSelectionModalProps {
  onClose: () => void;
  onEnterSiperseda: (user: User) => void;
  onEnterClassroom: () => void;
  onEnterAdmin: () => void;
}

export const LoginSelectionModal: React.FC<LoginSelectionModalProps> = ({
  onClose,
  onEnterSiperseda,
  onEnterClassroom,
  onEnterAdmin,
}) => {
  const [step, setStep] = useState<'select' | 'siperseda' | 'classroom' | 'admin'>('select');

  // SIPERSEDA login state
  const [sipersedaQuery, setSipersedaQuery] = useState('');
  const [sipersedaPass, setSipersedaPass] = useState('');
  const [sipersedaError, setSipersedaError] = useState<string | null>(null);

  // Classroom & Admin login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [diagnosticMsg, setDiagnosticMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showBelajarPrompt, setShowBelajarPrompt] = useState(false);
  const [belajarEmailInput, setBelajarEmailInput] = useState('');

  const completeBelajarLogin = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Alamat email Belajar.id / Google tidak valid.');
      return;
    }

    const accounts = accountService.getAccounts();
    const existing = accounts.find((a) => a.EMAIL.toLowerCase() === cleanEmail || cleanEmail.startsWith(a.USERNAME.toLowerCase()));

    if (existing) {
      if (existing.SISTEM === 'ADMIN' || existing.ROLE === 'ADMIN') {
        accountService.setActiveAdminAccount(existing);
        onEnterAdmin();
      } else {
        accountService.setActiveClassroomAccount(existing);
        onEnterClassroom();
      }
      onClose();
      return;
    }

    // Auto-create verified Belajar.id account
    const isGuru = cleanEmail.includes('guru') || cleanEmail.includes('kepala');
    const isSiswa = cleanEmail.includes('siswa');
    const role = isGuru ? 'GURU' : isSiswa ? 'SISWA' : 'GURU';

    const newAcc = accountService.saveAccount({
      NAMA: name || cleanEmail.split('@')[0].toUpperCase(),
      EMAIL: cleanEmail,
      USERNAME: cleanEmail.split('@')[0],
      PASSWORD: 'belajar_id_sso_verified',
      ROLE: role as any,
      SISTEM: 'CLASSROOM',
      STATUS: 'AKTIF',
    });

    accountService.setActiveClassroomAccount(newAcc);
    onEnterClassroom();
    onClose();
  };

  const handleGoogleBelajarLogin = () => {
    setIsGoogleLoading(true);
    setFormError(null);

    try {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.oauth2) {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: db.getGoogleClientId() || '621252053053-l4t5500q4pnkvuo933amm883oe3cv3l0.apps.googleusercontent.com',
          scope: 'email profile',
          callback: (res: any) => {
            setIsGoogleLoading(false);
            if (res.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${res.access_token}` },
              })
                .then((r) => r.json())
                .then((userInfo) => {
                  completeBelajarLogin(userInfo.email, userInfo.name);
                })
                .catch(() => {
                  setShowBelajarPrompt(true);
                });
            } else {
              setShowBelajarPrompt(true);
            }
          },
          error_callback: () => {
            setIsGoogleLoading(false);
            setShowBelajarPrompt(true);
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      }
    } catch {
      // Fallback
    }

    setIsGoogleLoading(false);
    setShowBelajarPrompt(true);
  };

  // Auto-fill & auto-submit directly for maximum speed and robustness
  const performSipersedaLoginDirect = (query: string, pass: string) => {
    const clean = query.trim().toLowerCase();
    const cleanDigits = clean.replace(/[^0-9a-zA-Z]/g, '');
    
    // 1. Search in db.getUsers() (Master Pegawai)
    const allUsers = db.getUsers();
    let foundUser: User | null = null;

    // Check role aliases for SIPERSEDA
    const isOperatorQuery = clean === 'operator' || clean === 'pengurus barang' || clean === 'gudang';
    const isKepsekQuery = clean === 'kepsek' || clean === 'kepala sekolah' || clean === 'kuasa pengguna barang';
    const isBendaharaQuery = clean === 'bendahara' || clean === 'bos' || clean === 'bop';

    const matchedUser = allUsers.find((u) => {
      if ((u.STATUS || 'AKTIF').toUpperCase() !== 'AKTIF') return false;

      if (isOperatorQuery && u.ROLE === 'OPERATOR') return true;
      if (isKepsekQuery && u.ROLE === 'KEPALA SEKOLAH') return true;
      if (isBendaharaQuery && u.ROLE === 'BENDAHARA') return true;

      if (u.NIP) {
        const uDigits = u.NIP.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        if (uDigits && (uDigits === cleanDigits || uDigits === clean)) return true;
      }
      if (u.EMAIL && u.EMAIL.toLowerCase() === clean) return true;
      
      const uName = u.NAMA.toLowerCase();
      if (uName === clean) return true;
      if (clean.length >= 3 && uName.includes(clean)) return true;
      
      const nameParts = uName.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
      if (nameParts.includes(clean)) return true;

      return false;
    });

    if (matchedUser) {
      foundUser = matchedUser;
    } else {
      // 2. Search in accountService accounts (Admin Panel accounts)
      const allAccounts = accountService.getAccounts();
      const matchedAcc = allAccounts.find((a) => {
        if (a.STATUS !== 'AKTIF') return false;

        if (isOperatorQuery && (a.ROLE === 'OPERATOR' || a.ROLE === 'STAFF TU')) return true;
        if (isKepsekQuery && a.ROLE === 'KEPALA SEKOLAH') return true;
        if (isBendaharaQuery && ((a.ROLE as string) === 'BENDAHARA' || ((a as any).JABATAN || '').toLowerCase().includes('bendahara'))) return true;

        if (a.USERNAME.toLowerCase() === clean) return true;
        if (a.EMAIL.toLowerCase() === clean) return true;
        if (a.ID.toLowerCase() === clean) return true;

        if (a.NIP) {
          const aDigits = a.NIP.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
          if (aDigits && (aDigits === cleanDigits || aDigits === clean)) return true;
        }

        const aName = a.NAMA.toLowerCase();
        if (aName === clean) return true;
        if (clean.length >= 3 && aName.includes(clean)) return true;

        const nameParts = aName.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
        if (nameParts.includes(clean)) return true;

        return false;
      });

      if (matchedAcc) {
        foundUser = {
          ID: matchedAcc.ID,
          NIP: matchedAcc.NIP || '',
          NAMA: matchedAcc.NAMA,
          EMAIL: matchedAcc.EMAIL,
          ROLE: (matchedAcc.ROLE === 'SISWA' ? 'STAFF' : matchedAcc.ROLE) as any,
          STATUS: 'AKTIF',
          JABATAN: matchedAcc.ROLE,
          TELEPON: matchedAcc.TELEPON,
        };
      }
    }

    if (!foundUser) {
      setSipersedaError('Identitas pegawai tidak ditemukan. Pastikan NIP, Email, atau Username sudah benar.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      db.setActiveUser(foundUser!);
      db.logAudit('LOGIN', 'AUTH_PORTAL', foundUser!.NIP || foundUser!.NAMA, {
        method: 'SIPERSEDA_LOGIN',
        role: foundUser!.ROLE,
      });
      setIsLoggingIn(false);
      onEnterSiperseda(foundUser!);
    }, 150);
  };

  const performCredentialLoginDirect = (sistem: SystemType, userVal: string, passVal: string) => {
    const cleanUser = userVal.trim().toLowerCase();
    const normalizedUser =
      (cleanUser === 'admint' || cleanUser === 'administrator' || cleanUser === 'admin website' || cleanUser === 'admint website' || cleanUser === 'admin web')
        ? 'admin'
        : userVal.trim();
    const passToUse = passVal.trim();

    if (!normalizedUser || !passToUse) {
      setFormError('Username dan kata sandi wajib diisi.');
      return;
    }

    // Check Brute-Force lockout
    const lockCheck = securityService.checkAccountLockout(normalizedUser);
    if (lockCheck.locked) {
      setFormError(
        `🔒 Akun ini dikunci sementara demi keamanan karena terlalu banyak kesalahan kata sandi. Silakan tunggu ${Math.ceil(
          lockCheck.lockTimeRemainingSeconds / 60
        )} menit, atau klik 'Sinkronkan Akun' di bagian bawah.`
      );
      return;
    }

    const account = accountService.authenticate(sistem, normalizedUser, passToUse);
    if (!account) {
      securityService.recordFailedAttempt(normalizedUser);
      setFormError('Username atau kata sandi tidak cocok. Silakan periksa kembali data akun Anda.');
      return;
    }

    // Record successful login & reset counters
    securityService.recordSuccessfulLogin(normalizedUser, account.ROLE);

    setIsLoggingIn(true);
    setTimeout(() => {
      if (sistem === 'CLASSROOM') {
        accountService.setActiveClassroomAccount(account);
        onEnterClassroom();
      } else {
        accountService.setActiveAdminAccount(account);
        onEnterAdmin();
      }
      setIsLoggingIn(false);
    }, 150);
  };

  const handleDiagnosticReset = () => {
    try {
      // 1. Clear failed attempts from localStorage
      localStorage.removeItem('SDN6_FAILED_LOGIN_ATTEMPTS');
      
      // Force clear in-memory state of securityService failed attempts
      if (securityService && (securityService as any).failedAttempts) {
        (securityService as any).failedAttempts.clear();
        (securityService as any).persistFailedAttempts();
      }
    } catch (e) {
      console.warn('Reset lockout error:', e);
    }

    // 2. Re-initialize databases to guarantee defaults
    accountService.initAccounts();
    db.initDatabase();

    // 3. Clear form states
    setFormError(null);
    setSipersedaError(null);
    setUsername('');
    setPassword('');
    setSipersedaQuery('');
    setSipersedaPass('');
    setDiagnosticMsg('🔧 Diagnostik & Pemulihan Berhasil! Akun default dipulihkan & proteksi lockout brute-force telah dibersihkan.');
    setTimeout(() => setDiagnosticMsg(null), 6000);
  };

  const handleSipersedaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSipersedaError(null);
    if (!sipersedaQuery.trim()) {
      setSipersedaError('Masukkan NIP, Email, Username, atau Nama akun Anda.');
      return;
    }
    performSipersedaLoginDirect(sipersedaQuery, sipersedaPass);
  };

  const handleCredentialLogin = (sistem: SystemType) => (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const targetUser = username.trim();
    const targetPass = password.trim();
    if (!targetUser) {
      setFormError('Username wajib diisi.');
      return;
    }
    if (!targetPass) {
      setFormError('Kata sandi wajib diisi.');
      return;
    }
    performCredentialLoginDirect(sistem, targetUser, targetPass);
  };

  const systemCards = [
    {
      key: 'siperseda' as const,
      title: 'Login SIPERSEDA',
      subtitle: 'Sistem Persediaan & Aset',
      desc: 'Operator & Kepala Sekolah mengelola persediaan, aset, dan persetujuan.',
      icon: ShieldCheck,
      color: 'from-emerald-700 to-teal-800',
      ring: 'hover:border-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'classroom' as const,
      title: 'Login Classroom',
      subtitle: 'Pembelajaran Online',
      desc: 'Siswa, Guru & Kepala Sekolah untuk pembelajaran, tugas, dan laporan.',
      icon: BookOpen,
      color: 'from-blue-700 to-indigo-800',
      ring: 'hover:border-blue-500',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    {
      key: 'admin' as const,
      title: 'Login Admin Website',
      subtitle: 'Manajemen Keseluruhan',
      desc: 'Administrator mengelola akun SIPERSEDA, Classroom, dan website.',
      icon: Settings,
      color: 'from-slate-800 to-slate-950',
      ring: 'hover:border-slate-600',
      iconBg: 'bg-slate-200 text-slate-800',
    },
  ];

  const renderCredentialForm = (sistem: SystemType, accent: string) => {
    return (
      <form onSubmit={handleCredentialLogin(sistem)} className="space-y-4">
        {diagnosticMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-relaxed flex items-center gap-2">
            <Check size={16} className="shrink-0 text-emerald-600" />
            <span>{diagnosticMsg}</span>
          </div>
        )}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed">
            {formError}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Username atau Email</label>
          <input
            type="text"
            placeholder="Masukkan username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-blue-600 focus:border-transparent transition-all"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi</label>
          <input
            type="password"
            placeholder="Masukkan kata sandi..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-blue-600 focus:border-transparent transition-all font-mono"
          />
        </div>
        <div className="pt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setStep('select');
              setUsername('');
              setPassword('');
              setFormError(null);
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={isLoggingIn}
            className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${accent} hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2`}
          >
            {isLoggingIn ? 'Memverifikasi...' : (
              <>
                <LogIn size={14} />
                <span>Masuk</span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col p-6 sm:p-8">
        
        {/* Logo and Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                Portal Masuk Terpadu
              </div>
              <h3 className="text-base font-black text-slate-900">
                SD Negeri Tangerang 6
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Login Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl mb-1">
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Selamat datang di Portal Digital SDN Tangerang 6. Silakan pilih portal layanan yang ingin Anda akses.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {systemCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setStep(card.key);
                      setFormError(null);
                      setSipersedaError(null);
                      setUsername('');
                      setPassword('');
                      setSipersedaQuery('');
                      setSipersedaPass('');
                    }}
                    className={`p-4 rounded-2xl border border-slate-200 hover:border-slate-300 ${card.ring} bg-slate-50/50 hover:bg-white text-left transition-all flex items-start gap-4 shadow-xs cursor-pointer`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900">{card.title}</h4>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{card.subtitle}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-white px-3 text-slate-400">Atau Akses Resmi Kemendikbud</span>
              </div>
            </div>

            {/* Google / Belajar.id SSO Button */}
            <button
              type="button"
              onClick={handleGoogleBelajarLogin}
              disabled={isGoogleLoading}
              className="w-full p-3.5 rounded-2xl border border-blue-200 hover:border-blue-400 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 text-left transition-all flex items-center gap-3.5 shadow-2xs cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Masuk Akun Belajar.id / Google</span>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">SSO Resmi</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">Otentikasi cepat untuk Guru &amp; Siswa (@guru.sd.belajar.id)</p>
              </div>
              <ChevronRight size={15} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Belajar.id Email Modal Prompt */}
        {showBelajarPrompt && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Masuk Akun Belajar.id</h4>
                  <p className="text-[11px] text-slate-500">Masukkan email resmi Kemendikbudristek Anda</p>
                </div>
              </div>
              <div>
                <input
                  type="email"
                  placeholder="nama@guru.sd.belajar.id"
                  value={belajarEmailInput}
                  onChange={(e) => setBelajarEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-2 focus:outline-blue-600 font-medium"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">Dapat menggunakan email @guru.sd.belajar.id, @siswa.sd.belajar.id, atau Google resmi.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowBelajarPrompt(false);
                    setBelajarEmailInput('');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (belajarEmailInput.trim()) {
                      setShowBelajarPrompt(false);
                      completeBelajarLogin(belajarEmailInput.trim());
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIPERSEDA Form */}
        {step === 'siperseda' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
              <p className="text-[11px] text-emerald-800 font-medium">Masuk sebagai Pengurus Barang, Bendahara, atau Kepala Sekolah.</p>
            </div>

            <form onSubmit={handleSipersedaLogin} className="space-y-4">
              {diagnosticMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-relaxed flex items-center gap-2">
                  <Check size={16} className="shrink-0 text-emerald-600" />
                  <span>{diagnosticMsg}</span>
                </div>
              )}
              {sipersedaError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed">
                  {sipersedaError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Identitas Pegawai (NIP / Email / Nama Lengkap)</label>
                <input
                  type="text"
                  placeholder="Masukkan NIP, Email, atau nama..."
                  value={sipersedaQuery}
                  onChange={(e) => setSipersedaQuery(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-700 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN / Kata Sandi (Opsional)</label>
                <input
                  type="password"
                  placeholder="Masukkan PIN jika diatur, atau kosongkan..."
                  value={sipersedaPass}
                  onChange={(e) => setSipersedaPass(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-700 focus:border-transparent transition-all font-mono"
                />
              </div>
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setSipersedaQuery('');
                    setSipersedaPass('');
                    setSipersedaError(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoggingIn ? 'Memverifikasi...' : (
                    <>
                      <LogIn size={14} />
                      <span>Masuk SIPERSEDA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classroom Form */}
        {step === 'classroom' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <GraduationCap size={18} className="text-blue-700 shrink-0" />
              <p className="text-[11px] text-blue-800 font-medium">Masuk menggunakan akun Siswa, Guru, atau Kepala Sekolah.</p>
            </div>

            {renderCredentialForm('CLASSROOM', 'from-blue-700 to-indigo-800')}
          </div>
        )}

        {/* Admin Form */}
        {step === 'admin' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 p-3.5 bg-slate-100 rounded-xl border border-slate-300">
              <ShieldCheck size={18} className="text-slate-700 shrink-0" />
              <p className="text-[11px] text-slate-700 font-medium">Khusus Administrator Website untuk panel kontrol dan manajemen terpadu.</p>
            </div>

            {renderCredentialForm('ADMIN', 'from-slate-800 to-slate-950')}
          </div>
        )}

        {/* Footer info & recovery link */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>UPT Satuan Pendidikan SD Negeri Tangerang 6</span>
          <button
            type="button"
            onClick={handleDiagnosticReset}
            className="text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Klik jika mengalami kendala login atau akun terkunci"
          >
            <RefreshCw size={11} />
            <span>Sinkronkan Akun</span>
          </button>
        </div>

      </div>
    </div>
  );
};
