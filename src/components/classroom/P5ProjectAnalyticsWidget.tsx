import React, { useState, useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  Award,
  Users,
  Target,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import { classroomService } from '../../services/classroomService';
import { P5Project } from '../../types/classroom';

interface P5ProjectAnalyticsWidgetProps {
  className?: string;
}

export const P5ProjectAnalyticsWidget: React.FC<P5ProjectAnalyticsWidgetProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'PROGRESS' | 'DIMENSION'>('PROGRESS');

  // Load all P5 projects from the classroom service
  const projects = useMemo(() => {
    try {
      return classroomService.getP5Projects();
    } catch (e) {
      console.error('Error fetching P5 projects:', e);
      return [];
    }
  }, []);

  // 1. Data Prep for Progress Bar Chart
  const progressData = useMemo(() => {
    return projects.map((p) => ({
      name: p.KELAS,
      'Progres (%)': p.PERCENTAGE,
      judul: p.JUDUL,
      tema: p.TEMA,
      stages: p.STAGES.length,
      completed: p.STAGES.filter((s) => s.STATUS === 'SELESAI').length,
    }));
  }, [projects]);

  // 2. Data Prep for Dimension Coverage & Engagement Radar
  const dimensionData = useMemo(() => {
    const dimensions = [
      'Kebinekaan Global',
      'Gotong Royong',
      'Kreatif',
      'Beriman & Bertakwa',
      'Mandiri',
      'Bernalar Kritis',
    ];

    return dimensions.map((dim) => {
      // Find all projects targeting this dimension
      const targetingProjects = projects.filter((p) => p.DIMENSI.includes(dim));
      
      // Calculate active engagement (cumulative progress of projects targeting this dimension)
      const engagementScore = targetingProjects.length > 0
        ? Math.round(targetingProjects.reduce((sum, p) => sum + p.PERCENTAGE, 0) / targetingProjects.length)
        : 0;

      return {
        subject: dim,
        'Jumlah Proyek': targetingProjects.length,
        'Engagement Rate (%)': engagementScore || 10, // base baseline of 10% for layout beauty
        fullMark: 100,
      };
    });
  }, [projects]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const avgProgress = totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.PERCENTAGE, 0) / totalProjects)
      : 0;
    
    // Most popular dimension
    const dimCounts: Record<string, number> = {};
    projects.forEach((p) => {
      p.DIMENSI.forEach((d) => {
        dimCounts[d] = (dimCounts[d] || 0) + 1;
      });
    });

    let topDim = 'Gotong Royong';
    let maxCount = 0;
    Object.entries(dimCounts).forEach(([dim, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topDim = dim;
      }
    });

    return {
      totalProjects,
      avgProgress,
      topDim,
      maxCount,
    };
  }, [projects]);

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/95 shadow-xs p-5 relative overflow-hidden ${className}`}>
      {/* Decorative subtle background mesh */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-100/30 to-teal-100/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xs shrink-0">
            <Compass size={18} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              Analitik Proyek Karakter P5
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100/60 uppercase">
                Kurikulum Merdeka
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statistik penyelesaian tahapan dan kekuatan dimensi Profil Pelajar Pancasila siswa
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PROGRESS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PROGRESS'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={13} />
            Penyelesaian Kelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DIMENSION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DIMENSION'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target size={13} />
            Karakter Dimensi P5
          </button>
        </div>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Proyek P5</div>
          <div className="text-xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
            {summaryMetrics.totalProjects} Proyek
            <span className="text-[10px] font-semibold text-slate-500">Kelas 1-6</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/70">
          <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Rata-Rata Progres</div>
          <div className="text-xl font-black text-indigo-950 mt-1 flex items-center gap-1.5">
            {summaryMetrics.avgProgress}%
            <span className="text-[10px] font-semibold text-indigo-600/70">Penyelesaian</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/70">
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Dimensi Teraktif</div>
          <div className="text-xs font-black text-emerald-950 mt-1 truncate" title={summaryMetrics.topDim}>
            ✨ {summaryMetrics.topDim}
            <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">Fokus di {summaryMetrics.maxCount} Tingkat</span>
          </div>
        </div>
      </div>

      {/* Chart Output Panel */}
      <div className="h-[280px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'PROGRESS' ? (
            <BarChart
              data={progressData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={600}
                tickLine={false} 
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs max-w-[240px] space-y-1">
                        <div className="font-extrabold text-indigo-300">{data.name}</div>
                        <div className="font-bold text-white text-[11px] leading-tight mb-1">{data.judul}</div>
                        <div className="text-[10px] text-slate-300">Tema: <strong className="text-amber-300 font-bold">{data.tema}</strong></div>
                        <div className="text-[10px] text-slate-300">Tahap Selesai: <strong className="text-emerald-400 font-bold">{data.completed}</strong> dari {data.stages} langkah</div>
                        <div className="text-[10px] text-indigo-300 font-black mt-1">Progres: {data['Progres (%)']}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="Progres (%)" 
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              >
                {progressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dimensionData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                stroke="#475569" 
                fontSize={10} 
                fontWeight={700} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                stroke="#94a3b8" 
                fontSize={8} 
              />
              <Radar
                name="Engagement Rate"
                dataKey="Engagement Rate (%)"
                stroke="#4f46e5"
                fill="#818cf8"
                fillOpacity={0.25}
              />
              <Radar
                name="Jumlah Proyek"
                dataKey="Jumlah Proyek"
                stroke="#10b981"
                fill="#34d399"
                fillOpacity={0.15}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                        <div className="font-black text-amber-300">{data.subject}</div>
                        <div className="text-[10px] text-slate-300">Jumlah Tingkat Kelas: <strong className="text-white font-black">{data['Jumlah Proyek']} Kelas</strong></div>
                        <div className="text-[10px] text-slate-300">Engagement Index: <strong className="text-emerald-400 font-black">{data['Engagement Rate (%)']}%</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom informational guidance */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
          <Layers size={12} className="text-slate-400" />
          Keterangan: BB (Belum Berkembang) • MB (Mulai) • BSH (Sesuai Harapan) • SAB (Sangat Berkembang)
        </div>
        <div className="text-[10px] text-slate-400 italic">
          Berdasarkan entri guru aktif
        </div>
      </div>
    </div>
  );
};
