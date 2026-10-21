import React from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  MapPin,
  UserCheck,
  Calendar,
  X,
  FileSpreadsheet,
  QrCode,
  ArrowRight,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { Asset, Config } from '../types';
import { db } from '../services/localStorageService';

interface PublicAssetVerificationModalProps {
  isOpen: boolean;
  assetCode: string;
  driveUrl?: string;
  onClose: () => void;
  onOpenInApp: (assetCode: string) => void;
}

export const PublicAssetVerificationModal: React.FC<PublicAssetVerificationModalProps> = ({
  isOpen,
  assetCode,
  driveUrl,
  onClose,
  onOpenInApp,
}) => {
  if (!isOpen) return null;

  const config: Config = db.getConfig();
  const assets = db.getAssets();
  const asset = assets.find((a) => a.KODE_ASET.toUpperCase() === assetCode.toUpperCase()) || null;

  const targetDriveLink = driveUrl || asset?.DRIVE_FILE_URL || asset?.FOTO_LINK;

  const handleOpenDrive = () => {
    if (targetDriveLink) {
      window.open(targetDriveLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Official Header Banner */}
        <div className="bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-800 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-700/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
                <ShieldCheck size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Verifikasi Aset Resmi
                </span>
                <h2 className="text-base font-black text-white mt-1 leading-tight">
                  {config.SCHOOL_NAME.toUpperCase()}
                </h2>
                <p className="text-[11px] text-emerald-200/90 font-medium">{config.ADDRESS}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Verification Status & Drive Redirect Callout */}
        <div className="p-6 space-y-5">
          {targetDriveLink ? (
            <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <FolderOpen size={17} className="text-emerald-700 shrink-0" />
                <span>Berkas Digital & Legalitas Terhubung (Google Drive)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Scan QR ini mendeteksi berkas dokumen resmi (BAST / Faktur Pembelian / Sertifikat Aset) yang telah diunggah ke Google Drive.
              </p>
              <button
                type="button"
                onClick={handleOpenDrive}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                Buka Berkas Resmi di Google Drive
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <QrCode size={16} className="text-emerald-700" />
                <span>Identitas Barcode Register Terverifikasi</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Aset ini terdaftar secara sah dalam Buku Inventaris Barang Sekolah. Berkas digital spesifik Google Drive belum ditautkan oleh operator.
              </p>
            </div>
          )}

          {/* Asset Metadata Card */}
          {asset ? (
            <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rincian Identifikasi Aset
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    asset.KONDISI === 'BAIK'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Kondisi: {asset.KONDISI}
                </span>
              </div>

              <div>
                <div className="text-xs font-mono font-bold text-emerald-900">{asset.KODE_ASET}</div>
                <div className="text-sm font-black text-slate-800 mt-0.5">{asset.NAMA_BARANG}</div>
                {asset.SPESIFIKASI && (
                  <p className="text-xs text-slate-500 mt-0.5">{asset.SPESIFIKASI}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <MapPin size={13} className="text-emerald-700" /> Lokasi Ruangan:
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{asset.LOKASI}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <UserCheck size={13} className="text-emerald-700" /> Penanggung Jawab:
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">{asset.PENANGGUNG_JAWAB}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Nilai Perolehan:</span>
                <span className="font-bold text-slate-800">
                  Rp {(asset.TOTAL_NILAI || asset.HARGA_SATUAN || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              Kode Scan: <strong className="font-mono text-slate-800">{assetCode}</strong>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onOpenInApp(assetCode);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300"
            >
              <FileSpreadsheet size={15} className="text-emerald-800" />
              Buka & Kelola di Aplikasi Bendahara Barang
              <ArrowRight size={14} />
            </button>

            <div className="text-center">
              <span className="text-[10px] text-slate-400">
                Sistem Verifikasi Digital Terpadu • SD Negeri Tangerang 6
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
