import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  RefreshCw,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { ActivePage } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: ActivePage) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  isFallback?: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo! Saya **AI SIPERDSEDA - Asisten Pengelola Persediaan & Aset Cerdas SD Negeri Tangerang 6** didukung Google Gemini.

Saya dapat membantu Anda dalam:
- 📄 **Penyusunan Berita Acara Resmi (BAST, BAPB, BAP, BA Penghapusan)** dengan konsiderans regulasi baku.
- 📦 **Analisis Stok Kritis, Burn Rate & Rekomendasi Belanja ARKAS / BOS**.
- ⚖️ **Konsultasi Regulasi Barang Milik Daerah (Permendagri No. 19/2016)**.
- 🔍 **Deteksi Anomali Saldo, Rekonsiliasi BKU, dan Pencatatan KIR Ruangan**.

Ada kebutuhan analisis persediaan atau draf dokumen yang ingin dibantu?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Bantu buat draf BAST Pengadaan BOS',
        'Cek barang yang stoknya di bawah batas minimum',
        'Bagaimana prosedur penghapusan aset rusak berat?',
        'Jelaskan perbedaan BAST dan BAPB menurut aturan dinas',
      ],
    },
  ]);

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
      // Gather lightweight inventory context
      const stockSummary = db.getStockSummary();
      const lowStock = stockSummary.filter((s) => s.STATUS === 'MINIMUM');
      const assets = db.getAssets();
      const config = db.getConfig();

      const contextData = {
        schoolName: config.SCHOOL_NAME,
        headmaster: `${config.HEADMASTER} (${config.HEADMASTER_NIP})`,
        treasurer: `${config.TREASURER} (${config.TREASURER_NIP})`,
        warehouseOfficer: `${config.WAREHOUSE_OFFICER} (${config.WAREHOUSE_OFFICER_NIP})`,
        totalAssetCount: assets.length,
        totalStockItems: stockSummary.length,
        lowStockItems: lowStock.map((l) => `${l.NAMA_BARANG} (Sisa: ${l.STOK} ${l.JENIS_SATUAN})`),
      };

      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          assistantType: 'SIPERDSEDA',
          contextData,
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
      // Smart client-side fallback
      const q = messageToSend.toLowerCase();
      let replyText = 'Halo! Saya siap membantu administrasi barang, persediaan BOS, dan aset SD Negeri Tangerang 6.';
      if (q.includes('stok') || q.includes('habis') || q.includes('sisa')) {
        const low = db.getStockSummary().filter((s) => s.STATUS === 'MINIMUM' || s.STOK <= s.BATAS_MINIMUM);
        replyText = low.length > 0
          ? `Saat ini terdapat ${low.length} barang dengan status stok menipis/kritis, antara lain: ${low.map((l) => `${l.NAMA_BARANG} (sisa ${l.STOK} ${l.JENIS_SATUAN})`).join(', ')}. Disarankan segera membuat rencana pengadaan RKAS.`
          : 'Semua stok persediaan saat ini dalam kondisi aman di atas batas minimum.';
      } else if (q.includes('aset') || q.includes('kib') || q.includes('inventaris')) {
        const assets = db.getAssets();
        const total = assets.reduce((sum, a) => sum + (a.TOTAL_NILAI || 0), 0);
        replyText = `Total aset terdata sebanyak ${assets.length} unit dengan akumulasi nilai perolehan Rp ${total.toLocaleString('id-ID')}. Anda dapat melihat KIB B (Peralatan & Mesin) dan KIB E di menu Inventaris Aset.`;
      } else if (q.includes('bast') || q.includes('berita acara') || q.includes('surat')) {
        replyText = 'Anda dapat mencetak dan mengunduh format resmi Berita Acara Serah Terima (BAST), Berita Acara Penerimaan Barang, dan Berita Acara Rekonsiliasi Aset di menu Pusat Dokumen.';
      }

      const fallbackReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
        suggestedActions: [
          'Lihat Barang Menipis',
          'Buka Rencana Pengadaan',
          'Buat BAST di Pusat Dokumen',
        ],
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionText: string) => {
    if (actionText.toLowerCase().includes('bast') || actionText.toLowerCase().includes('berita acara')) {
      if (onNavigate) {
        onNavigate('document_center');
        onClose();
        return;
      }
    }
    if (actionText.toLowerCase().includes('stok') || actionText.toLowerCase().includes('minimum')) {
      if (onNavigate) {
        onNavigate('persediaan');
        onClose();
        return;
      }
    }
    handleSend(actionText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-300 border border-white/10 backdrop-blur-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm tracking-tight">Asisten AI Bendahara Pintar</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                Penyusunan Berita Acara, Analisis Inventaris, dan Konsultasi Regulasi BMD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
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
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-1.5">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="break-words">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div
                  className={`mt-2 text-[10px] flex items-center justify-between ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isFallback && <span className="italic">(Mode Standar Cerdas)</span>}
                </div>

                {/* Quick Action Chips from AI */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rekomendasi Tindakan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aidx) => (
                        <button
                          key={aidx}
                          type="button"
                          onClick={() => handleActionClick(action)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors text-left"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit animate-pulse">
              <RefreshCw size={14} className="animate-spin text-emerald-700" />
              <span>Asisten AI sedang menyusun tanggapan dan merekonsiliasi aturan...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
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
              placeholder="Tanyakan regulasi BOS, buat draf BAST, atau periksa stok..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-emerald-700 bg-slate-50 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Didukung Gemini 3.7 Flash • Tata Kelola Standar Kemendikbudristek & Permendagri</span>
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('document_center');
                  onClose();
                }
              }}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <FileText size={12} /> Buka Document Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
