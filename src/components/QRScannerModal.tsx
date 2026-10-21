import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  History,
  Trash2,
  HelpCircle,
  Check,
  SunMedium,
  ScanLine,
  BookOpen,
  Package,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BatteryLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  Download,
  Bug,
  Volume2,
  VolumeX,
  Target,
  Sliders,
  Leaf,
  Award,
  Zap,
  FileText,
  Star,
  Save,
  MessageSquare,
  Plus,
  Minus,
  Send,
  CheckCheck,
  Scan,
  Moon,
  Video,
  Printer,
  CheckSquare,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/localStorageService';
import { classroomService } from '../services/classroomService';
import { accountService } from '../services/accountService';
import { Asset } from '../types';
import { ClassroomAssignment, ClassroomSubmission, Account } from '../types/classroom';
import { playFeedback } from '../utils/feedback';
import { BulkQRHistoryPrintModal } from './BulkQRHistoryPrintModal';

export interface RecentScanItem {
  id: string;
  code: string;
  title: string;
  type: 'ASSIGNMENT' | 'ASSET' | 'STUDENT' | 'OTHER';
  subtitle?: string;
  timestamp: number;
  rawPayload: string;
}

export interface ScanFailureItem {
  id: string;
  timestamp: number;
  timeFormatted: string;
  code?: string;
  type: string;
  reason: string;
  suggestion: string;
}

export interface TeacherObservationNote {
  id: string;
  studentId: string;
  studentName: string;
  studentClass?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  category: string;
  text: string;
  teacherName: string;
  timestamp: number;
  formattedTime: string;
}

export interface QuickActionData {
  type: 'ASSIGNMENT' | 'STUDENT' | 'COMBINED' | 'ASSET';
  student?: Account;
  assignment?: ClassroomAssignment;
  asset?: Asset;
  rawPayload: string;
  allStudentAssignments: ClassroomAssignment[];
  submissionsMap: Record<string, ClassroomSubmission>;
  activeAssignmentId: string;
  score: number;
  feedback: string;
  noteText: string;
  noteCategory: string;
}

const RECENT_SCANS_STORAGE_KEY = 'sdn6_qr_recent_scans_v1';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset?: (asset: Asset) => void;
  onSelectAssignment?: (assignment: ClassroomAssignment) => void;
  onSelectStudent?: (student: Account) => void;
  onScanSuccess?: (item: RecentScanItem) => void;
  initialMode?: 'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET';
  currentClass?: string;
  facingMode?: 'environment' | 'user';
  isLowBattery?: boolean;
  isBatterySaverMode?: boolean;
  scanGoal?: number;
  sessionScanCount?: number;
  onOpenScanSettings?: () => void;
  account?: Account | null;
  enableQuickActions?: boolean;
  onToggleQuickActions?: () => void;
  onDataChanged?: () => void;
  pauseOnInactivity?: boolean;
  inactivityTimeoutSeconds?: number;
}

type ErrorType = 'CAMERA_DENIED' | 'CAMERA_NOT_FOUND' | 'NO_QR_IN_IMAGE' | 'NOT_FOUND_IN_DB' | 'GENERAL_ERROR' | null;

