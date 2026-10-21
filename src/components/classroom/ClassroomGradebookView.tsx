import React, { useState, useEffect } from 'react';
import {
  Award, FileText, Printer, Download, Search, CheckCircle2, ChevronRight, User,
  Sparkles, School, GraduationCap, X, TrendingUp, BarChart2, BookOpen, Layers, Sliders,
  FolderArchive, RefreshCw
} from 'lucide-react';
import { ClassroomGradeWeightingModal } from './ClassroomGradeWeightingModal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { Account } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';
import { pdfService } from '../../services/pdfService';
import { SecureMaskedField } from '../common/SecureMaskedField';

interface ClassroomGradebookViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomGradebookView: React.FC<ClassroomGradebookViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1A');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRaporStudent, setPreviewRaporStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'CHART' | 'KEPSEK_COMPARISON' | 'HEATMAP' | 'AI_INSIGHTS'>('CHART');
  const [showWeightingModal, setShowWeightingModal] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportZipProgress, setExportZipProgress] = useState<{
    current: number;
    total: number;
    studentName: string;
    studentNis: string;
  } | null>(null);

  // AI Insights and Trends states
  const [selectedInsightStudentId, setSelectedInsightStudentId] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Remedial AI states
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [remedialStudent, setRemedialStudent] = useState('');
  const [remedialSubject, setRemedialSubject] = useState('Matematika');
  const [remedialTopic, setRemedialTopic] = useState('Bilangan & Operasi Hitung');
  const [remedialScore, setRemedialScore] = useState(65);
  const [generatedWorksheet, setGeneratedWorksheet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportClassReportsZip = async () => {
    const targetClass = isSiswa || isGuru ? account.KELAS || 'Kelas 1A' : selectedKelas;
    const students = accountService.getStudents(targetClass);
    if (students.length === 0) return;

    setIsExportingZip(true);
    try {
      const guruNama = isGuru ? account.NAMA : 'Nurul Hidayah, S.Pd.';
      const guruNip = isGuru ? (account.NIP || '19850412 201101 2 003') : '19850412 201101 2 003';

      const zipBlob = await pdfService.exportClassReportsToZip(
        students,
        targetClass,
        guruNama,
        guruNip,
        'Liestya Kusuma Sari, S.Pd., M.Pd.',
        '19740520 199803 2 004',
        (current, total, studentName, studentNis) => {
          setExportZipProgress({ current, total, studentName, studentNis });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E-Rapor_${targetClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
    } catch (err) {
      console.error('Gagal mengekspor E-Rapor ZIP:', err);
    } finally {
      setIsExportingZip(false);
      setExportZipProgress(null);
    }
  };

  const handleAnalyzeTrends = async (studentId: string, studentName: string, studentClass: string) => {
    setIsAnalyzing(true);
    setAiInsights(null);
    try {
      const report = classroomService.getStudentReportCard(studentId, studentName, studentClass);
      const timeline = classroomService.getStudentAcademicTimeline(studentId, studentName, studentClass);
      const submissions = classroomService.getSubmissions(undefined, studentId);

      const response = await fetch('/api/ai/analyze-student-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          kelas: studentClass,
          scores: {
            nilaiTugas: report.nilaiTugas,
            nilaiKuis: report.nilaiKuis,
            nilaiAkhir: report.nilaiAkhir,
            presensiPct: report.presensiPct,
            predikat: report.predikat,
          },
          submissions: submissions.map(s => ({
            id: s.ID,
            title: s.ASSIGNMENT_ID,
            content: s.ISI,
            score: s.NILAI,
            status: s.STATUS,
          })),
          timeline: timeline.map(t => ({
            stage: t.tahap,
            studentScore: t.nilaiSiswa,
            classAverage: t.rataRataKelas,
          })),
        })
      });

      if (!response.ok) throw new Error('Gagal menganalisis');
      const resData = await response.json();
      if (resData.success) {
        setAiInsights(resData.data);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRemedial = async (studentName: string, score: number, subject: string, topic: string) => {
    setRemedialStudent(studentName);
    setRemedialScore(score);
    setRemedialSubject(subject);
    setRemedialTopic(topic);
    setShowRemedialModal(true);
    setIsGenerating(true);
    setGeneratedWorksheet('');

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Buatlah Lembar Kegiatan Remedial format terstruktur Kurikulum Merdeka untuk siswa SD berikut:
Siswa: ${studentName} (Mata Pelajaran: ${subject}, Nilai saat ini: ${score}/100)
Mata Pelajaran/Topik: ${topic}
Nama Sekolah: SDN Tangerang 6

Tolong susun dalam format bahasa Indonesia resmi:
1. Penjelasan konsep kunci secara sangat ramah anak SD (1 paragraf pendek yang interaktif, gunakan analogi sehari-hari di Tangerang).
2. 3 soal latihan adaptif (dari yang mudah sekali ke sedang) bertema kontekstual kearifan lokal Tangerang / Banten (misal: Sungai Cisadane, Laksa Tangerang, Benteng Heritage, Masjid Pintu Seribu).
3. Hint (petunjuk bantuan) untuk membantu siswa menjawab setiap soal secara mandiri.`,
          assistantType: 'CLASSROOM_GURU',
          userRole: 'GURU',
          userName: account.NAMA
        })
      });

      if (!response.ok) throw new Error('Failed to generate');
      const data = await response.json();
      setGeneratedWorksheet(data.reply || data.message || '');
    } catch (err) {
      // High quality local fallback in case of connection limits or missing key
      setTimeout(() => {
        setGeneratedWorksheet(`### LEMBAR KEGIATAN REMEDIAL (KURIKULUM MERDEKA)
**SD NEGERI TANGERANG 6**
**Tahun Ajaran: 2026/2027**

* **Nama Siswa:** ${studentName}
* **Kelas:** ${account.KELAS || 'Kelas 1'}
* **Mata Pelajaran / Topik:** ${subject} - ${topic}
* **Target Ketuntasan Belajar (KKM):** 75 (Nilai Saat Ini: ${score})

---

#### 🌟 Bagian 1: Mari Memahami Konsep!
Hai ${studentName}! Yuk, kita ingat kembali konsep dasar tentang **${topic}**. Bayangkan kamu sedang berada di festival Sungai Cisadane di Tangerang. Kita punya banyak perahu naga berwarna-warni. Belajar konsep ini sama seperti kita menghitung jumlah perahu naga yang bersandar atau membagikan kue laksa hangat ke teman-teman sekelas. Konsep utama yang perlu kamu ingat adalah bahwa setiap bilangan memiliki nilai tempatnya masing-masing, dan kita selalu menyelesaikannya langkah-demi-langkah dengan sabar!

---

#### 📝 Bagian 2: Mari Berlatih (Soal Kontekstual Tangerang)

**Soal 1 (Tingkat Dasar - Penjumlahan Cisadane):**
Di tepi Sungai Cisadane, ada 12 perahu naga merah dan 15 perahu naga kuning yang sedang bersiap-siap untuk lomba Festival Cisadane Tangerang. Berapakah jumlah keseluruhan perahu naga di tepi sungai tersebut?
* **Pekerjaan Siswa:** ....................................................................................................
* **Jawaban Akhir:** ............................
* *💡 Hint (Petunjuk):* Gunakan penjumlahan bersusun pendek. Jumlahkan satuan terlebih dahulu (2 + 5), lalu jumlahkan puluhannya (1 + 1).

**Soal 2 (Tingkat Sedang - Pembagian Laksa):**
Ibu Guru membawa 24 mangkok Laksa Tangerang yang lezat untuk dibagikan secara adil kepada 4 kelompok siswa yang sedang belajar kelompok di kelas. Berapa mangkok laksa yang didapat oleh setiap kelompok siswa?
* **Pekerjaan Siswa:** ....................................................................................................
* **Jawaban Akhir:** ............................
* *💡 Hint (Petunjuk):* Pembagian adalah pengurangan berulang. Kurangi 24 dengan angka 4 secara berulang-ulang sampai hasilnya menjadi 0, lalu hitung berapa kali kamu melakukan pengurangan.

**Soal 3 (Tingkat Tantangan - Nilai Tempat Pasar Lama):**
Di pusat kuliner Pasar Lama Tangerang, paman menjual 345 tusuk sate obong dalam sehari. Pada bilangan "345", angka berapakah yang menempati nilai tempat **Ratusan**, **Puluhan**, dan **Satuan**?
* **Pekerjaan Siswa:** 
  * Ratusan: ............
  * Puluhan: ............
  * Satuan: ............
* *💡 Hint (Petunjuk):* Nilai tempat dimulai dari paling kanan (Satuan), tengah (Puluhan), dan paling kiri (Ratusan).

---

#### ✍️ Catatan Guru & Feedback:
* "Jangan patah semangat, ${studentName}! Kamu hanya butuh sedikit latihan lebih banyak. Ibu/Bapak Guru yakin kamu pasti bisa mencapai nilai tuntas pada evaluasi berikutnya!" *`);
      }, 800);
    } finally {
      setIsGenerating(false);
    }
  };

  // Target class students
  const students = accountService.getStudents(isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas);

  // Selected student for individual line chart
  const initialStudentId = isSiswa ? account.ID : (students[0]?.ID || '');
  const [selectedChartStudentId, setSelectedChartStudentId] = useState<string>(initialStudentId);

  // If student list changes and selected student is not in list, fallback
  const activeChartStudent = students.find((s) => s.ID === selectedChartStudentId) || students[0];

  // If student list changes and selected student is not in list, fallback for insights
  const activeInsightStudent = students.find((s) => s.ID === (selectedInsightStudentId || initialStudentId)) || students[0];

  const targetInsightStudentId = activeInsightStudent?.ID;
  const targetInsightStudentName = activeInsightStudent?.NAMA;
  const targetInsightStudentClass = activeInsightStudent?.KELAS || selectedKelas;

  useEffect(() => {
    if (activeTab === 'AI_INSIGHTS' && targetInsightStudentId) {
      handleAnalyzeTrends(targetInsightStudentId, targetInsightStudentName, targetInsightStudentClass);
    }
  }, [activeTab, targetInsightStudentId, targetInsightStudentClass]);

  // Generate grade cards for each student
  const studentReports = students.map((s) => {
    return classroomService.getStudentReportCard(s.ID, s.NAMA, s.KELAS || selectedKelas);
  });

  const filteredReports = studentReports.filter((r) => {
    if (isSiswa && r.siswaId !== account.ID) return false;
    if (searchQuery && !r.siswaNama.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Data for Recharts Line Chart (Student Timeline)
  const timelineData = activeChartStudent
    ? classroomService.getStudentAcademicTimeline(
        activeChartStudent.ID,
        activeChartStudent.NAMA,
        activeChartStudent.KELAS || selectedKelas
      )
    : [];

  // Data for Kepala Sekolah School-wide Comparison Chart
  const classComparisonData = classroomService.getClassComparisonTrends();

  // Export Rekap Nilai to CSV
  const handleDownloadGradebookCSV = () => {
    const targetClass = isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const csvRows: string[] = [];
    csvRows.push(`REKAPITULASI NILAI HASIL BELAJAR PESERTA DIDIK - SDN TANGERANG 6`);
    csvRows.push(`Tahun Ajaran;2026/2027 (Semester Ganjil)`);
    csvRows.push(`Kelas / Rombongan Belajar;${targetClass}`);
    csvRows.push(`Guru Pengampu / Wali Kelas;${isGuru ? account.NAMA : 'Wali Kelas ' + targetClass}`);
    csvRows.push(`Tanggal Cetak / Ekspor;${dateStr}`);
    csvRows.push(``);
    csvRows.push(
      `No;NIS / NISN;Nama Siswa;Kelas;Rata-rata Tugas (40%);Rata-rata Kuis CBT (40%);Kehadiran (20%);Nilai Akhir (NA);Predikat;Status Ketuntasan;Capaian Pembelajaran & Catatan Guru`
    );

    filteredReports.forEach((r, idx) => {
      const studentAcc = students.find((s) => s.ID === r.siswaId);
      const nis = studentAcc?.NIP || `20260${idx + 1}`;
      const ketuntasan = r.nilaiAkhir >= 75 ? 'TUNTAS' : 'BELUM TUNTAS';
      const catatan =
        r.predikat === 'A'
          ? 'Sangat menguasai seluruh materi kompetensi dasar dan tugas mandiri'
          : r.predikat === 'B'
          ? 'Menguasai materi dengan baik dan aktif berpartisipasi'
          : r.predikat === 'C'
          ? 'Cukup menguasai materi, perlu penguatan pada latihan berhitung'
          : 'Perlu bimbingan remedial dan pendampingan orang tua';

      csvRows.push(
        `${idx + 1};"${nis}";"${r.siswaNama}";"${r.kelas}";${r.nilaiTugas};${r.nilaiKuis};${r.presensiPct}%;${r.nilaiAkhir};"${r.predikat}";"${ketuntasan}";"${catatan}"`
      );
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Rekap_Nilai_SDN_Tangerang_6_${targetClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Buku Nilai & Visualisasi Akademik</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grafik tren nilai (Recharts), kompilasi tugas & kuis CBT, unduh rekap nilai CSV, serta cetak E-Rapor Kurikulum Merdeka
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('CHART')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'CHART' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={14} className="text-emerald-600" />
              <span>Grafik Tren Nilai</span>
            </button>

            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} className="text-blue-600" />
              <span>Tabel Buku Nilai</span>
            </button>

            <button
              onClick={() => setActiveTab('HEATMAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'HEATMAP' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={14} className="text-purple-600" />
              <span>Heatmap Performa</span>
            </button>

            <button
              onClick={() => setActiveTab('AI_INSIGHTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'AI_INSIGHTS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>Analisis & Remedial AI</span>
            </button>

            {isKepsek && (
              <button
                onClick={() => setActiveTab('KEPSEK_COMPARISON')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'KEPSEK_COMPARISON'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-purple-700'
                }`}
              >
                <Layers size={14} />
                <span>Analisis Semua Kelas</span>
              </button>
            )}
          </div>

          {!isSiswa && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const targetClass = isSiswa || isGuru ? account.KELAS || 'Kelas 4' : selectedKelas;
                  const allAssignments = classroomService.getAssignments();
                  const allCourses = classroomService.getCourses();
                  const allSubmissions = classroomService.getSubmissions();
                  pdfService.generateBulkAssignmentsReportPdf(
                    allAssignments,
                    allCourses,
                    allSubmissions,
                    targetClass,
                    account.NAMA,
                    account.NIP
                  );
                }}
                title="Cetak dan unduh ringkasan daftar tugas siswa secara massal yang perlu dinilai dalam 1 dokumen PDF"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Printer size={14} className="text-emerald-200" />
                <span>Cetak Rekap Tugas Massal (PDF)</span>
              </button>

              <button
                onClick={handleExportClassReportsZip}
                disabled={isExportingZip}
                title="Ekspor seluruh E-Rapor PDF siswa kelas ini ke dalam satu file ZIP dengan penamaan otomatis berdasarkan NIS"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isExportingZip ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <FolderArchive size={14} />
                )}
                <span>
                  {isExportingZip
                    ? `Mengekspor ZIP (${exportZipProgress?.current || 0}/${exportZipProgress?.total || 0})...`
                    : 'Ekspor E-Rapor Kelas (ZIP)'}
                </span>
              </button>

              <button
                onClick={() =>
                  pdfService.generateClassGradebookSummaryPdf(
                    filteredReports,
                    isSiswa || isGuru ? account.KELAS || 'Kelas 1A' : selectedKelas,
                    account.NAMA
                  )
                }
                title="Cetak PDF Rekapitulasi Nilai Kelas Rapi untuk Laporan Wali Murid"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak PDF Rekap Kelas</span>
              </button>

              <button
                onClick={handleDownloadGradebookCSV}
                title="Unduh Rekap Nilai dalam format tabel CSV untuk administrasi sekolah"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                <span>Unduh CSV</span>
              </button>

              <button
                onClick={() => setShowWeightingModal(true)}
                title="Atur bobot kustom persentase Tugas, Kuis, Presensi, dan Portofolio"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Sliders size={14} />
                <span>Atur Bobot Penilaian</span>
              </button>
            </div>
          )}

          {isSiswa && filteredReports.length > 0 && (
            <button
              onClick={() => setPreviewRaporStudent(filteredReports[0])}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Printer size={15} /> Cetak E-Rapor Saya
            </button>
          )}
        </div>
      </div>

      {/* Filter & Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {!account.KELAS && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  const classStuds = accountService.getStudents(e.target.value);
                  if (classStuds.length > 0) setSelectedChartStudentId(classStuds[0].ID);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              >
                {accountService.getAvailableClasses().map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'CHART' && !isSiswa && students.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Siswa:</span>
              <select
                value={selectedChartStudentId || students[0]?.ID}
                onChange={(e) => setSelectedChartStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.ID} value={s.ID}>
                    {s.NAMA} ({s.NIP || 'NIS'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'AI_INSIGHTS' && !isSiswa && students.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Siswa:</span>
              <select
                value={selectedInsightStudentId || students[0]?.ID}
                onChange={(e) => setSelectedInsightStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              >
                {students.map((s) => (
                  <option key={s.ID} value={s.ID}>
                    {s.NAMA} ({s.NIP || 'NIS'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeTab === 'TABLE' && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VISUALISASI RECHARTS: GRAFIK TREN PERKEMBANGAN AKADEMIK SISWA */}
      {/* ========================================================================= */}
      {activeTab === 'CHART' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <TrendingUp size={18} />
                  </span>
                  <h3 className="text-base font-black text-slate-800">
                    Grafik Tren Perkembangan Nilai:{' '}
                    <span className="text-blue-700">{activeChartStudent?.NAMA || 'Siswa'}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau fluktuasi capaian belajar siswa terhadap Kriteria Ketuntasan Minimal (KKM 75) dan rata-rata kelas dari waktu ke waktu
                </p>
              </div>

              {/* Badges / Stats on Chart Header */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Nilai Rata-rata</span>
                  <span className="text-base font-black text-emerald-800">
                    {Math.round(timelineData.reduce((acc, d) => acc + d.nilaiSiswa, 0) / (timelineData.length || 1))}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="block text-[10px] text-rose-600 font-bold uppercase">Standar KKM</span>
                  <span className="text-base font-black text-rose-800">75</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="tahap"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                    formatter={(value: any, name: any) => [
                      `${value} Poin`,
                      name === 'nilaiSiswa' ? `Nilai ${activeChartStudent?.NAMA}` : 'Rata-rata Kelas',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 700 }}
                  />
                  {/* KKM Baseline */}
                  <ReferenceLine
                    y={75}
                    label={{ value: 'KKM: 75', fill: '#e11d48', fontSize: 11, fontWeight: 'bold', position: 'insideTopRight' }}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                  />
                  {/* Student Line */}
                  <Line
                    type="monotone"
                    dataKey="nilaiSiswa"
                    name={`Nilai ${activeChartStudent?.NAMA || 'Siswa'}`}
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
                  />
                  {/* Class Average Line */}
                  <Line
                    type="monotone"
                    dataKey="rataRataKelas"
                    name="Rata-rata Kelas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1, stroke: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insight & Progress Description */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Analisis Tren Pembelajaran</span>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Siswa <strong>{activeChartStudent?.NAMA}</strong> menunjukkan tren peningkatan konsisten di atas batas KKM (75).
                  Performa tertinggi dicapai pada asesmen <em>Kuis CBT 2</em> dan <em>Praktik LKPD</em>. Siap untuk pengayaan materi tingkat lanjut.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KEPALA SEKOLAH: KOMPARASI ANTAR KELAS (KELAS 1 - 6) */}
      {/* ========================================================================= */}
      {activeTab === 'KEPSEK_COMPARISON' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <BarChart2 size={18} />
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Komparasi Nilai Akademik & Keaktifan Antar Kelas (Kelas 1 s/d Kelas 6)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ikhtisar perbandingan nilai rata-rata tugas, kuis online, dan persentase kehadiran untuk evaluasi kurikulum tingkat sekolah
              </p>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="kelas" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '14px', fontSize: '12px' }} />
                  <ReferenceLine y={75} stroke="#e11d48" strokeDasharray="3 3" label="KKM 75" />
                  <Bar dataKey="rataRataTugas" name="Rata-rata Tugas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="rataRataKuis" name="Rata-rata Kuis CBT" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="nilaiAkhirKelas" name="Nilai Akhir Rapor" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TABEL BUKU NILAI LENGKAP & CETAK E-RAPOR */}
      {/* ========================================================================= */}
      {activeTab === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4 text-center">Rata-rata Tugas (40%)</th>
                  <th className="p-4 text-center">Kuis & Ujian (40%)</th>
                  <th className="p-4 text-center">Kehadiran (20%)</th>
                  <th className="p-4 text-center">Nilai Akhir (NA)</th>
                  <th className="p-4 text-center">Predikat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada catatan nilai siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report, idx) => (
                    <tr key={report.siswaId} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                            {report.siswaNama.charAt(0)}
                          </div>
                          <span>{report.siswaNama}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{report.kelas}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {report.nilaiTugas} <span className="text-[10px] text-slate-400">({report.tugasCount} tugas)</span>
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {report.nilaiKuis} <span className="text-[10px] text-slate-400">({report.kuisCount} kuis)</span>
                      </td>
                      <td className="p-4 text-center font-semibold text-emerald-600">
                        {report.presensiPct}%
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {report.nilaiAkhir}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                            report.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : report.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {report.predikat}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedChartStudentId(report.siswaId);
                              setActiveTab('CHART');
                            }}
                            title="Lihat Grafik Tren Nilai"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <TrendingUp size={14} />
                          </button>

                          <button
                            onClick={() => pdfService.generateStudentProgressReportPdf(report, account.NAMA)}
                            title="Unduh PDF Laporan Progres Belajar Siswa untuk Wali Murid"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 transition cursor-pointer"
                          >
                            <FileText size={12} /> PDF Wali Murid
                          </button>

                          <button
                            onClick={() => setPreviewRaporStudent(report)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition cursor-pointer"
                          >
                            <Printer size={12} /> E-Rapor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 LEARNING PERFORMANCE HEATMAP TAB */}
      {/* ========================================================================= */}
      {activeTab === 'HEATMAP' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                    <Layers size={18} />
                  </span>
                  Heatmap Performa Pembelajaran (Learning Performance Heatmap)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Peta visual pemetaan kompetensi & ketuntasan belajar per topik Kurikulum Merdeka. Membantu identifikasi dini siswa yang membutuhkan bimbingan khusus (remedial).
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span className="text-slate-500">LEGENDA:</span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-300 block" />
                  Struggling / Remedial (&lt;70)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500/10 border border-amber-300 block" />
                  Needs Attention (70-74)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-blue-500/10 border border-blue-300 block" />
                  Satisfactory (75-84)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-300 block" />
                  Excellent (&ge;85)
                </span>
              </div>
            </div>

            {/* Matrix View */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 font-bold text-slate-600 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-48">Nama Siswa</th>
                    {[
                      { ID: 'T1', NAME: 'Operasi Bilangan', MAPEL: 'Matematika' },
                      { ID: 'T2', NAME: 'Aljabar & Pola', MAPEL: 'Matematika' },
                      { ID: 'T3', NAME: 'Membaca Komp.', MAPEL: 'B. Indo' },
                      { ID: 'T4', NAME: 'Menulis Kreatif', MAPEL: 'B. Indo' },
                      { ID: 'T5', NAME: 'Pancaindra', MAPEL: 'IPAS' },
                      { ID: 'T6', NAME: 'Siklus Hidup', MAPEL: 'IPAS' },
                      { ID: 'T7', NAME: 'Gotong Royong', MAPEL: 'Pancasila' },
                      { ID: 'T8', NAME: 'Kebugaran Jasmani', MAPEL: 'PJOK' },
                      { ID: 'T9', NAME: 'Seni & Kriya', MAPEL: 'Seni Budaya' }
                    ].map((topic) => (
                      <th key={topic.ID} className="p-3 text-center font-bold text-slate-600 min-w-[110px]">
                        <span className="block text-[10px] text-purple-600 uppercase tracking-wider">{topic.MAPEL}</span>
                        <span className="block mt-0.5 text-slate-700">{topic.NAME}</span>
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold text-slate-600 bg-slate-50/85">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa ditemukan untuk kelas ini.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      // Generate and average topic scores
                      let total = 0;
                      const topicScores = [
                        { ID: 'T1', NAME: 'Bilangan & Operasi Hitung', MAPEL: 'Matematika' },
                        { ID: 'T2', NAME: 'Aljabar & Pola Gambar', MAPEL: 'Matematika' },
                        { ID: 'T3', NAME: 'Membaca Komprehensif', MAPEL: 'Bahasa Indonesia' },
                        { ID: 'T4', NAME: 'Menulis Kreatif & Kosakata', MAPEL: 'Bahasa Indonesia' },
                        { ID: 'T5', NAME: 'Pancaindra & Ekosistem', MAPEL: 'IPAS' },
                        { ID: 'T6', NAME: 'Siklus Hidup & Energi', MAPEL: 'IPAS' },
                        { ID: 'T7', NAME: 'Pancasila & Gotong Royong', MAPEL: 'Pancasila' },
                        { ID: 'T8', NAME: 'Kebugaran Jasmani', MAPEL: 'PJOK' },
                        { ID: 'T9', NAME: 'Seni Rupa & Kriya', MAPEL: 'Seni Budaya' }
                      ].map((topic, topicIdx) => {
                        // Seed based on studentId and topic index
                        const hash = report.siswaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (topicIdx * 17);
                        const variance = (hash % 21) - 12; // ranges from -12 to +8
                        let score = Math.round(report.nilaiAkhir + variance);
                        score = Math.min(99, Math.max(45, score));
                        total += score;
                        return { ...topic, SCORE: score };
                      });

                      const avg = Math.round(total / topicScores.length);

                      return (
                        <tr key={report.siswaId} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-800 border-r border-slate-150 sticky left-0 bg-white hover:bg-slate-50 z-10">
                            {report.siswaNama}
                          </td>
                          {topicScores.map((ts) => {
                            let cellBg = '';
                            if (ts.SCORE >= 85) {
                              cellBg = 'bg-emerald-500/10 text-emerald-800 border border-emerald-200/50 hover:bg-emerald-500/20';
                            } else if (ts.SCORE >= 75) {
                              cellBg = 'bg-blue-500/10 text-blue-800 border border-blue-200/50 hover:bg-blue-500/20';
                            } else if (ts.SCORE >= 70) {
                              cellBg = 'bg-amber-500/10 text-amber-800 border border-amber-200/50 hover:bg-amber-500/20';
                            } else {
                              cellBg = 'bg-rose-500/10 text-rose-800 border border-rose-200/50 hover:bg-rose-500/20';
                            }

                            return (
                              <td key={ts.ID} className="p-2 text-center">
                                <div
                                  title={`${report.siswaNama} • ${ts.NAME}: ${ts.SCORE} (${ts.SCORE >= 75 ? 'Tuntas' : 'Perlu Bimbingan'})`}
                                  className={`py-2 px-1 rounded-lg font-black text-xs transition cursor-help ${cellBg}`}
                                >
                                  {ts.SCORE}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-2 text-center bg-slate-50/85">
                            <span className="font-extrabold text-slate-850 bg-slate-150 px-2.5 py-1 rounded-md">
                              {avg}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI recommendations & insights based on heat score analysis */}
          {filteredReports.length > 0 && (() => {
            // Aggregate averages for each topic
            const topics = [
              { ID: 'T1', NAME: 'Bilangan & Operasi Hitung', MAPEL: 'Matematika' },
              { ID: 'T2', NAME: 'Aljabar & Pola Gambar', MAPEL: 'Matematika' },
              { ID: 'T3', NAME: 'Membaca Komprehensif', MAPEL: 'Bahasa Indonesia' },
              { ID: 'T4', NAME: 'Menulis Kreatif & Kosakata', MAPEL: 'Bahasa Indonesia' },
              { ID: 'T5', NAME: 'Pancaindra & Ekosistem', MAPEL: 'IPAS' },
              { ID: 'T6', NAME: 'Siklus Hidup & Energi', MAPEL: 'IPAS' },
              { ID: 'T7', NAME: 'Pancasila & Gotong Royong', MAPEL: 'Pancasila' },
              { ID: 'T8', NAME: 'Kebugaran Jasmani', MAPEL: 'PJOK' },
              { ID: 'T9', NAME: 'Seni Rupa & Kriya', MAPEL: 'Seni Budaya' }
            ];

            const averages = topics.map((topic, topicIdx) => {
              let sum = 0;
              let count = 0;
              const strugglingSiswa: string[] = [];

              filteredReports.forEach((report) => {
                const hash = report.siswaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (topicIdx * 17);
                const variance = (hash % 21) - 12;
                let score = Math.round(report.nilaiAkhir + variance);
                score = Math.min(99, Math.max(45, score));
                sum += score;
                count++;
                if (score < 75) {
                  strugglingSiswa.push(report.siswaNama);
                }
              });

              return {
                ...topic,
                AVG: Math.round(sum / (count || 1)),
                struggling: strugglingSiswa
              };
            });

            // Find lowest average topic & highest average topic
            const sorted = [...averages].sort((a, b) => a.AVG - b.AVG);
            const lowestTopic = sorted[0];
            const highestTopic = sorted[sorted.length - 1];

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Struggling Topic Card */}
                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                      <X size={16} />
                    </span>
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Area Perlu Bimbingan Kelas</h4>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{lowestTopic.NAME} ({lowestTopic.MAPEL})</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rata-rata kompetensi kelas terendah: <strong className="text-rose-700">{lowestTopic.AVG}/100</strong></p>
                  </div>
                  {lowestTopic.struggling.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-rose-800 block">Siswa Butuh Intervensi Remedial ({lowestTopic.struggling.length} Siswa):</span>
                      <div className="flex flex-wrap gap-1">
                        {lowestTopic.struggling.map((name) => (
                          <span key={name} className="px-2 py-0.5 bg-white border border-rose-200 text-[10px] rounded-md font-bold text-slate-700">{name}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-700 font-bold">Hebat! Seluruh siswa telah mencapai standar KKM untuk topik ini.</p>
                  )}
                  <div className="bg-white p-3 rounded-xl border border-rose-100/80 text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Saran Tindak Lanjut Kurikulum Merdeka:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Gunakan objek konkrit/alat peraga visual.</li>
                      <li>Adakan bimbingan khusus kelompok kecil setelah pulang sekolah.</li>
                      <li>Berikan LKPD adaptif tingkat kesulitan bertingkat.</li>
                    </ul>
                  </div>
                </div>

                {/* Successful Topic Card */}
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <CheckCircle2 size={16} />
                    </span>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Area Keberhasilan Kelas</h4>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{highestTopic.NAME} ({highestTopic.MAPEL})</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rata-rata kompetensi kelas tertinggi: <strong className="text-emerald-700">{highestTopic.AVG}/100</strong></p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100/80 text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Saran Pengayaan & Tutor Sebaya:</strong>
                    <p className="mt-1">
                      Siswa yang menguasai materi ini dengan nilai &ge;85 dapat ditugaskan menjadi <strong>Tutor Sebaya</strong> untuk mendampingi rekan-rekannya yang masih berada di bawah KKM pada mata pelajaran ini saat jam belajar mandiri terstruktur.
                    </p>
                  </div>
                </div>

                {/* Personalized Tutoring / AI Optimization */}
                <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-200/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg animate-pulse">
                        <Sparkles size={16} />
                      </span>
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">Rekomendasi AI Untuk Kelompok Mentoring</h4>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
                      <p>
                        Berdasarkan pemetaan otomatis heatmap di atas, sistem mendeteksi kesenjangan kompetensi numerasi dasar kelas Anda.
                      </p>
                      <p className="font-bold text-purple-900 bg-white p-2 rounded-lg border border-purple-100">
                        Rekomendasi Utama: Pasangkan siswa berprestasi di {highestTopic.MAPEL} dengan siswa yang kesulitan di {lowestTopic.MAPEL} untuk sesi tutor sebaya yang optimal.
                      </p>
                    </div>
                  </div>
                  
                  {/* Action to launch AI Remedial Generator */}
                  <div className="pt-2 border-t border-purple-200">
                    <button
                      onClick={() => {
                        // Find a candidate student whose score is low (< 75)
                        const lowScoreStudent = filteredReports.find(r => r.nilaiAkhir < 75) || filteredReports[0];
                        if (lowScoreStudent) {
                          handleGenerateRemedial(
                            lowScoreStudent.siswaNama,
                            lowScoreStudent.nilaiAkhir,
                            lowestTopic.MAPEL,
                            lowestTopic.NAME
                          );
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-amber-300" />
                      <span>Buat Lembar Remedial Siswa (Kurikulum Merdeka AI)</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 italic text-right">
                    SDN Tangerang 6 • Kurikulum Merdeka AI Engine
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DASHBOARD ANALISIS TREN AKADEMIK & REKOMENDASI REMEDIAL AI */}
      {/* ========================================================================= */}
      {activeTab === 'AI_INSIGHTS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Dashboard Rekomendasi Remedial & Analisis Tren Akademik AI
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Menganalisis riwayat tugas, nilai kuis harian, dan presensi untuk menyusun modul belajar mandiri yang dipersonalisasi.
                  </p>
                </div>
              </div>

              {!isSiswa && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-bold">Menganalisis Siswa:</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-lg">
                    {activeInsightStudent?.NAMA || 'Silakan pilih siswa'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isAnalyzing ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-black text-slate-800">Gemini AI sedang menganalisis berkas dan tren nilai...</h4>
                <p className="text-xs text-slate-500 mt-1">Memetakan kekuatan kognitif dan menyusun draf program bimbingan adaptif.</p>
              </div>
            </div>
          ) : aiInsights ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: General Trend & Summary */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <TrendingUp size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-800">Analisis Tren Perkembangan Belajar</h3>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p className="whitespace-pre-line">{aiInsights.analysis_tren}</p>
                  </div>
                </div>

                {/* Strengths & Weaknesses (Flat typography based layout instead of nesting cards) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award size={18} className="text-blue-600" />
                    <h3 className="text-sm font-black text-slate-800">Profil Capaian Kompetensi</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Strengths */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Kekuatan Akademik Siswa
                      </h4>
                      <ul className="space-y-2">
                        {aiInsights.kekuatan?.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for growth */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Area yang Perlu Bimbingan
                      </h4>
                      <ul className="space-y-2">
                        {aiInsights.kelemahan?.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                            <span className="text-rose-500 font-bold mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Remedial & Guidance Action Plan */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-amber-50/20 rounded-2xl p-6 border border-amber-200/50 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                    <Sparkles size={18} className="text-amber-700" />
                    <h3 className="text-sm font-black text-slate-800">Rekomendasi Program Remedial</h3>
                  </div>

                  {/* Materi Fokus */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Topik Materi Prioritas:</span>
                    <div className="p-3 bg-white border border-amber-100 rounded-xl">
                      <p className="text-xs font-extrabold text-amber-900">{aiInsights.rekomendasi_remedial?.materi_fokus}</p>
                    </div>
                  </div>

                  {/* Langkah Bimbingan */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Langkah Intervensi Berkelanjutan:</span>
                    <ol className="space-y-3">
                      {aiInsights.rekomendasi_remedial?.langkah_bimbingan?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-600 flex gap-2.5 leading-relaxed">
                          <span className="w-5 h-5 shrink-0 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Lembar Kerja Adaptif */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lembar Kerja yang Diusulkan:</span>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      {aiInsights.rekomendasi_remedial?.lembar_kerja_rekomendasi}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-amber-100 space-y-2">
                    <button
                      onClick={() => {
                        handleGenerateRemedial(
                          activeInsightStudent.NAMA,
                          Math.round(classroomService.getStudentReportCard(activeInsightStudent.ID, activeInsightStudent.NAMA, activeInsightStudent.KELAS || selectedKelas).nilaiAkhir),
                          'Pelajaran Terpadu',
                          aiInsights.rekomendasi_remedial?.materi_fokus || 'Matematika & Literasi Terpadu'
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-amber-100 animate-pulse" />
                      <span>Buat Lembar Kerja Remedial Interaktif</span>
                    </button>
                    
                    <p className="text-[10px] text-slate-400 italic text-center leading-normal">
                      Direkomendasikan secara berkala berdasarkan dinamika Kurikulum Merdeka di SDN Tangerang 6.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center space-y-4">
              <Sparkles size={36} className="text-slate-300" />
              <div className="text-center">
                <h4 className="text-sm font-black text-slate-800">Tidak ada data analisis</h4>
                <p className="text-xs text-slate-500 mt-1">Silakan coba segarkan kembali atau pilih siswa yang berbeda.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK & PRATINJAU E-RAPOR RESMI KURIKULUM MERDEKA */}
      {/* ========================================================================= */}
      {previewRaporStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau E-Rapor Siswa Kurikulum Merdeka</h3>
                  <p className="text-[10px] text-slate-400">SDN Tangerang 6 • Tahun Ajaran 2026/2027</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => pdfService.generateStudentProgressReportPdf(previewRaporStudent, account.NAMA)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={13} /> Unduh PDF Wali Murid
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer size={13} /> Cetak E-Rapor
                </button>
                <button
                  onClick={() => setPreviewRaporStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-800 space-y-6 print:p-0">
              {/* Header Surat Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base font-black tracking-wider uppercase">PEMERINTAH KOTA TANGERANG</h2>
                <h3 className="text-sm font-black tracking-wide uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                <h1 className="text-lg font-black text-slate-900">SD NEGERI TANGERANG 6</h1>
                <p className="text-[10px] text-slate-500 font-serif">
                  Jl. Nyimas Melati No. 25, RT.002/RW.001, Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118
                </p>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase underline tracking-wider">
                  LAPORAN HASIL BELAJAR PESERTA DIDIK (E-RAPOR)
                </h4>
                <p className="text-xs text-slate-600 font-medium">Tahun Ajaran 2026/2027 - Semester Ganjil</p>
              </div>

              {/* Student Bio Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Nama Peserta Didik</span>
                    <span className="font-bold text-slate-900">: {previewRaporStudent.siswaNama}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-slate-500 font-medium shrink-0">NISN / Nomor Induk:</span>
                    <SecureMaskedField
                      value={previewRaporStudent.siswaId}
                      type="nis"
                      fieldId={`rapor-nis-${previewRaporStudent.siswaId}`}
                      label="NISN Siswa"
                      monospace
                      showDlpBadge
                    />
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Sekolah</span>
                    <span className="text-slate-700">: SDN Tangerang 6</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Kelas / Rombel</span>
                    <span className="font-bold text-slate-900">: {previewRaporStudent.kelas}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Fase Kurikulum</span>
                    <span className="text-slate-700">: Fase A / B (Kurikulum Merdeka)</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Tahun Pelajaran</span>
                    <span className="text-slate-700">: 2026/2027</span>
                  </div>
                </div>
              </div>

              {/* Capaian Pembelajaran Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Mata Pelajaran & Capaian Belajar</th>
                      <th className="p-3 text-center w-24">Nilai Akhir</th>
                      <th className="p-3 text-center w-24">Capaian</th>
                      <th className="p-3">Deskripsi Capaian Kompetensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 text-center font-bold">1</td>
                      <td className="p-3 font-bold text-slate-900">Pendidikan Pancasila & Kewarganegaraan</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiAkhir}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">{previewRaporStudent.keterangan}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">2</td>
                      <td className="p-3 font-bold text-slate-900">Bahasa Indonesia (Literasi Membaca & Menulis)</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiTugas}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">Mampu memahami teks bacaan narasi dan menyampaikan ide pokok secara lisan maupun tertulis dengan runtut.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">3</td>
                      <td className="p-3 font-bold text-slate-900">Matematika & Numerasi Dasar</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiKuis}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">Sangat terampil dalam operasi hitung bilangan bulat, pola gambar, dan penyelesaian soal cerita aplikatif.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">4</td>
                      <td className="p-3 font-bold text-slate-900">Ilmu Pengetahuan Alam dan Sosial (IPAS)</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiAkhir - 2}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">B</td>
                      <td className="p-3 text-slate-600 text-[11px]">Memahami siklus makhluk hidup dan pelestarian lingkungan sekolah dengan sangat baik.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">5</td>
                      <td className="p-3 font-bold text-slate-900">Koding & Literasi Digital SD</td>
                      <td className="p-3 text-center font-bold text-slate-900">{Math.min(100, previewRaporStudent.nilaiAkhir + 3)}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">A</td>
                      <td className="p-3 text-slate-600 text-[11px]">Antusias dalam menyusun blok algoritma visual dan menggunakan aplikasi Classroom SDN Tangerang 6.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ekstrakurikuler & Kehadiran */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-300 rounded-xl p-3">
                  <h5 className="font-bold text-slate-800 mb-2">Kegiatan Ekstrakurikuler</h5>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li>• Pramuka Siaga: <strong>Sangat Baik (A)</strong> - Disiplin & aktif</li>
                    <li>• Dokter Kecil / UKS: <strong>Baik (B)</strong> - Peduli kebersihan</li>
                  </ul>
                </div>

                <div className="border border-slate-300 rounded-xl p-3">
                  <h5 className="font-bold text-slate-800 mb-2">Rekapitulasi Kehadiran</h5>
                  <div className="grid grid-cols-3 text-center text-[11px]">
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span className="block text-slate-500">Kehadiran</span>
                      <span className="font-bold text-emerald-800">{previewRaporStudent.presensiPct}%</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <span className="block text-slate-500">Sakit</span>
                      <span className="font-bold text-blue-800">1 Hari</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="block text-slate-500">Izin/Alpa</span>
                      <span className="font-bold text-amber-800">0 Hari</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs pt-6">
                <div>
                  <p className="text-slate-500 mb-14">
                    Mengetahui,<br />Orang Tua / Wali Siswa
                  </p>
                  <p className="font-bold underline">( ........................................ )</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-14">
                    Mengetahui,<br />Kepala Sekolah SDN Tangerang 6
                  </p>
                  <p className="font-bold underline">Liestya Kusuma Sari, S.Pd., M.Pd.</p>
                  <p className="text-[10px] text-slate-400">NIP. 19740520 199803 2 004</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-14">
                    Tangerang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />
                    Guru Kelas / Wali Kelas
                  </p>
                  <p className="font-bold underline">{account.ROLE === 'GURU' ? account.NAMA : 'Nurul Hidayah, S.Pd.'}</p>
                  <p className="text-[10px] text-slate-400">NIP. {account.ROLE === 'GURU' ? (account.NIP || '-') : '19850412 201101 2 003'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM GRADE WEIGHTING MODAL */}
      <ClassroomGradeWeightingModal
        kelas={isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas}
        isOpen={showWeightingModal}
        onClose={() => setShowWeightingModal(false)}
        onSaved={onRefresh}
      />

      {/* MODAL: AI-POWERED REMEDIAL WORKSHEET GENERATOR (PHASE 3) */}
      {showRemedialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide">Rekomendasi Remedial Kurikulum Merdeka AI</h3>
                  <p className="text-[10px] text-purple-200">Menyusun Pendampingan & Lembar Kerja Individu Secara Otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setShowRemedialModal(false)}
                className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Profile Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Siswa Penerima</span>
                  <span className="font-extrabold text-slate-800">{remedialStudent}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Mata Pelajaran</span>
                  <span className="font-extrabold text-indigo-700">{remedialSubject}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Topik Materi</span>
                  <span className="font-extrabold text-slate-800">{remedialTopic}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Nilai / KKM</span>
                  <span className="font-black text-rose-600">{remedialScore} / 75 (Perlu Remedial)</span>
                </div>
              </div>

              {isGenerating ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-500 animate-pulse">Menghubungi Kurikulum Merdeka AI Engine...</p>
                  <p className="text-[10px] text-slate-400">Menyusun konsep sederhana & soal latihan kearifan lokal Tangerang...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Generated Text Box */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[45vh] overflow-y-auto shadow-inner">
                    {generatedWorksheet}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <div className="text-[11px] text-indigo-900 leading-normal font-medium">
                      💡 <strong>Saran Guru:</strong> Cetak lembar kerja adaptif ini dan berikan ke <strong>{remedialStudent}</strong> untuk dikerjakan secara mandiri terbimbing.
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedWorksheet);
                          alert('Lembar remedial berhasil disalin ke papan klip!');
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Salin Teks
                      </button>
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                      >
                        Cetak Lembar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowRemedialModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export All E-Rapor ZIP Progress Modal */}
      {isExportingZip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw size={28} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">
                Mengekspor E-Rapor Seluruh Siswa ke ZIP
              </h4>
              <p className="text-xs text-slate-500">
                Memproses dokumen PDF resmi untuk setiap siswa dengan penamaan otomatis berdasarkan NIS...
              </p>
            </div>
            {exportZipProgress && (
              <div className="space-y-3 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>Progres: {exportZipProgress.current} / {exportZipProgress.total} Siswa</span>
                  <span>{Math.round((exportZipProgress.current / exportZipProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-purple-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.round((exportZipProgress.current / exportZipProgress.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-purple-700 truncate font-medium">
                  📄 Sedang memproses: <strong className="font-bold">{exportZipProgress.studentName}</strong> (NIS: {exportZipProgress.studentNis})
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              File ZIP akan otomatis terunduh begitu proses kompilasi PDF selesai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
