import React, { useState } from 'react';
import {
  Award, Zap, CheckCircle2, MessageSquare, BookOpen, Trophy, Sparkles, Star, Lock,
  ChevronRight, Info, ShieldCheck, Check
} from 'lucide-react';
import { achievementService, BadgeItem, StudentAchievementSummary } from '../../services/achievementService';

interface StudentBadgesWidgetProps {
  siswaId: string;
  siswaNama: string;
  compact?: boolean;
}

export const StudentBadgesWidget: React.FC<StudentBadgesWidgetProps> = ({
  siswaId,
  siswaNama,
  compact = false,
}) => {
  const summary: StudentAchievementSummary = achievementService.getStudentBadges(siswaId, siswaNama);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const getIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'Zap':
        return <Zap size={size} />;
      case 'CheckCircle2':
        return <CheckCircle2 size={size} />;
      case 'MessageSquare':
        return <MessageSquare size={size} />;
      case 'Award':
        return <Award size={size} />;
      case 'BookOpen':
        return <BookOpen size={size} />;
      case 'Trophy':
        return <Trophy size={size} />;
      default:
        return <Star size={size} />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-xs font-black text-slate-800">Prestasi & Lencana Siswa</span>
          </div>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {summary.unlockedCount}/{summary.totalBadgesCount} Terbuka
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {summary.badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`shrink-0 p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                badge.unlocked
                  ? `${badge.badgeBg} ${badge.borderColor} text-slate-900 shadow-2xs hover:scale-105`
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
              }`}
              title={badge.name}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                  badge.unlocked
                    ? `bg-gradient-to-br ${badge.gradient} shadow-xs`
                    : 'bg-slate-300'
                }`}
              >
                {getIcon(badge.iconName, 14)}
              </div>
              <div className="text-left pr-1">
                <div className="text-[11px] font-bold leading-none truncate max-w-[90px]">
                  {badge.name}
                </div>
                <div className="text-[9px] font-semibold opacity-75 mt-0.5">
                  {badge.unlocked ? `+${badge.points} Poin` : 'Terkunci'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Widget Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-amber-100">
              Papan Prestasi Siswa
            </span>
            <span className="text-xs font-bold text-amber-100 flex items-center gap-1">
              <Star size={13} className="fill-amber-200 text-amber-200" /> Level {summary.level}: {summary.levelTitle}
            </span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            Lencana & Medali Virtual <Trophy size={20} className="text-amber-200" />
          </h3>
          <p className="text-xs text-amber-100 max-w-lg">
            Sistem apresiasi otomatis berbasis aktivitas pengumpulan tugas, tingkat presensi kehadiran, partisipasi forum, dan kelulusan kuis CBT.
          </p>
        </div>

        {/* Level & Points Badge */}
        <div className="relative z-10 shrink-0 bg-white/15 backdrop-blur-md border border-white/30 p-4 rounded-2xl text-center flex flex-col items-center justify-center min-w-[120px]">
          <div className="text-2xl font-black text-white">{summary.totalPoints}</div>
          <div className="text-[10px] font-extrabold text-amber-100 uppercase tracking-wider">Total Poin Prestasi</div>
          <div className="mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-amber-900">
            {summary.unlockedCount} / {summary.totalBadgesCount} Lencana
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summary.badges.map((badge) => (
          <div
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col items-center text-center justify-between ${
              badge.unlocked
                ? `${badge.badgeBg} ${badge.borderColor} hover:shadow-md hover:-translate-y-1`
                : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-80'
            }`}
          >
            {/* Top Tag */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                {badge.category}
              </span>
              {badge.unlocked ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-2xs">
                  <Check size={11} />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                  <Lock size={10} />
                </span>
              )}
            </div>

            {/* Glowing Icon Shield */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center my-2 transition group-hover:scale-110 ${
                badge.unlocked
                  ? `bg-gradient-to-br ${badge.gradient} text-white shadow-lg ring-4 ring-white`
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {getIcon(badge.iconName, 26)}
            </div>

            {/* Badge Title & Label */}
            <div className="space-y-1 mt-1">
              <h4 className="text-xs font-black text-slate-900 leading-tight">{badge.name}</h4>
              <p className="text-[10px] text-slate-500 font-semibold">{badge.progressLabel}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  badge.unlocked ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${badge.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal for Clicked Badge */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">Detail Lencana Prestasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="text-center space-y-3 py-2">
              <div
                className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl ${
                  selectedBadge.unlocked
                    ? `bg-gradient-to-br ${selectedBadge.gradient} ring-4 ring-amber-100`
                    : 'bg-slate-300'
                }`}
              >
                {getIcon(selectedBadge.iconName, 40)}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Kategori {selectedBadge.category}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">{selectedBadge.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto mt-1">
                  {selectedBadge.description}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status Ketercapaian:</span>
                  <span
                    className={`font-extrabold px-2 py-0.5 rounded-md text-[11px] ${
                      selectedBadge.unlocked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedBadge.unlocked ? '✅ Terbuka' : '🔒 Belum Terbuka'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Capaian Saat Ini:</span>
                  <span className="font-bold text-slate-800">{selectedBadge.progressLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Hadiah Poin:</span>
                  <span className="font-bold text-amber-600">+{selectedBadge.points} Poin</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
