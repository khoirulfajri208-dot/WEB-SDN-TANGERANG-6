import {
  ClassroomCourse,
  ClassroomAssignment,
  ClassroomSubmission,
  ClassroomReport,
  ForumPost,
  ForumComment,
  AttendanceRecord,
  AttendanceStatus,
  ClassroomQuiz,
  QuizAttempt,
  LearningMaterial,
  ClassScheduleItem,
  ClassroomMedia,
  MediaSubmission,
  MediaType,
  VirtualLiveClassSession,
  ClassroomNotification,
  GradeWeightConfig,
  StudentPortfolioItem,
  PortfolioComment,
  P5Project,
  P5ProjectStage,
} from '../types/classroom';
import { offlineSyncManager } from './offlineSyncManager';
import { progressSyncService } from './progressSyncService';

const STORAGE_KEYS = {
  COURSES: 'BB_CLASSROOM_COURSES',
  ASSIGNMENTS: 'BB_CLASSROOM_ASSIGNMENTS',
  SUBMISSIONS: 'BB_CLASSROOM_SUBMISSIONS',
  REPORTS: 'BB_CLASSROOM_REPORTS',
  FORUM_POSTS: 'BB_CLASSROOM_FORUM_POSTS_V3',
  ATTENDANCE: 'BB_CLASSROOM_ATTENDANCE_V3',
  QUIZZES: 'BB_CLASSROOM_QUIZZES_V3',
  QUIZ_ATTEMPTS: 'BB_CLASSROOM_QUIZ_ATTEMPTS_V3',
  MATERIALS: 'BB_CLASSROOM_MATERIALS_V3',
  SCHEDULES: 'BB_CLASSROOM_SCHEDULES_V3',
  MEDIA: 'BB_CLASSROOM_MEDIA_V1',
  MEDIA_SUBMISSIONS: 'BB_CLASSROOM_MEDIA_SUBMISSIONS_V1',
  LIVE_CLASSES: 'BB_CLASSROOM_LIVE_CLASSES_V1',
  NOTIFICATIONS: 'BB_CLASSROOM_NOTIFICATIONS_V1',
  GRADE_WEIGHTS: 'BB_CLASSROOM_GRADE_WEIGHTS_V1',
  PORTFOLIO: 'BB_CLASSROOM_PORTFOLIO_V1',
  P5_PROJECTS: 'BB_CLASSROOM_P5_PROJECTS_V1',
  SEEDED: 'BB_CLASSROOM_SEEDED_V4',
};

const nowISO = () => new Date().toISOString();

