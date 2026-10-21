import { classroomService } from './classroomService';

export interface BadgeItem {
  id: string;
  name: string;
  category: 'AKADEMIK' | 'PRESENSI' | 'FORUM' | 'KUIS' | 'LITERASI' | 'PRESTASI';
  description: string;
  iconName: 'Zap' | 'Award' | 'MessageSquare' | 'CheckCircle2' | 'BookOpen' | 'Trophy';
  gradient: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 - 100
  progressLabel: string; // e.g., "2/2 Tugas Selesai"
  points: number;
}

export interface StudentAchievementSummary {
  siswaId: string;
  siswaNama: string;
  totalPoints: number;
  level: number;
  levelTitle: string;
  unlockedCount: number;
  totalBadgesCount: number;
  badges: BadgeItem[];
}

class AchievementService {
  public getStudentBadges(siswaId: string, siswaNama: string): StudentAchievementSummary {
    // 1. Assignment Submissions Data
    const submissions = classroomService.getSubmissions(undefined, siswaId);
    const completedSubs = submissions.filter((s) => s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED');
    const highGradeSubs = submissions.filter((s) => (s.NILAI || 0) >= 85);

    // 2. Attendance Data
    const allAttendance = classroomService.getAttendanceRecords();
    const studentAttendance = allAttendance.filter(
      (a) => a.SISWA_ID === siswaId || (a.SISWA_NAMA && a.SISWA_NAMA.toLowerCase() === siswaNama.toLowerCase())
    );
    const hadirRecords = studentAttendance.filter((a) => a.STATUS === 'HADIR');
    const attendanceRate = studentAttendance.length > 0
      ? Math.round((hadirRecords.length / studentAttendance.length) * 100)
      : 100; // Default 100% if first session

    // 3. Forum Activity Data
    const forumPosts = classroomService.getForumPosts();
    let forumCount = 0;
    forumPosts.forEach((post) => {
      if (post.AUTHOR_ID === siswaId) forumCount++;
      if (post.COMMENTS) {
        post.COMMENTS.forEach((c) => {
          if (c.AUTHOR_ID === siswaId) forumCount++;
        });
      }
    });

    // 4. Quiz Attempts Data
    const quizAttempts = classroomService.getQuizAttempts(undefined, siswaId);
    const highQuizAttempts = quizAttempts.filter((q) => q.SCORE >= 85 || q.PASSED);

    // 5. Reading Materials Progress Data
    const materials = classroomService.getMaterials();
    let completedMaterialsCount = 0;
    materials.forEach((mat) => {
      try {
        const key = `reading_progress_${mat.ID}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.completed || parsed.progress >= 90) {
            completedMaterialsCount++;
          }
        }
      } catch {
        // ignore
      }
    });

    // --- BADGE 1: Fast Learner / Pembelajar Cepat ---
    const fastLearnerUnlocked = completedSubs.length >= 2 || highGradeSubs.length >= 1;
    const fastLearnerProgress = Math.min(100, Math.round((completedSubs.length / 2) * 100));
    const badgeFastLearner: BadgeItem = {
      id: 'fast_learner',
      name: 'Pembelajar Cepat',
      category: 'AKADEMIK',
      description: 'Mengumpulkan minimal 2 tugas atau memperoleh nilai tugas ≥ 85',
      iconName: 'Zap',
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      borderColor: 'border-amber-400',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      unlocked: fastLearnerUnlocked,
      unlockedAt: fastLearnerUnlocked ? 'Aktif' : undefined,
      progress: fastLearnerProgress,
      progressLabel: `${completedSubs.length}/2 Tugas Dikumpul`,
      points: 100,
    };

    // --- BADGE 2: Perfect Attendance / Kehadiran Sempurna ---
    const attendanceUnlocked = studentAttendance.length >= 1 && attendanceRate >= 90;
    const badgeAttendance: BadgeItem = {
      id: 'perfect_attendance',
      name: 'Kehadiran Sempurna',
      category: 'PRESENSI',
      description: 'Memiliki persentase kehadiran sekolah ≥ 90% pada sesi presensi',
      iconName: 'CheckCircle2',
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      borderColor: 'border-emerald-400',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      unlocked: attendanceUnlocked,
      unlockedAt: attendanceUnlocked ? 'Aktif' : undefined,
      progress: attendanceRate,
      progressLabel: `${attendanceRate}% Kehadiran (${hadirRecords.length} Sesi)`,
      points: 150,
    };

    // --- BADGE 3: Top Contributor / Kontributor Teraktif ---
    const forumUnlocked = forumCount >= 2;
    const forumProgress = Math.min(100, Math.round((forumCount / 2) * 100));
    const badgeForum: BadgeItem = {
      id: 'top_contributor',
      name: 'Kontributor Teraktif',
      category: 'FORUM',
      description: 'Aktif bertanya, menjawab, atau berdiskusi minimal 2 kali di Forum Kelas',
      iconName: 'MessageSquare',
      gradient: 'from-blue-400 via-indigo-500 to-blue-600',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-50',
      unlocked: forumUnlocked,
      unlockedAt: forumUnlocked ? 'Aktif' : undefined,
      progress: forumProgress,
      progressLabel: `${forumCount}/2 Diskusi Forum`,
      points: 120,
    };

    // --- BADGE 4: Quiz Master / Juara Kuis CBT ---
    const quizUnlocked = highQuizAttempts.length >= 1 || quizAttempts.length >= 1;
    const quizProgress = quizAttempts.length > 0 ? 100 : 0;
    const badgeQuiz: BadgeItem = {
      id: 'quiz_master',
      name: 'Juara Kuis CBT',
      category: 'KUIS',
      description: 'Menyelesaikan Kuis / Ujian CBT dengan nilai tuntas melebihi KKM',
      iconName: 'Award',
      gradient: 'from-purple-400 via-violet-600 to-indigo-700',
      borderColor: 'border-purple-400',
      textColor: 'text-purple-700',
      badgeBg: 'bg-purple-50',
      unlocked: quizUnlocked,
      unlockedAt: quizUnlocked ? 'Aktif' : undefined,
      progress: quizProgress,
      progressLabel: `${quizAttempts.length} Kuis Selesai`,
      points: 150,
    };

    // --- BADGE 5: Digital Bookworm / Literat Digital ---
    const literacyUnlocked = completedMaterialsCount >= 1;
    const literacyProgress = Math.min(100, Math.round((completedMaterialsCount / 1) * 100));
    const badgeLiteracy: BadgeItem = {
      id: 'digital_bookworm',
      name: 'Literat Digital',
      category: 'LITERASI',
      description: 'Membaca dan menyelesaikan progres 100% pada modul bahan ajar digital',
      iconName: 'BookOpen',
      gradient: 'from-cyan-400 via-teal-600 to-blue-700',
      borderColor: 'border-cyan-400',
      textColor: 'text-cyan-700',
      badgeBg: 'bg-cyan-50',
      unlocked: literacyUnlocked,
      unlockedAt: literacyUnlocked ? 'Aktif' : undefined,
      progress: literacyProgress,
      progressLabel: `${completedMaterialsCount} Modul Tuntas`,
      points: 100,
    };

    // --- BADGE 6: Helper Badge / Mitra Belajar Terbaik ---
    const allPeerReviews = classroomService.getPeerReviews();
    const thumbsUpCount = allPeerReviews.filter(
      (r) => r.REVIEWER_ID === siswaId && r.THUMBS_UP
    ).length;

    const helperBadgeUnlocked = thumbsUpCount >= 1;
    const helperBadgeProgress = thumbsUpCount > 0 ? 100 : 0;
    const badgeHelper: BadgeItem = {
      id: 'helper_badge',
      name: 'Lencana Helper Sejati',
      category: 'PRESTASI',
      description: "Diberikan saat ulasan peer-review konstruktif Anda disukai (Thumbs-Up 👍) oleh teman sekelas.",
      iconName: 'MessageSquare',
      gradient: 'from-pink-400 via-rose-500 to-red-600',
      borderColor: 'border-rose-400',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-50',
      unlocked: helperBadgeUnlocked,
      unlockedAt: helperBadgeUnlocked ? 'Aktif' : undefined,
      progress: helperBadgeProgress,
      progressLabel: `${thumbsUpCount}/1 Thumbs-Up Diterima`,
      points: 100,
    };

    // Count unlocked basic badges
    const basicBadges = [badgeFastLearner, badgeAttendance, badgeForum, badgeQuiz, badgeLiteracy, badgeHelper];
    const unlockedBasicCount = basicBadges.filter((b) => b.unlocked).length;

    // --- BADGE 6: Siswa Teladan / Bintang Papan Atas ---
    const teladanUnlocked = unlockedBasicCount >= 3;
    const teladanProgress = Math.min(100, Math.round((unlockedBasicCount / 3) * 100));
    const badgeTeladan: BadgeItem = {
      id: 'siswa_teladan',
      name: 'Siswa Teladan Bintang 5',
      category: 'PRESTASI',
      description: 'Mencapai prestasi luar biasa dengan membuka minimal 3 lencana utama',
      iconName: 'Trophy',
      gradient: 'from-amber-300 via-yellow-500 to-rose-600',
      borderColor: 'border-yellow-400',
      textColor: 'text-amber-800',
      badgeBg: 'bg-amber-100',
      unlocked: teladanUnlocked,
      unlockedAt: teladanUnlocked ? 'Aktif' : undefined,
      progress: teladanProgress,
      progressLabel: `${unlockedBasicCount}/3 Lencana Utama`,
      points: 250,
    };

    const allBadges = [...basicBadges, badgeTeladan];
    const unlockedCount = allBadges.filter((b) => b.unlocked).length;
    const totalPoints = allBadges.reduce((acc, b) => (b.unlocked ? acc + b.points : acc), 0);

    let level = 1;
    let levelTitle = 'Siswa Pembelajar';
    if (totalPoints >= 600) {
      level = 4;
      levelTitle = 'Bintang Utama Sekolah';
    } else if (totalPoints >= 400) {
      level = 3;
      levelTitle = 'Pembelajar Unggul';
    } else if (totalPoints >= 200) {
      level = 2;
      levelTitle = 'Pembelajar Aktif';
    }

    return {
      siswaId,
      siswaNama,
      totalPoints,
      level,
      levelTitle,
      unlockedCount,
      totalBadgesCount: allBadges.length,
      badges: allBadges,
    };
  }
}

export const achievementService = new AchievementService();
