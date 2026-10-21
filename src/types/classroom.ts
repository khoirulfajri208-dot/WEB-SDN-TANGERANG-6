// Classroom & Account Management Types

export type SystemType = 'SIPERSEDA' | 'CLASSROOM' | 'ADMIN';

export type AccountRole = 'ADMIN' | 'OPERATOR' | 'KEPALA SEKOLAH' | 'GURU' | 'SISWA' | 'STAFF' | 'STAFF TU';

export type StatusKelulusan = 'AKTIF' | 'LULUS' | 'TINGGAL_KELAS' | 'PINDAH_MUTASI' | 'PINDAH' | 'DROPOUT';
export type KebutuhanKhusus =
  | 'REGULER'
  | 'INKLUSI_DISLEKSIA'
  | 'INKLUSI_TUNADAKSA'
  | 'INKLUSI_TUNARUNGU'
  | 'INKLUSI_AUTISME'
  | 'AUTISME'
  | 'TUNARUNGU'
  | 'TUNANETRA'
  | 'DISLEKSIA'
  | 'CERDAS_ISTIMEWA'
  | 'LAINNYA';

export interface Account {
  ID: string;
  NAMA: string;
  EMAIL: string;
  USERNAME: string;
  PASSWORD: string;
  ROLE: AccountRole;
  SISTEM: SystemType;
  STATUS: 'AKTIF' | 'NONAKTIF';
  NIP?: string;
  KELAS?: string; // for siswa & guru
  KELAS_LOCKED?: boolean; // true once guru enters/locks class (only unlocked by admin)
  KELAS_LOCKED_AT?: string; // timestamp when locked
  KELAS_LOCKED_BY?: string; // locked by username/admin
  TELEPON?: string;
  STATUS_KELULUSAN?: StatusKelulusan;
  KEBUTUHAN_KHUSUS?: KebutuhanKhusus;
  CATATAN_INKLUSI?: string;
  CREATED_AT: string;
}

// Classroom data models
export interface ClassroomCourse {
  ID: string;
  KODE_KELAS: string;
  NAMA: string;
  DESKRIPSI: string;
  GURU_ID: string;
  GURU_NAMA: string;
  SISWA_IDS: string[];
  KELAS_TINGKAT: string;
  CREATED_AT: string;
  ICON?: string;
  WARNA?: string;
}

export interface ClassroomAssignment {
  ID: string;
  COURSE_ID: string;
  JUDUL: string;
  DESKRIPSI: string;
  DEADLINE: string;
  TYPE: 'TUGAS' | 'MATERI' | 'ULANGAN';
  BOBOT?: number; // 0 - 100
  ATTACHMENT_URL?: string;
  CREATED_AT: string;
  GURU_ID: string;
  GURU_NAMA: string;
  IS_PRIORITY?: boolean;
}

export interface ClassroomSubmission {
  ID: string;
  ASSIGNMENT_ID: string;
  COURSE_ID: string;
  SISWA_ID: string;
  SISWA_NAMA: string;
  ISI: string;
  FILE_LINK?: string;
  SUBMITTED_AT: string;
  STATUS: 'DRAFT' | 'SUBMITTED' | 'GRADED';
  NILAI?: number;
  FEEDBACK?: string;
  VOICE_NOTE?: string;
  GRADED_BY?: string;
  GRADED_AT?: string;
}

export interface ClassroomReport {
  ID: string;
  JUDUL: string;
  KATEGORI: string;
  ISI: string;
  PERIODE: string;
  GURU_ID: string;
  GURU_NAMA: string;
  CREATED_AT: string;
  STATUS: 'DRAFT' | 'DIKIRIM' | 'DINILAI';
  NILAI?: number;
  FEEDBACK?: string;
  GRADED_BY?: string;
  GRADED_AT?: string;
}

// === NEW FULL CLASSROOM SUITE TYPES ===

// 1. Forum & Announcements
export interface ForumPost {
  ID: string;
  KELAS: string;
  COURSE_ID?: string;
  AUTHOR_ID: string;
  AUTHOR_NAMA: string;
  AUTHOR_ROLE: AccountRole;
  TITLE: string;
  CONTENT: string;
  TAG: 'PENGUMUMAN' | 'DISKUSI' | 'TANYA_GURU' | 'INFO_SEKOLAH';
  IS_PINNED?: boolean;
  CREATED_AT: string;
  LIKES: string[]; // user IDs
  COMMENTS: ForumComment[];
}

export interface ForumComment {
  ID: string;
  AUTHOR_ID: string;
  AUTHOR_NAMA: string;
  AUTHOR_ROLE: AccountRole;
  CONTENT: string;
  CREATED_AT: string;
}

// 2. Presensi / Attendance
export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';

export interface AttendanceRecord {
  ID: string;
  KELAS: string;
  TANGGAL: string; // YYYY-MM-DD
  SESI: string; // e.g. "Presensi Pagi" or "Tematik"
  SISWA_ID: string;
  SISWA_NAMA: string;
  STATUS: AttendanceStatus;
  CATATAN?: string;
  RECORDED_AT: string;
  RECORDED_BY: string; // Guru or Siswa Self-Checkin
}

// 3. Kuis & CBT (Computer-Based Testing)
export interface QuizQuestion {
  ID: string;
  SOAL: string;
  PILIHAN: string[]; // [A, B, C, D]
  KUNCI_JAWABAN: number; // 0, 1, 2, 3
  PEMBAHASAN?: string;
}

export interface ClassroomQuiz {
  ID: string;
  COURSE_ID: string;
  KELAS: string;
  JUDUL: string;
  DESKRIPSI: string;
  DURASI_MENIT: number; // e.g. 30
  KKM: number; // e.g. 75
  DEADLINE: string;
  QUESTIONS: QuizQuestion[];
  CREATED_AT: string;
  GURU_ID: string;
  GURU_NAMA: string;
  IS_ACTIVE: boolean;
}

