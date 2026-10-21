import React, { useMemo, useState } from 'react';

// ─── Sparkline ───────────────────────────────────────────────
// Tiny inline trend chart for KPI cards
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#10b981',
  height = 32,
  fill = true,
}) => {
  const width = 100;
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
};

// ─── DonutChart ──────────────────────────────────────────────
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {data.map((slice, i) => {
            const pct = slice.value / total;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const circle = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-2xl font-black text-slate-800">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="font-semibold text-slate-700">{slice.label}</span>
            <span className="text-slate-400 ml-auto font-mono">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── AreaChart ───────────────────────────────────────────────
interface AreaChartDatum {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartDatum[];
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  color = '#10b981',
  height = 200,
  valueFormatter = (v) => String(v),
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const points = data.map((d, i) => {
    const x = padX + i * step;
    const y = padY + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0},${padY + chartH} L ${padX},${padY + chartH} Z`;
  const gradId = `area-${color.replace('#', '')}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((g, i) => {
        const y = padY + chartH * g;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              {valueFormatter(Math.round(max * (1 - g)))}
            </text>
          </g>
        );
      })}

      {/* Area + Line */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points + Hover */}
      {points.map((p, i) => (
        <g key={i}>
          <rect
            x={p.x - step / 2}
            y={0}
            width={step}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
          {hoverIdx === i && (
            <>
              <line x1={p.x} y1={padY} x2={p.x} y2={padY + chartH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" />
              <g transform={`translate(${p.x}, ${p.y - 12})`}>
                <rect x="-30" y="-22" width="60" height="20" rx="6" fill="#1e293b" />
                <text x="0" y="-8" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">
                  {valueFormatter(p.value)}
                </text>
              </g>
            </>
          )}
          {hoverIdx !== i && (
            <circle cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.6" />
          )}
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="500">
          {p.label}
        </text>
      ))}
    </svg>
  );
};

// ─── BarChart ────────────────────────────────────────────────
interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 180,
  valueFormatter = (v) => String(v),
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 100 / (data.length * 1.5);

  return (
    <div className="flex items-end justify-around gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 35);
        const color = d.color || '#10b981';
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5 group">
            <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {valueFormatter(d.value)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80 relative"
              style={{
                height: Math.max(h, 2),
                background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
              }}
            />
            <span className="text-[9px] font-semibold text-slate-400 text-center truncate max-w-full">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── ProgressRing ────────────────────────────────────────────
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 90,
  thickness = 8,
  color = '#10b981',
  label,
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dash = pct * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-800">{Math.round(pct * 100)}%</span>
        {label && <span className="text-[8px] font-semibold text-slate-400">{label}</span>}
      </div>
    </div>
  );
};
