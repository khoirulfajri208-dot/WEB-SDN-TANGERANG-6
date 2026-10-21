import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Video,
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { Account, ClassroomNotification } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomNotificationCenterProps {
  account: Account;
  onNavigateTab?: (tabKey: string) => void;
}

export const ClassroomNotificationCenter: React.FC<ClassroomNotificationCenterProps> = ({
  account,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClassroomNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userKelas = account.KELAS || 'Kelas 1';

  const loadNotifs = () => {
    // Generate automatic deadline reminders first
    classroomService.generateAutomaticReminders(userKelas, account.ID);
    const data = classroomService.getNotifications(userKelas, account.ID);
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifs();

    const handleSync = () => loadNotifs();
    window.addEventListener('bb_storage_sync', handleSync);
    return () => window.removeEventListener('bb_storage_sync', handleSync);
  }, [userKelas, account.ID]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.IS_READ).length;

  const handleMarkRead = (id: string, linkPage?: string) => {
    classroomService.markNotificationRead(id);
    loadNotifs();
    if (linkPage && onNavigateTab) {
      onNavigateTab(linkPage);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    classroomService.markAllNotificationsRead(userKelas);
    loadNotifs();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE':
        return <Clock size={16} className="text-amber-500" />;
      case 'LIVE_CLASS':
        return <Video size={16} className="text-rose-500 animate-pulse" />;
      case 'GRADE':
        return <Award size={16} className="text-emerald-500" />;
      case 'MATERIAL':
        return <BookOpen size={16} className="text-blue-500" />;
      default:
        return <MessageSquare size={16} className="text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 transition-colors cursor-pointer"
        title="Pusat Notifikasi & Pengingat Tenggat Waktu"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-slate-900 shadow-sm animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPUP */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-amber-300" />
              <div>
                <h4 className="font-extrabold text-sm leading-none">Pusat Notifikasi</h4>
                <p className="text-[10px] text-blue-200 mt-0.5">{userKelas} • {unreadCount} Belum Dibaca</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-amber-200 transition"
              >
                <CheckCheck size={14} />
                <span>Tandai Dibaca</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Sparkles size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">Tidak ada notifikasi baru</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Semua pengingat tugas dan kelas aman.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.ID}
                  onClick={() => handleMarkRead(n.ID, n.LINK_PAGE)}
                  className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                    !n.IS_READ ? 'bg-blue-50/50 font-medium' : 'opacity-80'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getNotifIcon(n.TYPE)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{n.TITLE}</h5>
                      {!n.IS_READ && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.MESSAGE}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.CREATED_AT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0 self-center" />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400">Notifikasi Terotomatisasi Classroom</span>
          </div>
        </div>
      )}
    </div>
  );
};
