import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  BookOpen,
  GraduationCap,
  Award,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  FileQuestion,
  BookMarked,
  Layers,
  MessageSquare,
  Flame,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Account } from '../../types/classroom';

interface ClassroomAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  isFallback?: boolean;
}

export const ClassroomAIAssistantModal: React.FC<ClassroomAIAssistantModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const isSiswa = account.ROLE === 'SISWA';
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const assistantType = isSiswa
    ? 'CLASSROOM_SISWA'
    : isGuru
    ? 'CLASSROOM_GURU'
    : 'CLASSROOM_KEPSEK';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getInitialMessage = (): ChatMessage => {
    if (isSiswa) {
      return {
        id: 'welcome-siswa',
        sender: 'ai',
        text: `Halo **${account.NAMA}**! 🌟
Saya adalah **AI Teman Belajar & Tutor Cerdas SD Negeri Tangerang 6**.

Ada yang ingin kamu pelajari hari ini? Saya bisa membantumu:
- 📖 **Memahami Materi Pelajaran**: Matematika, IPAS, Bahasa Indonesia, Bahasa Inggris, Pendidikan Pancasila, dan SBdP.
- 💡 **Membimbing Cara Mengerjakan Tugas**: Kita bahas langkah-langkah berpikirnya bersama tanpa mencontek.
- 🎯 **Latihan Kuis & Soal Ujian**: Persiapan ulangan harian dan asesmen sumatif.

Ketik pertanyaan atau pilih topik di bawah ini yuk!`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Bagaimana cara menghitung pecahan campuran?',
          'Jelaskan proses fotosintesis pada tumbuhan hijau',
          'Beri 3 contoh kalimat fakta dan opini',
          'Bantu aku memahami bagian-bagian bunga',
        ],
      };
    }

    if (isGuru) {
      return {
        id: 'welcome-guru',
        sender: 'ai',
        text: `Selamat datang Bapak/Ibu **${account.NAMA}** (Pengampu ${account.KELAS || 'Kelas SD'})! 👨‍🏫👩‍🏫
Saya adalah **AI Asisten Perencana Pembelajaran & Kurikulum Merdeka**.

Saya siap mendampingi Bapak/Ibu dalam administrasi dan pedagogik:
- 📝 **Generator Modul Ajar (MA) & RPP**: Alur Tujuan Pembelajaran (ATP) dan kegiatan berdiferensiasi.
- 🧪 **Bank Soal & Asesmen HOTS**: Soal stimulus kontekstual, kisi-kisi, kunci jawaban, dan rubrik skor.
- 📊 **Rubrik Penilaian & P5**: Rubrik observasi profil pelajar Pancasila & kriteria ketercapaian tujuan pembelajaran (KKTP).
- 💌 **Draf Feedback Tugas Siswa**: Kalimat evaluasi yang personal, memotivasi, dan konstruktif.
- 📋 **Draf Laporan Pembelajaran Kelas**: Untuk pelaporan bulanan kepada Kepala Sekolah.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Buatkan Modul Ajar IPAS ${account.KELAS || 'Kelas 4'} Kurikulum Merdeka`,
          'Buat 5 butir soal HOTS Matematika beserta kunci & rubrik',
          'Buatkan draf umpan balik apresiatif untuk siswa yang tuntas',
          'Susun draf laporan capaian pembelajaran bulanan untuk Kepala Sekolah',
        ],
      };
    }

    // Kepala Sekolah
    return {
      id: 'welcome-kepsek',
      sender: 'ai',
      text: `Selamat datang Ibu/Bapak Kepala Sekolah **${account.NAMA}**! 🏛️
Saya adalah **AI Konsultan Manajerial & Supervisi Akademik SD Negeri Tangerang 6**.

Layanan konsultasi yang dapat saya bantu:
- 📈 **Evaluasi & Rapor Pendidikan**: Menganalisis indikator literasi, numerasi, iklim keamanan, dan kualitas pembelajaran.
- 👨‍🏫 **Supervisi Akademik Klinis**: Instrumen observasi kelas, rubrik pembinaan pedagogik guru, dan rencana tindak lanjut (RTL).
- 📝 **Penelaahan Laporan Bulanan Guru**: Menilai capaian target kurikulum dan memberikan arahan feedback pimpinan.
- 🤝 **Strategi Pendidikan Inklusi**: Pendampingan kurikulum bagi peserta didik berkebutuhan khusus (PDBK).`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Rekomendasi instrumen supervisi klinis pembelajaran guru',
        'Analisis strategi peningkatan numerasi pada rapor pendidikan',
        'Format catatan pembinaan dan evaluasi laporan bulanan guru',
        'Panduan diferensiasi pembelajaran untuk siswa inklusi',
      ],
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (userPrompt?: string) => {
    const messageToSend = userPrompt || input.trim();
    if (!messageToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          assistantType,
          userRole: account.ROLE,
          userName: account.NAMA,
          userClass: account.KELAS,
          conversationHistory: historyPayload,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const aiReply: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.data.reply || 'Tidak ada balasan dari server AI.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isFallback: json.isFallback,
          suggestedActions: json.data.suggestedActions,
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        throw new Error(json.error || 'Gagal menerima balasan AI.');
      }
    } catch (err: any) {
      const fallbackReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Terima kasih atas pertanyaannya! Silakan telaah konsep materi tersebut sesuai dengan buku panduan Kurikulum Merdeka SDN Tangerang 6 atau tanyakan topik lain yang ingin diperdalam.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([getInitialMessage()]);
  };

  if (!isOpen) return null;

  const headerGradient = isSiswa
    ? 'from-blue-700 via-indigo-700 to-sky-800'
    : isGuru
    ? 'from-emerald-800 via-teal-800 to-slate-900'
    : 'from-purple-900 via-indigo-900 to-slate-900';

  const roleTitle = isSiswa
    ? 'AI Teman Belajar & Tutor Siswa'
    : isGuru
    ? 'AI Asisten Guru & Kurikulum Merdeka'
    : 'AI Supervisi & Manajerial Kepala Sekolah';

  const roleSubtitle = isSiswa
    ? `Bantuan materi, penalaran tugas, dan kuis ramah anak SD (${account.KELAS || 'Siswa'})`
    : isGuru
    ? `Perencanaan Modul Ajar, Soal HOTS, Rubrik, dan Draf Laporan (${account.KELAS || 'Guru'})`
    : `Analisis Capaian Kelas, Supervisi Guru, dan Rapor Pendidikan`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[88vh] max-h-[740px] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r ${headerGradient} text-white shadow-md`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-white border border-white/20 backdrop-blur-xs shadow-inner">
              {isSiswa ? <Sparkles size={22} className="text-amber-300 animate-pulse" /> : isGuru ? <GraduationCap size={22} className="text-emerald-300" /> : <Award size={22} className="text-purple-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-tight">{roleTitle}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold border border-white/20">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 line-clamp-1">{roleSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Mulai Ulang Percakapan"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/80">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 text-white ${
                    isSiswa ? 'bg-indigo-600' : isGuru ? 'bg-emerald-700' : 'bg-purple-800'
                  }`}
                >
                  <Bot size={17} />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-700 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-2">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="break-words">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className={`mt-2 text-[10px] flex items-center justify-between border-t pt-1.5 ${msg.sender === 'user' ? 'border-blue-600/50 text-blue-200' : 'border-slate-100 text-slate-400'}`}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="inline-flex items-center gap-1 hover:text-slate-700 font-semibold transition ml-2"
                      title="Salin Balasan"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Suggested Quick Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rekomendasi Topik Selanjutnya:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className={`text-left px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                            isSiswa
                              ? 'bg-blue-50/70 border-blue-200 text-blue-800 hover:bg-blue-100'
                              : isGuru
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-purple-50/70 border-purple-200 text-purple-800 hover:bg-purple-100'
                          }`}
                        >
                          ✨ {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 animate-pulse">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white ${
                  isSiswa ? 'bg-indigo-600' : isGuru ? 'bg-emerald-700' : 'bg-purple-800'
                }`}
              >
                <Bot size={15} />
              </div>
              <span className="font-medium">AI sedang berpikir dan menyusun jawaban terbaik...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isSiswa
                  ? 'Tanya materi pelajaran atau soal hitungan di sini...'
                  : isGuru
                  ? 'Ketik topik modul ajar, soal HOTS, rubrik, atau evaluasi...'
                  : 'Konsultasikan supervisi guru, rapor pendidikan, atau evaluasi...'
              }
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                isSiswa
                  ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
                  : isGuru
                  ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
                  : 'bg-purple-800 hover:bg-purple-900 shadow-purple-800/20'
              }`}
            >
              <Send size={15} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
          <div className="mt-1.5 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>AI Asisten Resmi Portal Akademik SDN Tangerang 6 • Kurikulum Merdeka</span>
          </div>
        </div>
      </div>
    </div>
  );
};
