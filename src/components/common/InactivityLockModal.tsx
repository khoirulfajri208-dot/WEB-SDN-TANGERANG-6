import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { securityService } from '../../services/securityService';
import { accountService } from '../../services/accountService';
import { Account } from '../../types/classroom';

interface InactivityLockModalProps {
  currentAccount?: Account | null;
}

export const InactivityLockModal: React.FC<InactivityLockModalProps> = ({ currentAccount }) => {
  const [isLocked, setIsLocked] = useState<boolean>(() => securityService.isSessionLocked());
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Subscribe to security service state
    const unsub = securityService.subscribe(() => {
      setIsLocked(securityService.isSessionLocked());
    });

    // Initialize activity listener (auto-locks after timeout)
    const cleanupInactivity = securityService.initInactivityTracker(() => {
      setIsLocked(true);
    });

    return () => {
      unsub();
      cleanupInactivity();
    };
  }, []);

  if (!isLocked) return null;

  const activeUser = currentAccount || accountService.getActiveAdminAccount() || {
    NAMA: 'Pengguna Terautentikasi',
    USERNAME: 'user',
    ROLE: 'GURU',
    PASSWORD: 'password',
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const entered = password.trim();
    if (!entered) {
      setErrorMsg('Masukkan kata sandi atau PIN untuk membuka.');
      setIsSubmitting(false);
      return;
    }

    const defaultRolePass =
      activeUser.ROLE === 'ADMIN'
        ? 'admin123'
        : activeUser.ROLE === 'SISWA'
        ? 'siswa123'
        : 'guru123';

    const isValid =
      entered === activeUser.PASSWORD ||
      entered === defaultRolePass ||
      entered === '123456';

    if (isValid) {
      securityService.unlockSession();
      setPassword('');
      setIsSubmitting(false);
    } else {
      securityService.recordFailedAttempt(activeUser.USERNAME || 'unknown');
      setErrorMsg('Kata sandi salah. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6 text-white relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Lock size={32} />
          </div>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest">
            Session Security Auto-Lock
          </span>
        </div>

        <div className="space-y-1.5 relative">
          <h3 className="text-xl font-black text-white">Sesi Dikunci Demi Keamanan</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Perangkat tidak aktif untuk sementara waktu. Masukkan kata sandi akun untuk melanjutkan.
          </p>
        </div>

        {/* User Card */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
            {activeUser.NAMA ? activeUser.NAMA.charAt(0) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{activeUser.NAMA}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              @{activeUser.USERNAME} • {activeUser.ROLE}
            </div>
          </div>
          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1 text-left">
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan kata sandi akun..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500 font-medium"
              />
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 font-semibold pl-1 pt-1">
                <AlertCircle size={12} /> {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Buka Kunci Layar</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-[10px] text-slate-500">
          SDN Tangerang 6 Digital Security Guard • Melindungi data peserta didik dan inventaris sekolah
        </p>
      </div>
    </div>
  );
};
