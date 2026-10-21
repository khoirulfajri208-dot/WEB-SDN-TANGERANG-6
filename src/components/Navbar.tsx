import React, { useState, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Bell,
  Check,
  ChevronDown,
  UserCheck,
  Menu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Globe,
  LogOut,
  Shield,
  School,
  User as UserIcon,
  Cloud,
  BookOpen,
  HardDrive,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { securityService } from '../services/securityService';
import { firebaseService, FirebaseSyncStatus } from '../services/firebaseService';
import { User, ActivePage } from '../types';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { InteractiveGuideModal } from './InteractiveGuideModal';
import { StorageManagerModal } from './StorageManagerModal';
import { TwoFactorAuthModal } from './TwoFactorAuthModal';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../utils/theme';

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenSheetsModal?: () => void;
  onOpenGoogleSync?: () => void;
  onOpenFirebaseSync?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenQRScanner?: () => void;
  onOpenSchoolWebsite?: () => void;
  onLogout?: () => void;
  onNavigate?: (page: ActivePage) => void;
  onToggleSidebarMobile?: () => void;
  onToggleSidebar?: () => void;
  notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenSheetsModal,
  onOpenGoogleSync,
  onOpenFirebaseSync,
  onOpenAIAssistant,
  onOpenQRScanner,
  onOpenSchoolWebsite,
  onLogout,
  onNavigate,
  onToggleSidebarMobile,
  onToggleSidebar,
  notificationCount,
}) => {
  const { styles } = useTheme();
  const activeTheme = styles;
  const config = db.getConfig();
  const activeUser = db.getActiveUser();
  const notifications = db.getNotifications().filter((n) => n.STATUS === 'UNREAD');

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Periodic ticker and event listener to recalculate relative sync time immediately
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 15000);

    const handleSyncCompleted = () => {
      setTicker((prev) => prev + 1);
    };
    window.addEventListener('bendahara-sync-completed', handleSyncCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bendahara-sync-completed', handleSyncCompleted);
    };
  }, []);

  const connectedSheetId = db.getConnectedGoogleSheetId();
  const appsScriptUrl = db.getAppsScriptUrl();
  const lastSyncTime = db.getLastSyncTime();
  const isConnected = Boolean(connectedSheetId || appsScriptUrl);

  const getSyncStatusIndicator = () => {
    if (!isConnected) {
      return {
        badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
        dotStyle: 'bg-slate-400',
        iconStyle: 'text-slate-500',
        label: 'Hubungkan Sheets',
        shortLabel: 'Sheets Offline',
        tooltip: 'Belum terhubung ke Google Sheets atau Apps Script. Klik untuk menghubungkan.',
      };
    }

    if (!lastSyncTime) {
      return {
        badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs',
        dotStyle: 'bg-amber-500 animate-pulse',
        iconStyle: 'text-amber-700',
        label: 'Sheets: Siap Sinkron',
        shortLabel: 'Siap Sinkron',
        tooltip: 'Google Sheets terhubung, tetapi data lokal belum pernah disinkronkan. Klik untuk sinkronisasi.',
      };
    }

    const diffMs = Math.max(0, Date.now() - new Date(lastSyncTime).getTime());
    const exactFormatted = new Date(lastSyncTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Under 10 minutes: Emerald Green with pulse
    if (diffMs < 10 * 60 * 1000) {
      return {
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs',
        dotStyle: 'bg-emerald-500 animate-pulse',
        iconStyle: 'text-emerald-700',
        label: 'Sinkron: Baru Saja',
        shortLabel: 'Sinkron Aktif',
        tooltip: `Tersinkronisasi aktif (Pukul ${exactFormatted}). Klik untuk kelola sinkronisasi.`,
      };
    }

    // Between 10 and 60 minutes: Fresh Green
    if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / 60000);
      return {
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs',
        dotStyle: 'bg-emerald-500',
        iconStyle: 'text-emerald-700',
        label: `Sinkron: ${minutes}m lalu`,
        shortLabel: `${minutes}m lalu`,
        tooltip: `Tersinkronisasi ${minutes} menit yang lalu (Pukul ${exactFormatted}).`,
      };
    }

    // Between 1 hour and 24 hours: Sky Blue
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / 3600000);
      return {
        badgeStyle: 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-2xs',
        dotStyle: 'bg-sky-500',
        iconStyle: 'text-sky-700',
        label: `Sinkron: ${hours}j lalu`,
        shortLabel: `${hours}j lalu`,
        tooltip: `Tersinkronisasi hari ini (Pukul ${exactFormatted}). Klik untuk memperbarui data.`,
      };
    }

    // Older than 24 hours: Warning Amber
    const days = Math.floor(diffMs / (24 * 3600000));
    return {
      badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs',
      dotStyle: 'bg-amber-500',
      iconStyle: 'text-amber-700',
      label: `Sinkron: ${days}h lalu`,
      shortLabel: `${days}h lalu`,
      tooltip: `Sinkronisasi terakhir ${days} hari yang lalu (${new Date(lastSyncTime).toLocaleDateString('id-ID')}). Disarankan untuk sinkronisasi ulang.`,
    };
  };

  const syncStatus = getSyncStatusIndicator();

  const handleToggleMenu = () => {
    if (typeof onToggleSidebarMobile === 'function') {
      onToggleSidebarMobile();
    } else if (typeof onToggleSidebar === 'function') {
      onToggleSidebar();
    }
  };

  const handleOpenSheets = () => {
    if (typeof onOpenSheetsModal === 'function') {
      onOpenSheetsModal();
    } else if (typeof onOpenGoogleSync === 'function') {
      onOpenGoogleSync();
    }
  };

  const handleMarkNotifRead = (id: string, module?: string) => {
    db.markNotificationRead(id);
    if (module && module !== 'GENERAL' && typeof onNavigate === 'function') {
      onNavigate(module as ActivePage);
    }
  };

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full">
      <header className={`flex items-center justify-between px-4 sm:px-6 py-3 ${styles.isHighContrast ? 'bg-black text-white border-b-2 border-white' : styles.isDark ? 'bg-slate-950/95 text-slate-100 border-b border-slate-800 shadow-md' : 'bg-white/95 text-slate-800 border-b border-slate-200 shadow-2xs'} backdrop-blur-md transition-all`}>
        {/* Left: Mobile trigger & School Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${activeTheme.textAccent} ${activeTheme.bgSoft} px-2 py-0.5 rounded-md border ${activeTheme.borderAccent}`}>
                Bendahara Barang V8.1.6
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400">•</span>
              <span className="hidden sm:inline-block text-xs font-bold text-slate-700 truncate max-w-[280px]">
                {config.SCHOOL_NAME}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 truncate max-w-[240px] sm:max-w-md">
              {config.ADDRESS}
            </p>
          </div>
        </div>

        {/* Center/Right: Universal Search Shortcut, Google Sheet Sync Chip, Notif, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Shortcut Bar */}
          <button
            type="button"
            onClick={() => onOpenSearch && onOpenSearch()}
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-medium transition-all border border-slate-200 shadow-2xs group cursor-pointer"
          >
            <Search size={14} className={`text-slate-400 group-hover:${activeTheme.textAccent}`} />
            <span>Cari cepat...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-500 shadow-2xs">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onOpenSearch && onOpenSearch()}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Pencarian Universal"
          >
            <Search size={18} />
          </button>

          {/* In-App QR Scanner Button - Hidden on Mobile, Shown in Sub-header */}
          <button
            type="button"
            onClick={() => onOpenQRScanner && onOpenQRScanner()}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTheme.bgSoft} hover:opacity-90 ${activeTheme.textAccent} border ${activeTheme.borderAccent} shadow-2xs cursor-pointer`}
            title="Scan QR / Barcode Aset & Berkas (Shortcut: Ctrl+Shift+S)"
          >
            <QrCode size={15} className={`${activeTheme.textAccent}`} />
            <span className="hidden sm:inline">Scan QR</span>
            <span className={`hidden xl:inline text-[9px] px-1.5 py-0.5 rounded bg-white/70 ${activeTheme.textAccent} font-mono font-extrabold border ${activeTheme.borderAccent}`}>
              Ctrl+Shift+S
            </span>
          </button>

          {/* School Website Portal Button */}
          <button
            type="button"
            onClick={() => onOpenSchoolWebsite && onOpenSchoolWebsite()}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs cursor-pointer"
            title="Buka Website Resmi SDN Tangerang 6"
          >
            <School size={15} className={`${activeTheme.textAccent}`} />
            <span>Website Sekolah</span>
          </button>

          {/* PWA In-App Install Button */}
          <PWAInstallButton />

          {/* Gemini AI Assistant Button - Hidden on Mobile, Shown in Sub-header */}
          <button
            type="button"
            onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r ${activeTheme.primaryGrad} hover:opacity-95 text-white shadow-xs border border-white/10 cursor-pointer`}
            title="Buka Asisten AI Gemini Pengelola Barang"
          >
            <Sparkles size={15} className="text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Asisten AI</span>
          </button>

          {/* Firebase Firestore Cloud Sync Button - Hidden on Mobile, Shown in Sub-header */}
          <button
            type="button"
            onClick={() => onOpenFirebaseSync && onOpenFirebaseSync()}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${activeTheme.bgSoft} hover:opacity-95 ${activeTheme.textAccent} border ${activeTheme.borderAccent} shadow-2xs cursor-pointer`}
            title="Sinkronisasi Database Cloud Firebase Terpusat"
          >
            <Cloud size={15} className={`${activeTheme.textAccent}`} />
            <span className="hidden md:inline font-semibold">Cloud Sync</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Realtime Live"></span>
          </button>

          {/* Centralized Offline Sync - Hidden on Mobile, Shown in Sub-header */}
          <div className="hidden sm:block">
            <OfflineSyncIndicator compact={true} />
          </div>

          {/* Dynamic Google Sheets Connection Status Indicator - Hidden on Mobile, Shown in Sub-header */}
          <button
            type="button"
            onClick={handleOpenSheets}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${syncStatus.badgeStyle}`}
            title={syncStatus.tooltip}
          >
            <FileSpreadsheet size={15} className={syncStatus.iconStyle} />
            <span className="hidden md:inline font-semibold">
              {syncStatus.label}
            </span>
            <span className="hidden sm:inline md:hidden font-semibold">
              {syncStatus.shortLabel}
            </span>
            <span className={`w-2 h-2 rounded-full ${syncStatus.dotStyle}`}></span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Notifikasi"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifikasi</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      db.markAllNotificationsRead();
                      setShowNotifMenu(false);
                    }}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.ID}
                      onClick={() => handleMarkNotifRead(notif.ID, notif.MODULE)}
                      className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-slate-800">{notif.TITLE}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notif.MESSAGE}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi baru.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Profile & Logout Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-black">
              {activeUser.NAMA.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {activeUser.NAMA}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none">
                {activeUser.ROLE}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
              {/* Profile Card Header */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {activeUser.NAMA.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {activeUser.NAMA}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-800 truncate">
                    {activeUser.JABATAN || activeUser.ROLE}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {activeUser.NIP ? `NIP: ${activeUser.NIP}` : 'Pegawai'}
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onOpenSchoolWebsite) onOpenSchoolWebsite();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors"
                >
                  <School size={15} className="text-emerald-700" />
                  <span>Kunjungi Website Sekolah (SDN 6)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onNavigate) onNavigate('pegawai');
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors"
                >
                  <UserIcon size={15} className="text-slate-500" />
                  <span>Kelola Akun Pegawai</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* Bantuan & Buku Panduan */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowGuideModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors"
                >
                  <BookOpen size={15} className="text-amber-600" />
                  <span>Buku Panduan & Manual Sistem</span>
                </button>

                {/* Manajemen Memori & Storage */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowStorageModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors"
                >
                  <HardDrive size={15} className="text-teal-600" />
                  <span>Memori & Kompresi Foto</span>
                </button>

                {/* Keamanan 2FA & Sesi */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowTwoFactorModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors"
                >
                  <ShieldCheck size={15} className="text-indigo-600" />
                  <span>Keamanan 2FA & Kunci Sesi</span>
                </button>

                {/* Kunci Layar Sekarang */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    securityService.lockSession();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 text-amber-900 text-left font-bold transition-colors"
                >
                  <Lock size={15} className="text-amber-600" />
                  <span>Kunci Layar Sekarang (Lock Screen)</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onLogout) {
                      onLogout();
                    } else if (onOpenSchoolWebsite) {
                      onOpenSchoolWebsite();
                    }
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 text-rose-700 text-left font-bold transition-colors"
                >
                  <LogOut size={15} className="text-rose-600" />
                  <span>Keluar / Ke Website Utama</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Sub-Header Status Strip */}
    <div className={`sm:hidden flex items-center gap-2.5 px-4 py-2 border-b overflow-x-auto scrollbar-none transition-all ${
      styles.isHighContrast 
        ? 'bg-black text-white border-b-2 border-white' 
        : styles.isDark 
        ? 'bg-slate-900 border-b border-slate-800' 
        : 'bg-slate-50 border-b border-slate-200'
    }`}>
      {/* Mobile QR Trigger */}
      <button
        type="button"
        onClick={() => onOpenQRScanner && onOpenQRScanner()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 border ${activeTheme.bgSoft} ${activeTheme.textAccent} ${activeTheme.borderAccent} cursor-pointer`}
      >
        <QrCode size={12} className={activeTheme.textAccent} />
        <span>Scan QR</span>
      </button>

      {/* Mobile AI Assistant Trigger */}
      <button
        type="button"
        onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 bg-gradient-to-r ${activeTheme.primaryGrad} text-white cursor-pointer`}
      >
        <Sparkles size={12} className="text-amber-300 animate-pulse" />
        <span>Asisten AI</span>
      </button>

      {/* Mobile Cloud Sync Trigger */}
      <button
        type="button"
        onClick={() => onOpenFirebaseSync && onOpenFirebaseSync()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 border ${activeTheme.bgSoft} ${activeTheme.textAccent} ${activeTheme.borderAccent} cursor-pointer`}
      >
        <Cloud size={12} className={activeTheme.textAccent} />
        <span>Cloud Sync</span>
      </button>

      {/* Mobile Sheets Sync Trigger */}
      <button
        type="button"
        onClick={handleOpenSheets}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 border ${syncStatus.badgeStyle} cursor-pointer`}
      >
        <FileSpreadsheet size={12} className={syncStatus.iconStyle} />
        <span>Sheets</span>
      </button>

      {/* Mobile Compact Offline Sync Indicator */}
      <div className="shrink-0 scale-[0.85] origin-left">
        <OfflineSyncIndicator compact={true} showDetailsButton={true} />
      </div>
    </div>

    {/* INTERACTIVE GUIDE MODAL */}
    <InteractiveGuideModal
      isOpen={showGuideModal}
      onClose={() => setShowGuideModal(false)}
      initialRole={activeUser.ROLE === 'ADMIN' ? 'BENDAHARA' : 'GURU'}
    />

    {/* SMART STORAGE & COMPRESSION MANAGER MODAL */}
    <StorageManagerModal
      isOpen={showStorageModal}
      onClose={() => setShowStorageModal(false)}
    />

    {/* TWO FACTOR AUTH & SESSION SECURITY MODAL */}
    <TwoFactorAuthModal
      isOpen={showTwoFactorModal}
      onClose={() => setShowTwoFactorModal(false)}
    />
  </div>
);
};
