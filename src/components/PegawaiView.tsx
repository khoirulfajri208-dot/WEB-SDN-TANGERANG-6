import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Award,
  Download,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { User } from '../types';
import { SecureMaskedField } from './common/SecureMaskedField';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PegawaiView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [gelar, setGelar] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [golongan, setGolongan] = useState('');
  const [role, setRole] = useState<User['ROLE']>('GURU');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  const config = db.getConfig();

  const refreshData = () => {
    setUsers(db.getUsers());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setNama('');
    setNip('');
    setGelar('');
    setJabatan('Guru Kelas');
    setGolongan('Penata Muda (III/a)');
    setRole('GURU');
    setEmail('');
    setTelepon('');
    setStatus('AKTIF');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNama(user.NAMA);
    setNip(user.NIP || '');
    setGelar(user.GELAR || '');
    setJabatan(user.JABATAN || '');
    setGolongan(user.GOLONGAN_RUANG || '');
    setRole(user.ROLE);
    setEmail(user.EMAIL || '');
    setTelepon(user.TELEPON || '');
    setStatus(user.STATUS);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama lengkap pegawai wajib diisi.');
      return;
    }

    const payload: Partial<User> = {
      ID: editingUser ? editingUser.ID : undefined,
      NAMA: nama.trim(),
      NIP: nip.trim(),
      GELAR: gelar.trim(),
      JABATAN: jabatan.trim(),
      GOLONGAN_RUANG: golongan.trim(),
      ROLE: role,
      EMAIL: email.trim() || `${nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@sdntangerang6.sch.id`,
      TELEPON: telepon.trim(),
      STATUS: status,
    };

    db.saveUser(payload);
    setIsModalOpen(false);
    refreshData();
    alert(editingUser ? 'Data pegawai berhasil diperbarui!' : 'Pegawai baru berhasil ditambahkan!');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pegawai "${name}"?`)) {
      db.deleteUser(id);
      refreshData();
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PEMERINTAH KOTA TANGERANG', pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(10.5);
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(13);
    doc.text(`UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME.toUpperCase()}`, pageWidth / 2, 25, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const subInfo = [
      `NPSN: ${config.SCHOOL_NPSN}`,
      config.ADDRESS,
      config.SCHOOL_EMAIL ? `Email: ${config.SCHOOL_EMAIL}` : '',
      config.SCHOOL_WEBSITE ? `Web: ${config.SCHOOL_WEBSITE}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(subInfo, pageWidth / 2, 30.5, { align: 'center' });

    doc.setLineWidth(0.8);
    doc.line(14, 33.5, pageWidth - 14, 33.5);
    doc.setLineWidth(0.2);
    doc.line(14, 34.5, pageWidth - 14, 34.5);

    let currentY = 43;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DAFTAR PEGAWAI, GURU, DAN TENAGA KEPENDIDIKAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tahun Pelajaran: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 7;

    const rows = users.map((u, idx) => [
      idx + 1,
      u.NAMA + (u.NIP ? `\nNIP. ${u.NIP}` : '\nNIP. -'),
      u.JABATAN || u.ROLE,
      u.GOLONGAN_RUANG || '-',
      u.ROLE,
      u.STATUS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Lengkap & NIP', 'Jabatan / Tugas', 'Pangkat / Golongan', 'Peran Sistem', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable finalY
    const finalY = doc.lastAutoTable.finalY + 10;
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    doc.setFontSize(9);
    doc.text(`Tangerang, ${todayStr}`, pageWidth - 20, finalY, { align: 'right' });
    doc.text('Kepala UPT Satuan Pendidikan SD Negeri Tangerang 6', pageWidth - 50, finalY + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.', pageWidth - 50, finalY + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`NIP. ${config.HEADMASTER_NIP || '19680412 199303 2 005'}`, pageWidth - 50, finalY + 27.5, {
      align: 'center',
    });

    doc.save(`Daftar_Pegawai_Guru_SDN_Tangerang_6_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Filter logic
  const { filteredUsers, totalPegawai, totalGuru, totalBerNIP, totalStaff } = useMemo(() => {
    const filtered = users.filter((u) => {
      if (roleFilter !== 'SEMUA') {
        if (roleFilter === 'GURU' && u.ROLE !== 'GURU') return false;
        if (roleFilter === 'PIMPINAN' && u.ROLE !== 'KEPALA SEKOLAH' && u.ROLE !== 'BENDAHARA') return false;
        if (roleFilter === 'STAFF' && u.ROLE !== 'STAFF' && u.ROLE !== 'OPERATOR' && u.ROLE !== 'ADMIN') return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.NAMA.toLowerCase().includes(q) ||
        (u.NIP || '').toLowerCase().includes(q) ||
        (u.JABATAN || '').toLowerCase().includes(q) ||
        (u.GOLONGAN_RUANG || '').toLowerCase().includes(q) ||
        u.ROLE.toLowerCase().includes(q)
      );
    });

    return {
      filteredUsers: filtered,
      totalPegawai: users.length,
      totalGuru: users.filter((u) => u.ROLE === 'GURU').length,
      totalBerNIP: users.filter((u) => u.NIP && u.NIP.trim().length > 5).length,
      totalStaff: users.filter((u) => u.ROLE !== 'GURU').length
    };
  }, [users, roleFilter, search]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Users size={20} className="text-emerald-800" />
              Master Data Pegawai & Guru
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
              {config.SCHOOL_NAME}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar resmi dewan guru, pimpinan sekolah, bendahara, operator dapodik, dan staf kependidikan lengkap dengan NIP & Gelar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download size={15} /> Cetak Daftar (PDF)
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={16} /> Tambah Pegawai / Guru
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Users size={14} className="text-emerald-700" />
            Total Personel
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalPegawai}</div>
          <span className="text-[10px] text-slate-400">Pegawai & Guru Terdaftar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <GraduationCap size={14} className="text-blue-700" />
            Dewan Guru
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1">{totalGuru}</div>
          <span className="text-[10px] text-slate-400">Guru Kelas & Guru Mapel</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Award size={14} className="text-amber-700" />
            Pegawai Ber-NIP
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{totalBerNIP}</div>
          <span className="text-[10px] text-slate-400">PNS / PPPK / ASN Aktif</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Briefcase size={14} className="text-purple-700" />
            Pimpinan & Tendik
          </span>
          <div className="text-2xl font-black text-purple-900 mt-1">{totalStaff}</div>
          <span className="text-[10px] text-slate-400">KS, Bendahara, Operator & Staf</span>
        </div>
      </div>

      {/* Main Roster Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, gelar, NIP, atau jabatan..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'SEMUA', label: 'Semua' },
              { id: 'GURU', label: 'Dewan Guru' },
              { id: 'PIMPINAN', label: 'Pimpinan & BOS' },
              { id: 'STAFF', label: 'Tendik & Staf' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  roleFilter === tab.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Jabatan / Unit Tugas</th>
                <th className="py-3 px-4">Pangkat / Golongan</th>
                <th className="py-3 px-4">Peran Sistem</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      {/* Nama & Gelar */}
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{user.NAMA}</span>
                      </div>
                      {/* NIP Di Bawah Nama dan Gelar */}
                      <div className="text-[11px] font-mono text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                        <span>NIP.</span>
                        {user.NIP ? (
                          <SecureMaskedField
                            value={user.NIP}
                            type="nis"
                            fieldId={`pegawai-nip-${user.ID}`}
                            label="NIP Pegawai"
                            monospace
                          />
                        ) : (
                          <span className="text-slate-400">- (Non-PNS)</span>
                        )}
                      </div>
                      {user.EMAIL && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          <SecureMaskedField
                            value={user.EMAIL}
                            type="email"
                            fieldId={`pegawai-email-${user.ID}`}
                            label="Email Pegawai"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {user.JABATAN || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium">{user.GOLONGAN_RUANG || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.ROLE === 'KEPALA SEKOLAH'
                            ? 'bg-amber-100 text-amber-900'
                            : user.ROLE === 'BENDAHARA'
                            ? 'bg-blue-100 text-blue-900'
                            : user.ROLE === 'ADMIN'
                            ? 'bg-purple-100 text-purple-900'
                            : user.ROLE === 'OPERATOR'
                            ? 'bg-cyan-100 text-cyan-900'
                            : user.ROLE === 'STAFF'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {user.ROLE}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          user.STATUS === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.STATUS === 'AKTIF' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {user.STATUS}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                          title="Edit Pegawai"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.ID, user.NAMA)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus Pegawai"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">Tidak ada data pegawai yang cocok</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter peran.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-800" />
                {editingUser ? 'Edit Data Pegawai / Guru' : 'Tambah Pegawai / Guru Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Akademik <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hj. Sumarsih, S.Pd., M.M."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19680412 199303 2 005"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-emerald-900 font-semibold focus:outline-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">Kosongkan jika Guru Honorer / Non-PNS</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pangkat / Golongan Ruang</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembina (IV/a) / Penata (III/c)"
                    value={golongan}
                    onChange={(e) => setGolongan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Penugasan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru Kelas 4 / Guru PJOK"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peran Akses di Sistem</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as User['ROLE'])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-emerald-700"
                  >
                    <option value="GURU">GURU</option>
                    <option value="KEPALA SEKOLAH">KEPALA SEKOLAH</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="OPERATOR">OPERATOR PENGELOLA BARANG</option>
                    <option value="ADMIN">ADMINISTRATOR SISTEM</option>
                    <option value="STAFF">STAFF / TENDIK</option>
                    <option value="AUDITOR">AUDITOR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    placeholder="nama@sdntangerang6.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-800 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="AKTIF"
                      checked={status === 'AKTIF'}
                      onChange={() => setStatus('AKTIF')}
                      className="text-emerald-800 focus:ring-emerald-700"
                    />
                    Aktif Bertugas
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="NONAKTIF"
                      checked={status === 'NONAKTIF'}
                      onChange={() => setStatus('NONAKTIF')}
                      className="text-slate-500 focus:ring-slate-500"
                    />
                    Nonaktif / Mutasi
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambahkan Pegawai'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
