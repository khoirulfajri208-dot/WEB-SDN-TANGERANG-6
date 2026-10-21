import React, { useState } from 'react';
import {
  MessageSquare, Pin, Heart, Send, Plus, Filter, User, Tag, Trash2, CheckCircle2,
  HelpCircle, Megaphone, Info, MessageCircle, Clock, Sparkles
} from 'lucide-react';
import { ForumPost, Account, AccountRole } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { PeerReviewLeaderboard } from './PeerReviewLeaderboard';

interface ClassroomForumViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomForumView: React.FC<ClassroomForumViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const canPost = true; // All authenticated users can participate in discussions

  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState<'PENGUMUMAN' | 'DISKUSI' | 'TANYA_GURU' | 'INFO_SEKOLAH'>('DISKUSI');
  const [postClass, setPostClass] = useState(account.KELAS || 'Kelas 1');

  const posts = classroomService.getForumPosts(account.ROLE === 'SISWA' || isGuru ? account.KELAS : undefined);

  const filteredPosts = posts.filter((p) => {
    if (selectedTag === 'ALL') return true;
    return p.TAG === selectedTag;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    classroomService.createForumPost({
      KELAS: account.KELAS || postClass,
      AUTHOR_ID: account.ID,
      AUTHOR_NAMA: account.NAMA,
      AUTHOR_ROLE: account.ROLE,
      TITLE: postTitle,
      CONTENT: postContent,
      TAG: postTag,
      IS_PINNED: (isGuru || isKepsek) && postTag === 'PENGUMUMAN',
    });

    setPostTitle('');
    setPostContent('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    classroomService.addForumComment(postId, {
      AUTHOR_ID: account.ID,
      AUTHOR_NAMA: account.NAMA,
      AUTHOR_ROLE: account.ROLE,
      CONTENT: text,
    });

    setCommentInputs({ ...commentInputs, [postId]: '' });
    onRefresh();
  };

  const handleLike = (postId: string) => {
    classroomService.toggleForumLike(postId, account.ID);
    onRefresh();
  };

  const handlePin = (postId: string) => {
    classroomService.togglePinPost(postId);
    onRefresh();
  };

  const handleDelete = (postId: string) => {
    if (confirm('Hapus postingan diskusi ini?')) {
      classroomService.deleteForumPost(postId);
      onRefresh();
    }
  };

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'PENGUMUMAN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <Megaphone size={12} /> Pengumuman Resmi
          </span>
        );
      case 'INFO_SEKOLAH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Info size={12} /> Info Sekolah
          </span>
        );
      case 'TANYA_GURU':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
            <HelpCircle size={12} /> Tanya Guru
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <MessageCircle size={12} /> Diskusi Belajar
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Forum Diskusi & Stream Kelas</h2>
              <p className="text-xs text-slate-500">
                Pusat komunikasi, tanya jawab materi, dan pengumuman kelas {account.KELAS || 'SDN Tangerang 6'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Buat Diskusi / Pengumuman
          </button>
        </div>
      </div>

      {/* Peer Review Leaderboard Widget */}
      <PeerReviewLeaderboard />

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'Semua Diskusi', icon: MessageSquare },
          { id: 'PENGUMUMAN', label: 'Pengumuman', icon: Megaphone },
          { id: 'DISKUSI', label: 'Diskusi Materi', icon: MessageCircle },
          { id: 'TANYA_GURU', label: 'Tanya Guru', icon: HelpCircle },
          { id: 'INFO_SEKOLAH', label: 'Info Sekolah', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTag === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTag(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Posts Stream */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <MessageSquare size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">Belum Ada Postingan Diskusi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Jadilah yang pertama memulai diskusi atau membagikan pengumuman untuk kelas ini.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            <Plus size={14} /> Tulis Postingan Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isLiked = post.LIKES?.includes(account.ID);
            const canManage = isGuru || isKepsek || post.AUTHOR_ID === account.ID;

            return (
              <div
                key={post.ID}
                className={`bg-white rounded-2xl p-5 border transition shadow-sm ${
                  post.IS_PINNED ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Post Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                        post.AUTHOR_ROLE === 'GURU'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : post.AUTHOR_ROLE === 'KEPALA SEKOLAH'
                          ? 'bg-purple-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {post.AUTHOR_NAMA.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{post.AUTHOR_NAMA}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {post.AUTHOR_ROLE}
                        </span>
                        {post.KELAS && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            • {post.KELAS}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {post.CREATED_AT.replace('T', ' ').substring(0, 16)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getTagBadge(post.TAG)}

                    {post.IS_PINNED && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <Pin size={11} className="fill-amber-600 text-amber-600" /> Disematkan
                      </span>
                    )}

                    {(isGuru || isKepsek) && (
                      <button
                        onClick={() => handlePin(post.ID)}
                        title={post.IS_PINNED ? 'Lepas Sematan' : 'Sematkan Postingan'}
                        className={`p-1.5 rounded-lg border transition ${
                          post.IS_PINNED ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        <Pin size={13} />
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => handleDelete(post.ID)}
                        title="Hapus Postingan"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Body */}
                <h3 className="font-bold text-base text-slate-900 mb-2">{post.TITLE}</h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                  {post.CONTENT}
                </p>

                {/* Like & Interaction Bar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.ID)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                        isLiked
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Heart size={14} className={isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'} />
                      <span>{post.LIKES?.length || 0} Suka</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <MessageSquare size={14} />
                      <span>{post.COMMENTS?.length || 0} Komentar</span>
                    </div>
                  </div>
                </div>

                {/* Comment Section */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {post.COMMENTS && post.COMMENTS.length > 0 && (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {post.COMMENTS.map((cmt) => (
                        <div key={cmt.ID} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                            {cmt.AUTHOR_NAMA.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">{cmt.AUTHOR_NAMA}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                                {cmt.AUTHOR_ROLE}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-auto">
                                {cmt.CREATED_AT.replace('T', ' ').substring(11, 16)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-snug">{cmt.CONTENT}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tulis balasan atau tanggapan..."
                      value={commentInputs[post.ID] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.ID]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.ID);
                      }}
                      className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.ID)}
                      disabled={!commentInputs[post.ID]?.trim()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Send size={13} /> Kirim
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <h3 className="font-black text-base text-slate-800">Buat Postingan Diskusi Baru</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Postingan</label>
                <select
                  value={postTag}
                  onChange={(e) => setPostTag(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="DISKUSI">💬 Diskusi Belajar Umum</option>
                  <option value="TANYA_GURU">❓ Tanya Guru / Soal Sulit</option>
                  {(isGuru || isKepsek) && <option value="PENGUMUMAN">📢 Pengumuman Resmi Kelas</option>}
                  {(isGuru || isKepsek) && <option value="INFO_SEKOLAH">🏫 Info Sekolah SDN Tangerang 6</option>}
                </select>
              </div>

              {!account.KELAS && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Kelas</label>
                  <select
                    value={postClass}
                    onChange={(e) => setPostClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Diskusi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Diskusi Bab 2 - Operasi Bilangan Pecahan"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pesan / Penjelasan</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan pertanyaan, penjelasan materi, atau pengumuman yang ingin disampaikan..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                >
                  Publikasikan Postingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
