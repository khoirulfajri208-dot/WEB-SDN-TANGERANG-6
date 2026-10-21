import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Sliders,
  X,
  Check,
  RotateCcw,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  Video,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  School,
  Scan,
  BookOpen,
  UserCheck,
  Package,
  Battery,
  BatteryLow,
  BatteryCharging,
  AlertTriangle,
  Zap,
  ZapOff,
  Leaf,
  BellRing,
  Trash2,
  FolderPlus,
  Layers,
  Tag,
  BookmarkPlus,
  TrendingDown,
  Activity,
  Clock,
  ShieldCheck,
  Info,
  Gauge,
  RefreshCw,
  BarChart2,
  Moon,
  Timer,
  Search,
  Bookmark,
  Save,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';
import { playFeedback } from '../../utils/feedback';

export interface BatteryHistoryPoint {
  id: string;
  time: string;           // "07:00", "07:30", etc.
  timestamp: number;
  level: number;          // 0 to 100
  charging: boolean;
  saverMode: boolean;
  activity: string;       // e.g. "Persiapan KBM", "Scan Presensi Pagi", "KBM Tematik", "Istirahat", "Scan Evaluasi", etc.
  drainRatePerHour: number; // e.g. 5.5 (%/hr)
  note?: string;
}

const getDefaultSchoolDayBatteryHistory = (
  currentLevelPct?: number | null,
  isCharging?: boolean,
  isSaver?: boolean
): BatteryHistoryPoint[] => {
  const basePoints = [
    { time: '07:00', level: 98, charging: false, saverMode: false, activity: 'Persiapan KBM Pagi', drainRatePerHour: 2.0 },
    { time: '07:30', level: 91, charging: false, saverMode: !!isSaver, activity: 'Scan Presensi QR Masuk', drainRatePerHour: 14.0 },
    { time: '08:30', level: 84, charging: false, saverMode: !!isSaver, activity: 'KBM Sesi 1 (Tematik & Diskusi)', drainRatePerHour: 7.0 },
    { time: '09:30', level: 89, charging: true, saverMode: false, activity: 'Istirahat Pagi (Charger Terhubung)', drainRatePerHour: -10.0 },
    { time: '10:30', level: 81, charging: false, saverMode: !!isSaver, activity: 'Scan Evaluasi Tugas / Kuis', drainRatePerHour: 8.0 },
    { time: '11:45', level: 78, charging: false, saverMode: false, activity: 'Istirahat Siang & Sholat Dzuhur', drainRatePerHour: 2.4 },
    { time: '12:30', level: 71, charging: false, saverMode: !!isSaver, activity: 'KBM Sesi 2 (Projek P5 & Presentasi)', drainRatePerHour: 9.3 },
    { time: '13:30', level: 63, charging: false, saverMode: !!isSaver, activity: 'Scan Presensi Pulang & Evaluasi Harian', drainRatePerHour: 8.0 },
  ];

  return basePoints.map((p, idx) => ({
    id: `BATT-HIST-${idx}`,
    time: p.time,
    timestamp: Date.now() - (basePoints.length - idx) * 3600 * 1000,
    level: p.level,
    charging: p.charging,
    saverMode: p.saverMode,
    activity: p.activity,
    drainRatePerHour: p.drainRatePerHour,
  }));
};

export interface RombelPreset {
  id: string;
  name: string;
  classes: string[];
  description?: string;
  category?: 'FASE' | 'PARALEL' | 'CUSTOM' | 'SCHOOL';
  isCustom?: boolean;
}

export const DEFAULT_ROMBEL_PRESETS: RombelPreset[] = [
  {
    id: 'PRESET-FASE-A',
    name: 'Fase A (Kelas 1 - 2)',
    description: 'Gabungan rombel tingkat 1 dan 2',
    classes: ['Kelas 1A', 'Kelas 1B', 'Kelas 1C', 'Kelas 1D', 'Kelas 2A', 'Kelas 2B', 'Kelas 2C', 'Kelas 2D', 'Kelas 1', 'Kelas 2'],
    category: 'FASE',
  },
  {
    id: 'PRESET-FASE-B',
    name: 'Fase B (Kelas 3 - 4)',
    description: 'Gabungan rombel tingkat 3 dan 4',
    classes: ['Kelas 3A', 'Kelas 3B', 'Kelas 3C', 'Kelas 3D', 'Kelas 4A', 'Kelas 4B', 'Kelas 4C', 'Kelas 4D', 'Kelas 3', 'Kelas 4'],
    category: 'FASE',
  },
  {
    id: 'PRESET-FASE-C',
    name: 'Fase C (Kelas 5 - 6)',
    description: 'Gabungan rombel tingkat 5 dan 6',
    classes: ['Kelas 5A', 'Kelas 5B', 'Kelas 5C', 'Kelas 5D', 'Kelas 6A', 'Kelas 6B', 'Kelas 6C', 'Kelas 6D', 'Kelas 5', 'Kelas 6'],
    category: 'FASE',
  },
  {
    id: 'PRESET-PARALEL-1',
    name: 'Paralel Kelas 1',
    description: 'Semua rombel Kelas 1 (1A-1D)',
    classes: ['Kelas 1A', 'Kelas 1B', 'Kelas 1C', 'Kelas 1D', 'Kelas 1'],
    category: 'PARALEL',
  },
  {
    id: 'PRESET-PARALEL-2',
    name: 'Paralel Kelas 2',
    description: 'Semua rombel Kelas 2 (2A-2D)',
    classes: ['Kelas 2A', 'Kelas 2B', 'Kelas 2C', 'Kelas 2D', 'Kelas 2'],
    category: 'PARALEL',
  },
  {
    id: 'PRESET-PARALEL-3',
    name: 'Paralel Kelas 3',
    description: 'Semua rombel Kelas 3 (3A-3D)',
    classes: ['Kelas 3A', 'Kelas 3B', 'Kelas 3C', 'Kelas 3D', 'Kelas 3'],
    category: 'PARALEL',
  },
  {
    id: 'PRESET-PARALEL-4',
    name: 'Paralel Kelas 4',
    description: 'Semua rombel Kelas 4 (4A-4D)',
    classes: ['Kelas 4A', 'Kelas 4B', 'Kelas 4C', 'Kelas 4D', 'Kelas 4'],
    category: 'PARALEL',
  },
  {
    id: 'PRESET-PARALEL-5',
    name: 'Paralel Kelas 5',
    description: 'Semua rombel Kelas 5 (5A-5D)',
    classes: ['Kelas 5A', 'Kelas 5B', 'Kelas 5C', 'Kelas 5D', 'Kelas 5'],
    category: 'PARALEL',
  },
  {
    id: 'PRESET-PARALEL-6',
    name: 'Paralel Kelas 6',
    description: 'Semua rombel Kelas 6 (6A-6D)',
    classes: ['Kelas 6A', 'Kelas 6B', 'Kelas 6C', 'Kelas 6D', 'Kelas 6'],
    category: 'PARALEL',
  },
];

export interface ScanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  onSaveGoal: (newGoal: number, targetClass: string, targetClasses?: string[]) => void;
  onResetGoal: (targetClass: string) => void;
  currentClass: string;
  currentTargetClasses?: string[];
  sessionScanCount: number;
  // Optional scanner preferences
  defaultScannerMode?: 'ALL' | 'STUDENT' | 'ASSIGNMENT' | 'ASSET';
  onChangeDefaultScannerMode?: (mode: 'ALL' | 'STUDENT' | 'ASSIGNMENT' | 'ASSET') => void;
  smartAutoTrigger?: boolean;
  onToggleSmartAutoTrigger?: () => void;
  muteFeedback?: boolean;
  onToggleMuteFeedback?: () => void;
  cameraFacingMode?: 'environment' | 'user';
  onToggleCameraFacingMode?: () => void;
  // Battery Saver Mode Toggle
  isBatterySaverMode?: boolean;
  onToggleBatterySaverMode?: () => void;
  // Battery Alert Threshold Configuration
  batteryAlertThreshold?: number;
  onUpdateBatteryAlertThreshold?: (threshold: number) => void;
  currentBatteryLevel?: number | null;
  isBatteryCharging?: boolean;
  isLowBattery?: boolean;
  isLowBatterySimulated?: boolean;
  onToggleSimulateLowBattery?: () => void;
  onTestBatteryAlert?: () => void;
  // Quick Actions Toggle
  quickActionsEnabled?: boolean;
  onToggleQuickActions?: () => void;
  // Pause scan on inactivity
  pauseOnInactivity?: boolean;
  onTogglePauseOnInactivity?: () => void;
  inactivityTimeoutSeconds?: number;
  onChangeInactivityTimeoutSeconds?: (seconds: number) => void;
}

interface CustomBatteryTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  threshold: number;
}

