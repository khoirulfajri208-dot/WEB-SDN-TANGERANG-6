import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, User as UserIcon, Check, X, GraduationCap, ChevronDown, PlusCircle, Briefcase, ShieldCheck } from 'lucide-react';
import { db } from '../services/localStorageService';
import { User } from '../types';

interface SearchableEmployeePickerProps {
  selectedUser?: User | null;
  selectedUserId?: string;
  onSelectUser: (user: User) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  roleFilter?: string;
  allowCustomInput?: boolean;
  onCustomInputChange?: (name: string, nip: string, jabatan: string) => void;
  id?: string;
}

export const SearchableEmployeePicker: React.FC<SearchableEmployeePickerProps> = ({
  selectedUser,
  selectedUserId,
  onSelectUser,
  label = 'Pilih Pegawai / Guru / Tenaga Pendidik',
  placeholder = 'Cari nama guru, NIP, gelar, jabatan...',
  disabled = false,
  roleFilter,
  allowCustomInput = true,
  onCustomInputChange,
  id = 'employee-search-picker',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('SEMUA');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualNip, setManualNip] = useState('');
  const [manualJabatan, setManualJabatan] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const users = db.getUsers();

  // Active chosen user
  const activeUser = useMemo(() => {
    if (selectedUser) return selectedUser;
    if (selectedUserId) return users.find((u) => u.ID === selectedUserId) || null;
    return null;
  }, [selectedUser, selectedUserId, users]);

  // Role categories for filters
  const roleCategories = [
    'SEMUA',
    'GURU',
    'KEPALA SEKOLAH',
    'BENDAHARA',
    'OPERATOR',
    'STAFF',
  ];

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      // Role filter prop
      if (roleFilter && u.ROLE !== roleFilter) return false;

      // Filter chip
      if (selectedRoleFilter !== 'SEMUA') {
        if (selectedRoleFilter === 'GURU' && u.ROLE !== 'GURU') return false;
        if (selectedRoleFilter === 'KEPALA SEKOLAH' && u.ROLE !== 'KEPALA SEKOLAH') return false;
        if (selectedRoleFilter === 'BENDAHARA' && u.ROLE !== 'BENDAHARA') return false;
        if (selectedRoleFilter === 'OPERATOR' && u.ROLE !== 'OPERATOR' && u.ROLE !== 'ADMIN') return false;
        if (selectedRoleFilter === 'STAFF' && u.ROLE !== 'STAFF') return false;
      }

      if (!query) return true;
      const matchName = u.NAMA.toLowerCase().includes(query);
      const matchNip = (u.NIP || '').toLowerCase().includes(query);
      const matchJabatan = (u.JABATAN || '').toLowerCase().includes(query);
      const matchRole = u.ROLE.toLowerCase().includes(query);
      const matchGol = (u.GOLONGAN_RUANG || '').toLowerCase().includes(query);
      return matchName || matchNip || matchJabatan || matchRole || matchGol;
    });
  }, [users, searchQuery, selectedRoleFilter, roleFilter]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handlePick = (user: User) => {
    onSelectUser(user);
    if (onCustomInputChange) {
      onCustomInputChange(user.NAMA, user.NIP || '', user.JABATAN || '');
    }
    setIsOpen(false);
    setSearchQuery('');
    setIsManualMode(false);
  };

  const handleApplyManual = () => {
    if (!manualName.trim()) {
      alert('Nama penerima / pihak terkait wajib diisi.');
      return;
    }
    const customUser: User = {
      ID: `CUSTOM-${Date.now()}`,
      NAMA: manualName.trim(),
      NIP: manualNip.trim(),
      JABATAN: manualJabatan.trim() || 'Eksternal / Tamu',
      EMAIL: '',
      ROLE: 'STAFF',
      STATUS: 'AKTIF',
    };
    onSelectUser(customUser);
    if (onCustomInputChange) {
      onCustomInputChange(customUser.NAMA, customUser.NIP, customUser.JABATAN || '');
    }
    setIsOpen(false);
    setIsManualMode(false);
  };

  const formatNIPDisplay = (nip?: string) => {
    if (!nip) return 'NIP. -';
    if (nip.startsWith('NIP')) return nip;
    return `NIP. ${nip}`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <GraduationCap size={15} className="text-emerald-800" />
            {label}
          </span>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
            SD Negeri Tangerang 6
          </span>
        </label>
      )}

      {/* Main Trigger Display */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
          isOpen
            ? 'border-emerald-700 ring-2 ring-emerald-600/20 bg-white'
            : activeUser
            ? 'border-slate-300 bg-white hover:border-emerald-600'
            : 'border-slate-300 bg-slate-50 hover:bg-white text-slate-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        {activeUser ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shrink-0 text-xs shadow-2xs">
              <UserIcon size={16} />
            </div>
            <div className="truncate">
              {/* Nama & Gelar */}
              <div className="font-bold text-slate-900 leading-snug truncate flex items-center gap-1.5">
                <span>{activeUser.NAMA}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700">
                  {activeUser.JABATAN || activeUser.ROLE}
                </span>
              </div>
              {/* NIP Di Bawah Nama dan Gelar */}
              <div className="text-[11px] font-mono font-medium text-emerald-800 leading-tight mt-0.5">
                {formatNIPDisplay(activeUser.NIP)}
                {activeUser.GOLONGAN_RUANG && (
                  <span className="text-slate-500 font-sans ml-2 font-normal">
                    • {activeUser.GOLONGAN_RUANG}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Search size={15} />
            <span>{placeholder}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
          {activeUser && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser(null);
                if (onCustomInputChange) onCustomInputChange('', '', '');
              }}
              className="p-1 hover:text-rose-600 rounded-md hover:bg-rose-50"
              title="Hapus Pilihan"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180 text-emerald-800' : ''}`} />
        </div>
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {!isManualMode ? (
            <>
              {/* Search Bar & Role Chips */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama pegawai, NIP, atau jabatan..."
                    className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Role Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                  {roleCategories.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoleFilter(r)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
                        selectedRoleFilter === r
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee Roster List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSelected = activeUser?.ID === user.ID;
                    return (
                      <button
                        key={user.ID}
                        type="button"
                        onClick={() => handlePick(user)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-semibold'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          {/* Nama Lengkap & Gelar */}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">{user.NAMA}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                user.ROLE === 'KEPALA SEKOLAH'
                                  ? 'bg-amber-100 text-amber-900'
                                  : user.ROLE === 'BENDAHARA'
                                  ? 'bg-blue-100 text-blue-900'
                                  : user.ROLE === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {user.JABATAN || user.ROLE}
                            </span>
                          </div>

                          {/* NIP Di Bawah Nama dan Gelar */}
                          <div className="text-[11px] font-mono text-emerald-800 font-medium mt-0.5 flex items-center gap-2">
                            <span>{formatNIPDisplay(user.NIP)}</span>
                            {user.GOLONGAN_RUANG && (
                              <>
                                <span className="text-slate-400 font-sans">•</span>
                                <span className="text-slate-500 font-sans text-[10.5px]">
                                  {user.GOLONGAN_RUANG}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {isSelected && <Check size={16} className="text-emerald-800 font-bold shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-7 text-center text-slate-400 space-y-1">
                    <UserIcon size={24} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">Pegawai / Guru tidak ditemukan</p>
                    <p className="text-[11px] text-slate-400">
                      Coba periksa ejaan nama atau gunakan NIP pegawai.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 px-3">
                <span>Daftar Guru & Staff SDN Tangerang 6 ({filteredUsers.length})</span>
                {allowCustomInput && (
                  <button
                    type="button"
                    onClick={() => setIsManualMode(true)}
                    className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle size={13} />
                    Ketik Nama / Tamu Bebas
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Manual / Custom Name & NIP Input Mode */
            <div className="p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-emerald-800" />
                  Ketik Identitas Pegawai / Pihak Eksternal
                </h4>
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Kembali ke Daftar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NIP (Nomor Induk Pegawai / Kosongkan jika non-PNS)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19850612 201001 1 008"
                  value={manualNip}
                  onChange={(e) => setManualNip(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono focus:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan / Ruangan / Asal Instansi</label>
                <input
                  type="text"
                  placeholder="Contoh: Guru Pendamping / Pengawas Dinas"
                  value={manualJabatan}
                  onChange={(e) => setManualJabatan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApplyManual}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
                >
                  Terapkan Identitas
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