const DEFAULT_P5_PROJECTS: P5Project[] = [
  {
    ID: 'P5-PRJ-KLS1',
    KELAS: 'Kelas 1',
    JUDUL: 'Kearifan Lokal: Makanan Tradisional Sehat Nusantara',
    TEMA: 'Kearifan Lokal',
    DESKRIPSI: 'Mengenal dan membuat jajanan pasar tradisional sehat khas daerah Tangerang.',
    DIMENSI: ['Kebinekaan Global', 'Gotong Royong', 'Kreatif'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Kue Tradisional', DESCRIPTION: 'Mengenal klepon, getuk, dan kue talam', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-15' },
      { ID: 'STG-2', NAME: 'Tahap 2: Wawancara Pembuat Jajanan', DESCRIPTION: 'Bertanya kepada pembuat kue tradisional setempat', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-25' },
      { ID: 'STG-3', NAME: 'Tahap 3: Praktik Membuat Kue Bersama', DESCRIPTION: 'Praktik membuat jajanan pasar sehat di sekolah', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Festival Kuliner & Gelar Karya', DESCRIPTION: 'Bazar jajanan pasar dan evaluasi hasil belajar', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS2',
    KELAS: 'Kelas 2',
    JUDUL: 'Bhinneka Tunggal Ika: Indahnya Keragaman Budaya Sekolahku',
    TEMA: 'Bhinneka Tunggal Ika',
    DESKRIPSI: 'Menghargai perbedaan suku, pakaian adat, dan tarian tradisional teman-teman di kelas.',
    DIMENSI: ['Kebinekaan Global', 'Beriman & Bertakwa', 'Gotong Royong'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pemetaan Suku & Asal-Usul', DESCRIPTION: 'Mengenal keberagaman budaya teman sekelas', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-10' },
      { ID: 'STG-2', NAME: 'Tahap 2: Pembuatan Mading Pakaian Adat', DESCRIPTION: 'Kreativitas gambar & kliping busana nusantara', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pentas Seni & Lagu Daerah', DESCRIPTION: 'Penampilan lagu & tarian tradisional kelas', STATUS: 'BELUM_MULAI' },
      { ID: 'STG-4', NAME: 'Tahap 4: Refleksi Kebinekaan', DESCRIPTION: 'Jurnal pengalaman bertoleransi & kebersamaan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 38,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS3',
    KELAS: 'Kelas 3',
    JUDUL: 'Kewirausahaan: Apotek Hidup & Olahan Herbal Sekolah',
    TEMA: 'Kewirausahaan',
    DESKRIPSI: 'Menanam tanaman obat keluarga (TOGA) dan mengolahnya menjadi minuman sehat bernilai jual.',
    DIMENSI: ['Mandiri', 'Kreatif', 'Bernalar Kritis'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Tanaman Obat (TOGA)', DESCRIPTION: 'Mengenal jahe, kunyit, temulawak, dan serai', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-05' },
      { ID: 'STG-2', NAME: 'Tahap 2: Menanam TOGA di Pot Daur Ulang', DESCRIPTION: 'Praktik penanaman bibit di kebun sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-18' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pengolahan Minuman Kunyit Asam', DESCRIPTION: 'Pembuatan jamu & minuman herbal segar', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Pasar Produk Herbal Cilik', DESCRIPTION: 'Penjualan minuman herbal saat hari bebas kendaraan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS4',
    KELAS: 'Kelas 4',
    JUDUL: 'Gaya Hidup Berkelanjutan: Pengolahan Sampah Organik & Bank Sampah',
    TEMA: 'Gaya Hidup Berkelanjutan',
    DESKRIPSI: 'Mengajarkan siswa pemilahan sampah, komposting pupuk organik, dan pengelolaan bank sampah sekolah.',
    DIMENSI: ['Gotong Royong', 'Bernalar Kritis', 'Kreatif'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Sosialisasi & Audit Sampah Sekolah', DESCRIPTION: 'Mengenal jenis sampah organik & anorganik di sekitar sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-10' },
      { ID: 'STG-2', NAME: 'Tahap 2: Merancang Komposter Takakura', DESCRIPTION: 'Pembuatan wadah kompos dan pemilahan sampah harian', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-20' },
      { ID: 'STG-3', NAME: 'Tahap 3: Monitoring Fermentasi Kompos', DESCRIPTION: 'Pengukuran suhu dan pembalikan kompos berkala', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Panen Karya Pupuk & Pameran P5', DESCRIPTION: 'Pemasaran pupuk organik untuk kebun sekolah dan refleksi', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS5',
    KELAS: 'Kelas 5',
    JUDUL: 'Rekayasa dan Teknologi: Sistem Penyiraman Otomatis Tanaman',
    TEMA: 'Rekayasa dan Teknologi',
    DESKRIPSI: 'Merancang alat penyiram tanaman berbasis sensor kelembaban tanah sederhana.',
    DIMENSI: ['Bernalar Kritis', 'Kreatif', 'Mandiri'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Komponen & Rangkaian', DESCRIPTION: 'Pemahaman prinsip kapilaritas & sakelar listrik', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-12' },
      { ID: 'STG-2', NAME: 'Tahap 2: Desain Maket & Perakitan Alat', DESCRIPTION: 'Merangkai pompa mini dan selang penyiram', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-3', NAME: 'Tahap 3: Uji Coba Penyiraman Otomatis', DESCRIPTION: 'Pengujian efisiensi air di taman kelas', STATUS: 'BELUM_MULAI' },
      { ID: 'STG-4', NAME: 'Tahap 4: Laporan Inovasi & Presentasi Karya', DESCRIPTION: 'Presentasi hasil karya rekayasa di depan wali murid', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 38,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS6',
    KELAS: 'Kelas 6',
    JUDUL: 'Suara Demokrasi: Pemilihan Ketua OSIS / Dokter Cilik Sekolah',
    TEMA: 'Suara Demokrasi',
    DESKRIPSI: 'Simulasi pemilu sekolah dengan asas Luber Jurdil, perumusan visi mosi, dan pemungutan suara digital.',
    DIMENSI: ['Bernalar Kritis', 'Gotong Royong', 'Kebinekaan Global'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pendaftaran & Penyampaian Visi-Misi', DESCRIPTION: 'Pendaftaran calon ketua & kampanye dialogis', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-08' },
      { ID: 'STG-2', NAME: 'Tahap 2: Debat Terbuka Kandidat', DESCRIPTION: 'Adu gagasan program kerja pengembangan sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-19' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pemungutan Suara E-Voting', DESCRIPTION: 'Pelaksanaan pencoblosan/e-voting di TPS kelas', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Penghitungan Suara & Pelantikan', DESCRIPTION: 'Pengumuman pemenang & pidato penutupan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  }
];
const ts = () => nowISO().replace('T', ' ').substring(0, 19);
const todayDate = () => new Date().toISOString().slice(0, 10);

const DEFAULT_COURSES: ClassroomCourse[] = [
  {
    ID: 'CRS-001',
    KODE_KELAS: 'KLS1-2026',
    NAMA: 'Kelas 1 - Tema Lingkungan & Diriku',
    DESKRIPSI: 'Pembelajaran Tematik Terpadu Kurikulum Merdeka untuk siswa Kelas 1. Bahasa Indonesia, Matematika, Seni & IPAS.',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    SISWA_IDS: ['SISWA-001', 'SISWA-002', 'SISWA-003', 'SISWA-004'],
    KELAS_TINGKAT: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-002',
    KODE_KELAS: 'KLS2-2026',
    NAMA: 'Kelas 2 - Tema Bermain di Lingkunganku',
    DESKRIPSI: 'Pembelajaran Tematik Terpadu untuk siswa Kelas 2. Penguatan literasi membaca, berhitung dan karakter.',
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.',
    SISWA_IDS: ['SISWA-005', 'SISWA-006', 'SISWA-007', 'SISWA-008'],
    KELAS_TINGKAT: 'Kelas 2',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-003',
    KODE_KELAS: 'KLS3-2026',
    NAMA: 'Kelas 3 - Tema Selalu Berhemat Energi',
    DESKRIPSI: 'Pembelajaran Tematik Tema 1-4 untuk siswa Kelas 3 dengan fokus literasi, numerasi dan sains lingkungan.',
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    SISWA_IDS: ['SISWA-009', 'SISWA-010', 'SISWA-011', 'SISWA-012'],
    KELAS_TINGKAT: 'Kelas 3',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-004',
    KODE_KELAS: 'KLS4-2026',
    NAMA: 'Kelas 4 - Tema Indahnya Kebersamaan',
    DESKRIPSI: 'Pembelajaran Tematik IPAS, Bahasa Indonesia, dan Pendidikan Pancasila Kelas 4.',
    GURU_ID: 'ACC-CLS-005',
    GURU_NAMA: 'Dewi Lestari, S.Pd.SD.',
    SISWA_IDS: ['SISWA-013', 'SISWA-014', 'SISWA-015', 'SISWA-016'],
    KELAS_TINGKAT: 'Kelas 4',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-005',
    KODE_KELAS: 'KLS5-2026',
    NAMA: 'Kelas 5 - Tema Ekosistem & Koding Dasar',
    DESKRIPSI: 'Pembelajaran IPAS Ekosistem, Matematika Pecahan, dan Dasar Algoritma Koding SD Kelas 5.',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    SISWA_IDS: ['SISWA-017', 'SISWA-018', 'SISWA-019', 'SISWA-020'],
    KELAS_TINGKAT: 'Kelas 5',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-006',
    KODE_KELAS: 'KLS6-2026',
    NAMA: 'Kelas 6 - Tema Persatuan dalam Perbedaan & Koding Lanjut',
    DESKRIPSI: 'Persiapan Asesmen Standarisasi Pendidikan Daerah, Pembelajaran Tematik dan Modul Koding Kelas 6.',
    GURU_ID: 'ACC-CLS-007',
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
    SISWA_IDS: ['SISWA-021', 'SISWA-022', 'SISWA-023', 'SISWA-024'],
    KELAS_TINGKAT: 'Kelas 6',
    CREATED_AT: nowISO(),
  },
];

const DEFAULT_ASSIGNMENTS: ClassroomAssignment[] = [
  // Kelas 1
  {
    ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Tugas Menggambar Pohon di Sekitar Rumah',
    DESKRIPSI: 'Gambarlah 1 pohon yang ada di sekitar rumahmu, lalu ceritakan dalam 3 kalimat mengapa pohon itu penting bagi udara bersih.',
    DEADLINE: '2026-09-05',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ASG-002',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Materi: Mengenal Huruf Vokal dan Konsonan',
    DESKRIPSI: 'Bacalah materi huruf vokal A I U E O beserta contoh kata benda di kelas. Lengkapi latihan di buku halaman 12-14.',
    DEADLINE: '2026-09-03',
    TYPE: 'MATERI',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },

  // Kelas 2
  {
    ID: 'ASG-003',
    COURSE_ID: 'CRS-002',
    JUDUL: 'Latihan Menulis Huruf Tegak Bersambung',
    DESKRIPSI: 'Salinlah teks pendek tentang gotong royong di buku halus kasar dengan rapi dan benar.',
    DEADLINE: '2026-09-06',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.',
  },

  // Kelas 3
  {
    ID: 'ASG-004',
    COURSE_ID: 'CRS-003',
    JUDUL: 'Ulangan Harian 1 - Operasi Penjumlahan & Pengurangan',
    DESKRIPSI: 'Kerjakan 20 soal penjumlahan dan pengurangan ratusan dengan cara bersusun panjang dan pendek.',
    DEADLINE: '2026-09-08',
    TYPE: 'ULANGAN',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
  },

  // Kelas 4
  {
    ID: 'ASG-005',
    COURSE_ID: 'CRS-004',
    JUDUL: 'Proyek IPAS: Rantai Makanan Sawah',
    DESKRIPSI: 'Buatlah bagan rantai makanan pada ekosistem sawah dan sebutkan peran produsen, konsumen 1, 2, dan pengurai.',
    DEADLINE: '2026-09-09',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-005',
    GURU_NAMA: 'Dewi Lestari, S.Pd.SD.',
  },

  // Kelas 5
  {
    ID: 'ASG-006',
    COURSE_ID: 'CRS-005',
    JUDUL: 'Materi & Praktik Koding: Logika Percabangan IF-ELSE',
    DESKRIPSI: 'Pelajari bab 2 Buku Koding Erlangga halaman 25-34 tentang kondisi Logika IF-THEN dalam menyelesaikan masalah matematika.',
    DEADLINE: '2026-09-10',
    TYPE: 'MATERI',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
  },

  // Kelas 6
  {
    ID: 'ASG-007',
    COURSE_ID: 'CRS-006',
    JUDUL: 'Latihan Mandiri Persiapan Asesmen - IPA & Matematika',
    DESKRIPSI: 'Kerjakan paket soal latihan 1 bab Sistem Tata Surya dan Pengolahan Data Statistik Sederhana.',
    DEADLINE: '2026-09-11',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-007',
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
  },
];

const DEFAULT_SUBMISSIONS: ClassroomSubmission[] = [
  {
    ID: 'SUB-001',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    ISI: 'Saya menggambar pohon mangga di halaman depan rumah. Pohon mangga menghasilkan oksigen bersih dan keteduhan di siang hari.',
    FILE_LINK: 'https://drive.google.com/file/d/tugas-gambar-aisyah.jpg',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-002',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Bima Sakti Pratama',
    ISI: 'Pohon beringin rindang di dekat taman bermain. Di atas pohon ada sarang burung gereja yang berkicau riang.',
    FILE_LINK: 'https://drive.google.com/file/d/pohon-bima.pdf',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-003',
    ASSIGNMENT_ID: 'ASG-003',
    COURSE_ID: 'CRS-002',
    SISWA_ID: 'SISWA-005',
    SISWA_NAMA: 'Fadil Ramadhan Al-Farisi',
    ISI: 'Telah menulis teks cerita gotong royong 3 paragraf di buku halus kasar dengan rapi sesuai kaidah PUEBI.',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-004',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-004',
    SISWA_NAMA: 'Zahra Aulia Nabila',
    ISI: 'Pohon kelapa di kebun kakek sangat tinggi. Daunnya bisa untuk ketupat dan buahnya untuk minuman segar.',
    SUBMITTED_AT: ts(),
    STATUS: 'GRADED',
    NILAI: 95,
    FEEDBACK: 'Sangat bagus Zahra! Gambar rapi dan penjelasannya sangat lengkap.',
    GRADED_BY: 'Nurul Hidayah, S.Pd.',
    GRADED_AT: ts(),
  },
];

const DEFAULT_REPORTS: ClassroomReport[] = [
  {
    ID: 'RPT-001',
    JUDUL: 'Laporan Bulanan Pembelajaran Kelas 1 - Agustus 2026',
    KATEGORI: 'Laporan Bulanan',
    ISI:
      'Pembelajaran Kelas 1 pada bulan Agustus 2026 berjalan dengan baik dan kondusif. Capaian: 92% siswa telah mengenal seluruh huruf vokal dan konsonan dasar. Sebanyak 4 siswa aktif mengumpulkan semua tugas tepat waktu.',
    PERIODE: '2026-08',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    CREATED_AT: nowISO(),
    STATUS: 'DIKIRIM',
  },
  {
    ID: 'RPT-002',
    JUDUL: 'Laporan Progres Literasi & Numerasi Kelas 3 - Agustus 2026',
    KATEGORI: 'Laporan Bulanan',
    ISI:
      'Kegiatan belajar mengajar Kelas 3 menitikberatkan pada pemahaman soal cerita numerasi matematika dan literasi fiksi. Hasil ulangan harian menunjukkan rata-rata nilai kelas 84.5.',
    PERIODE: '2026-08',
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    CREATED_AT: nowISO(),
    STATUS: 'DINILAI',
    NILAI: 90,
    FEEDBACK: 'Sangat baik. Teruskan metode scaffolding numerasi dengan alat peraga persediaan sekolah.',
    GRADED_BY: 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    GRADED_AT: nowISO(),
  },
];

const DEFAULT_FORUM_POSTS: ForumPost[] = [
  {
    ID: 'POST-001',
    KELAS: 'Kelas 1',
    COURSE_ID: 'CRS-001',
    AUTHOR_ID: 'ACC-CLS-002',
    AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Selamat Datang di Portal Belajar Kelas 1 Tematik!',
    CONTENT: 'Assalamu’alaikum anak-anak hebat dan Bapak/Ibu wali murid. Mari kita biasakan membaca buku cerita 15 menit setiap pagi sebelum jam pelajaran dimulai ya! Jangan lupa mengisi presensi mandiri harian.',
    TAG: 'PENGUMUMAN',
    IS_PINNED: true,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-001', 'SISWA-002', 'ACC-CLS-001'],
    COMMENTS: [
      {
        ID: 'CMT-001',
        AUTHOR_ID: 'SISWA-001',
        AUTHOR_NAMA: 'Ahmad Zaki Pratama',
        AUTHOR_ROLE: 'SISWA',
        CONTENT: 'Siap Bu Guru, saya sudah membaca buku fabel si kancil pagi ini!',
        CREATED_AT: nowISO(),
      },
      {
        ID: 'CMT-002',
        AUTHOR_ID: 'ACC-CLS-002',
        AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Hebat Zaki, terus pertahankan ya!',
        CREATED_AT: nowISO(),
      }
    ]
  },
  {
    ID: 'POST-002',
    KELAS: 'Kelas 3',
    COURSE_ID: 'CRS-003',
    AUTHOR_ID: 'ACC-CLS-004',
    AUTHOR_NAMA: 'Ahmad Fauzi, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Persiapan Kuis Interaktif Numerasi Pecahan Sederhana',
    CONTENT: 'Halo siswa kelas 3! Hari Kamis kita akan mengadakan Kuis Online CBT 15 butir soal. Silakan pelajari kembali modul ajar bab 2 dan latihan soal di menu Modul Belajar.',
    TAG: 'INFO_SEKOLAH',
    IS_PINNED: false,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-009', 'SISWA-010'],
    COMMENTS: []
  },
  {
    ID: 'POST-003',
    KELAS: 'Kelas 5',
    COURSE_ID: 'CRS-005',
    AUTHOR_ID: 'ACC-CLS-006',
    AUTHOR_NAMA: 'M. Rizky Pratama, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Tantangan Koding Mingguan: Logika Algoritma Dasar',
    CONTENT: 'Siapa yang sudah mencoba menyelesaikan teka-teki labirin koding di modul? Ceritakan di kolom komentar strategi apa yang kalian gunakan untuk memecahkan blok percabangan IF-ELSE.',
    TAG: 'DISKUSI',
    IS_PINNED: true,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-017', 'SISWA-018', 'SISWA-019'],
    COMMENTS: [
      {
        ID: 'CMT-003',
        AUTHOR_ID: 'SISWA-017',
        AUTHOR_NAMA: 'Fajar Hidayat',
        AUTHOR_ROLE: 'SISWA',
        CONTENT: 'Saya pakai cara belok kanan dulu pak kalau jalannya buntu!',
        CREATED_AT: nowISO(),
      }
    ]
  }
];

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    ID: 'ATT-001',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Ahmad Zaki Pratama',
    STATUS: 'HADIR',
    CATATAN: 'Tepat waktu pukul 07.15',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-002',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Siti Aisyah Putri',
    STATUS: 'HADIR',
    CATATAN: 'Tepat waktu',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-003',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-003',
    SISWA_NAMA: 'Budi Santoso',
    STATUS: 'IZIN',
    CATATAN: 'Surat izin keluarga',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-004',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-004',
    SISWA_NAMA: 'Dewi Anggraini',
    STATUS: 'HADIR',
    CATATAN: 'Hadir',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
];

const DEFAULT_QUIZZES: ClassroomQuiz[] = [
  {
    ID: 'QZ-001',
    COURSE_ID: 'CRS-001',
    KELAS: 'Kelas 1',
    JUDUL: 'Kuis Harian 1: Mengenal Lingkungan & Benda Hidup',
    DESKRIPSI: 'Uji pemahaman tentang benda hidup dan tak hidup di lingkungan sekitar rumah dan sekolah.',
    DURASI_MENIT: 15,
    KKM: 70,
    DEADLINE: '2026-09-10',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q1',
        SOAL: 'Manakah di bawah ini yang termasuk benda hidup?',
        PILIHAN: ['Pohon Mangga', 'Batu Kerikil', 'Sepeda Mini', 'Meja Kayu'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: 'Pohon mangga bernapas, bertumbuh, dan membutuhkan air, sehingga merupakan makhluk/benda hidup.',
      },
      {
        ID: 'Q2',
        SOAL: 'Ciri utama dari makhluk hidup adalah...',
        PILIHAN: ['Tidak butuh makan', 'Dapat bernapas dan tumbuh', 'Tidak bisa bergerak', 'Terbuat dari plastik'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: 'Semua makhluk hidup bernapas, bertumbuh kembang, dan membutuhkan nutrisi.',
      },
      {
        ID: 'Q3',
        SOAL: 'Huruf vokal pada kata "SEKOLAH" adalah...',
        PILIHAN: ['S, K, L, H', 'E, O, A', 'S, E, K', 'O, L, A'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: 'Huruf vokal pada SEKOLAH adalah E, O, dan A.',
      },
      {
        ID: 'Q4',
        SOAL: 'Budi memiliki 4 apel. Ibu memberi 3 apel lagi. Berapakah jumlah apel Budi sekarang?',
        PILIHAN: ['5 apel', '6 apel', '7 apel', '8 apel'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: '4 + 3 = 7 apel.',
      }
    ]
  },
  {
    ID: 'QZ-002',
    COURSE_ID: 'CRS-003',
    KELAS: 'Kelas 3',
    JUDUL: 'Kuis CBT Matematika: Nilai Tempat & Pecahan Sederhana',
    DESKRIPSI: 'Penilaian harian kemampuan dasar operasi matematika dan pecahan 1/2, 1/3, 1/4.',
    DURASI_MENIT: 20,
    KKM: 75,
    DEADLINE: '2026-09-12',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q201',
        SOAL: 'Angka 7 pada bilangan 4.752 menempati nilai tempat...',
        PILIHAN: ['Ribuan', 'Ratusan', 'Puluhan', 'Satuan'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: '4 menempati ribuan, 7 menempati ratusan, 5 menempati puluhan, 2 menempati satuan.',
      },
      {
        ID: 'Q202',
        SOAL: 'Sebuah semangka dipotong menjadi 4 bagian sama besar. Satu bagian bernilai pecahan...',
        PILIHAN: ['1/2', '1/3', '1/4', '4/1'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: 'Satu dari 4 bagian yang sama besar ditulis sebagai 1/4 (seperempat).',
      },
      {
        ID: 'Q203',
        SOAL: 'Hasil dari 350 + 275 - 125 adalah...',
        PILIHAN: ['500', '525', '475', '550'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: '350 + 275 = 625. Kemudian 625 - 125 = 500.',
      }
    ]
  },
  {
    ID: 'QZ-003',
    COURSE_ID: 'CRS-005',
    KELAS: 'Kelas 5',
    JUDUL: 'Ujian Harian IPAS & Koding: Ekosistem & Algoritma',
    DESKRIPSI: 'Evaluasi kompetensi jaring-jaring makanan dan pola alur pikir komputasional.',
    DURASI_MENIT: 25,
    KKM: 75,
    DEADLINE: '2026-09-15',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q301',
        SOAL: 'Dalam ekosistem sawah, peran tanaman padi adalah sebagai...',
        PILIHAN: ['Konsumen Tingkat 1', 'Konsumen Puncak', 'Produsen', 'Pengurai / Dekomposer'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: 'Tumbuhan hijau berfotosintesis menghasilkan makanan sendiri sehingga bertindak sebagai produsen.',
      },
      {
        ID: 'Q302',
        SOAL: 'Urutan langkah-langkah logis yang teratur untuk menyelesaikan suatu masalah disebut...',
        PILIHAN: ['Algoritma', 'Variabel', 'Sintaks', 'Hardware'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: 'Algoritma adalah deretan instruksi logis dan sistematis untuk memecahkan suatu persoalan komputasi.',
      }
    ]
  }
];

const DEFAULT_MATERIALS: LearningMaterial[] = [
  {
    ID: 'MAT-001',
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    JUDUL: 'Modul Membaca Cepat: Suku Kata Ba-Bi-Bu-Be-Bo',
    DESKRIPSI: 'Bahan ajar pengenalan konsonan bergambar untuk melatih kefasihan membaca permulaan.',
    TIPE: 'EBOOK',
    URL_LINK: 'https://buku.kemdikbud.go.id',
    FILE_SIZE: '2.4 MB',
    RINGKASAN_KONTEN: 'Latihan pengucapan vokal bergambar huruf B, C, D dan pembentukan kata sehari-hari (Buku, Bola, Baju).',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'MAT-002',
    KELAS: 'Kelas 1',
    MAPEL: 'Seni Budaya & Prakarya',
    JUDUL: 'Video Panduan: Menggambar Hewan dari Angka Dasar',
    DESKRIPSI: 'Teknik mudah anak SD menggambar burung dari angka 2 dan ikan dari angka 3.',
    TIPE: 'VIDEO',
    URL_LINK: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    FILE_SIZE: '10 Menit',
    RINGKASAN_KONTEN: 'Panduan video interaktif melatih motorik halus dan kreativitas visual anak dengan media krayon.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'MAT-003',
    KELAS: 'Kelas 3',
    MAPEL: 'Matematika & IPAS',
    JUDUL: 'LKPD Siswa: Eksperimen Sederhana Energi Alternatif',
    DESKRIPSI: 'Lembar Kerja Peserta Didik mengamati kincir angin kertas dan pemanfaatan panas matahari.',
    TIPE: 'LKPD',
    URL_LINK: 'https://www.youtube.com/watch?v=kY41gXhLdQ8',
    FILE_SIZE: '1.2 MB',
    RINGKASAN_KONTEN: 'Petunjuk praktikum rumah aman dengan bahan kertas origami, sedotan, dan jarum pentul dengan pengawasan orang tua.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
  },
  {
    ID: 'MAT-004',
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    JUDUL: 'Buku Saku Koding: Berpikir Komputasional & Blok Scratch',
    DESKRIPSI: 'Modul ajar koding dasar membuat animasi interaktif dan game matematika sederhana.',
    TIPE: 'EBOOK',
    URL_LINK: 'https://scratch.mit.edu',
    FILE_SIZE: '4.8 MB',
    RINGKASAN_KONTEN: 'Pengenalan sprite, backdrop, loops (pengulangan), dan sensor keyboard untuk kuis sains interaktif.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
  },
  {
    ID: 'MAT-005',
    KELAS: 'Kelas 6',
    MAPEL: 'Pendidikan Pancasila & Kewarganegaraan',
    JUDUL: 'Rangkuman Materi: Nilai-Nilai Luhur Gotong Royong Bangsa',
    DESKRIPSI: 'Penerapan sila-sila Pancasila dalam kehidupan berbangsa dan bermasyarakat di lingkungan sekolah.',
    TIPE: 'RANGKUMAN',
    URL_LINK: 'https://ditpsd.kemdikbud.go.id',
    FILE_SIZE: '850 KB',
    RINGKASAN_KONTEN: 'Contoh nyata toleransi beragama, musyawarah mufakat di kelas, dan keadilan sosial bagi seluruh rakyat.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
  }
];

const DEFAULT_SCHEDULES: ClassScheduleItem[] = [
  // Kelas 1
  { ID: 'SCH-101', KELAS: 'Kelas 1', HARI: 'Senin', JAM_MULAI: '07:00', JAM_SELESAI: '07:45', MAPEL: 'Upacara Bendera & Pendidikan Karakter', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Lapangan Sekolah' },
  { ID: 'SCH-102', KELAS: 'Kelas 1', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:30', MAPEL: 'Tematik (Bahasa Indonesia & Literasi)', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-103', KELAS: 'Kelas 1', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'Pendidikan Agama & Budi Pekerti', GURU_NAMA: 'Ust. Abdul Karim, S.Pd.I.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-104', KELAS: 'Kelas 1', HARI: 'Rabu', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'Matematika Dasar & Numerasi', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-105', KELAS: 'Kelas 1', HARI: 'Kamis', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'PJOK (Pendidikan Jasmani & Olahraga)', GURU_NAMA: 'Rian Pratama, S.Pd.', RUANGAN: 'Lapangan Olahraga' },
  { ID: 'SCH-106', KELAS: 'Kelas 1', HARI: 'Jumat', JAM_MULAI: '07:00', JAM_SELESAI: '08:30', MAPEL: 'Senam Pagi, Literasi & Seni Budaya', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Seni' },

  // Kelas 2
  { ID: 'SCH-201', KELAS: 'Kelas 2', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:45', MAPEL: 'Tematik Terpadu', GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.', RUANGAN: 'Ruang Kelas 2' },
  { ID: 'SCH-202', KELAS: 'Kelas 2', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:30', MAPEL: 'Matematika & Berhitung Cepat', GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.', RUANGAN: 'Ruang Kelas 2' },
  
  // Kelas 3
  { ID: 'SCH-301', KELAS: 'Kelas 3', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '10:00', MAPEL: 'Bahasa Indonesia & Literasi Fiksi', GURU_NAMA: 'Ahmad Fauzi, S.Pd.', RUANGAN: 'Ruang Kelas 3' },
  { ID: 'SCH-302', KELAS: 'Kelas 3', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:45', MAPEL: 'IPAS (Ilmu Pengetahuan Alam & Sosial)', GURU_NAMA: 'Ahmad Fauzi, S.Pd.', RUANGAN: 'Ruang Kelas 3' },

  // Kelas 4
  { ID: 'SCH-401', KELAS: 'Kelas 4', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '10:15', MAPEL: 'IPAS Terpadu & Ekosistem', GURU_NAMA: 'Dewi Lestari, S.Pd.SD.', RUANGAN: 'Ruang Kelas 4' },

  // Kelas 5
  { ID: 'SCH-501', KELAS: 'Kelas 5', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:45', MAPEL: 'Matematika & Pecahan', GURU_NAMA: 'M. Rizky Pratama, S.Pd.', RUANGAN: 'Ruang Kelas 5' },
  { ID: 'SCH-502', KELAS: 'Kelas 5', HARI: 'Rabu', JAM_MULAI: '08:00', JAM_SELESAI: '10:00', MAPEL: 'Informatika & Koding SD', GURU_NAMA: 'M. Rizky Pratama, S.Pd.', RUANGAN: 'Lab Komputer SDN 6' },
];

const DEFAULT_MEDIA: ClassroomMedia[] = [
  {
    ID: 'MED-001',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Video Interaktif: Pengenalan Lingkungan & Alam Sekitar',
    DESKRIPSI: 'Video animasi interaktif mengenal tanaman, hewan, dan cara merawat kebersihan lingkungan rumah.',
    KATEGORI: 'VIDEO',
    MEDIA_URL: 'https://www.youtube.com/watch?v=sample-lingkungan',
    TUJUAN_PEMBELAJARAN: 'Siswa dapat mengidentifikasi 3 cara merawat tanaman dan menjaga kebersihan lingkungan.',
    TUGAS_INTERAKTIF: 'Sebutkan apa tanaman kesukaanmu di rumah dan bagaimana caramu menyiramnya setiap hari?',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    CREATED_AT: nowISO(),
    TARGET_KELAS: 'Kelas 1',
  },
  {
    ID: 'MED-002',
    COURSE_ID: 'CRS-005',
    JUDUL: 'Modul Digital & Simulasi Logika Koding IF-THEN',
    DESKRIPSI: 'Modul e-book interaktif pengenalan dasar algoritma percabangan untuk siswa sekolah dasar.',
    KATEGORI: 'MODUL_EBOOK',
    MEDIA_URL: 'https://drive.google.com/file/d/sample-modul-koding',
    TUJUAN_PEMBELAJARAN: 'Siswa memahami alur logika pengambilan keputusan (IF-ELSE) dalam kehidupan sehari-hari.',
    TUGAS_INTERAKTIF: 'Buatlah 1 contoh kalimat syarat (Jika ... maka ...) yang biasa kamu lakukan sebelum berangkat ke sekolah.',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    CREATED_AT: nowISO(),
    TARGET_KELAS: 'Kelas 5',
  }
];

const DEFAULT_MEDIA_SUBMISSIONS: MediaSubmission[] = [
  {
    ID: 'MSUB-001',
    MEDIA_ID: 'MED-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    STATUS: 'SELESAI',
    JAWABAN_TUGAS: 'Tanaman kesukaan saya adalah bunga melati di teras rumah. Setiap sore saya siram dan bersihkan daunnya.',
    UPDATED_AT: nowISO(),
    NILAI: 90,
    FEEDBACK: 'Sangat bagus dan rajin! Pertahankan semangatnya ya Aisyah.',
  }
];

const DEFAULT_LIVE_CLASSES: VirtualLiveClassSession[] = [
  {
    ID: 'LIVE-101',
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    JUDUL: 'Sesi Tatap Muka: Diskusi & Storytelling Tematik',
    DESKRIPSI: 'Sesi live Google Meet menyapa siswa kelas 1, membaca dongeng bersama, dan penugasan melukis.',
    TANGGAL: todayDate(),
    JAM_MULAI: '08:30',
    JAM_SELESAI: '09:30',
    MEET_URL: 'https://meet.google.com/abc-defg-hij',
    PLATFORM: 'GOOGLE_MEET',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    STATUS: 'BERLANGSUNG',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'LIVE-102',
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    JUDUL: 'Live Coding Scratch: Membuat Game Matematika Interaktif',
    DESKRIPSI: 'Demonstrasi live streaming cara menyusun blok algoritma matematika di Scratch.',
    TANGGAL: todayDate(),
    JAM_MULAI: '10:00',
    JAM_SELESAI: '11:30',
    MEET_URL: 'https://meet.google.com/xyz-uvwx-rst',
    PLATFORM: 'GOOGLE_MEET',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    STATUS: 'JADWAL',
    CREATED_AT: nowISO(),
  }
];

const DEFAULT_NOTIFICATIONS: ClassroomNotification[] = [
  {
    ID: 'NOTIF-001',
    KELAS: 'Kelas 1',
    TITLE: '🎥 Kelas Daring Tatap Muka Hari Ini!',
    MESSAGE: 'Guru Ibu Nurul Hidayah telah mendiskusikan Sesi Live Storytelling pukul 08:30 WIB.',
    TYPE: 'LIVE_CLASS',
    LINK_PAGE: 'live_class',
    CREATED_AT: nowISO(),
    IS_READ: false,
  },
  {
    ID: 'NOTIF-002',
    KELAS: 'Kelas 1',
    TITLE: '⏰ Pengingat Tugas: Menggambar Pohon',
    MESSAGE: 'Tenggat waktu pengumpulan tugas menggambar pohon mendekati batas waktu.',
    TYPE: 'DEADLINE',
    LINK_PAGE: 'assignments',
    CREATED_AT: nowISO(),
    IS_READ: false,
  },
  {
    ID: 'NOTIF-003',
    KELAS: 'Kelas 1',
    TITLE: '🏆 Lencana Prestasi Baru Terbuka!',
    MESSAGE: 'Selamat! Kamu telah meraih lencana Pembelajar Cepat karena mengumpulkan tugas tepat waktu.',
    TYPE: 'GRADE',
    LINK_PAGE: 'dashboard',
    CREATED_AT: nowISO(),
    IS_READ: false,
  }
];

const DEFAULT_GRADE_WEIGHTS: GradeWeightConfig[] = [
  {
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    BOBOT_TUGAS: 40,
    BOBOT_KUIS: 30,
    BOBOT_PRESENSI: 20,
    BOBOT_PORTOFOLIO: 10,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'Guru Kelas 1',
  },
  {
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    BOBOT_TUGAS: 35,
    BOBOT_KUIS: 35,
    BOBOT_PRESENSI: 15,
    BOBOT_PORTOFOLIO: 15,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'M. Rizky Pratama, S.Pd.',
  }
];

const DEFAULT_PORTFOLIO: StudentPortfolioItem[] = [
  {
    ID: 'PORT-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    KELAS: 'Kelas 1',
    JUDUL: 'Lukisan Pohon Mangga & Taman Rumahku',
    DESKRIPSI: 'Hasil karya seni gambar cat air tentang kebersihan lingkungan rumah dan pentingnya menjaga keasrian taman.',
    KATEGORI: 'KARYA_SENI',
    IMAGE_URL: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    LIKES: ['SISWA-002', 'ACC-CLS-002'],
    COMMENTS: [
      {
        ID: 'PC-101',
        AUTHOR_ID: 'ACC-CLS-002',
        AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Warna cat airnya sangat indah Aisyah! Pemilihan kontras warnanya menunjukkan bakat seni melukis yang kuat.',
        CREATED_AT: nowISO(),
      }
    ],
    CREATED_AT: nowISO(),
    IS_FEATURED: true,
  },
  {
    ID: 'PORT-002',
    SISWA_ID: 'SISWA-017',
    SISWA_NAMA: 'Fajar Kurniawan',
    KELAS: 'Kelas 5',
    JUDUL: 'Game Kuis Sains Scratch: Daur Air & Presipitasi',
    DESKRIPSI: 'Proyek animasi koding Scratch tempat pengguna menjawab kuis tentang tahapan daur air (Evaporasi, Kondensasi, Presipitasi).',
    KATEGORI: 'PROYEK_KODING',
    IMAGE_URL: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    ATTACHMENT_URL: 'https://scratch.mit.edu/projects/sample',
    LIKES: ['SISWA-018', 'SISWA-019', 'ACC-CLS-006'],
    COMMENTS: [
      {
        ID: 'PC-102',
        AUTHOR_ID: 'ACC-CLS-006',
        AUTHOR_NAMA: 'M. Rizky Pratama, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Luar biasa Fajar! Logika koding perulangannya sangat rapi dan ramah dimainkan adik kelas.',
        CREATED_AT: nowISO(),
      }
    ],
    CREATED_AT: nowISO(),
    IS_FEATURED: true,
  }
];

class ClassroomService {
  private memoryCache = new Map<string, any>();

  private getItem<T>(key: string, defaultValue: T): T {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      if (!data) {
        this.memoryCache.set(key, defaultValue);
        return defaultValue;
      }
      const parsed = JSON.parse(data) as T;
      this.memoryCache.set(key, parsed);
      return parsed;
    } catch {
      this.memoryCache.set(key, defaultValue);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    this.memoryCache.set(key, value);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to write to localStorage for key:', key, e);
      }
    }
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key } }));
      }, 0);
    }
  }

  public clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  public initClassroom(): void {
    const existing = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!existing || !localStorage.getItem(STORAGE_KEYS.SEEDED)) {
      this.setItem(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
      this.setItem(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
      this.setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
      this.setItem(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
      this.setItem(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
      this.setItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
      this.setItem(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
      this.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
      this.setItem(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
      this.setItem(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
      this.setItem(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
      this.setItem(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
      this.setItem(STORAGE_KEYS.LIVE_CLASSES, DEFAULT_LIVE_CLASSES);
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      this.setItem(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
      this.setItem(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    }
  }

  // --- Automatic Sync Teacher Course with Class ---
  public syncTeacherCourseWithClass(guruId: string, guruNama: string, kelas: string): ClassroomCourse {
    this.initClassroom();
    const courses = this.getCourses();

    // Find student IDs with this class
    let studentIds: string[] = [];
    try {
      const accountsJson = localStorage.getItem('BB_ACCOUNTS');
      if (accountsJson) {
        const accounts: any[] = JSON.parse(accountsJson);
        studentIds = accounts
          .filter((a) => a.ROLE === 'SISWA' && a.KELAS === kelas)
          .map((a) => a.ID);
      }
    } catch (e) {
      console.warn('Failed to parse accounts for student sync:', e);
    }

    let course = courses.find((c) => c.KELAS_TINGKAT === kelas || c.GURU_ID === guruId);

    if (course) {
      course.GURU_ID = guruId;
      course.GURU_NAMA = guruNama;
      course.KELAS_TINGKAT = kelas;
      const mergedSet = new Set<string>([...course.SISWA_IDS, ...studentIds]);
      course.SISWA_IDS = Array.from(mergedSet);
      if (!course.NAMA.includes(kelas)) {
        course.NAMA = `${kelas} - Tematik & Pembelajaran Terpadu`;
      }
      this.setItem(STORAGE_KEYS.COURSES, courses);
    } else {
      const num = courses.length + 1;
      course = {
        ID: `CRS-${String(num).padStart(3, '0')}`,
        KODE_KELAS: `KLS${kelas.replace(/\D+/g, '') || num}-2026`,
        NAMA: `${kelas} - Tematik & Pembelajaran Terpadu`,
        DESKRIPSI: `Pembelajaran Terpadu Kurikulum Merdeka untuk siswa ${kelas} SDN Tangerang 6.`,
        GURU_ID: guruId,
        GURU_NAMA: guruNama,
        SISWA_IDS: studentIds,
        KELAS_TINGKAT: kelas,
        CREATED_AT: nowISO(),
      };
      courses.push(course);
      this.setItem(STORAGE_KEYS.COURSES, courses);
    }

    const assignments = this.getAssignments();
    const courseAssignments = assignments.filter((a) => a.COURSE_ID === course?.ID);
    if (courseAssignments.length === 0 && course) {
      const newAsg: ClassroomAssignment = {
        ID: `ASG-${Date.now()}`,
        COURSE_ID: course.ID,
        JUDUL: `Tugas Pengantar ${kelas} - Literasi & Ringkasan Materi`,
        DESKRIPSI: `Bacalah bahan ajar tema minggu ini lalu tuliskan 3 poin penting yang kamu pelajari di buku tugasmu.`,
        DEADLINE: '2026-09-15',
        TYPE: 'TUGAS',
        CREATED_AT: nowISO(),
        GURU_ID: guruId,
        GURU_NAMA: guruNama,
      };
      assignments.push(newAsg);
      this.setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
    }

    return course;
  }

  // --- Courses ---
  public getCourses(): ClassroomCourse[] {
    this.initClassroom();
    return this.getItem<ClassroomCourse[]>(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
  }

  public getCoursesForGuru(guruId: string, guruKelas?: string): ClassroomCourse[] {
    const all = this.getCourses();
    return all.filter((c) => c.GURU_ID === guruId || (guruKelas && c.KELAS_TINGKAT === guruKelas));
  }

  public getCoursesForSiswa(siswaId: string, siswaKelas?: string): ClassroomCourse[] {
    const all = this.getCourses();
    return all.filter(
      (c) => c.SISWA_IDS.includes(siswaId) || (siswaKelas && c.KELAS_TINGKAT === siswaKelas)
    );
  }

  public saveCourse(course: Partial<ClassroomCourse>): ClassroomCourse {
    const list = this.getCourses();
    let saved: ClassroomCourse;
    if (course.ID) {
      const idx = list.findIndex((c) => c.ID === course.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...course } as ClassroomCourse;
        saved = list[idx];
      } else {
        saved = { ...course, ID: course.ID } as ClassroomCourse;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `CRS-${String(num).padStart(3, '0')}`,
        KODE_KELAS: course.KODE_KELAS || `KLS-${num}-2026`,
        NAMA: course.NAMA || '',
        DESKRIPSI: course.DESKRIPSI || '',
        GURU_ID: course.GURU_ID || '',
        GURU_NAMA: course.GURU_NAMA || '',
        SISWA_IDS: course.SISWA_IDS || [],
        KELAS_TINGKAT: course.KELAS_TINGKAT || '',
        CREATED_AT: nowISO(),
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.COURSES, list);
    return saved;
  }

  public deleteCourse(id: string): void {
    this.setItem(STORAGE_KEYS.COURSES, this.getCourses().filter((c) => c.ID !== id));
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => a.COURSE_ID !== id));
  }

  public enrollSiswa(courseId: string, siswaId: string): void {
    const list = this.getCourses();
    const c = list.find((x) => x.ID === courseId);
    if (c && !c.SISWA_IDS.includes(siswaId)) {
      c.SISWA_IDS.push(siswaId);
      this.setItem(STORAGE_KEYS.COURSES, list);
    }
  }

  public unenrollSiswa(courseId: string, siswaId: string): void {
    const list = this.getCourses();
    const c = list.find((x) => x.ID === courseId);
    if (c) {
      c.SISWA_IDS = c.SISWA_IDS.filter((s) => s !== siswaId);
      this.setItem(STORAGE_KEYS.COURSES, list);
    }
  }

  // --- Assignments ---
  public getAssignments(courseId?: string): ClassroomAssignment[] {
    this.initClassroom();
    const all = this.getItem<ClassroomAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
    if (courseId) return all.filter((a) => a.COURSE_ID === courseId);
    return all;
  }

  public saveAssignment(assignment: Partial<ClassroomAssignment>): ClassroomAssignment {
    const list = this.getAssignments();
    let saved: ClassroomAssignment;
    if (assignment.ID) {
      const idx = list.findIndex((a) => a.ID === assignment.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...assignment } as ClassroomAssignment;
        saved = list[idx];
      } else {
        saved = { ...assignment, ID: assignment.ID } as ClassroomAssignment;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `ASG-${String(num).padStart(3, '0')}`,
        COURSE_ID: assignment.COURSE_ID || '',
        JUDUL: assignment.JUDUL || '',
        DESKRIPSI: assignment.DESKRIPSI || '',
        DEADLINE: assignment.DEADLINE || '',
        TYPE: assignment.TYPE || 'TUGAS',
        CREATED_AT: nowISO(),
        GURU_ID: assignment.GURU_ID || '',
        GURU_NAMA: assignment.GURU_NAMA || '',
        IS_PRIORITY: assignment.IS_PRIORITY ?? false,
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return saved;
  }

  public saveAssignments(assignments: Partial<ClassroomAssignment>[]): ClassroomAssignment[] {
    if (!assignments || assignments.length === 0) return [];
    const list = this.getAssignments();
    let maxNum = list.reduce((max, a) => {
      const match = a.ID?.match(/^ASG-(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0);
    if (maxNum < list.length) maxNum = list.length;

    const savedList: ClassroomAssignment[] = [];
    for (const assignment of assignments) {
      if (assignment.ID) {
        const idx = list.findIndex((a) => a.ID === assignment.ID);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...assignment } as ClassroomAssignment;
          savedList.push(list[idx]);
        } else {
          const item = { ...assignment, ID: assignment.ID } as ClassroomAssignment;
          list.push(item);
          savedList.push(item);
        }
      } else {
        maxNum++;
        const item: ClassroomAssignment = {
          ID: `ASG-${String(maxNum).padStart(3, '0')}`,
          COURSE_ID: assignment.COURSE_ID || '',
          JUDUL: assignment.JUDUL || '',
          DESKRIPSI: assignment.DESKRIPSI || '',
          DEADLINE: assignment.DEADLINE || '',
          TYPE: assignment.TYPE || 'TUGAS',
          CREATED_AT: nowISO(),
          GURU_ID: assignment.GURU_ID || '',
          GURU_NAMA: assignment.GURU_NAMA || '',
          IS_PRIORITY: assignment.IS_PRIORITY ?? false,
        };
        list.push(item);
        savedList.push(item);
      }
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return savedList;
  }

  public deleteAssignment(id: string): void {
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => a.ID !== id));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions().filter((s) => s.ASSIGNMENT_ID !== id));
  }

  public deleteAssignments(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => !idSet.has(a.ID)));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions().filter((s) => !idSet.has(s.ASSIGNMENT_ID)));
  }

  // --- Submissions ---
  public getSubmissions(assignmentId?: string, siswaId?: string): ClassroomSubmission[] {
    this.initClassroom();
    let all = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    if (assignmentId) all = all.filter((s) => s.ASSIGNMENT_ID === assignmentId);
    if (siswaId) all = all.filter((s) => s.SISWA_ID === siswaId);
    return all;
  }

  public saveSubmission(data: {
    ASSIGNMENT_ID: string;
    COURSE_ID: string;
    SISWA_ID: string;
    SISWA_NAMA: string;
    ISI: string;
    FILE_LINK?: string;
    STATUS?: 'DRAFT' | 'SUBMITTED';
  }): ClassroomSubmission {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const existing = list.find(
      (s) => s.ASSIGNMENT_ID === data.ASSIGNMENT_ID && s.SISWA_ID === data.SISWA_ID
    );
    let saved: ClassroomSubmission;
    if (existing) {
      existing.ISI = data.ISI;
      existing.FILE_LINK = data.FILE_LINK;
      existing.SUBMITTED_AT = ts();
      existing.STATUS = data.STATUS || 'SUBMITTED';
      saved = existing;
    } else {
      saved = {
        ID: `SUB-${Date.now()}`,
        ASSIGNMENT_ID: data.ASSIGNMENT_ID,
        COURSE_ID: data.COURSE_ID,
        SISWA_ID: data.SISWA_ID,
        SISWA_NAMA: data.SISWA_NAMA,
        ISI: data.ISI,
        FILE_LINK: data.FILE_LINK || '',
        SUBMITTED_AT: ts(),
        STATUS: data.STATUS || 'SUBMITTED',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
    offlineSyncManager.addPendingChange(
      'STUDENT_SUBMISSION',
      `Tugas ${saved.ASSIGNMENT_ID} siswa ${saved.SISWA_NAMA} (${saved.STATUS})`,
      saved
    );
    try {
      progressSyncService.notifySubmissionChange(saved, 'SAVE');
    } catch {}
    return saved;
  }

  public gradeSubmission(id: string, nilai: number, feedback: string, gradedBy: string, voiceNote?: string): void {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = list.find((s) => s.ID === id);
    if (sub) {
      sub.NILAI = nilai;
      sub.FEEDBACK = feedback;
      if (voiceNote !== undefined) sub.VOICE_NOTE = voiceNote;
      sub.GRADED_BY = gradedBy;
      sub.GRADED_AT = ts();
      sub.STATUS = 'GRADED';
      this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
      offlineSyncManager.addPendingChange(
        'STUDENT_SUBMISSION',
        `Nilai tugas ${sub.SISWA_NAMA}: ${nilai}/100 oleh ${gradedBy}`,
        sub
      );
      try {
        progressSyncService.notifySubmissionChange(sub, 'GRADE');
      } catch {}
    }
  }

  public gradeSubmissionsBulk(
    updates: Array<{ id: string; nilai: number; feedback?: string; voiceNote?: string }>,
    gradedBy: string
  ): void {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    let lastSub: ClassroomSubmission | null = null;
    updates.forEach(({ id, nilai, feedback, voiceNote }) => {
      const sub = list.find((s) => s.ID === id);
      if (sub) {
        sub.NILAI = nilai;
        if (feedback !== undefined) sub.FEEDBACK = feedback;
        if (voiceNote !== undefined) sub.VOICE_NOTE = voiceNote;
        sub.GRADED_BY = gradedBy;
        sub.GRADED_AT = ts();
        sub.STATUS = 'GRADED';
        lastSub = sub;
      }
    });
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
    if (lastSub) {
      try {
        progressSyncService.notifySubmissionChange(lastSub, 'BULK_GRADE');
      } catch {}
    }
  }

  // --- Reports ---
  public getReports(): ClassroomReport[] {
    this.initClassroom();
    return this.getItem<ClassroomReport[]>(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
  }

  public getReportsForGuru(guruId: string): ClassroomReport[] {
    return this.getReports().filter((r) => r.GURU_ID === guruId);
  }

  public saveReport(data: Partial<ClassroomReport>): ClassroomReport {
    const list = this.getReports();
    let saved: ClassroomReport;
    if (data.ID) {
      const idx = list.findIndex((r) => r.ID === data.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data } as ClassroomReport;
        saved = list[idx];
      } else {
        saved = { ...data, ID: data.ID } as ClassroomReport;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `RPT-${String(num).padStart(3, '0')}`,
        JUDUL: data.JUDUL || '',
        KATEGORI: data.KATEGORI || 'Laporan Bulanan',
        ISI: data.ISI || '',
        PERIODE: data.PERIODE || new Date().toISOString().slice(0, 7),
        GURU_ID: data.GURU_ID || '',
        GURU_NAMA: data.GURU_NAMA || '',
        CREATED_AT: nowISO(),
        STATUS: data.STATUS || 'DRAFT',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.REPORTS, list);
    return saved;
  }

  public submitReport(id: string): void {
    const list = this.getReports();
    const r = list.find((x) => x.ID === id);
    if (r) {
      r.STATUS = 'DIKIRIM';
      this.setItem(STORAGE_KEYS.REPORTS, list);
    }
  }

  public gradeReport(id: string, nilai: number, feedback: string, gradedBy: string): void {
    const list = this.getReports();
    const r = list.find((x) => x.ID === id);
    if (r) {
      r.NILAI = nilai;
      r.FEEDBACK = feedback;
      r.GRADED_BY = gradedBy;
      r.GRADED_AT = ts();
      r.STATUS = 'DINILAI';
      this.setItem(STORAGE_KEYS.REPORTS, list);
    }
  }

  public deleteReport(id: string): void {
    this.setItem(STORAGE_KEYS.REPORTS, this.getReports().filter((r) => r.ID !== id));
  }

  // ==========================================
  // === 1. FORUM & ANNOUNCEMENT METHODS ===
  // ==========================================
  public getForumPosts(kelas?: string): ForumPost[] {
    this.initClassroom();
    let posts = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    if (kelas) {
      posts = posts.filter((p) => p.KELAS === kelas || p.TAG === 'INFO_SEKOLAH');
    }
    // Sort: pinned first, then by date desc
    return posts.sort((a, b) => {
      if (a.IS_PINNED && !b.IS_PINNED) return -1;
      if (!a.IS_PINNED && b.IS_PINNED) return 1;
      return new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime();
    });
  }

  public createForumPost(post: Omit<ForumPost, 'ID' | 'CREATED_AT' | 'LIKES' | 'COMMENTS'>): ForumPost {
    const list = this.getForumPosts();
    const newPost: ForumPost = {
      ...post,
      ID: `POST-${Date.now()}`,
      CREATED_AT: nowISO(),
      LIKES: [],
      COMMENTS: [],
    };
    list.unshift(newPost);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return newPost;
  }

  public addForumComment(postId: string, comment: Omit<ForumComment, 'ID' | 'CREATED_AT'>): ForumComment | null {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (!post) return null;

    const newComment: ForumComment = {
      ...comment,
      ID: `CMT-${Date.now()}`,
      CREATED_AT: nowISO(),
    };
    if (!post.COMMENTS) post.COMMENTS = [];
    post.COMMENTS.push(newComment);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return newComment;
  }

  public toggleForumLike(postId: string, userId: string): boolean {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (!post) return false;

    if (!post.LIKES) post.LIKES = [];
    const idx = post.LIKES.indexOf(userId);
    if (idx >= 0) {
      post.LIKES.splice(idx, 1);
    } else {
      post.LIKES.push(userId);
    }
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return idx < 0;
  }

  public togglePinPost(postId: string): void {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (post) {
      post.IS_PINNED = !post.IS_PINNED;
      this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    }
  }

  public deleteForumPost(postId: string): void {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list.filter((p) => p.ID !== postId));
  }

  // ==========================================
  // === 2. PRESENSI / ATTENDANCE METHODS ===
  // ==========================================
  public getAttendanceRecords(kelas?: string, tanggal?: string): AttendanceRecord[] {
    this.initClassroom();
    let list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    if (kelas) list = list.filter((a) => a.KELAS === kelas);
    if (tanggal) list = list.filter((a) => a.TANGGAL === tanggal);
    return list;
  }

  public recordSingleAttendance(record: Omit<AttendanceRecord, 'ID' | 'RECORDED_AT'>): AttendanceRecord {
    const list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    const existingIdx = list.findIndex(
      (a) => a.KELAS === record.KELAS && a.TANGGAL === record.TANGGAL && a.SISWA_ID === record.SISWA_ID && a.SESI === record.SESI
    );

    const fullRecord: AttendanceRecord = {
      ...record,
      ID: existingIdx >= 0 ? list[existingIdx].ID : `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      RECORDED_AT: ts(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = fullRecord;
    } else {
      list.push(fullRecord);
    }

    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
    return fullRecord;
  }

  public bulkSaveAttendance(records: Omit<AttendanceRecord, 'ID' | 'RECORDED_AT'>[]): void {
    const list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    for (const rec of records) {
      const idx = list.findIndex(
        (a) => a.KELAS === rec.KELAS && a.TANGGAL === rec.TANGGAL && a.SISWA_ID === rec.SISWA_ID && a.SESI === rec.SESI
      );
      const full: AttendanceRecord = {
        ...rec,
        ID: idx >= 0 ? list[idx].ID : `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        RECORDED_AT: ts(),
      };
      if (idx >= 0) list[idx] = full;
      else list.push(full);
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
  }

  public getStudentAttendanceStats(siswaId: string, kelas?: string): { hadir: number; sakit: number; izin: number; alpa: number; total: number; percentage: number } {
    let list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    list = list.filter((a) => a.SISWA_ID === siswaId);
    if (kelas) list = list.filter((a) => a.KELAS === kelas);

    const stats = { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: list.length, percentage: 100 };
    list.forEach((r) => {
      if (r.STATUS === 'HADIR') stats.hadir++;
      else if (r.STATUS === 'SAKIT') stats.sakit++;
      else if (r.STATUS === 'IZIN') stats.izin++;
      else if (r.STATUS === 'ALPA') stats.alpa++;
    });

    if (stats.total > 0) {
      stats.percentage = Math.round((stats.hadir / stats.total) * 100);
    }
    return stats;
  }

  // ==========================================
  // === 3. KUIS & CBT EXAM METHODS ===
  // ==========================================
  public getQuizzes(kelas?: string, courseId?: string): ClassroomQuiz[] {
    this.initClassroom();
    let list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    if (kelas) list = list.filter((q) => q.KELAS === kelas);
    if (courseId) list = list.filter((q) => q.COURSE_ID === courseId);
    return list;
  }

  public saveQuiz(quiz: Partial<ClassroomQuiz>): ClassroomQuiz {
    const list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    let saved: ClassroomQuiz;

    if (quiz.ID) {
      const idx = list.findIndex((q) => q.ID === quiz.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...quiz } as ClassroomQuiz;
        saved = list[idx];
      } else {
        saved = { ...quiz, ID: quiz.ID } as ClassroomQuiz;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `QZ-${String(num).padStart(3, '0')}`,
        COURSE_ID: quiz.COURSE_ID || '',
        KELAS: quiz.KELAS || 'Kelas 1',
        JUDUL: quiz.JUDUL || 'Kuis Baru',
        DESKRIPSI: quiz.DESKRIPSI || '',
        DURASI_MENIT: quiz.DURASI_MENIT || 15,
        KKM: quiz.KKM || 75,
        DEADLINE: quiz.DEADLINE || '2026-09-30',
        QUESTIONS: quiz.QUESTIONS || [],
        CREATED_AT: nowISO(),
        GURU_ID: quiz.GURU_ID || '',
        GURU_NAMA: quiz.GURU_NAMA || '',
        IS_ACTIVE: quiz.IS_ACTIVE !== undefined ? quiz.IS_ACTIVE : true,
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.QUIZZES, list);
    return saved;
  }

  public deleteQuiz(id: string): void {
    const list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    this.setItem(STORAGE_KEYS.QUIZZES, list.filter((q) => q.ID !== id));
  }

  public submitQuizAttempt(data: {
    QUIZ_ID: string;
    SISWA_ID: string;
    SISWA_NAMA: string;
    KELAS: string;
    ANSWERS: { [questionId: string]: number };
    STARTED_AT: string;
  }): QuizAttempt {
    const quizzes = this.getQuizzes();
    const quiz = quizzes.find((q) => q.ID === data.QUIZ_ID);
    const questions = quiz ? quiz.QUESTIONS : [];

    let benar = 0;
    questions.forEach((q) => {
      if (data.ANSWERS[q.ID] !== undefined && data.ANSWERS[q.ID] === q.KUNCI_JAWABAN) {
        benar++;
      }
    });

    const totalSoal = questions.length || 1;
    const score = Math.round((benar / totalSoal) * 100);
    const kkm = quiz?.KKM || 75;

    const attempt: QuizAttempt = {
      ID: `ATT-QZ-${Date.now()}`,
      QUIZ_ID: data.QUIZ_ID,
      SISWA_ID: data.SISWA_ID,
      SISWA_NAMA: data.SISWA_NAMA,
      KELAS: data.KELAS,
      ANSWERS: data.ANSWERS,
      SCORE: score,
      TOTAL_SOAL: totalSoal,
      BENAR: benar,
      SALAH: totalSoal - benar,
      PASSED: score >= kkm,
      STARTED_AT: data.STARTED_AT,
      FINISHED_AT: ts(),
    };

    const attempts = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    // Replace if already attempted or push
    const existingIdx = attempts.findIndex((a) => a.QUIZ_ID === data.QUIZ_ID && a.SISWA_ID === data.SISWA_ID);
    if (existingIdx >= 0) {
      attempts[existingIdx] = attempt;
    } else {
      attempts.push(attempt);
    }

    this.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);
    return attempt;
  }

  public getQuizAttempts(quizId?: string, siswaId?: string): QuizAttempt[] {
    this.initClassroom();
    let list = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    if (quizId) list = list.filter((a) => a.QUIZ_ID === quizId);
    if (siswaId) list = list.filter((a) => a.SISWA_ID === siswaId);
    return list;
  }

  // ==========================================
  // === 4. BAHAN AJAR & E-LIBRARY METHODS ===
  // ==========================================
  public getMaterials(kelas?: string, mapel?: string): LearningMaterial[] {
    this.initClassroom();
    let list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    if (kelas) list = list.filter((m) => m.KELAS === kelas || m.KELAS === 'Semua Kelas');
    if (mapel) list = list.filter((m) => m.MAPEL.toLowerCase().includes(mapel.toLowerCase()));
    return list;
  }

  public saveMaterial(mat: Partial<LearningMaterial>): LearningMaterial {
    const list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    let saved: LearningMaterial;

    if (mat.ID) {
      const idx = list.findIndex((m) => m.ID === mat.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...mat } as LearningMaterial;
        saved = list[idx];
      } else {
        saved = { ...mat, ID: mat.ID } as LearningMaterial;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `MAT-${String(num).padStart(3, '0')}`,
        KELAS: mat.KELAS || 'Kelas 1',
        MAPEL: mat.MAPEL || 'Tematik',
        JUDUL: mat.JUDUL || 'Modul Pembelajaran',
        DESKRIPSI: mat.DESKRIPSI || '',
        TIPE: mat.TIPE || 'EBOOK',
        URL_LINK: mat.URL_LINK || '',
        FILE_SIZE: mat.FILE_SIZE || '1.5 MB',
        RINGKASAN_KONTEN: mat.RINGKASAN_KONTEN || '',
        CREATED_AT: nowISO(),
        GURU_NAMA: mat.GURU_NAMA || 'Guru SDN Tangerang 6',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.MATERIALS, list);
    return saved;
  }

  public deleteMaterial(id: string): void {
    const list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    this.setItem(STORAGE_KEYS.MATERIALS, list.filter((m) => m.ID !== id));
  }

  // ==========================================
  // === 5. JADWAL PELAJARAN METHODS ===
  // ==========================================
  public getSchedules(kelas?: string, hari?: string): ClassScheduleItem[] {
    this.initClassroom();
    let list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    if (kelas) list = list.filter((s) => s.KELAS === kelas);
    if (hari) list = list.filter((s) => s.HARI === hari);
    return list;
  }

  public saveSchedule(item: Partial<ClassScheduleItem>): ClassScheduleItem {
    const list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    let saved: ClassScheduleItem;

    if (item.ID) {
      const idx = list.findIndex((s) => s.ID === item.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item } as ClassScheduleItem;
        saved = list[idx];
      } else {
        saved = { ...item, ID: item.ID } as ClassScheduleItem;
        list.push(saved);
      }
    } else {
      saved = {
        ID: `SCH-${Date.now()}`,
        KELAS: item.KELAS || 'Kelas 1',
        HARI: item.HARI || 'Senin',
        JAM_MULAI: item.JAM_MULAI || '07:30',
        JAM_SELESAI: item.JAM_SELESAI || '09:00',
        MAPEL: item.MAPEL || 'Tematik',
        GURU_NAMA: item.GURU_NAMA || 'Guru Kelas',
        RUANGAN: item.RUANGAN || 'Ruang Kelas',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.SCHEDULES, list);
    return saved;
  }

  public deleteSchedule(id: string): void {
    const list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    this.setItem(STORAGE_KEYS.SCHEDULES, list.filter((s) => s.ID !== id));
  }

  // ==========================================
  // === 6. GRADEBOOK & E-RAPOR ENGINE ===
  // ==========================================
  public getStudentReportCard(siswaId: string, siswaNama: string, kelas: string): {
    siswaId: string;
    siswaNama: string;
    kelas: string;
    nilaiTugas: number;
    tugasCount: number;
    nilaiKuis: number;
    kuisCount: number;
    presensiPct: number;
    nilaiAkhir: number;
    predikat: 'A' | 'B' | 'C' | 'D';
    keterangan: string;
  } {
    // 1. Calculate Tugas Average
    const submissions = this.getSubmissions(undefined, siswaId);
    const gradedSubmissions = submissions.filter((s) => s.NILAI !== undefined);
    const sumTugas = gradedSubmissions.reduce((acc, curr) => acc + (curr.NILAI || 0), 0);
    const avgTugas = gradedSubmissions.length > 0 ? Math.round(sumTugas / gradedSubmissions.length) : 85;

    // 2. Calculate Quiz Average
    const attempts = this.getQuizAttempts(undefined, siswaId);
    const sumKuis = attempts.reduce((acc, curr) => acc + curr.SCORE, 0);
    const avgKuis = attempts.length > 0 ? Math.round(sumKuis / attempts.length) : 88;

    // 3. Attendance Percentage
    const attStats = this.getStudentAttendanceStats(siswaId, kelas);
    const presensiPct = attStats.percentage !== undefined ? attStats.percentage : 95;

    // 4. Portfolio items average (if portfolio weight configured)
    const portfolioItems = this.getPortfolioItems(kelas, siswaId);
    const avgPortofolio = portfolioItems.length > 0
      ? Math.round(portfolioItems.reduce((acc, p) => acc + ((p as any).SCORE || 85), 0) / portfolioItems.length)
      : 85;

    // 5. Dynamic Nilai Akhir Calculation using GradeWeightConfig
    const weightConfig = this.getGradeWeightConfig(kelas);
    const wTugas = (weightConfig?.BOBOT_TUGAS ?? 40) / 100;
    const wKuis = (weightConfig?.BOBOT_KUIS ?? 40) / 100;
    const wPresensi = (weightConfig?.BOBOT_PRESENSI ?? 20) / 100;
    const wPortofolio = (weightConfig?.BOBOT_PORTOFOLIO ?? 0) / 100;

    const totalWeight = (wTugas + wKuis + wPresensi + wPortofolio) || 1;
    const weightedSum = (avgTugas * wTugas) + (avgKuis * wKuis) + (presensiPct * wPresensi) + (avgPortofolio * wPortofolio);
    const nilaiAkhir = Math.round(weightedSum / totalWeight);

    let predikat: 'A' | 'B' | 'C' | 'D' = 'B';
    let keterangan = 'Menunjukkan penguasaan materi yang baik dan aktif dalam kegiatan kelas.';

    if (nilaiAkhir >= 90) {
      predikat = 'A';
      keterangan = 'Sangat Menguasai seluruh capaian pembelajaran dengan keaktifan belajar luar biasa.';
    } else if (nilaiAkhir >= 80) {
      predikat = 'B';
      keterangan = 'Menguasai capaian pembelajaran dengan baik, disiplin mengumpulkan tugas.';
    } else if (nilaiAkhir >= 70) {
      predikat = 'C';
      keterangan = 'Cukup menguasai materi, perlu penguatan pada ketelitian pengerjaan tugas & latihan numerasi.';
    } else {
      predikat = 'D';
      keterangan = 'Perlu bimbingan dan remedial berkelanjutan untuk mencapai Kriteria Ketuntasan Minimal.';
    }

    return {
      siswaId,
      siswaNama,
      kelas,
      nilaiTugas: avgTugas,
      tugasCount: gradedSubmissions.length,
      nilaiKuis: avgKuis,
      kuisCount: attempts.length,
      presensiPct,
      nilaiAkhir,
      predikat,
      keterangan,
    };
  }

  // ==========================================
  // === 7. ACADEMIC TREND ANALYTICS FOR CHARTS ===
  // ==========================================
  public getStudentAcademicTimeline(siswaId: string, siswaNama: string, kelas: string): {
    tahap: string;
    nilaiSiswa: number;
    rataRataKelas: number;
    kkm: number;
    kategori: string;
    tanggal: string;
  }[] {
    // Generate realistic chronological milestones
    // Base scores calculated from actual submissions/quizzes or seeded progression
    const seedOffset = (siswaId.charCodeAt(siswaId.length - 1) % 7) - 3;
    
    return [
      { tahap: 'Tugas 1 (Literasi)', nilaiSiswa: Math.min(100, Math.max(65, 82 + seedOffset)), rataRataKelas: 83, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 1' },
      { tahap: 'Kuis CBT 1', nilaiSiswa: Math.min(100, Math.max(65, 86 + seedOffset * 2)), rataRataKelas: 81, kkm: 75, kategori: 'Kuis', tanggal: 'Minggu 2' },
      { tahap: 'Tugas 2 (Numerasi)', nilaiSiswa: Math.min(100, Math.max(65, 84 + seedOffset)), rataRataKelas: 84, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 3' },
      { tahap: 'Ulangan Harian 1', nilaiSiswa: Math.min(100, Math.max(65, 88 + seedOffset * 2)), rataRataKelas: 85, kkm: 75, kategori: 'Ulangan', tanggal: 'Minggu 4' },
      { tahap: 'Praktik / LKPD', nilaiSiswa: Math.min(100, Math.max(65, 90 + seedOffset)), rataRataKelas: 87, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 5' },
      { tahap: 'Kuis CBT 2', nilaiSiswa: Math.min(100, Math.max(65, 92 + seedOffset * 2)), rataRataKelas: 88, kkm: 75, kategori: 'Kuis', tanggal: 'Minggu 6' },
      { tahap: 'PTS (Tengah Sem.)', nilaiSiswa: Math.min(100, Math.max(65, 89 + seedOffset)), rataRataKelas: 86, kkm: 75, kategori: 'PTS', tanggal: 'Minggu 8' },
    ];
  }

  public getClassComparisonTrends(): {
    kelas: string;
    rataRataTugas: number;
    rataRataKuis: number;
    rataRataPresensi: number;
    nilaiAkhirKelas: number;
    jumlahSiswa: number;
  }[] {
    return [
      { kelas: 'Kelas 1', rataRataTugas: 86, rataRataKuis: 88, rataRataPresensi: 96, nilaiAkhirKelas: 89, jumlahSiswa: 4 },
      { kelas: 'Kelas 2', rataRataTugas: 84, rataRataKuis: 85, rataRataPresensi: 94, nilaiAkhirKelas: 86, jumlahSiswa: 4 },
      { kelas: 'Kelas 3', rataRataTugas: 87, rataRataKuis: 89, rataRataPresensi: 95, nilaiAkhirKelas: 89, jumlahSiswa: 4 },
      { kelas: 'Kelas 4', rataRataTugas: 85, rataRataKuis: 87, rataRataPresensi: 93, nilaiAkhirKelas: 87, jumlahSiswa: 4 },
      { kelas: 'Kelas 5', rataRataTugas: 88, rataRataKuis: 91, rataRataPresensi: 97, nilaiAkhirKelas: 91, jumlahSiswa: 4 },
      { kelas: 'Kelas 6', rataRataTugas: 90, rataRataKuis: 92, rataRataPresensi: 98, nilaiAkhirKelas: 92, jumlahSiswa: 4 },
    ];
  }

  public getWeeklyClassGradeTrends(targetKelas?: string): {
    minggu: string;
    mingguKe: number;
    rataRataTugas: number;
    rataRataKuis: number;
    rataRataGabungan: number;
    kkm: number;
    jumlahTugasDikumpul: number;
    status: string;
  }[] {
    this.initClassroom();
    const classOffsetMap: Record<string, number> = {
      'Kelas 1': 2,
      'Kelas 2': -1,
      'Kelas 3': 3,
      'Kelas 4': 0,
      'Kelas 5': 4,
      'Kelas 6': 5,
    };
    const offset = targetKelas && targetKelas !== 'Semua' ? (classOffsetMap[targetKelas] || 0) : 1;

    const baseWeeks = [
      { minggu: 'Minggu 1', mingguKe: 1, tugas: 80, kuis: 78, tumpul: 12 },
      { minggu: 'Minggu 2', mingguKe: 2, tugas: 82, kuis: 81, tumpul: 15 },
      { minggu: 'Minggu 3', mingguKe: 3, tugas: 83, kuis: 80, tumpul: 18 },
      { minggu: 'Minggu 4', mingguKe: 4, tugas: 86, kuis: 84, tumpul: 20 },
      { minggu: 'Minggu 5', mingguKe: 5, tugas: 85, kuis: 87, tumpul: 22 },
      { minggu: 'Minggu 6', mingguKe: 6, tugas: 88, kuis: 89, tumpul: 25 },
      { minggu: 'Minggu 7', mingguKe: 7, tugas: 89, kuis: 88, tumpul: 24 },
      { minggu: 'Minggu 8', mingguKe: 8, tugas: 91, kuis: 92, tumpul: 28 },
    ];

    return baseWeeks.map((w) => {
      const avgTugas = Math.min(100, Math.max(60, w.tugas + offset));
      const avgKuis = Math.min(100, Math.max(60, w.kuis + offset));
      const avgGabungan = Math.round((avgTugas + avgKuis) / 2);

      return {
        minggu: w.minggu,
        mingguKe: w.mingguKe,
        rataRataTugas: avgTugas,
        rataRataKuis: avgKuis,
        rataRataGabungan: avgGabungan,
        kkm: 75,
        jumlahTugasDikumpul: w.tumpul + (offset > 0 ? offset * 2 : 0),
        status: avgGabungan >= 85 ? 'Sangat Baik' : avgGabungan >= 75 ? 'Baik' : 'Cukup',
      };
    });
  }

  // --- Media Pembelajaran Methods ---
  public getMediaItems(courseId?: string): ClassroomMedia[] {
    this.initClassroom();
    const items = this.getItem<ClassroomMedia[]>(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
    if (courseId) {
      return items.filter(m => m.COURSE_ID === courseId);
    }
    return items;
  }

  public saveMediaItem(media: ClassroomMedia): void {
    this.initClassroom();
    const items = this.getMediaItems();
    const index = items.findIndex(m => m.ID === media.ID);
    if (index >= 0) {
      items[index] = media;
    } else {
      items.unshift(media);
    }
    this.setItem(STORAGE_KEYS.MEDIA, items);
  }

  public deleteMediaItem(id: string): void {
    this.initClassroom();
    const items = this.getMediaItems().filter(m => m.ID !== id);
    this.setItem(STORAGE_KEYS.MEDIA, items);
  }

  public getMediaSubmissions(mediaId?: string, siswaId?: string): MediaSubmission[] {
    this.initClassroom();
    const subs = this.getItem<MediaSubmission[]>(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
    let result = subs;
    if (mediaId) result = result.filter(s => s.MEDIA_ID === mediaId);
    if (siswaId) result = result.filter(s => s.SISWA_ID === siswaId);
    return result;
  }

  public getAllMediaSubmissions(): MediaSubmission[] {
    this.initClassroom();
    return this.getItem<MediaSubmission[]>(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
  }

  public saveMediaSubmission(sub: MediaSubmission): void {
    this.initClassroom();
    const subs = this.getAllMediaSubmissions();
    const index = subs.findIndex(s => s.ID === sub.ID || (s.MEDIA_ID === sub.MEDIA_ID && s.SISWA_ID === sub.SISWA_ID));
    if (index >= 0) {
      subs[index] = { ...subs[index], ...sub };
    } else {
      subs.push(sub);
    }
    this.setItem(STORAGE_KEYS.MEDIA_SUBMISSIONS, subs);
  }

  // --- Virtual Live Class Methods ---
  public getLiveClasses(kelas?: string): VirtualLiveClassSession[] {
    this.initClassroom();
    const items = this.getItem<VirtualLiveClassSession[]>(STORAGE_KEYS.LIVE_CLASSES, DEFAULT_LIVE_CLASSES);
    if (kelas && kelas !== 'Semua') {
      return items.filter(s => s.KELAS === kelas || s.KELAS === 'Semua');
    }
    return items;
  }

  public saveLiveClass(session: VirtualLiveClassSession): void {
    this.initClassroom();
    const items = this.getLiveClasses();
    const index = items.findIndex(s => s.ID === session.ID);
    if (index >= 0) {
      items[index] = session;
    } else {
      items.unshift(session);
    }
    this.setItem(STORAGE_KEYS.LIVE_CLASSES, items);

    // Automatically trigger notification for live class
    this.addNotification({
      KELAS: session.KELAS,
      TITLE: `🎥 Sesi Live Daring: ${session.JUDUL}`,
      MESSAGE: `Sesi tatap muka daring diajukan oleh ${session.GURU_NAMA} pada pukul ${session.JAM_MULAI} WIB.`,
      TYPE: 'LIVE_CLASS',
      LINK_PAGE: 'live_class',
    });
  }

  public deleteLiveClass(id: string): void {
    this.initClassroom();
    const items = this.getLiveClasses().filter(s => s.ID !== id);
    this.setItem(STORAGE_KEYS.LIVE_CLASSES, items);
  }

  // --- Notification System Methods ---
  public getNotifications(kelas?: string, userId?: string): ClassroomNotification[] {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    return notifs.filter(n => {
      const matchKelas = !kelas || kelas === 'Semua' || !n.KELAS || n.KELAS === kelas;
      const matchUser = !n.USER_ID || n.USER_ID === userId;
      return matchKelas && matchUser;
    });
  }

  public addNotification(notif: Omit<ClassroomNotification, 'ID' | 'CREATED_AT' | 'IS_READ'>): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const newNotif: ClassroomNotification = {
      ...notif,
      ID: 'NOTIF-' + Date.now(),
      CREATED_AT: nowISO(),
      IS_READ: false,
    };
    notifs.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 50)); // Keep max 50 recent notifs
  }

  public markNotificationRead(id: string): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const updated = notifs.map(n => n.ID === id ? { ...n, IS_READ: true } : n);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  public markAllNotificationsRead(kelas?: string): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const updated = notifs.map(n => {
      if (!kelas || kelas === 'Semua' || !n.KELAS || n.KELAS === kelas) {
        return { ...n, IS_READ: true };
      }
      return n;
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  public generateAutomaticReminders(kelas?: string, siswaId?: string): void {
    this.initClassroom();
    const assignments = this.getAssignments();
    const submissions = this.getSubmissions(siswaId);
    const todayStr = todayDate();

    // Check assignments due in the next 3 days that are not submitted
    assignments.forEach(asg => {
      if (asg.DEADLINE >= todayStr) {
        const hasSubmitted = submissions.some(s => s.ASSIGNMENT_ID === asg.ID && s.STATUS === 'SUBMITTED');
        if (!hasSubmitted) {
          const existingNotifs = this.getNotifications(kelas, siswaId);
          const alreadyNotified = existingNotifs.some(n => n.MESSAGE.includes(asg.JUDUL));
          if (!alreadyNotified) {
            this.addNotification({
              USER_ID: siswaId,
              KELAS: kelas,
              TITLE: `⏰ Pengingat Tenggat Waktu: ${asg.JUDUL}`,
              MESSAGE: `Tugas "${asg.JUDUL}" jatuh tempo pada ${asg.DEADLINE}. Segera selesaikan dan kumpulkan!`,
              TYPE: 'DEADLINE',
              LINK_PAGE: 'assignments',
            });
          }
        }
      }
    });
  }

  // --- Grade Weighting Configuration Methods ---
  public getGradeWeightConfig(kelas: string, mapel?: string): GradeWeightConfig {
    this.initClassroom();
    const configs = this.getItem<GradeWeightConfig[]>(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
    const found = configs.find(c => c.KELAS === kelas && (!mapel || c.MAPEL === mapel));
    if (found) return found;

    return {
      KELAS: kelas || 'Kelas 1',
      MAPEL: mapel || 'Umum',
      BOBOT_TUGAS: 40,
      BOBOT_KUIS: 40,
      BOBOT_PRESENSI: 20,
      BOBOT_PORTOFOLIO: 0,
      UPDATED_AT: nowISO(),
      UPDATED_BY: 'Sistem Standard',
    };
  }

  public saveGradeWeightConfig(config: GradeWeightConfig): void {
    this.initClassroom();
    const configs = this.getItem<GradeWeightConfig[]>(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
    const idx = configs.findIndex(c => c.KELAS === config.KELAS && c.MAPEL === config.MAPEL);
    if (idx >= 0) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }
    this.setItem(STORAGE_KEYS.GRADE_WEIGHTS, configs);
  }

  // --- Digital Student Portfolio Methods ---
  public getPortfolioItems(kelas?: string, siswaId?: string): StudentPortfolioItem[] {
    this.initClassroom();
    let items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    if (kelas && kelas !== 'Semua') {
      items = items.filter(p => p.KELAS === kelas);
    }
    if (siswaId) {
      items = items.filter(p => p.SISWA_ID === siswaId);
    }
    return items;
  }

  public savePortfolioItem(item: StudentPortfolioItem): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === item.ID);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    this.setItem(STORAGE_KEYS.PORTFOLIO, items);
  }

  public togglePortfolioLike(portfolioId: string, userId: string): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === portfolioId);
    if (index >= 0) {
      const likes = items[index].LIKES || [];
      if (likes.includes(userId)) {
        items[index].LIKES = likes.filter(id => id !== userId);
      } else {
        items[index].LIKES = [...likes, userId];
      }
      this.setItem(STORAGE_KEYS.PORTFOLIO, items);
    }
  }

  public addPortfolioComment(
    portfolioId: string,
    authorId: string,
    authorNama: string,
    authorRole: any,
    content: string
  ): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === portfolioId);
    if (index >= 0) {
      const newComment: PortfolioComment = {
        ID: 'PC-' + Date.now(),
        AUTHOR_ID: authorId,
        AUTHOR_NAMA: authorNama,
        AUTHOR_ROLE: authorRole,
        CONTENT: content,
        CREATED_AT: nowISO(),
      };
      items[index].COMMENTS = [...(items[index].COMMENTS || []), newComment];
      this.setItem(STORAGE_KEYS.PORTFOLIO, items);
    }
  }

  public deletePortfolioItem(id: string): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO).filter(p => p.ID !== id);
    this.setItem(STORAGE_KEYS.PORTFOLIO, items);
  }

  // --- Peer Review System ---
  public getPeerReviews(assignmentId?: string, submissionId?: string): any[] {
    this.initClassroom();
    let all = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    if (assignmentId) all = all.filter((r) => r.ASSIGNMENT_ID === assignmentId);
    if (submissionId) all = all.filter((r) => r.SUBMISSION_ID === submissionId);
    return all;
  }

  public savePeerReview(review: {
    ASSIGNMENT_ID: string;
    SUBMISSION_ID: string;
    REVIEWER_ID: string;
    SCORE_KREATIVITAS: number;
    FEEDBACK_KREATIVITAS: string;
    SCORE_STRUKTUR: number;
    FEEDBACK_STRUKTUR: string;
    SCORE_MATERI: number;
    FEEDBACK_MATERI: string;
    SCORE_SIKAP?: number;
    FEEDBACK_SIKAP?: string;
    GENERAL_COMMENT: string;
  }): void {
    const list = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    const existingIdx = list.findIndex(r => r.SUBMISSION_ID === review.SUBMISSION_ID && r.REVIEWER_ID === review.REVIEWER_ID);
    const newReview = {
      ...review,
      ID: 'PRV-' + Date.now(),
      SUBMITTED_AT: ts(),
    };
    if (existingIdx >= 0) {
      list[existingIdx] = newReview;
    } else {
      list.push(newReview);
    }
    this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
  }

  public togglePeerReviewThumbsUp(reviewId: string): void {
    const list = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    const idx = list.findIndex(r => r.ID === reviewId);
    if (idx >= 0) {
      list[idx].THUMBS_UP = !list[idx].THUMBS_UP;
      this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
    } else {
      // If the review ID is a demo review, we can persist it to let users interact with it
      const demoReviews = [
        {
          ID: 'demo-peer-1',
          SCORE_KREATIVITAS: 92,
          FEEDBACK_KREATIVITAS: 'Penyajian ide sangat kreatif, orisinal, dan visualisasi tugas sangat rapi.',
          SCORE_STRUKTUR: 85,
          FEEDBACK_STRUKTUR: 'Format penulisan sudah sistematis, alur pengerjaan cukup jelas dan berurutan.',
          SCORE_MATERI: 78,
          FEEDBACK_MATERI: 'Sebagian jawaban pada nomor 3 dan 4 perlu diperiksa kembali rumus dasarnya.',
          GENERAL_COMMENT: 'Kerja keras yang luar biasa! Pertahankan kreativitasmu dan teliti kembali perhitungan.',
          SUBMITTED_AT: '2026-03-01 09:30',
          REVIEWER_ID: 'SISWA-001', // Make it come from a valid student ID so they get the Helper Badge
          THUMBS_UP: false,
        },
        {
          ID: 'demo-peer-2',
          SCORE_KREATIVITAS: 90,
          FEEDBACK_KREATIVITAS: 'Ide solusi sangat segar dan berbeda dari teman yang lain.',
          SCORE_STRUKTUR: 88,
          FEEDBACK_STRUKTUR: 'Tabel dan diagram dibuat dengan rapi.',
          SCORE_MATERI: 80,
          FEEDBACK_MATERI: 'Sudah sesuai dengan petunjuk guru, hanya perlu sedikit elaborasi di kesimpulan.',
          GENERAL_COMMENT: 'Sangat inspiratif! Senang membaca hasil pekerjaanmu.',
          SUBMITTED_AT: '2026-03-01 11:15',
          REVIEWER_ID: 'SISWA-002', // Another student ID
          THUMBS_UP: false,
        }
      ];
      const foundDemo = demoReviews.find(r => r.ID === reviewId);
      if (foundDemo) {
        foundDemo.THUMBS_UP = true;
        list.push(foundDemo);
        this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
      }
    }
  }

  // --- P5 Project Tracker System ---
  public getP5Projects(kelas?: string): P5Project[] {
    this.initClassroom();
    let projects = this.getItem<P5Project[]>(STORAGE_KEYS.P5_PROJECTS, DEFAULT_P5_PROJECTS);
    if (!projects || projects.length === 0) {
      projects = DEFAULT_P5_PROJECTS;
      this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    }
    if (kelas) {
      const filtered = projects.filter(p => p.KELAS.toLowerCase() === kelas.toLowerCase());
      if (filtered.length > 0) return filtered;
    }
    return projects;
  }

  public getP5ProjectForClass(kelas: string): P5Project {
    const list = this.getP5Projects(kelas);
    if (list.length > 0) return list[0];
    
    return {
      ID: 'P5-PRJ-' + Date.now(),
      KELAS: kelas || 'Kelas 4',
      JUDUL: 'Proyek Profil Pelajar Pancasila ' + (kelas || 'Kelas 4'),
      TEMA: 'Gaya Hidup Berkelanjutan',
      DESKRIPSI: 'Proyek penguatan karakter dan kompetensi abad 21 siswa.',
      DIMENSI: ['Gotong Royong', 'Bernalar Kritis', 'Kreatif'],
      STAGES: [
        { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan & Orientasi', DESCRIPTION: 'Memahami isu dan tema proyek', STATUS: 'SELESAI', COMPLETED_AT: todayDate() },
        { ID: 'STG-2', NAME: 'Tahap 2: Kontekstualisasi & Riset', DESCRIPTION: 'Merencanakan langkah aksi bersama', STATUS: 'SEDANG_BERJALAN' },
        { ID: 'STG-3', NAME: 'Tahap 3: Aksi & Pembuatan Karya', DESCRIPTION: 'Praktik dan pembuatan produk karya', STATUS: 'BELUM_MULAI' },
        { ID: 'STG-4', NAME: 'Tahap 4: Refleksi & Tindak Lanjut', DESCRIPTION: 'Evaluasi dan pameran hasil belajar', STATUS: 'BELUM_MULAI' },
      ],
      PERCENTAGE: 38,
      UPDATED_AT: nowISO(),
      UPDATED_BY: 'GURU_SYS',
    };
  }

  public updateP5StageStatus(
    projectId: string,
    stageId: string,
    newStatus: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI',
    updatedBy: string
  ): P5Project {
    const projects = this.getP5Projects();
    const projIdx = projects.findIndex(p => p.ID === projectId);
    let targetProject: P5Project;

    if (projIdx >= 0) {
      targetProject = projects[projIdx];
    } else {
      targetProject = DEFAULT_P5_PROJECTS[0];
    }

    const updatedStages = targetProject.STAGES.map(s => {
      if (s.ID === stageId) {
        return {
          ...s,
          STATUS: newStatus,
          COMPLETED_AT: newStatus === 'SELESAI' ? todayDate() : s.COMPLETED_AT,
        };
      }
      return s;
    });

    const total = updatedStages.length || 1;
    const completedCount = updatedStages.filter(s => s.STATUS === 'SELESAI').length;
    const inProgressCount = updatedStages.filter(s => s.STATUS === 'SEDANG_BERJALAN').length;
    const percentage = Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100);

    const updatedProject: P5Project = {
      ...targetProject,
      STAGES: updatedStages,
      PERCENTAGE: percentage,
      UPDATED_AT: nowISO(),
      UPDATED_BY: updatedBy,
    };

    if (projIdx >= 0) {
      projects[projIdx] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    return updatedProject;
  }
}


export const classroomService = new ClassroomService();
