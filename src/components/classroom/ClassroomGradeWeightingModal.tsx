import React, { useState, useEffect } from 'react';
import { Sliders, Check, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { GradeWeightConfig } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomGradeWeightingModalProps {
  kelas: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ClassroomGradeWeightingModal: React.FC<ClassroomGradeWeightingModalProps> = ({
  kelas,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [bobotTugas, setBobotTugas] = useState<number>(40);
  const [bobotKuis, setBobotKuis] = useState<number>(30);
  const [bobotPresensi, setBobotPresensi] = useState<number>(20);
  const [bobotPortofolio, setBobotPortofolio] = useState<number>(10);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const config = classroomService.getGradeWeightConfig(kelas);
      setBobotTugas(config.BOBOT_TUGAS);
      setBobotKuis(config.BOBOT_KUIS);
      setBobotPresensi(config.BOBOT_PRESENSI);
      setBobotPortofolio(config.BOBOT_PORTOFOLIO);
    }
  }, [isOpen, kelas]);

  if (!isOpen) return null;

  const totalBobot = bobotTugas + bobotKuis + bobotPresensi + bobotPortofolio;
  const isValid = totalBobot === 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const newConfig: GradeWeightConfig = {
      KELAS: kelas,
      MAPEL: 'Umum',
      BOBOT_TUGAS: bobotTugas,
      BOBOT_KUIS: bobotKuis,
      BOBOT_PRESENSI: bobotPresensi,
      BOBOT_PORTOFOLIO: bobotPortofolio,
      UPDATED_AT: new Date().toISOString(),
      UPDATED_BY: 'Guru Pengampu',
    };

    classroomService.saveGradeWeightConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    setBobotTugas(40);
    setBobotKuis(30);
    setBobotPresensi(20);
    setBobotPortofolio(10);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Pengaturan Bobot Penilaian</h3>
              <p className="text-xs text-slate-500">{kelas} • Konfigurasi E-Rapor Kustom</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
          {/* Bobot Tugas */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Bobot Tugas & Catatan Harian</span>
              <span className="text-blue-600">{bobotTugas}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bobotTugas}
              onChange={(e) => setBobotTugas(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* Bobot Kuis CBT */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Bobot Ulangan & Kuis CBT</span>
              <span className="text-purple-600">{bobotKuis}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bobotKuis}
              onChange={(e) => setBobotKuis(Number(e.target.value))}
              className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* Bobot Presensi */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Bobot Kehadiran / Presensi</span>
              <span className="text-emerald-600">{bobotPresensi}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bobotPresensi}
              onChange={(e) => setBobotPresensi(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* Bobot Portofolio */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Bobot Portofolio & Karya Digital</span>
              <span className="text-amber-600">{bobotPortofolio}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bobotPortofolio}
              onChange={(e) => setBobotPortofolio(Number(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* TOTAL INDICATOR */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isValid ? <Check size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
              <span>Total Persentase Bobot:</span>
            </div>
            <span className="text-sm font-black">{totalBobot}% / 100%</span>
          </div>

          {!isValid && (
            <p className="text-[11px] text-rose-600 font-bold">
              ⚠️ Total persentase bobot penilaian harus pas 100%. Silakan sesuaikan kembali slider di atas.
            </p>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 font-bold hover:bg-slate-100"
            >
              <RefreshCw size={14} />
              <span>Reset Standard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isValid || savedSuccess}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl font-extrabold text-white transition ${
                  isValid ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check size={16} /> Tersimpan!
                  </>
                ) : (
                  <>
                    <Save size={16} /> Simpan Bobot
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
