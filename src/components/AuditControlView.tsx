import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Search, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { db } from '../services/localStorageService';
import { AuditLog } from '../types';

export const AuditControlView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [search, setSearch] = useState('');
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);

  const refreshLogs = () => {
    setLogs(db.getAuditLogs());
  };

  const handleRecalculateStock = () => {
    setIsRebuilding(true);
    setTimeout(() => {
      db.rebuildStockLedger();
      refreshLogs();
      setIsRebuilding(false);
      setRebuildMsg('Rekonsiliasi seluruh kartu stok dan saldo persediaan berhasil dijalankan.');
    }, 400);
  };

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.ACTION.toLowerCase().includes(search.toLowerCase()) ||
      l.MODULE.toLowerCase().includes(search.toLowerCase()) ||
      l.USER_NAME.toLowerCase().includes(search.toLowerCase()) ||
      l.DETAILS.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck size={19} className="text-emerald-800" />
            Audit Trail & Kontrol Integritas Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log aktivitas seluruh perubahan data, validasi saldo, dan penelusuran rekam jejak pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRecalculateStock}
          disabled={isRebuilding}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCw size={15} className={isRebuilding ? 'animate-spin' : ''} />
          {isRebuilding ? 'Menghitung...' : 'Rekonsiliasi & Validasi Saldo'}
        </button>
      </div>

      {rebuildMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700" />
          {rebuildMsg}
        </div>
      )}

      {/* Audit Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari log audit berdasarkan tindakan, modul, petugas, atau rincian..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
        />
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Aksi / Tindakan</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((l) => (
                  <tr key={l.ID} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(l.TIMESTAMP).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {l.MODULE}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{l.ACTION}</td>
                    <td className="py-3 px-4 text-slate-600">{l.USER_NAME}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-md">{l.DETAILS}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada log audit tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
