import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Award, Calendar, Sparkles, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface P5RadarChartWidgetProps {
  studentName?: string;
  studentClass?: string;
}

export interface P5EvaluationPeriod {
  periodKey: string;
  periodLabel: string;
  evaluationDate: string;
  scores: {
    beriman: number;
    kebinekaan: number;
    gotongRoyong: number;
    mandiri: number;
    bernalarKritis: number;
    kreatif: number;
  };
  notes: string;
}

export const P5RadarChartWidget: React.FC<P5RadarChartWidgetProps> = ({
  studentName = 'Siswa SDN Tangerang 6',
  studentClass = 'Kelas 4B',
}) => {
  const radarSvgRef = useRef<SVGSVGElement | null>(null);

  const evaluationPeriods: P5EvaluationPeriod[] = [
    {
      periodKey: '2026-T2',
      periodLabel: 'Evaluasi Triwulan II (Agustus 2026)',
      evaluationDate: '31 Agustus 2026',
      scores: {
        beriman: 94,
        kebinekaan: 88,
        gotongRoyong: 96,
        mandiri: 86,
        bernalarKritis: 90,
        kreatif: 92,
      },
      notes: 'Ananda konsisten memimpin doa harian dan sangat aktif dalam proyek pembuatan kompos gotong royong.',
    },
    {
      periodKey: '2026-T1',
      periodLabel: 'Evaluasi Triwulan I (Mei 2026)',
      evaluationDate: '20 Mei 2026',
      scores: {
        beriman: 88,
        kebinekaan: 82,
        gotongRoyong: 90,
        mandiri: 80,
        bernalarKritis: 84,
        kreatif: 85,
      },
      notes: 'Peningkatan signifikan pada kemandirian penyelesaian proyek sains digital.',
    },
    {
      periodKey: '2025-S2',
      periodLabel: 'Evaluasi Semester Genap (Desember 2025)',
      evaluationDate: '15 Desember 2025',
      scores: {
        beriman: 85,
        kebinekaan: 78,
        gotongRoyong: 86,
        mandiri: 75,
        bernalarKritis: 80,
        kreatif: 82,
      },
      notes: 'Awal fondasi pembiasaan karakter Profil Pelajar Pancasila.',
    },
  ];

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('2026-T2');

  const currentEvaluation =
    evaluationPeriods.find((p) => p.periodKey === selectedPeriodKey) || evaluationPeriods[0];

  const dimensions = [
    { label: 'Beriman & Bertakwa', score: currentEvaluation.scores.beriman },
    { label: 'Berkebinekaan Global', score: currentEvaluation.scores.kebinekaan },
    { label: 'Gotong Royong', score: currentEvaluation.scores.gotongRoyong },
    { label: 'Mandiri', score: currentEvaluation.scores.mandiri },
    { label: 'Bernalar Kritis', score: currentEvaluation.scores.bernalarKritis },
    { label: 'Kreatif', score: currentEvaluation.scores.kreatif },
  ];

  useEffect(() => {
    if (!radarSvgRef.current) return;
    const svgEl = d3.select(radarSvgRef.current);
    svgEl.selectAll('*').remove();

    const width = 360;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 45;
    const totalAxes = dimensions.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    const svg = svgEl
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Grid circles
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelFactor = radius * (level / levels);
      svg
        .selectAll(`.grid-level-${level}`)
        .data(dimensions)
        .enter()
        .append('line')
        .attr('x1', (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('y1', (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr('x2', (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr('y2', (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', '1px');
    }

    // Axes
    const axes = svg.selectAll('.axis').data(dimensions).enter().append('g').attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2 2');

    // Axis Labels
    axes
      .append('text')
      .attr('x', (d, i) => rScale(122) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => rScale(122) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', (d, i) => {
        const x = Math.cos(angleSlice * i - Math.PI / 2);
        return Math.abs(x) < 0.1 ? 'middle' : x > 0 ? 'start' : 'end';
      })
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', '800')
      .style('fill', '#0f172a')
      .text((d) => d.label);

    // Radar Area Polygon
    const radarLine = d3
      .lineRadial<typeof dimensions[0]>()
      .radius((d) => rScale(d.score))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg
      .append('path')
      .datum(dimensions)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(13, 148, 136, 0.28)')
      .style('stroke', '#0d9488')
      .style('stroke-width', '3px');

    // Data Vertex Dots
    svg
      .selectAll('.radarCircle')
      .data(dimensions)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('cx', (d, i) => rScale(d.score) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.score) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#0f766e')
      .style('stroke', '#ffffff')
      .style('stroke-width', '2px');
  }, [selectedPeriodKey]);

  const avgP5Score = Math.round(
    dimensions.reduce((acc, curr) => acc + curr.score, 0) / dimensions.length
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800 ring-1 ring-teal-300">
            <Award size={22} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              Radar Perkembangan 6 Dimensi Profil Pelajar Pancasila (P5)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi Karakter Berkala Siswa: {studentName} ({studentClass})
            </p>
          </div>
        </div>

        {/* Period Selector Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={selectedPeriodKey}
            onChange={(e) => setSelectedPeriodKey(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-teal-300 text-xs font-bold bg-teal-50/50 text-slate-900 focus:outline-teal-600 cursor-pointer"
          >
            {evaluationPeriods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.periodLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Radar SVG Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30 rounded-2xl border border-slate-200">
          <svg ref={radarSvgRef} className="w-full max-w-sm h-72" />
          <div className="mt-2 text-center">
            <span className="text-[11px] font-bold text-slate-500">
              Indeks Rata-Rata Capaian P5 Periodik:
            </span>
            <strong className="text-base font-black text-teal-900 ml-2">
              {avgP5Score} / 100
            </strong>
          </div>
        </div>

        {/* Dimension Score Breakdown Cards */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> Rincian Skor 6 Dimensi P5 ({currentEvaluation.evaluationDate}):
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {dimensions.map((dim) => (
              <div
                key={dim.label}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
              >
                <span className="text-xs font-bold text-slate-700">{dim.label}</span>
                <span className="text-sm font-black text-teal-900 font-mono">{dim.score}</span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-teal-900 text-white rounded-2xl text-xs space-y-1 shadow-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <ShieldCheck size={14} /> Catatan Perkembangan Wali Kelas:
            </span>
            <p className="text-teal-100 italic text-[11px] leading-relaxed">
              "{currentEvaluation.notes}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
