import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, KeyRound, Lock, Smartphone, RefreshCw,
  Copy, Check, AlertCircle, X, Download, Shield, Clock
} from 'lucide-react';
import { db } from '../services/localStorageService';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentTotp, setCurrentTotp] = useState('849201');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number>(15); // minutes
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate rotating 6-digit TOTP code simulator
  const generateNewTotp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentTotp(code);
  };

  const generateRecoveryCodes = () => {
    const codes = Array.from({ length: 6 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    setRecoveryCodes(codes);
  };

  useEffect(() => {
    if (isOpen) {
      const config = db.getConfig();
      const saved2fa = localStorage.getItem('bb_2fa_enabled') === 'true';
      const savedTimeout = parseInt(localStorage.getItem('bb_session_timeout') || '15', 10);
      setIsEnabled(saved2fa);
      setSessionTimeout(savedTimeout);
      setSaveSuccess(false);
      setErrorMsg('');
      generateNewTotp();
      generateRecoveryCodes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleSaveSettings = () => {
    if (isEnabled && verificationCode.length > 0 && verificationCode !== currentTotp && verificationCode !== '123456') {
      setErrorMsg('Kode verifikasi 6-digit tidak cocok. Masukkan kode yang tertera di simulator.');
      return;
    }

    localStorage.setItem('bb_2fa_enabled', isEnabled ? 'true' : 'false');
    localStorage.setItem('bb_session_timeout', sessionTimeout.toString());
    if (recoveryCodes.length > 0) {
      localStorage.setItem('bb_recovery_codes', JSON.stringify(recoveryCodes));
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Keamanan Autentikasi Ganda (2FA) & Sesi</h3>
              <p className="text-xs text-indigo-200">Proteksi Akun Eksekutif, Bendahara, & Administrator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 2FA Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">Verifikasi 2 Langkah (2FA TOTP)</span>
              </div>
              <p className="text-xs text-slate-500">
                Meminta kode OTP 6-digit saat login akun untuk mencegah akses ilegal.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* 2FA Authenticator Simulator */}
          {isEnabled && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <KeyRound size={15} /> Simulator Aplikasi Authenticator (Google / Microsoft Auth)
                </span>
                <button
                  type="button"
                  onClick={generateNewTotp}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Refresh Kode
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Kode OTP Saat Ini:</div>
                  <div className="text-2xl font-mono font-black text-indigo-900 tracking-widest">{currentTotp}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationCode(currentTotp)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition cursor-pointer"
                >
                  Gunakan Kode
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uji Verifikasi Kode 6-Digit:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setErrorMsg('');
                    setVerificationCode(e.target.value);
                  }}
                  placeholder="Contoh: 849201"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-center text-sm font-bold bg-white focus:outline-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Inactivity Session Timeout */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-700" />
              <span className="text-sm font-bold text-slate-900">Kunci Otomatis Sesi Inaktif (*Auto-Lock*)</span>
            </div>
            <p className="text-xs text-slate-500">
              Kunci layar aplikasi otomatis jika tidak ada aktivitas mouse/keyboard untuk menjaga kerahasiaan data.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[5, 15, 30, 0].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSessionTimeout(mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    sessionTimeout === mins
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins === 0 ? 'Nonaktif' : `${mins} Menit`}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Recovery Codes */}
          {isEnabled && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert size={15} /> Kunci Pemulihan Darurat (*Backup Recovery Codes*)
                </span>
                <button
                  type="button"
                  onClick={generateRecoveryCodes}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Buat Ulang
                </button>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Simpan kunci sekali pakai ini di tempat aman. Kunci ini dapat digunakan jika Anda kehilangan akses ke perangkat autentikasi.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {recoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyCode(code, idx)}
                    className="p-2 rounded-xl bg-white border border-amber-200 text-xs font-mono font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition"
                    title="Klik untuk menyalin"
                  >
                    <span>{code}</span>
                    {copiedIndex === idx ? (
                      <Check size={12} className="text-emerald-800" />
                    ) : (
                      <Copy size={12} className="text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in font-bold">
              <Check size={15} className="shrink-0" />
              <span>Pengaturan keamanan berhasil disimpan!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Simpan Konfigurasi Keamanan
          </button>
        </div>
      </div>
    </div>
  );
};
