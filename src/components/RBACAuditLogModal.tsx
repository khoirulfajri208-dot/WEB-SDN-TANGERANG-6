import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Key,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Filter,
  Download,
  Search,
  Lock,
  Eye,
  Check,
} from 'lucide-react';

export interface RBACAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  module: string;
  action: string;
  ipAddress: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
}

export const RBACAuditLogModal: React.FC<RBACAuditLogModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'LOGS'>('MATRIX');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'log-101',
      timestamp: '31/08/2026 13:15:22',
      username: 'yulia.spdmm',
      role: 'KEPALA SEKOLAH',
      module: 'Persetujuan SPJ BOS',
      action: 'Menyetujui BKU BOS Reguler Tahap II Rp 45.000.000',
      ipAddress: '192.168.1.10',
      level: 'INFO',
    },
    {
      id: 'log-102',
      timestamp: '31/08/2026 12:40:11',
      username: 'nurhayati.spd',
      role: 'BENDAHARA BOS',
      module: 'ARKAS K7a',
      action: 'Input Transaksi Pembelian ATK Rp 2.450.000',
      ipAddress: '192.168.1.15',
      level: 'INFO',
    },
    {
      id: 'log-103',
      timestamp: '31/08/2026 11:20:05',
      username: 'operator.sdn6',
      role: 'PENGURUS BARANG',
      module: 'Inventaris Aset (KIB B)',
      action: 'Cetak Label QR Barcode 15 Unit Laptop Chromebook',
      ipAddress: '192.168.1.20',
      level: 'INFO',
    },
    {
      id: 'log-104',
      timestamp: '31/08/2026 10:05:44',
      username: 'unknown_guest',
      role: 'TAMU UNKNOWN',
      module: 'Pengaturan Sistem',
      action: 'Percobaan Akses Modul Admin Ditolak (RBAC Block)',
      ipAddress: '180.244.12.99',
      level: 'WARNING',
    },
    {
      id: 'log-105',
      timestamp: '31/08/2026 08:30:19',
      username: 'budi.santoso',
      role: 'GURU KELAS 4B',
      module: 'Presensi NFC Kios',
      action: 'Otentikasi Tap Kartu Masuk Tepat Waktu',
      ipAddress: '192.168.1.4',
      level: 'INFO',
    },
  ];

  if (!isOpen) return null;

  const permissionsMatrix = [
    {
      module: 'Pengelolaan Aset KIB A-E',
      guru: false,
      bendahara: false,
      pengurusBarang: true,
      kepsek: true,
      orangtua: false,
    },
    {
      module: 'Input Transaksi ARKAS & BKU BOS',
      guru: false,
      bendahara: true,
      pengurusBarang: false,
      kepsek: true,
      orangtua: false,
    },
    {
      module: 'Manajemen Kelas, Kuis & Modul AI',
      guru: true,
      bendahara: false,
      pengurusBarang: false,
      kepsek: true,
      orangtua: false,
    },
    {
      module: 'Portal WhatsApp & Nilai Siswa',
      guru: true,
      bendahara: false,
      pengurusBarang: false,
      kepsek: true,
      orangtua: true, // Read-only
    },
    {
      module: 'Persetujuan Final & Laporan Pengawas',
      guru: false,
      bendahara: false,
      pengurusBarang: false,
      kepsek: true,
      orangtua: false,
    },
  ];

  const filteredLogs = filterRole === 'ALL' ? auditLogs : auditLogs.filter((l) => l.role.includes(filterRole));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-800/80 text-amber-300 ring-1 ring-indigo-400/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Keamanan Matriks RBAC & Audit Log Aktivitas Sistem
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                Matriks Hak Akses Terenkripsi & Rekam Jejak Keamanan Pengguna SDN Tangerang 6
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

        {/* Tab Switcher Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('MATRIX')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MATRIX' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key size={14} /> Matriks Hak Akses (RBAC)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'LOGS' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} /> Audit Log Keamanan Real-Time
            </button>
          </div>

          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
            RBAC Level: Strict Enterprise
          </span>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'MATRIX' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Matriks **Role-Based Access Control (RBAC)** memastikan hanya pengguna berwenang yang dapat melakukan pengubahan data sensitif pada modul keuangan, aset, dan penilaian.
              </p>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px]">
                      <th className="p-3">Modul Aplikasi</th>
                      <th className="p-3 text-center">Guru Kelas</th>
                      <th className="p-3 text-center">Bendahara BOS</th>
                      <th className="p-3 text-center">Pengurus Barang</th>
                      <th className="p-3 text-center">Kepala Sekolah</th>
                      <th className="p-3 text-center">Orang Tua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {permissionsMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.module}</td>
                        <td className="p-3 text-center">
                          {row.guru ? <CheckCircle2 size={16} className="text-emerald-600 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                        </td>
                        <td className="p-3 text-center">
                          {row.bendahara ? <CheckCircle2 size={16} className="text-emerald-600 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                        </td>
                        <td className="p-3 text-center">
                          {row.pengurusBarang ? <CheckCircle2 size={16} className="text-emerald-600 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                        </td>
                        <td className="p-3 text-center">
                          {row.kepsek ? <CheckCircle2 size={16} className="text-emerald-600 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                        </td>
                        <td className="p-3 text-center">
                          {row.orangtua ? <Eye size={16} className="text-blue-600 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Filter */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Filter Peran:</span>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="ALL">Semua Peran</option>
                    <option value="KEPALA SEKOLAH">Kepala Sekolah</option>
                    <option value="BENDAHARA BOS">Bendahara BOS</option>
                    <option value="PENGURUS BARANG">Pengurus Barang</option>
                    <option value="GURU">Guru</option>
                    <option value="TAMU">Warning Access</option>
                  </select>
                </div>

                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  Menampilkan {filteredLogs.length} Entri Log
                </span>
              </div>

              {/* Log List */}
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                      log.level === 'WARNING'
                        ? 'bg-amber-50/90 border-amber-300'
                        : log.level === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                            log.level === 'WARNING'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {log.role}
                        </span>
                        <span className="font-bold text-slate-900">{log.username}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">{log.timestamp}</span>
                    </div>

                    <p className="text-slate-700 font-medium">{log.action}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Modul: {log.module}</span>
                      <span className="font-mono">IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Lock size={13} className="text-indigo-600" /> Audit Log Otomatis Tersimpan Di Server
          </span>
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
