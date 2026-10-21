import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Smartphone,
  CreditCard,
  Printer,
  Sparkles,
  Zap,
  Search,
  Users,
} from 'lucide-react';
import { Account } from '../../types/classroom';

export interface NFCGateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStudents?: Account[];
}

interface NFCScanRecord {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  nis: string;
  timestamp: string;
  type: 'MASUK' | 'PULANG';
  status: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'PULANG_CEPAT';
  nfcUid: string;
}

export const NFCGateAttendanceModal: React.FC<NFCGateAttendanceModalProps> = ({
  isOpen,
  onClose,
  allStudents = [],
}) => {
  const [scanMode, setScanMode] = useState<'MASUK' | 'PULANG'>('MASUK');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [simulatedCardId, setSimulatedCardId] = useState<string>('');
  const [recentScans, setRecentScans] = useState<NFCScanRecord[]>([
    {
      id: 'nfc-1',
      studentId: 'st-1',
      studentName: 'Ahmad Fauzi',
      kelas: 'Kelas 4B',
      nis: '20260401',
      timestamp: new Date(Date.now() - 5 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'MASUK',
      status: 'TEPAT_WAKTU',
      nfcUid: 'NFC-88F4-A190',
    },
    {
      id: 'nfc-2',
      studentId: 'st-2',
      studentName: 'Siti Nurhaliza',
      kelas: 'Kelas 5A',
      nis: '20260502',
      timestamp: new Date(Date.now() - 12 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'MASUK',
      status: 'TEPAT_WAKTU',
      nfcUid: 'NFC-77C2-B431',
    },
    {
      id: 'nfc-3',
      studentId: 'st-3',
      studentName: 'Budi Santoso',
      kelas: 'Kelas 3C',
      nis: '20260303',
      timestamp: new Date(Date.now() - 25 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'MASUK',
      status: 'TERLAMBAT',
      nfcUid: 'NFC-99D1-E882',
    },
  ]);

  const [lastScannedRecord, setLastScannedRecord] = useState<NFCScanRecord | null>(recentScans[0] || null);
  const [isTapAnimation, setIsTapAnimation] = useState<boolean>(false);
  const [nfcSensorActive, setNfcSensorActive] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSimulateTap = (selectedAccount?: Account) => {
    const target = selectedAccount || allStudents[Math.floor(Math.random() * allStudents.length)] || {
      ID: 'st-custom',
      NAMA: 'Rian Ardianto',
      KELAS: 'Kelas 4B',
      NIP: '20260405',
    };

    setIsTapAnimation(true);
    setTimeout(() => setIsTapAnimation(false), 800);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isLate = scanMode === 'MASUK' && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 15));

    const newRecord: NFCScanRecord = {
      id: `nfc-${Date.now()}`,
      studentId: target.ID,
      studentName: target.NAMA,
      kelas: target.KELAS || 'Kelas 4B',
      nis: target.NIP || '20260099',
      timestamp: timeStr,
      type: scanMode,
      status: isLate ? 'TERLAMBAT' : 'TEPAT_WAKTU',
      nfcUid: `NFC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`,
    };

    setRecentScans((prev) => [newRecord, ...prev]);
    setLastScannedRecord(newRecord);

    // Audio beep simulation
    if (soundEnabled && window.AudioContext) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isLate ? 440 : 880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // ignore fallback audio
      }
    }
  };

  const stats = {
    total: recentScans.length,
    masuk: recentScans.filter((s) => s.type === 'MASUK').length,
    terlambat: recentScans.filter((s) => s.status === 'TERLAMBAT').length,
    pulang: recentScans.filter((s) => s.type === 'PULANG').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-800/80 text-cyan-300 ring-1 ring-blue-500/30">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Kios Presensi NFC & Smart Card Gerbang Sekolah
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Pencatatan Otomatis Masuk & Pulang Siswa/Guru Berbasis Web NFC & Kartu Pelajar Digital
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline font-bold">{soundEnabled ? 'Suara Aktif' : 'Mute'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setScanMode('MASUK')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  scanMode === 'MASUK'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={14} /> Mode Presensi Masuk (Pagi)
              </button>
              <button
                type="button"
                onClick={() => setScanMode('PULANG')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  scanMode === 'PULANG'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={14} /> Mode Presensi Pulang (Sore)
              </button>
            </div>

            {/* Status Sensors */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Sensor NFC Gerbang Active (13.56 MHz)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Tap Kios Terminal Simulator (Left Column) */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`p-6 rounded-3xl border-2 text-center transition-all duration-300 relative overflow-hidden shadow-lg ${
                  isTapAnimation
                    ? 'bg-emerald-950 border-emerald-400 text-white scale-[1.02]'
                    : lastScannedRecord?.status === 'TERLAMBAT'
                    ? 'bg-slate-900 border-amber-500 text-white'
                    : 'bg-slate-900 border-blue-500 text-white'
                }`}
              >
                {/* Visual Radar Rings */}
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-white/10 text-cyan-300 border border-white/20 shadow-inner">
                    <CreditCard size={32} className={isTapAnimation ? 'animate-bounce' : ''} />
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-white tracking-wide uppercase">
                      TEMPELKAN KARTU PELAJAR NFC / HP
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bawa Kartu ID dekat dengan sensor NFC kiosk gerbang
                    </p>
                  </div>

                  {/* Simulator Tap Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateTap()}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap size={16} /> SIMULASI TAP KARTU NFC SEKARANG
                    </button>
                  </div>

                  {/* Quick Student Selector Simulator */}
                  {allStudents.length > 0 && (
                    <div className="pt-2 border-t border-white/10 text-left">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Pilih Peserta Didik Uji Coba:
                      </label>
                      <select
                        onChange={(e) => {
                          const found = allStudents.find((s) => s.ID === e.target.value);
                          if (found) handleSimulateTap(found);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="">-- Tap Siswa Acak --</option>
                        {allStudents.slice(0, 8).map((st) => (
                          <option key={st.ID} value={st.ID}>
                            {st.NAMA} ({st.KELAS || 'Siswa'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Scanned Result Display */}
              {lastScannedRecord && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Hasil Tap Terakhir</span>
                    <span className="text-[10px] font-mono text-slate-400">{lastScannedRecord.nfcUid}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {lastScannedRecord.studentName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-black text-xs text-slate-900">{lastScannedRecord.studentName}</h5>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {lastScannedRecord.kelas} • NIS: {lastScannedRecord.nis}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            lastScannedRecord.status === 'TERLAMBAT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {lastScannedRecord.status === 'TERLAMBAT' ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <CheckCircle2 size={11} />
                          )}
                          {lastScannedRecord.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 font-bold">
                          {lastScannedRecord.timestamp} WIB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Scan Log & Stats (Right Column) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Summary Counter Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Tap</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">{stats.total}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Masuk Tepat</span>
                  <span className="text-base font-black text-emerald-900 mt-0.5 block">{stats.masuk - stats.terlambat}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Terlambat</span>
                  <span className="text-base font-black text-amber-900 mt-0.5 block">{stats.terlambat}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Pulang</span>
                  <span className="text-base font-black text-blue-900 mt-0.5 block">{stats.pulang}</span>
                </div>
              </div>

              {/* Log List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" /> Riwayat Presensi Real-time Gerbang
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Otomatis Tercatat ke Server Sekolah
                  </span>
                </div>

                <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 text-xs">
                  {recentScans.length > 0 ? (
                    recentScans.map((record) => (
                      <div key={record.id} className="p-3 hover:bg-slate-50 flex items-center justify-between transition">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl text-white font-bold text-xs ${
                              record.type === 'MASUK' ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}
                          >
                            {record.type === 'MASUK' ? 'IN' : 'OUT'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{record.studentName}</span>
                            <span className="text-[10px] text-slate-500">
                              {record.kelas} • UID: {record.nfcUid}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 block">{record.timestamp}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              record.status === 'TERLAMBAT' ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {record.status === 'TERLAMBAT' ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400">Belum ada aktivitas tap NFC.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Sparkles size={14} className="text-cyan-600" /> Mendukung Protokol Web NFC Chrome Mobile & RFID Kiosk
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup Kios
          </button>
        </div>
      </div>
    </div>
  );
};
