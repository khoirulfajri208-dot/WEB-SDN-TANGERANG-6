import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Send, X, Sparkles, BookOpen, Lightbulb, HelpCircle,
  RefreshCw, CheckCircle2, User, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Account, ClassroomAssignment } from '../../types/classroom';

interface ClassroomAIChatProps {
  account: Account;
  assignment?: ClassroomAssignment | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isFallback?: boolean;
}

export const ClassroomAIChat: React.FC<ClassroomAIChatProps> = ({
  account,
  assignment,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialText = assignment
        ? `Halo ${account.NAMA}! 👋\nSaya **AI Tutor Tugas**. Saya siap membantu kamu memahami dan menyelesaikan **"${assignment.JUDUL}"**.\n\nKamu bisa bertanya tentang langkah penyelesaian, rumus yang digunakan, atau penjelasan konsep dasar. Silakan pilih pertanyaan di bawah atau tuliskan pertanyaanmu!`
        : `Halo ${account.NAMA}! 👋\nSaya **AI Tutor Pembelajaran SD Negeri Tangerang 6**. Ada materi atau tugas pelajaran yang membingungkan? Tanyakan langsung ke saya, dan kita bahas langkah demi langkah! 🚀`;

      setMessages([
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: initialText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, assignment, account]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputMessage;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          assistantType: 'CLASSROOM_SISWA',
          userName: account.NAMA,
          userClass: account.KELAS || 'Kelas SD',
          contextData: assignment
            ? {
                judulTugas: assignment.JUDUL,
                deskripsiTugas: assignment.DESKRIPSI,
                tipe: assignment.TYPE,
                tenggat: assignment.DEADLINE,
              }
            : undefined,
          conversationHistory: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText = data?.data?.reply || 'Maaf, terjadi kendala saat merespon. Coba ulangi lagi ya.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isFallback: data?.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AIChat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Terjadi kendala koneksi. Jangan khawatir, mari kita coba pahami konsep dasar tugas ini bersama!',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = assignment
    ? [
        '💡 Bagaimana langkah awal mengerjakan tugas ini?',
        '📖 Jelaskan ringkas materi yang berhubungan dengan tugas ini',
        '✍️ Beri contoh cara menjawab yang benar dan rapi',
        '❓ Apa saja poin penting yang harus diperhatikan?',
      ]
    : [
        '🔢 Cara mudah menghitung pecahan campuran',
        '🌿 Jelaskan proses fotosintesis tumbuhan (IPAS)',
        '✍️ Cara menemukan ide pokok dalam paragraf',
        '💡 Beri 3 tips mudah konsentrasi belajar',
      ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] max-h-[700px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner font-bold">
                <Bot size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">AI Tutor Pembelajaran</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase tracking-wider">
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {assignment ? `Diskusi Tugas: ${assignment.JUDUL}` : `Pendamping Belajar Siswa ${account.KELAS || ''}`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Context Ribbon if opened for assignment */}
          {assignment && (
            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-900 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen size={15} className="text-indigo-600 shrink-0" />
                <span className="font-bold truncate">{assignment.JUDUL}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-200/70 text-indigo-900 text-[10px] font-extrabold shrink-0">
                  {assignment.TYPE}
                </span>
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold shrink-0">Tenggat: {assignment.DEADLINE}</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-indigo-300 border border-slate-700'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={15} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-xs text-xs sm:text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="markdown-body space-y-2">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[9px] flex items-center justify-end gap-1 ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && <Sparkles size={10} className="text-indigo-400" />}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit animate-pulse">
                <Bot size={16} className="text-indigo-600" />
                <span>AI Tutor sedang menyusun penjelasan langkah demi langkah...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1">
              Saran Pertanyaan:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt.replace(/^[\u2000-\u3300\ud83c-\ud83e\udc00-\udfff]/g, '').trim())}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-semibold border border-slate-200 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Tuliskan pertanyaanmu tentang tugas di sini..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-indigo-600/20 disabled:opacity-40 cursor-pointer"
              >
                <span>Kirim</span>
                <Send size={15} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
