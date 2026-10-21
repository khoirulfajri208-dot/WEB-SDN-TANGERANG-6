import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Printer, Download, X, CheckSquare, Square, Layers, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Item, Config } from '../types';
import { db } from '../services/localStorageService';
import { qrService } from '../services/qrService';
import jsPDF from 'jspdf';

interface A4ItemLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
}

export const A4ItemLabelsModal: React.FC<A4ItemLabelsModalProps> = ({ isOpen, onClose, items }) => {
  const config = db.getConfig();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [gridColumns, setGridColumns] = useState<2 | 3>(2);
  const [includeSchoolName, setIncludeSchoolName] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeCategory, setIncludeCategory] = useState(true);
  const [qrSizeOption, setQrSizeOption] = useState<'standard' | 'compact'>('standard');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Initialize selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(items.map((i) => i.ID));
    }
  }, [isOpen, items]);

  // Generate QR codes for all items
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateAllQr = async () => {
      const urls: Record<string, string> = {};
      for (const item of items) {
        const qrContent = `${window.location.origin}/?page=master_barang&code=${encodeURIComponent(item.KODE_BARANG)}`;
        const dataUrl = await qrService.generateQRCode(qrContent, 240);
        urls[item.KODE_BARANG] = dataUrl;
      }
      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };

    generateAllQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen, items]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(items.map((i) => i.KATEGORI).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !search ||
      item.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      item.KODE_BARANG.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.KATEGORI === filterCategory;
    return matchSearch && matchCat;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredItems.map((i) => i.ID);
    const allSelected = filteredIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Build the list of labels to print with multiplicity
  const labelsToPrint: Item[] = [];
  items
    .filter((i) => selectedItemIds.includes(i.ID))
    .forEach((item) => {
      for (let c = 0; c < copiesPerItem; c++) {
        labelsToPrint.push(item);
      }
    });

  const handlePrintBrowser = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (labelsToPrint.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const cols = gridColumns;
      const gap = 5;
      const labelWidth = (usableWidth - (cols - 1) * gap) / cols;
      const labelHeight = cols === 2 ? 44 : 36;
      const rowsPerPage = Math.floor((pageHeight - margin * 2) / (labelHeight + gap));
      const labelsPerPage = cols * rowsPerPage;

      let currentX = margin;
      let currentY = margin;
      let labelIndexOnPage = 0;

      for (let i = 0; i < labelsToPrint.length; i++) {
        const item = labelsToPrint[i];

        if (labelIndexOnPage >= labelsPerPage) {
          doc.addPage();
          labelIndexOnPage = 0;
          currentX = margin;
          currentY = margin;
        }

        const colIndex = labelIndexOnPage % cols;
        const rowIndex = Math.floor(labelIndexOnPage / cols);
        currentX = margin + colIndex * (labelWidth + gap);
        currentY = margin + rowIndex * (labelHeight + gap);

        // Draw Outer Box with green accent border
        doc.setDrawColor(20, 83, 45); // Dark emerald
        doc.setLineWidth(0.6);
        doc.roundedRect(currentX, currentY, labelWidth, labelHeight, 2, 2, 'S');

        // Draw Left QR code
        const qrSize = cols === 2 ? 30 : 22;
        const qrMargin = (labelHeight - qrSize) / 2;
        const qrDataUrl = qrCodeDataUrls[item.KODE_BARANG];

        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', currentX + 3, currentY + qrMargin, qrSize, qrSize);
        }

        // Draw vertical separator
        const textStartX = currentX + qrSize + 5;
        doc.setDrawColor(220, 231, 225);
        doc.setLineWidth(0.3);
        doc.line(textStartX - 1.5, currentY + 3, textStartX - 1.5, currentY + labelHeight - 3);

        // Write Typography Info
        let textY = currentY + 6;
        const textWidth = labelWidth - (qrSize + 9);

        if (includeSchoolName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(cols === 2 ? 7.5 : 6.5);
          doc.setTextColor(20, 83, 45);
          const schoolLine = config.SCHOOL_NAME.toUpperCase();
          doc.text(doc.splitTextToSize(schoolLine, textWidth)[0], textStartX, textY);
          textY += cols === 2 ? 4.5 : 3.5;
        }

        // Kode Barang
        doc.setFont('courier', 'bold');
        doc.setFontSize(cols === 2 ? 10 : 8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.KODE_BARANG, textStartX, textY);
        textY += cols === 2 ? 4.5 : 3.5;

        // Nama Barang
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cols === 2 ? 8.5 : 7);
        doc.setTextColor(30, 41, 59);
        const nameLines = doc.splitTextToSize(item.NAMA_BARANG, textWidth);
        doc.text(nameLines.slice(0, 2), textStartX, textY);
        textY += (cols === 2 ? 4 : 3) * Math.min(nameLines.length, 2);

        // Additional meta tags
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(cols === 2 ? 7 : 6);
        doc.setTextColor(100, 116, 139);

        const subDetails = [
          includeCategory ? item.KATEGORI : '',
          includeLocation ? item.LOKASI_DEFAULT : '',
          `Satuan: ${item.JENIS_SATUAN}`,
        ]
          .filter(Boolean)
          .join(' • ');

        if (subDetails) {
          doc.text(doc.splitTextToSize(subDetails, textWidth)[0], textStartX, textY + 1);
        }

        labelIndexOnPage++;
      }

      doc.save(`LABEL_INVENTARIS_A4_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal menghasilkan berkas PDF. Silakan gunakan opsi Cetak Browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable Area Specific CSS for window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible;
          }
          #printable-label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                Cetak Stiker & Label Inventaris A4 (QR Code)
              </h3>
              <p className="text-xs text-slate-500">
                Format siap cetak kertas stiker/label A4 standar (Grid 2 Kolom atau 3 Kolom) untuk inventaris barang dan ATK sekolah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Settings & Layout Selector */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controls Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Grid Layout & Copies */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-800" />
                Tata Letak Kisi Label (Grid Layout)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGridColumns(2)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gridColumns === 2
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  2 Kolom (Label Besar)
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(3)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gridColumns === 3
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  3 Kolom (Kompak/Padat)
                </button>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Cetak per Barang:
                </label>
                <select
                  value={copiesPerItem}
                  onChange={(e) => setCopiesPerItem(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-emerald-700"
                >
                  <option value={1}>1 Label per barang</option>
                  <option value={2}>2 Label per barang</option>
                  <option value={3}>3 Label per barang</option>
                  <option value={4}>4 Label per barang</option>
                  <option value={6}>6 Label per barang</option>
                  <option value={10}>10 Label per barang</option>
                </select>
              </div>
            </div>

            {/* Custom Information Toggles */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Informasi Pada Label:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSchoolName}
                    onChange={(e) => setIncludeSchoolName(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Nama Sekolah ({config.SCHOOL_NAME})
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Lokasi / Ruang Default
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategory}
                    onChange={(e) => setIncludeCategory(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  Kategori Barang
                </label>
              </div>
            </div>

            {/* Action Buttons & Summary */}
            <div className="flex flex-col justify-between space-y-2 bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ringkasan Cetak
                </span>
                <div className="text-xs font-extrabold text-slate-900 mt-1">
                  {selectedItemIds.length} Jenis Barang terpilih
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  Total {labelsToPrint.length} lembar label siap dicetak
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf || labelsToPrint.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Download size={14} className={isGeneratingPdf ? 'animate-bounce' : ''} />
                  {isGeneratingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF Siap Cetak A4'}
                </button>

                <button
                  type="button"
                  onClick={handlePrintBrowser}
                  disabled={labelsToPrint.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Cetak Langsung (Browser)
                </button>
              </div>
            </div>
          </div>

          {/* Item Selector with Quick Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  {filteredItems.every((i) => selectedItemIds.includes(i.ID)) ? (
                    <>
                      <CheckSquare size={14} /> Batalkan Pilihan ({filteredItems.length})
                    </>
                  ) : (
                    <>
                      <Square size={14} /> Pilih Semua Hasil Filter ({filteredItems.length})
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedItemIds.length} dari {items.length} terpilih
                </span>
              </div>

              {/* Filter inputs */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-emerald-700"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Grid Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.ID);
                return (
                  <button
                    key={item.ID}
                    type="button"
                    onClick={() => handleToggleSelect(item.ID)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 text-emerald-800">
                      {isSelected ? <CheckSquare size={15} /> : <Square size={15} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                        {item.KODE_BARANG}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate" title={item.NAMA_BARANG}>
                        {item.NAMA_BARANG}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {item.KATEGORI} • {item.JENIS_SATUAN}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pratinjau Kertas A4 (Live Preview Sheet) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-800" />
                Pratinjau Lembar Label A4
              </span>
              <span className="text-[11px] text-slate-500">
                Skala tampilan pratinjau cetak kertas A4 standar
              </span>
            </div>

            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-x-auto">
              <div
                id="printable-label-sheet"
                ref={printAreaRef}
                className={`bg-white mx-auto shadow-md p-6 border border-slate-300 rounded-lg grid gap-3.5 ${
                  gridColumns === 2 ? 'grid-cols-2 max-w-2xl' : 'grid-cols-3 max-w-3xl'
                }`}
                style={{ minHeight: '400px' }}
              >
                {labelsToPrint.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 text-xs font-medium">
                    Pilih minimal satu barang untuk melihat pratinjau stiker label.
                  </div>
                ) : (
                  labelsToPrint.map((item, idx) => {
                    const qrUrl = qrCodeDataUrls[item.KODE_BARANG];
                    return (
                      <div
                        key={`${item.ID}-${idx}`}
                        className="border-2 border-emerald-900/80 rounded-xl p-3 bg-white flex items-center gap-3 relative shadow-2xs overflow-hidden"
                      >
                        {/* QR Code Container */}
                        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt="QR"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <QrCode size={32} className="text-slate-400 animate-pulse" />
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-[1.5px] self-stretch bg-slate-200"></div>

                        {/* Label Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                          {includeSchoolName && (
                            <div className="text-[10px] font-black text-emerald-900 uppercase truncate">
                              {config.SCHOOL_NAME}
                            </div>
                          )}
                          <div className="text-xs font-mono font-black text-slate-900 tracking-tight">
                            {item.KODE_BARANG}
                          </div>
                          <div className="text-xs font-black text-slate-800 line-clamp-1" title={item.NAMA_BARANG}>
                            {item.NAMA_BARANG}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex flex-wrap items-center gap-1.5 pt-0.5">
                            {includeCategory && <span>{item.KATEGORI}</span>}
                            {includeCategory && includeLocation && <span>•</span>}
                            {includeLocation && <span>{item.LOKASI_DEFAULT}</span>}
                            <span>• {item.JENIS_SATUAN}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Format stiker mendukung label Tom & Jerry / stiker A4 universal.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
