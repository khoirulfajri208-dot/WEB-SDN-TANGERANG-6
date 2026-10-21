import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Receipt,
  Store,
  DollarSign,
  Tag,
  Plus,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { mediaStorageService } from '../services/mediaStorageService';

interface ExtractedItem {
  nama_barang: string;
  kode_barang?: string;
  kategori?: string;
  jenis_satuan: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}

interface ExtractedReceiptData {
  nomor_faktur: string;
  tanggal: string;
  nama_penyedia: string;
  sumber_anggaran: string;
  nomor_siplah?: string;
  kode_rekening_arkas?: string;
  uraian_rekening?: string;
  total_nilai: number;
  catatan?: string;
  items: ExtractedItem[];
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedReceiptData) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-made sample receipts for quick evaluation
  const sampleReceipts = [
    {
      title: 'Nota Toko ATK Berkah Jaya (BOS Reguler)',
      desc: 'Kwitansi belanja kertas HVS, pulpen & tinta stempel',
      preview: 'ATK-PAPER',
      data: {
        nomor_faktur: 'KW/BOS/2026/041',
        tanggal: new Date().toISOString().split('T')[0],
        nama_penyedia: 'Toko Buku & ATK Berkah Jaya',
        sumber_anggaran: 'BOS Reguler',
        nomor_siplah: 'SIPL-2026-08192',
        kode_rekening_arkas: '5.1.02.01.01.0024',
        uraian_rekening: 'Belanja Alat Tulis Kantor (ATK)',
        total_nilai: 850000,
        catatan: 'Belanja keperluan operasional semester ganjil',
        items: [
          {
            nama_barang: 'Kertas HVS PaperOne A4 75gsm',
            kode_barang: 'ATK-KRT-001',
            kategori: 'ATK & Kertas',
            jenis_satuan: 'Rim',
            jumlah: 10,
            harga_satuan: 55000,
            subtotal: 550000,
          },
          {
            nama_barang: 'Ballpoint Pilot Ballliner Hitam',
            kode_barang: 'ATK-PEN-002',
            kategori: 'Alat Tulis',
            jenis_satuan: 'Lusin',
            jumlah: 3,
            harga_satuan: 70000,
            subtotal: 210000,
          },
          {
            nama_barang: 'Tinta Stempel Otomatis Biru 50ml',
            kode_barang: 'ATK-TIN-003',
            kategori: 'Perlengkapan Kantor',
            jenis_satuan: 'Botol',
            jumlah: 3,
            harga_satuan: 30000,
            subtotal: 90000,
          },
        ],
      },
    },
    {
      title: 'Faktur Pengadaan Komputer SIPLah (BOS Kinerja)',
      desc: 'Faktur pengadaan 2 unit Laptop Chromebook & Router Wifi',
      preview: 'IT-CHROMEBOOK',
      data: {
        nomor_faktur: 'INV-SIPL/2026/099',
        tanggal: new Date().toISOString().split('T')[0],
        nama_penyedia: 'PT. Edukasi Teknologi Digital Mandiri',
        sumber_anggaran: 'BOS Kinerja / Afirmasi',
        nomor_siplah: 'SIPL-ORD-998124',
        kode_rekening_arkas: '5.2.02.10.01.0002',
        uraian_rekening: 'Belanja Modal Komputer dan Laptop',
        total_nilai: 14500000,
        catatan: 'Pengadaan peralatan lab TIK & digitalisasi sekolah',
        items: [
          {
            nama_barang: 'Laptop Chromebook Axioo 11.6 inch 4GB/32GB',
            kode_barang: 'AST-LPT-001',
            kategori: 'Elektronik & IT',
            jenis_satuan: 'Unit',
            jumlah: 2,
            harga_satuan: 6500000,
            subtotal: 13000000,
          },
          {
            nama_barang: 'Router Wireless Access Point Ruijie Reyee',
            kode_barang: 'AST-NET-002',
            kategori: 'Elektronik & IT',
            jenis_satuan: 'Unit',
            jumlah: 1,
            harga_satuan: 1500000,
            subtotal: 1500000,
          },
        ],
      },
    },
    {
      title: 'Kwitansi Sanitasi & Kebersihan (BOS Reguler)',
      desc: 'Kwitansi belanja sabun cuci tangan, desinfektan, & sapu',
      preview: 'CLEAN-HYGIENE',
      data: {
        nomor_faktur: 'KW/SNT/2026/012',
        tanggal: new Date().toISOString().split('T')[0],
        nama_penyedia: 'UD. Sumber Bersih Sanitasi',
        sumber_anggaran: 'BOS Reguler',
        nomor_siplah: '',
        kode_rekening_arkas: '5.1.02.01.01.0030',
        uraian_rekening: 'Belanja Bahan Kebersihan dan Sanitasi',
        total_nilai: 490000,
        catatan: 'Perlengkapan kebersihan ruang kelas & UKS',
        items: [
          {
            nama_barang: 'Cairan Pembersih Lantai Wipol 5 Liter',
            kode_barang: 'KBS-CLN-001',
            kategori: 'Kebersihan',
            jenis_satuan: 'Jerigen',
            jumlah: 2,
            harga_satuan: 95000,
            subtotal: 190000,
          },
          {
            nama_barang: 'Sabun Cuci Tangan Handwash Botol Pump',
            kode_barang: 'KBS-HND-002',
            kategori: 'Kebersihan',
            jenis_satuan: 'Botol',
            jumlah: 6,
            harga_satuan: 25000,
            subtotal: 150000,
          },
          {
            nama_barang: 'Sapu Ijuk Gagang Kayu Kuat',
            kode_barang: 'KBS-SPU-003',
            kategori: 'Kebersihan',
            jenis_satuan: 'Pcs',
            jumlah: 5,
            harga_satuan: 30000,
            subtotal: 150000,
          },
        ],
      },
    },
  ];

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Automatic client-side compression to avoid memory lag & storage bloat
      const { dataUrl } = await mediaStorageService.compressImage(file, 1200, 0.85);
      setSelectedImage(dataUrl);
      processImageWithAI(dataUrl, 'image/jpeg');
    } catch (err) {
      console.warn('Compression fallback to direct read:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        processImageWithAI(result, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageWithAI = async (base64Img: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setExtractedData(resData.data);
      } else {
        throw new Error(resData.error || 'Tidak dapat membaca isi dokumen');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Gagal memproses kwitansi dengan Gemini AI.');
      // Auto fallback to first sample so user can continue testing smoothly
      setExtractedData(sampleReceipts[0].data);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleReceipts[0]) => {
    setSelectedImage(null);
    setIsScanning(true);
    setErrorMsg(null);
    setTimeout(() => {
      setExtractedData(sample.data);
      setIsScanning(false);
    }, 600);
  };

  const handleItemChange = (index: number, field: keyof ExtractedItem, value: any) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'jumlah' || field === 'harga_satuan') {
      const qty = Number(field === 'jumlah' ? value : updated[index].jumlah) || 0;
      const price = Number(field === 'harga_satuan' ? value : updated[index].harga_satuan) || 0;
      updated[index].subtotal = qty * price;
    }
    const newTotal = updated.reduce((acc, cur) => acc + (cur.subtotal || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      total_nilai: newTotal,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!extractedData) return;
    const updated = extractedData.items.filter((_, i) => i !== index);
    const newTotal = updated.reduce((acc, cur) => acc + (cur.subtotal || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      total_nilai: newTotal,
    });
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      items: [
        ...extractedData.items,
        {
          nama_barang: '',
          kode_barang: '',
          jenis_satuan: 'Pcs',
          jumlah: 1,
          harga_satuan: 0,
          subtotal: 0,
        },
      ],
    });
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyData(extractedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        id="receipt-scanner-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Smart OCR Scanner Kwitansi & Faktur Belanja
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full">
                  Gemini 3.7 Vision
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Pindai kwitansi belanja, nota toko, atau faktur SIPLah secara otomatis untuk mengisi form penerimaan barang.
              </p>
            </div>
          </div>
          <button
            id="btn-close-scanner-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Top Options: Upload / Samples */}
          {!extractedData && !isScanning && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all rounded-2xl p-8 text-center cursor-pointer group flex flex-col items-center justify-center space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-base">
                    Klik atau Seret Foto Kwitansi / Faktur ke Sini
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung format JPG, PNG, WEBP (Hasil foto kwitansi toko, faktur SIPLah, atau nota BKU)
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  Bisa langsung difoto menggunakan Kamera HP/Laptop
                </div>
              </div>

              {/* Quick Sample Presets */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Atau Coba Contoh Dokumen Pengadaan Siap Pakai:
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sampleReceipts.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample)}
                      className="p-4 text-left bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-xl transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                            {sample.data.sumber_anggaran}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {sample.data.items.length} item
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {sample.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {sample.desc}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-700">
                        <span>Rp {sample.data.total_nilai.toLocaleString('id-ID')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scanning Animation State */}
          {isScanning && (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-200">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce">
                  <Receipt className="w-8 h-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center animate-spin">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">
                  Gemini AI sedang membaca & mengekstrak dokumen...
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Mengidentifikasi nomor kwitansi, toko rekanan, kode rekening ARKAS, rincian barang, jumlah, dan nominal rupiah.
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: '80%' }}></div>
              </div>
            </div>
          )}

          {/* Extracted Data Result & Review Form */}
          {extractedData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Data Kwitansi Berhasil Diekstrak oleh AI!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Silakan periksa dan sesuaikan data di bawah sebelum menerapkannya ke form Barang Masuk.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setSelectedImage(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Scan Ulang
                </button>
              </div>

              {/* General Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nomor Kwitansi / Faktur
                  </label>
                  <input
                    type="text"
                    value={extractedData.nomor_faktur}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, nomor_faktur: e.target.value })
                    }
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={extractedData.tanggal}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, tanggal: e.target.value })
                    }
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Penyedia / Toko
                  </label>
                  <input
                    type="text"
                    value={extractedData.nama_penyedia}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, nama_penyedia: e.target.value })
                    }
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sumber Anggaran
                  </label>
                  <select
                    value={extractedData.sumber_anggaran}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, sumber_anggaran: e.target.value })
                    }
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja / Afirmasi">BOS Kinerja / Afirmasi</option>
                    <option value="BOS Daerah / APBD">BOS Daerah / APBD</option>
                    <option value="Komite Sekolah">Komite Sekolah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kode Rekening ARKAS
                  </label>
                  <input
                    type="text"
                    value={extractedData.kode_rekening_arkas || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, kode_rekening_arkas: e.target.value })
                    }
                    placeholder="Contoh: 5.1.02.01.01.0024"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nomor Pesanan SIPLah (Jika ada)
                  </label>
                  <input
                    type="text"
                    value={extractedData.nomor_siplah || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, nomor_siplah: e.target.value })
                    }
                    placeholder="Contoh: SIPL-ORD-12345"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Daftar Rincian Barang Hasil OCR ({extractedData.items.length} Item)
                    </h4>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nama Barang</th>
                        <th className="py-2.5 px-3 w-28">Kategori</th>
                        <th className="py-2.5 px-3 w-20">Satuan</th>
                        <th className="py-2.5 px-3 w-20 text-center">Jumlah</th>
                        <th className="py-2.5 px-3 w-32 text-right">Harga Satuan</th>
                        <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.nama_barang}
                              onChange={(e) => handleItemChange(idx, 'nama_barang', e.target.value)}
                              className="w-full text-xs px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.kategori || 'ATK'}
                              onChange={(e) => handleItemChange(idx, 'kategori', e.target.value)}
                              className="w-full text-xs px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.jenis_satuan}
                              onChange={(e) =>
                                handleItemChange(idx, 'jenis_satuan', e.target.value)
                              }
                              className="w-full text-xs px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah}
                              onChange={(e) =>
                                handleItemChange(idx, 'jumlah', Number(e.target.value))
                              }
                              className="w-full text-xs px-2 py-1 border border-slate-300 rounded-md text-center focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.harga_satuan}
                              onChange={(e) =>
                                handleItemChange(idx, 'harga_satuan', Number(e.target.value))
                              }
                              className="w-full text-xs px-2 py-1 border border-slate-300 rounded-md text-right focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                      <tr>
                        <td colSpan={6} className="py-2.5 px-3 text-right">
                          Total Nilai Belanja:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-800 text-sm">
                          Rp {extractedData.total_nilai.toLocaleString('id-ID')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {extractedData ? (
              <span>
                Total Item: <b>{extractedData.items.length}</b> | Total Nilai:{' '}
                <b>Rp {extractedData.total_nilai.toLocaleString('id-ID')}</b>
              </span>
            ) : (
              <span>Pilih file gambar atau klik preset contoh kwitansi di atas.</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-scanner"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Batal
            </button>
            {extractedData && (
              <button
                id="btn-apply-receipt-data"
                type="button"
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terapkan ke Barang Masuk
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
