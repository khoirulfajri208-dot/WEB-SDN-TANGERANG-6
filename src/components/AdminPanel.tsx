import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Users, LogOut, Plus, Search, X, Edit2, Trash2,
  KeyRound, School, GraduationCap, Settings, BookOpen, CheckCircle2, Ban,
  Lock, Unlock, AlertTriangle, ArrowRight, ArrowLeftRight, Check, UserPlus,
  Sparkles, Save, Video, Play, ExternalLink, Image as ImageIcon, Upload, FileSpreadsheet,
  Download, RefreshCw, Copy, Filter, Layers, ChevronLeft, ChevronRight, CheckCheck,
  Eye, EyeOff, ArrowLeft, LogIn
} from 'lucide-react';
import { accountService, STANDARD_CLASSES } from '../services/accountService';
import { securityService } from '../services/securityService';
import { Account, SystemType, AccountRole } from '../types/classroom';
import { db } from '../services/localStorageService';
import { Config, PublicMediaItem } from '../types';
import { themes, useTheme } from '../utils/theme';
import { ClassroomAutoImporterModal } from './ClassroomAutoImporterModal';
import { SecureMaskedField } from './common/SecureMaskedField';
import { SecureMaskingBar } from './common/SecureMaskingBar';
import { SecurityCenterView } from './admin/SecurityCenterView';
import { maskingService } from '../services/maskingService';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminTab = 'overview' | 'grouping' | 'siperseda' | 'classroom' | 'admin' | 'website' | 'security';

interface AdminPortalLoginProps {
  onSuccess: (account: Account) => void;
  onBack: () => void;
}