export interface QuizAttempt {
  ID: string;
  QUIZ_ID: string;
  SISWA_ID: string;
  SISWA_NAMA: string;
  KELAS: string;
  ANSWERS: { [questionId: string]: number }; // questionId -> chosen index
  SCORE: number;
  TOTAL_SOAL: number;
  BENAR: number;
  SALAH: number;
  PASSED: boolean;
  STARTED_AT: string;
  FINISHED_AT: string;
}

// 4. Modul Ajar & E-Library
export interface LearningMaterial {
  ID: string;
  KELAS: string;
  MAPEL: string;
  JUDUL: string;
  DESKRIPSI: string;
  TIPE: 'VIDEO' | 'EBOOK' | 'LKPD' | 'RANGKUMAN';
  URL_LINK?: string;
  FILE_SIZE?: string;
  RINGKASAN_KONTEN?: string;
  CREATED_AT: string;
  GURU_NAMA: string;
}

// 5. Jadwal Pelajaran & Kalender
export interface ClassScheduleItem {
  ID: string;
  KELAS: string;
  HARI: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  JAM_MULAI: string; // "07:30"
  JAM_SELESAI: string; // "09:00"
  MAPEL: string;
  GURU_NAMA: string;
  RUANGAN: string;
}

// 6. Media Pembelajaran Interaktif (Guru buat, Siswa kerjakan, Kepsek monitor)
export type MediaType = 'VIDEO' | 'MODUL_EBOOK' | 'INTERAKTIF' | 'INFOGRAFIS' | 'AUDIO';

export interface ClassroomMedia {
  ID: string;
  COURSE_ID: string;
  JUDUL: string;
  DESKRIPSI: string;
  KATEGORI: MediaType;
  MEDIA_URL?: string; // YouTube, Google Drive, PDF, etc.
  TUJUAN_PEMBELAJARAN: string;
  TUGAS_INTERAKTIF?: string; // Reflection or check question
  GURU_ID: string;
  GURU_NAMA: string;
  CREATED_AT: string;
  TARGET_KELAS?: string;
}

export interface MediaSubmission {
  ID: string;
  MEDIA_ID: string;
  SISWA_ID: string;
  SISWA_NAMA: string;
  STATUS: 'BELUM_MULAI' | 'SEDANG_DIPELAJARI' | 'SELESAI';
  JAWABAN_TUGAS?: string;
  UPDATED_AT: string;
  NILAI?: number;
  FEEDBACK?: string;
}

// 7. Virtual Live Class (Tatap Muka Daring)
export interface VirtualLiveClassSession {
  ID: string;
  KELAS: string;
  MAPEL: string;
  JUDUL: string;
  DESKRIPSI: string;
  TANGGAL: string; // YYYY-MM-DD
  JAM_MULAI: string; // HH:mm e.g. "08:00"
  JAM_SELESAI: string; // HH:mm e.g. "09:30"
  MEET_URL: string;
  PLATFORM: 'GOOGLE_MEET' | 'ZOOM' | 'WEBRTC' | 'TEAMS';
  GURU_ID: string;
  GURU_NAMA: string;
  STATUS: 'JADWAL' | 'BERLANGSUNG' | 'SELESAI';
  CREATED_AT: string;
}

// 8. Notification System
export interface ClassroomNotification {
  ID: string;
  USER_ID?: string; // specific user or undefined for all in class
  KELAS?: string;
  TITLE: string;
  MESSAGE: string;
  TYPE: 'DEADLINE' | 'LIVE_CLASS' | 'GRADE' | 'FORUM' | 'MATERIAL';
  LINK_PAGE?: string; // target view tab
  CREATED_AT: string;
  IS_READ: boolean;
}

// 9. Custom Grade Weighting Config
export interface GradeWeightConfig {
  KELAS: string;
  MAPEL: string;
  BOBOT_TUGAS: number; // default 40%
  BOBOT_KUIS: number; // default 40%
  BOBOT_PRESENSI: number; // default 20%
  BOBOT_PORTOFOLIO: number; // default 0%
  UPDATED_AT: string;
  UPDATED_BY: string;
}

// 10. Digital Student Portfolio
export interface StudentPortfolioItem {
  ID: string;
  SISWA_ID: string;
  SISWA_NAMA: string;
  KELAS: string;
  JUDUL: string;
  DESKRIPSI: string;
  KATEGORI: 'KARYA_SENI' | 'PROYEK_KODING' | 'ESAI_LITERASI' | 'PRAKTIKUM' | 'DESAIN' | 'LAINNYA';
  IMAGE_URL?: string;
  ATTACHMENT_URL?: string;
  LIKES: string[]; // user IDs
  COMMENTS: PortfolioComment[];
  CREATED_AT: string;
  IS_FEATURED?: boolean;
}

export interface PortfolioComment {
  ID: string;
  AUTHOR_ID: string;
  AUTHOR_NAMA: string;
  AUTHOR_ROLE: AccountRole;
  CONTENT: string;
  CREATED_AT: string;
}

// 11. P5 Project Progress Tracker
export interface P5ProjectStage {
  ID: string;
  NAME: string;
  DESCRIPTION: string;
  STATUS: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI';
  COMPLETED_AT?: string;
  TARGET_DATE?: string;
}

export interface P5Project {
  ID: string;
  KELAS: string;
  JUDUL: string;
  TEMA: string;
  DESKRIPSI: string;
  DIMENSI: string[];
  STAGES: P5ProjectStage[];
  PERCENTAGE: number;
  UPDATED_AT: string;
  UPDATED_BY: string;
}

