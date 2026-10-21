import React, { useState } from 'react';
import {
  X,
  Cpu,
  Zap,
  Thermometer,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Power,
  RefreshCw,
  Wrench,
  Sparkles,
  Building2,
  Sliders,
} from 'lucide-react';

export interface IoTSmartClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerMaintenance?: (assetName: string) => void;
}

export const IoTSmartClassroomModal: React.FC<IoTSmartClassroomModalProps> = ({
  isOpen,
  onClose,
  onTriggerMaintenance,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('LabKomputer1');
  const [acPower, setAcPower] = useState<boolean>(true);
  const [acTemp, setAcTemp] = useState<number>(22);
  const [projectorPower, setProjectorPower] = useState<boolean>(true);
  const [maintenanceCreated, setMaintenanceCreated] = useState<string>('');

  if (!isOpen) return null;

  const handleTriggerWorkOrder = (device: string) => {
    setMaintenanceCreated(`Tiket Pemeliharaan Aset untuk "${device}" berhasil dibuat!`);
    if (onTriggerMaintenance) onTriggerMaintenance(device);
    setTimeout(() => setMaintenanceCreated(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 ring-1 ring-emerald-400/30">
              <Cpu size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Monitoring IoT Smart Classroom & Fasilitas Energi
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Pemantauan Sensor Real-time, Konsumsi Energi, & Auto Triger Pemeliharaan Aset SD Negeri Tangerang 6
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50">
          {/* Room Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-emerald-700" />
              <span className="text-xs font-bold text-slate-800">Pilih Ruangan Smart Classroom:</span>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900"
              >
                <option value="LabKomputer1">Laboratorium Komputer & STEM (24 PC)</option>
                <option value="Kelas4B">Kelas 4B Interaktif (Smart Display)</option>
                <option value="Kelas5A">Kelas 5A Merdeka Belajar</option>
                <option value="Perpustakaan">Perpustakaan Digital IoT</option>
              </select>
            </div>

            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Sensor Hub Online (MQTT Gateway)
            </span>
          </div>

          {/* Success Notification Alert */}
          {maintenanceCreated && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl font-bold text-xs flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{maintenanceCreated}</span>
            </div>
          )}

          {/* Realtime KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase">Konsumsi Listrik</span>
                <Zap size={15} className="text-amber-500" />
              </div>
              <span className="text-base font-black text-slate-900 mt-1 block">1.82 kW/h</span>
              <span className="text-[10px] text-emerald-600 font-bold">Hemat 12% dari Efisiensi</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase">Suhu Ruangan AC</span>
                <Thermometer size={15} className="text-blue-500" />
              </div>
              <span className="text-base font-black text-slate-900 mt-1 block">{acTemp}°C</span>
              <span className="text-[10px] text-blue-600 font-bold">Kondisi Ideal Belajar</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase">Perangkat Aktif</span>
                <Monitor size={15} className="text-emerald-500" />
              </div>
              <span className="text-base font-black text-slate-900 mt-1 block">22 / 24 Unit</span>
              <span className="text-[10px] text-slate-500 font-bold">Smart Chromebook</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase">Kualitas Udara (AQI)</span>
                <Activity size={15} className="text-teal-500" />
              </div>
              <span className="text-base font-black text-slate-900 mt-1 block">42 AQI (Baik)</span>
              <span className="text-[10px] text-teal-600 font-bold">Sirkulasi Bersih</span>
            </div>
          </div>

          {/* Device Telemetry & Control Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Control 1: AC Inverter */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Thermometer size={16} className="text-blue-600" /> AC Inverter Ruangan (2 PK)
                </span>
                <button
                  type="button"
                  onClick={() => setAcPower(!acPower)}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    acPower
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  <Power size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold">Atur Suhu:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAcTemp(Math.max(18, acTemp - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-800 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-black text-slate-900 w-8 text-center">
                    {acTemp}°C
                  </span>
                  <button
                    type="button"
                    onClick={() => setAcTemp(Math.min(28, acTemp + 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-800 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Control 2: Smart Proyektor & Lamp Telemetry */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Monitor size={16} className="text-indigo-600" /> Proyektor Interaktif EPSON (Aset #KIB-B-082)
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Lampu 2.150 Jam (Peringatan)
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Status Lampu Proyektor:</span>
                  <span className="font-bold text-amber-600">Perlu Servis / Penggantian</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[86%] h-full bg-amber-500" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerWorkOrder('Proyektor EPSON LabKom (#KIB-B-082)')}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Wrench size={14} /> Buat Tiket Pemeliharaan Aset Otomatis
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Sparkles size={14} className="text-emerald-600" /> Terhubung dengan Sistem Pemeliharaan Aset KIB B
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
