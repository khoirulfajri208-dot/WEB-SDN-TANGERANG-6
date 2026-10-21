import React, { useState, useMemo } from 'react';
import {
  X, Check, Sparkles, Award, FileText, ChevronRight,
  TrendingUp, Star, Sliders, MessageSquare, AlertCircle
} from 'lucide-react';
import { Account, ClassroomAssignment, ClassroomSubmission } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface QuickGradeModalProps {
  student: Account;
  account: Account;
  onClose: () => void;
  onSaved: () => void;
}

export const QuickGradeModal: React.FC<QuickGradeModalProps> = ({
  student,
  account,
  onClose,
  onSaved,
}) => {
  // Retrieve assignments for student's class
  const studentCourses = useMemo(() => {
    return classroomService.getCoursesForSiswa(student.ID, student.KELAS);
  }, [student.ID, student.KELAS]);

  const allAssignments = useMemo(() => {
    const assignments = classroomService.getAssignments();
    const courseIds = new Set(studentCourses.map((c) => c.ID));
    let list = assignments.filter((a) => courseIds.has(a.COURSE_ID));
    if (list.length === 0) list = assignments;
    return list;
  }, [studentCourses]);

  const studentSubmissions = useMemo(() => {
    return classroomService.getSubmissions(undefined, student.ID);
  }, [student.ID]);

  // Map submissions by assignment ID
  const submissionsMap = useMemo(() => {
    const map = new Map<string, ClassroomSubmission>();
    studentSubmissions.forEach((sub) => {
      map.set(sub.ASSIGNMENT_ID, sub);
    });
    return map;
  }, [studentSubmissions]);

  // Find most recent submission or latest assignment
  const initialAssignmentId = useMemo(() => {
    if (studentSubmissions.length > 0) {
      // Find latest submission
      const sorted = [...studentSubmissions].sort((a, b) => 
        (b.SUBMITTED_AT || '').localeCompare(a.SUBMITTED_AT || '')
      );
      return sorted[0].ASSIGNMENT_ID;
    }
    return allAssignments[0]?.ID || '';
  }, [studentSubmissions, allAssignments]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId);
  const activeAssignment = useMemo(() => {
    return allAssignments.find((a) => a.ID === selectedAssignmentId) || allAssignments[0];
  }, [allAssignments, selectedAssignmentId]);

  const currentSubmission = useMemo(() => {
    return activeAssignment ? submissionsMap.get(activeAssignment.ID) : undefined;
  }, [activeAssignment, submissionsMap]);

  // Grade and feedback states
  const [score, setScore] = useState<number>(
    currentSubmission?.NILAI !== undefined ? currentSubmission.NILAI : 85
  );
  const [feedback, setFeedback] = useState<string>(
    currentSubmission?.FEEDBACK || 'Bagus sekali, pemahaman materi sangat baik!'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Update form if user switches assignment
  const handleSelectAssignment = (asgId: string) => {
    setSelectedAssignmentId(asgId);
    const sub = submissionsMap.get(asgId);
    if (sub && sub.NILAI !== undefined) {
      setScore(sub.NILAI);
      setFeedback(sub.FEEDBACK || '');
    } else {
      setScore(85);
      setFeedback('Bagus sekali, pemahaman materi sangat baik!');
    }
  };

  const handleScorePreset = (val: number) => {
    setScore(Math.min(100, Math.max(0, val)));
  };

  const handleAdjustScore = (delta: number) => {
    setScore((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

  const quickFeedbackPresets = [
    '🌟 Sangat Baik & Rapi!',
    '✅ Tuntas Sesuai KKM',
    '⏰ Tepat Waktu & Lengkap',
    '📝 Perlu Peningkatan Kerapian',
    '🔍 Teliti Kembali Hitungan',
    '💡 Kreatif & Orisinal',
  ];

  const handleSave = () => {
    if (!activeAssignment) return;
    setIsSaving(true);

    try {
      let sub = currentSubmission;
      if (!sub) {
        // Create submission on the fly
        sub = classroomService.saveSubmission({
          ASSIGNMENT_ID: activeAssignment.ID,
          COURSE_ID: activeAssignment.COURSE_ID,
          SISWA_ID: student.ID,
          SISWA_NAMA: student.NAMA,
          ISI: `Pengumpulan tugas & penilaian langsung melalui fitur Quick Grade.`,
          STATUS: 'SUBMITTED',
        });
      }

      classroomService.gradeSubmission(
        sub.ID,
        score,
        feedback,
        account.NAMA || 'Guru Pengampu'
      );

      setSavedSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to quick grade submission:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Color dynamic for score badge
  const scoreColor = score >= 85
    ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
    : score >= 75
    ? 'text-blue-700 bg-blue-50 border-blue-300'
    : score >= 60
    ? 'text-amber-700 bg-amber-50 border-amber-300'
    : 'text-rose-700 bg-rose-50 border-rose-300';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-sm border border-amber-400/30 shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Penilaian Cepat (Quick Grade)</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {student.KELAS || 'Kelas 1'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold">{student.NAMA} <span className="text-slate-400 font-mono text-[11px]">• NIS: {student.NIP || '-'}</span></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-slate-800">
          
          {/* Assignment Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span>Pilih Tugas / Submission:</span>
              <span className="text-[10px] text-blue-600 font-bold">
                {studentSubmissions.length} Tugas Tersedia
              </span>
            </label>

            {allAssignments.length > 0 ? (
              <select
                value={selectedAssignmentId}
                onChange={(e) => handleSelectAssignment(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600 text-slate-800"
              >
                {allAssignments.map((asg) => {
                  const sub = submissionsMap.get(asg.ID);
                  const statusTag = sub?.STATUS === 'GRADED'
                    ? `[Nilai: ${sub.NILAI}]`
                    : sub?.STATUS === 'SUBMITTED'
                    ? '[Diserahkan]'
                    : '[Belum Kumpul]';
                  return (
                    <option key={asg.ID} value={asg.ID}>
                      {statusTag} {asg.JUDUL} ({asg.TYPE})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-500 text-center font-medium">
                Belum ada tugas dibuat untuk kelas ini.
              </div>
            )}
          </div>

          {/* Current Submission Info Box */}
          {activeAssignment && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{activeAssignment.JUDUL}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  currentSubmission?.STATUS === 'GRADED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : currentSubmission?.STATUS === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {currentSubmission?.STATUS === 'GRADED'
                    ? 'SUDAH DINILAI'
                    : currentSubmission?.STATUS === 'SUBMITTED'
                    ? 'TERKUMPUL'
                    : 'BELUM KUMPUL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {currentSubmission?.ISI || 'Tidak ada catatan lampiran pengumpulan tugas.'}
              </p>
            </div>
          )}

          {/* Grade Input & Sliders */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">Nilai Capaian Siswa</span>
                <span className="text-[10px] text-slate-400 font-medium">Standar KKM: 75 / 100</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`px-4 py-1.5 rounded-2xl border-2 font-mono text-2xl font-black ${scoreColor} shadow-inner`}>
                  {score}
                </div>
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>0 (Min)</span>
                <span>50</span>
                <span>75 (KKM)</span>
                <span>100 (Max)</span>
              </div>
            </div>

            {/* Quick Adjustment & Presets */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustScore(-5)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black cursor-pointer"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustScore(5)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black cursor-pointer"
                >
                  +5
                </button>
              </div>

              <div className="flex items-center gap-1">
                {[75, 80, 85, 90, 95, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleScorePreset(preset)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      score === preset
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 block flex items-center justify-between">
              <span>Umpan Balik / Catatan Guru:</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik chip untuk mengisi cepat</span>
            </label>

            {/* Feedback Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickFeedbackPresets.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFeedback(chip)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="Tuliskan apresiasi, masukan, atau arahan perbaikan untuk siswa..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600 text-slate-800 resize-none"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !activeAssignment}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Menyimpan Nilai...</span>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-white" /> Tersimpan!
              </>
            ) : (
              <>
                <Check size={14} /> Simpan Nilai Cepat
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
