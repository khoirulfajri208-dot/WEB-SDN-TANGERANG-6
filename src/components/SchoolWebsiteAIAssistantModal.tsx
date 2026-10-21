import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Building2,
  GraduationCap,
  Calendar,
  BookOpen,
  Phone,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { db } from '../services/localStorageService';

interface SchoolWebsiteAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  isFallback?: boolean;
}

export const SchoolWebsiteAIAssistantModal: React.FC<SchoolWebsiteAIAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const config = db.getConfig();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialMessage: ChatMessage = {
    id: 'welcome-web',
    sender: 'ai',
    text: `Halo! Selamat datang di Portal Informasi Resmi **${config.SCHOOL_NAME || 'SD Negeri Tangerang 6'}**! 🏫✨

Saya adalah **AI Duta Informasi Sekolah**. Saya siap menjawab pertanyaan Anda mengenai:
- 📌 **PPDB (Penerimaan Peserta Didik Baru)**: Syarat, jalur pendaftaran, dan jadwal.
- 🏫 **Profil & Fasilitas Sekolah**: Visi misi, laboratorium komputer, perpustakaan, UKS, dan lapangan.
- 🏆 **Program Unggulan & Ekstrakurikuler**: Pramuka, seni tari, silat, futsal, klub sains, dan drum band.
- 📅 **Kalender Akademik & Tata Tertib**: Jam belajar, pakaian seragam, dan jadwal kegiatan sekolah.

Silakan tanyakan hal yang ingin Anda ketahui!`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    suggestedActions: [
      'Bagaimana syarat dan alur pendaftaran PPDB?',
      'Apa saja program unggulan dan ekstrakurikuler di sekolah?',
      'Berapa jam belajar dan jadwal seragam sekolah?',
      'Apa visi, misi, dan fasilitas sarana prasarana yang tersedia?',
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
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
          assistantType: 'WEBSITE',
          contextData: {
            schoolName: config.SCHOOL_NAME,
            address: config.ADDRESS,
            headmaster: config.HEADMASTER,
            phone: '(021) 5523456',
          },
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
        text: `Terima kasih atas pertanyaan Anda. Untuk informasi lebih rinci, Anda juga dapat menghubungi sekretariat SDN Tangerang 6 di (021) 5523456 atau datang langsung ke sekolah kami pada jam kerja.`,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[85vh] max-h-[700px] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-700/30 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-emerald-300 border border-white/20 backdrop-blur-xs shadow-inner">
              <Sparkles size={22} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight">AI Informasi & Layanan Publik</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  SDN Tangerang 6
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                Pusat Informasi PPDB, Profil, Prestasi, dan Sarana Sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMessages([initialMessage])}
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
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot size={17} />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
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

                <div className={`mt-2 text-[10px] flex items-center justify-between border-t pt-1.5 ${msg.sender === 'user' ? 'border-emerald-700/50 text-emerald-200' : 'border-slate-100 text-slate-400'}`}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="inline-flex items-center gap-1 hover:text-slate-700 font-semibold transition ml-2"
                      title="Salin Teks"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Suggested Quick Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pertanyaan Populer:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className="text-left px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50/80 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          💬 {action}
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
              <div className="w-7 h-7 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                <Bot size={15} />
              </div>
              <span className="font-medium">AI sedang memproses informasi sekolah...</span>
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
              placeholder="Ketik pertanyaan seputar PPDB, profil sekolah, fasilitas..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-800 hover:bg-emerald-900 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
          <div className="mt-1.5 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>Layanan Informasi Terpadu SD Negeri Tangerang 6 Kota Tangerang</span>
          </div>
        </div>
      </div>
    </div>
  );
};