const CustomBatteryTooltip: React.FC<CustomBatteryTooltipProps> = ({ active, payload, threshold }) => {
  if (active && payload && payload.length) {
    const data: BatteryHistoryPoint = payload[0].payload;
    const isCharging = data.charging;
    const isLow = data.level <= threshold;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-slate-200 text-xs min-w-[190px] space-y-1.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-mono font-bold text-slate-400 flex items-center gap-1">
            <Clock size={11} className="text-teal-400" />
            <span>{data.time} WIB</span>
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              isCharging
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isLow
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
            }`}
          >
            {isCharging ? '⚡ Mengisi' : isLow ? '⚠️ Low' : '🔋 Discharging'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Level Baterai:</span>
          <span
            className={`font-mono text-sm font-black ${
              isLow ? 'text-rose-400' : data.level > 50 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {data.level}%
          </span>
        </div>
        <div className="text-[10px] text-slate-300 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 space-y-0.5">
          <div className="font-bold text-white truncate">{data.activity}</div>
          <div className="text-slate-400">
            Laju: {data.charging ? '+10% / jam' : `-${data.drainRatePerHour || 6.5}% / jam`}
          </div>
        </div>
        {data.saverMode && (
          <div className="text-[9px] font-bold text-emerald-300 flex items-center gap-1">
            <Leaf size={10} className="fill-emerald-400 text-emerald-400" />
            <span>Mode Penghemat Baterai Aktif</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ScanSettingsModal: React.FC<ScanSettingsModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  onSaveGoal,
  onResetGoal,
  currentClass,
  currentTargetClasses,
  sessionScanCount,
  defaultScannerMode = 'ALL',
  onChangeDefaultScannerMode,
  smartAutoTrigger = false,
  onToggleSmartAutoTrigger,
  muteFeedback = false,
  onToggleMuteFeedback,
  cameraFacingMode = 'environment',
  onToggleCameraFacingMode,
  isBatterySaverMode = false,
  onToggleBatterySaverMode,
  batteryAlertThreshold = 20,
  onUpdateBatteryAlertThreshold,
  currentBatteryLevel = null,
  isBatteryCharging = false,
  isLowBattery = false,
  isLowBatterySimulated = false,
  onToggleSimulateLowBattery,
  onTestBatteryAlert,
  quickActionsEnabled = true,
  onToggleQuickActions,
  pauseOnInactivity,
  onTogglePauseOnInactivity,
  inactivityTimeoutSeconds,
  onChangeInactivityTimeoutSeconds,
}) => {
  // Custom dynamically added classes persisted in localStorage
  const [customClasses, setCustomClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sdn6_dynamic_classes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
        }
      }
    } catch {}
    return [];
  });

  const [newClassInput, setNewClassInput] = useState<string>('');
  const [newClassError, setNewClassError] = useState<string>('');
  const [isAddingClass, setIsAddingClass] = useState<boolean>(false);

  // Dynamic Search & Grade Tab Filter
  const [gradeFilter, setGradeFilter] = useState<'ALL' | '1' | '2' | '3' | '4' | '5' | '6' | 'CUSTOM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom Presets State persisted in localStorage
  const [customPresets, setCustomPresets] = useState<RombelPreset[]>(() => {
    try {
      const saved = localStorage.getItem('sdn6_multi_rombel_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  // Multi-Rombel Mode State: 'SINGLE' or 'MULTI'
  const [rombelMode, setRombelMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  // Selected classes: array of selected rombel codes
  const [selectedClasses, setSelectedClasses] = useState<string[]>(() => {
    if (currentTargetClasses && currentTargetClasses.length > 0) {
      return currentTargetClasses;
    }
    if (currentClass) {
      const parsed = currentClass.split(/[,+]/).map((s) => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return ['Kelas 1'];
  });

  const [selectedClass, setSelectedClass] = useState<string>(currentClass || 'Kelas 1');
  const [goalInput, setGoalInput] = useState<number | string>(currentGoal || 25);
  const [thresholdInput, setThresholdInput] = useState<number>(batteryAlertThreshold || 20);
  const [feedbackTestPlaying, setFeedbackTestPlaying] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Pause Scan on Inactivity State
  const [localPauseOnInactivity, setLocalPauseOnInactivity] = useState<boolean>(() => {
    if (pauseOnInactivity !== undefined) return pauseOnInactivity;
    try {
      const saved = localStorage.getItem('sdn6_pause_on_inactivity_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [localInactivityTimeoutSeconds, setLocalInactivityTimeoutSeconds] = useState<number>(() => {
    if (inactivityTimeoutSeconds !== undefined) return inactivityTimeoutSeconds;
    try {
      const saved = localStorage.getItem('sdn6_inactivity_timeout_seconds');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 10 && num <= 300) return num;
      }
    } catch {}
    return 30;
  });

  // Explicit Input Validation States
  const [classError, setClassError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Battery History State & Active View
  const [batteryHistory, setBatteryHistory] = useState<BatteryHistoryPoint[]>(() => {
    try {
      const saved = localStorage.getItem('sdn6_battery_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getDefaultSchoolDayBatteryHistory(currentBatteryLevel, isBatteryCharging, isBatterySaverMode);
  });

  const [batteryHistoryTab, setBatteryHistoryTab] = useState<'CHART' | 'TIPS' | 'LOG'>('CHART');
  const [snapshotFeedbackNotice, setSnapshotFeedbackNotice] = useState<string | null>(null);

  const effectiveCurrentLevel = useMemo(() => {
    return currentBatteryLevel !== null && currentBatteryLevel !== undefined
      ? Math.round(currentBatteryLevel * 100)
      : 85;
  }, [currentBatteryLevel]);

  // Handle logging a live snapshot point into history
  const handleLogBatterySnapshot = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newPoint: BatteryHistoryPoint = {
      id: `BATT-LOG-${Date.now()}`,
      time: timeStr,
      timestamp: Date.now(),
      level: effectiveCurrentLevel,
      charging: !!isBatteryCharging,
      saverMode: !!isBatterySaverMode,
      activity: `Sesi Scan Aktif (${selectedClass || 'SDN 6'})`,
      drainRatePerHour: isBatteryCharging ? -12.0 : isBatterySaverMode ? 3.5 : 7.2,
      note: isBatterySaverMode ? 'Mode Eco Aktif (1 FPS)' : 'Mode Standar (60 FPS)',
    };

    const updated = [...batteryHistory, newPoint].slice(-16);
    setBatteryHistory(updated);
    try {
      localStorage.setItem('sdn6_battery_history_v2', JSON.stringify(updated));
    } catch {}
    setSnapshotFeedbackNotice(`Titik baterai ${effectiveCurrentLevel}% (${timeStr}) berhasil dicatat!`);
    playFeedback('success');
    setTimeout(() => setSnapshotFeedbackNotice(null), 3200);
  };

  // Reset battery history to standard profile
  const handleResetBatteryHistory = () => {
    const defaultPoints = getDefaultSchoolDayBatteryHistory(currentBatteryLevel, isBatteryCharging, isBatterySaverMode);
    setBatteryHistory(defaultPoints);
    try {
      localStorage.setItem('sdn6_battery_history_v2', JSON.stringify(defaultPoints));
    } catch {}
    setSnapshotFeedbackNotice('Riwayat baterai di-reset ke profil standar jam sekolah.');
    playFeedback('click');
    setTimeout(() => setSnapshotFeedbackNotice(null), 3200);
  };

  // Metrics derived from battery history
  const batteryStats = useMemo(() => {
    const dischargingPoints = batteryHistory.filter((p) => !p.charging && p.drainRatePerHour > 0);
    const avgDrain = dischargingPoints.length > 0
      ? dischargingPoints.reduce((acc, p) => acc + p.drainRatePerHour, 0) / dischargingPoints.length
      : isBatterySaverMode ? 3.5 : 7.2;

    let peakPoint = batteryHistory[0];
    batteryHistory.forEach((p) => {
      if (!p.charging && p.drainRatePerHour > (peakPoint?.drainRatePerHour || 0)) {
        peakPoint = p;
      }
    });

    const activeDrainRate = isBatterySaverMode ? Math.min(avgDrain, 4.0) : avgDrain;
    const estimatedHours = effectiveCurrentLevel > 0
      ? (effectiveCurrentLevel / Math.max(1, activeDrainRate)).toFixed(1)
      : '0.0';

    return {
      averageDrainRate: activeDrainRate.toFixed(1),
      peakActivity: peakPoint?.activity || 'Scan Presensi QR Masuk',
      peakDrainRate: peakPoint?.drainRatePerHour?.toFixed(1) || '14.0',
      peakTime: peakPoint?.time || '07:30',
      estimatedHours,
      estimatedMinutes: Math.round(parseFloat(estimatedHours) * 60),
    };
  }, [batteryHistory, effectiveCurrentLevel, isBatterySaverMode]);

  // Available classes list (combines standard classes, accounts classes, and custom dynamic classes)
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    try {
      accountService.getAvailableClasses().forEach((c) => {
        if (c && c.trim()) set.add(c.trim());
      });
    } catch {
      STANDARD_CLASSES.forEach((c) => set.add(c));
    }
    customClasses.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [customClasses]);

  // Sync with current props when opened
  useEffect(() => {
    if (isOpen) {
      let initClasses: string[] = [];
      if (currentTargetClasses && currentTargetClasses.length > 0) {
        initClasses = currentTargetClasses;
      } else if (currentClass) {
        initClasses = currentClass.split(/[,+]/).map((s) => s.trim()).filter(Boolean);
      }
      if (initClasses.length === 0) initClasses = ['Kelas 1'];

      setSelectedClasses(initClasses);
      setSelectedClass(initClasses[0] || 'Kelas 1');
      setRombelMode(initClasses.length > 1 ? 'MULTI' : 'SINGLE');
      setGoalInput(currentGoal || 25);
      setThresholdInput(batteryAlertThreshold ?? 20);
      setSaveSuccessNotice(false);
      setNewClassInput('');
      setNewClassError('');
      setIsAddingClass(false);
    }
  }, [isOpen, currentGoal, currentClass, currentTargetClasses, batteryAlertThreshold]);

  // Helper to get enrolled student count for a single class
  const getStudentCountForClass = (cls: string): number => {
    try {
      return accountService.getStudents(cls).length;
    } catch {
      return 0;
    }
  };

  // Calculate enrolled students in single selected class
  const classStudentCount = useMemo(() => {
    const count = getStudentCountForClass(selectedClass);
    return count > 0 ? count : 25;
  }, [selectedClass]);

  // Calculate combined enrolled students across all selected classes in Multi-Rombel mode
  const multiRombelStudentCount = useMemo(() => {
    if (selectedClasses.length === 0) return 0;
    try {
      const allStudents = accountService.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');
      const matched = allStudents.filter((s) => s.KELAS && selectedClasses.includes(s.KELAS));
      if (matched.length > 0) return matched.length;
    } catch {}
    // Fallback: sum of individual class counts
    const sum = selectedClasses.reduce((acc, c) => acc + getStudentCountForClass(c), 0);
    return sum > 0 ? sum : selectedClasses.length * 25;
  }, [selectedClasses]);

  // Active student count based on mode
  const activeStudentCount = rombelMode === 'MULTI' ? multiRombelStudentCount : classStudentCount;

  // Single class selector handler
  const handleSelectClass = (cls: string) => {
    if (!cls || !cls.trim()) {
      setClassError('Target kelas tidak boleh kosong. Harap pilih rombel yang valid.');
      playFeedback('error');
      return;
    }
    setClassError(null);
    setValidationAlert(null);
    setSelectedClass(cls);
    setSelectedClasses([cls]);
    try {
      const saved = localStorage.getItem(`sdn6_scan_goal_${cls}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setGoalInput(parsed);
          setGoalError(null);
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    const count = getStudentCountForClass(cls);
    setGoalInput(count > 0 ? count : 25);
    setGoalError(null);
  };

  // Toggle class in multi-rombel selection
  const handleToggleClassInMulti = (cls: string) => {
    playFeedback('click');
    setSelectedClasses((prev) => {
      let next: string[];
      if (prev.includes(cls)) {
        // Prevent deselecting all (keep at least one)
        if (prev.length <= 1) {
          setClassError('Minimal harus ada 1 rombel terpilih. Target kelas tidak boleh kosong.');
          playFeedback('error');
          return prev;
        }
        next = prev.filter((c) => c !== cls);
      } else {
        next = [...prev, cls];
      }
      setClassError(null);
      setValidationAlert(null);
      setSelectedClass(next[0] || cls);
      return next;
    });
  };

  // Switch between Single and Multi Rombel modes
  const handleToggleRombelMode = (mode: 'SINGLE' | 'MULTI') => {
    playFeedback('click');
    setRombelMode(mode);
    setClassError(null);
    setValidationAlert(null);
    if (mode === 'SINGLE') {
      const first = selectedClasses[0] || selectedClass || 'Kelas 1';
      setSelectedClass(first);
      setSelectedClasses([first]);
      const count = getStudentCountForClass(first);
      setGoalInput(count > 0 ? count : 25);
      setGoalError(null);
    } else {
      // MULTI mode: auto update goal to combined student count if goal was equal to single class
      if (selectedClasses.length <= 1) {
        // Suggest nearby class or keep current
        setSelectedClasses([selectedClass]);
      }
    }
  };

  // All combined presets (defaults + custom created)
  const allPresets = useMemo(() => {
    return [...DEFAULT_ROMBEL_PRESETS, ...customPresets];
  }, [customPresets]);

  // Filtered available classes based on grade tab filter and real-time search query
  const filteredAvailableClasses = useMemo(() => {
    let list = availableClasses;
    if (gradeFilter !== 'ALL') {
      if (gradeFilter === 'CUSTOM') {
        list = list.filter((c) => customClasses.includes(c) || !/Kelas [1-6]/i.test(c));
      } else {
        list = list.filter((c) => new RegExp(`Kelas\\s*${gradeFilter}`, 'i').test(c));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.toLowerCase().includes(q));
    }
    return list;
  }, [availableClasses, gradeFilter, searchQuery, customClasses]);

  // Apply a Multi-Rombel preset
  const handleApplyPreset = (preset: RombelPreset) => {
    playFeedback('success');
    let targetList: string[] = [];
    if (preset.category === 'SCHOOL' || preset.classes.length === 0) {
      targetList = [...availableClasses];
    } else {
      // Find intersection with available classes or use preset list
      targetList = availableClasses.filter((c) => preset.classes.includes(c));
      if (targetList.length === 0) {
        targetList = preset.classes;
      }
    }

    if (targetList.length === 0) targetList = ['Kelas 1'];

    setRombelMode('MULTI');
    setSelectedClasses(targetList);
    setSelectedClass(targetList[0] || 'Kelas 1');
    setClassError(null);
    setValidationAlert(null);

    // Calculate sum of students in this preset
    const sum = targetList.reduce((acc, c) => acc + getStudentCountForClass(c), 0);
    const goalVal = sum > 0 ? sum : targetList.length * 25;
    setGoalInput(goalVal);
    setGoalError(null);

    setPresetNotice(`Preset "${preset.name}" diterapkan (${targetList.length} Rombel, Goal: ${goalVal})`);
    setTimeout(() => setPresetNotice(null), 3000);
  };

  // Save current selected classes as a custom preset
  const handleSaveCustomPreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      setNewClassError('Nama grup/preset tidak boleh kosong.');
      playFeedback('error');
      return;
    }

    if (selectedClasses.length === 0) {
      setClassError('Minimal pilih 1 rombel sebelum menyimpan preset.');
      playFeedback('error');
      return;
    }

    const newPreset: RombelPreset = {
      id: `PRESET-CUST-${Date.now()}`,
      name: trimmed,
      classes: [...selectedClasses],
      description: `Grup ${selectedClasses.length} rombel (${selectedClasses.join(', ')})`,
      category: 'CUSTOM',
      isCustom: true,
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('sdn6_multi_rombel_presets_v2', JSON.stringify(updated));
    } catch {}

    setNewPresetName('');
    setIsSavingPreset(false);
    setPresetNotice(`Grup preset "${trimmed}" berhasil disimpan!`);
    playFeedback('success');
    setTimeout(() => setPresetNotice(null), 3000);
  };

  // Delete a custom preset
  const handleDeleteCustomPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(updated);
    try {
      localStorage.setItem('sdn6_multi_rombel_presets_v2', JSON.stringify(updated));
    } catch {}
    playFeedback('click');
  };

  // Batch actions on currently filtered classes
  const handleSelectFilteredClasses = () => {
    playFeedback('click');
    setSelectedClasses((prev) => {
      const set = new Set([...prev, ...filteredAvailableClasses]);
      const next = Array.from(set);
      setClassError(null);
      setValidationAlert(null);
      return next;
    });
  };

  const handleDeselectFilteredClasses = () => {
    playFeedback('click');
    setSelectedClasses((prev) => {
      const next = prev.filter((c) => !filteredAvailableClasses.includes(c));
      if (next.length === 0) {
        // Retain at least one class
        const fallback = availableClasses[0] || 'Kelas 1';
        return [fallback];
      }
      setClassError(null);
      setValidationAlert(null);
      return next;
    });
  };

  const handleInvertFilteredClasses = () => {
    playFeedback('click');
    setSelectedClasses((prev) => {
      const next: string[] = [];
      // Keep selected items that are not in filtered
      prev.forEach((c) => {
        if (!filteredAvailableClasses.includes(c)) next.push(c);
      });
      // Add items from filtered that were not selected
      filteredAvailableClasses.forEach((c) => {
        if (!prev.includes(c)) next.push(c);
      });
      if (next.length === 0) {
        return [availableClasses[0] || 'Kelas 1'];
      }
      setClassError(null);
      setValidationAlert(null);
      return next;
    });
  };

  // Multi-rombel quick selection presets
  const handleSelectAllClasses = () => {
    playFeedback('click');
    setSelectedClasses([...availableClasses]);
    setClassError(null);
    setValidationAlert(null);
  };

  const handleSelectLowerGrade = () => {
    playFeedback('click');
    const lower = availableClasses.filter((c) => /Kelas [1-3]/i.test(c));
    if (lower.length > 0) {
      setSelectedClasses(lower);
      setClassError(null);
      setValidationAlert(null);
    }
  };

  const handleSelectUpperGrade = () => {
    playFeedback('click');
    const upper = availableClasses.filter((c) => /Kelas [4-6]/i.test(c));
    if (upper.length > 0) {
      setSelectedClasses(upper);
      setClassError(null);
      setValidationAlert(null);
    }
  };

  // Dynamic Class Creation Handler
  const handleAddNewClass = (classNameToAdd?: string) => {
    const raw = (classNameToAdd !== undefined ? classNameToAdd : newClassInput).trim();
    if (!raw || raw.length === 0) {
      setNewClassError('Target kelas tidak boleh kosong. Harap masukkan nama kelas atau rombel yang valid.');
      playFeedback('error');
      return;
    }

    // Format clean name: e.g. "3B" -> "Kelas 3B", "6-A" -> "Kelas 6A", or custom "Rombel Inklusi"
    let formatted = raw;
    if (/^[1-6][\s\-_]?[A-Za-z]?$/i.test(raw)) {
      const cleanNum = raw.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
      formatted = `Kelas ${cleanNum}`;
    }

    // Check duplicate
    if (availableClasses.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
      setNewClassError(`Target kelas "${formatted}" sudah ada dalam daftar.`);
      playFeedback('error');
      return;
    }

    const updated = [...customClasses, formatted];
    setCustomClasses(updated);
    try {
      localStorage.setItem('sdn6_dynamic_classes_v1', JSON.stringify(updated));
    } catch {}

    setNewClassInput('');
    setNewClassError('');
    setClassError(null);
    setValidationAlert(null);
    setIsAddingClass(false);
    playFeedback('success');

    // Automatically select the newly created class
    if (rombelMode === 'MULTI') {
      setSelectedClasses((prev) => [...prev, formatted]);
      setSelectedClass(formatted);
    } else {
      setSelectedClass(formatted);
      setSelectedClasses([formatted]);
      setGoalInput(25);
      setGoalError(null);
    }
  };

  // Dynamic Class Deletion Handler
  const handleDeleteCustomClass = (clsToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customClasses.filter((c) => c !== clsToDelete);
    setCustomClasses(updated);
    try {
      localStorage.setItem('sdn6_dynamic_classes_v1', JSON.stringify(updated));
    } catch {}

    // Adjust selected class if the deleted one was selected
    if (selectedClass === clsToDelete) {
      const fallback = availableClasses.find((c) => c !== clsToDelete) || 'Kelas 1';
      setSelectedClass(fallback);
    }
    setSelectedClasses((prev) => {
      const filtered = prev.filter((c) => c !== clsToDelete);
      return filtered.length > 0 ? filtered : [availableClasses.find((c) => c !== clsToDelete) || 'Kelas 1'];
    });
    setClassError(null);
    playFeedback('click');
  };

  // Resolved safe numeric goal
  const numericGoal = useMemo(() => {
    const parsed = typeof goalInput === 'string' ? parseInt(goalInput, 10) : goalInput;
    return isNaN(parsed) || parsed < 1 ? 0 : parsed;
  }, [goalInput]);

  // Stepper adjustments with non-negative validation
  const adjustGoal = (delta: number) => {
    const current = typeof goalInput === 'string' ? parseInt(goalInput, 10) : goalInput;
    const base = isNaN(current) ? 25 : current;
    const nextVal = base + delta;

    if (nextVal < 1) {
      setGoalInput(1);
      setGoalError('Target scan goal tidak boleh bernilai negatif atau nol. Nilai minimal adalah 1.');
      playFeedback('error');
      return;
    }

    playFeedback('click');
    setGoalInput(Math.min(250, nextVal));
    setGoalError(null);
    setValidationAlert(null);
  };

  // Input change handler with strict negative & empty validation
  const handleGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setGoalInput(rawVal);
    setValidationAlert(null);

    if (rawVal.trim() === '') {
      setGoalError('Target scan goal tidak boleh kosong. Masukkan angka minimal 1.');
      return;
    }

    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed)) {
      setGoalError('Target scan goal harus berupa angka bulat.');
    } else if (parsed < 0) {
      setGoalError('Angka goal scan tidak boleh bernilai negatif! Nilai target pemindaian minimal 1.');
      playFeedback('error');
    } else if (parsed === 0) {
      setGoalError('Angka goal scan tidak boleh 0 (minimal 1 siswa/scan).');
    } else if (parsed > 250) {
      setGoalError('Angka goal scan maksimal 250 untuk kapasitas kelas.');
    } else {
      setGoalError(null);
    }
  };

  // Quick preset selection
  const setQuickGoal = (val: number) => {
    playFeedback('click');
    setGoalInput(val);
    setGoalError(null);
    setValidationAlert(null);
  };

  // Match class student count directly (works for single & multi-rombel)
  const handleApplyClassStudentCount = () => {
    playFeedback('click');
    if (activeStudentCount > 0) {
      setGoalInput(activeStudentCount);
      setGoalError(null);
      setValidationAlert(null);
    }
  };

  // Calculate progress preview
  const progressPct = useMemo(() => {
    if (numericGoal <= 0) return 0;
    return Math.min(100, Math.round((sessionScanCount / numericGoal) * 100));
  }, [sessionScanCount, numericGoal]);

  const isGoalReached = numericGoal > 0 && sessionScanCount >= numericGoal;
  const remainingCount = numericGoal > 0 ? Math.max(0, numericGoal - sessionScanCount) : 0;

  // Inactivity pause toggle & timeout handlers
  const handleToggleInactivityPause = () => {
    playFeedback('click');
    const nextVal = !localPauseOnInactivity;
    setLocalPauseOnInactivity(nextVal);
    if (onTogglePauseOnInactivity) {
      onTogglePauseOnInactivity();
    }
    try {
      localStorage.setItem('sdn6_pause_on_inactivity_enabled', nextVal ? 'true' : 'false');
    } catch {}
  };

  const handleSetInactivityTimeout = (sec: number) => {
    playFeedback('click');
    setLocalInactivityTimeoutSeconds(sec);
    if (onChangeInactivityTimeoutSeconds) {
      onChangeInactivityTimeoutSeconds(sec);
    }
    try {
      localStorage.setItem('sdn6_inactivity_timeout_seconds', sec.toString());
    } catch {}
  };

  // Quick Presets: adaptive to single or multi-rombel
  const presets = useMemo(() => {
    if (rombelMode === 'MULTI' && selectedClasses.length > 1) {
      return [25, 30, 40, 50, 60, 75, 90, 120];
    }
    return [15, 20, 25, 28, 30, 32, 35, 40];
  }, [rombelMode, selectedClasses.length]);

  // Quick presets for battery threshold
  const batteryPresets = [10, 15, 20, 25, 30, 40];

  const adjustThreshold = (delta: number) => {
    playFeedback('click');
    setThresholdInput((prev) => Math.max(5, Math.min(80, prev + delta)));
  };

  const setQuickThreshold = (val: number) => {
    playFeedback('click');
    setThresholdInput(val);
  };

  const handleSave = () => {
    let hasError = false;

    // 1. VALIDATION: Target Class must not be empty
    const activeTargetClasses = rombelMode === 'MULTI'
      ? selectedClasses.map((c) => (c ? c.trim() : '')).filter(Boolean)
      : [selectedClass ? selectedClass.trim() : ''].filter(Boolean);

    if (activeTargetClasses.length === 0 || !activeTargetClasses[0]) {
      setClassError('Target kelas tidak boleh kosong. Harap pilih minimal satu rombel atau buat rombel baru.');
      setValidationAlert('Gagal menyimpan: Target kelas pemindaian tidak boleh kosong!');
      hasError = true;
    }

    // 2. VALIDATION: Goal Scan must not be negative, zero, empty, or NaN
    const rawGoalNum = typeof goalInput === 'string' ? parseFloat(goalInput) : goalInput;
    if (typeof goalInput === 'string' && goalInput.trim() === '') {
      setGoalError('Target scan goal tidak boleh kosong.');
      setValidationAlert('Gagal menyimpan: Angka target goal scan tidak boleh kosong!');
      hasError = true;
    } else if (isNaN(rawGoalNum)) {
      setGoalError('Target scan goal harus berupa angka bulat.');
      setValidationAlert('Gagal menyimpan: Format angka goal scan tidak valid.');
      hasError = true;
    } else if (rawGoalNum < 0) {
      setGoalError('Angka goal scan tidak boleh bernilai negatif! Nilai target pemindaian minimal 1.');
      setValidationAlert('Gagal menyimpan: Angka goal scan tidak boleh bernilai negatif!');
      hasError = true;
    } else if (rawGoalNum === 0) {
      setGoalError('Angka goal scan tidak boleh 0 (minimal 1 siswa/scan).');
      setValidationAlert('Gagal menyimpan: Angka goal scan tidak boleh 0!');
      hasError = true;
    } else if (rawGoalNum > 250) {
      setGoalError('Angka goal scan maksimal 250 untuk kapasitas kelas.');
      setValidationAlert('Gagal menyimpan: Angka goal scan melebihi batas maksimal (250).');
      hasError = true;
    }

    if (hasError) {
      playFeedback('error');
      return;
    }

    // All validation passed
    const validGoal = Math.max(1, Math.min(250, Math.round(rawGoalNum)));
    const targetClassString = rombelMode === 'MULTI'
      ? activeTargetClasses.join(' + ')
      : activeTargetClasses[0];

    onSaveGoal(validGoal, targetClassString, activeTargetClasses);

    if (onUpdateBatteryAlertThreshold) {
      const validThreshold = Math.max(5, Math.min(80, Math.round(thresholdInput)));
      onUpdateBatteryAlertThreshold(validThreshold);
    }

    try {
      localStorage.setItem('sdn6_pause_on_inactivity_enabled', localPauseOnInactivity ? 'true' : 'false');
      localStorage.setItem('sdn6_inactivity_timeout_seconds', localInactivityTimeoutSeconds.toString());
      localStorage.setItem(`sdn6_scan_goal_${targetClassString}`, validGoal.toString());
      localStorage.setItem('sdn6_scan_target_classes', JSON.stringify(activeTargetClasses));
      localStorage.setItem('sdn6_custom_target_class', targetClassString);
    } catch (e) {
      console.warn(e);
    }

    setSaveSuccessNotice(true);
    playFeedback('success');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleReset = () => {
    const targetClassString = rombelMode === 'MULTI' ? selectedClasses.join(' + ') : selectedClass;
    onResetGoal(targetClassString);
    const count = activeStudentCount > 0 ? activeStudentCount : 25;
    setGoalInput(count);
    setGoalError(null);
    setClassError(null);
    setValidationAlert(null);
    setThresholdInput(20);
    if (onUpdateBatteryAlertThreshold) {
      onUpdateBatteryAlertThreshold(20);
    }
    playFeedback('click');
  };

  const handleTestChime = () => {
    setFeedbackTestPlaying(true);
    playFeedback('success');
    setTimeout(() => setFeedbackTestPlaying(false), 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* MODAL HEADER */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Target size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Pengaturan Scan Goal</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Target Absensi
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tetapkan target pemindaian QR sesuai kuota siswa per kelas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Pengaturan"
            >
              <X size={18} />
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-200">
            {/* VALIDATION ALERT BANNER */}
            {validationAlert && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-between gap-2.5 text-xs text-rose-200 font-bold shadow-md shadow-rose-950/40"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>{validationAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationAlert(null)}
                  className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-500/20 transition cursor-pointer"
                  title="Tutup pesan peringatan"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}

            {/* SUCCESS BANNER */}
            {saveSuccessNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200 font-bold"
              >
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Pengaturan Scan Goal berhasil disimpan! Memperbarui sesi...</span>
              </motion.div>
            )}

            {/* CLASS TARGET SELECTOR & DYNAMIC ROMBEL MANAGEMENT */}
            <div className={`p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border space-y-3 transition-colors ${
              classError ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-slate-800'
            }`}>
              {/* CLASS VALIDATION ERROR */}
              {classError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2"
                >
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span>{classError}</span>
                </motion.div>
              )}

              {/* HEADER WITH MODE SWITCHER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                    <School size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Target Rombel Pemindaian</span>
                      {rombelMode === 'MULTI' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                          Multi-Rombel ({selectedClasses.length})
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Kelola dan pilih satu atau gabungan rombel dalam sesi scan
                    </p>
                  </div>
                </div>

                {/* MODE TOGGLE BUTTONS */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleRombelMode('SINGLE')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      rombelMode === 'SINGLE'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Pilih satu rombel target pemindaian"
                  >
                    <Users size={12} />
                    <span>1 Rombel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRombelMode('MULTI')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      rombelMode === 'MULTI'
                        ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Pilih lebih dari satu rombel target secara bersamaan"
                  >
                    <Layers size={12} />
                    <span>Multi-Rombel</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC ROMBEL CREATOR BAR */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                  <Users size={12} />
                  <span>
                    {rombelMode === 'MULTI'
                      ? `${activeStudentCount} Total Siswa (${selectedClasses.length} Rombel Terpilih)`
                      : `${activeStudentCount} Siswa Terdaftar di ${selectedClass}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playFeedback('click');
                    setIsAddingClass(!isAddingClass);
                    setNewClassError('');
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    isAddingClass
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/40 shadow-xs'
                  }`}
                  title="Tambahkan rombel kelas baru secara dinamis"
                >
                  <FolderPlus size={13} className={isAddingClass ? '' : 'text-teal-400'} />
                  <span>{isAddingClass ? 'Tutup Form' : '+ Tambah Rombel'}</span>
                </button>
              </div>

              {/* EXPANDABLE DYNAMIC CLASS INPUT FORM */}
              <AnimatePresence>
                {isAddingClass && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-slate-900 border border-teal-500/30 space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                        <BookmarkPlus size={14} />
                        <span>Tambah Target Rombel / Kelas Baru:</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Disimpan otomatis ke sesi & perangkat
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={newClassInput}
                          onChange={(e) => {
                            setNewClassInput(e.target.value);
                            if (newClassError) setNewClassError('');
                            if (classError) setClassError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewClass();
                            }
                          }}
                          placeholder="Ketik target rombel baru (misal: Kelas 3B, 5A, Inklusi, dll)"
                          className={`w-full text-xs bg-slate-950 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition ${
                            newClassError
                              ? 'border-2 border-rose-500 ring-2 ring-rose-500/20'
                              : 'border border-slate-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                          }`}
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddNewClass()}
                        disabled={!newClassInput.trim()}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!newClassInput.trim() ? 'Nama rombel tidak boleh kosong' : 'Simpan target rombel'}
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Simpan</span>
                      </button>
                    </div>

                    {/* QUICK SUGGESTION SHORTCUTS */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Tag size={11} className="text-teal-400" />
                        <span>Pintasan Rombel Cepat:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Kelas 1A',
                          'Kelas 1B',
                          'Kelas 2A',
                          'Kelas 2B',
                          'Kelas 3A',
                          'Kelas 3B',
                          'Kelas 4A',
                          'Kelas 4B',
                          'Kelas 5A',
                          'Kelas 5B',
                          'Kelas 6A',
                          'Kelas 6B',
                          'Kelas Inklusi',
                        ].map((sug) => {
                          const alreadyExists = availableClasses.some(
                            (c) => c.toLowerCase() === sug.toLowerCase()
                          );
                          if (alreadyExists) return null;
                          return (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleAddNewClass(sug)}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-teal-900/50 text-slate-300 hover:text-teal-200 border border-slate-700/80 hover:border-teal-500/40 transition cursor-pointer flex items-center gap-0.5"
                            >
                              <span>+</span>
                              <span>{sug.replace('Kelas ', '')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {newClassError && (
                      <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{newClassError}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MULTI-ROMBEL PRESETS & MANAGER */}
              {rombelMode === 'MULTI' && (
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
                  {/* PRESET NOTICE */}
                  {presetNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                      <span>{presetNotice}</span>
                    </motion.div>
                  )}

                  {/* PRESET SELECTOR & HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Bookmark size={13} className="text-indigo-400" />
                      <span className="text-[11px] font-bold text-white">Preset & Grup Multi-Rombel:</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playFeedback('click');
                        setIsSavingPreset(!isSavingPreset);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition cursor-pointer flex items-center gap-1"
                    >
                      <Save size={11} />
                      <span>{isSavingPreset ? 'Tutup' : '+ Simpan Pilihan Sebagai Preset'}</span>
                    </button>
                  </div>

                  {/* SAVE CUSTOM PRESET INLINE FORM */}
                  <AnimatePresence>
                    {isSavingPreset && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-2 overflow-hidden"
                      >
                        <div className="text-[10px] text-slate-300">
                          Beri nama untuk menyimpan kombinasi <strong>{selectedClasses.length} rombel</strong> saat ini:
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomPreset();
                              }
                            }}
                            placeholder="Contoh: Paralel Kelas 1 (1A-1D) / Ekskul Robotik / dll"
                            className="flex-1 text-xs bg-slate-900 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 border border-slate-700 focus:border-indigo-400 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomPreset}
                            disabled={!newPresetName.trim()}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            <Check size={13} className="stroke-[3]" />
                            <span>Simpan</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* PRESET CHIPS LIST */}
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {allPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="group flex items-center rounded-lg border bg-slate-950/70 hover:bg-indigo-950/60 border-slate-800 hover:border-indigo-500/50 transition overflow-hidden text-[10px]"
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-2 py-1 font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          title={preset.description || preset.name}
                        >
                          <Layers size={10} className="text-indigo-400 shrink-0" />
                          <span>{preset.name}</span>
                        </button>
                        {preset.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                            className="px-1.5 py-1 text-slate-500 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                            title={`Hapus preset "${preset.name}"`}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEARCH & GRADE FILTER TABS */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* GRADE FILTER PILLS */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: '1', label: 'Kls 1' },
                      { id: '2', label: 'Kls 2' },
                      { id: '3', label: 'Kls 3' },
                      { id: '4', label: 'Kls 4' },
                      { id: '5', label: 'Kls 5' },
                      { id: '6', label: 'Kls 6' },
                      { id: 'CUSTOM', label: 'Kustom' },
                    ].map((tab) => {
                      const isAct = gradeFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            playFeedback('click');
                            setGradeFilter(tab.id as any);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition cursor-pointer border ${
                            isAct
                              ? 'bg-teal-500 text-white border-teal-400 shadow-xs'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* REAL-TIME SEARCH BOX */}
                  <div className="relative min-w-[130px]">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari rombel..."
                      className="w-full text-[11px] bg-slate-950 rounded-xl pl-7 pr-6 py-1 text-slate-200 placeholder-slate-500 border border-slate-800 focus:border-teal-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* BATCH ACTION SHORTCUTS (FOR MULTI MODE) */}
                {rombelMode === 'MULTI' && (
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] pt-1">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Filter size={11} className="text-teal-400" />
                      <span>Hasil Filter ({filteredAvailableClasses.length} Rombel):</span>
                    </span>

                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={handleSelectFilteredClasses}
                        className="px-2 py-0.5 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold transition cursor-pointer flex items-center gap-0.5"
                      >
                        <CheckSquare size={10} />
                        <span>Pilih Semua</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectFilteredClasses}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold transition cursor-pointer flex items-center gap-0.5"
                      >
                        <Square size={10} />
                        <span>Lepas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleInvertFilteredClasses}
                        className="px-2 py-0.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold transition cursor-pointer"
                      >
                        Invert
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CLASS CHIPS GRID */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>
                    {rombelMode === 'MULTI'
                      ? 'Klik rombel untuk menambah/mengurangi target sesi scan:'
                      : 'Pilih rombel target scan sesi ini:'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {filteredAvailableClasses.length} dari {availableClasses.length} Rombel
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {filteredAvailableClasses.map((cls) => {
                    const isSelected =
                      rombelMode === 'MULTI'
                        ? selectedClasses.includes(cls)
                        : selectedClass === cls;
                    const isCustom = customClasses.includes(cls);
                    const stuCount = getStudentCountForClass(cls);

                    return (
                      <div
                        key={cls}
                        className={`group relative text-xs rounded-xl font-bold transition flex items-center gap-1.5 border overflow-hidden cursor-pointer ${
                          isSelected
                            ? rombelMode === 'MULTI'
                              ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white border-teal-400 shadow-md shadow-indigo-600/20'
                              : 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                        }`}
                        onClick={() => {
                          if (rombelMode === 'MULTI') {
                            handleToggleClassInMulti(cls);
                          } else {
                            handleSelectClass(cls);
                          }
                        }}
                      >
                        <div className="py-1.5 pl-2.5 flex items-center gap-1.5">
                          <span>{cls}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-black/30 text-white'
                                : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            {stuCount > 0 ? stuCount : '-'}
                          </span>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>

                        {/* DELETE BUTTON FOR DYNAMICALLY ADDED CLASSES */}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomClass(cls, e)}
                            className="py-1.5 pr-2 pl-1 text-rose-300/70 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                            title={`Hapus rombel kustom "${cls}"`}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredAvailableClasses.length === 0 && (
                    <div className="w-full text-center py-4 text-xs text-slate-500">
                      Tidak ada rombel yang cocok dengan filter atau kata kunci pencarian.
                    </div>
                  )}
                </div>
              </div>

              {/* MULTI-ROMBEL ACTIVE SELECTED BREAKDOWN CARD */}
              {rombelMode === 'MULTI' && selectedClasses.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Layers size={14} className="text-teal-400" />
                      <span>Rombel Terpilih Sesi Scan ({selectedClasses.length}):</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {multiRombelStudentCount} Total Siswa
                    </span>
                  </div>

                  {/* REMOVABLE CHIPS */}
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {selectedClasses.map((cls) => {
                      const count = getStudentCountForClass(cls);
                      return (
                        <div
                          key={cls}
                          className="px-2 py-0.5 rounded-lg bg-teal-950/80 border border-teal-500/50 text-teal-200 text-[10px] font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <span>{cls}</span>
                          <span className="text-[9px] font-mono text-teal-400">({count > 0 ? count : 25})</span>
                          <button
                            type="button"
                            onClick={() => handleToggleClassInMulti(cls)}
                            className="text-teal-400 hover:text-rose-300 transition cursor-pointer p-0.5"
                            title={`Keluarkan "${cls}" dari sesi scan`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* QUICK SYNC GOAL BUTTON */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">
                      Sesi scan akan memvalidasi kehadiran seluruh siswa dari {selectedClasses.length} rombel di atas.
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyClassStudentCount}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Sparkles size={11} />
                      <span>Set Goal = {multiRombelStudentCount}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN SCAN GOAL INPUT & CONTROLS */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-900 border border-emerald-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Target size={15} className="text-emerald-400" />
                    <span>Target Jumlah Pemindaian (Scan Goal):</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {rombelMode === 'MULTI'
                      ? `Target pemindaian gabungan ${selectedClasses.length} rombel target`
                      : 'Target siswa hadir yang harus dipindai pada sesi ini'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApplyClassStudentCount}
                  disabled={activeStudentCount <= 0}
                  className="px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Klik untuk menyamakan target dengan kuota total siswa pada rombel yang dipilih"
                >
                  <Sparkles size={12} className="text-teal-300" />
                  <span>
                    {rombelMode === 'MULTI'
                      ? `Setara Siswa (${activeStudentCount})`
                      : `Setara Siswa (${classStudentCount})`}
                  </span>
                </button>
              </div>

              {/* STEPPER & NUMERIC DISPLAY */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                <button
                  type="button"
                  onClick={() => adjustGoal(-5)}
                  disabled={numericGoal <= 1}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Kurang 5 (Minimal 1)"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => adjustGoal(-1)}
                  disabled={numericGoal <= 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Kurang 1 (Minimal 1)"
                >
                  <Minus size={16} />
                </button>

                {/* NUMBER INPUT */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="number"
                      min={1}
                      max={250}
                      value={goalInput}
                      onChange={handleGoalInputChange}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                          setGoalError('Angka goal scan tidak boleh bernilai negatif!');
                          playFeedback('error');
                        }
                      }}
                      className={`w-24 sm:w-28 text-center text-2xl sm:text-3xl font-black font-mono rounded-2xl py-2 px-1 focus:outline-none transition shadow-inner border-2 ${
                        goalError
                          ? 'border-rose-500 bg-rose-950/30 text-rose-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20'
                          : 'border-emerald-500/50 bg-slate-950 text-emerald-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20'
                      }`}
                    />
                    <span className="absolute -bottom-4 text-[9px] font-mono text-slate-500 font-bold uppercase">
                      Scan / Siswa
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => adjustGoal(1)}
                  disabled={numericGoal >= 250}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Tambah 1"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => adjustGoal(5)}
                  disabled={numericGoal >= 250}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Tambah 5"
                >
                  +5
                </button>
              </div>

              {/* GOAL ERROR NOTIFICATION */}
              {goalError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 text-center mt-2"
                >
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span>{goalError}</span>
                </motion.div>
              )}

              {/* QUICK PRESETS PILLS */}
              <div className="pt-2">
                <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Pilihan Cepat Target Absensi:</span>
                  <span className="text-[9px] text-slate-500">Standar Kelas SD: 20-36 Siswa</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuickGoal(p)}
                      className={`flex-1 min-w-[38px] text-[11px] py-1 px-1.5 rounded-lg font-bold font-mono transition text-center cursor-pointer border ${
                        goalInput === p
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* REAL-TIME SESSION PROGRESS PREVIEW */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ketercapaian Sesi Scan Saat Ini:</span>
                </div>
                <div className="font-mono font-bold text-xs flex items-center gap-1">
                  <span className="text-emerald-400">{sessionScanCount}</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-white">{goalInput} Goal</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 ml-1">
                    {progressPct}%
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoalReached
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 shadow-sm shadow-emerald-400'
                      : 'bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                {isGoalReached ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Target Sesi Terpenuhi 100%! Seluruh siswa telah terpindai.
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-400" />
                    Memerlukan <strong>{remainingCount}</strong> pemindaian lagi untuk mencapai target kelas.
                  </span>
                )}
                <span className="text-slate-500 font-mono">
                  {sessionScanCount} tercatat
                </span>
              </div>
            </div>

            {/* USER-CONFIGURABLE BATTERY ALERT THRESHOLD SECTION */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-900 border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <BatteryLow size={16} className="text-amber-400" />
                    <span>Ambang Batas Peringatan Baterai (Battery Alert):</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Batas persentase daya untuk memicu alarm audio peringatan guru
                  </div>
                </div>

                {/* Real-time Battery Status Badge */}
                <div className="flex items-center gap-1.5">
                  <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 ${
                    isBatteryCharging
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : isLowBattery || (currentBatteryLevel !== null && currentBatteryLevel <= thresholdInput / 100)
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}>
                    {isBatteryCharging ? (
                      <BatteryCharging size={13} className="text-emerald-400 animate-pulse" />
                    ) : isLowBattery || (currentBatteryLevel !== null && currentBatteryLevel <= thresholdInput / 100) ? (
                      <BatteryLow size={13} className="text-rose-400" />
                    ) : (
                      <Battery size={13} className="text-slate-300" />
                    )}
                    <span>{currentBatteryLevel !== null ? `${Math.round(currentBatteryLevel * 100)}%` : '85%'}</span>
                    {isBatteryCharging && <span className="text-[9px] text-emerald-400 font-sans">Mengisi</span>}
                  </div>
                </div>
              </div>

              {/* STEPPER & NUMERIC DISPLAY FOR BATTERY ALERT */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                <button
                  type="button"
                  onClick={() => adjustThreshold(-5)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                  title="Kurang 5%"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => adjustThreshold(-1)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Kurang 1%"
                >
                  <Minus size={16} />
                </button>

                {/* NUMBER INPUT */}
                <div className="relative flex items-center justify-center">
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={thresholdInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setThresholdInput(isNaN(val) ? 20 : Math.max(5, Math.min(80, val)));
                    }}
                    className="w-24 sm:w-28 text-center text-2xl sm:text-3xl font-black font-mono text-amber-400 bg-slate-950 border-2 border-amber-500/50 rounded-2xl py-2 px-1 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 transition shadow-inner"
                  />
                  <span className="absolute -bottom-4 text-[9px] font-mono text-amber-500/80 font-bold uppercase">
                    Persen (%)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustThreshold(1)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Tambah 1%"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => adjustThreshold(5)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                  title="Tambah 5%"
                >
                  +5%
                </button>
              </div>

              {/* QUICK PRESETS PILLS FOR BATTERY */}
              <div className="pt-2">
                <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Pilihan Cepat Batas Ambang Peringatan:</span>
                  <span className="text-[9px] text-amber-400/90 font-mono">Standar Rekomendasi: 15% - 25%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {batteryPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuickThreshold(val)}
                      className={`flex-1 min-w-[42px] text-[11px] py-1 px-1.5 rounded-lg font-bold font-mono transition text-center cursor-pointer border ${
                        thresholdInput === val
                          ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-xs shadow-amber-500/20'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* BATTERY THRESHOLD EXPLANATION & ACTION BUTTONS */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-300 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Jika baterai perangkat turun di bawah <strong>{thresholdInput}%</strong> saat tidak di-charge, sistem otomatis memicu <strong>alarm audio peringatan</strong> dan menampilkan <strong>toast notifikasi</strong> agar guru segera mencolokkan charger.
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
                  {onTestBatteryAlert && (
                    <button
                      type="button"
                      onClick={onTestBatteryAlert}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Uji coba nada alarm peringatan & toast notifikasi"
                    >
                      <BellRing size={12} className="text-amber-400" />
                      <span>Uji Alarm Audio Baterai</span>
                    </button>
                  )}

                  {onToggleSimulateLowBattery && (
                    <button
                      type="button"
                      onClick={onToggleSimulateLowBattery}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isLowBatterySimulated
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Simulasi baterai rendah untuk menguji respons sistem"
                    >
                      <Zap size={12} className={isLowBatterySimulated ? 'text-amber-200 fill-amber-200' : 'text-slate-400'} />
                      <span>{isLowBatterySimulated ? 'Simulasi Low-Bat: Aktif' : 'Simulasi Low-Bat: Nonaktif'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* BATTERY SAVER MODE CARD */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 space-y-3 ${
              isBatterySaverMode
                ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-500/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isBatterySaverMode
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isBatterySaverMode ? <Leaf size={18} className="fill-slate-950 stroke-[2.4]" /> : <ZapOff size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-white tracking-wide">
                        Mode Penghemat Baterai (Battery Saver Mode)
                      </h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider font-mono ${
                        isBatterySaverMode
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isBatterySaverMode ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Menghemat daya tahan baterai saat sesi pemindaian QR berlangsung dalam durasi panjang.
                    </p>
                  </div>
                </div>

                {/* Big Interactive Toggle Switch */}
                {onToggleBatterySaverMode && (
                  <button
                    type="button"
                    onClick={() => {
                      playFeedback('click');
                      onToggleBatterySaverMode();
                    }}
                    role="switch"
                    aria-checked={isBatterySaverMode}
                    className={`relative shrink-0 inline-flex h-7 w-13 rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isBatterySaverMode ? 'bg-emerald-500 shadow-md shadow-emerald-500/40' : 'bg-slate-700'
                    }`}
                    title={isBatterySaverMode ? 'Klik untuk mematikan Mode Penghemat Baterai' : 'Klik untuk menyalakan Mode Penghemat Baterai'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                        isBatterySaverMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    >
                      {isBatterySaverMode ? (
                        <Leaf size={13} className="text-emerald-700 fill-emerald-600" />
                      ) : (
                        <ZapOff size={12} className="text-slate-500" />
                      )}
                    </span>
                  </button>
                )}
              </div>

              {/* Feature Specifications & Technical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className={`p-2.5 rounded-xl border transition-colors ${
                  isBatterySaverMode
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-0.5 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Laju Bingkai (Frame Rate Throttling)</span>
                  </div>
                  <p className="leading-relaxed">
                    Frekuensi scan kamera dibatasi ke <strong>1 FPS (1 detik/frame)</strong> untuk menghemat pemrosesan CPU/GPU.
                  </p>
                </div>

                <div className={`p-2.5 rounded-xl border transition-colors ${
                  isBatterySaverMode
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-0.5 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Kecerahan Scanner (Display Dimming)</span>
                  </div>
                  <p className="leading-relaxed">
                    Kecerahan viewfinder kamera otomatis diturunkan menjadi <strong>65%</strong> untuk menghemat konsumsi layar.
                  </p>
                </div>
              </div>

              {/* Live Status Summary Banner */}
              <div className={`px-3 py-2 rounded-xl text-[11px] flex items-center justify-between gap-2 border ${
                isBatterySaverMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isBatterySaverMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span className="truncate">
                    {isBatterySaverMode
                      ? 'Konservasi daya aktif: Kecerahan 65% • Scanner 1 FPS • Senter diblokir'
                      : 'Mode normal: Kecerahan 100% • Scanner 60 FPS • Performa penuh'}
                  </span>
                </div>
                {onToggleBatterySaverMode && (
                  <button
                    type="button"
                    onClick={() => {
                      playFeedback('click');
                      onToggleBatterySaverMode();
                    }}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition cursor-pointer shrink-0 border ${
                      isBatterySaverMode
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isBatterySaverMode ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                )}
              </div>
            </div>

            {/* BATTERY HISTORY & DRAIN PATTERNS WIDGET (RECHARTS) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3.5 shadow-xl">
              {/* WIDGET HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                    <TrendingDown size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                        <span>Riwayat Pemakaian Baterai</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                          Battery History
                        </span>
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Visualisasi tren konsumsi daya selama jam sekolah untuk mengoptimalkan operasional scan kelas
                    </p>
                  </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playFeedback('click');
                      setBatteryHistoryTab('CHART');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      batteryHistoryTab === 'CHART'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 size={12} />
                    <span>Grafik Drain</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playFeedback('click');
                      setBatteryHistoryTab('TIPS');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      batteryHistoryTab === 'TIPS'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck size={12} />
                    <span>Panduan Guru</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playFeedback('click');
                      setBatteryHistoryTab('LOG');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      batteryHistoryTab === 'LOG'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock size={12} />
                    <span>Log Detail</span>
                  </button>
                </div>
              </div>

              {/* SNAPSHOT SUCCESS NOTICE */}
              {snapshotFeedbackNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-[11px] text-teal-200 font-bold flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                    <span>{snapshotFeedbackNotice}</span>
                  </div>
                </motion.div>
              )}

              {/* KPI STATS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Activity size={11} className="text-teal-400" />
                    <span>Rata-rata Drain:</span>
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-400">
                    ~{batteryStats.averageDrainRate}% / Jam
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {isBatterySaverMode ? 'Hemat Baterai Aktif (-45%)' : 'Mode Standar (60 FPS)'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={11} className="text-indigo-400" />
                    <span>Estimasi Daya:</span>
                  </div>
                  <div className="text-sm font-black font-mono text-indigo-300">
                    ~{batteryStats.estimatedHours} Jam
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {effectiveCurrentLevel > thresholdInput ? 'Cukup hingga jam pulang' : 'Segera isi ulang daya'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Gauge size={11} className="text-amber-400" />
                    <span>Puncak Beban:</span>
                  </div>
                  <div className="text-sm font-black font-mono text-amber-300">
                    {batteryStats.peakTime} WIB
                  </div>
                  <div className="text-[9px] text-slate-500 truncate" title={batteryStats.peakActivity}>
                    {batteryStats.peakActivity}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <BatteryCharging size={11} className="text-emerald-400" />
                    <span>Status Perangkat:</span>
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-300 flex items-center gap-1">
                    <span>{effectiveCurrentLevel}%</span>
                    {isBatteryCharging && (
                      <span className="text-[9px] font-sans px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        ⚡ Mengisi
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Ambang Batas: {thresholdInput}%
                  </div>
                </div>
              </div>

              {/* TAB 1: RECHARTS AREA CHART */}
              {batteryHistoryTab === 'CHART' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-bold text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Level Baterai (%)</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-400/90 font-mono">
                        <span className="w-2 h-0.5 bg-amber-400 border border-dashed" />
                        <span>Batas Alarm ({thresholdInput}%)</span>
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Jam Sekolah: 07:00 - 14:00 WIB
                    </div>
                  </div>

                  {/* RECHARTS CONTAINER */}
                  <div className="h-52 sm:h-56 w-full bg-slate-950/80 rounded-xl p-2 border border-slate-800/80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={batteryHistory}
                        margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="batteryDrainGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                            <stop offset="70%" stopColor="#0d9488" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis
                          dataKey="time"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          dy={4}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          tickCount={5}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomBatteryTooltip threshold={thresholdInput} />} />
                        <ReferenceLine
                          y={thresholdInput}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                        <Area
                          type="monotone"
                          dataKey="level"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#batteryDrainGradient)"
                          activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* CHART FOOTER ACTIONS */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Info size={12} className="text-teal-400 shrink-0" />
                      <span>
                        Grafik mencatat lonjakan konsumsi tertinggi saat sesi pemindaian QR pagi & evaluasi tugas.
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLogBatterySnapshot}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Catat level dan status baterai saat ini ke riwayat"
                      >
                        <Plus size={11} />
                        <span>Catat Titik Sekarang</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetBatteryHistory}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Reset riwayat ke profil standar jam sekolah"
                      >
                        <RefreshCw size={10} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEACHER OPTIMIZATION GUIDES & CLASS HOUR STRATEGIES */}
              {batteryHistoryTab === 'TIPS' && (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    <span>Panduan Optimasi Penggunaan Daya Selama Jam Sekolah:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Sesi Scan Pagi (07:00 - 07:45 WIB)</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Fase paling intensif dengan scan hingga 150+ siswa. Aktifkan <strong>Mode Penghemat Baterai (Eco)</strong> jika daya awal perangkat kurang dari 70% untuk mencegah penurunan cepat.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Jeda Istirahat (09:30 & 11:45 WIB)</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Manfaatkan 15-20 menit jeda KBM untuk menyambungkan charger di meja guru. Pengisian singkat ini mengembalikan <strong>+15% s/d +25% daya</strong> untuk sesi siang.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        <span>Kecerahan Layar & Kamera</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Hindari kecerahan 100% di ruang kelas; level <strong>60% - 70%</strong> sudah optimal membaca reticle QR dan menghemat daya display hingga <strong>~30%</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Toleransi Ambang Alarm ({thresholdInput}%)</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Batas peringatan <strong>{thresholdInput}%</strong> memberi buffer sekitar <strong>30-45 menit waktu aman</strong> sebelum perangkat mati mendadak saat kegiatan mengajar berlangsung.
                      </p>
                    </div>
                  </div>

                  {/* QUICK COMPARISON CALLOUT */}
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-2 text-[10px] text-indigo-200">
                    <div className="flex items-center gap-2">
                      <Leaf size={14} className="text-emerald-400 shrink-0" />
                      <span>
                        Mode Penghemat Baterai membatasi scanner ke <strong>1 FPS</strong> dan kecerahan <strong>65%</strong>, memperpanjang daya tahan baterai hingga <strong>+2,5 jam operasional</strong>.
                      </span>
                    </div>
                    {onToggleBatterySaverMode && (
                      <button
                        type="button"
                        onClick={onToggleBatterySaverMode}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shrink-0 cursor-pointer"
                      >
                        {isBatterySaverMode ? 'Mode Eco Aktif' : 'Nyalakan Eco'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: LOG DETAIL TABLE */}
              {batteryHistoryTab === 'LOG' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                    <span>Daftar Log Riwayat Titik Baterai Jam Sekolah:</span>
                    <span className="font-mono text-slate-500">{batteryHistory.length} Titik Tercatat</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 divide-y divide-slate-800/80">
                    {batteryHistory.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 text-[11px] hover:bg-slate-900/50 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono font-bold text-teal-300 w-12 shrink-0">
                            {item.time} WIB
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 truncate">{item.activity}</div>
                            <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
                              <span>Laju: {item.charging ? '+10%/jam' : `-${item.drainRatePerHour}%/jam`}</span>
                              {item.saverMode && <span className="text-emerald-400 font-bold">• Eco</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            item.charging
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : item.level <= thresholdInput
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}>
                            {item.level}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SCANNER PREFERENCES ACCORDION */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sliders size={14} className="text-indigo-400" />
                <span>Preferensi Tambahan Pemindai:</span>
              </div>

              {/* DEFAULT SCANNER MODE */}
              {onChangeDefaultScannerMode && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Mode Default Pemindai:</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'ALL', label: 'Semua', icon: Scan },
                      { id: 'STUDENT', label: 'Presensi', icon: UserCheck },
                      { id: 'ASSIGNMENT', label: 'Tugas', icon: BookOpen },
                      { id: 'ASSET', label: 'Aset', icon: Package },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = defaultScannerMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            playFeedback('click');
                            onChangeDefaultScannerMode(m.id as any);
                          }}
                          className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                            isSel
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                          }`}
                        >
                          <Icon size={13} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUICK TOGGLE ROWS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                {/* Audio & Haptic Feedback */}
                {onToggleMuteFeedback && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${!muteFeedback ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {!muteFeedback ? <Volume2 size={13} /> : <VolumeX size={13} />}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">Suara & Haptik</div>
                        <div className="text-[9px] text-slate-400">
                          {!muteFeedback ? 'Bunyi Aktif' : 'Mute'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleTestChime}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold border border-slate-700 transition cursor-pointer"
                        title="Uji nada scanner"
                      >
                        {feedbackTestPlaying ? '♪...' : 'Tes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playFeedback('click');
                          onToggleMuteFeedback();
                        }}
                        className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${!muteFeedback ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${!muteFeedback ? 'translate-x-3' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Smart Auto-Trigger */}
                {onToggleSmartAutoTrigger && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${smartAutoTrigger ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Video size={13} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">Auto-Detect QR</div>
                        <div className="text-[9px] text-slate-400">
                          {smartAutoTrigger ? 'Otomatis' : 'Manual'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playFeedback('click');
                        onToggleSmartAutoTrigger();
                      }}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${smartAutoTrigger ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${smartAutoTrigger ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )}

                {/* Camera Switch */}
                {onToggleCameraFacingMode && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                        <SwitchCamera size={13} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">
                          Kamera Utama: {cameraFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                        </div>
                        <div className="text-[9px] text-slate-400">Pilihan orientasi sensor video</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playFeedback('click');
                        onToggleCameraFacingMode();
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Ganti</span>
                    </button>
                  </div>
                )}

                {/* Pause Scan on Inactivity Toggle */}
                <div className={`p-2.5 rounded-xl border transition-all sm:col-span-2 space-y-2 ${
                  localPauseOnInactivity ? 'bg-slate-900 border-teal-500/40' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${localPauseOnInactivity ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Moon size={13} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                          <span>Jeda Scan Saat Inaktif (Pause on Inactivity)</span>
                          {localPauseOnInactivity && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold">
                              {localInactivityTimeoutSeconds}d
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Tangguhkan kamera otomatis saat idle untuk hemat baterai
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleInactivityPause}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        localPauseOnInactivity ? 'bg-teal-500' : 'bg-slate-700'
                      }`}
                      title="Aktifkan/nonaktifkan jeda kamera saat inaktif"
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        localPauseOnInactivity ? 'translate-x-3' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {localPauseOnInactivity && (
                    <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Timer size={11} className="text-teal-400" />
                        <span>Batas Waktu Idle Kamera:</span>
                      </span>
                      <div className="flex gap-1">
                        {[15, 30, 45, 60].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => handleSetInactivityTimeout(sec)}
                            className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border transition cursor-pointer ${
                              localInactivityTimeoutSeconds === sec
                                ? 'bg-teal-500/30 text-teal-200 border-teal-400 shadow-xs'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {sec}d
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition flex items-center gap-1.5 border border-transparent hover:border-rose-500/20 cursor-pointer"
              title="Reset ke kuota default siswa kelas"
            >
              <RotateCcw size={13} />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
