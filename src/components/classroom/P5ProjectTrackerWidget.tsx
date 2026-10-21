import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  Clock,
  Circle,
  Award,
  Sparkles,
  ChevronDown,
  Layers,
  Edit3,
  Calendar,
  UserCheck,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
} from 'lucide-react';
import { Account, P5Project, P5ProjectStage } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { STANDARD_CLASSES } from '../../services/accountService';

interface P5ProjectTrackerWidgetProps {
  account: Account;
  className?: string;
}

export const P5ProjectTrackerWidget: React.FC<P5ProjectTrackerWidgetProps> = ({ account, className = '' }) => {
  const isGuru = account.ROLE === 'GURU' || account.ROLE === 'ADMIN' || account.ROLE === 'OPERATOR';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const isSiswa = account.ROLE === 'SISWA';

  // Default class selection
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 4');
  const [project, setProject] = useState<P5Project>(() => classroomService.getP5ProjectForClass(selectedKelas));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // P5 AI Mentor Bot States
  const [showP5Bot, setShowP5Bot] = useState(false);
  const [p5Messages, setP5Messages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: `Halo! Saya **AI Mentor Karakter & Ide Kreatif P5**. 🧭✨\n\nSaya siap membantu Bapak/Ibu Guru merancang proyek P5 tingkat sekolah dasar.\n\nSilakan pilih salah satu pertanyaan cepat di bawah atau ketikkan pertanyaan Anda sendiri!`,
    },
  ]);
  const [p5Input, setP5Input] = useState('');
  const [p5Loading, setP5Loading] = useState(false);

  const handleSendP5Message = async (textToSend?: string) => {
    const text = (textToSend || p5Input).trim();
    if (!text || p5Loading) return;

    // Add user message
    const userMsg = { sender: 'user' as const, text };
    setP5Messages((prev) => [...prev, userMsg]);
    if (!textToSend) setP5Input('');
    setP5Loading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          assistantType: 'P5_MENTOR',
          userName: account.NAMA,
          userRole: account.ROLE,
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.reply) {
        setP5Messages((prev) => [
          ...prev,
          { sender: 'bot' as const, text: result.data.reply },
        ]);
      } else {
        setP5Messages((prev) => [
          ...prev,
          { sender: 'bot' as const, text: 'Maaf, saya tidak dapat memproses tanggapan saat ini. Silakan coba beberapa saat lagi.' },
        ]);
      }
    } catch (error) {
      console.error('Error contacting P5 Bot:', error);
      setP5Messages((prev) => [
        ...prev,
        { sender: 'bot' as const, text: 'Koneksi ke asisten AI terputus. Silakan periksa jaringan internet Anda.' },
      ]);
    } finally {
      setP5Loading(false);
    }
  };

  useEffect(() => {
    const updated = classroomService.getP5ProjectForClass(selectedKelas);
    setProject(updated);
  }, [selectedKelas]);

  const handleStageStatusChange = (
    stageId: string,
    newStatus: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI'
  ) => {
    const updated = classroomService.updateP5StageStatus(
      project.ID,
      stageId,
      newStatus,
      account.NAMA || 'Guru'
    );
    setProject(updated);

    const stageObj = updated.STAGES.find((s) => s.ID === stageId);
    setToastMessage(`Status "${stageObj?.NAME || 'Tahapan'}" diperbarui menjadi ${newStatus.replace('_', ' ')}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getStatusBadge = (status: P5ProjectStage['STATUS']) => {
    switch (status) {
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" /> Selesai
          </span>
        );
      case 'SEDANG_BERJALAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Clock size={12} className="text-blue-600" /> Sedang Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
            <Circle size={12} className="text-slate-400" /> Belum Mulai
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden ${className}`}>
      {/* Background Accent Decorative Pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100/40 via-purple-100/30 to-pink-100/20 rounded-full blur-2xl -z-0 pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 right-4 z-20 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 border border-slate-700"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Compass size={12} /> P5 Kurikulum Merdeka
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Tema: {project.TEMA}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {project.JUDUL}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {project.DESKRIPSI}
          </p>
        </div>

        {/* Actions Header container */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* P5 AI Mentor Bot Trigger Button */}
          <button
            type="button"
            onClick={() => setShowP5Bot(!showP5Bot)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs border transition-all cursor-pointer select-none ${
              showP5Bot
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <Sparkles size={13} className={showP5Bot ? 'text-white' : 'text-indigo-600'} />
            <span>AI Mentor P5</span>
          </button>

          {/* Class Switcher for Teachers/Kepsek */}
          {(isGuru || isKepsek) && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <Layers size={14} className="text-slate-500 ml-2" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-3 cursor-pointer py-1"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* P5 AI Mentor Bot Section */}
      <AnimatePresence>
        {showP5Bot && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-indigo-100/60 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">AI Mentor Karakter & Ide P5</h4>
                  <p className="text-[10px] text-indigo-700/80">Konsultan cerdas proyek Kurikulum Merdeka</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setP5Messages([
                  {
                    sender: 'bot',
                    text: `Halo! Saya **AI Mentor Karakter & Ide Kreatif P5**. 🧭✨\n\nSaya siap membantu Bapak/Ibu Guru merancang proyek P5 tingkat sekolah dasar.\n\nSilakan pilih salah satu pertanyaan cepat di bawah atau ketikkan pertanyaan Anda sendiri!`,
                  }
                ])}
                className="p-1 rounded-md hover:bg-indigo-100 text-indigo-600 transition"
                title="Bersihkan Percakapan"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Chat History Panel */}
            <div className="max-h-[200px] overflow-y-auto mb-3 pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-indigo-200">
              {p5Messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-3xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {p5Loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs text-indigo-600 flex items-center gap-2 shadow-3xs">
                    <Loader2 size={12} className="animate-spin" />
                    <span>AI Mentor sedang merumuskan ide...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => handleSendP5Message("Berikan saya ide kegiatan proyek kreatif P5 tema Gaya Hidup Berkelanjutan")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                💡 Ide Gaya Hidup Berkelanjutan
              </button>
              <button
                type="button"
                onClick={() => handleSendP5Message("Bagaimana rancangan rubrik penilaian karakter gotong royong dan kreatif (BB, MB, BSH, SAB)?")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                📐 Rubrik Capaian Karakter
              </button>
              <button
                type="button"
                onClick={() => handleSendP5Message("Beri contoh tahapan alur proyek P5 untuk tema Kewirausahaan tingkat SD")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                📑 Alur Tema Kewirausahaan
              </button>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendP5Message();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={p5Input}
                onChange={(e) => setP5Input(e.target.value)}
                placeholder="Tanyakan ide proyek, indikator dimensi, atau draf modul P5..."
                disabled={p5Loading}
                className="flex-1 bg-white border border-indigo-100 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-indigo-950 placeholder:text-indigo-400"
              />
              <button
                type="submit"
                disabled={p5Loading || !p5Input.trim()}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Progress Section */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Award size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Progres Penyelesaian Proyek</div>
              <div className="text-[11px] text-slate-400">
                {isSiswa ? `Kelas ${account.KELAS}` : selectedKelas} • Terakhir diubah {new Date(project.UPDATED_AT).toLocaleDateString('id-ID')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-amber-400 leading-none">{project.PERCENTAGE}%</div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-0.5">Capaian Proyek</div>
          </div>
        </div>

        {/* Animated Framer-Motion Progress Bar */}
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-400 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${project.PERCENTAGE}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Dimension Badges */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400">Target Dimensi P5:</span>
          {project.DIMENSI.map((dim, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-slate-200 border border-white/10"
            >
              ✨ {dim}
            </span>
          ))}
        </div>
      </div>

      {/* Project Stages Step-by-Step Tracker */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-indigo-600" />
            Tahapan Alur Proyek P5 ({project.STAGES.filter((s) => s.STATUS === 'SELESAI').length}/{project.STAGES.length} Tahap Selesai)
          </h4>
          {isGuru && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
              <Edit3 size={11} /> Klik status untuk memperbarui
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {project.STAGES.map((stage, index) => {
            const isCompleted = stage.STATUS === 'SELESAI';
            const isInProgress = stage.STATUS === 'SEDANG_BERJALAN';

            return (
              <motion.div
                key={stage.ID}
                whileHover={{ y: -2 }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                    : isInProgress
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 ring-2 ring-blue-400/20'
                    : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      Langkah {index + 1}
                    </span>
                    {getStatusBadge(stage.STATUS)}
                  </div>

                  <h5 className="text-xs font-extrabold text-slate-900 mb-1 leading-snug">
                    {stage.NAME}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {stage.DESCRIPTION}
                  </p>
                </div>

                {/* Status Updater for Teacher or Completion Date for Student */}
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between mt-auto">
                  {stage.COMPLETED_AT && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Selesai: {stage.COMPLETED_AT}
                    </span>
                  )}

                  {/* Teacher Interactive Status Controls */}
                  {isGuru ? (
                    <div className="w-full flex items-center justify-end gap-1">
                      <select
                        value={stage.STATUS}
                        onChange={(e) =>
                          handleStageStatusChange(
                            stage.ID,
                            e.target.value as 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI'
                          )
                        }
                        className="bg-white border border-slate-300 text-[11px] font-bold rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
                      >
                        <option value="BELUM_MULAI">⭕ Belum Mulai</option>
                        <option value="SEDANG_BERJALAN">⏳ Sedang Berjalan</option>
                        <option value="SELESAI">✅ Selesai</option>
                      </select>
                    </div>
                  ) : (
                    !stage.COMPLETED_AT && (
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        {isInProgress ? 'Dalam Pengerjaan Kelas' : 'Tahap Berikutnya'}
                      </span>
                    )
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
