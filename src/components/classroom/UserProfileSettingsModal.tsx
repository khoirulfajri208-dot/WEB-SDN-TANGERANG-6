import React, { useState } from 'react';
import {
  User, Settings, Moon, Sun, ShieldCheck, Eye, Award, CheckCircle2, Lock, X,
  GraduationCap, Phone, Mail, Sparkles, Check, Sliders
} from 'lucide-react';
import { Account } from '../../types/classroom';
import { StudentBadgesWidget } from './StudentBadgesWidget';
import { SecureMaskedField } from '../common/SecureMaskedField';

interface UserProfileSettingsModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  onToggleHighContrast: (enabled: boolean) => void;
}

export const UserProfileSettingsModal: React.FC<UserProfileSettingsModalProps> = ({
  account,
  isOpen,
  onClose,
  highContrast,
  onToggleHighContrast,
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'BADGES' | 'PROFILE'>('SETTINGS');

  if (!isOpen) return null;

  const isSiswa = account.ROLE === 'SISWA';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Modal Topbar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black">
              {account.NAMA.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">{account.NAMA}</h3>
              <p className="text-xs text-blue-200">
                {account.ROLE} {account.KELAS ? `• ${account.KELAS}` : ''} • SDN Tangerang 6
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 shrink-0 px-4">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={15} /> <span>Pengaturan & Aksesibilitas</span>
          </button>

          {isSiswa && (
            <button
              onClick={() => setActiveTab('BADGES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'BADGES'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={15} className="text-amber-500" /> <span>Lencana Prestasi</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={15} /> <span>Profil Akun</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              {/* High Contrast Mode Box */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Eye size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                          AKSESIBILITAS INKLUSIF
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold">Visual Impairment Friendly</span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">
                        Mode Kontras Tinggi (High Contrast Mode)
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        Varian dark mode khusus dengan kontras visual ultra-tinggi (latar belakang pekat `#090D16`, teks putih terang, serta penanda kuning & sian). Dirancang khusus untuk membantu keterbacaan siswa dengan gangguan penglihatan (*low vision*).
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => onToggleHighContrast(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-400"></div>
                  </label>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">Status Mode Kontras Tinggi:</span>
                  <span className={`font-black px-2.5 py-1 rounded-md text-[11px] ${highContrast ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {highContrast ? '⚡ AKTIF (High Contrast)' : '⚪ NONAKTIF (Standar)'}
                  </span>
                </div>
              </div>

              {/* Informational Guidelines for Accessibility */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2 text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>Fitur Kelas Inklusif & Kebutuhan Khusus:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
                  <li>Mode Kontras Tinggi dapat diaktifkan dan dimatikan kapan saja.</li>
                  <li>Mendukung keterbacaan teks saat membaca modul ajar di Mode Zen.</li>
                  <li>Dilengkapi dukungan audio panduan dan kuis ramah anak inklusi.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'BADGES' && isSiswa && (
            <StudentBadgesWidget siswaId={account.ID} siswaNama={account.NAMA} />
          )}

          {activeTab === 'PROFILE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Nama Lengkap</span>
                  <div className="font-black text-sm text-slate-900">{account.NAMA}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Username Login</span>
                  <div className="font-mono text-xs font-bold text-slate-800">{account.USERNAME}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Peran / Role</span>
                  <div className="font-extrabold text-xs text-blue-800">{account.ROLE}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Kelas Pengampu / Rombel</span>
                  <div className="font-extrabold text-xs text-emerald-800">{account.KELAS || 'Belum Diatur'}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">NIS / NIP</span>
                  <div>
                    <SecureMaskedField
                      value={account.NIP || '-'}
                      type="nis"
                      fieldId={`profile-nis-${account.ID}`}
                      label={account.ROLE === 'SISWA' ? 'NIS Siswa' : 'NIP Pegawai'}
                      monospace
                      showDlpBadge
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Email Akun</span>
                  <div>
                    <SecureMaskedField
                      value={account.EMAIL}
                      type="email"
                      fieldId={`profile-email-${account.ID}`}
                      label="Email Akun"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Status Kelulusan</span>
                  <div className="font-extrabold text-xs text-indigo-700">{account.STATUS_KELULUSAN || 'AKTIF'}</div>
                </div>
              </div>

              {account.KEBUTUHAN_KHUSUS && account.KEBUTUHAN_KHUSUS !== 'REGULER' && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-extrabold uppercase text-[10px] text-amber-700 block">
                    Kebutuhan Khusus / Inklusi Registered:
                  </span>
                  <div className="font-bold">{account.KEBUTUHAN_KHUSUS}</div>
                  {account.CATATAN_INKLUSI && (
                    <p className="text-slate-600 text-[11px] mt-1">{account.CATATAN_INKLUSI}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
