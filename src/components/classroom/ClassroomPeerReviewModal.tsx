import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, X, Trophy, Edit3, CheckCircle2, FileText, ClipboardList,
  Sparkles, Check, Plus, RefreshCw, Bot, Star, Send, Copy, ThumbsUp,
  Lightbulb, Heart, Zap, ArrowRight, ShieldCheck, MessageSquare
} from 'lucide-react';
import { ClassroomAssignment, ClassroomSubmission, Account } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

export interface ClassroomPeerReviewModalProps {
  assignment: ClassroomAssignment;
  siswa: Account;
  onClose: () => void;
  onRefresh: () => void;
}

export type FeedbackTone = 'CONSTRUCTIVE' | 'APPRECIATIVE' | 'GROWTH_MINDSET' | 'CONCISE';
export type RubricCategory = 'ALL' | 'KREATIVITAS' | 'STRUKTUR' | 'MATERI' | 'SIKAP' | 'GENERAL';

interface AISuggestionResult {
  rubricId: string;
  rubricTitle: string;
  feedback: string;
  positives?: string;
  growthTip?: string;
}

export const ClassroomPeerReviewModal: React.FC<ClassroomPeerReviewModalProps> = ({
  assignment,
  siswa,
  onClose,
  onRefresh,
}) => {
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<ClassroomSubmission | null>(null);
  const [peerReviews, setPeerReviews] = useState<any[]>([]);

  // Rubric scoring states
  const [scoreKreativitas, setScoreKreativitas] = useState(85);
  const [feedbackKreativitas, setFeedbackKreativitas] = useState('');

  const [scoreStruktur, setScoreStruktur] = useState(85);
  const [feedbackStruktur, setFeedbackStruktur] = useState('');

  const [scoreMateri, setScoreMateri] = useState(85);
  const [feedbackMateri, setFeedbackMateri] = useState('');

  const [scoreSikap, setScoreSikap] = useState(90);
  const [feedbackSikap, setFeedbackSikap] = useState('');

  const [generalComment, setGeneralComment] = useState('');

  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'REVIEW' | 'MY_REVIEWS'>('SUMMARY');

  // AI Constructive Feedback Suggestion States
  const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] = useState(false);
  const [selectedTone, setSelectedTone] = useState<FeedbackTone>('CONSTRUCTIVE');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiPositives, setAiPositives] = useState<string | null>(null);
  const [aiGrowthTip, setAiGrowthTip] = useState<string | null>(null);
  const [aiTargetCategory, setAiTargetCategory] = useState<RubricCategory | null>(null);
  const [batchSuggestions, setBatchSuggestions] = useState<AISuggestionResult[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [likedReviewsToggle, setLikedReviewsToggle] = useState(0);

  const handleToggleReviewThumbsUp = (reviewId: string) => {
    classroomService.togglePeerReviewThumbsUp(reviewId);
    setLikedReviewsToggle((prev) => prev + 1);
    if (onRefresh) {
      onRefresh();
    }
  };

  // Student's own submission and reviews received from peers
  const mySubmission = useMemo(
    () => classroomService.getSubmissions(assignment.ID, siswa.ID)[0],
    [assignment.ID, siswa.ID]
  );

  const receivedReviews = useMemo(
    () => (mySubmission ? classroomService.getPeerReviews(assignment.ID, mySubmission.ID) : []),
    [assignment.ID, mySubmission, likedReviewsToggle]
  );

  // Rubric Summary Calculation (Highest and Lowest scoring rubrics)
  const rubricsSummary = useMemo(() => {
    const reviewsToAnalyze =
      receivedReviews.length > 0
        ? receivedReviews
        : [
            {
              ID: 'demo-peer-1',
              SCORE_KREATIVITAS: 92,
              FEEDBACK_KREATIVITAS: 'Penyajian ide sangat kreatif, orisinal, dan visualisasi tugas sangat rapi.',
              SCORE_STRUKTUR: 85,
              FEEDBACK_STRUKTUR: 'Format penulisan sudah sistematis, alur pengerjaan cukup jelas dan berurutan.',
              SCORE_MATERI: 78,
              FEEDBACK_MATERI: 'Sebagian jawaban pada nomor 3 dan 4 perlu diperiksa kembali rumus dasarnya.',
              GENERAL_COMMENT: 'Kerja keras yang luar biasa! Pertahankan kreativitasmu dan teliti kembali perhitungan.',
              SUBMITTED_AT: '2026-03-01 09:30',
            },
            {
              ID: 'demo-peer-2',
              SCORE_KREATIVITAS: 90,
              FEEDBACK_KREATIVITAS: 'Ide solusi sangat segar dan berbeda dari teman yang lain.',
              SCORE_STRUKTUR: 88,
              FEEDBACK_STRUKTUR: 'Tabel dan diagram dibuat dengan rapi.',
              SCORE_MATERI: 80,
              FEEDBACK_MATERI: 'Sudah sesuai dengan petunjuk guru, hanya perlu sedikit elaborasi di kesimpulan.',
              GENERAL_COMMENT: 'Sangat inspiratif! Senang membaca hasil pekerjaanmu.',
              SUBMITTED_AT: '2026-03-01 11:15',
            },
          ];

    const avgKreativitas = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_KREATIVITAS ?? 85), 0) / reviewsToAnalyze.length
    );
    const avgStruktur = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_STRUKTUR ?? 85), 0) / reviewsToAnalyze.length
    );
    const avgMateri = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_MATERI ?? 85), 0) / reviewsToAnalyze.length
    );

    const rubricItems = [
      {
        id: 'KREATIVITAS',
        title: 'Kreativitas & Orisinalitas',
        score: avgKreativitas,
        badgeColor: 'emerald',
        description: 'Keunikan ide, inovasi pendekatan masalah, dan estetika penyajian hasil karya.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_KREATIVITAS).filter(Boolean),
        recommendation: 'Pertahankan eksplorasi ide kreatifmu untuk portofolio penugasan berikutnya!',
      },
      {
        id: 'STRUKTUR',
        title: 'Struktur & Kerapian',
        score: avgStruktur,
        badgeColor: 'blue',
        description: 'Sistematika pengerjaan, format tata letak, kerapian penulisan, dan kejelasan alur.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_STRUKTUR).filter(Boolean),
        recommendation: 'Gunakan penomoran dan poin-poin terstruktur agar jawaban semakin mudah dipahami.',
      },
      {
        id: 'MATERI',
        title: 'Kesesuaian Materi & Kebenaran Jawaban',
        score: avgMateri,
        badgeColor: 'amber',
        description: 'Ketepatan konsep materi pelajaran, kepatuhan instruksi guru, dan keakuratan jawaban.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_MATERI).filter(Boolean),
        recommendation: 'Periksa kembali konsep materi dan lakukan verifikasi rumus sebelum mengumpulkan tugas.',
      },
    ];

    const sortedByScore = [...rubricItems].sort((a, b) => b.score - a.score);
    const highestRubric = sortedByScore[0];
    const lowestRubric = sortedByScore[sortedByScore.length - 1];
    const overallAverage = Math.round((avgKreativitas + avgStruktur + avgMateri) / 3);

    return {
      rubricItems,
      highestRubric,
      lowestRubric,
      overallAverage,
      totalReviews: reviewsToAnalyze.length,
      isLiveReceivedData: receivedReviews.length > 0,
      generalComments: reviewsToAnalyze.map((r) => r.GENERAL_COMMENT).filter(Boolean),
      reviewsToAnalyze,
    };
  }, [receivedReviews]);

  useEffect(() => {
    // Load all submissions for this assignment, excluding current student
    const allSubs = classroomService.getSubmissions(assignment.ID);
    const peerSubs = allSubs.filter((s) => s.SISWA_ID !== siswa.ID);
    setSubmissions(peerSubs);

    // Load peer reviews by this student
    const allReviews = classroomService.getPeerReviews(assignment.ID);
    const myReviews = allReviews.filter((r) => r.REVIEWER_ID === siswa.ID);
    setPeerReviews(myReviews);
  }, [assignment.ID, siswa.ID]);

  // Main AI Suggestion Generation Handler
  const handleGenerateAiSuggestion = async (category: RubricCategory, tone: FeedbackTone = selectedTone) => {
    if (!selectedSub) return;
    setIsGeneratingAiSuggestion(true);
    setAiTargetCategory(category);
    setAiSuggestion(null);
    setAiPositives(null);
    setAiGrowthTip(null);

    const draftMap: Record<string, string> = {
      GENERAL: generalComment,
      KREATIVITAS: feedbackKreativitas,
      STRUKTUR: feedbackStruktur,
      MATERI: feedbackMateri,
      SIKAP: feedbackSikap,
    };

    const rubricMetaMap: Record<string, string> = {
      KREATIVITAS: 'Kreativitas & Orisinalitas',
      STRUKTUR: 'Struktur & Kerapian',
      MATERI: 'Kesesuaian Materi & Kebenaran Jawaban',
      SIKAP: 'Sikap Belajar & Ketuntasan',
      GENERAL: 'Komentar Umum & Ringkasan Penilaian',
    };

    try {
      const response = await fetch('/api/ai/peer-review-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentTitle: assignment.JUDUL,
          assignmentDescription: assignment.DESKRIPSI,
          peerSubmissionText: selectedSub.ISI || 'Pekerjaan dilampirkan via dokumen',
          targetCategory: category,
          tone: tone,
          rubricCriteria: [
            { id: 'KREATIVITAS', title: 'Kreativitas & Orisinalitas', currentScore: scoreKreativitas, currentDraft: feedbackKreativitas },
            { id: 'STRUKTUR', title: 'Struktur & Kerapian', currentScore: scoreStruktur, currentDraft: feedbackStruktur },
            { id: 'MATERI', title: 'Kesesuaian Materi & Kebenaran Jawaban', currentScore: scoreMateri, currentDraft: feedbackMateri },
            { id: 'SIKAP', title: 'Sikap Belajar & Ketuntasan', currentScore: scoreSikap, currentDraft: feedbackSikap },
          ],
        }),
      });

      if (!response.ok) throw new Error('AI Server offline');
      const resData = await response.json();
      
      if (resData && resData.data) {
        const { suggestions, generalFeedback } = resData.data;
        if (category === 'ALL' && Array.isArray(suggestions)) {
          setBatchSuggestions(suggestions);
          if (generalFeedback) {
            setGeneralComment(generalFeedback);
          }
        } else if (category === 'GENERAL') {
          setAiSuggestion(generalFeedback || (suggestions && suggestions[0]?.feedback) || 'Pekerjaanmu sudah sangat baik dan sesuai instruksi.');
        } else if (Array.isArray(suggestions) && suggestions.length > 0) {
          const match = suggestions.find((s: AISuggestionResult) => s.rubricId === category) || suggestions[0];
          setAiSuggestion(match.feedback);
          if (match.positives) setAiPositives(match.positives);
          if (match.growthTip) setAiGrowthTip(match.growthTip);
        }
      } else {
        throw new Error('No data in AI response');
      }
    } catch (err) {
      console.warn('AI suggestion fallback:', err);
      // Fallback heuristics based on tone and category
      const fallbacks: Record<string, string[]> = {
        GENERAL: [
          'Pekerjaanmu sudah sangat rapi dan sesuai instruksi tugas! Agar makin sempurna, cobalah untuk merangkum bagian kesimpulan di bagian akhir dengan poin-poin singkat.',
          'Saya sangat menikmati membaca hasil pekerjaanmu karena alurnya berurutan. Ditambahkan sedikit contoh nyata tentu akan membuat jawabanmu semakin kuat.',
          'Usaha kerasmu terlihat jelas dari detail jawaban yang disampaikan. Pertahankan semangat belajar ini dan periksa kembali penulisan tanda baca ya!'
        ],
        KREATIVITAS: [
          'Ide dan sudut pandang pengerjaan tugas ini sangat segar dan inspiratif! Penampilannya juga rapi.',
          'Penyajian tugasmu cukup kreatif. Bila ditambahkan diagram atau ilustrasi sederhana, tentu akan semakin menarik!'
        ],
        STRUKTUR: [
          'Format penulisan sudah tertata sistematis. Penomoran dan pembagian paragraf sudah sangat nyaman dibaca.',
          'Alur tugas sudah bagus, mungkin bagian awal bisa diberikan judul singkat agar pembaca lebih cepat paham.'
        ],
        MATERI: [
          'Pemahaman konsep materimu sudah sangat baik dan sesuai dengan penjelasan guru di kelas.',
          'Sebagian besar jawaban sudah tepat. Pastikan untuk memverifikasi ulang perhitungan pada nomor bagian akhir ya!'
        ],
        SIKAP: [
          'Tanggung jawabmu dalam menyelesaikan seluruh instruksi tugas tepat waktu sangat patut diapresiasi!',
          'Kerapian dan ketelitian pengerjaan menunjukkan komitmen belajar yang sangat baik.'
        ]
      };
      
      const list = fallbacks[category] || fallbacks.GENERAL;
      const text = list[Math.floor(Math.random() * list.length)];
      setAiSuggestion(text);
      setAiPositives('Penyajian tugas rapi dan menunjukkan kesungguhan belajar.');
      setAiGrowthTip('Periksa kembali detail akhir sebelum dikumpulkan.');
    } finally {
      setIsGeneratingAiSuggestion(false);
    }
  };

  const applyAiSuggestion = (suggestionText: string, target?: RubricCategory) => {
    const cat = target || aiTargetCategory;
    if (!cat) return;
    if (cat === 'GENERAL') setGeneralComment(suggestionText);
    else if (cat === 'KREATIVITAS') setFeedbackKreativitas(suggestionText);
    else if (cat === 'STRUKTUR') setFeedbackStruktur(suggestionText);
    else if (cat === 'MATERI') setFeedbackMateri(suggestionText);
    else if (cat === 'SIKAP') setFeedbackSikap(suggestionText);
    
    if (!target) {
      setAiSuggestion(null);
      setAiPositives(null);
      setAiGrowthTip(null);
      setAiTargetCategory(null);
    }
  };

  const appendAiSuggestion = (suggestionText: string, target?: RubricCategory) => {
    const cat = target || aiTargetCategory;
    if (!cat) return;
    if (cat === 'GENERAL') setGeneralComment((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (cat === 'KREATIVITAS') setFeedbackKreativitas((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (cat === 'STRUKTUR') setFeedbackStruktur((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (cat === 'MATERI') setFeedbackMateri((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (cat === 'SIKAP') setFeedbackSikap((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    
    if (!target) {
      setAiSuggestion(null);
      setAiPositives(null);
      setAiGrowthTip(null);
      setAiTargetCategory(null);
    }
  };

  const applyAllBatchSuggestions = () => {
    if (!batchSuggestions) return;
    batchSuggestions.forEach((s) => {
      if (s.rubricId === 'KREATIVITAS') setFeedbackKreativitas(s.feedback);
      else if (s.rubricId === 'STRUKTUR') setFeedbackStruktur(s.feedback);
      else if (s.rubricId === 'MATERI') setFeedbackMateri(s.feedback);
      else if (s.rubricId === 'SIKAP') setFeedbackSikap(s.feedback);
    });
    setBatchSuggestions(null);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    classroomService.savePeerReview({
      ASSIGNMENT_ID: assignment.ID,
      SUBMISSION_ID: selectedSub.ID,
      REVIEWER_ID: siswa.ID,
      SCORE_KREATIVITAS: scoreKreativitas,
      FEEDBACK_KREATIVITAS: feedbackKreativitas,
      SCORE_STRUKTUR: scoreStruktur,
      FEEDBACK_STRUKTUR: feedbackStruktur,
      SCORE_MATERI: scoreMateri,
      FEEDBACK_MATERI: feedbackMateri,
      SCORE_SIKAP: scoreSikap,
      FEEDBACK_SIKAP: feedbackSikap,
      GENERAL_COMMENT: generalComment,
    });

    // Reset fields & refresh list
    setSelectedSub(null);
    setScoreKreativitas(85);
    setFeedbackKreativitas('');
    setScoreStruktur(85);
    setFeedbackStruktur('');
    setScoreMateri(85);
    setFeedbackMateri('');
    setScoreSikap(90);
    setFeedbackSikap('');
    setGeneralComment('');
    setAiSuggestion(null);
    setBatchSuggestions(null);

    // Reload peer reviews
    const allReviews = classroomService.getPeerReviews(assignment.ID);
    const myReviews = allReviews.filter((r) => r.REVIEWER_ID === siswa.ID);
    setPeerReviews(myReviews);

    onRefresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="classroom-peer-review-modal" className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Penilaian Sejawat (Peer Review)</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                  <Sparkles size={11} /> AI Feedback Coach
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tugas: <strong>{assignment.JUDUL}</strong> • Evaluasi objektif, anonim & bimbingan feedback santun
              </p>
            </div>
          </div>
          <button
            id="close-peer-review-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 shrink-0 bg-slate-100 p-1.5 rounded-2xl w-fit flex-wrap">
          <button
            id="tab-summary-received"
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SUMMARY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy size={13} className="text-amber-500" />
            <span>Ringkasan Nilai Diterima (Rubrik Tertinggi & Terendah)</span>
          </button>
          <button
            id="tab-give-review"
            onClick={() => setActiveTab('REVIEW')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'REVIEW' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={13} />
            <span>Beri Penilaian Teman ({submissions.length})</span>
          </button>
          <button
            id="tab-my-reviews"
            onClick={() => setActiveTab('MY_REVIEWS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MY_REVIEWS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Ulasan Saya ({peerReviews.length})</span>
          </button>
        </div>

        {/* TAB 1: SUMMARY OF RECEIVED REVIEWS (HIGHEST & LOWEST RUBRICS) */}
        {activeTab === 'SUMMARY' ? (
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
            {/* Top Stat Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                  Analisis Umpan Balik Sejawat untuk {siswa.NAMA}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Rata-rata Skor Peer Review: <span className="text-indigo-800 font-mono text-base">{rubricsSummary.overallAverage} / 100</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dihitung dari {rubricsSummary.totalReviews} ulasan sejawat yang masuk secara anonim dan terstruktur.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-800 text-xs font-bold shadow-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {rubricsSummary.isLiveReceivedData ? '✓ Data Ulasan Langsung' : '📊 Baseline Evaluasi Kelas'}
                </span>
              </div>
            </div>

            {/* HIGHEST AND LOWEST RUBRIC HIGHLIGHTS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HIGHEST SCORING RUBRIC CARD */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                    <Trophy size={12} /> ⭐ RUBRIK SKOR TERTINGGI (Paling Unggul)
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Prestasi Puncak</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h5 className="text-sm font-black text-emerald-950">
                      {rubricsSummary.highestRubric.title}
                    </h5>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {rubricsSummary.highestRubric.score} / 100
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/80">
                    {rubricsSummary.highestRubric.description}
                  </p>
                </div>

                {rubricsSummary.highestRubric.feedbacks.length > 0 && (
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block text-[11px]">💬 Masukan Positif Rekan Sebaya:</span>
                    <p className="text-slate-700 italic">
                      "{rubricsSummary.highestRubric.feedbacks[0]}"
                    </p>
                  </div>
                )}

                <div className="text-[11px] font-medium text-emerald-900 bg-emerald-100/70 p-2.5 rounded-xl flex items-start gap-1.5">
                  <ThumbsUp size={13} className="shrink-0 mt-0.5 text-emerald-700" />
                  <span><strong>Rekomendasi:</strong> {rubricsSummary.highestRubric.recommendation}</span>
                </div>
              </div>

              {/* LOWEST SCORING RUBRIC CARD */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-extrabold shadow-xs">
                    <Lightbulb size={12} /> 🎯 AREA PENINGKATAN (Potensi Belajar)
                  </span>
                  <span className="text-xs font-bold text-amber-800">Fokus Pengembangan</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h5 className="text-sm font-black text-amber-950">
                      {rubricsSummary.lowestRubric.title}
                    </h5>
                    <span className="text-lg font-black text-amber-700 font-mono">
                      {rubricsSummary.lowestRubric.score} / 100
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80">
                    {rubricsSummary.lowestRubric.description}
                  </p>
                </div>

                {rubricsSummary.lowestRubric.feedbacks.length > 0 && (
                  <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px]">💬 Catatan Evaluasi Rekan:</span>
                    <p className="text-slate-700 italic">
                      "{rubricsSummary.lowestRubric.feedbacks[0]}"
                    </p>
                  </div>
                )}

                <div className="text-[11px] font-medium text-amber-900 bg-amber-100/70 p-2.5 rounded-xl flex items-start gap-1.5">
                  <ArrowRight size={13} className="shrink-0 mt-0.5 text-amber-700" />
                  <span><strong>Langkah Perbaikan:</strong> {rubricsSummary.lowestRubric.recommendation}</span>
                </div>
              </div>
            </div>

            {/* All Rubric Breakdown */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ClipboardList size={14} className="text-indigo-600" />
                Rincian Skor Semua Rubrik Penilaian
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rubricsSummary.rubricItems.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Rubrik #{idx + 1}</span>
                      <span className="text-xs font-black text-indigo-700 font-mono">{item.score} / 100</span>
                    </div>
                    <h6 className="text-xs font-bold text-slate-900">{item.title}</h6>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.score >= 85 ? 'bg-emerald-500' : item.score >= 75 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Peer Reviews Received & Helpful Thumbs Up */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-indigo-600" />
                  Daftar Umpan Balik Lengkap dari Teman Kelas
                </h5>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {rubricsSummary.reviewsToAnalyze.length} Masukan Anonim
                </span>
              </div>

              <div className="space-y-3.5">
                {rubricsSummary.reviewsToAnalyze.map((r, i) => {
                  const averageScore = Math.round(
                    ((r.SCORE_KREATIVITAS || 85) + (r.SCORE_STRUKTUR || 85) + (r.SCORE_MATERI || 85) + (r.SCORE_SIKAP || 90)) / 4
                  );
                  const isThumbsUp = !!r.THUMBS_UP;

                  return (
                    <div key={r.ID || i} className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-3 relative overflow-hidden transition hover:shadow-2xs">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <h6 className="text-xs font-black text-slate-900">
                            Umpan Balik Sejawat #{i + 1}
                          </h6>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Disubmit secara rahasia • {r.SUBMITTED_AT || 'Baru Saja'}
                          </span>
                        </div>
                        <span className="text-[11px] font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">
                          Skor Rata-Rata: {averageScore}/100
                        </span>
                      </div>

                      {/* Comment grids */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                        {r.FEEDBACK_KREATIVITAS && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                            <strong className="text-[9px] text-indigo-800 uppercase block mb-0.5 font-bold">🎨 Kreativitas ({r.SCORE_KREATIVITAS || 85})</strong>
                            <p className="italic">"{r.FEEDBACK_KREATIVITAS}"</p>
                          </div>
                        )}
                        {r.FEEDBACK_STRUKTUR && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                            <strong className="text-[9px] text-indigo-800 uppercase block mb-0.5 font-bold">📋 Struktur ({r.SCORE_STRUKTUR || 85})</strong>
                            <p className="italic">"{r.FEEDBACK_STRUKTUR}"</p>
                          </div>
                        )}
                        {r.FEEDBACK_MATERI && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                            <strong className="text-[9px] text-indigo-800 uppercase block mb-0.5 font-bold">📚 Materi ({r.SCORE_MATERI || 85})</strong>
                            <p className="italic">"{r.FEEDBACK_MATERI}"</p>
                          </div>
                        )}
                        {r.GENERAL_COMMENT && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 sm:col-span-2">
                            <strong className="text-[9px] text-indigo-800 uppercase block mb-0.5 font-bold">💬 Komentar Umum</strong>
                            <p className="italic font-bold text-slate-800">"{r.GENERAL_COMMENT}"</p>
                          </div>
                        )}
                      </div>

                      {/* Reward Integration / Thumbs-up Action Button */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Sparkles size={11} className="text-amber-500" />
                          <span>Membantu teman sekelas membangun sikap gotong royong Pancasila.</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleReviewThumbsUp(r.ID)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs select-none border shrink-0 ${
                            isThumbsUp
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 font-extrabold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 font-extrabold'
                          }`}
                        >
                          <ThumbsUp size={13} className={isThumbsUp ? 'fill-white text-white' : 'text-slate-400'} />
                          <span>{isThumbsUp ? 'Bermanfaat! ✓ (+100 Poin Lencana Helper Sejati)' : 'Beri Thumbs-Up 👍'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'REVIEW' ? (
          /* TAB 2: GIVE REVIEW TO PEERS */
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
            {/* Left Column: Peer Submissions List */}
            <div className="w-full md:w-1/3 flex flex-col min-h-0 border-r border-slate-100 pr-0 md:pr-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Pilih Pekerjaan Teman:</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  {submissions.length} Peserta
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {submissions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Belum ada submisi dari teman sekelas.
                  </div>
                ) : (
                  submissions.map((sub, i) => {
                    const alreadyReviewed = peerReviews.some((r) => r.SUBMISSION_ID === sub.ID);
                    const isSelected = selectedSub?.ID === sub.ID;
                    return (
                      <div
                        key={sub.ID}
                        onClick={() => {
                          setSelectedSub(sub);
                          setAiSuggestion(null);
                          setBatchSuggestions(null);
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              Teman Anonim #{i + 1}
                            </span>
                            {alreadyReviewed && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                                Dinilai ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {sub.ISI || 'Lampiran Dokumen Tugas'}
                          </p>
                        </div>
                        <ArrowRight size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-300'} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Review Form & AI Suggestion Workspace */}
            <div className="w-full md:w-2/3 min-h-0 flex flex-col bg-slate-50/40 p-4 rounded-3xl border border-slate-150 overflow-hidden">
              {selectedSub ? (
                <form onSubmit={handleSubmitReview} className="flex-1 flex flex-col gap-3 min-h-0">
                  
                  {/* Selected Peer's Submission Viewer */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 overflow-y-auto max-h-32 shrink-0 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                        Karya / Hasil Jawaban Teman:
                      </span>
                      {selectedSub.FILE_LINK && (
                        <a
                          href={selectedSub.FILE_LINK}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100"
                        >
                          <FileText size={11} /> Buka Lampiran
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 italic whitespace-pre-wrap font-mono">
                      "{selectedSub.ISI}"
                    </p>
                  </div>

                  {/* AI POWER BAR: 1-Click Auto Review & Tone Selector */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 shadow-xs space-y-2 shrink-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                        <Sparkles size={14} className="text-purple-600 animate-pulse" />
                        <span>Asisten Saran AI Otomatis (Berdasarkan Rubrik)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          id="btn-auto-review-all"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('ALL')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-3 py-1 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={12} className={isGeneratingAiSuggestion && aiTargetCategory === 'ALL' ? 'animate-spin' : ''} />
                          <span>{isGeneratingAiSuggestion && aiTargetCategory === 'ALL' ? 'Menganalisis Rubrik...' : '✨ AI 1-Klik Semua Rubrik'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Tone Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-indigo-100/60">
                      <span className="text-[10px] font-bold text-indigo-900/80 mr-1">Gaya Saran:</span>
                      {[
                        { id: 'CONSTRUCTIVE', label: '🎯 Konstruktif', desc: 'Pujian + Solusi' },
                        { id: 'APPRECIATIVE', label: '🌟 Apresiatif', desc: 'Hangat & Memotivasi' },
                        { id: 'GROWTH_MINDSET', label: '💡 Growth Mindset', desc: 'Proses & Tantangan' },
                        { id: 'CONCISE', label: '⚡ Ringkas', desc: 'Padat & Lugas' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTone(t.id as FeedbackTone);
                            if (aiTargetCategory) {
                              handleGenerateAiSuggestion(aiTargetCategory, t.id as FeedbackTone);
                            }
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition cursor-pointer border ${
                            selectedTone === t.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batch AI Suggestions Notification Drawer */}
                  {batchSuggestions && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>AI Berhasil Membuat Saran Lengkap untuk 4 Rubrik Penilaian!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBatchSuggestions(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={applyAllBatchSuggestions}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check size={12} /> Terapkan ke Seluruh Form Rubrik
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchSuggestions(null)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Tinjau Manual
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Single AI Suggestion Interactive Display Box */}
                  {aiSuggestion && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-blue-50/95 border-2 border-indigo-300 shadow-sm space-y-2 shrink-0 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs">
                          <Sparkles size={14} className="text-purple-600 animate-pulse" />
                          <span>Saran Feedback AI ({aiTargetCategory || 'Umum'}):</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setAiSuggestion(null); setAiTargetCategory(null); }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/95 p-3 rounded-xl border border-indigo-100 italic">
                        "{aiSuggestion}"
                      </p>

                      {(aiPositives || aiGrowthTip) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {aiPositives && (
                            <div className="p-2 bg-emerald-50/90 rounded-lg border border-emerald-200 text-emerald-900 flex items-start gap-1">
                              <ThumbsUp size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                              <span><strong>Kekuatan:</strong> {aiPositives}</span>
                            </div>
                          )}
                          {aiGrowthTip && (
                            <div className="p-2 bg-amber-50/90 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-1">
                              <Lightbulb size={12} className="text-amber-600 mt-0.5 shrink-0" />
                              <span><strong>Langkah Maju:</strong> {aiGrowthTip}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyAiSuggestion(aiSuggestion)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check size={12} /> Gunakan Teks Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => appendAiSuggestion(aiSuggestion)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Plus size={12} /> Gabungkan ke Draft Saya
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(aiSuggestion, 'single')}
                            className="p-1.5 text-xs font-bold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                            title="Salin Teks"
                          >
                            {copiedIndex === 'single' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => aiTargetCategory && handleGenerateAiSuggestion(aiTargetCategory)}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-xl text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={12} className={isGeneratingAiSuggestion ? 'animate-spin' : ''} />
                          Regenerasi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rubric Evaluation Form */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <ClipboardList size={14} className="text-indigo-600" />
                      Rubrik Penilaian Terstruktur (Teacher's Rubric)
                    </h4>

                    {/* Criteria 1: Kreativitas */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">1. Kreativitas & Orisinalitas</h5>
                          <p className="text-[10px] text-slate-400">Keunikan ide, penyajian visual, dan ekspresi pengerjaan tugas</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreKreativitas}
                            onChange={(e) => setScoreKreativitas(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreKreativitas}
                        onChange={(e) => setScoreKreativitas(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        <textarea
                          value={feedbackKreativitas}
                          onChange={(e) => setFeedbackKreativitas(e.target.value)}
                          placeholder="Berikan apresiasi atau saran kreativitas..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-slate-50/50"
                          rows={1}
                        />
                        <button
                          id="btn-ai-kreativitas"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('KREATIVITAS')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 shrink-0 border border-purple-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Kreativitas"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'KREATIVITAS' ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                          <span>AI Saran</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria 2: Struktur & Kerapian */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">2. Struktur & Kerapian</h5>
                          <p className="text-[10px] text-slate-400">Sistematika pengerjaan, format tata letak, dan kejelasan alur</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreStruktur}
                            onChange={(e) => setScoreStruktur(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreStruktur}
                        onChange={(e) => setScoreStruktur(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        <textarea
                          value={feedbackStruktur}
                          onChange={(e) => setFeedbackStruktur(e.target.value)}
                          placeholder="Berikan masukan kerapian atau susunan alur..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-slate-50/50"
                          rows={1}
                        />
                        <button
                          id="btn-ai-struktur"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('STRUKTUR')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 shrink-0 border border-purple-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Struktur"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'STRUKTUR' ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                          <span>AI Saran</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria 3: Kesesuaian Materi */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">3. Kesesuaian Materi & Kebenaran Jawaban</h5>
                          <p className="text-[10px] text-slate-400">Keakuratan konsep materi pelajaran sesuai petunjuk penugasan</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreMateri}
                            onChange={(e) => setScoreMateri(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreMateri}
                        onChange={(e) => setScoreMateri(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        <textarea
                          value={feedbackMateri}
                          onChange={(e) => setFeedbackMateri(e.target.value)}
                          placeholder="Berikan masukan ketepatan materi atau rumus..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-slate-50/50"
                          rows={1}
                        />
                        <button
                          id="btn-ai-materi"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('MATERI')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 shrink-0 border border-purple-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Materi"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'MATERI' ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                          <span>AI Saran</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria 4: Sikap Belajar & Ketuntasan */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">4. Sikap Belajar & Ketuntasan</h5>
                          <p className="text-[10px] text-slate-400">Ketuntasan pengerjaan seluruh instruksi dan komitmen belajar</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreSikap}
                            onChange={(e) => setScoreSikap(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreSikap}
                        onChange={(e) => setScoreSikap(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        <textarea
                          value={feedbackSikap}
                          onChange={(e) => setFeedbackSikap(e.target.value)}
                          placeholder="Apresiasi kedisiplinan dan ketuntasan tugas..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-slate-50/50"
                          rows={1}
                        />
                        <button
                          id="btn-ai-sikap"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('SIKAP')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 shrink-0 border border-purple-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Sikap"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'SIKAP' ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                          <span>AI Saran</span>
                        </button>
                      </div>
                    </div>

                    {/* General Comment */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="text-xs font-bold text-slate-800 block">Komentar / Saran Umum (General Feedback)</label>
                        <button
                          id="btn-ai-general"
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('GENERAL')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'GENERAL' ? 'animate-spin' : ''} />
                          <span>AI Saran Umum</span>
                        </button>
                      </div>
                      <textarea
                        value={generalComment}
                        onChange={(e) => setGeneralComment(e.target.value)}
                        placeholder="Tulis saran pengembangan menyeluruh untuk mendukung kemajuan belajar temanmu..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white"
                        rows={2}
                        required
                      />

                      {/* Quick Polite Sentence Starters */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Bot size={11} className="text-indigo-500" /> Templat Sopan:
                        </span>
                        {[
                          '✨ Penyajian sangat rapi dan berurutan',
                          '💡 Ide solusi sangat orisinal & kreatif',
                          '🎯 Jawaban sudah tepat sesuai instruksi guru',
                          '👏 Kerja bagus! Pertahankan semangat belajar ini'
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setGeneralComment((prev) => prev ? `${prev} ${chip.replace(/^[^\s]+\s/, '')}.` : `${chip.replace(/^[^\s]+\s/, '')}.`)}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg transition cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Actions */}
                  <div className="flex justify-end gap-2 shrink-0 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSub(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      id="btn-submit-peer-review"
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition"
                    >
                      <Send size={13} /> Kirim Penilaian Anonim
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                    <Users size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Pilih Hasil Karya Teman</h4>
                  <p className="text-xs font-medium text-slate-500 max-w-sm">
                    Pilih salah satu hasil pekerjaan teman di kolom kiri untuk memberikan evaluasi & saran bimbingan AI yang objektif serta rahasia.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 3: MY REVIEWS HISTORY */
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
            {peerReviews.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Anda belum mengirim ulasan apa pun untuk tugas ini.
              </div>
            ) : (
              peerReviews.map((r, i) => {
                const subIdx = submissions.findIndex((s) => s.ID === r.SUBMISSION_ID);
                const averageScore = Math.round(
                  ((r.SCORE_KREATIVITAS || 85) + (r.SCORE_STRUKTUR || 85) + (r.SCORE_MATERI || 85) + (r.SCORE_SIKAP || 90)) / 4
                );
                return (
                  <div key={r.ID || i} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-indigo-800">
                        Ulasan #{i + 1} - Teman Anonim #{subIdx >= 0 ? subIdx + 1 : 'Kelas'}
                      </h4>
                      <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> Nilai Rata-Rata: {averageScore}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">1. Kreativitas</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_KREATIVITAS || 85}/100</span>
                        {r.FEEDBACK_KREATIVITAS && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">"{r.FEEDBACK_KREATIVITAS}"</p>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">2. Struktur</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_STRUKTUR || 85}/100</span>
                        {r.FEEDBACK_STRUKTUR && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">"{r.FEEDBACK_STRUKTUR}"</p>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">3. Materi</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_MATERI || 85}/100</span>
                        {r.FEEDBACK_MATERI && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">"{r.FEEDBACK_MATERI}"</p>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">4. Sikap</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_SIKAP || 90}/100</span>
                        {r.FEEDBACK_SIKAP && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">"{r.FEEDBACK_SIKAP}"</p>
                        )}
                      </div>
                    </div>

                    {r.GENERAL_COMMENT && (
                      <div className="p-3 bg-white rounded-xl border border-slate-150 text-xs">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Komentar Umum:</span>
                        <p className="text-slate-800 italic mt-0.5">"{r.GENERAL_COMMENT}"</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Also export alias StudentPeerReviewModal for backward compatibility
export const StudentPeerReviewModal = ClassroomPeerReviewModal;
export default ClassroomPeerReviewModal;