interface ScanSuccessInfo {
  title: string;
  subtitle: string;
  type: 'ASSIGNMENT' | 'ASSET' | 'STUDENT' | 'OTHER';
  code: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  onSelectAssignment,
  onSelectStudent,
  onScanSuccess,
  initialMode = 'ALL',
  currentClass,
  facingMode = 'environment',
  isLowBattery = false,
  isBatterySaverMode = false,
  scanGoal,
  sessionScanCount,
  onOpenScanSettings,
  account,
  enableQuickActions,
  onToggleQuickActions,
  onDataChanged,
  pauseOnInactivity,
  inactivityTimeoutSeconds,
}) => {
  const [activeMode, setActiveMode] = useState<'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET'>(initialMode);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [successInfo, setSuccessInfo] = useState<ScanSuccessInfo | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);
  const [recentScansFilter, setRecentScansFilter] = useState<'ALL' | 'STUDENT' | 'ASSIGNMENT' | 'ASSET'>('ALL');
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inactivity Sleep / Suspension State
  const [isSuspendedByInactivity, setIsSuspendedByInactivity] = useState(false);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const effectivePauseOnInactivity = useMemo(() => {
    if (pauseOnInactivity !== undefined) return pauseOnInactivity;
    try {
      return localStorage.getItem('sdn6_pause_on_inactivity_enabled') !== 'false';
    } catch {
      return true;
    }
  }, [pauseOnInactivity]);

  const effectiveInactivitySeconds = useMemo(() => {
    if (inactivityTimeoutSeconds !== undefined) return inactivityTimeoutSeconds;
    try {
      const saved = localStorage.getItem('sdn6_inactivity_timeout_seconds');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 10 && parsed <= 300) return parsed;
      }
    } catch {}
    return 30;
  }, [inactivityTimeoutSeconds]);

  // QR Scanner Failures / Error Tracking for Debugging
  const [scanFailures, setScanFailures] = useState<ScanFailureItem[]>([]);
  const [showDebugSection, setShowDebugSection] = useState(true);

  // Subtle Haptic & Audio Feedback Toggle
  const [soundFeedbackEnabled, setSoundFeedbackEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sdn6_qr_mute_feedback') !== 'true';
    } catch {
      return true;
    }
  });

  // Dynamic Battery Status Tracking for Debug Panel
  const [systemBattery, setSystemBattery] = useState<{ level: number; charging: boolean }>({
    level: 0.85,
    charging: false,
  });

  useEffect(() => {
    let isMounted = true;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (!isMounted) return;
        const update = () => {
          if (!isMounted) return;
          setSystemBattery({
            level: battery.level ?? 0.85,
            charging: !!battery.charging,
          });
        };
        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      }).catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll ref and state for Scan History Debug list
  const debugFailuresListRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollDebug, setAutoScrollDebug] = useState<boolean>(true);

  useEffect(() => {
    if (autoScrollDebug && scanFailures.length > 0 && debugFailuresListRef.current) {
      debugFailuresListRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [scanFailures, autoScrollDebug]);

  const toggleSoundFeedback = () => {
    const nextState = !soundFeedbackEnabled;
    setSoundFeedbackEnabled(nextState);
    try {
      localStorage.setItem('sdn6_qr_mute_feedback', nextState ? 'false' : 'true');
    } catch {}
    if (nextState) {
      playFeedback('success');
    }
  };

  // Quick Actions Overlay State
  const [quickActionsActive, setQuickActionsActive] = useState<boolean>(() => {
    if (enableQuickActions !== undefined) return enableQuickActions;
    try {
      return localStorage.getItem('sdn6_qr_quick_actions') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (enableQuickActions !== undefined) {
      setQuickActionsActive(enableQuickActions);
    }
  }, [enableQuickActions]);

  const [quickAction, setQuickAction] = useState<QuickActionData | null>(null);
  const [quickActionTab, setQuickActionTab] = useState<'GRADE' | 'NOTE'>('GRADE');
  const [isSavingAction, setIsSavingAction] = useState<boolean>(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Resolved teacher account
  const teacherAccount = useMemo(() => {
    return account || accountService.getActiveClassroomAccount() || accountService.getActiveAdminAccount();
  }, [account]);

  const toggleQuickActionsMode = () => {
    const next = !quickActionsActive;
    setQuickActionsActive(next);
    try {
      localStorage.setItem('sdn6_qr_quick_actions', String(next));
    } catch {}
    if (onToggleQuickActions) onToggleQuickActions();
    playFeedback('click');
  };

  const handleSwitchAssignment = (asgId: string) => {
    if (!quickAction) return;
    const targetAsg = quickAction.allStudentAssignments.find((a) => a.ID === asgId);
    if (!targetAsg) return;
    const existingSub = quickAction.submissionsMap[asgId];
    setQuickAction((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        activeAssignmentId: asgId,
        assignment: targetAsg,
        score: existingSub?.NILAI !== undefined ? existingSub.NILAI : 85,
        feedback: existingSub?.FEEDBACK || 'Bagus sekali, pemahaman materi sangat baik!',
      };
    });
    playFeedback('click');
  };

  const handleScorePreset = (val: number) => {
    setQuickAction((prev) => {
      if (!prev) return null;
      return { ...prev, score: Math.min(100, Math.max(0, val)) };
    });
    playFeedback('click');
  };

  const handleAdjustScore = (delta: number) => {
    setQuickAction((prev) => {
      if (!prev) return null;
      return { ...prev, score: Math.min(100, Math.max(0, prev.score + delta)) };
    });
    playFeedback('click');
  };

  const handleFeedbackPreset = (presetText: string) => {
    setQuickAction((prev) => {
      if (!prev) return null;
      return { ...prev, feedback: presetText };
    });
    playFeedback('click');
  };

  const handleSelectNoteCategory = (category: string, defaultSnippet?: string) => {
    setQuickAction((prev) => {
      if (!prev) return null;
      const textToAppend = defaultSnippet || '';
      const newText = prev.noteText ? `${prev.noteText}. ${textToAppend}` : textToAppend;
      return { ...prev, noteCategory: category, noteText: newText.trim() };
    });
    playFeedback('click');
  };

  const handleSaveQuickGrade = () => {
    if (!quickAction || !quickAction.student || !quickAction.assignment) return;
    setIsSavingAction(true);
    try {
      const { student, assignment, score, feedback } = quickAction;
      let sub = quickAction.submissionsMap[assignment.ID];
      if (!sub) {
        sub = classroomService.saveSubmission({
          ASSIGNMENT_ID: assignment.ID,
          COURSE_ID: assignment.COURSE_ID,
          SISWA_ID: student.ID,
          SISWA_NAMA: student.NAMA,
          ISI: 'Penilaian instan via Quick Actions QR Scanner camera.',
          STATUS: 'SUBMITTED',
        });
      }
      classroomService.gradeSubmission(
        sub.ID,
        score,
        feedback,
        teacherAccount?.NAMA || 'Guru Pengampu'
      );
      playFeedback('success');
      setActionSuccessNotice(`Nilai ${score} berhasil disimpan untuk ${student.NAMA}!`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key: 'CLASSROOM_SUBMISSIONS' } }));
      }
      if (onDataChanged) onDataChanged();

      setTimeout(() => {
        setQuickAction(null);
        setSuccessInfo(null);
        setIsProcessing(false);
        setActionSuccessNotice(null);
        setIsSavingAction(false);
      }, 700);
    } catch (err) {
      console.error('Failed to quick grade assignment:', err);
      setIsSavingAction(false);
    }
  };

  const handleSaveQuickNote = () => {
    if (!quickAction || !quickAction.student) return;
    setIsSavingAction(true);
    try {
      const { student, assignment, noteCategory, noteText } = quickAction;
      const noteItem: TeacherObservationNote = {
        id: `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.ID,
        studentName: student.NAMA,
        studentClass: student.KELAS || currentClass || 'Kelas Aktif',
        assignmentId: assignment?.ID,
        assignmentTitle: assignment?.JUDUL,
        category: noteCategory,
        text: noteText.trim() || `Observasi kategori: ${noteCategory}`,
        teacherName: teacherAccount?.NAMA || 'Guru Pengampu',
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        const raw = localStorage.getItem('sdn6_teacher_observation_notes');
        const list: TeacherObservationNote[] = raw ? JSON.parse(raw) : [];
        list.unshift(noteItem);
        localStorage.setItem('sdn6_teacher_observation_notes', JSON.stringify(list.slice(0, 300)));
      } catch (e) {
        console.warn('Storage save note error:', e);
      }

      if (assignment) {
        let sub = quickAction.submissionsMap[assignment.ID];
        if (!sub) {
          sub = classroomService.saveSubmission({
            ASSIGNMENT_ID: assignment.ID,
            COURSE_ID: assignment.COURSE_ID,
            SISWA_ID: student.ID,
            SISWA_NAMA: student.NAMA,
            ISI: `Catatan guru: ${noteItem.text}`,
            STATUS: 'SUBMITTED',
          });
        }
        const updatedFeedback = sub.FEEDBACK
          ? `${sub.FEEDBACK} | [${noteCategory}] ${noteItem.text}`
          : `[${noteCategory}] ${noteItem.text}`;
        classroomService.gradeSubmission(
          sub.ID,
          sub.NILAI ?? 85,
          updatedFeedback,
          teacherAccount?.NAMA || 'Guru Pengampu'
        );
      }

      playFeedback('success');
      setActionSuccessNotice(`Catatan berhasil disimpan untuk ${student.NAMA}!`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key: 'CLASSROOM_NOTES' } }));
      }
      if (onDataChanged) onDataChanged();

      setTimeout(() => {
        setQuickAction(null);
        setSuccessInfo(null);
        setIsProcessing(false);
        setActionSuccessNotice(null);
        setIsSavingAction(false);
      }, 700);
    } catch (err) {
      console.error('Failed to save quick note:', err);
      setIsSavingAction(false);
    }
  };

  const handleResumeScanning = () => {
    playFeedback('click');
    setQuickAction(null);
    setSuccessInfo(null);
    setIsProcessing(false);
    setActionSuccessNotice(null);
  };

  const handleViewFullDetail = () => {
    stopCamera();
    if (quickAction?.assignment && onSelectAssignment) {
      onSelectAssignment(quickAction.assignment);
    } else if (quickAction?.student && onSelectStudent) {
      onSelectStudent(quickAction.student);
    } else if (quickAction?.asset && onSelectAsset) {
      onSelectAsset(quickAction.asset);
    }
    setQuickAction(null);
    setSuccessInfo(null);
    setIsProcessing(false);
    onClose();
  };

  const trackScanFailure = useCallback((type: ErrorType, reason: string, code?: string) => {
    let suggestion = 'Periksa kejelasan kode QR atau lakukan pemindaian ulang.';
    if (type === 'CAMERA_DENIED') {
      suggestion = 'Buka pengaturan izin situs di browser dan izinkan akses kamera untuk aplikasi ini.';
    } else if (type === 'CAMERA_NOT_FOUND') {
      suggestion = 'Pastikan kamera webcam terhubung atau gunakan fitur unggah gambar / input ID manual.';
    } else if (type === 'NO_QR_IN_IMAGE') {
      suggestion = 'Pastikan gambar yang diunggah fokus, tidak berbayang, dan barcode berada di tengah.';
    } else if (type === 'NOT_FOUND_IN_DB') {
      suggestion = 'Pastikan data (Aset, Siswa, atau Tugas) terdaftar di basis data SDN Tangerang 6.';
    } else if (type === 'GENERAL_ERROR') {
      suggestion = 'Coba muat ulang halaman atau gunakan input teks kode langsung.';
    }

    const item: ScanFailureItem = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('id-ID'),
      type: type || 'SCAN_ERROR',
      reason,
      code: code || manualCode || 'Scan Optik',
      suggestion,
    };

    setScanFailures((prev) => [item, ...prev.slice(0, 49)]);
  }, [manualCode]);

  const filteredRecentScans = useMemo(() => {
    if (recentScansFilter === 'ALL') return recentScans;
    return recentScans.filter((item) => item.type === recentScansFilter);
  }, [recentScans, recentScansFilter]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync mode on open
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode || 'ALL');
    }
  }, [isOpen, initialMode]);

  // Load Recent Scans from LocalStorage
  const loadRecentScans = useCallback(() => {
    try {
      const saved = localStorage.getItem(RECENT_SCANS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentScans(parsed.slice(0, 100));
        }
      }
    } catch (e) {
      console.error('Failed to load recent scans:', e);
    }
  }, []);

  // Save item to recent scans (max 5 items)
  const addRecentScan = useCallback((item: Omit<RecentScanItem, 'timestamp'>) => {
    try {
      const newItem: RecentScanItem = {
        ...item,
        timestamp: Date.now(),
      };
      setRecentScans((prev) => {
        const filtered = prev.filter((s) => s.code.toLowerCase() !== item.code.toLowerCase());
        const updated = [newItem, ...filtered].slice(0, 100);
        localStorage.setItem(RECENT_SCANS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      try {
        window.dispatchEvent(new CustomEvent('qr_scan_success', { detail: newItem }));
      } catch {}
    } catch (e) {
      console.error('Failed to save recent scan:', e);
    }
  }, []);

  const clearRecentScans = () => {
    localStorage.removeItem(RECENT_SCANS_STORAGE_KEY);
    setRecentScans([]);
    setSelectedScanIds(new Set());
  };

  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [dismissedBatchFlyout, setDismissedBatchFlyout] = useState<boolean>(false);
  const [showModalExportClearConfirm, setShowModalExportClearConfirm] = useState<boolean>(false);

  const clearLastScannedItem = () => {
    if (recentScans.length === 0) return;
    const lastItem = recentScans[0];
    const updated = recentScans.slice(1);
    setRecentScans(updated);
    try {
      localStorage.setItem(RECENT_SCANS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (selectedScanIds.has(lastItem.id)) {
      setSelectedScanIds((prev) => {
        const next = new Set(prev);
        next.delete(lastItem.id);
        return next;
      });
    }

    playFeedback('click');
    setUndoToast(`Item terakhir "${lastItem.title}" dihapus dari antrean.`);
    setTimeout(() => {
      setUndoToast(null);
    }, 3000);
  };

  const toggleSelectScan = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedScanIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    playFeedback('click');
  };

  const toggleSelectAllFilteredScans = () => {
    setSelectedScanIds((prev) => {
      const isAllSelected = filteredRecentScans.length > 0 && filteredRecentScans.every((s) => prev.has(s.id));
      const next = new Set(prev);
      if (isAllSelected) {
        filteredRecentScans.forEach((s) => next.delete(s.id));
      } else {
        filteredRecentScans.forEach((s) => next.add(s.id));
      }
      return next;
    });
    playFeedback('click');
  };

  const exportHistoryToCSV = () => {
    if (recentScans.length === 0) return;
    
    // Define CSV Headers in Indonesian/English
    const headers = ['ID', 'Tipe', 'Kode/Payload', 'Nama/Judul', 'Detail/Subtitel', 'Waktu Pindai'];
    
    // Format rows
    const rows = recentScans.map(item => {
      const timeStr = new Date(item.timestamp).toLocaleString('id-ID');
      return [
        `"${item.id.replace(/"/g, '""')}"`,
        `"${item.type.replace(/"/g, '""')}"`,
        `"${item.code.replace(/"/g, '""')}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${(item.subtitle || '').replace(/"/g, '""')}"`,
        `"${timeStr}"`
      ];
    });
    
    // Combine Headers and Rows
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat_pemindaian_sdn6_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFailedScansToCSV = () => {
    if (scanFailures.length === 0) return;
    const headers = ['ID Error', 'Waktu', 'Tipe Kendala', 'Target / Kode Input', 'Penyebab', 'Saran Troubleshoot'];
    const rows = scanFailures.map((item) => [
      `"${item.id.replace(/"/g, '""')}"`,
      `"${item.timeFormatted.replace(/"/g, '""')}"`,
      `"${item.type.replace(/"/g, '""')}"`,
      `"${(item.code || '').replace(/"/g, '""')}"`,
      `"${item.reason.replace(/"/g, '""')}"`,
      `"${item.suggestion.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_kegagalan_scanner_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playFeedback('click');
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setErrorType(null);
    setErrorMsg('');
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorType('CAMERA_NOT_FOUND');
        const msg = 'Peramban (browser) tidak mendukung akses kamera langsung.';
        setErrorMsg(msg);
        trackScanFailure('CAMERA_NOT_FOUND', msg, 'Kamera Web');
        return;
      }

      const isMobile = window.innerWidth < 768;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode },
          ...(isMobile ? { width: { ideal: 1080 }, height: { ideal: 1920 } } : {})
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      const errString = err?.name || err?.message || '';
      if (errString.includes('NotAllowedError') || errString.includes('PermissionDeniedError') || errString.includes('denied')) {
        setErrorType('CAMERA_DENIED');
        const msg = 'Izin akses kamera diblokir atau ditolak oleh peramban.';
        setErrorMsg(msg);
        trackScanFailure('CAMERA_DENIED', msg, 'Akses Kamera');
      } else if (errString.includes('NotFoundError') || errString.includes('DevicesNotFoundError')) {
        setErrorType('CAMERA_NOT_FOUND');
        const msg = 'Perangkat kamera (webcam) tidak terdeteksi pada perangkat ini.';
        setErrorMsg(msg);
        trackScanFailure('CAMERA_NOT_FOUND', msg, 'Device Webcam');
      } else {
        setErrorType('GENERAL_ERROR');
        const msg = 'Gagal menyalakan kamera: ' + (err?.message || 'Terjadi kesalahan sistem.');
        setErrorMsg(msg);
        trackScanFailure('GENERAL_ERROR', msg, 'Inisialisasi Kamera');
      }
    }
  }, [facingMode, trackScanFailure]);

  useEffect(() => {
    if (isOpen) {
      loadRecentScans();
      setErrorType(null);
      setErrorMsg('');
      setSuccessInfo(null);
      setQuickAction(null);
      setActionSuccessNotice(null);
    } else {
      stopCamera();
      setManualCode('');
      setErrorType(null);
      setErrorMsg('');
      setSuccessInfo(null);
      setQuickAction(null);
      setActionSuccessNotice(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera, loadRecentScans]);

  const previousFacingModeRef = useRef(facingMode);
  useEffect(() => {
    if (isCameraActive && previousFacingModeRef.current !== facingMode) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
    previousFacingModeRef.current = facingMode;
  }, [facingMode, isCameraActive, stopCamera, startCamera]);

  // Main QR resolution function for Assets, Assignments, and Students
  const resolveScannedText = useCallback(
    (rawText: string) => {
      let code = rawText.trim();
      if (!code) return;

      setIsProcessing(true);
      setErrorType(null);
      setErrorMsg('');

      // Check if it's a URL with ?scan= or ?code=
      if (code.includes('?') && (code.includes('scan=') || code.includes('code='))) {
        try {
          const url = new URL(code);
          const extracted = url.searchParams.get('scan') || url.searchParams.get('code');
          if (extracted) {
            code = extracted;
          }
        } catch {
          const match = code.match(/[?&](?:scan|code)=([^&]+)/);
          if (match) {
            code = decodeURIComponent(match[1]);
          }
        }
      }

      // Check if it's a JSON payload (Classroom assignment or student badge QR)
      let parsedJson: any = null;
      if (code.startsWith('{') && code.endsWith('}')) {
        try {
          parsedJson = JSON.parse(code);
        } catch {
          parsedJson = null;
        }
      }

      // 1. Try matching Classroom Assignment from JSON payload or direct ID
      const allAssignments = classroomService.getAssignments();
      const allStudents = accountService.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');
      let matchedAssignment: ClassroomAssignment | undefined;
      let matchedStudent: Account | undefined;

      if (parsedJson?.assignmentId) {
        matchedAssignment = allAssignments.find((a) => a.ID === parsedJson.assignmentId);
      }
      if (parsedJson?.studentId) {
        matchedStudent = allStudents.find((s) => s.ID === parsedJson.studentId);
      }

      if (!matchedAssignment) {
        matchedAssignment = allAssignments.find(
          (a) =>
            a.ID.toLowerCase() === code.toLowerCase() ||
            a.JUDUL.toLowerCase().includes(code.toLowerCase())
        );
      }

      if (!matchedStudent) {
        matchedStudent = allStudents.find(
          (s) =>
            s.ID.toLowerCase() === code.toLowerCase() ||
            (s.NIP && s.NIP.toLowerCase() === code.toLowerCase()) ||
            s.NAMA.toLowerCase() === code.toLowerCase()
        );
      }

      // If Student is matched (with or without specific Assignment in payload)
      if (matchedStudent) {
        const studentCourses = classroomService.getCoursesForSiswa(matchedStudent.ID, matchedStudent.KELAS);
        const courseIds = new Set(studentCourses.map((c) => c.ID));
        let studentAssignments = allAssignments.filter((a) => courseIds.has(a.COURSE_ID));
        if (studentAssignments.length === 0) studentAssignments = allAssignments;

        const subs = classroomService.getSubmissions(undefined, matchedStudent.ID);
        const submissionsMap: Record<string, ClassroomSubmission> = {};
        subs.forEach((s) => {
          submissionsMap[s.ASSIGNMENT_ID] = s;
        });

        const activeAsg = matchedAssignment ||
          studentAssignments.find((a) => !submissionsMap[a.ID] || submissionsMap[a.ID].NILAI === undefined) ||
          studentAssignments[0];

        const initialScore = activeAsg && submissionsMap[activeAsg.ID]?.NILAI !== undefined
          ? submissionsMap[activeAsg.ID].NILAI!
          : 85;

        const initialFeedback = activeAsg && submissionsMap[activeAsg.ID]?.FEEDBACK
          ? submissionsMap[activeAsg.ID].FEEDBACK!
          : 'Bagus sekali, pemahaman materi sangat baik!';

        const info: ScanSuccessInfo = {
          title: matchedAssignment
            ? `${matchedStudent.NAMA} — ${matchedAssignment.JUDUL}`
            : matchedStudent.NAMA,
          subtitle: matchedAssignment
            ? `Tugas: ${matchedAssignment.JUDUL} (${matchedAssignment.TYPE}) • ${matchedStudent.KELAS || 'Aktif'}`
            : `Siswa SDN Tangerang 6 • ${matchedStudent.KELAS || 'Kelas Aktif'} (NIS: ${matchedStudent.NIP || '-'})`,
          type: 'STUDENT',
          code: matchedStudent.NIP || matchedStudent.ID,
        };

        const recentItem: RecentScanItem = {
          id: `${matchedStudent.ID}_${Date.now()}`,
          code: matchedStudent.NIP || matchedStudent.ID,
          title: matchedAssignment ? `${matchedStudent.NAMA} (${matchedAssignment.JUDUL})` : matchedStudent.NAMA,
          subtitle: `Siswa • ${matchedStudent.KELAS || 'Aktif'}`,
          type: 'STUDENT',
          rawPayload: rawText,
          timestamp: Date.now(),
        };

        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        if (quickActionsActive) {
          setQuickAction({
            type: matchedAssignment ? 'COMBINED' : 'STUDENT',
            student: matchedStudent,
            assignment: activeAsg,
            rawPayload: rawText,
            allStudentAssignments: studentAssignments,
            submissionsMap,
            activeAssignmentId: activeAsg?.ID || '',
            score: initialScore,
            feedback: initialFeedback,
            noteText: '',
            noteCategory: '🌟 Sangat Aktif',
          });
          setQuickActionTab('GRADE');
          setIsProcessing(false);
          return;
        }

        setTimeout(() => {
          stopCamera();
          if (onSelectStudent) {
            onSelectStudent(matchedStudent!);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // If Assignment is matched without specific Student in payload
      if (matchedAssignment) {
        const targetClassList = currentClass
          ? currentClass.split(/[,+]/).map((s) => s.trim().toLowerCase()).filter(Boolean)
          : [];
        const classStudents = allStudents.filter((s) => {
          if (!currentClass || targetClassList.length === 0) return true;
          const sClass = (s.KELAS || '').toLowerCase().trim();
          return targetClassList.includes(sClass) || sClass === currentClass.toLowerCase().trim();
        });
        const targetStudents = classStudents.length > 0 ? classStudents : allStudents;
        const firstStudent = targetStudents[0];

        const subs = classroomService.getSubmissions(matchedAssignment.ID);
        const submissionsMap: Record<string, ClassroomSubmission> = {};
        subs.forEach((s) => {
          submissionsMap[s.SISWA_ID] = s;
        });

        const initialScore = firstStudent && submissionsMap[firstStudent.ID]?.NILAI !== undefined
          ? submissionsMap[firstStudent.ID].NILAI!
          : 85;

        const initialFeedback = firstStudent && submissionsMap[firstStudent.ID]?.FEEDBACK
          ? submissionsMap[firstStudent.ID].FEEDBACK!
          : 'Bagus, pertahankan prestasimu!';

        const info: ScanSuccessInfo = {
          title: matchedAssignment.JUDUL,
          subtitle: `Tugas Pembelajaran • ${matchedAssignment.TYPE} (${matchedAssignment.ID})`,
          type: 'ASSIGNMENT',
          code: matchedAssignment.ID,
        };

        const recentItem: RecentScanItem = {
          id: matchedAssignment.ID,
          code: matchedAssignment.ID,
          title: matchedAssignment.JUDUL,
          subtitle: `Tugas • ${matchedAssignment.TYPE}`,
          type: 'ASSIGNMENT',
          rawPayload: rawText,
          timestamp: Date.now(),
        };

        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        if (quickActionsActive) {
          setQuickAction({
            type: 'ASSIGNMENT',
            student: firstStudent,
            assignment: matchedAssignment,
            rawPayload: rawText,
            allStudentAssignments: [matchedAssignment],
            submissionsMap,
            activeAssignmentId: matchedAssignment.ID,
            score: initialScore,
            feedback: initialFeedback,
            noteText: '',
            noteCategory: '🌟 Sangat Aktif',
          });
          setQuickActionTab('GRADE');
          setIsProcessing(false);
          return;
        }

        setTimeout(() => {
          stopCamera();
          if (onSelectAssignment) {
            onSelectAssignment(matchedAssignment!);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // 3. Try matching School Asset
      const assets = db.getAssets();
      const matchedAsset = assets.find(
        (a) =>
          a.KODE_ASET.toLowerCase() === code.toLowerCase() ||
          a.KODE_BARANG.toLowerCase() === code.toLowerCase() ||
          a.ID.toLowerCase() === code.toLowerCase() ||
          a.NAMA_BARANG.toLowerCase() === code.toLowerCase()
      );

      if (matchedAsset) {
        const info: ScanSuccessInfo = {
          title: matchedAsset.NAMA_BARANG,
          subtitle: `Aset Sekolah • Kode: ${matchedAsset.KODE_ASET} (${matchedAsset.LOKASI || 'Inventaris'})`,
          type: 'ASSET',
          code: matchedAsset.KODE_ASET,
        };
        const recentItem: RecentScanItem = {
          id: matchedAsset.ID,
          code: matchedAsset.KODE_ASET,
          title: matchedAsset.NAMA_BARANG,
          subtitle: `Aset • ${matchedAsset.KODE_ASET}`,
          type: 'ASSET',
          rawPayload: rawText,
          timestamp: Date.now(),
        };
        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        if (quickActionsActive) {
          setQuickAction({
            type: 'ASSET',
            asset: matchedAsset,
            rawPayload: rawText,
            allStudentAssignments: [],
            submissionsMap: {},
            activeAssignmentId: '',
            score: 100,
            feedback: 'Kondisi Baik',
            noteText: '',
            noteCategory: 'Kondisi Baik',
          });
          setIsProcessing(false);
          return;
        }

        setTimeout(() => {
          stopCamera();
          if (onSelectAsset) {
            onSelectAsset(matchedAsset);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // 4. Not found
      playFeedback('error');
      setIsProcessing(false);
      setErrorType('NOT_FOUND_IN_DB');
      const notFoundMsg = `Data dengan kode "${code}" tidak ditemukan dalam database aset, tugas, maupun siswa.`;
      setErrorMsg(notFoundMsg);
      trackScanFailure('NOT_FOUND_IN_DB', notFoundMsg, code);
    },
    [
      addRecentScan,
      onSelectAsset,
      onSelectAssignment,
      onSelectStudent,
      stopCamera,
      onClose,
      trackScanFailure,
      quickActionsActive,
      currentClass,
      onScanSuccess,
    ]
  );

  // Continuous Camera Barcode Detection Loop
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || successInfo || quickAction) return;

    let isScanning = true;
    let detector: any = null;

    if ('BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix'],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialisation notice:', e);
      }
    }

    const isPowerSaveActive = isLowBattery || isBatterySaverMode;

    const scanFrame = async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) {
        if (isScanning) {
          if (isPowerSaveActive) {
            setTimeout(() => {
              if (isScanning) {
                animationFrameRef.current = requestAnimationFrame(scanFrame);
              }
            }, 1000);
          } else {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        }
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            isScanning = false;
            resolveScannedText(barcodes[0].rawValue);
            return;
          }
        } catch {
          // ignore transient frame detection errors
        }
      }

      if (isScanning) {
        if (isPowerSaveActive) {
          setTimeout(() => {
            if (isScanning) {
              animationFrameRef.current = requestAnimationFrame(scanFrame);
            }
          }, 1000);
        } else {
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, successInfo, resolveScannedText, isLowBattery, isBatterySaverMode]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    resolveScannedText(manualCode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorType(null);
    setErrorMsg('');
    setIsProcessing(true);

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
      });
      const img = new Image();
      img.onload = async () => {
        try {
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0 && barcodes[0]?.rawValue) {
            resolveScannedText(barcodes[0].rawValue);
          } else {
            setIsProcessing(false);
            setErrorType('NO_QR_IN_IMAGE');
            const noQrMsg = 'Tidak ditemukan kode QR pada gambar yang diunggah. Pastikan foto tegak lurus dan pencahayaan terang.';
            setErrorMsg(noQrMsg);
            trackScanFailure('NO_QR_IN_IMAGE', noQrMsg, file.name);
          }
        } catch (err: any) {
          setIsProcessing(false);
          setErrorType('NO_QR_IN_IMAGE');
          const errMsg = 'Gagal memproses gambar QR: ' + (err?.message || 'Format gambar tidak didukung.');
          setErrorMsg(errMsg);
          trackScanFailure('NO_QR_IN_IMAGE', errMsg, file.name);
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorType('NO_QR_IN_IMAGE');
        const imgErr = 'Gagal memuat berkas foto. Silakan coba unggah berkas PNG atau JPG lain.';
        setErrorMsg(imgErr);
        trackScanFailure('NO_QR_IN_IMAGE', imgErr, file.name);
      };
      img.src = URL.createObjectURL(file);
    } else {
      setIsProcessing(false);
      const nameGuess = file.name.replace(/\.[^/.]+$/, '');
      setManualCode(nameGuess);
      setErrorType('GENERAL_ERROR');
      const noDetMsg = 'Peramban tidak memiliki pendeteksi gambar otomatis. Kode dari nama berkas telah disalin ke kolom pencarian manual.';
      setErrorMsg(noDetMsg);
      trackScanFailure('GENERAL_ERROR', noDetMsg, file.name);
    }
  };

  const handleRecentScanClick = (item: RecentScanItem) => {
    resolveScannedText(item.rawPayload || item.code);
  };

  if (!isOpen) return null;

  const assets = db.getAssets();
  const assignments = classroomService.getAssignments();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/40 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 ring-1 ring-emerald-500/30">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5 flex-wrap">
                Scanner QR SDN Tangerang 6
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">
                  v2.4
                </span>
                {quickActionsActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold flex items-center gap-1 shadow-xs animate-in fade-in">
                    <Zap size={10} className="fill-amber-300 text-amber-300" />
                    <span>Aksi Cepat</span>
                  </span>
                )}
                {currentClass && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-800/80 text-teal-200 border border-teal-500/40 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    Target: {currentClass}
                  </span>
                )}
                {isBatterySaverMode && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-bold flex items-center gap-1 shadow-xs animate-in fade-in">
                    <Leaf size={10} className="fill-emerald-300" />
                    <span>Hemat Daya (1 FPS)</span>
                  </span>
                )}
                {scanGoal !== undefined && scanGoal > 0 && (
                  <button
                    type="button"
                    onClick={onOpenScanSettings}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/90 hover:bg-emerald-700 text-emerald-200 border border-emerald-500/50 font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Klik untuk menetapkan target jumlah pemindaian (Scan Goal)"
                  >
                    <Target size={11} className="text-emerald-300" />
                    <span>Goal: {sessionScanCount !== undefined ? `${sessionScanCount}/` : ''}{scanGoal}</span>
                  </button>
                )}
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Pindai QR Tugas Siswa, Kartu Pelajar, & Label Aset
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleQuickActionsMode}
              className={`px-2 sm:px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold ${
                quickActionsActive
                  ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 ring-1 ring-amber-400/40 shadow-xs'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
              title={quickActionsActive ? 'Aksi Cepat Aktif: Panel nilai tugas & catatan muncul otomatis setelah scan tanpa keluar scanner (Klik untuk nonaktifkan)' : 'Aksi Cepat Nonaktif: Auto-redirect setelah scan (Klik untuk aktifkan)'}
            >
              <Zap size={13} className={quickActionsActive ? 'text-amber-300 fill-amber-300' : 'text-white/50'} />
              <span className="hidden sm:inline">{quickActionsActive ? 'Aksi Cepat: ON' : 'Aksi Cepat: OFF'}</span>
            </button>
            {onOpenScanSettings && (
              <button
                type="button"
                onClick={onOpenScanSettings}
                className="px-2 sm:px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold ring-1 ring-white/10"
                title="Buka Pengaturan Scanner & Target Goal"
              >
                <Sliders size={13} className="text-teal-300" />
                <span className="hidden sm:inline">Pengaturan</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleSoundFeedback}
              className={`px-2 sm:px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold ${
                soundFeedbackEnabled
                  ? 'bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40 ring-1 ring-emerald-400/40 shadow-xs'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
              title={soundFeedbackEnabled ? 'Audio & Haptic Feedback Aktif: Suara dan getaran menyala saat scan sukses (Klik untuk menonaktifkan)' : 'Audio & Haptic Feedback Nonaktif: Mode Senyap (Klik untuk mengaktifkan)'}
            >
              {soundFeedbackEnabled ? <Volume2 size={13} className="text-emerald-300 animate-pulse" /> : <VolumeX size={13} className="text-white/50" />}
              <span className="hidden sm:inline">{soundFeedbackEnabled ? 'Audio/Haptic: ON' : 'Audio/Haptic: OFF'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Tutup Scanner"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Category Target Mode Selector */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
            Fokus Scan:
          </span>
          <button
            type="button"
            onClick={() => setActiveMode('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles size={12} />
            <span>Otomatis (Semua)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('ASSIGNMENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ASSIGNMENT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <BookOpen size={12} />
            <span>Tugas Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('STUDENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'STUDENT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <User size={12} />
            <span>Presensi Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('ASSET')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ASSET'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Package size={12} />
            <span>Aset Sekolah</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* STEP-BY-STEP INSTRUCTIONAL GUIDE FOR STUDENTS */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 space-y-2.5 transition-all">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowGuide((prev) => !prev)}
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-emerald-700 shrink-0" />
                <span className="text-xs font-black text-emerald-950">
                  Panduan Cara Scan untuk Siswa & Guru
                </span>
              </div>
              <button
                type="button"
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-0.5"
              >
                <span>{showGuide ? 'Sembunyikan' : 'Lihat Panduan'}</span>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 overflow-hidden"
                >
                  {/* Step 1 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <Camera size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">1. Buka Kamera</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Klik tombol kamera dan izinkan akses di peramban.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <ScanLine size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">2. Posisikan QR</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Arahkan kotak bidik hijau sejajar pada jarak 15–20 cm.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <SunMedium size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">3. Cahaya Terang</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Pastikan cahaya cukup tanpa silau agar terbaca otomatis.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* EXPLICIT ERROR HANDLING UI WITH TROUBLESHOOTING & RETRY BUTTONS */}
          {errorType && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-rose-900">
                    {errorType === 'CAMERA_DENIED'
                      ? 'Izin Akses Kamera Ditolak'
                      : errorType === 'CAMERA_NOT_FOUND'
                      ? 'Perangkat Kamera Tidak Ditemukan'
                      : errorType === 'NO_QR_IN_IMAGE'
                      ? 'Kode QR Tidak Ditemukan pada Foto'
                      : errorType === 'NOT_FOUND_IN_DB'
                      ? 'Data QR Tidak Dikenali'
                      : 'Terjadi Kendala Pemindaian'}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">{errorMsg}</p>

                  {/* Troubleshooting Guidance */}
                  <div className="mt-2 text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 space-y-1">
                    <strong className="block font-bold">💡 Langkah Penyelesaian Cepat:</strong>
                    {errorType === 'CAMERA_DENIED' && (
                      <ol className="list-decimal list-inside space-y-0.5 text-rose-800 text-[10px]">
                        <li>Klik ikon gembok 🔒 atau kamera 📷 di samping URL peramban.</li>
                        <li>Ubah izin "Kamera" menjadi <strong>Izinkan (Allow)</strong>.</li>
                        <li>Klik tombol <strong>Coba Lagi</strong> di bawah.</li>
                      </ol>
                    )}
                    {errorType === 'CAMERA_NOT_FOUND' && (
                      <p className="text-[10px] text-rose-800">
                        Pastikan webcam tersambung dengan baik, atau gunakan fitur <strong>Unggah Foto QR</strong> atau <strong>Pencarian Manual</strong> di bawah.
                      </p>
                    )}
                    {errorType === 'NO_QR_IN_IMAGE' && (
                      <p className="text-[10px] text-rose-800">
                        Coba ambil foto ulang dengan posisi tegak, jarak lebih dekat, dan pastikan tidak buram atau silau lampu.
                      </p>
                    )}
                    {errorType === 'NOT_FOUND_IN_DB' && (
                      <p className="text-[10px] text-rose-800">
                        Periksa kembali kode tugas atau nama aset yang dimasukkan, atau pilih dari daftar Tugas / Aset di bawah.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable Retry & Alternate Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-rose-200 justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setErrorType(null);
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  Tutup Peringatan
                </button>
                {errorType === 'CAMERA_DENIED' || errorType === 'CAMERA_NOT_FOUND' ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw size={13} /> Coba Akses Kamera Lagi
                  </button>
                ) : errorType === 'NO_QR_IN_IMAGE' ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Upload size={13} /> Unggah Ulang Foto
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorType(null);
                      setErrorMsg('');
                      setManualCode('');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw size={13} /> Coba Scan Ulang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SCANNER VIEWFINDER / CAMERA PREVIEW WITH RETICLE & SUCCESS ANIMATION OVERLAY */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border-2 border-slate-800">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{
                    filter: (isBatterySaverMode || isLowBattery) ? 'brightness(0.65) contrast(1.08)' : undefined,
                  }}
                />

                {/* Battery Saver Mode Banner when active without low-battery warning */}
                {isBatterySaverMode && !isLowBattery && (
                  <div className="absolute top-3 left-3 right-3 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 text-white z-10 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="p-1 rounded-md bg-emerald-500 text-slate-950 shrink-0">
                        <Leaf size={12} className="fill-slate-950" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[10px] font-black tracking-tight leading-none text-emerald-300 uppercase flex items-center gap-1.5">
                          Mode Hemat Baterai (1 FPS)
                          <span className="bg-emerald-800/80 text-emerald-200 text-[8px] px-1 py-0.2 rounded font-mono font-bold">Kecerahan 65%</span>
                        </p>
                        <p className="text-[9px] text-emerald-200/90 leading-tight truncate mt-0.5">
                          Laju bingkai & kecerahan kamera diturunkan untuk efisiensi baterai.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                      ECO
                    </span>
                  </div>
                )}

                {/* Power Saving Mode Banner at the top of camera feed */}
                {isLowBattery && (
                  <div className="absolute top-3 left-3 right-3 bg-rose-950/85 backdrop-blur-md border border-rose-500/50 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 text-white z-10 shadow-lg">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="p-1 rounded-md bg-rose-500 text-white shrink-0">
                        <BatteryLow size={12} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[10px] font-black tracking-tight leading-none text-rose-300 uppercase">Mode Hemat Daya (1 FPS)</p>
                        <p className="text-[9px] text-rose-200/95 leading-tight truncate">Baterai Lemah! Laju scan dikurangi & senter dinonaktifkan.</p>
                      </div>
                    </div>
                    {isBatterySaverMode && (
                      <span className="text-[9px] font-mono font-black bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                        ECO
                      </span>
                    )}
                  </div>
                )}

                {/* Reticle Overlay */}
                {!successInfo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg shadow-emerald-500/20">
                      {/* Scanning laser line effect */}
                      <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />

                      {/* Corners */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-300 -mt-1 -ml-1 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-300 -mt-1 -mr-1 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-300 -mb-1 -ml-1 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-300 -mb-1 -mr-1 rounded-br-lg" />

                      <div className="absolute -bottom-7 left-0 right-0 text-center">
                        <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Posisikan QR di dalam kotak
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                  <QrCode size={36} className="opacity-70" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Kamera Saat Ini Non-Aktif</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol di bawah untuk menyalakan kamera atau unggah berkas foto QR
                  </p>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS OVERLAY ON TOP OF CAMERA VIEW */}
            <AnimatePresence>
              {quickAction && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col z-30 overflow-hidden text-white"
                >
                  {/* Top Bar of Quick Actions Overlay */}
                  <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 tracking-wider font-mono">
                            ⚡ Quick Actions
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {quickAction.student?.KELAS || currentClass || 'SDN Tangerang 6'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white truncate leading-tight">
                          {quickAction.student?.NAMA || quickAction.assignment?.JUDUL || quickAction.asset?.NAMA_BARANG || 'Data QR Terpindai'}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResumeScanning}
                      className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="Tutup Panel & Lanjut Pindai"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Mode Tabs (Only for Student / Assignment) */}
                  {quickAction.type !== 'ASSET' ? (
                    <div className="px-3 pt-2 pb-1.5 bg-slate-950/80 flex items-center gap-1.5 shrink-0 border-b border-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickActionTab('GRADE');
                          playFeedback('click');
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          quickActionTab === 'GRADE'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Award size={13} />
                        <span>Nilai Tugas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickActionTab('NOTE');
                          playFeedback('click');
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          quickActionTab === 'NOTE'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <MessageSquare size={13} />
                        <span>Catatan Guru</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Body Content Area (Scrollable) */}
                  <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-2.5 min-h-0 text-left text-xs">
                    {/* Notice if saving or success */}
                    {actionSuccessNotice && (
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>{actionSuccessNotice}</span>
                      </div>
                    )}

                    {quickAction.type === 'ASSET' ? (
                      /* Asset Quick Actions */
                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Kode Aset:</span>
                          <p className="font-mono text-xs text-amber-300 font-black">{quickAction.asset?.KODE_ASET}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Lokasi:</span>
                          <p className="text-xs text-slate-200">{quickAction.asset?.LOKASI || 'Gudang Sekolah'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300">Status Verifikasi Kondisi:</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Kondisi Baik', 'Rusak Ringan', 'Rusak Berat'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  setQuickAction((p) => p ? { ...p, noteCategory: st, feedback: st } : null);
                                  playFeedback('click');
                                }}
                                className={`p-2 rounded-xl text-center text-[10px] font-bold border transition cursor-pointer ${
                                  quickAction.noteCategory === st
                                    ? 'bg-amber-600/30 text-amber-200 border-amber-400'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300">Catatan Inventaris / Cek Fisik:</label>
                          <input
                            type="text"
                            value={quickAction.noteText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickAction((p) => p ? { ...p, noteText: val } : null);
                            }}
                            placeholder="Catatan inspeksi fisik aset..."
                            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-amber-500"
                          />
                        </div>
                      </div>
                    ) : quickActionTab === 'GRADE' ? (
                      /* Assignment Quick Grading View */
                      <>
                        {/* Assignment Selector (if student has assignments) */}
                        {quickAction.allStudentAssignments && quickAction.allStudentAssignments.length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <BookOpen size={11} className="text-emerald-400" />
                                Tugas yang Dinilai:
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                {quickAction.assignment && quickAction.submissionsMap[quickAction.assignment.ID]?.NILAI !== undefined
                                  ? `Ternilai: ${quickAction.submissionsMap[quickAction.assignment.ID].NILAI}/100`
                                  : 'Belum Dinilai'}
                              </span>
                            </label>
                            <select
                              value={quickAction.activeAssignmentId}
                              onChange={(e) => handleSwitchAssignment(e.target.value)}
                              className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-emerald-500"
                            >
                              {quickAction.allStudentAssignments.map((asg) => (
                                <option key={asg.ID} value={asg.ID}>
                                  {asg.JUDUL} ({asg.TYPE}) {quickAction.submissionsMap[asg.ID]?.NILAI !== undefined ? `— Nilai: ${quickAction.submissionsMap[asg.ID].NILAI}` : '— Belum Dinilai'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Student Selector if only Assignment was scanned */}
                        {quickAction.type === 'ASSIGNMENT' && !quickAction.student && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <User size={11} className="text-blue-400" />
                                Pilih Siswa yang Dinilai:
                              </span>
                            </label>
                            <select
                              value={quickAction.student?.ID || ''}
                              onChange={(e) => {
                                const allStu = accountService.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');
                                const found = allStu.find((s) => s.ID === e.target.value);
                                if (found) {
                                  setQuickAction((p) => p ? { ...p, student: found } : null);
                                }
                              }}
                              className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-blue-500"
                            >
                              {accountService.getAccounts('CLASSROOM').filter((a) => {
                                if (a.ROLE !== 'SISWA') return false;
                                if (!currentClass) return true;
                                const list = currentClass.split(/[,+]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
                                if (list.length === 0) return true;
                                const sClass = (a.KELAS || '').toLowerCase().trim();
                                return list.includes(sClass) || sClass === currentClass.toLowerCase().trim();
                              }).map((stu) => (
                                <option key={stu.ID} value={stu.ID}>
                                  {stu.NAMA} ({stu.KELAS || 'Aktif'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quick Score Presets & Numeric Steppers */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={11} className="text-amber-400" />
                              Pilihan Nilai Cepat:
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              quickAction.score >= 85
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : quickAction.score >= 75
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : quickAction.score >= 60
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              {quickAction.score >= 90 ? 'Sangat Baik (A)' : quickAction.score >= 80 ? 'Baik (B)' : quickAction.score >= 70 ? 'Cukup (C)' : 'Remedial (D)'}
                            </span>
                          </div>

                          {/* Score Pill Buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            {[100, 95, 90, 85, 80, 75, 70].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleScorePreset(val)}
                                className={`flex-1 min-w-[38px] py-1.5 rounded-lg text-xs font-black font-mono transition text-center cursor-pointer border ${
                                  quickAction.score === val
                                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs'
                                    : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>

                          {/* Fine-tune Steppers & Custom Input */}
                          <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustScore(-5)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center transition border border-slate-700 cursor-pointer"
                                title="Kurangi 5 poin"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={quickAction.score}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    setQuickAction((p) => p ? { ...p, score: Math.min(100, Math.max(0, val)) } : null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveQuickGrade();
                                  }
                                }}
                                className="w-14 text-center font-mono font-black text-sm bg-slate-950 border border-slate-700 rounded-lg py-1 text-white focus:outline-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAdjustScore(5)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center transition border border-slate-700 cursor-pointer"
                                title="Tambah 5 poin"
                              >
                                <Plus size={12} />
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Tekan Enter untuk simpan</span>
                          </div>
                        </div>

                        {/* Quick Feedback Presets */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-300 block">
                            Pilihan Umpan Balik Guru:
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              '🌟 Sangat Baik & Rapi!',
                              '✅ Tuntas Sesuai KKM',
                              '⏰ Tepat Waktu',
                              '📝 Perlu Peningkatan',
                              '🔍 Teliti Kembali Hitungan',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleFeedbackPreset(preset)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                                  quickAction.feedback === preset
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={quickAction.feedback}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickAction((p) => p ? { ...p, feedback: val } : null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveQuickGrade();
                              }
                            }}
                            placeholder="Tulis umpan balik tugas untuk siswa..."
                            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-emerald-500"
                          />
                        </div>
                      </>
                    ) : (
                      /* Teacher Quick Note-Taking View */
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-300 block mb-1">
                            Kategori Catatan & Observasi:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {[
                              { cat: '🌟 Sangat Aktif', hint: 'Siswa aktif bertanya & berpartisipasi dalam diskusi kelas' },
                              { cat: '📝 Tugas Rapi', hint: 'Pengerjaan tugas rapi, teliti, dan sistematis' },
                              { cat: '⚠️ Perlu Bimbingan', hint: 'Perlu pendampingan remedial pada materi ini' },
                              { cat: '⏰ Terlambat', hint: 'Tugas dikumpulkan melebihi batas waktu deadline' },
                              { cat: '💡 Ide Kreatif', hint: 'Menunjukkan inisiatif pemecahan masalah kreatif' },
                              { cat: '💬 Catatan Khusus', hint: '' },
                            ].map((item) => (
                              <button
                                key={item.cat}
                                type="button"
                                onClick={() => handleSelectNoteCategory(item.cat, item.hint)}
                                className={`p-1.5 rounded-xl border text-left transition cursor-pointer text-[10px] font-bold ${
                                  quickAction.noteCategory === item.cat
                                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400 shadow-xs'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {item.cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
                            <span>Isi Catatan Guru:</span>
                            <span className="text-[9px] text-slate-500">Tersimpan ke portofolio siswa</span>
                          </label>
                          <textarea
                            rows={3}
                            value={quickAction.noteText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickAction((p) => p ? { ...p, noteText: val } : null);
                            }}
                            placeholder="Tulis catatan observasi, perkembangan belajar, atau pesan motivasi untuk siswa..."
                            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-indigo-500 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer Bar */}
                  <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleResumeScanning}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700"
                        title="Kembali ke pemindaian kamera tanpa menyimpan"
                      >
                        <Scan size={12} />
                        <span>Lewati & Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleViewFullDetail}
                        className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-[10px] font-bold transition cursor-pointer"
                        title="Buka halaman rincian penuh data ini"
                      >
                        Detail Lengkap ➔
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {quickAction.type === 'ASSET' ? (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const raw = localStorage.getItem('sdn6_asset_inspections');
                              const list = raw ? JSON.parse(raw) : [];
                              list.unshift({
                                id: 'INSP-' + Date.now(),
                                assetId: quickAction.asset?.ID,
                                assetCode: quickAction.asset?.KODE_ASET,
                                condition: quickAction.noteCategory,
                                note: quickAction.noteText,
                                teacher: teacherAccount?.NAMA || 'Petugas',
                                time: new Date().toISOString(),
                              });
                              localStorage.setItem('sdn6_asset_inspections', JSON.stringify(list.slice(0, 200)));
                            } catch {}
                            playFeedback('success');
                            setActionSuccessNotice('Verifikasi aset berhasil disimpan!');
                            setTimeout(() => {
                              handleResumeScanning();
                            }, 600);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Save size={13} />
                          <span>Simpan & Lanjut Scan</span>
                        </button>
                      ) : quickActionTab === 'GRADE' ? (
                        <button
                          type="button"
                          onClick={handleSaveQuickGrade}
                          disabled={isSavingAction}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAction ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <CheckCheck size={13} strokeWidth={2.5} />
                          )}
                          <span>Simpan & Lanjut Scan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveQuickNote}
                          disabled={isSavingAction}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAction ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          <span>Simpan Catatan & Lanjut</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* VISUAL SUCCESS ANIMATION OVERLAY (GREEN CHECKMARK PULSE) */}
            <AnimatePresence>
              {!quickAction && successInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, type: 'spring', damping: 15 }}
                  className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center z-20 space-y-3"
                >
                  {/* Glowing Animated Pulse Check Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
                    <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 relative border-2 border-emerald-200">
                      <Check size={44} strokeWidth={3.5} />
                    </div>
                  </motion.div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 inline-flex items-center gap-1">
                      <Sparkles size={11} /> Scan Berhasil Terbaca!
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      {successInfo.title}
                    </h3>
                    <p className="text-xs text-emerald-200/90">{successInfo.subtitle}</p>
                  </div>

                  <div className="text-[11px] text-emerald-300/80 flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" /> Membuka rincian data...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Indicator */}
            {isProcessing && !successInfo && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 space-y-2">
                <RefreshCw size={24} className="animate-spin text-emerald-400" />
                <span className="text-xs font-bold">Membaca data QR...</span>
              </div>
            )}
          </div>

          {/* Camera Controls & File Upload */}
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer min-h-[42px]"
              >
                <Camera size={16} className="text-emerald-300" />
                <span>Nyalakan Kamera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer min-h-[42px]"
              >
                <span>Matikan Kamera</span>
              </button>
            )}

            <label className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-200 shrink-0 min-h-[42px]">
              <Upload size={15} className="text-slate-600" />
              <span>Unggah Foto</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* UNDO TOAST NOTIFICATION BANNER */}
          <AnimatePresence>
            {undoToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="p-2.5 bg-rose-900/90 border border-rose-500/50 text-rose-100 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RotateCcw size={14} className="text-rose-300 shrink-0" />
                  <span className="truncate">{undoToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUndoToast(null)}
                  className="text-rose-300 hover:text-white p-0.5"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECONDARY CONFIRMATION FLYOUT WHEN QUEUE > 5 ITEMS */}
          <AnimatePresence>
            {recentScans.length > 5 && !dismissedBatchFlyout && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="p-3 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/60 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
                    <Download size={15} className="animate-bounce" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-amber-300 truncate">
                      {showModalExportClearConfirm ? "Anda Yakin?" : `Antrean Batch Mencukupi (${recentScans.length} Item)`}
                    </p>
                    <p className="text-[10px] text-slate-300 truncate">
                      {showModalExportClearConfirm ? "Proses ini akan mengunduh CSV & mengosongkan antrean." : "Siap diekspor ke CSV & dibersihkan untuk efisiensi kelas besar."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!showModalExportClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowModalExportClearConfirm(true)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] flex items-center gap-1.5 shadow-md cursor-pointer transition"
                    >
                      <Download size={12} />
                      <span>Ekspor & Bersihkan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          exportHistoryToCSV();
                          clearRecentScans();
                          setShowModalExportClearConfirm(false);
                          setDismissedBatchFlyout(true);
                          setUndoToast(`Batch ${recentScans.length} item berhasil diekspor ke CSV & antrean dibersihkan.`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                      >
                        Ya, Ekspor
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModalExportClearConfirm(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px]"
                      >
                        Batal
                      </button>
                    </>
                  )}
                  {!showModalExportClearConfirm && (
                    <button
                      type="button"
                      onClick={() => setDismissedBatchFlyout(true)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Abaikan & lanjut scan"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BULK QUEUE VISUAL PROGRESS BAR & COUNTER INDICATOR */}
          {recentScans.length > 0 && (() => {
            const batchCapacity = 20;
            const queuePct = Math.min(100, Math.round((recentScans.length / batchCapacity) * 100));
            const lastItem = recentScans[0];

            return (
              <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-md space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                      <Target size={14} className="animate-pulse" />
                    </span>
                    <div>
                      <span className="font-black text-white">Antrean Bulk Scanner: </span>
                      <span className="font-mono font-bold text-emerald-400">{recentScans.length} Item</span>
                      {selectedScanIds.size > 0 && (
                        <span className="text-[10px] text-slate-300 ml-1.5 font-semibold">
                          ({selectedScanIds.size} dipilih)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Clear Last Scanned Item Button */}
                  <button
                    type="button"
                    onClick={clearLastScannedItem}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    title={`Hapus item terakhir yang baru dipindai (${lastItem?.title || ''})`}
                  >
                    <RotateCcw size={12} />
                    <span>Hapus Item Terakhir</span>
                  </button>
                </div>

                {/* Animated Visual Fill Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${queuePct}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`h-full rounded-full transition-all ${
                        queuePct >= 90
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                    <span className="truncate">Terakhir: <strong className="text-emerald-300 font-bold">{lastItem?.title || '-'}</strong></span>
                    <span className="font-mono font-bold text-slate-300">{queuePct}% Kuota Batch ({recentScans.length}/{batchCapacity})</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* RECENT SCANS LIST (LAST 3-5 ITEMS WITH ONE-CLICK RE-ACCESS) */}
          {recentScans.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                  <History size={13} className="text-emerald-700" />
                  Riwayat Scan Terakhir ({recentScans.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsBulkPrintOpen(true)}
                    className="text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1 rounded-lg shadow-2xs"
                    title="Cetak massal log riwayat pemindaian ke format PDF berstandar sekolah"
                  >
                    <Printer size={11} />
                    <span>Cetak PDF {selectedScanIds.size > 0 ? `(${selectedScanIds.size})` : 'Massal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportHistoryToCSV}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition cursor-pointer bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100"
                    title="Ekspor riwayat ke file CSV"
                  >
                    <Download size={11} /> Ekspor CSV
                  </button>
                  <button
                    type="button"
                    onClick={clearRecentScans}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                    title="Hapus riwayat pemindaian lokal"
                  >
                    <Trash2 size={11} /> Bersihkan
                  </button>
                </div>
              </div>

              {/* Category Filter Dropdown & Bulk Select Button */}
              <div className="flex items-center gap-2 bg-white/70 p-1.5 rounded-xl border border-slate-200/60 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1 select-none">Filter:</span>
                <select
                  value={recentScansFilter}
                  onChange={(e) => setRecentScansFilter(e.target.value as any)}
                  className="flex-1 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-3xs hover:border-slate-300 hover:text-slate-800 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer outline-hidden min-w-[120px]"
                >
                  <option value="ALL">Semua Kategori ({recentScans.length})</option>
                  <option value="STUDENT">Attendance (Presensi Siswa)</option>
                  <option value="ASSIGNMENT">Assignment Submission (Submisi Tugas)</option>
                  <option value="ASSET">Asset Verification (Verifikasi Aset)</option>
                </select>

                <button
                  type="button"
                  onClick={toggleSelectAllFilteredScans}
                  className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 shadow-3xs transition cursor-pointer shrink-0"
                  title="Pilih atau batalkan pilihan semua item yang tampil"
                >
                  {filteredRecentScans.length > 0 && filteredRecentScans.every((s) => selectedScanIds.has(s.id)) ? (
                    <>
                      <CheckSquare size={12} className="text-emerald-600" />
                      <span>Batal ({filteredRecentScans.length})</span>
                    </>
                  ) : (
                    <>
                      <Square size={12} className="text-slate-400" />
                      <span>Pilih Semua ({filteredRecentScans.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scrollable list of recent items */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {filteredRecentScans.length === 0 ? (
                  <div className="text-center text-slate-400 text-[10px] py-4 bg-white border border-slate-200 border-dashed rounded-xl select-none font-medium">
                    Tidak ada riwayat untuk kategori "{recentScansFilter === 'STUDENT' ? 'Attendance' : recentScansFilter === 'ASSIGNMENT' ? 'Assignment Submission' : 'Asset Verification'}".
                  </div>
                ) : (
                  filteredRecentScans.map((item) => (
                    <div
                      key={`${item.id}-${item.timestamp}`}
                      onClick={() => handleRecentScanClick(item)}
                      className={`w-full p-2 rounded-xl bg-white hover:bg-emerald-50/70 hover:border-emerald-300 border text-left transition flex items-center justify-between gap-2 shadow-2xs group cursor-pointer ${
                        selectedScanIds.has(item.id)
                          ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={(e) => toggleSelectScan(item.id, e)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            selectedScanIds.has(item.id)
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                          title={selectedScanIds.has(item.id) ? 'Batalkan pilihan' : 'Pilih untuk cetak massal'}
                        >
                          {selectedScanIds.has(item.id) && <Check size={10} strokeWidth={3} />}
                        </button>

                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            item.type === 'ASSIGNMENT'
                              ? 'bg-blue-100 text-blue-800'
                              : item.type === 'STUDENT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.type === 'ASSIGNMENT' ? (
                            <BookOpen size={13} />
                          ) : item.type === 'STUDENT' ? (
                            <User size={13} />
                          ) : (
                            <Package size={13} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                            {item.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle || item.code}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-emerald-700 font-bold opacity-80 group-hover:opacity-100">
                        <span>Buka</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected summary banner */}
              {selectedScanIds.size > 0 && (
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <CheckSquare size={12} className="text-emerald-600" />
                    <span>{selectedScanIds.size} log terpilih</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBulkPrintOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition"
                  >
                    <Printer size={11} />
                    <span>Cetak PDF Terpilih</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCAN HISTORY DEBUG SECTION */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowDebugSection(!showDebugSection)}
                className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 cursor-pointer hover:text-emerald-800 transition"
              >
                <Bug size={13} className="text-amber-600" />
                <span>Scan History Debug</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    scanFailures.length > 0
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {scanFailures.length > 0 ? `${scanFailures.length} Gagal Terdeteksi` : 'Normal (0 Error)'}
                </span>
                {/* Dynamic Battery Level Indicator Next to Text Status */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border shadow-3xs transition-colors ${
                    systemBattery.charging
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : systemBattery.level <= 0.2
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : systemBattery.level <= 0.5
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={`Status Daya Baterai: ${Math.round(systemBattery.level * 100)}% ${systemBattery.charging ? '(Sedang Mengisi Daya)' : 'Tersedia'}`}
                >
                  {systemBattery.charging ? (
                    <BatteryCharging size={11} className="text-emerald-600 animate-pulse" />
                  ) : systemBattery.level <= 0.2 ? (
                    <BatteryLow size={11} className="text-rose-600 animate-pulse" />
                  ) : systemBattery.level <= 0.5 ? (
                    <BatteryMedium size={11} className="text-amber-600" />
                  ) : (
                    <BatteryFull size={11} className="text-emerald-600" />
                  )}
                  <span>{Math.round(systemBattery.level * 100)}%</span>
                </span>
                {showDebugSection ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
              </button>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAutoScrollDebug(!autoScrollDebug)}
                  className={`text-[9px] font-bold px-2 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer border shadow-3xs ${
                    autoScrollDebug
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={autoScrollDebug ? 'Auto-Scroll Aktif: Log kegagalan baru langsung terlihat (Klik untuk mematikan)' : 'Auto-Scroll Nonaktif: Klik untuk mengaktifkan scroll otomatis'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${autoScrollDebug ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  <span>Auto-Scroll: {autoScrollDebug ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportFailedScansToCSV}
                  disabled={scanFailures.length === 0}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 shadow-2xs ${
                    scanFailures.length > 0
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer ring-1 ring-emerald-600/40'
                      : 'bg-slate-200/70 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    scanFailures.length > 0
                      ? `Ekspor ${scanFailures.length} laporan kegagalan scanner ke file CSV`
                      : 'Belum ada log kegagalan scanner untuk diekspor'
                  }
                >
                  <Download size={11} />
                  <span>Ekspor CSV ({scanFailures.length})</span>
                </button>
                {scanFailures.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScanFailures([])}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-xl hover:bg-rose-50 transition flex items-center gap-1 cursor-pointer"
                    title="Bersihkan riwayat error debug scanner"
                  >
                    <Trash2 size={11} /> Bersihkan
                  </button>
                )}
              </div>
            </div>

            {showDebugSection && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500">
                  Pelacakan riwayat kegagalan pemindaian scanner (kamera diblokir, berkas foto tanpa QR, atau kode tidak terdaftar) untuk mempermudah troubleshooting guru:
                </p>

                {scanFailures.length === 0 ? (
                  <div className="text-center text-slate-400 text-[10px] py-3 bg-white border border-slate-200 border-dashed rounded-xl select-none font-medium flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Tidak ada riwayat kegagalan scanner. Semua scan berjalan normal.</span>
                  </div>
                ) : (
                  <div ref={debugFailuresListRef} className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scroll-smooth">
                    {scanFailures.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-xl text-left space-y-1 shadow-3xs transition-all duration-300 ${
                          idx === 0
                            ? 'bg-rose-50/95 border-2 border-rose-300 ring-2 ring-rose-200/50'
                            : 'bg-white border border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle size={11} /> {item.timeFormatted}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                                Terbaru
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] max-w-[150px] truncate" title={item.code}>
                            Target: {item.code}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-800">
                          Kendala: <span className="text-rose-700">{item.reason}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 bg-rose-50/50 p-1.5 rounded-lg border border-rose-100/70">
                          💡 <strong>Saran Solusi Guru:</strong> {item.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Input Search Fallback */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Atau Masukkan Kode Register / ID Tugas Manual:
            </span>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: AST-2026-0001 / ASG-001 / Nama Siswa"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-emerald-700 bg-slate-50 min-h-[38px]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition shrink-0 shadow-2xs min-h-[38px] cursor-pointer"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Quick Select from Registered Assignments & Assets */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sampel Tugas & Aset Siap Scan:
              </span>
            </div>

            {/* Assignments Quick Pills */}
            {assignments.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-blue-700 font-bold block">Tugas Pembelajaran:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {assignments.slice(0, 4).map((asg) => (
                    <button
                      key={asg.ID}
                      type="button"
                      onClick={() => resolveScannedText(asg.ID)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 text-[11px] font-bold text-blue-800 transition flex items-center gap-1 cursor-pointer truncate max-w-[200px]"
                    >
                      <BookOpen size={11} className="text-blue-600 shrink-0" />
                      <span className="truncate">{asg.JUDUL}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Quick Pills */}
            {assets.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold block">Aset & Inventaris:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {assets.slice(0, 4).map((a) => (
                    <button
                      key={a.ID}
                      type="button"
                      onClick={() => resolveScannedText(a.KODE_ASET)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-[11px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Package size={11} className="text-emerald-700 shrink-0" />
                      <span>{a.KODE_ASET}</span>
                      <span className="text-slate-400 font-sans truncate max-w-[100px]">({a.NAMA_BARANG})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-emerald-600" /> Mendukung QR Tugas, Siswa, & Aset
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Bulk QR History Print & PDF Export Modal */}
        <BulkQRHistoryPrintModal
          isOpen={isBulkPrintOpen}
          onClose={() => setIsBulkPrintOpen(false)}
          scans={recentScans}
          initialSelectedIds={Array.from(selectedScanIds)}
        />
      </div>
    </div>
  );
};
