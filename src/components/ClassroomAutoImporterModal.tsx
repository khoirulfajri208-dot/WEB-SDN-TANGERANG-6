import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Users, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { accountService } from '../services/accountService';
import { Account, AccountRole } from '../types/classroom';

interface ClassroomAutoImporterModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const ClassroomAutoImporterModal: React.FC<ClassroomAutoImporterModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        // Filter out empty rows
        const validData = data.filter(row => row.NAMA || row.Nama || row.nama);
        setPreviewData(validData);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membaca file. Pastikan format beruba .csv, .xls, atau .xlsx');
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    setIsImporting(true);

    try {
      let importedCount = 0;
      
      // Simulating a slight delay for UI feedback
      await new Promise(res => setTimeout(res, 800));

      previewData.forEach((row) => {
        const nama = row.NAMA || row.Nama || row.nama;
        const username = row.USERNAME || row.Username || row.username || nama.toLowerCase().replace(/\s+/g, '');
        const email = row.EMAIL || row.Email || row.email || `${username}@sekolah.id`;
        const rawRole = row.ROLE || row.Role || row.role;
        const role = rawRole ? String(rawRole).toUpperCase() : 'SISWA';
        const kelas = row.KELAS || row.Kelas || row.kelas || row.ROMBEL || row.Rombel || row.rombel || '';

        if (nama) {
          const accountData: Partial<Account> = {
            NAMA: String(nama),
            USERNAME: String(username),
            PASSWORD: row.PASSWORD || row.Password || row.password || 'siswa123',
            EMAIL: String(email),
            ROLE: (role as AccountRole) || 'SISWA',
            SISTEM: 'CLASSROOM',
            STATUS: 'AKTIF',
            KELAS: String(kelas),
          };
          accountService.saveAccount(accountData as Account);
          importedCount++;
        }
      });

      onSuccess(importedCount);
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data ke sistem.');
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { NAMA: 'Budi Santoso', USERNAME: 'budi', EMAIL: 'budi@sekolah.id', PASSWORD: 'siswa123', ROLE: 'SISWA', KELAS: 'Kelas 1A' },
      { NAMA: 'Siti Aminah', USERNAME: 'siti', EMAIL: 'siti@sekolah.id', PASSWORD: 'siswa123', ROLE: 'SISWA', KELAS: 'Kelas 2A' },
      { NAMA: 'Ahmad Guru', USERNAME: 'ahmad', EMAIL: 'ahmad@sekolah.id', PASSWORD: 'guru123', ROLE: 'GURU', KELAS: 'Kelas 1A' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Classroom.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database size={24} className="text-emerald-600" /> Classroom Auto-Importer
            </h3>
            <p className="text-xs text-slate-500 mt-1">Unggah file CSV/Excel untuk memetakan siswa & guru otomatis ke Rombel.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {!file ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 bg-slate-50">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Unggah File Data Classroom</h4>
              <p className="text-xs text-slate-500 text-center max-w-md mb-6">
                Sistem mendukung format <span className="font-bold text-slate-700">.csv, .xls, .xlsx</span>. Kolom yang dibaca: NAMA, USERNAME, EMAIL, PASSWORD, ROLE, KELAS (Rombel).
              </p>
              
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={18} /> Pilih File Excel / CSV
                </button>
                <button 
                  onClick={downloadTemplate}
                  className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-sm transition-all"
                >
                  Unduh Template
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
                    <p className="text-xs text-slate-500">{previewData.length} baris data ditemukan</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); setErrorMsg(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Ganti File
                </button>
              </div>

              {errorMsg ? (
                <div className="p-4 bg-rose-50 text-rose-700 text-sm font-bold rounded-2xl flex items-center gap-2 border border-rose-100">
                  <AlertTriangle size={18} /> {errorMsg}
                </div>
              ) : (
                <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-3 border-b border-slate-200">#</th>
                        <th className="p-3 border-b border-slate-200">NAMA</th>
                        <th className="p-3 border-b border-slate-200">ROLE</th>
                        <th className="p-3 border-b border-slate-200">ROMBEL / KELAS</th>
                        <th className="p-3 border-b border-slate-200">USERNAME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{row.NAMA || row.Nama || row.nama || '-'}</td>
                          <td className="p-3 text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                              {row.ROLE || row.Role || row.role || 'SISWA'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-blue-700">{row.KELAS || row.Kelas || row.kelas || row.ROMBEL || row.Rombel || row.rombel || 'Belum Ada'}</td>
                          <td className="p-3 text-slate-500">{row.USERNAME || row.Username || row.username || 'Auto-generated'}</td>
                        </tr>
                      ))}
                      {previewData.length > 100 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 font-medium italic">
                            ... dan {previewData.length - 100} baris lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || previewData.length === 0 || isImporting || !!errorMsg}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} /> Proses {previewData.length} Data
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
