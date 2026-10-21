import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Award,
  TrendingDown,
  User,
  Heart,
  ShieldAlert,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  Compass,
  Zap,
} from 'lucide-react';
import { Account } from '../../types/classroom';

export interface EarlyWarningP5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Account[];
}

export const EarlyWarningP5Modal: React.FC<EarlyWarningP5ModalProps> = ({
  isOpen,
  onClose,
  students = [],
}) => {
  const [activeTab, setActiveTab] = useState<'EWS' | 'P5_RADAR'>('EWS');
  const [selectedStudent, setSelectedStudent] = useState<Account | null>(students[0] || null);
  const [actionDoneMsg, setActionDoneMsg] = useState<string>('');

  // 6 Dimensi P5 Scores (0-100)
  const [p5Scores, setP5Scores] = useState({
    beriman: 88,
    berkebinekaan: 85,
    gotongRoyong: 92,
    mandiri: 78,
    bernalarKritis: 84,
    kreatif: 90,
  });

  if (!isOpen) return null;

  const handleActionClick = (actionName: string) => {
    setActionDoneMsg(`Tindakan "${actionName}" telah dijadwalkan dan dicatat dalam Jurnal BK.`);
    setTimeout(() => setActionDoneMsg(''), 3000);
  };

  const atRiskStudents = [
    {
      id: 'st-risk-1',
      name: 'Rian Ardianto',
      kelas: 'Kelas 4B',
      nis: '20260408',
      reason: 'Penurunan nilai Matematika 20% & Tidak Hadir 3 Hari Tanpa Keterangan',
      riskLevel: 'TINGGI' as const,
      recommendation: 'Jadwalkan Konseling Guru BK & Panggilan Orang Tua ke Sekolah',
    },
    {
      id: 'st-risk-2',
      name: 'Budi Santoso',
      kelas: 'Kelas 3C',
      nis: '20260303',
      reason: '3 Tugas Literasi Belum Dikumpulkan & Terlambat Masuk 4 Kali',
      riskLevel: 'SEDANG' as const,
      recommendation: 'Berikan Pendampingan Modul Remedial Adaptif AI',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-800/80 text-purple-200 ring-1 ring-purple-400/30">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Analitik EWS (Early Warning System) & Peta Radar P5
              </h3>
              <p className="text-[11px] text-purple-200/80">
                Deteksi Dini Siswa Berrisiko Akademik & Pemetaan 6 Dimensi Profil Pelajar Pancasila
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

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('EWS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'EWS'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert size={14} /> Early Warning System (Siswa Berrisiko)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('P5_RADAR')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'P5_RADAR'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass size={14} /> Radar 6 Dimensi P5 Kurikulum Merdeka
            </button>
          </div>

          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">
            Deteksi Otomatis AI Algoritmik
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {actionDoneMsg && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl font-bold text-xs flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{actionDoneMsg}</span>
            </div>
          )}

          {activeTab === 'EWS' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                <h4 className="font-black text-xs text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-rose-600" /> 2 Siswa Memerlukan Intervensi & Pendampingan Dini
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Sistem menganalisis tren kehadiran, penurunan rerata kuis CBT, dan portofolio tugas harian.
                </p>
              </div>

              <div className="space-y-3">
                {atRiskStudents.map((st) => (
                  <div key={st.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h5 className="font-black text-sm text-slate-900">{st.name}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {st.kelas} • NIS: {st.nis}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black ${
                          st.riskLevel === 'TINGGI'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        Resiko {st.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Indikator Masalah:</span>
                      <p className="text-xs text-rose-700 font-semibold bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                        {st.reason}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Rekomendasi Tindakan:</span>
                      <p className="text-xs text-slate-800 font-medium">{st.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleActionClick(`Jadwal Konseling BK - ${st.name}`)}
                        className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs transition cursor-pointer"
                      >
                        Jadwalkan Konseling BK
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionClick(`Kirim WA Orang Tua - ${st.name}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Hubungi Orang Tua WA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* P5 Dimension Scores */}
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-purple-950 flex items-center gap-1.5">
                    <Award size={16} className="text-purple-700" /> Matriks 6 Dimensi Profil Pelajar Pancasila (P5)
                  </h4>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-200 px-2.5 py-0.5 rounded-md">
                    Target Capaian: ≥ 80 / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Beriman & Bertakwa</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.beriman}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Berkebinekaan Global</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.berkebinekaan}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Gotong Royong</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.gotongRoyong}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">4. Mandiri</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.mandiri}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">5. Bernalar Kritis</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.bernalarKritis}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">6. Kreatif</span>
                    <span className="text-base font-black text-purple-900 mt-0.5 block">{p5Scores.kreatif}%</span>
                  </div>
                </div>
              </div>

              {/* Visual Radar Representative Chart */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                <h5 className="font-black text-xs text-slate-900 uppercase">Visualisasi Radar Dimensi P5 Kelas 4B</h5>
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                  {/* SVG Hexagon Radar Grid */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <polygon points="50,25 72,37 72,63 50,75 28,63 28,37" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                    {/* Active Radar Fill */}
                    <polygon
                      points="50,15 80,32 82,68 50,82 20,66 22,34"
                      fill="rgba(147, 51, 234, 0.25)"
                      stroke="#9333ea"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500">
                  Capaian Profil Pelajar Pancasila Melampaui Rata-Rata Wilayah Kota Tangerang (86.5%).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium">Laporan EWS & P5 Siap Diunduh Dalam Format Rapor Kurikulum Merdeka</span>
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
