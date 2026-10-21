import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Globe,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Key,
  UserCheck,
  Building2,
} from 'lucide-react';

export interface BelajarIdSSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userEmail: string, roleName: string) => void;
}

export const BelajarIdSSOModal: React.FC<BelajarIdSSOModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [emailInput, setEmailInput] = useState<string>('yulia.spdmm@guru.sd.belajar.id');
  const [selectedPresetRole, setSelectedPresetRole] = useState<'GURU' | 'SISWA' | 'ADMIN' | 'ORANG_TUA'>('GURU');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'GURU' | 'SISWA' | 'ADMIN' | 'ORANG_TUA') => {
    setSelectedPresetRole(role);
    if (role === 'GURU') {
      setEmailInput('yulia.spdmm@guru.sd.belajar.id');
    } else if (role === 'SISWA') {
      setEmailInput('ahmad.fauzi@siswa.sd.belajar.id');
    } else if (role === 'ADMIN') {
      setEmailInput('admin.sdnTangerang6@admin.sd.belajar.id');
    } else {
      setEmailInput('orangtua.fauzi@wali.sd.belajar.id');
    }
  };

  const handleSimulateSSO = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccessMessage(`Berhasil Otentikasi Tunggal SSO Belajar.id sebagai ${emailInput}`);
      if (onLoginSuccess) {
        onLoginSuccess(emailInput, selectedPresetRole);
      }
      setTimeout(() => {
        setAuthSuccessMessage('');
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-800/80 text-blue-200 ring-1 ring-blue-400/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Otentikasi Tunggal SSO Belajar.id
              </h3>
              <p className="text-[11px] text-blue-200/80">
                Single Sign-On Resmi Kemendikbudristek RI untuk SDN Tangerang 6
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {authSuccessMessage ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
              <h4 className="font-black text-sm text-emerald-900">Login Terverifikasi!</h4>
              <p className="text-xs text-emerald-700 font-medium">{authSuccessMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSimulateSSO} className="space-y-4">
              {/* Kemendikbud Badge Banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  RI
                </div>
                <div>
                  <span className="font-bold text-blue-950 block">Portal Akun Belajar.id Resmi</span>
                  <span className="text-[11px] text-blue-700">
                    SD Negeri Tangerang 6 • Terhubung dengan Server Pusat PUSDATIN
                  </span>
                </div>
              </div>

              {/* Role Preset Switcher */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Pilih Peran Akun Belajar.id:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('GURU')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedPresetRole === 'GURU'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck size={16} /> Guru / Pendidik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('SISWA')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedPresetRole === 'SISWA'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Globe size={16} /> Peserta Didik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ADMIN')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedPresetRole === 'ADMIN'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 size={16} /> Admin / Kepala Sekolah
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ORANG_TUA')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedPresetRole === 'ORANG_TUA'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Key size={16} /> Orang Tua / Wali
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Email Akun Google @belajar.id:
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@guru.sd.belajar.id"
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Gunakan akun Google Workspace resmi yang didaftarkan oleh Operator Sekolah.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifikasi Kredensial PUSDATIN...
                  </span>
                ) : (
                  <>
                    <span>Masuk dengan SSO Belajar.id</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <Lock size={13} className="text-blue-600" /> Terenkripsi SSL 256-bit PUSDATIN Kemendikbud
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