const AdminPortalLogin: React.FC<AdminPortalLoginProps> = ({ onSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const config = db.getConfig();

  const handlePerformLogin = (userVal: string, passVal: string) => {
    setError(null);
    const cleanUser = userVal.trim().toLowerCase();
    const cleanPass = passVal.trim();

    if (!cleanUser || !cleanPass) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      const normalizedUser = (cleanUser === 'admint' || cleanUser === 'administrator' || cleanUser === 'admin website' || cleanUser === 'admint website') ? 'admin' : userVal.trim();

      const authenticated = accountService.authenticate('ADMIN', normalizedUser, cleanPass);
      if (authenticated) {
        accountService.setActiveAdminAccount(authenticated);
        securityService.recordSuccessfulLogin(authenticated.USERNAME, authenticated.ROLE);
        db.logAudit('LOGIN', 'PORTAL_ADMIN', authenticated.NAMA, {
          username: authenticated.USERNAME,
          role: authenticated.ROLE,
        });
        setIsLoggingIn(false);
        onSuccess(authenticated);
      } else {
        setIsLoggingIn(false);
        setError('Username atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda.');
      }
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }
    handlePerformLogin(username, password);
  };

  const handleDiagnosticReset = () => {
    try {
      localStorage.removeItem('SDN6_FAILED_LOGIN_ATTEMPTS');
      accountService.initAccounts();
      db.initDatabase();
      setError(null);
      setResetMessage('Diagnostik selesai: Semua akun bawaan sistem telah dipulihkan.');
      setTimeout(() => setResetMessage(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Brand & Logo Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            {config.CITY_LOGO_URL ? (
              <img
                src={config.CITY_LOGO_URL}
                alt="Logo Pemkot Tangerang"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-emerald-300 font-bold">
                <ShieldCheck size={26} />
              </div>
            )}
            {config.SCHOOL_LOGO_URL ? (
              <img
                src={config.SCHOOL_LOGO_URL}
                alt="Logo Sekolah / Tut Wuri"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-800/80 border border-blue-600/40 flex items-center justify-center text-blue-300 font-bold">
                <School size={26} />
              </div>
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
              <KeyRound size={12} className="text-amber-400" />
              Portal Kontrol Administrator
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola Kelas, Siswa, Guru, Master Data & Website Publik
            </p>
          </div>
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Username atau Email Administrator
            </label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-2 focus:outline-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-2 focus:outline-blue-500 focus:border-transparent transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[11px] text-slate-300">Autentikasi Terenkripsi & Terlindungi Brute-Force</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">TLS / SHA-256</span>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
              <span>Memverifikasi Akses...</span>
            ) : (
              <>
                <LogIn size={15} />
                <span>Masuk ke Panel Kontrol</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Actions: Diagnostic & Back */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleDiagnosticReset}
            className="text-[11px] font-semibold text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Klik untuk menyinkronkan ulang database akun administrator"
          >
            <RefreshCw size={12} />
            <span>Sinkronkan Akun Administrator</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Kembali ke Website</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { styles, setThemeId, setThemeMode, setPreview, previewThemeId, previewThemeMode } = useTheme();
  const [admin, setAdmin] = useState<Account | null>(accountService.getActiveAdminAccount());
  const [tab, setTab] = useState<AdminTab>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 40;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [config, setConfig] = useState<Config>(db.getConfig());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        let importedCount = 0;
        data.forEach((row) => {
          if (row.NAMA && (row.USERNAME || row.EMAIL)) {
            const role = row.ROLE ? String(row.ROLE).toUpperCase() : 'SISWA';
            const accountData: Partial<Account> = {
              NAMA: row.NAMA,
              USERNAME: row.USERNAME || row.NAMA.toLowerCase().replace(/\s+/g, ''),
              PASSWORD: row.PASSWORD || 'siswa123',
              EMAIL: row.EMAIL || `${row.USERNAME || row.NAMA.toLowerCase().replace(/\s+/g, '')}@sekolah.id`,
              ROLE: (role as AccountRole) || 'SISWA',
              SISTEM: 'CLASSROOM',
              STATUS: 'AKTIF',
              KELAS: row.KELAS ? String(row.KELAS) : '',
            };
            accountService.saveAccount(accountData as Account);
            importedCount++;
          }
        });
        
        loadAccounts();
        showNotify(`Berhasil mengimpor ${importedCount} akun Classroom dari Excel.`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan format sesuai.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // Public Media (Eskul & Prestasi) state
  const [publicMediaItems, setPublicMediaItems] = useState<PublicMediaItem[]>(db.getPublicMediaItems());
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<PublicMediaItem | null>(null);
  const [mediaForm, setMediaForm] = useState<Partial<PublicMediaItem>>({
    title: '',
    category: 'ESKUL',
    description: '',
    photoUrl: '',
    youtubeUrl: '',
    dateOrYear: '',
  });

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.title) {
      alert('Judul media wajib diisi.');
      return;
    }
    const itemToSave: PublicMediaItem = {
      id: editingMedia ? editingMedia.id : `PUB-MED-${Date.now()}`,
      title: mediaForm.title || '',
      category: mediaForm.category || 'ESKUL',
      description: mediaForm.description || '',
      photoUrl: mediaForm.photoUrl || '',
      youtubeUrl: mediaForm.youtubeUrl || '',
      dateOrYear: mediaForm.dateOrYear || '',
    };
    db.savePublicMediaItem(itemToSave);
    setPublicMediaItems(db.getPublicMediaItems());
    setShowMediaModal(false);
    setEditingMedia(null);
    setMediaForm({ title: '', category: 'ESKUL', description: '', photoUrl: '', youtubeUrl: '', dateOrYear: '' });
    showNotify('Data media eskul/prestasi berhasil disimpan.');
  };

  const handleDeleteMedia = (id: string) => {
    if (confirm('Hapus media kegiatan/prestasi ini dari website publik?')) {
      db.deletePublicMediaItem(id);
      setPublicMediaItems(db.getPublicMediaItems());
      showNotify('Media berhasil dihapus.');
    }
  };

  // Transfer student modal state
  const [transferSiswa, setTransferSiswa] = useState<Account | null>(null);
  const [newTargetClass, setNewTargetClass] = useState<string>('Kelas 1A');

  useEffect(() => {
    accountService.initAccounts();
    loadAccounts();
  }, [tab]);

  useEffect(() => {
    return () => {
      setPreview(null, null);
    };
  }, [tab]);

  const loadAccounts = () => {
    if (tab === 'overview' || tab === 'grouping') {
      setAccounts(accountService.getAccounts());
    } else {
      const sistem = tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : 'ADMIN';
      setAccounts(accountService.getAccounts(sistem as SystemType));
    }
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSyncDapodikAccounts = () => {
    setIsSyncingAccounts(true);
    setTimeout(() => {
      const res = accountService.syncAllDapodikClassroomAccounts();
      loadAccounts();
      setIsSyncingAccounts(false);
      showNotify(`Sinkronisasi Berhasil: ${res.totalAccounts} Akun (${res.siswaCount} Siswa + ${res.ptkCount} PTK + ${res.adminCount} Admin) siap digunakan.`);
    }, 400);
  };

  const handleExportAccountsCsv = () => {
    const dataToExport = filtered;
    if (dataToExport.length === 0) {
      alert('Tidak ada akun yang dapat diekspor sesuai filter saat ini.');
      return;
    }

    const headers = ['ID Akun', 'Nama Lengkap', 'Role', 'Sistem', 'Kelas', 'NIP / NIS', 'Email', 'Username', 'Password Default', 'Status'];
    const rows = dataToExport.map((a) => [
      `"${a.ID || ''}"`,
      `"${(a.NAMA || '').replace(/"/g, '""')}"`,
      `"${a.ROLE || ''}"`,
      `"${a.SISTEM || ''}"`,
      `"${a.KELAS || '-'}"`,
      `"${a.NIP || '-'}"`,
      `"${a.EMAIL || ''}"`,
      `"${a.USERNAME || ''}"`,
      `"${a.PASSWORD || (a.ROLE === 'SISWA' ? 'siswa123' : a.ROLE === 'ADMIN' ? 'admin123' : 'guru123')}"`,
      `"${a.STATUS || 'AKTIF'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Akun_Classroom_SDN_Tangerang_6_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotify(`Berhasil mengekspor ${dataToExport.length} data akun ke file CSV.`);
  };

  const handleCopyCredentials = (acc: Account) => {
    // Prevent unauthorized data exfiltration of student credentials when masked
    if (
      acc.ROLE === 'SISWA' &&
      maskingService.isGlobalMaskingEnabled() &&
      !maskingService.isFieldRevealed(`admin-pass-${acc.ID}`)
    ) {
      maskingService.preventClipboardCopy(
        { preventDefault: () => {}, stopPropagation: () => {} } as any,
        `Kredensial Siswa (${acc.NAMA})`
      );
      showNotify(
        '🔒 Kredensial siswa dilindungi Secure Data Masking (DLP). Buka ikon mata terlebih dahulu untuk menyalin akun siswa.'
      );
      return;
    }

    const text = `Username: ${acc.USERNAME}\nPassword: ${acc.PASSWORD || (acc.ROLE === 'SISWA' ? 'siswa123' : acc.ROLE === 'ADMIN' ? 'admin123' : 'guru123')}\nRole: ${acc.ROLE}\nKelas: ${acc.KELAS || '-'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.ID);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      // 1. Text search
      const matchesSearch =
        !search.trim() ||
        a.NAMA.toLowerCase().includes(search.toLowerCase()) ||
        a.USERNAME.toLowerCase().includes(search.toLowerCase()) ||
        a.EMAIL.toLowerCase().includes(search.toLowerCase()) ||
        (a.NIP && a.NIP.toLowerCase().includes(search.toLowerCase())) ||
        (a.KELAS && a.KELAS.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Role filter in classroom tab
      if (tab === 'classroom' && selectedRoleFilter !== 'ALL') {
        if (selectedRoleFilter === 'STAFF TU' && (a.ROLE === 'STAFF TU' || a.ROLE === 'STAFF')) {
          // match
        } else if (a.ROLE !== selectedRoleFilter) {
          return false;
        }
      }

      // 3. Class filter
      if (selectedClassFilter !== 'Semua') {
        if (!a.KELAS || a.KELAS.trim().toLowerCase() !== selectedClassFilter.trim().toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, search, selectedRoleFilter, selectedClassFilter, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const allAccounts = accountService.getAccounts();
  const classesSummary = accountService.getClassSummary();
  const stats = {
    siperseda: allAccounts.filter((a) => a.SISTEM === 'SIPERSEDA').length,
    classroom: allAccounts.filter((a) => a.SISTEM === 'CLASSROOM').length,
    admin: allAccounts.filter((a) => a.SISTEM === 'ADMIN').length,
    siswa: allAccounts.filter((a) => a.ROLE === 'SISWA').length,
    guru: allAccounts.filter((a) => a.ROLE === 'GURU').length,
    lockedGurus: allAccounts.filter((a) => a.ROLE === 'GURU' && a.KELAS_LOCKED).length,
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus akun ini? Tindakan tidak dapat dibatalkan.')) {
      accountService.deleteAccount(id);
      loadAccounts();
      showNotify('Akun berhasil dihapus.');
    }
  };

  const handleCleanNonAdminAccounts = () => {
    if (confirm('Yakin ingin membersihkan semua akun kecuali akun Admin? Seluruh akun Guru, Siswa, dan Kepala Sekolah akan dihapus dan hanya akun Administrator yang dipertahankan.')) {
      const result = accountService.cleanNonAdminAccounts();
      loadAccounts();
      showNotify(`Pembersihan selesai: ${result.deletedCount} akun non-admin dihapus. ${result.remainingAdminCount} akun Admin dipertahankan.`);
    }
  };

  const handleUnlockTeacher = (guru: Account) => {
    if (confirm(`Buka kunci kelas untuk Guru: ${guru.NAMA}? Setelah dibuka, guru dapat memilih kembali kelas mengajar pada saat login Classroom berikutnya.`)) {
      accountService.unlockTeacherClass(guru.ID, admin?.USERNAME || 'ADMIN');
      loadAccounts();
      showNotify(`Kunci kelas ${guru.NAMA} berhasil DIBUKA. Guru dapat memilih kelas baru saat login.`);
    }
  };

  const handleLockTeacher = (guru: Account) => {
    if (!guru.KELAS) {
      alert('Tentukan kelas untuk guru ini terlebih dahulu sebelum mengunci.');
      return;
    }
    accountService.lockTeacherClass(guru.ID, guru.KELAS);
    loadAccounts();
    showNotify(`Kelas ${guru.NAMA} berhasil DIKUNCI pada ${guru.KELAS}.`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSiswa || !newTargetClass) return;
    accountService.updateStudentClass(transferSiswa.ID, newTargetClass);
    loadAccounts();
    showNotify(`Siswa ${transferSiswa.NAMA} berhasil dipindahkan ke ${newTargetClass}.`);
    setTransferSiswa(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveConfig(config);
    setThemeId(config.SYSTEM_THEME || 'classic_blue');
    setThemeMode(config.SYSTEM_THEME_MODE || 'light');
    setPreview(null, null);
    showNotify('Pengaturan Tampilan Website Publik & Tema Sistem berhasil disimpan.');
  };

  const tabs: { id: AdminTab; label: string; icon: any; color: string; badge?: string }[] = [
    { id: 'overview', label: 'Ringkasan', icon: ShieldCheck, color: 'text-slate-700' },
    { id: 'security', label: 'Pusat Keamanan & Kepatuhan', icon: ShieldAlert, color: 'text-rose-700', badge: 'Cyber Defense' },
    { id: 'grouping', label: 'Pengelompokan Kelas & Siswa', icon: School, color: 'text-blue-700', badge: 'Fitur Utama' },
    { id: 'classroom', label: 'Akun Classroom', icon: BookOpen, color: 'text-indigo-700' },
    { id: 'siperseda', label: 'Akun SIPERSEDA', icon: School, color: 'text-emerald-700' },
    { id: 'admin', label: 'Akun Admin', icon: Settings, color: 'text-slate-800' },
    { id: 'website', label: 'Tampilan Website Publik', icon: Sparkles, color: 'text-amber-700', badge: 'Publik' },
  ];

  const currentSistem: SystemType | null =
    tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : tab === 'admin' ? 'ADMIN' : null;

  if (!admin) {
    return (
      <AdminPortalLogin
        onSuccess={(loggedAdmin) => setAdmin(loggedAdmin)}
        onBack={onLogout}
      />
    );
  }

  return (
    <div className={`min-h-screen ${styles.bgApp} flex flex-col font-sans antialiased`}>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Media Add/Edit Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Video size={20} className="text-blue-600" /> {editingMedia ? 'Edit Media Eskul / Prestasi' : 'Tambah Media Baru'}
              </h3>
              <button
                onClick={() => setShowMediaModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Kegiatan / Prestasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Juara 1 Cerdas Cermat Kota Tangerang"
                  value={mediaForm.title || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={mediaForm.category || 'ESKUL'}
                    onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 font-bold"
                  >
                    <option value="ESKUL">Ekstrakurikuler (Eskul)</option>
                    <option value="PRESTASI">Prestasi Siswa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun / Periode</label>
                  <input
                    type="text"
                    placeholder="Desember 2025 / 2025/2026"
                    value={mediaForm.dateOrYear || ''}
                    onChange={(e) => setMediaForm({ ...mediaForm, dateOrYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto (Gambar Thumbnail)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={mediaForm.photoUrl || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, photoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link Video YouTube (URL)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={mediaForm.youtubeUrl || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, youtubeUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 font-mono text-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kegiatan atau pencapaian prestasi..."
                  value={mediaForm.description || ''}
                  onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Save size={16} /> Simpan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 border border-slate-500/40 flex items-center justify-center shadow-inner">
              <ShieldCheck size={22} className="text-slate-200" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">Admin Control Center</h1>
              <span className="text-[10px] text-slate-400 font-semibold">Manajemen Kelas, Siswa, Guru & Akun Sistem</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{admin.NAMA}</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Super Administrator</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-500/40 flex items-center justify-center font-bold text-sm">
              {admin.NAMA.charAt(0)}
            </div>
            <button
              onClick={() => {
                accountService.setActiveAdminAccount(null);
                setAdmin(null);
                onLogout();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Keluar dari Panel Admin"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); }}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* WEBSITE CONFIG TAB */}
        {tab === 'website' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-600" /> Pengaturan Tampilan & Tema Sistem
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Kelola logo, judul, banner, visi, misi, dan sesuaikan tema visual utama yang berlaku di seluruh portal.</p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Save size={16} /> Simpan Perubahan
              </button>
            </div>

            {/* Live Preview Active Notice */}
            {(previewThemeId || previewThemeMode) && (
              <div className="p-4 bg-amber-500/10 border border-amber-300/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span>✨ Live Preview Aktif: Anda sedang melihat simulasi tema baru secara real-time!</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfig({
                        ...config,
                        SYSTEM_THEME: (db.getConfig().SYSTEM_THEME || 'classic_blue') as any,
                        SYSTEM_THEME_MODE: (db.getConfig().SYSTEM_THEME_MODE || 'light') as any,
                      });
                      setPreview(null, null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] transition-all cursor-pointer"
                  >
                    Kembalikan Ke Semula
                  </button>
                </div>
              </div>
            )}

            {/* THEME SELECTION BENTO CARD */}
            <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  🎨 Kustomisasi Tema Visual Aplikasi (Semua Halaman)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sesuaikan palet warna, gradasi premium, dan gaya tombol untuk Website Publik, Classroom, dan SIPERSEDA secara instan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
                {Object.values(themes).map((t) => {
                  const isSelected = config.SYSTEM_THEME === t.id || (!config.SYSTEM_THEME && t.id === 'classic_blue');
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setConfig({ ...config, SYSTEM_THEME: t.id as any });
                        setPreview(t.id, config.SYSTEM_THEME_MODE || 'light');
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                        isSelected
                          ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-[11px] font-black text-slate-900 leading-tight">
                          {t.name.split(' ').slice(1).join(' ') || t.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center">
                            <Check size={10} className="stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Visual swatch simulation */}
                      <div className="h-6 w-full rounded-md bg-slate-100 overflow-hidden flex mt-auto border border-slate-200/50">
                        <div className={`w-1/3 h-full bg-gradient-to-br ${t.primaryGrad}`} />
                        <div className={`w-1/3 h-full ${t.bgSoft}`} />
                        <div className={`w-1/3 h-full bg-white flex items-center justify-center`}>
                          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${t.heroGrad}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* THEME MODE SELECTION BENTO CARD */}
            <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  🌓 Mode Tampilan Sistem (Tema Global Sekolah)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih mode tampilan default antara Mode Terang, Mode Gelap, atau Mode Kontras Tinggi untuk mengoptimalkan aksesibilitas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {[
                  { id: 'light', name: '☀️ Mode Terang (Light)', desc: 'Tampilan bersih, cerah dan profesional' },
                  { id: 'dark', name: '🌙 Mode Gelap (Dark)', desc: 'Tampilan obsidian modern yang ramah mata' },
                  { id: 'high_contrast', name: '👁️ Kontras Tinggi (High Contrast)', desc: 'Desain ramah aksesibilitas dengan kontras ekstrem' },
                ].map((m) => {
                  const isSelected = config.SYSTEM_THEME_MODE === m.id || (!config.SYSTEM_THEME_MODE && m.id === 'light');
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setConfig({ ...config, SYSTEM_THEME_MODE: m.id as any });
                        setPreview(config.SYSTEM_THEME || 'classic_blue', m.id as any);
                      }}
                      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${
                        isSelected
                          ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 mb-1">{m.name}</span>
                      <span className="text-[10px] text-slate-500">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Website</label>
                <input
                  type="text"
                  placeholder="SD NEGERI TANGERANG 6"
                  value={config.PUBLIC_WEB_TITLE || ''}
                  onChange={(e) => setConfig({ ...config, PUBLIC_WEB_TITLE: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Pemda / Daerah (URL Gambar)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={config.CITY_LOGO_URL || ''}
                  onChange={(e) => setConfig({ ...config, CITY_LOGO_URL: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Sekolah / Tut Wuri (URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={config.SCHOOL_LOGO_URL || ''}
                  onChange={(e) => setConfig({ ...config, SCHOOL_LOGO_URL: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Selamat Datang (Hero Title)</label>
              <input
                type="text"
                placeholder="Sistem Informasi Persediaan & Aset..."
                value={config.PUBLIC_WEB_WELCOME_TITLE || ''}
                onChange={(e) => setConfig({ ...config, PUBLIC_WEB_WELCOME_TITLE: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Selamat Datang</label>
              <textarea
                rows={3}
                placeholder="Platform digital terpadu untuk..."
                value={config.PUBLIC_WEB_WELCOME_DESC || ''}
                onChange={(e) => setConfig({ ...config, PUBLIC_WEB_WELCOME_DESC: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Visi Sekolah</label>
              <textarea
                rows={2}
                placeholder="Terwujudnya Peserta Didik yang Beriman..."
                value={config.PUBLIC_WEB_VISI || ''}
                onChange={(e) => setConfig({ ...config, PUBLIC_WEB_VISI: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600 resize-none font-medium italic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Misi Sekolah (Pisahkan dengan baris baru / Enter untuk poin berbeda)</label>
              <textarea
                rows={4}
                placeholder="Menyelenggarakan proses pembelajaran...&#10;Mengembangkan potensi bakat..."
                value={config.PUBLIC_WEB_MISI || ''}
                onChange={(e) => setConfig({ ...config, PUBLIC_WEB_MISI: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600 resize-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teks Footer Website</label>
              <input
                type="text"
                placeholder="UPT Satuan Pendidikan SDN Tangerang 6 di bawah naungan..."
                value={config.PUBLIC_WEB_FOOTER_DESC || ''}
                onChange={(e) => setConfig({ ...config, PUBLIC_WEB_FOOTER_DESC: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-amber-600"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Save size={16} /> Simpan Pengaturan Tampilan Website
              </button>
            </div>
          </form>

          {/* Kelola Media Eskul & Prestasi (Foto & Link YouTube) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Video size={18} className="text-blue-600" /> Kelola Media Eskul & Prestasi (Foto & YouTube)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tambah, edit, atau hapus dokumentasi foto dan tautan video YouTube ekstrakurikuler serta prestasi siswa.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMedia(null);
                  setMediaForm({ title: '', category: 'ESKUL', description: '', photoUrl: '', youtubeUrl: '', dateOrYear: '' });
                  setShowMediaModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all w-fit"
              >
                <Plus size={16} /> Tambah Media Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicMediaItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                  <img
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800'}
                    alt={item.title}
                    className="w-24 h-20 rounded-xl object-cover shrink-0 border border-slate-200 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        item.category === 'ESKUL' ? 'bg-blue-600' : 'bg-amber-500'
                      }`}>
                        {item.category}
                      </span>
                      {item.dateOrYear && <span className="text-[10px] text-slate-400">{item.dateOrYear}</span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{item.description}</p>
                    {item.youtubeUrl && (
                      <div className="text-[10px] text-red-600 font-medium truncate flex items-center gap-1 pt-1">
                        <Play size={10} fill="currentColor" />
                        <span className="truncate">{item.youtubeUrl}</span>
                      </div>
                    )}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMedia(item);
                          setMediaForm(item);
                          setShowMediaModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Trash2 size={11} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pengelompokan Kelas" value={STANDARD_CLASSES.length} icon={School} color="text-blue-700 bg-blue-100" onClick={() => setTab('grouping')} />
              <StatCard label="Siswa Terkelompok" value={stats.siswa} icon={Users} color="text-indigo-700 bg-indigo-100" onClick={() => setTab('grouping')} />
              <StatCard label="Guru Terkunci (1x)" value={stats.lockedGurus} icon={Lock} color="text-emerald-700 bg-emerald-100" onClick={() => setTab('grouping')} />
              <StatCard label="Total Akun Sistem" value={allAccounts.length} icon={ShieldCheck} color="text-slate-800 bg-slate-200" />
            </div>

            {/* Quick Summary of Classes */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <School size={18} className="text-blue-700" /> Ringkasan Pengelompokan Kelas & Guru
                  </h3>
                  <p className="text-xs text-slate-500">Status sinkronisasi siswa dan penguncian kelas guru SDN Tangerang 6</p>
                </div>
                <button
                  onClick={() => setTab('grouping')}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1"
                >
                  Kelola Kelas & Siswa <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesSummary.map((c) => {
                  const teacher = c.teachers[0];
                  return (
                    <div key={c.kelas} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-slate-900">{c.kelas}</span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {c.studentCount} Siswa
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Guru Pengampu:</div>
                        {teacher ? (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="font-bold text-slate-800 truncate">{teacher.NAMA}</span>
                            {teacher.KELAS_LOCKED ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                <Lock size={9} /> Terkunci
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                <Unlock size={9} /> Terbuka
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada guru</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GROUPING & CLASS MANAGEMENT TAB */}
        {tab === 'grouping' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <School size={20} className="text-blue-700" />
                  Sistem Pengelompokan Kelas & Siswa
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola alokasi siswa per kelas dan kontrol status penguncian 1x untuk akun Guru Classroom
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImporter(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet size={14} /> Auto-Importer Siswa
                </button>
                <button
                  onClick={() => {
                    setEditAccount({
                      ID: '',
                      NAMA: '',
                      EMAIL: '',
                      USERNAME: '',
                      PASSWORD: 'siswa123',
                      ROLE: 'SISWA',
                      SISTEM: 'CLASSROOM',
                      STATUS: 'AKTIF',
                      KELAS: 'Kelas 1A',
                      CREATED_AT: new Date().toISOString(),
                    });
                    setShowForm(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={14} /> Tambah Siswa Baru
                </button>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Lock size={14} /> Mekanisme Kerja Pengelompokan Kelas & Kunci Guru:
              </div>
              <p>
                • <strong>Guru Otomatis Tersinkron:</strong> Saat Guru login dan memilih kelas 1x, kelas langsung terkunci. Seluruh siswa pada kelas tersebut akan langsung masuk otomatis ke Classroom Guru.
              </p>
              <p>
                • <strong>Buka Kunci (Admin Only):</strong> Jika guru perlu berpindah kelas, klik tombol <span className="font-bold text-amber-800">"Buka Kunci"</span> di bawah ini. Guru akan diminta memilih kelas kembali pada login berikutnya.
              </p>
              <p>
                • <strong>Pindah Siswa:</strong> Anda dapat memindahkan siswa antar kelas kapan saja dengan tombol <span className="font-bold text-blue-800">"Pindah Kelas"</span>.
              </p>
            </div>

            {/* Classes Detail Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Status Rombongan Belajar (Rombel) Kelas 1A s/d 6D SDN Tangerang 6
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesSummary.map((c) => {
                  const teacher = c.teachers[0];
                  return (
                    <div key={c.kelas} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        {/* Class Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <div>
                            <span className="font-black text-base text-slate-900">{c.kelas}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">Tahun Ajaran 2026/2027</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-black text-xs">
                            {c.studentCount} Siswa
                          </span>
                        </div>

                        {/* Teacher Info & Lock Actions */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Guru Pengampu:
                          </div>
                          {teacher ? (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{teacher.NAMA}</div>
                                  <div className="text-[10px] text-slate-500">NIP: {teacher.NIP || '-'} • @{teacher.USERNAME}</div>
                                </div>
                                {teacher.KELAS_LOCKED ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                    <Lock size={10} /> Terkunci (1x)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                                    <Unlock size={10} /> Terbuka
                                  </span>
                                )}
                              </div>

                              {/* Lock / Unlock Buttons */}
                              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                                {teacher.KELAS_LOCKED ? (
                                  <button
                                    onClick={() => handleUnlockTeacher(teacher)}
                                    className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                  >
                                    <Unlock size={12} /> Buka Kunci Guru
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleLockTeacher(teacher)}
                                    className="w-full py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                  >
                                    <Lock size={12} /> Kunci Kelas Guru
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 py-1 italic flex items-center justify-between">
                              <span>Belum ada guru pengampu</span>
                            </div>
                          )}
                        </div>

                        {/* Students in this class preview */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Daftar Siswa ({c.students.length})</span>
                          </div>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {c.students.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic py-2">Belum ada siswa di kelas ini.</p>
                            ) : (
                              c.students.map((s) => (
                                <div key={s.ID} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2 hover:border-blue-300">
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{s.NAMA}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">NIS: {s.NIP || '-'}</div>
                                  </div>
                                  <button
                                    onClick={() => { setTransferSiswa(s); setNewTargetClass(c.kelas); }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                                    title="Pindahkan Siswa ke Kelas Lain"
                                  >
                                    <ArrowLeftRight size={13} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Add Student Button */}
                      <button
                        onClick={() => {
                          setEditAccount({
                            ID: '',
                            NAMA: '',
                            EMAIL: '',
                            USERNAME: '',
                            PASSWORD: 'siswa123',
                            ROLE: 'SISWA',
                            SISTEM: 'CLASSROOM',
                            STATUS: 'AKTIF',
                            KELAS: c.kelas,
                            CREATED_AT: new Date().toISOString(),
                          });
                          setShowForm(true);
                        }}
                        className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Plus size={13} /> Tambah Siswa ke {c.kelas}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SIPERSEDA, CLASSROOM & ADMIN ACCOUNT TABS */}
        {tab !== 'overview' && tab !== 'grouping' && tab !== 'website' && tab !== 'security' && (
          <div className="space-y-4">
            {/* Secure Data Masking & DLP Banner */}
            <SecureMaskingBar scopeLabel={`Akun ${currentSistem} & Data Kredensial`} />

            {/* Header & Main Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">Akun {currentSistem}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white">
                    {filtered.length} Akun
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentSistem === 'SIPERSEDA' && 'Kelola akun Operator & Kepala Sekolah untuk SIPERSEDA'}
                  {currentSistem === 'CLASSROOM' && '742 Akun Siswa Dapodik, Guru Wali Kelas, Mapel & Kepala Sekolah'}
                  {currentSistem === 'ADMIN' && 'Kelola kredensial akun Administrator & Operator Sekolah'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentSistem === 'CLASSROOM' && (
                  <>
                    <button
                      onClick={handleSyncDapodikAccounts}
                      disabled={isSyncingAccounts}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      title="Sinkronkan seluruh akun Classroom otomatis dari Dapodik (742 Siswa + 45 PTK + Admin)"
                    >
                      <RefreshCw size={14} className={isSyncingAccounts ? 'animate-spin' : ''} />
                      {isSyncingAccounts ? 'Menyinkronkan...' : 'Sinkronkan Akun Dapodik'}
                    </button>
                    <button
                      onClick={handleExportAccountsCsv}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Ekspor daftar akun terpilih ke file CSV / Excel untuk dibagikan atau dicetak"
                    >
                      <Download size={14} /> Ekspor CSV
                    </button>
                    <button
                      onClick={() => setShowImporter(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <FileSpreadsheet size={14} /> Auto-Importer
                    </button>
                  </>
                )}
                <button
                  onClick={handleCleanNonAdminAccounts}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Hapus semua akun selain akun administrator"
                >
                  <Trash2 size={14} className="text-rose-600" /> Bersihkan Non-Admin
                </button>
                <button
                  onClick={() => { setEditAccount(null); setShowForm(true); }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Tambah Akun
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              {/* Role Filter Chips (for Classroom) */}
              {currentSistem === 'CLASSROOM' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {[
                    { id: 'ALL', label: 'Semua Akun', count: accounts.length },
                    { id: 'SISWA', label: 'Siswa', count: accounts.filter((a) => a.ROLE === 'SISWA').length },
                    { id: 'GURU', label: 'Guru & Wali Kelas', count: accounts.filter((a) => a.ROLE === 'GURU').length },
                    { id: 'KEPALA SEKOLAH', label: 'Kepsek', count: accounts.filter((a) => a.ROLE === 'KEPALA SEKOLAH').length },
                    { id: 'STAFF TU', label: 'Staff & TU', count: accounts.filter((a) => a.ROLE === 'STAFF TU' || a.ROLE === 'STAFF').length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedRoleFilter(f.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        selectedRoleFilter === f.id
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        selectedRoleFilter === f.id ? 'bg-blue-900/40 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Class Filter & Search Inputs */}
              <div className="flex items-center gap-2.5 flex-1 max-w-xl ml-auto">
                {currentSistem === 'CLASSROOM' && (
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => {
                      setSelectedClassFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 shrink-0 focus:outline-blue-600"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {STANDARD_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                )}

                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, username, NIS/NIP, kelas..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-600 font-medium"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Account List Grid / Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {filtered.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Users size={40} className="text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">Tidak ada akun ditemukan</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {search ? `Tidak ada akun yang cocok dengan kata kunci "${search}".` : 'Belum ada data akun yang sesuai filter.'}
                  </p>
                  {currentSistem === 'CLASSROOM' && (
                    <button
                      onClick={handleSyncDapodikAccounts}
                      className="mt-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} /> Sinkronkan Seluruh Akun Dapodik
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paginatedAccounts.map((a) => {
                    const defaultPassword = a.PASSWORD || (a.ROLE === 'SISWA' ? 'siswa123' : a.ROLE === 'ADMIN' ? 'admin123' : 'guru123');
                    const isCopied = copiedId === a.ID;

                    return (
                      <div key={a.ID} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            a.ROLE === 'ADMIN' ? 'bg-slate-900 text-white' :
                            a.ROLE === 'KEPALA SEKOLAH' ? 'bg-purple-600 text-white' :
                            a.ROLE === 'GURU' ? 'bg-blue-600 text-white' :
                            a.ROLE === 'SISWA' ? 'bg-indigo-500 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {a.NAMA.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">{a.NAMA}</span>
                              {a.STATUS === 'AKTIF' ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> Aktif
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <Ban size={10} /> Nonaktif
                                </span>
                              )}
                              {a.ROLE === 'GURU' && (
                                a.KELAS_LOCKED ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <Lock size={9} /> Kelas Terkunci ({a.KELAS})
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    <Unlock size={9} /> Kunci Terbuka
                                  </span>
                                )
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                                @{a.USERNAME}
                              </span>
                              <span>•</span>
                              <SecureMaskedField
                                value={a.EMAIL}
                                type="email"
                                fieldId={`admin-email-${a.ID}`}
                                label="Email Akun"
                              />
                              {a.NIP && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 font-medium">
                                    {a.ROLE === 'SISWA' ? 'NIS: ' : 'NIP: '}
                                  </span>
                                  <SecureMaskedField
                                    value={a.NIP}
                                    type="nis"
                                    fieldId={`admin-nip-${a.ID}`}
                                    label={a.ROLE === 'SISWA' ? 'NIS Siswa' : 'NIP Pegawai'}
                                    monospace
                                  />
                                </>
                              )}
                              <span>•</span>
                              <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                                <span>Pass:</span>
                                <SecureMaskedField
                                  value={defaultPassword}
                                  type="password"
                                  fieldId={`admin-pass-${a.ID}`}
                                  label="Kata Sandi"
                                  monospace
                                />
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                a.ROLE === 'ADMIN' ? 'bg-slate-200 text-slate-800' :
                                a.ROLE === 'KEPALA SEKOLAH' ? 'bg-purple-100 text-purple-800' :
                                a.ROLE === 'GURU' ? 'bg-blue-100 text-blue-800' :
                                a.ROLE === 'SISWA' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>{a.ROLE}</span>
                              {a.KELAS && (
                                <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  {a.KELAS}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {/* Copy Credential Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(a)}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="Salin Username dan Password Akun ini"
                          >
                            {isCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                            <span>{isCopied ? 'Tersalin' : 'Salin Akun'}</span>
                          </button>

                          {/* Teacher Lock / Unlock Toggle Button */}
                          {a.ROLE === 'GURU' && (
                            a.KELAS_LOCKED ? (
                              <button
                                onClick={() => handleUnlockTeacher(a)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Buka Kunci Kelas Guru"
                              >
                                <Unlock size={11} /> Buka Kunci
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLockTeacher(a)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Kunci Kelas Guru"
                              >
                                <Lock size={11} /> Kunci Kelas
                              </button>
                            )
                          )}

                          <button
                            onClick={() => { setEditAccount(a); setShowForm(true); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Data Akun"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(a.ID)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {filtered.length > itemsPerPage && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <strong className="text-slate-800 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong className="text-slate-800 font-bold">{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong className="text-slate-800 font-bold">{filtered.length}</strong> akun
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                    <span className="text-xs font-bold text-slate-700 px-2">
                      Halaman {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      Berikutnya <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURITY & CYBER DEFENSE CENTER TAB */}
        {tab === 'security' && (
          <SecurityCenterView
            accounts={accounts}
            onRefreshAccounts={loadAccounts}
            onShowNotify={showNotify}
          />
        )}
      </main>

      {/* MODAL: TRANSFER STUDENT CLASS */}
      {transferSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowLeftRight size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900">Pindahkan Kelas Siswa</h3>
              </div>
              <button type="button" onClick={() => setTransferSiswa(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{transferSiswa.NAMA}</div>
              <div className="text-slate-500 text-[11px]">NIS: {transferSiswa.NIP || '-'} • Kelas Saat Ini: <strong className="text-blue-700">{transferSiswa.KELAS || '-'}</strong></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kelas Baru:</label>
              <select
                value={newTargetClass}
                onChange={(e) => setNewTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 font-bold"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTransferSiswa(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1">
                <Check size={14} /> Pindahkan Siswa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ACCOUNT FORM (ADD/EDIT) */}
      {showForm && (
        <AccountFormModal
          sistem={currentSistem || 'CLASSROOM'}
          account={editAccount}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAccounts(); showNotify('Data akun berhasil disimpan.'); }}
        />
      )}

      {/* MODAL: AUTO IMPORTER */}
      {showImporter && (
        <ClassroomAutoImporterModal 
          onClose={() => setShowImporter(false)}
          onSuccess={(count) => {
            setShowImporter(false);
            loadAccounts();
            showNotify(`Berhasil mengimpor ${count} data akun Classroom.`);
          }}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: string; onClick?: () => void }> = ({ label, value, icon: Icon, color, onClick }) => (
  <button onClick={onClick} disabled={!onClick} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-left ${onClick ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : ''}`}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-black text-slate-900">{value}</div>
    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{label}</div>
  </button>
);

const AccountFormModal: React.FC<{ sistem: SystemType; account: Account | null; onClose: () => void; onSaved: () => void }> = ({ sistem, account, onClose, onSaved }) => {
  const [nama, setNama] = useState(account?.NAMA || '');
  const [email, setEmail] = useState(account?.EMAIL || '');
  const [username, setUsername] = useState(account?.USERNAME || '');
  const [password, setPassword] = useState(account?.PASSWORD || '');
  const [role, setRole] = useState<AccountRole>(account?.ROLE || (sistem === 'CLASSROOM' ? 'GURU' : sistem === 'SIPERSEDA' ? 'OPERATOR' : 'ADMIN'));
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>(account?.STATUS || 'AKTIF');
  const [nip, setNip] = useState(account?.NIP || '');
  const [kelas, setKelas] = useState(account?.KELAS || 'Kelas 1A');
  const [kelasLocked, setKelasLocked] = useState<boolean>(account?.KELAS_LOCKED || false);

  const roleOptions: AccountRole[] =
    sistem === 'SIPERSEDA' ? ['OPERATOR', 'KEPALA SEKOLAH'] :
    sistem === 'CLASSROOM' ? ['SISWA', 'GURU', 'KEPALA SEKOLAH'] :
    ['ADMIN'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) return;
    accountService.saveAccount({
      ...(account ? { ID: account.ID } : {}),
      NAMA: nama,
      EMAIL: email || `${username.toLowerCase()}@sdntangerang6.sch.id`,
      USERNAME: username,
      PASSWORD: password || '123456',
      ROLE: role,
      SISTEM: sistem,
      STATUS: status,
      NIP: nip,
      KELAS: role === 'SISWA' || role === 'GURU' ? kelas : '',
      KELAS_LOCKED: role === 'GURU' ? kelasLocked : false,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">{account && account.ID ? 'Edit Akun' : 'Tambah Akun'} {sistem}</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kata Sandi</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600 font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${username || 'user'}@sdntangerang6.sch.id`} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AccountRole)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Status Akun</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              <option value="AKTIF">AKTIF</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIP {role === 'SISWA' ? '(NIS Siswa)' : ''}</label>
            <input value={nip} onChange={(e) => setNip(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
          </div>
          {(sistem === 'CLASSROOM' || role === 'SISWA' || role === 'GURU') && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kelas Pengampu / Belajar</label>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
                {STANDARD_CLASSES.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}
        </div>

        {role === 'GURU' && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kelasLocked}
                onChange={(e) => setKelasLocked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Kunci Kelas Ini Sekarang (Guru Terkunci 1x)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"><KeyRound size={12} /> Simpan</button>
        </div>
      </form>
    </div>
  );
};
