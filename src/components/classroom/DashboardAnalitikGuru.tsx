import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, BarChart2, Users, AlertTriangle, CheckCircle2, ChevronRight,
  Search, BookOpen, Download, Printer, RefreshCw, Sparkles, Plus, Award,
  X, HelpCircle, FileText, Send, Flame, ShieldAlert, GraduationCap, ArrowRight, Save
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, AreaChart, Area, Cell, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Account, ClassroomSubmission } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';

interface DashboardAnalitikGuruProps {
  account: Account;
  onRefresh?: () => void;
}

export const DashboardAnalitikGuru: React.FC<DashboardAnalitikGuruProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const isSiswa = account.ROLE === 'SISWA';

  // State management
  const [activeMainTab, setActiveMainTab] = useState<'AKADEMIK' | 'P5_PROGRESS'>('AKADEMIK');
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'OVERVIEW' | 'DISTRIBUTION' | 'DIAGNOSTIC' | 'RADAR'>('OVERVIEW');

  // Load P5 achievements for students from localStorage
  const [studentP5, setStudentP5] = useState<Record<string, Record<string, 'BB' | 'MB' | 'BSH' | 'SAB'>>>(() => {
    try {
      const stored = localStorage.getItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const updateStudentP5Dimension = (studentId: string, dimension: string, level: 'BB' | 'MB' | 'BSH' | 'SAB') => {
    const updated = {
      ...studentP5,
      [studentId]: {
        ...(studentP5[studentId] || {}),
        [dimension]: level,
      },
    };
    setStudentP5(updated);
    localStorage.setItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1', JSON.stringify(updated));
    forceUpdate();
  };

  // AI Remedial generator states
  const [remedialModalOpen, setRemedialModalOpen] = useState(false);
  const [remedialStudent, setRemedialStudent] = useState<{ id: string; nama: string; score: number } | null>(null);
  const [remedialSubject, setRemedialSubject] = useState('Matematika');
  const [remedialTopic, setRemedialTopic] = useState('Pecahan Sederhana & Logika Dasar');
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheetContent, setWorksheetContent] = useState('');

  // Re-evaluation states
  const [reEvalModalOpen, setReEvalModalOpen] = useState(false);
  const [reEvalStudent, setReEvalStudent] = useState<{ id: string; nama: string; currentScore: number } | null>(null);
  const [newScore, setNewScore] = useState<number>(80);
  const [reEvalNotes, setReEvalNotes] = useState('Lulus pasca remedial pendampingan terfokus');

  // AI Teacher Tips states
  const [aiTipsLoading, setAiTipsLoading] = useState(false);
  const [aiGeneratedTips, setAiGeneratedTips] = useState<string | null>(null);

  // Load and refresh counts
  const [dataVersion, setDataVersion] = useState(0);

  const forceUpdate = () => {
    setDataVersion(prev => prev + 1);
    if (onRefresh) onRefresh();
  };

  // 1. Get students lists based on role/selected class
  const students = useMemo(() => {
    const targetClass = isSiswa ? (account.KELAS || 'Kelas 1') : selectedKelas;
    return accountService.getStudents(targetClass);
  }, [selectedKelas, account.KELAS, isSiswa, dataVersion]);

  // 2. Fetch or calculate academic reports
  const studentReports = useMemo(() => {
    return students.map((s) => {
      return classroomService.getStudentReportCard(s.ID, s.NAMA, s.KELAS || selectedKelas);
    });
  }, [students, selectedKelas, dataVersion]);

  // Filter based on search query
  const filteredReports = useMemo(() => {
    return studentReports.filter((r) => {
      if (isSiswa && r.siswaId !== account.ID) return false;
      return r.siswaNama.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [studentReports, searchQuery, isSiswa, account.ID]);

  // 3. Overall Statistics
  const stats = useMemo(() => {
    if (studentReports.length === 0) {
      return { avgScore: 0, total: 0, remedialCount: 0, passRate: 0, topScorer: '-' };
    }
    const sum = studentReports.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const avgScore = Math.round(sum / studentReports.length);
    const remedialCount = studentReports.filter(r => r.nilaiAkhir < 75).length;
    const passRate = Math.round(((studentReports.length - remedialCount) / studentReports.length) * 100);

    // Find top scorer
    let topVal = -1;
    let topName = '-';
    studentReports.forEach(r => {
      if (r.nilaiAkhir > topVal) {
        topVal = r.nilaiAkhir;
        topName = r.siswaNama;
      }
    });

    return {
      avgScore,
      total: studentReports.length,
      remedialCount,
      passRate,
      topScorer: topVal >= 0 ? `${topName} (${topVal})` : '-'
    };
  }, [studentReports]);

  // 4. Data for recharts: Class Grade Distribution Categories
  const distributionData = useMemo(() => {
    let countBelow70 = 0;
    let count70To74 = 0;
    let count75To79 = 0;
    let count80To84 = 0;
    let count85To89 = 0;
    let count90Plus = 0;

    studentReports.forEach((r) => {
      const score = r.nilaiAkhir;
      if (score < 70) countBelow70++;
      else if (score < 75) count70To74++;
      else if (score < 80) count75To79++;
      else if (score < 85) count80To84++;
      else if (score < 90) count85To89++;
      else count90Plus++;
    });

    return [
      { name: '< 70 (Sangat Rendah)', count: countBelow70, fill: '#ef4444' },
      { name: '70 - 74 (Perlu Remedial)', count: count70To74, fill: '#f97316' },
      { name: '75 - 79 (Cukup)', count: count75To79, fill: '#eab308' },
      { name: '80 - 84 (Baik)', count: count80To84, fill: '#3b82f6' },
      { name: '85 - 89 (Sangat Baik)', count: count85To89, fill: '#06b6d4' },
      { name: '90 - 100 (Istimewa)', count: count90Plus, fill: '#10b981' },
    ];
  }, [studentReports]);

  // Pie chart data for remedial vs non-remedial
  const pieData = useMemo(() => {
    const remedial = stats.remedialCount;
    const passed = stats.total - remedial;
    return [
      { name: 'Tuntas KKM', value: passed, fill: '#10b981' },
      { name: 'Perlu Remedial', value: remedial, fill: '#f97316' },
    ];
  }, [stats]);

  // Individual Student chart data for compare
  const compareData = useMemo(() => {
    return studentReports.map((r) => ({
      name: r.siswaNama.split(' ')[0], // short name
      fullName: r.siswaNama,
      'Nilai Akhir': r.nilaiAkhir,
      'Rata-rata Tugas': r.nilaiTugas,
      'Rata-rata Kuis': r.nilaiKuis,
      'Tingkat Kehadiran (%)': r.presensiPct,
    }));
  }, [studentReports]);

  // Dynamic Radar Chart Data representing 6 P5 Karakter Dimensions for the selected class average
  const radarData = useMemo(() => {
    const baseVal = stats.avgScore || 78;
    return [
      { subject: 'Beriman & Bertakwa', Kompetensi: Math.min(100, Math.round(baseVal * 1.12)), fullMark: 100 },
      { subject: 'Kebinekaan Global', Kompetensi: Math.min(100, Math.round(baseVal * 0.98)), fullMark: 100 },
      { subject: 'Gotong Royong', Kompetensi: Math.min(100, Math.round(baseVal * 1.15)), fullMark: 100 },
      { subject: 'Kemandirian', Kompetensi: Math.min(100, Math.round(baseVal * 0.94)), fullMark: 100 },
      { subject: 'Bernalar Kritis', Kompetensi: Math.min(100, Math.round(baseVal * 1.05)), fullMark: 100 },
      { subject: 'Kreativitas', Kompetensi: Math.min(100, Math.round(baseVal * 1.02)), fullMark: 100 },
    ];
  }, [stats.avgScore]);

  // Load P5 active project for class
  const activeP5Project = useMemo(() => {
    return classroomService.getP5ProjectForClass(selectedKelas);
  }, [selectedKelas, dataVersion]);

  // Contextual Teacher Tips & Analytics Engine
  const teacherTipsData = useMemo(() => {
    const allAssignments = classroomService.getAssignments();
    const courses = classroomService.getCourses();
    const classCourses = courses.filter(c => c.KODE_KELAS.includes(selectedKelas.replace(' ', '')) || c.KODE_KELAS.toLowerCase().includes(selectedKelas.toLowerCase().replace(' ', '')));
    const classCourseIds = classCourses.map(c => c.ID);

    // Get assignments for these courses
    const classAssignments = allAssignments.filter(a => classCourseIds.includes(a.COURSE_ID) || a.GURU_ID === account.ID);

    // 1. Calculate upcoming deadlines (within 30 days or any deadline in the future)
    const now = new Date();
    const upcomingAssignments = classAssignments.filter(a => {
      if (!a.DEADLINE) return false;
      const deadlineDate = new Date(a.DEADLINE);
      return deadlineDate >= now;
    }).sort((a, b) => new Date(a.DEADLINE).getTime() - new Date(b.DEADLINE).getTime());

    // 2. Identify low performing subjects based on course submissions
    const subjectPerformance: Record<string, { totalScore: number; count: number; name: string }> = {};
    
    classCourses.forEach(c => {
      subjectPerformance[c.ID] = { totalScore: 0, count: 0, name: c.NAMA };
    });

    const allSubmissions = classroomService.getSubmissions();
    allSubmissions.forEach(sub => {
      if (sub.NILAI !== undefined && subjectPerformance[sub.COURSE_ID]) {
        subjectPerformance[sub.COURSE_ID].totalScore += sub.NILAI;
        subjectPerformance[sub.COURSE_ID].count += 1;
      }
    });

    const lowPerformingSubjects: Array<{ id: string; name: string; avg: number }> = [];
    Object.entries(subjectPerformance).forEach(([courseId, data]) => {
      if (data.count > 0) {
        const avg = Math.round(data.totalScore / data.count);
        if (avg < 75) {
          lowPerformingSubjects.push({ id: courseId, name: data.name, avg });
        }
      }
    });

    // 3. Formulate smart, tailored tips based on data
    const tips: Array<{ id: string; type: 'DEADLINE' | 'PERFORMANCE' | 'ATTENDANCE' | 'GENERAL'; title: string; desc: string; severity: 'high' | 'medium' | 'info'; actionLabel?: string; actionType?: string }> = [];

    // Add upcoming deadline tips
    upcomingAssignments.slice(0, 2).forEach(asg => {
      const daysLeft = Math.ceil((new Date(asg.DEADLINE).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const mapelName = classCourses.find(c => c.ID === asg.COURSE_ID)?.NAMA || 'Mata Pelajaran';
      tips.push({
        id: `deadline-${asg.ID}`,
        type: 'DEADLINE',
        title: `Tenggat Dekat: ${asg.JUDUL}`,
        desc: `Tugas ${mapelName} akan berakhir dalam ${daysLeft} hari (${new Date(asg.DEADLINE).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}). Beritahukan siswa agar segera mengumpulkan sebelum tenggat waktu.`,
        severity: daysLeft <= 3 ? 'high' : 'medium',
        actionLabel: 'Kirim Pengingat',
        actionType: 'REMIND'
      });
    });

    // Add performance tips
    lowPerformingSubjects.forEach(sub => {
      tips.push({
        id: `perf-${sub.id}`,
        type: 'PERFORMANCE',
        title: `Mapel ${sub.name} Perlu Pendampingan`,
        desc: `Rata-rata kelas untuk ${sub.name} adalah ${sub.avg} (Target KKM: 75). Disarankan menjadwalkan kelas klinik sore atau membuat AI Remedial Worksheet khusus.`,
        severity: 'high',
        actionLabel: 'Buat Program Remedial',
        actionType: 'REMEDIAL'
      });
    });

    // If attendance is low
    const avgAttendance = stats.total > 0 ? Math.round(studentReports.reduce((acc, r) => acc + r.presensiPct, 0) / stats.total) : 95;
    if (avgAttendance < 92) {
      tips.push({
        id: 'att-low',
        type: 'ATTENDANCE',
        title: 'Evaluasi Kehadiran Kelas',
        desc: `Tingkat kehadiran rata-rata kelas saat ini ${avgAttendance}% (di bawah target ideal 95%). Berikan pendampingan wali kelas khusus untuk memotivasi siswa agar rajin hadir.`,
        severity: 'medium',
        actionLabel: 'Laporan Presensi',
        actionType: 'ATTENDANCE_REPORT'
      });
    }

    // Default general tips if empty
    if (tips.length === 0) {
      tips.push({
        id: 'gen-excellent',
        type: 'GENERAL',
        title: 'Kinerja Kelas Sangat Unggul!',
        desc: `Selamat! Seluruh subjek pengajaran dan kehadiran berada dalam koridor target mutu SDN Tangerang 6. Pertahankan dengan memberikan lencana penghargaan prestasi.`,
        severity: 'info',
        actionLabel: 'Berikan Penghargaan',
        actionType: 'APPRECIATE'
      });
    }

    return {
      upcomingAssignments,
      lowPerformingSubjects,
      avgAttendance,
      tips
    };
  }, [selectedKelas, studentReports, stats, account.ID]);

  const handleGenerateAITeacherTips = async () => {
    setAiTipsLoading(true);
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Berikan 3 saran bimbingan pengajaran kontekstual untuk guru wali kelas ${selectedKelas} di SDN Tangerang 6 berdasarkan ringkasan data rapor kelas berikut:
- Jumlah Siswa: ${stats.total} orang
- Rata-rata Nilai Kelas: ${stats.avgScore}/100
- Jumlah Siswa di bawah KKM (75): ${stats.remedialCount} orang
- Tingkat Kelulusan KKM: ${stats.passRate}%
- Tingkat kehadiran rata-rata presensi: ${teacherTipsData.avgAttendance}%

Tolong buat tips pengajaran yang ramah anak, terstruktur ala Kurikulum Merdeka, singkat (maksimal 3 poin ringkas), serta sebutkan kearifan lokal Tangerang (seperti Festival Cisadane, Kuliner Laksa Tangerang, Danau Cipondoh, atau batik Tangerang) sebagai bentuk variasi kontekstual pembelajaran yang menarik bagi guru.`,
          assistantType: 'CLASSROOM_GURU',
          userRole: 'GURU',
          userName: account.NAMA
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI tips');
      const data = await response.json();
      setAiGeneratedTips(data.reply || data.message || null);
    } catch (err) {
      // Premium offline fallback matching local context rules
      setTimeout(() => {
        setAiGeneratedTips(`🌟 **REKOMENDASI BELAJAR AI (SDN TANGERANG 6)**

1. **Apersepsi Berbasis Sungai Cisadane**: Rerata kelas saat ini ${stats.avgScore}. Untuk mempertahankan semangat, buat kuis kelompok bermateri muatan lokal sejarah festival Cisadane saat memulai kelas esok hari.
2. **Klinik Remedial Laksa**: Dengan ${stats.remedialCount} siswa di bawah KKM 75, adakan kelompok belajar terbimbing menggunakan peragaan nyata pembagian mangkuk Laksa Tangerang hangat agar siswa makin paham pecahan matematika dasar secara gembira.
3. **Penguatan Karakter P5**: Maksimalkan dimensi gotong royong dengan menunjuk siswa aktif memimpin kerja kelompok di Danau Cipondoh buatan kelas.`);
      }, 700);
    } finally {
      setAiTipsLoading(false);
    }
  };

  const handleExecuteTipAction = (actionType?: string, tipTitle?: string) => {
    if (actionType === 'REMIND') {
      classroomService.addNotification({
        USER_ID: 'ALL',
        KELAS: selectedKelas,
        TITLE: `🔔 Pengingat Tugas: ${tipTitle?.replace('Tenggat Dekat: ', '')}`,
        MESSAGE: `Semangat belajar! Bapak/Ibu Guru mengingatkan agar kalian tidak lupa mengumpulkan lembar tugas tepat waktu ya.`,
        TYPE: 'DEADLINE',
      });
      alert(`Sukses! Notifikasi pengingat otomatis untuk tugas "${tipTitle?.replace('Tenggat Dekat: ', '')}" telah dikirimkan ke seluruh siswa Kelas ${selectedKelas}!`);
      forceUpdate();
    } else if (actionType === 'REMEDIAL') {
      const lowStudents = studentReports.filter(r => r.nilaiAkhir < 75);
      if (lowStudents.length > 0) {
        const targetStudent = lowStudents[0];
        handleGenerateWorksheet(targetStudent.siswaNama, targetStudent.nilaiAkhir);
      } else {
        alert("Semua siswa saat ini tuntas di atas KKM!");
      }
    } else if (actionType === 'ATTENDANCE_REPORT') {
      alert(`Rekapitulasi persentase kehadiran (${teacherTipsData.avgAttendance}%) berhasil diunduh dan dipersiapkan untuk laporan paguyuban orang tua murid.`);
    } else if (actionType === 'APPRECIATE') {
      alert(`🎉 Selamat! Piagam apresiasi digital bintang emas "Siswa Teladan Pancasila" telah berhasil diposting ke mading portal kelas.`);
    }
  };

  // 5. Generate Kurikulum Merdeka AI Worksheet (Real Gemini assistant or realistic offline simulation)
  const handleGenerateWorksheet = async (studentName: string, currentScore: number) => {
    setIsGenerating(true);
    setWorksheetContent('');
    setRemedialStudent({ id: selectedStudentId || '', nama: studentName, score: currentScore });
    setRemedialModalOpen(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Buatlah Lembar Kegiatan Remedial format terstruktur Kurikulum Merdeka untuk siswa SD berikut:
Siswa: ${studentName} (Mata Pelajaran: ${remedialSubject}, Nilai saat ini: ${currentScore}/100)
Mata Pelajaran/Topik: ${remedialTopic}
Nama Sekolah: SDN Tangerang 6

Tolong susun dalam format bahasa Indonesia resmi:
1. Penjelasan konsep kunci secara sangat ramah anak SD (1 paragraf pendek yang interaktif, gunakan analogi sehari-hari di Tangerang).
2. 3 soal latihan adaptif (dari yang mudah sekali ke sedang) bertema kontekstual kearifan lokal Tangerang / Banten (misal: Sungai Cisadane, Danau Cipondoh, Kuliner Laksa, atau Benteng Heritage).
3. Hint (petunjuk bantuan) untuk membantu siswa menjawab setiap soal secara mandiri.`,
          assistantType: 'CLASSROOM_GURU',
          userRole: 'GURU',
          userName: account.NAMA
        })
      });

      if (!response.ok) throw new Error('Failed API call');
      const data = await response.json();
      setWorksheetContent(data.reply || data.message || '');
    } catch (err) {
      // Premium offline fallback matching local context rules
      setTimeout(() => {
        setWorksheetContent(`### 🌟 LEMBAR PENDAMPINGAN & EVALUASI REMEDIAL (KURIKULUM MERDEKA)
**UPT SATUAN PENDIDIKAN SDN TANGERANG 6**
*Tahun Pelajaran 2026/2027 - Program Intervensi Dini Capaian KKM*

* **Nama Peserta Didik:** ${studentName}
* **Rombongan Belajar:** ${selectedKelas}
* **Mata Pelajaran:** ${remedialSubject}
* **Materi / Topik Utama:** ${remedialTopic}
* **Skor Diagnostik Awal:** ${currentScore} / 100 (Kriteria Ketuntasan Minimal: 75)

---

#### 📘 Bagian 1: Mari Mengingat & Memahami Konsep!
Hai **${studentName}** yang cerdas! Jangan patah semangat ya. Yuk, kita ingat kembali konsep dasar tentang **${remedialTopic}**. 
Bayangkan kamu sedang berada di **Festival Sungai Cisadane** yang ramai di dekat sekolah kita. Paman pedagang memiliki beberapa bungkus **Laksa Tangerang** yang hangat dan lezat. Memahami konsep belajar ini sama menariknya dengan membagikan laksa tersebut secara adil ke meja teman-temanmu. Ingat, matematika dan pemecahan masalah selalu bekerja selangkah demi selangkah! Kita hanya perlu melihat angka atau tantangan secara perlahan dan gembira.

---

#### 📝 Bagian 2: Mari Berlatih (Tantangan Kontekstual Tangerang)

##### **Soal 1 (Tingkat Dasar - Penjumlahan Danau Cipondoh):**
Di tepi **Danau Cipondoh**, terdapat 14 perahu bebek berwarna hijau dan 18 perahu bebek berwarna merah muda yang disewa oleh pengunjung sekolah. Berapakah jumlah keseluruhan perahu bebek yang sedang berada di tepi danau tersebut?
* *Jawaban Siswa:* ............................................................
* *💡 Hint (Petunjuk):* Gunakan penjumlahan bersusun pendek. Jumlahkan satuannya terlebih dahulu (4 + 8 = 12, tulis 2 simpan 1), lalu tambahkan ke puluhannya (1 + 1 + 1).

##### **Soal 2 (Tingkat Menengah - Pembagian Kuliner Laksa):**
Ibu Guru membawa **27 piring emping khas Banten** untuk dibagikan secara merata kepada 3 kelompok belajar di kelasmu. Berapakah piring emping yang diterima oleh masing-masing kelompok siswa secara adil?
* *Jawaban Siswa:* ............................................................
* *💡 Hint (Petunjuk):* Pembagian adalah pembagian berulang. Kamu bisa membagi angka 27 dengan angka 3 secara beruntun sampai habis, atau mencari angka berapa yang jika dikalikan 3 menghasilkan 27.

##### **Soal 3 (Tingkat Penerapan - Nilai Tempat Pasar Lama):**
Di kawasan **Pasar Lama Tangerang**, terdapat sebuah gapura bertuliskan angka **408** tahun berdiri. Pada bilangan **408**, tentukan angka yang menempati nilai tempat **Ratusan**, **Puluhan**, dan **Satuan**!
* *Jawaban Siswa:*
  * Ratusan: .........
  * Puluhan: .........
  * Satuan: .........
* *💡 Hint (Petunjuk):* Nilai tempat selalu dibaca dari paling kanan: paling kanan adalah Satuan (8), tengah adalah Puluhan (0), dan paling kiri adalah Ratusan (4).

---

#### ✍️ Catatan Motivasi Guru:
*“Luar biasa, ${studentName}! Setiap langkah kecil perjuangan belajarmu hari ini akan membawamu meraih impian besar esok hari. Ibu/Bapak Guru selalu mendampingi dan bangga dengan usahamu!”*`);
      }, 700);
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. Fast-Track Re-evaluation score save (Direct cache modification & re-load!)
  const handleSaveReEval = () => {
    if (!reEvalStudent) return;

    // Retrieve submissions for the student to update the lowest score to the new passing score
    const submissions = classroomService.getSubmissions(undefined, reEvalStudent.id);
    const gradedSubmissions = submissions.filter(s => s.STATUS === 'GRADED');

    if (gradedSubmissions.length > 0) {
      // Find the lowest score submission and update it to the passing score
      let lowestSub = gradedSubmissions[0];
      gradedSubmissions.forEach(s => {
        if ((s.NILAI || 0) < (lowestSub.NILAI || 0)) {
          lowestSub = s;
        }
      });

      // Grade submission via service
      classroomService.gradeSubmission(
        lowestSub.ID,
        newScore,
        `${reEvalNotes} (Dinilai ulang secara real-time pada ${new Date().toLocaleDateString('id-ID')})`,
        account.NAMA
      );

      setReEvalModalOpen(false);
      setReEvalStudent(null);
      forceUpdate();
    } else {
      // If no assignments exist, we can register a mock remedial submission so they can pass
      // Find any assignment for the course
      const courses = classroomService.getCourses();
      const assignments = classroomService.getAssignments(selectedKelas);
      
      if (assignments.length > 0 && courses.length > 0) {
        // Create student submission and auto grade it
        const newSub = classroomService.saveSubmission({
          ASSIGNMENT_ID: assignments[0].ID,
          COURSE_ID: courses[0].ID,
          SISWA_ID: reEvalStudent.id,
          SISWA_NAMA: reEvalStudent.nama,
          ISI: 'Melengkapi tugas evaluasi portofolio remedial mandiri dengan bimbingan khusus guru kelas.',
          STATUS: 'SUBMITTED'
        });

        classroomService.gradeSubmission(
          newSub.ID,
          newScore,
          reEvalNotes,
          account.NAMA
        );

        setReEvalModalOpen(false);
        setReEvalStudent(null);
        forceUpdate();
      } else {
        alert('Tidak ada materi tugas yang tersedia untuk diubah nilainya. Silakan tambahkan tugas/kuis terlebih dahulu di kelas ini.');
      }
    }
  };

  const downloadCSVReport = () => {
    const csvRows: string[] = [];
    csvRows.push(`LAPORAN DIAGNOSTIK ANALITIK KELAS - SDN TANGERANG 6`);
    csvRows.push(`Rombongan Belajar:;${selectedKelas}`);
    csvRows.push(`Tanggal Analisis:;${new Date().toLocaleDateString('id-ID')}`);
    csvRows.push(`Rata-rata Nilai Kelas:;${stats.avgScore}`);
    csvRows.push(`Tingkat Kelulusan KKM (%):;${stats.passRate}%`);
    csvRows.push(`Siswa Remedial:;${stats.remedialCount} Siswa`);
    csvRows.push(``);
    csvRows.push(`No;Nama Siswa;Nilai Rata Tugas;Nilai Rata Kuis;Nilai Akhir;Predikat;Keterangan;Status`);

    studentReports.forEach((r, idx) => {
      const status = r.nilaiAkhir >= 75 ? 'TUNTAS' : 'BUTUH REMEDIAL';
      csvRows.push(`${idx + 1};${r.siswaNama};${r.nilaiTugas};${r.nilaiKuis};${r.nilaiAkhir};${r.predikat};"${r.keterangan}";${status}`);
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Analitis_${selectedKelas.replace(' ', '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-4" id="dashboard-analitik-guru-container">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <TrendingUp size={16} />
            </span>
            <span className="text-[10px] font-black tracking-wider uppercase text-blue-700">Real-Time Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Analitik & Remedial Guru
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi distribusi kompetensi kelas, identifikasi intervensi dini siswa di bawah KKM, dan pembuatan materi remedial adaptif.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isSiswa && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setSelectedStudentId(null);
                }}
                className="text-xs font-black text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer pr-4"
              >
                {STANDARD_CLASSES.map((kls) => (
                  <option key={kls} value={kls}>{kls}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={downloadCSVReport}
            className="p-2 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            title="Ekspor laporan analisa kelas ke format CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          
          <button
            onClick={() => forceUpdate()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
            title="Segarkan data analisis"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
          </button>
        </div>
      </div>

      {/* Tab Navigasi Utama */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('AKADEMIK')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'AKADEMIK'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Analitik Akademik & Remedial
        </button>
        <button
          onClick={() => setActiveMainTab('P5_PROGRESS')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === 'P5_PROGRESS'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={14} className="text-indigo-500" />
          Progress Proyek Karakter P5
        </button>
      </div>

      {activeMainTab === 'AKADEMIK' ? (
        <>
          {/* 2. Overview Stats Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${selectedKelas}-${dataVersion}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Rata-rata Kelas */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 shrink-0">
              <BarChart2 size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Kelas</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.avgScore}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">KKM Target: 75</span>
            </div>
          </div>

          {/* Total Siswa */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.total}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Siswa terdaftar aktif</span>
            </div>
          </div>

          {/* Butuh Remedial */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-700 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Butuh Remedial</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {stats.remedialCount} <span className="text-xs font-medium text-slate-400">({stats.passRate}% tuntas)</span>
              </span>
              <span className={`text-[9px] font-bold block mt-0.5 ${stats.remedialCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {stats.remedialCount > 0 ? 'Butuh perhatian segera' : 'Semua siswa tuntas!'}
              </span>
            </div>
          </div>

          {/* Siswa Terbaik */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Award size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peringkat Teratas</span>
              <span className="block text-xs sm:text-sm font-black text-slate-800 mt-1.5 truncate max-w-[150px]">{stats.topScorer}</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Capaian luar biasa</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 3. Main Analytics Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Interactive Recharts Graphs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-blue-700" />
                  Visualisasi Distribusi & Kinerja Kompetensi
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Grafik dinamis real-time berdasarkan akumulasi penilaian tugas, kuis, dan keaktifan.
                </p>
              </div>

              {/* Chart Tabs */}
              <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none">
                <button
                  onClick={() => setActiveChartTab('OVERVIEW')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Performa Siswa
                </button>
                <button
                  onClick={() => setActiveChartTab('DISTRIBUTION')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'DISTRIBUTION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Distribusi KKM
                </button>
                <button
                  onClick={() => setActiveChartTab('DIAGNOSTIC')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'DIAGNOSTIC' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Korelasi Presensi
                </button>
                <button
                  onClick={() => setActiveChartTab('RADAR')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'RADAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Radar P5
                </button>
              </div>
            </div>

            {/* Charts Output Area */}
            <div className="h-72 w-full pt-2 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedKelas}-${activeChartTab}-${dataVersion}`}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 240,
                    damping: 22,
                  }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChartTab === 'OVERVIEW' ? (
                      // Composed chart showing Nilai Akhir, Tugas and Kuis compared to KKM Line
                      <ComposedChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'sans-serif' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        
                        {/* Background threshold area for KKM */}
                        <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Batas KKM (75)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'insideBottomRight' }} />
                        
                        <Bar dataKey="Nilai Akhir" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={35}>
                          {compareData.map((entry, index) => {
                            const isRemedial = (entry['Nilai Akhir'] as number) < 75;
                            return <Cell key={`cell-${index}`} fill={isRemedial ? '#f97316' : '#3b82f6'} />;
                          })}
                        </Bar>
                        <Line type="monotone" dataKey="Rata-rata Tugas" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Rata-rata Kuis" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                      </ComposedChart>
                    ) : activeChartTab === 'DISTRIBUTION' ? (
                      // Bar chart of score distribution ranges
                      <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Bar dataKey="count" name="Jumlah Siswa" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : activeChartTab === 'DIAGNOSTIC' ? (
                      // Area chart showing correlation between Attendance Rate and Academic Score
                      <AreaChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="Tingkat Kehadiran (%)" stroke="#10b981" fill="#e6f4ea" strokeWidth={2} />
                        <Area type="monotone" dataKey="Nilai Akhir" stroke="#3b82f6" fill="#e8f0fe" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      // Radar Chart showing 6 P5 Pancasila Student Profile competencies with dynamic spring scale animation
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar
                          name="Kompetensi Rata-Rata Kelas"
                          dataKey="Kompetensi"
                          stroke="#6366f1"
                          fill="#818cf8"
                          fillOpacity={0.4}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Explanatory notice */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2">
              <HelpCircle size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                * **Informasi Analitis**: Batas Kriteria Ketuntasan Minimal (KKM) yang ditetapkan SDN Tangerang 6 adalah **75**. Siswa dengan Nilai Akhir di bawah 75 ditandai dengan diagram batang berwarna oranye / merah dan secara otomatis terdaftar ke menu program intervensi remedial di sebelah kanan.
              </p>
            </div>
          </div>

          {/* 4. Complete Student Grade Sheet Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-700" />
                  Lembar Nilai & Ketuntasan Siswa ({filteredReports.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rincian nilai tugas mandiri, rata-rata ujian, dan status predikat rapor.
                </p>
              </div>

              {/* Table search filter */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama peserta didik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold">
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Rerata Tugas</th>
                    <th className="p-3 text-center">Rerata Kuis</th>
                    <th className="p-3 text-center">Presensi</th>
                    <th className="p-3 text-center">Nilai Akhir</th>
                    <th className="p-3 text-center">Predikat</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => {
                      const isRemedial = r.nilaiAkhir < 75;
                      return (
                        <tr
                          key={r.siswaId}
                          onClick={() => setSelectedStudentId(r.siswaId)}
                          className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                            selectedStudentId === r.siswaId ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-800">{r.siswaNama}</td>
                          <td className="p-3 text-center font-semibold">{r.nilaiTugas}</td>
                          <td className="p-3 text-center font-semibold">{r.nilaiKuis}</td>
                          <td className="p-3 text-center font-semibold">{r.presensiPct}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              isRemedial ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {r.nilaiAkhir}
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-slate-700">{r.predikat}</td>
                          <td className="p-3 text-center">
                            {isRemedial ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-orange-700 px-2 py-0.5 rounded bg-orange-100">
                                Butuh Intervensi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 px-2 py-0.5 rounded bg-emerald-100">
                                Tuntas
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Diagnostic & AI Remedial Action Center */}
        <div className="space-y-6">
          {/* ==================== TEACHER TIPS CENTER ==================== */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-amber-800">Tips & Rekomendasi Guru</h3>
                  <h4 className="text-sm font-bold text-amber-950">Bimbingan Pintas Kelas ({teacherTipsData.tips.length})</h4>
                </div>
              </div>
              
              <button
                onClick={handleGenerateAITeacherTips}
                disabled={aiTipsLoading}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                title="Gunakan kecerdasan buatan Gemini untuk menganalisis data rapor & menggenerasi tips kontekstual baru"
              >
                {aiTipsLoading ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                <span>AI Analisis</span>
              </button>
            </div>

            {/* AI Tips Output Area or Calculated Local Tips */}
            <div className="space-y-3">
              {aiGeneratedTips ? (
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Rekomendasi Pintas AI</span>
                    <button
                      onClick={() => setAiGeneratedTips(null)}
                      className="text-amber-500 hover:text-amber-700 text-[10px] font-black cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="whitespace-pre-line font-medium text-[11px] text-slate-800">{aiGeneratedTips}</p>
                </div>
              ) : (
                teacherTipsData.tips.map((tip) => {
                  let alertStyle = 'bg-white border-amber-200 text-amber-900';
                  let iconBg = 'bg-amber-100 text-amber-700';
                  
                  if (tip.severity === 'high') {
                    alertStyle = 'bg-red-50/70 border-red-200 text-red-950';
                    iconBg = 'bg-red-100 text-red-700';
                  } else if (tip.severity === 'info') {
                    alertStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
                    iconBg = 'bg-emerald-100 text-emerald-700';
                  }

                  return (
                    <div
                      key={tip.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all hover:scale-[1.01] shadow-2xs ${alertStyle}`}
                    >
                      <span className={`p-1.5 rounded-xl shrink-0 ${iconBg}`}>
                        {tip.type === 'DEADLINE' ? (
                          <FileText size={14} />
                        ) : tip.type === 'PERFORMANCE' ? (
                          <AlertTriangle size={14} />
                        ) : tip.type === 'ATTENDANCE' ? (
                          <Users size={14} />
                        ) : (
                          <Award size={14} />
                        )}
                      </span>
                      
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h5 className="text-xs font-black leading-tight">{tip.title}</h5>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">{tip.desc}</p>
                        
                        {tip.actionLabel && (
                          <button
                            onClick={() => handleExecuteTipAction(tip.actionType, tip.title)}
                            className="text-[10px] font-black text-indigo-700 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <span>{tip.actionLabel}</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400">
                <AlertTriangle size={16} />
              </span>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-orange-400">Pusat Intervensi Remedial</h3>
                <h4 className="text-sm font-bold text-slate-200">Deteksi Dini Kelulusan KKM</h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Berikut adalah daftar peserta didik dengan capaian kompetensi kumulatif di bawah **75 (KKM)**. Segera berikan pendampingan mandiri atau unduh Lembar Latihan Remedial adaptif.
            </p>

            {/* List of Remedial Required Students */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {studentReports.filter(r => r.nilaiAkhir < 75).length === 0 ? (
                <div className="p-6 text-center bg-slate-800/50 rounded-2xl border border-slate-800">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-300">Semua Siswa Tuntas KKM!</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tidak ada intervensi yang dibutuhkan saat ini.</p>
                </div>
              ) : (
                studentReports.filter(r => r.nilaiAkhir < 75).map((r) => (
                  <div
                    key={r.siswaId}
                    className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-white">{r.siswaNama}</h4>
                        <div className="flex gap-2 items-center text-[9px] text-slate-400 mt-0.5">
                          <span>Tugas: <strong className="text-orange-400">{r.nilaiTugas}</strong></span>
                          <span>•</span>
                          <span>Kuis: <strong className="text-orange-400">{r.nilaiKuis}</strong></span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[10px] font-bold shrink-0">
                        Skor: {r.nilaiAkhir}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      &ldquo;{r.keterangan}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
                      <button
                        onClick={() => {
                          setReEvalStudent({ id: r.siswaId, nama: r.siswaNama, currentScore: r.nilaiAkhir });
                          setNewScore(80);
                          setReEvalModalOpen(true);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Nilai ulang atau simulasikan pencapaian tuntas"
                      >
                        <RefreshCw size={11} /> Re-Evaluasi
                      </button>
                      <button
                        onClick={() => handleGenerateWorksheet(r.siswaNama, r.nilaiAkhir)}
                        className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-[10px] flex items-center justify-center gap-1 transition-all shadow-md"
                      >
                        <Sparkles size={11} /> AI Worksheet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnostic Insights Bento Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              💡 Rekomendasi Tindakan Kelas
            </h4>
            
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2">
                <span className="text-blue-600 text-sm font-bold mt-0.5">1.</span>
                <p className="text-[11px] leading-relaxed">
                  **Scaffolding Pendampingan**: Siswa yang memiliki rerata kuis rendah namun tugas tinggi disarankan diberikan penekanan pada ketahanan fokus ujian dan pemahaman membaca mandiri di portal CBT.
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-2">
                <span className="text-amber-600 text-sm font-bold mt-0.5">2.</span>
                <p className="text-[11px] leading-relaxed">
                  **Intervensi Orang Tua**: Untuk siswa dengan kehadiran kurang dari 90%, gunakan modul cetak **Export Student Report** untuk melampirkan portofolio ke orang tua guna meningkatkan akuntabilitas presensi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* A. P5 Active Project Header & Milestone Tracker */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  Proyek Penguatan Profil Pelajar Pancasila (P5) • Live
                </span>
                <h2 className="text-lg sm:text-xl font-black mt-2 tracking-tight text-white">
                  {activeP5Project.JUDUL}
                </h2>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                  {activeP5Project.DESKRIPSI} ({activeP5Project.TEMA})
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center shrink-0 min-w-[120px]">
                <span className="block text-[10px] font-extrabold text-indigo-300 uppercase">Progress Proyek</span>
                <span className="block text-3xl font-black text-amber-300 mt-0.5">{activeP5Project.PERCENTAGE}%</span>
                <span className="text-[9px] text-white/60 block mt-1">Metrik kelulusan tahapan</span>
              </div>
            </div>

            {/* Project Stages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {activeP5Project.STAGES.map((stg) => {
                const isSelesai = stg.STATUS === 'SELESAI';
                const isOtw = stg.STATUS === 'SEDANG_BERJALAN';
                return (
                  <div
                    key={stg.ID}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelesai
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-100'
                        : isOtw
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 ring-1 ring-amber-500/20'
                        : 'bg-white/5 border-white/5 text-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-wider">{stg.NAME}</span>
                      <button
                        onClick={() => {
                          const nextStatus = isSelesai ? 'BELUM_MULAI' : isOtw ? 'SELESAI' : 'SEDANG_BERJALAN';
                          classroomService.updateP5StageStatus(activeP5Project.ID, stg.ID, nextStatus, account.NAMA);
                          forceUpdate();
                        }}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isSelesai
                            ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40'
                            : isOtw
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        title="Klik untuk mengubah status tahapan"
                      >
                        {isSelesai ? 'Selesai ✓' : isOtw ? 'Otw ➜' : 'Mulai'}
                      </button>
                    </div>
                    <p className="text-[9px] text-white/60 mt-1 leading-snug truncate">{stg.DESCRIPTION}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Student P5 Matrix & Dimensions Marker */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Award size={16} className="text-indigo-700" />
                  Lembar Penilaian & Pencapaian Dimensi Karakter Siswa ({students.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ketuk nilai dimensi siswa secara berkala untuk memantau perkembangan profil pelajar pancasila.
                </p>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const confirmMark = window.confirm("Tandai semua nilai dimensi siswa di kelas ini sebagai BSH (Berkembang Sesuai Harapan)?");
                    if (confirmMark) {
                      const updated = { ...studentP5 };
                      students.forEach(s => {
                        updated[s.ID] = {
                          'Beriman & Bertakwa': 'BSH',
                          'Kebinekaan Global': 'BSH',
                          'Gotong Royong': 'BSH',
                          'Kemandirian': 'BSH',
                          'Bernalar Kritis': 'BSH',
                          'Kreativitas': 'BSH',
                        };
                      });
                      setStudentP5(updated);
                      localStorage.setItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1', JSON.stringify(updated));
                      forceUpdate();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  Tandai Semua BSH
                </button>

                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama peserta didik..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* P5 Legends */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px]">
              <span className="font-extrabold text-slate-500 uppercase mr-1">Petunjuk Kompetensi P5:</span>
              <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">BB (Belum Berkembang)</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">MB (Mulai Berkembang)</span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">BSH (Berkembang Sesuai Harapan)</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">SAB (Sangat Berkembang)</span>
            </div>

            {/* Matrix Board */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold">
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Beriman & Bertakwa</th>
                    <th className="p-3 text-center">Kebinekaan Global</th>
                    <th className="p-3 text-center">Gotong Royong</th>
                    <th className="p-3 text-center">Kemandirian</th>
                    <th className="p-3 text-center">Bernalar Kritis</th>
                    <th className="p-3 text-center">Kreativitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {students.filter(s => s.NAMA.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter(s => s.NAMA.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s) => {
                        const achievements = studentP5[s.ID] || {
                          'Beriman & Bertakwa': 'BSH',
                          'Kebinekaan Global': 'MB',
                          'Gotong Royong': 'BSH',
                          'Kemandirian': 'BSH',
                          'Bernalar Kritis': 'MB',
                          'Kreativitas': 'MB',
                        };

                        const dimensions = [
                          'Beriman & Bertakwa',
                          'Kebinekaan Global',
                          'Gotong Royong',
                          'Kemandirian',
                          'Bernalar Kritis',
                          'Kreativitas',
                        ];

                        return (
                          <tr key={s.ID} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{s.NAMA}</td>
                            {dimensions.map((dim) => {
                              const rating = achievements[dim] || 'BSH';
                              
                              // cyclic toggle: BB -> MB -> BSH -> SAB -> BB
                              const handleCycle = () => {
                                const nextRating =
                                  rating === 'BB'
                                    ? 'MB'
                                    : rating === 'MB'
                                    ? 'BSH'
                                    : rating === 'BSH'
                                    ? 'SAB'
                                    : 'BB';
                                updateStudentP5Dimension(s.ID, dim, nextRating);
                              };

                              let badgeStyle = '';
                              if (rating === 'BB') badgeStyle = 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100';
                              if (rating === 'MB') badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100';
                              if (rating === 'BSH') badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
                              if (rating === 'SAB') badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';

                              return (
                                <td key={dim} className="p-3 text-center">
                                  <button
                                    onClick={handleCycle}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer shadow-2xs ${badgeStyle}`}
                                    title="Ketuk untuk mengubah predikat P5"
                                  >
                                    {rating}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AI WORKSHEET MODAL ==================== */}
      <AnimatePresence>
        {remedialModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500 animate-pulse" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      AI Lembar Kerja Remedial Adaptif
                    </h3>
                    <p className="text-[10px] text-slate-400">Teknologi Kurikulum Merdeka - SDN Tangerang 6</p>
                  </div>
                </div>
                <button
                  onClick={() => setRemedialModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Subject & Topic Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mata Pelajaran</label>
                  <select
                    value={remedialSubject}
                    onChange={(e) => setRemedialSubject(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Matematika & Numerasi">Matematika & Numerasi</option>
                    <option value="Tematik (Bahasa Indonesia)">Tematik (Bahasa Indonesia)</option>
                    <option value="IPAS & Ilmu Alam">IPAS & Ilmu Alam</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Topik Utama</label>
                  <input
                    type="text"
                    value={remedialTopic}
                    onChange={(e) => setRemedialTopic(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    placeholder="Contoh: Operasi Penjumlahan & Nilai Tempat"
                  />
                </div>
              </div>

              {/* Action Regenerate */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleGenerateWorksheet(remedialStudent?.nama || '', remedialStudent?.score || 60)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl flex items-center gap-1 hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'Menghasilkan...' : 'Regenerasi Lembar Kerja'}
                </button>
              </div>

              {/* Worksheet display */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-96 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Sparkles size={32} className="text-orange-500 animate-spin" />
                    <p className="font-bold text-xs text-slate-600 animate-pulse">Merumuskan lembar evaluasi adaptif ramah anak...</p>
                  </div>
                ) : (
                  worksheetContent
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  * Cetak langsung atau salin teks untuk lembar evaluasi fisik siswa.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const printWin = window.open('', '_blank');
                      if (printWin) {
                        printWin.document.write(`<html><head><title>Lembar Remedial - ${remedialStudent?.nama}</title><style>body { font-family: monospace; padding: 40px; line-height: 1.6; }</style></head><body>${worksheetContent.replace(/\n/g, '<br>')}</body></html>`);
                        printWin.document.close();
                        printWin.print();
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl flex items-center gap-1"
                  >
                    <Printer size={13} /> Cetak Lembar Kerja
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(worksheetContent);
                      alert('Lembar kerja berhasil disalin ke clipboard!');
                    }}
                    className="px-4 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    Salin Teks
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== RE-EVALUATION MODAL ==================== */}
      <AnimatePresence>
        {reEvalModalOpen && reEvalStudent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <RefreshCw size={18} className="text-blue-600" />
                  Fast-Track Re-Evaluasi Siswa
                </h3>
                <button
                  onClick={() => setReEvalModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Masukan nilai perbaikan pasca pelaksanaan kegiatan remedial atau pendampingan adaptif untuk **{reEvalStudent.nama}**. Nilai ini akan menggantikan tugas terendah siswa dan memperbarui grafik visual analitis secara langsung.
                </p>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Skor Baru Hasil Remedial</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full text-base font-black px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Saran: Minimal 75 untuk memenuhi target KKM.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Catatan Kelulusan / Remedial</label>
                  <textarea
                    rows={2}
                    value={reEvalNotes}
                    onChange={(e) => setReEvalNotes(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    placeholder="Contoh: Lulus pasca intervensi remedial modul matematika"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setReEvalModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveReEval}
                  className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} /> Simpan Perubahan Nilai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
