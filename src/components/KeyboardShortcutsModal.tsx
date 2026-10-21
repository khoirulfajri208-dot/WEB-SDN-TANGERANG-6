import React from 'react';
import { Command, X, QrCode, Search, Printer, Bot, Globe, Shield, RefreshCw } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Pintasan Scanner & Modul Utama',
      items: [
        { keys: ['Ctrl', 'K'], label: 'Buka Omnibar Command Palette', icon: Command },
        { keys: ['Ctrl', 'Shift', 'S'], label: 'Buka Smart QR Scanner', icon: QrCode },
        { keys: ['Ctrl', 'P'], label: 'Cetak Massal / Rekap PDF', icon: Printer },
        { keys: ['Ctrl', '/'], label: 'Buka Bantuan Pintasan Keyboard', icon: Command },
      ],
    },
    {
      category: 'Aksi Cepat & Navigasi',
      items: [
        { keys: ['Esc'], label: 'Tutup Modal / Batal Pilihan', icon: X },
        { keys: ['Ctrl', 'Shift', 'A'], label: 'Buka Asisten AI Gemini', icon: Bot },
        { keys: ['Ctrl', 'Shift', 'W'], label: 'Buka Portal Website Sekolah', icon: Globe },
        { keys: ['Ctrl', 'Shift', 'C'], label: 'Buka Classroom LMS', icon: Search },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Command size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Pintasan Keyboard Sistem (Power-User)</h3>
              <p className="text-xs text-slate-500">Akses cepat semua fungsi utama tanpa perlu klik tetikus</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                {group.category}
              </span>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-700 font-semibold min-w-0">
                        <Icon size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[10px] font-extrabold text-slate-800 shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-800">Esc</kbd> untuk menutup</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
