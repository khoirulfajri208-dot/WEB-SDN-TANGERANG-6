import React, { useState } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Award,
  Users,
  Brain,
  Layers,
  ListOrdered,
  BookCheck,
} from 'lucide-react';
import { ClassroomAssignment, Account } from '../../types/classroom';

export interface AIRemedialModulModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Account[];
  assignments?: ClassroomAssignment[];
}

export const AIRemedialModulModal: React.FC<AIRemedialModulModalProps> = ({
  isOpen,
  onClose,
  students = [],
  assignments = [],
}) => {
  const [activeTab, setActiveTab] = useState<'REMEDIAL' | 'MODUL_AJAR'>('REMEDIAL');

  // Remedial State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.ID || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('Matematika');
  const [targetScore, setTargetScore] = useState<number>(65);
  const [kkmScore, setKkmScore] = useState<number>(75);
  const [isGeneratingRemedial, setIsGeneratingRemedial] = useState<boolean>(false);
  const [remedialResult, setRemedialResult] = useState<any | null>(null);

  // Modul Ajar State
  const [mapel, setMapel] = useState<string>('IPAS');
  const [fase, setFase] = useState<string>('Fase B (Kelas 3-4)');
  const [topik, setTopik] = useState<string>('Siklus Air & Keanekaragaman Ekosistem Cisadane');
  const [alokasiWaktu, setAlokasiWaktu] = useState<string>('2 x 35 Menit');
  const [isGeneratingModul, setIsGeneratingModul] = useState<boolean>(false);
  const [modulResult, setModulResult] = useState<any | null>(null);

  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateRemedial = async () => {
    setIsGeneratingRemedial(true);
    setRemedialResult(null);

    const student = students.find((s) => s.ID === selectedStudentId);
    const studentName = student ? student.NAMA : 'Peserta Didik';

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Buatkan Program Remedial & Pengayaan Adaptif Kurikulum Merdeka untuk:
Nama Siswa: ${studentName}
Mata Pelajaran: ${selectedSubject}
Nilai Saat Ini: ${targetScore} (KKM Sekolah: ${kkmScore})

Berikan output JSON dengan struktur:
{
  "status_ketuntasan": "Belum Tuntas (Perlu Remedial)",
  "materi_kelemahan": "Analisis pemahaman konsep dasar...",
  "strategi_pendampingan": ["Gunakan alat peraga...", "Tutor sebaya..."],
  "soal_remedial": [
    {
      "nomor": 1,
      "pertanyaan": "Soal pemahaman tingkat dasar...",
      "pilihan": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "kunci": "A",
      "pembahasan": "Penjelasan rinci..."
    }
  ],
  "kegiatan_pengayaan": "Untuk siswa yang tuntas..."
}`,
        }),
      });

      const json = await res.json();
      if (json.reply) {
        let parsed = null;
        try {
          const match = json.reply.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }

        if (parsed) {
          setRemedialResult(parsed);
        } else {
          // Smart Fallback
          setRemedialResult({
            status_ketuntasan: targetScore < kkmScore ? 'Belum Tuntas (Di Bawah KKM)' : 'Tuntas (Siap Pengayaan)',
            materi_kelemahan: `Konsep dasar ${selectedSubject} dan pemecahan masalah bertahap.`,
            strategi_pendampingan: [
              'Penjelasan ulang dengan pendekatan visual / konkrit.',
              'Pemberian latihan bertahap dari level pemahaman ke penerapan.',
              'Sesi tanya jawab khusus 10 menit setelah jam pelajaran.',
            ],
            soal_remedial: [
              {
                nomor: 1,
                pertanyaan: `Soal Remedial 1 (${selectedSubject}): Manakah di bawah ini yang merupakan contoh penerapan konsep dasar dalam kehidupan sehari-hari?`,
                pilihan: ['A. Mengamati gejala alam', 'B. Membiarkan tanpa dicatat', 'C. Menghafal rumus', 'D. Mengabaikan aturan'],
                kunci: 'A',
                pembahasan: 'Mengamati gejala alam merangsang kemampuan bernalar kritis peserta didik.',
              },
              {
                nomor: 2,
                pertanyaan: `Soal Remedial 2 (${selectedSubject}): Apabila ditemukan hambatan saat menyelesaikan tugas, langkah pertama yang disarankan adalah?`,
                pilihan: ['A. Bertanya kepada guru / tutor sebaya', 'B. Menghentikan pekerjaan', 'C. Menyontek hasil teman', 'D. Pasrah'],
                kunci: 'A',
                pembahasan: 'Aktif bertanya adalah cermin Profil Pelajar Pancasila mandiri dan bernalar kritis.',
              },
            ],
            kegiatan_pengayaan: 'Pemberian tugas Higher Order Thinking Skills (HOTS) bertema lingkungan sekolah.',
          });
        }
      }
    } catch {
      // Offline / Error Fallback
      setRemedialResult({
        status_ketuntasan: targetScore < kkmScore ? 'Belum Tuntas (Di Bawah KKM)' : 'Tuntas (Siap Pengayaan)',
        materi_kelemahan: `Konsep dasar ${selectedSubject} dan pemecahan masalah bertahap.`,
        strategi_pendampingan: [
          'Penjelasan ulang dengan pendekatan visual / konkrit.',
          'Pemberian latihan bertahap dari level pemahaman ke penerapan.',
          'Sesi tanya jawab khusus 10 menit setelah jam pelajaran.',
        ],
        soal_remedial: [
          {
            nomor: 1,
            pertanyaan: `Soal Remedial 1 (${selectedSubject}): Manakah di bawah ini yang merupakan contoh penerapan konsep dasar?`,
            pilihan: ['A. Mengamati gejala alam', 'B. Membiarkan tanpa dicatat', 'C. Menghafal rumus', 'D. Mengabaikan aturan'],
            kunci: 'A',
            pembahasan: 'Mengamati gejala alam merangsang kemampuan bernalar kritis peserta didik.',
          },
        ],
        kegiatan_pengayaan: 'Pemberian tugas Higher Order Thinking Skills (HOTS) bertema lingkungan sekolah.',
      });
    } finally {
      setIsGeneratingRemedial(false);
    }
  };

  const handleGenerateModul = async () => {
    setIsGeneratingModul(true);
    setModulResult(null);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Buatkan Rencana Modul Ajar Kurikulum Merdeka SD lengkap dengan LKPD:
Mata Pelajaran: ${mapel}
Fase: ${fase}
Topik/Materi: ${topik}
Alokasi Waktu: ${alokasiWaktu}

Berikan output JSON:
{
  "identitas": { "mapel": "${mapel}", "fase": "${fase}", "topik": "${topik}", "alokasi": "${alokasiWaktu}" },
  "capaian_pembelajaran": "CP terkait...",
  "tujuan_pembelajaran": ["TP 1...", "TP 2..."],
  "profil_pelajar_pancasila": ["Bernalar Kritis", "Gotong Royong", "Mandiri"],
  "kegiatan_pembelajaran": {
    "pendahuluan": "Apersepsi, motivasi (10 menit)...",
    "inti": "Eksplorasi, diskusi kelompok, presentasi...",
    "penutup": "Refleksi, rangkuman, kuis singkat..."
  },
  "lkpd": {
    "judul": "LKPD Interaktif Siswa",
    "petunjuk": "Langkah pengerjaan...",
    "pertanyaan": ["Soal 1...", "Soal 2..."]
  },
  "rubrik_asesmen": [
    { "kriteria": "Pemahaman Konsep", "skor_4": "Sangat Memahami", "skor_3": "Memahami", "skor_2": "Cukup", "skor_1": "Perlu Bimbingan" }
  ]
}`,
        }),
      });

      const json = await res.json();
      let parsed = null;
      if (json.reply) {
        try {
          const match = json.reply.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }

      if (parsed) {
        setModulResult(parsed);
      } else {
        // Fallback
        setModulResult({
          identitas: { mapel, fase, topik, alokasi: alokasiWaktu },
          capaian_pembelajaran: `Peserta didik menganalisis dan memahami fenomena ${topik} serta dampaknya bagi lingkungan sekitar.`,
          tujuan_pembelajaran: [
            `Siswa dapat menjelaskan konsep ${topik} secara lisan maupun tertulis.`,
            `Siswa dapat bekerja sama dalam kelompok untuk menyelesaikan LKPD berbasis proyek.`,
          ],
          profil_pelajar_pancasila: ['Bernalar Kritis', 'Gotong Royong', 'Mandiri'],
          kegiatan_pembelajaran: {
            pendahuluan: 'Salam pembuka, doa bersama, menyanyikan lagu nasional, apersepsi pertanyaan pemantik (10 menit).',
            inti: 'Eksplorasi materi melalui media konkret / laboratorium, diskusi kelompok pembagian peran, dan presentasi hasil kerja.',
            penutup: 'Refleksi pembelajaran mandiri, kesimpulan bersama guru, dan pemberian apresiasi bintang keaktifan.',
          },
          lkpd: {
            judul: `LKPD Eksplorasi - ${topik}`,
            petunjuk: 'Bacalah petunjuk dengan teliti, diskusikan bersama teman sekelompokmu, dan tuliskan hasil pengamatanmu!',
            pertanyaan: [
              'Tuliskan 3 hal menarik yang kamu amati dari materi pembelajaran hari ini!',
              'Mengapa kerja sama tim penting dalam menyelesaikan masalah di lingkungan sekitar?',
            ],
          },
          rubrik_asesmen: [
            {
              kriteria: 'Kemampuan Bernalar Kritis',
              skor_4: 'Mampu menganalisis masalah secara rinci & mandiri',
              skor_3: 'Mampu menganalisis dengan sedikit bimbingan',
              skor_2: 'Cukup menganalisis namun terbatas',
              skor_1: 'Membutuhkan bimbingan intensif',
            },
          ],
        });
      }
    } catch {
      setModulResult({
        identitas: { mapel, fase, topik, alokasi: alokasiWaktu },
        capaian_pembelajaran: `Peserta didik menganalisis dan memahami fenomena ${topik}.`,
        tujuan_pembelajaran: [`Siswa dapat menjelaskan konsep ${topik}.`],
        profil_pelajar_pancasila: ['Bernalar Kritis', 'Gotong Royong'],
        kegiatan_pembelajaran: {
          pendahuluan: 'Apersepsi dan doa bersama (10 menit).',
          inti: 'Diskusi kelompok dan pengamatan media.',
          penutup: 'Refleksi dan kesimpulan.',
        },
        lkpd: {
          judul: `LKPD Eksplorasi - ${topik}`,
          petunjuk: 'Diskusikan bersama kelompokmu.',
          pertanyaan: ['Tuliskan hasil pengamatanmu!'],
        },
        rubrik_asesmen: [
          {
            kriteria: 'Pemahaman Konsep',
            skor_4: 'Sangat Memahami',
            skor_3: 'Memahami',
            skor_2: 'Cukup',
            skor_1: 'Perlu Bimbingan',
          },
        ],
      });
    } finally {
      setIsGeneratingModul(false);
    }
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-800/80 text-amber-300 ring-1 ring-blue-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                AI Remedial & Modul Ajar Kurikulum Merdeka
              </h3>
              <p className="text-[11px] text-blue-200/80">
                Generator Soal Adaptif, LKPD, & RPP Berbasis Capaian Pembelajaran SD
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('REMEDIAL')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'REMEDIAL'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain size={15} className={activeTab === 'REMEDIAL' ? 'text-blue-700' : ''} />
            <span>AI Remedial & Soal Adaptif</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MODUL_AJAR')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'MODUL_AJAR'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookCheck size={15} className={activeTab === 'MODUL_AJAR' ? 'text-indigo-700' : ''} />
            <span>Generator Modul Ajar & LKPD</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'REMEDIAL' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs text-blue-950 space-y-1">
                <strong className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Award size={14} className="text-blue-700" />
                  Sistem Remedial Pembelajaran Adaptif
                </strong>
                <p className="text-[11px] leading-relaxed text-blue-900/80">
                  Secara otomatis membuatkan analisis ketuntasan, rekomendasi pendampingan khusus, serta paket soal remedial adaptif sesuai kebutuhan belajar siswa.
                </p>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Pilih Siswa Target:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  >
                    {students.length > 0 ? (
                      students.map((s) => (
                        <option key={s.ID} value={s.ID}>
                          {s.NAMA} ({s.KELAS || 'Kelas SD'})
                        </option>
                      ))
                    ) : (
                      <option value="">Ahmad Fauzi (Siswa Sampel)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  >
                    <option value="Matematika">Matematika (Numerasi)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia (Literasi)</option>
                    <option value="IPAS">IPAS (Sains & Sosial)</option>
                    <option value="Pancasila">Pendidikan Pancasila</option>
                    <option value="Seni Budaya">Seni Budaya & Prakarya</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nilai Ujian / Kuis Siswa:
                  </label>
                  <input
                    type="number"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    KKM / KKTP Sekolah:
                  </label>
                  <input
                    type="number"
                    value={kkmScore}
                    onChange={(e) => setKkmScore(Number(e.target.value))}
                    min={50}
                    max={100}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateRemedial}
                disabled={isGeneratingRemedial}
                className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition cursor-pointer"
              >
                {isGeneratingRemedial ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Menyusun Program Remedial Adaptif AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-amber-300" />
                    <span>Hasilkan Program Remedial & Soal Adaptif</span>
                  </>
                )}
              </button>

              {/* Remedial Output Result */}
              {remedialResult && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FileText size={15} className="text-blue-700" /> Hasil Analisis & Remedial
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          targetScore < kkmScore
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {remedialResult.status_ketuntasan}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <strong className="text-slate-800 font-bold block mb-0.5">Materi Perlu Pembimbingan:</strong>
                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          {remedialResult.materi_kelemahan}
                        </p>
                      </div>

                      <div>
                        <strong className="text-slate-800 font-bold block mb-1">Rekomendasi Langkah Pendampingan Guru:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                          {remedialResult.strategi_pendampingan?.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Soal Remedial List */}
                      {remedialResult.soal_remedial && (
                        <div>
                          <strong className="text-slate-800 font-bold block mb-1.5">Paket Soal Remedial Adaptif:</strong>
                          <div className="space-y-2">
                            {remedialResult.soal_remedial.map((soal: any, idx: number) => (
                              <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1.5">
                                <p className="font-bold text-slate-800">
                                  {soal.nomor || idx + 1}. {soal.pertanyaan}
                                </p>
                                {soal.pilihan && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                                    {soal.pilihan.map((pil: string, pIdx: number) => (
                                      <span key={pIdx} className="text-[11px] text-slate-700">
                                        {pil}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                                  Kunci: {soal.kunci} • {soal.pembahasan}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleCopyText(JSON.stringify(remedialResult, null, 2))}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer size={13} /> Cetak
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MODUL_AJAR' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 text-xs text-indigo-950 space-y-1">
                <strong className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <BookOpen size={14} className="text-indigo-700" />
                  Generator Modul Ajar Kurikulum Merdeka (CP / TP / ATP)
                </strong>
                <p className="text-[11px] leading-relaxed text-indigo-900/80">
                  Menghasilkan RPP/Modul Ajar lengkap dengan Kegiatan Pembelajaran, Lembar Kerja Peserta Didik (LKPD), dan Rubrik Asesmen siap pakai.
                </p>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mata Pelajaran:
                  </label>
                  <input
                    type="text"
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    placeholder="Contoh: IPAS / Bahasa Indonesia"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Fase / Kelas:
                  </label>
                  <select
                    value={fase}
                    onChange={(e) => setFase(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  >
                    <option value="Fase A (Kelas 1-2 SD)">Fase A (Kelas 1-2 SD)</option>
                    <option value="Fase B (Kelas 3-4 SD)">Fase B (Kelas 3-4 SD)</option>
                    <option value="Fase C (Kelas 5-6 SD)">Fase C (Kelas 5-6 SD)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Topik / Materi Pembelajaran:
                  </label>
                  <input
                    type="text"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    placeholder="Contoh: Siklus Air & Keanekaragaman Ekosistem Cisadane"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Alokasi Waktu:
                  </label>
                  <input
                    type="text"
                    value={alokasiWaktu}
                    onChange={(e) => setAlokasiWaktu(e.target.value)}
                    placeholder="2 x 35 Menit"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateModul}
                disabled={isGeneratingModul}
                className="w-full py-3 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-700/20 transition cursor-pointer"
              >
                {isGeneratingModul ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Menyusun Modul Ajar AI Kurikulum Merdeka...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-amber-300" />
                    <span>Hasilkan Modul Ajar & LKPD LENGKAP</span>
                  </>
                )}
              </button>

              {/* Modul Result Output */}
              {modulResult && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-sm">
                        Modul Ajar: {modulResult.identitas?.mapel} - {modulResult.identitas?.topik}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {modulResult.identitas?.fase}
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-800 block font-bold mb-1">Capaian Pembelajaran (CP):</strong>
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {modulResult.capaian_pembelajaran}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-800 block font-bold mb-1">Tujuan Pembelajaran (TP):</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {modulResult.tujuan_pembelajaran?.map((tp: string, idx: number) => (
                          <li key={idx}>{tp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                      <strong className="text-indigo-950 font-bold block">Kegiatan Pembelajaran:</strong>
                      <div className="space-y-1 text-slate-700 text-[11px]">
                        <p><strong>• Pendahuluan:</strong> {modulResult.kegiatan_pembelajaran?.pendahuluan}</p>
                        <p><strong>• Inti:</strong> {modulResult.kegiatan_pembelajaran?.inti}</p>
                        <p><strong>• Penutup:</strong> {modulResult.kegiatan_pembelajaran?.penutup}</p>
                      </div>
                    </div>

                    {/* LKPD Preview */}
                    {modulResult.lkpd && (
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
                        <strong className="text-amber-950 font-bold block">{modulResult.lkpd.judul}</strong>
                        <p className="text-[11px] text-amber-900">{modulResult.lkpd.petunjuk}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {modulResult.lkpd.pertanyaan?.map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleCopyText(JSON.stringify(modulResult, null, 2))}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copied ? 'Tersalin' : 'Salin Text'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer size={13} /> Cetak Modul
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>SDN Tangerang 6 • AI Kurikulum Merdeka Assistant</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
