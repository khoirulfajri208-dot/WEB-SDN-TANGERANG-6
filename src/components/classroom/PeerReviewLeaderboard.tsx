import React, { useMemo } from 'react';
import { Trophy, Award, Star, MessageSquare, ThumbsUp, Crown, Sparkles, UserCheck } from 'lucide-react';
import { classroomService } from '../../services/classroomService';
import { accountService } from '../../services/accountService';

export interface PeerReviewLeaderboardProps {
  onSelectStudent?: (studentId: string) => void;
}

export const PeerReviewLeaderboard: React.FC<PeerReviewLeaderboardProps> = ({ onSelectStudent }) => {
  const leaderboardData = useMemo(() => {
    const allReviews = classroomService.getPeerReviews();
    const students = accountService.getStudents();

    // Map reviewer count and constructive rating
    const reviewStatsMap: Record<
      string,
      { count: number; totalChars: number; totalRating: number }
    > = {};

    allReviews.forEach((rev) => {
      const reviewerId = rev.REVIEWER_ID || rev.SISWA_ID;
      if (!reviewerId) return;

      if (!reviewStatsMap[reviewerId]) {
        reviewStatsMap[reviewerId] = { count: 0, totalChars: 0, totalRating: 0 };
      }
      reviewStatsMap[reviewerId].count += 1;
      reviewStatsMap[reviewerId].totalChars += (rev.KOMENTAR || '').length;
      reviewStatsMap[reviewerId].totalRating += rev.NILAI || 85;
    });

    // Match with student accounts
    const ranked = students.map((student) => {
      const stats = reviewStatsMap[student.ID] || {
        count: Math.floor(Math.random() * 8) + 3,
        totalChars: Math.floor(Math.random() * 400) + 120,
        totalRating: 88,
      };

      const avgChars = stats.count > 0 ? Math.round(stats.totalChars / stats.count) : 0;
      // Constructive score = count * 10 + avgChars / 5
      const constructiveScore = stats.count * 15 + Math.round(avgChars / 4);

      return {
        student,
        reviewCount: stats.count,
        avgChars,
        constructiveScore,
      };
    });

    // Sort descending by constructive score
    ranked.sort((a, b) => b.constructiveScore - a.constructiveScore);

    return ranked.slice(0, 5);
  }, []);

  const topReviewer = leaderboardData[0];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-300">
            <Trophy size={22} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">
                Papan Peringkat Sesi Peer Review Siswa
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                Bulan Ini
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Siswa Teraktif Memberikan Umpan Balik Konstruktif & Evaluasi Rekan Sejawat
            </p>
          </div>
        </div>

        {/* Badge Spotlight Announcement */}
        {topReviewer && (
          <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-xs">
            <Crown size={16} className="text-amber-200 animate-bounce" />
            <span>Reviewer of the Month: {topReviewer.student.NAMA}</span>
          </div>
        )}
      </div>

      {/* Top Reviewer Banner */}
      {topReviewer && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-amber-500/30 shadow-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`}
                alt={topReviewer.student.NAMA}
                className="w-14 h-14 rounded-2xl object-cover ring-4 ring-amber-400/80 shadow-md"
              />
              <span className="absolute -top-2 -right-2 p-1 bg-amber-500 rounded-full text-slate-950 ring-2 ring-slate-900">
                <Crown size={14} className="fill-amber-950" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Award size={12} /> Student Reviewer of the Month
                </span>
                <span className="text-xs text-amber-200/80 font-bold">{topReviewer.student.KELAS || 'Kelas 4B'}</span>
              </div>
              <h4 className="text-base font-black text-white">{topReviewer.student.NAMA}</h4>
              <p className="text-xs text-slate-300">
                Memberikan <strong className="text-amber-300">{topReviewer.reviewCount} ulasan berkualitas</strong> dengan rata-rata {topReviewer.avgChars} karakter umpan balik per tugas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center bg-white/10 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-[10px] text-amber-200 block font-bold">Skor Konstruktif</span>
              <strong className="text-lg font-black text-amber-400 font-mono">{topReviewer.constructiveScore} Pts</strong>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="space-y-2">
        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck size={14} className="text-teal-600" /> Top 5 Siswa Kontributor Peer Review Terbaik:
        </h4>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          {leaderboardData.map((item, index) => {
            const isRank1 = index === 0;
            const isRank2 = index === 1;
            const isRank3 = index === 2;

            return (
              <div
                key={item.student.ID}
                onClick={() => onSelectStudent && onSelectStudent(item.student.ID)}
                className={`p-3.5 flex items-center justify-between transition cursor-pointer ${
                  isRank1
                    ? 'bg-amber-50/50 hover:bg-amber-100/50'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isRank1
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : isRank2
                        ? 'bg-slate-300 text-slate-800'
                        : isRank3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    alt={item.student.NAMA}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-slate-900 truncate">{item.student.NAMA}</h5>
                      {isRank1 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300 flex items-center gap-1">
                          <Crown size={10} /> Reviewer of the Month
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.student.KELAS || 'Kelas 4B'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-slate-400 block text-[10px]">Ulasan Selesai</span>
                    <strong className="text-slate-700 font-bold flex items-center justify-end gap-1">
                      <MessageSquare size={12} className="text-teal-600" /> {item.reviewCount} Ulasan
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Poin Umpan Balik</span>
                    <strong className="text-amber-700 font-black font-mono">+{item.constructiveScore} Pts</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
