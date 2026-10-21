import React, { useEffect, useRef } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  Share2,
  Printer,
  Star,
  Zap,
} from 'lucide-react';

export interface ParticleCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  milestoneTitle?: string;
  milestoneCategory?: string;
  rewardPoints?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  rotation: number;
  vRotation: number;
  shape: 'square' | 'circle' | 'star';
  alpha: number;
  decay: number;
}

export const ParticleCelebration: React.FC<ParticleCelebrationProps> = ({
  isOpen,
  onClose,
  studentName = 'Ahmad Fauzi',
  milestoneTitle = 'Master 10 Tugas Tepat Waktu!',
  milestoneCategory = 'Disiplin & Ketepatan Waktu',
  rewardPoints = 500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];
    const particles: Particle[] = [];

    // Spawn 140 celebratory confetti particles
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.45;

    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 3;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // upward boost
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRotation: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'square' : 'circle',
        alpha: 1,
        decay: Math.random() * 0.008 + 0.004,
      });
    }

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rotation += p.vRotation;
        p.alpha -= p.decay;

        if (p.alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'square') {
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        } else if (p.shape === 'star') {
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * p.radius,
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.radius
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.radius / 2),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.radius / 2)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      {/* Background Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Achievement Dialog Box */}
      <div className="relative z-10 bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-amber-300 space-y-5 animate-in zoom-in-95">
        
        {/* Floating Glowing Trophy Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/30 rounded-full animate-ping" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950 flex items-center justify-center shadow-lg ring-4 ring-amber-100">
            <Trophy size={42} className="animate-bounce" />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            🎉 MILESTONE PENCAPAIAN SISWA 🎉
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">{milestoneTitle}</h2>
          <p className="text-xs font-bold text-emerald-700 mt-1">
            Selamat untuk <strong className="text-slate-950 underline">{studentName}</strong>!
          </p>
        </div>

        {/* Milestone Detail Card */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-bold">
            <span>Kategori Pencapaian:</span>
            <span className="text-amber-900">{milestoneCategory}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 font-bold">
            <span>Poin Reward Karakter:</span>
            <span className="text-emerald-700 font-black flex items-center gap-1">
              <Zap size={14} className="text-amber-500 fill-amber-500" /> +{rewardPoints} EXP
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles size={16} /> Klaim Reward & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
