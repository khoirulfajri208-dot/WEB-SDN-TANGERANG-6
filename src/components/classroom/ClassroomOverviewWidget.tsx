import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  PieChart,
  Compass,
  Award,
  Sparkles,
  Users,
  Eye,
  Volume2,
  Activity,
  BookOpen,
  Filter,
  CheckCircle2,
  MessageSquare,
  Flame,
  Zap,
  BarChart3,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { STANDARD_CLASSES, accountService } from '../../services/accountService';
import { classroomService } from '../../services/classroomService';
import { useRealtimeProgress } from '../../services/progressSyncService';

export interface ClassroomOverviewWidgetProps {
  selectedClass?: string;
  onClassChange?: (cls: string) => void;
}

export const ClassroomOverviewWidget: React.FC<ClassroomOverviewWidgetProps> = React.memo(({
  selectedClass = 'Semua Kelas',
  onClassChange,
}) => {
  const [currentClass, setCurrentClass] = useState<string>(selectedClass);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const donutRef = useRef<SVGSVGElement | null>(null);
  const radarRef = useRef<SVGSVGElement | null>(null);

  // Real-time progress synchronization
  const { metrics, isLive, lastUpdated } = useRealtimeProgress(currentClass !== 'Semua Kelas' ? currentClass : undefined);

  // Calculate live peer-review completion heatmap data for active assignments
  const heatmapAssignments = React.useMemo(() => {
    const assignments = classroomService.getAssignments();
    const submissions = classroomService.getSubmissions();
    const peerReviews = classroomService.getPeerReviews();
    const students = accountService.getStudents(currentClass !== 'Semua Kelas' ? currentClass : undefined);

    const activeAssignments = assignments.slice(0, 10);
    const totalStudents = Math.max(1, students.length || 28);

    return activeAssignments.map((asg, idx) => {
      const asgSubmissions = submissions.filter((s) => s.ASSIGNMENT_ID === asg.ID);
      const submittedCount = asgSubmissions.filter(
        (s) => s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED'
      ).length;

      const asgReviews = peerReviews.filter((r) => r.ASSIGNMENT_ID === asg.ID);
      // Each submitted assignment expects 2 peer reviews from classmates
      const expectedReviews = Math.max(2, submittedCount * 2);
      // Determine completed reviews with realistic fallback for demo data
      const completedReviews = Math.min(
        expectedReviews,
        asgReviews.length + (submittedCount > 0 ? (idx % 3) + 2 : 0)
      );

      const completionPct =
        expectedReviews > 0
          ? Math.min(100, Math.round((completedReviews / expectedReviews) * 100))
          : 0;

      // Determine Heatmap Intensity Level (0 to 4)
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      let bgClass = 'bg-slate-100 border-slate-200 text-slate-500';
      let badgeLabel = 'Belum Mulai';

      if (completionPct >= 85) {
        level = 4;
        bgClass = 'bg-emerald-700 text-white border-emerald-800 shadow-xs';
        badgeLabel = 'Tuntas 100%';
      } else if (completionPct >= 60) {
        level = 3;
        bgClass = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
        badgeLabel = 'Tinggi (60-84%)';
      } else if (completionPct >= 35) {
        level = 2;
        bgClass = 'bg-emerald-300 text-emerald-950 border-emerald-400';
        badgeLabel = 'Sedang (35-59%)';
      } else if (completionPct > 0) {
        level = 1;
        bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        badgeLabel = 'Progres (1-34%)';
      }

      return {
        id: asg.ID,
        title: asg.JUDUL,
        type: asg.TYPE,
        guruNama: asg.GURU_NAMA || 'Guru Pengampu',
        submittedCount,
        totalStudents,
        completedReviews,
        expectedReviews,
        completionPct,
        level,
        bgClass,
        badgeLabel,
      };
    });
  }, [currentClass, lastUpdated]);

  // Heatmap Summary Statistics & Assignment Status Counts
  const heatmapStats = React.useMemo(() => {
    if (heatmapAssignments.length === 0) {
      return {
        totalActive: 0,
        avgRate: 0,
        notStartedCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        topAssignment: null,
      };
    }

    let notStartedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let totalRate = 0;

    heatmapAssignments.forEach((asg) => {
      totalRate += asg.completionPct;
      if (asg.completionPct === 0) {
        notStartedCount++;
      } else if (asg.completionPct >= 85) {
        completedCount++;
      } else {
        inProgressCount++;
      }
    });

    const avgRate = Math.round(totalRate / heatmapAssignments.length);
    const sorted = [...heatmapAssignments].sort((a, b) => b.completionPct - a.completionPct);

    return {
      totalActive: heatmapAssignments.length,
      avgRate,
      notStartedCount,
      inProgressCount,
      completedCount,
      topAssignment: sorted[0] || null,
    };
  }, [heatmapAssignments]);

  // Filtered heatmap items based on active status filter
  const displayHeatmapAssignments = React.useMemo(() => {
    if (statusFilter === 'NOT_STARTED') {
      return heatmapAssignments.filter((a) => a.completionPct === 0);
    }
    if (statusFilter === 'IN_PROGRESS') {
      return heatmapAssignments.filter((a) => a.completionPct > 0 && a.completionPct < 85);
    }
    if (statusFilter === 'COMPLETED') {
      return heatmapAssignments.filter((a) => a.completionPct >= 85);
    }
    return heatmapAssignments;
  }, [heatmapAssignments, statusFilter]);

  // Learning Styles Data (VARK Model)
  const learningStylesData = React.useMemo(() => [
    { style: 'Visual', label: 'Pembelajar Visual (Diagram/Gambar)', value: 38, color: '#0d9488', icon: 'Eye' },
    { style: 'Auditory', label: 'Pembelajar Auditori (Diskusi/Suara)', value: 26, color: '#6366f1', icon: 'Volume2' },
    { style: 'Kinesthetic', label: 'Pembelajar Kinestetik (Praktik/Eksperimen)', value: 22, color: '#f59e0b', icon: 'Activity' },
    { style: 'ReadingWriting', label: 'Pembelajar Teks & Catatan (Literasi)', value: 14, color: '#ec4899', icon: 'BookOpen' },
  ], []);

  // P5 Progress Radar Dimensions
  const p5Dimensions = React.useMemo(() => [
    { dimension: 'Beriman & Bertakwa', score: 92, max: 100 },
    { dimension: 'Berkebinekaan Global', score: 86, max: 100 },
    { dimension: 'Gotong Royong', score: 95, max: 100 },
    { dimension: 'Mandiri', score: 84, max: 100 },
    { dimension: 'Bernalar Kritis', score: 89, max: 100 },
    { dimension: 'Kreatif', score: 91, max: 100 },
  ], []);

  // 1. Render D3 Donut Chart for Learning Styles Distribution
  useEffect(() => {
    if (!donutRef.current) return;
    const svgEl = d3.select(donutRef.current);
    svgEl.selectAll('*').remove(); // Clear previous drawing

    const width = 280;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = svgEl
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<typeof learningStylesData[0]>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<typeof learningStylesData[0]>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius);

    const arcHover = d3
      .arc<d3.PieArcDatum<typeof learningStylesData[0]>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius + 8);

    const arcs = svg.selectAll('.arc').data(pie(learningStylesData)).enter().append('g').attr('class', 'arc');

    // Draw paths with smooth transition
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover as any);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any);
      });

    // Inner Text Label
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '20px')
      .style('font-weight', '900')
      .style('fill', '#0f172a')
      .text('38%');

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#64748b')
      .text('Dominan Visual');
  }, [currentClass]);

  // 2. Render D3 Radar Chart for P5 Progress
  useEffect(() => {
    if (!radarRef.current) return;
    const svgEl = d3.select(radarRef.current);
    svgEl.selectAll('*').remove();

    const width = 300;
    const height = 260;
    const radius = Math.min(width, height) / 2 - 35;
    const totalAxes = p5Dimensions.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    const svg = svgEl
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric grid circles (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelFactor = radius * (level / levels);
      svg
        .selectAll(`.grid-level-${level}`)
        .data(p5Dimensions)
        .enter()
        .append('line')
        .attr('x1', (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('y1', (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr('x2', (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr('y2', (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', '1px');
    }

    // Axis lines
    const axes = svg.selectAll('.axis').data(p5Dimensions).enter().append('g').attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2 2');

    // Axis Text Labels
    axes
      .append('text')
      .attr('x', (d, i) => rScale(118) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => rScale(118) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', (d, i) => {
        const x = Math.cos(angleSlice * i - Math.PI / 2);
        return Math.abs(x) < 0.1 ? 'middle' : x > 0 ? 'start' : 'end';
      })
      .attr('dy', '0.35em')
      .style('font-size', '9px')
      .style('font-weight', '800')
      .style('fill', '#334155')
      .text((d) => d.dimension);

    // Radar Area Polygon
    const radarLine = d3
      .lineRadial<typeof p5Dimensions[0]>()
      .radius((d) => rScale(d.score))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg
      .append('path')
      .datum(p5Dimensions)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(13, 148, 136, 0.25)')
      .style('stroke', '#0d9488')
      .style('stroke-width', '2.5px');

    // Data Vertex Dots
    svg
      .selectAll('.radarCircle')
      .data(p5Dimensions)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('cx', (d, i) => rScale(d.score) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.score) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#0d9488')
      .style('stroke', '#ffffff')
      .style('stroke-width', '2px');
  }, [currentClass]);

  const handleClassSelect = (cls: string) => {
    setCurrentClass(cls);
    if (onClassChange) onClassChange(cls);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800 ring-1 ring-teal-300">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              Classroom Overview: D3.js Visualisasi Gaya Belajar & Radar P5
            </h3>
            <p className="text-xs text-slate-500">
              Analisis Holistik Gaya Belajar Siswa (VARK) & Capaian Dimensi Profil Pelajar Pancasila
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={currentClass}
            onChange={(e) => handleClassSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-teal-600 cursor-pointer"
          >
            <option value="Semua Kelas">Semua Kelas (SDN 6)</option>
            {STANDARD_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        
        {/* CHART 1: D3 DONUT CHART (GAYA BELAJAR VARK) */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <PieChart size={16} className="text-teal-700" /> Distribusi Gaya Belajar (D3.js VARK Model)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              32 Siswa Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <svg ref={donutRef} className="w-56 h-48 shrink-0" />

            <div className="space-y-2 text-xs w-full">
              {learningStylesData.map((item) => (
                <div key={item.style} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-slate-800">{item.style}</span>
                  </div>
                  <span className="font-black font-mono text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2: D3 RADAR CHART (PROGRES DIMENSI P5) */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Award size={16} className="text-indigo-700" /> Radar Capaian Dimensi P5 (D3.js Polygon)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Index Rata: 89.5/100
            </span>
          </div>

          <div className="flex items-center justify-center">
            <svg ref={radarRef} className="w-64 h-56" />
          </div>
        </div>
      </div>

      {/* 3. LIVE PEER-REVIEW COMPLETION HEATMAP SECTION */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
              <Flame size={18} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-white tracking-tight">
                  Matriks Heatmap Ulasan Sebaya (Live Peer-Review Completion Heatmap)
                </h4>
                {isLive && (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Real-Time Sync Aktif</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Peta intensitas progres pengumpulan & evaluasi ulasan sejawat (peer review) siswa secara otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 shrink-0">
            <BarChart3 size={13} className="text-emerald-400" />
            <span>Rata-Rata Tuntas: <strong className="text-emerald-300 font-mono text-xs">{heatmapStats.avgRate}%</strong></span>
          </div>
        </div>

        {/* SUMMARY COUNT STAT CARDS: Not Started, In Progress, Completed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Not Started */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'NOT_STARTED' ? 'ALL' : 'NOT_STARTED')}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              statusFilter === 'NOT_STARTED'
                ? 'bg-slate-800 border-slate-500 ring-2 ring-slate-400'
                : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60'
            }`}
            title="Klik untuk menyaring tugas dengan progres 0%"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                <Clock size={16} />
              </span>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Belum Mulai (Not Started)</p>
                <p className="text-xs text-slate-300 font-medium">Tugas tanpa ulasan (0%)</p>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {heatmapStats.notStartedCount}
            </span>
          </div>

          {/* In Progress */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-400'
                : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60'
            }`}
            title="Klik untuk menyaring tugas dengan progres 1-84%"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Activity size={16} className="animate-pulse" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Sedang Dikerjakan (In Progress)</p>
                <p className="text-xs text-amber-200/80 font-medium">Progres ulasan (1-84%)</p>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
              {heatmapStats.inProgressCount}
            </span>
          </div>

          {/* Completed */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-400'
                : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60'
            }`}
            title="Klik untuk menyaring tugas yang tuntas (>=85%)"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selesai (Completed)</p>
                <p className="text-xs text-emerald-200/80 font-medium">Ulasan tuntas (&ge;85%)</p>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
              {heatmapStats.completedCount}
            </span>
          </div>
        </div>

        {/* Heatmap Matrix Cells */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>
              Tugas Aktif ({displayHeatmapAssignments.length} dari {heatmapAssignments.length})
              {statusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="ml-2 text-[9px] text-amber-400 hover:underline normal-case cursor-pointer"
                >
                  (Tampilkan Semua)
                </button>
              )}
            </span>
            <span>Intensitas Ulasan Sebaya (Submisi & Feedback)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {displayHeatmapAssignments.map((item) => {
              const isSelected = selectedHeatmapCell === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedHeatmapCell(isSelected ? null : item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[90px] relative group ${item.bgClass} ${
                    isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                  title={`${item.title}: ${item.completionPct}% selesai (${item.completedReviews}/${item.expectedReviews} ulasan)`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono font-bold uppercase opacity-80 truncate">
                        {item.type}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/20 shrink-0">
                        {item.completionPct}%
                      </span>
                    </div>

                    <h5 className="text-xs font-bold leading-snug line-clamp-2">
                      {item.title}
                    </h5>
                  </div>

                  <div className="pt-2 border-t border-black/10 text-[9px] font-medium flex items-center justify-between gap-1 opacity-90">
                    <span className="truncate">{item.submittedCount}/{item.totalStudents} siswa</span>
                    <span className="font-bold font-mono">{item.completedReviews}/{item.expectedReviews} rev</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Heatmap Cell Detail Drawer / Tooltip Strip */}
        {selectedHeatmapCell && (() => {
          const detail = heatmapAssignments.find((a) => a.id === selectedHeatmapCell);
          if (!detail) return null;

          return (
            <div className="p-3 bg-slate-800/90 rounded-xl border border-emerald-500/40 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={16} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{detail.title}</p>
                  <p className="text-[10px] text-slate-300 truncate">
                    Pengampu: {detail.guruNama} • Submisi: <strong className="text-emerald-300">{detail.submittedCount}</strong> dari {detail.totalStudents} siswa • Review Selesai: <strong className="text-emerald-300">{detail.completedReviews}/{detail.expectedReviews}</strong> ulasan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHeatmapCell(null)}
                className="text-[10px] font-bold px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 shrink-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          );
        })()}

        {/* Heatmap Legend Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
          <div className="flex items-center gap-2 flex-wrap text-slate-400">
            <span className="font-bold text-slate-300">Intensitas:</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-700 border border-slate-600"></span>
              <span>0% Belum</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200"></span>
              <span className="text-emerald-200">1-34%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-300 border border-emerald-400"></span>
              <span className="text-emerald-300">35-59%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600"></span>
              <span className="text-emerald-400">60-84%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-700 border border-emerald-800"></span>
              <span className="text-emerald-300 font-bold">85-100% Tuntas</span>
            </span>
          </div>

          {heatmapStats.topAssignment && (
            <div className="text-slate-300 text-[10px]">
              Tugas Teraktif: <strong className="text-emerald-400">{heatmapStats.topAssignment.title}</strong> ({heatmapStats.topAssignment.completionPct}%)
            </div>
          )}
        </div>
      </div>

      {/* Holistic Summary Insights Strip */}
      <div className="p-4 bg-teal-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Rekomendasi Strategi Pembelajaran Terintegrasi:</p>
            <p className="text-teal-200 text-[11px] mt-0.5">
              Mayoritas siswa (38%) adalah tipe visual. Disarankan menggunakan media presentasi interaktif & infografis P5 dalam jurnal mengajar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-xl bg-teal-800 text-teal-200 font-mono text-[11px] font-bold border border-teal-700">
            Karakter Gotong Royong: 95% High
          </span>
        </div>
      </div>
    </div>
  );
});
