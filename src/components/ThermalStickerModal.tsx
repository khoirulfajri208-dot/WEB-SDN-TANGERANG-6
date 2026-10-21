import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  QrCode,
  Settings,
  CheckCircle2,
  Copy,
  Layers,
  FileText,
  Sliders,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Asset, Item } from '../types';
import { db } from '../services/localStorageService';

interface ThermalStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  item?: Item | null;
  batchAssets?: Asset[];
}

export const ThermalStickerModal: React.FC<ThermalStickerModalProps> = ({
  isOpen,
  onClose,
  asset,
  item,
  batchAssets = [],
}) => {
  const config = db.getConfig();
  const users = db.getUsers();

  const [paperSize, setPaperSize] = useState<'50x30' | '40x20' | '58mm' | '80mm'>('50x30');
  const [showLogo, setShowLogo] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showPj, setShowPj] = useState(true);
  const [showNip, setShowNip] = useState(true);
  const [showYear, setShowYear] = useState(true);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<{ [key: string]: string }>({});
  const [copyCount, setCopyCount] = useState(1);

  // Targets to print
  const targets: (Asset | Item)[] =
    batchAssets && batchAssets.length > 0
      ? batchAssets
      : asset
      ? [asset]
      : item
      ? [item]
      : db.getAssets().slice(0, 4);

  // Helper to find NIP
  const findNip = (pjName?: string): string => {
    if (!pjName) return '';
    const u = users.find((user) => {
      const name = (user as any).NAMA_LENGKAP || user.NAMA || '';
      return (
        name.toLowerCase().includes(pjName.toLowerCase()) ||
        pjName.toLowerCase().includes(name.toLowerCase())
      );
    });
    return u?.NIP || '';
  };

  // Generate QR codes for all targets
  useEffect(() => {
    if (!isOpen) return;
    const generateQrs = async () => {
      const urls: { [key: string]: string } = {};
      for (const t of targets) {
        const id = 'KODE_ASET' in t ? t.KODE_ASET || t.ID : t.KODE_BARANG || t.ID;
        const qrPayload = JSON.stringify({
          app: 'BendaharaBarang',
          npsn: config.SCHOOL_NPSN,
          id: id,
          nama: t.NAMA_BARANG,
          lokasi: 'LOKASI' in t ? t.LOKASI : t.LOKASI_DEFAULT,
        });

        try {
          const url = await QRCode.toDataURL(qrPayload, {
            margin: 1,
            width: 160,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          urls[id] = url;
        } catch (e) {
          console.error('Failed to generate QR for thermal:', e);
        }
      }
      setQrCodeDataUrls(urls);
    };

    generateQrs();
  }, [isOpen, paperSize, targets.length, config.SCHOOL_NPSN]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      {/* Thermal Print Hidden Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible;
          }
          #thermal-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          @page {
            size: ${
              paperSize === '50x30'
                ? '50mm 30mm'
                : paperSize === '40x20'
                ? '40mm 20mm'
                : paperSize === '58mm'
                ? '58mm auto'
                : '80mm auto'
            };
            margin: 1mm;
          }
        }
      `}</style>

      <div
        id="thermal-sticker-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Kustomisasi & Cetak Stiker Thermal / POS
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full">
                  Thermal Direct ESC/POS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atur ukuran kertas (50x30, 40x20, 58mm POS) dan info Nama Aset, Kategori, NIP sebelum cetak
              </p>
            </div>
          </div>
          <button
            id="btn-close-thermal-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {/* Controls / Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Ukuran Kertas Thermal:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '50x30', label: '50 × 30 mm', desc: 'Label Stiker Standar Aset' },
                  { id: '40x20', label: '40 × 20 mm', desc: 'Label Mini ATK & Barang' },
                  { id: '58mm', label: '58 mm POS', desc: 'Struk Kertas Roll Kasir' },
                  { id: '80mm', label: '80 mm POS', desc: 'Struk Berita Acara Lebar' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPaperSize(s.id as any)}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      paperSize === s.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-2xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs">{s.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Elemen & Informasi yang Ditampilkan:
              </label>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>QR Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Kop Sekolah</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showCategory}
                    onChange={(e) => setShowCategory(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Kategori KIB</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Lokasi Ruang</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showPj}
                    onChange={(e) => setShowPj(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Nama PJ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold text-emerald-950">
                  <input
                    type="checkbox"
                    checked={showNip}
                    onChange={(e) => setShowNip(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>NIP Petugas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showYear}
                    onChange={(e) => setShowYear(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Tahun Perolehan</span>
                </label>
              </div>

              <div className="pt-1 flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Jumlah Copy:
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={copyCount}
                  onChange={(e) => setCopyCount(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-xs px-2.5 py-1 font-bold border border-slate-300 rounded-lg focus:outline-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Live Thermal Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pratinjau Hasil Cetak Thermal ({targets.length * copyCount} Label):
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Ukuran: {paperSize.toUpperCase()}
              </span>
            </div>

            {/* Printable Preview Area */}
            <div
              id="thermal-print-area"
              className="p-6 bg-slate-200/80 border border-slate-300 rounded-2xl flex flex-wrap gap-4 items-center justify-center min-h-[200px]"
            >
              {targets.map((itemObj, idx) => {
                const id =
                  'KODE_ASET' in itemObj
                    ? itemObj.KODE_ASET || itemObj.ID
                    : itemObj.KODE_BARANG || itemObj.ID;
                const qrUrl = qrCodeDataUrls[id];
                const locationName =
                  'LOKASI' in itemObj
                    ? itemObj.LOKASI
                    : itemObj.LOKASI_DEFAULT || 'Gudang Sekolah';
                const pjName =
                  'PENANGGUNG_JAWAB' in itemObj
                    ? itemObj.PENANGGUNG_JAWAB
                    : config.WAREHOUSE_OFFICER || 'Pengurus Barang';
                const nip = findNip(pjName) || (itemObj as any).NIP || '';
                const category =
                  'KIB_KATEGORI' in itemObj
                    ? itemObj.KIB_KATEGORI
                    : itemObj.KATEGORI || '';
                const year =
                  'TAHUN_PEROLEHAN' in itemObj
                    ? itemObj.TAHUN_PEROLEHAN
                    : '';

                return Array.from({ length: copyCount }).map((_, cIdx) => (
                  <div
                    key={`${id}-${idx}-${cIdx}`}
                    className={`bg-white text-black font-mono border border-dashed border-slate-400 p-2 shadow-xs flex flex-col justify-between overflow-hidden ${
                      paperSize === '50x30'
                        ? 'w-[210px] h-[125px]'
                        : paperSize === '40x20'
                        ? 'w-[165px] h-[95px] p-1.5'
                        : paperSize === '58mm'
                        ? 'w-[240px] min-h-[160px] p-3'
                        : 'w-[320px] min-h-[200px] p-4'
                    }`}
                  >
                    {/* Header */}
                    {showLogo && (
                      <div className="border-b border-black pb-0.5 mb-1 text-center">
                        <div className="text-[9px] font-bold uppercase tracking-tight truncate">
                          {config.SCHOOL_NAME}
                        </div>
                        <div className="text-[7px] text-slate-700">
                          INVENTARIS & ASET MILIK DAERAH (BMD)
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex items-center gap-2 flex-1 my-0.5">
                      {showQr && qrUrl && (
                        <div className="shrink-0 bg-white p-0.5 border border-black">
                          <img
                            src={qrUrl}
                            alt="QR"
                            className={
                              paperSize === '40x20'
                                ? 'w-10 h-10 object-contain'
                                : 'w-13 h-13 object-contain'
                            }
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[10px] font-bold text-black line-clamp-2 leading-tight">
                          {itemObj.NAMA_BARANG}
                        </div>
                        <div className="text-[8px] font-mono mt-0.5 text-slate-800">
                          NO: <b>{id}</b> {showCategory && category ? `[${category}]` : ''}
                        </div>
                        {showLocation && (
                          <div className="text-[7px] text-slate-700 mt-0.5 truncate">
                            LOK: {locationName} {showYear && year ? `• TH: ${year}` : ''}
                          </div>
                        )}
                        {(showPj || showNip) && (
                          <div className="text-[7px] text-slate-700 truncate">
                            {showPj ? `PJ: ${pjName}` : ''} {showNip && nip ? `(NIP: ${nip})` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-black pt-0.5 text-[6px] text-center text-slate-800 flex justify-between">
                      <span>NPSN: {config.SCHOOL_NPSN || '20606498'}</span>
                      <span>{new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                ));
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Dapat dicetak ke segala printer thermal Bluetooth & USB POS (58mm / 80mm / Label Maker).
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-thermal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              id="btn-direct-thermal-print"
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Cetak ke Printer Thermal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
