import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  Check,
  Sparkles,
  PackagePlus,
  PackageMinus,
  Box,
  ClipboardList,
  Flame,
  UserCheck,
  Calendar,
  Building2,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Eye,
  Settings2,
  Printer,
  ShieldCheck,
  Layout,
  Bookmark,
  BookmarkPlus,
  PenTool,
  FileSpreadsheet,
  QrCode,
  Sliders,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import {
  DocumentRecord,
  BarangMasuk,
  BarangKeluar,
  Asset,
  StockOpnameSession,
  Penghapusan,
  User,
  BATemplate,
  StockSummaryItem,
  StockLedgerEntry,
} from '../types';
import { pdfService, BeritaAcaraOptions } from '../services/pdfService';
import { SearchableEmployeePicker } from './SearchableEmployeePicker';
import { BeritaAcaraPreviewModal } from './BeritaAcaraPreviewModal';
import { DocumentTemplateManager } from './DocumentTemplateManager';
import { BatchStatusUpdateModal } from './BatchStatusUpdateModal';
import { BulkQRLabelGenerator } from './BulkQRLabelGenerator';
import { autoSyncService } from '../services/autoSyncService';

type SourceTransactionType =
  | 'BARANG_MASUK'
  | 'BARANG_KELUAR'
  | 'STOCK_LEDGER'
  | 'ASET'
  | 'STOCK_OPNAME'
  | 'PENGHAPUSAN'
  | 'CUSTOM';

export const DocumentCenterView: React.FC = () => {
  const config = db.getConfig();
  const [documents, setDocuments] = useState<DocumentRecord[]>(db.getDocuments());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'GENERATOR' | 'TEMPLATES' | 'BULK_QR' | 'REPOSITORY'>('GENERATOR');
  const [appliedTemplateMsg, setAppliedTemplateMsg] = useState<string | null>(null);
  const [batchToastMsg, setBatchToastMsg] = useState<string | null>(null);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState<string | null>(null);

  // Batch Status Update Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Source selection states
  const [sourceType, setSourceType] = useState<SourceTransactionType>('BARANG_MASUK');
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Form states for BA
  const [judulBA, setJudulBA] = useState('BERITA ACARA SERAH TERIMA HASIL PENGADAAN BARANG (BAST)');
  const [nomorBA, setNomorBA] = useState('');
  const [tanggalBA, setTanggalBA] = useState(new Date().toISOString().slice(0, 10));
  const [deskripsiBA, setDeskripsiBA] = useState(
    'Pada hari ini telah dilakukan serah terima hasil pengadaan barang inventaris sekolah bersumber dari Dana BOS Reguler sesuai dengan spesifikasi teknis dan rincian sebagai berikut:'
  );
  const [tableHeaders, setTableHeaders] = useState('No, Kode Barang, Uraian Barang / Pekerjaan, Volume, Satuan, Total Harga, Keterangan');
  const [tableRowsRaw, setTableRowsRaw] = useState('');
  const [catatanPenutup, setCatatanPenutup] = useState(
    'Demikian Berita Acara ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dapat dipergunakan sebagaimana mestinya.'
  );

  // Document Styling & Paper Size options
  const [paperSize, setPaperSize] = useState<'a4' | 'f4' | 'letter' | 'legal'>('a4');
  const [kopAlignment, setKopAlignment] = useState<'dual_logo' | 'center' | 'left'>('dual_logo');
  const [themeColor, setThemeColor] = useState<'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber'>('emerald');
  const [includeVerificationQR, setIncludeVerificationQR] = useState(true);
  const [includeHeadmaster, setIncludeHeadmaster] = useState(true);
  const [watermark, setWatermark] = useState('');

  // Preview Modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewModalOptions, setPreviewModalOptions] = useState<BeritaAcaraOptions | null>(null);

  // Drive File Link
  const [driveUrl, setDriveUrl] = useState('');

  // Signatories
  const [namaPihak1, setNamaPihak1] = useState(config.TREASURER || 'Siti Rahmawati, S.Pd.');
  const [nipPihak1, setNipPihak1] = useState(config.TREASURER_NIP || '19870921 201001 2 005');
  const [jabatanPihak1, setJabatanPihak1] = useState('Pihak Pertama (Pengurus Barang Sekolah)');

  const [namaPihak2, setNamaPihak2] = useState('');
  const [nipPihak2, setNipPihak2] = useState('');
  const [jabatanPihak2, setJabatanPihak2] = useState('Pihak Kedua (Penyedia / Guru Penerima)');

  const [namaMengetahui, setNamaMengetahui] = useState(config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.');
  const [nipMengetahui, setNipMengetahui] = useState(config.HEADMASTER_NIP || '19680412 199303 2 005');
  const [jabatanMengetahui, setJabatanMengetahui] = useState('Kepala UPT Satuan Pendidikan');

  // AI Generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Source datasets
  const barangMasukList = db.getBarangMasuk();
  const barangKeluarList = db.getBarangKeluar().filter((k) => k.STATUS_TRANSAKSI === 'DISETUJUI');
  const stockSummaryList = db.getStockSummary();
  const assetList = db.getAssets();
  const opnameSessions = db.getStockOpnameSessions();
  const penghapusanList = db.getPenghapusan();
  const users = db.getUsers();

  // Extract detected item/asset codes from tableRowsRaw for fast batch update matching
  const suggestedCodesFromBA = useMemo(() => {
    if (!tableRowsRaw) return [];
    const lines = tableRowsRaw.split('\n');
    const codes: string[] = [];
    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts[1] && parts[1].length >= 3 && !parts[1].startsWith('Rp') && !parts[1].toLowerCase().includes('kode')) {
        codes.push(parts[1]);
      }
    });
    return Array.from(new Set(codes));
  }, [tableRowsRaw]);

  const refreshData = () => {
    setDocuments(db.getDocuments());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  // Generate clean default number on mount
  useEffect(() => {
    const year = new Date().getFullYear();
    const count = documents.length + 1;
    setNomorBA(`027/BAST-BOS/SDN6/${year}/${String(count).padStart(3, '0')}`);
  }, [documents.length]);

  // When source type or selected transaction changes, auto-populate everything!
  const handleSelectTransaction = (type: SourceTransactionType, id: string) => {
    setSelectedTxId(id);
    const year = new Date().getFullYear();

    if (type === 'BARANG_MASUK') {
      const bm = barangMasukList.find((b) => b.ID === id);
      if (bm) {
        setJudulBA('BERITA ACARA SERAH TERIMA HASIL PENGADAAN BARANG (BAST)');
        setNomorBA(`027/BAST-BM/${bm.NOMOR_BKU || 'BOS'}/${year}`);
        setTanggalBA(bm.TANGGAL || new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Pada hari ini telah dilakukan serah terima hasil pengadaan belanja barang persediaan sekolah yang bersumber dari ${bm.SUMBER_ANGGARAN || 'Dana BOS Reguler'} (Kuitansi No: ${bm.NOMOR_KWITANSI || '-'}, BKU: ${bm.NOMOR_BKU || '-'}) dari ${bm.NAMA_TOKO || 'Penyedia'} dengan rincian sebagai berikut:`
        );
        setTableHeaders('No, Kode Barang, Nama Barang, Volume, Satuan, Harga Satuan, Total Harga, Kondisi');
        setTableRowsRaw(
          `1, ${bm.KODE_BARANG}, ${bm.NAMA_BARANG}, ${bm.JUMLAH}, ${bm.JENIS_SATUAN}, Rp ${(bm.HARGA_SATUAN || 0).toLocaleString('id-ID')}, Rp ${(bm.TOTAL_PENGADAAN || 0).toLocaleString('id-ID')}, Baik Sesuai Spesifikasi`
        );
        setJabatanPihak1('Pihak Pertama (Penyedia / Toko)');
        setNamaPihak1(bm.NAMA_TOKO || 'CV Rekanan Sekolah');
        setNipPihak1('-');

        setJabatanPihak2('Pihak Kedua (Pengurus Barang Sekolah)');
        setNamaPihak2(config.TREASURER || 'Siti Rahmawati, S.Pd.');
        setNipPihak2(config.TREASURER_NIP || '19870921 201001 2 005');
      }
    } else if (type === 'BARANG_KELUAR') {
      const bk = barangKeluarList.find((b) => b.ID === id);
      if (bk) {
        setJudulBA('SURAT PERINTAH & BERITA ACARA PENDISTRIBUSIAN BARANG (SPB)');
        setNomorBA(`028/SPB-DIST/${bk.NOMOR_DOKUMEN || year}`);
        setTanggalBA(bk.TANGGAL || new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Pada hari ini telah diserahterimakan barang persediaan/ATK inventaris sekolah untuk keperluan operasional pembelajaran dan administrasi (${bk.TUJUAN_PENGGUNAAN || bk.UNIT_RUANGAN}) dengan rincian sebagai berikut:`
        );
        setTableHeaders('No, Kode Barang, Uraian Barang, Jumlah, Satuan, Unit Ruangan, Penerima, Status');
        setTableRowsRaw(
          `1, ${bk.KODE_BARANG}, ${bk.NAMA_BARANG}, ${bk.JUMLAH}, ${bk.JENIS_SATUAN}, ${bk.UNIT_RUANGAN}, ${bk.PENERIMA}, Diserahkan Lengkap`
        );

        setJabatanPihak1('Pihak Pertama (Pengurus Barang Sekolah)');
        setNamaPihak1(config.WAREHOUSE_OFFICER || config.TREASURER || 'Budi Santoso, A.Md.');
        setNipPihak1(config.WAREHOUSE_OFFICER_NIP || config.TREASURER_NIP || '19920311 201903 1 008');

        // Look up recipient employee for exact NIP
        const recipientUser = users.find(
          (u) =>
            u.NAMA.toLowerCase() === (bk.PENERIMA || '').toLowerCase() ||
            (bk.PENERIMA_NIP && u.NIP === bk.PENERIMA_NIP)
        );

        setJabatanPihak2(`Pihak Kedua (Guru / Pegawai Penerima - ${bk.UNIT_RUANGAN})`);
        setNamaPihak2(bk.PENERIMA);
        setNipPihak2(bk.PENERIMA_NIP || recipientUser?.NIP || '-');
      }
    } else if (type === 'STOCK_LEDGER') {
      if (id === 'SUMMARY_ALL' || !id) {
        const totalItems = stockSummaryList.length;
        const totalMasuk = stockSummaryList.reduce((acc, curr) => acc + curr.TOTAL_MASUK, 0);
        const totalKeluar = stockSummaryList.reduce((acc, curr) => acc + curr.TOTAL_KELUAR, 0);
        const totalSaldo = stockSummaryList.reduce((acc, curr) => acc + curr.STOK, 0);

        setJudulBA('BERITA ACARA REKONSILIASI BUKU KAS & MUTASI PERSEDIAAN (STOCK LEDGER)');
        setNomorBA(`027/BA-LEDGER/SDN6/${year}/${String(documents.length + 1).padStart(3, '0')}`);
        setTanggalBA(new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Pada hari ini telah dilakukan rekonsiliasi dan verifikasi mutasi buku persediaan (stock ledger) sekolah tahun anggaran ${year}. Berdasarkan pencatatan buku kas umum (BKU) dan kartu stok persediaan, seluruh arus penerimaan (Total Masuk: ${totalMasuk.toLocaleString('id-ID')} unit) dan pendistribusian (Total Keluar: ${totalKeluar.toLocaleString('id-ID')} unit) barang telah diperiksa dengan sisa saldo persediaan sebanyak ${totalSaldo.toLocaleString('id-ID')} unit dari ${totalItems} jenis barang aktif dengan rincian saldo mutasi sebagai berikut:`
        );
        setTableHeaders('No, Kode Barang, Nama Barang, Satuan, Total Masuk, Total Keluar, Saldo Akhir, Status');

        const rowsStr = stockSummaryList
          .map(
            (s, idx) =>
              `${idx + 1}, ${s.KODE_BARANG}, ${s.NAMA_BARANG}, ${s.JENIS_SATUAN}, ${s.TOTAL_MASUK}, ${s.TOTAL_KELUAR}, ${s.STOK}, ${s.STATUS === 'MINIMUM' ? 'Perlu Restock' : 'Cukup / Aman'}`
          )
          .join('\n');
        setTableRowsRaw(rowsStr);

        setJabatanPihak1('Pihak Pertama (Pengurus Barang Sekolah)');
        setNamaPihak1(config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.');
        setNipPihak1(config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008');

        setJabatanPihak2('Pihak Kedua (Bendahara BOS / Pengelola Akuntansi)');
        setNamaPihak2(config.TREASURER || 'Siti Rahmawati, S.Pd.');
        setNipPihak2(config.TREASURER_NIP || '19870921 201001 2 005');
      } else {
        const targetItem = stockSummaryList.find((s) => s.KODE_BARANG === id);
        const itemLedgers = db.getStockLedger(id);
        const itemName = targetItem ? targetItem.NAMA_BARANG : id;

        setJudulBA(`BERITA ACARA VERIFIKASI MUTASI KARTU STOK PERSEDIAAN (${itemName})`);
        setNomorBA(`027/BA-KARTU-STOK/${id}/${year}`);
        setTanggalBA(new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Berdasarkan hasil pemeriksaan fisik dan audit kartu stok persediaan untuk kode barang [${id}] "${itemName}", dilaporkan rincian kronologis mutasi keluar-masuk barang serta saldo fisik akhir sebagai berikut:`
        );
        setTableHeaders('No, Tanggal, No Referensi / Dokumen, Satuan, Masuk, Keluar, Saldo Berjalan, Status');

        if (itemLedgers.length > 0) {
          const rowsStr = itemLedgers
            .map(
              (l, idx) =>
                `${idx + 1}, ${l.TANGGAL}, ${l.NOMOR_DOKUMEN}, ${l.JENIS_SATUAN}, ${l.QTY_IN}, ${l.QTY_OUT}, ${l.SALDO_SESUDAH}, ${l.STATUS}`
            )
            .join('\n');
          setTableRowsRaw(rowsStr);
        } else {
          setTableRowsRaw(`1, ${new Date().toISOString().slice(0, 10)}, SALDO AWAL, Unit, 0, 0, ${targetItem?.STOK || 0}, Tercatat Sesuai Fisik`);
        }

        setJabatanPihak1('Petugas Gudang / Pengelola Persediaan');
        setNamaPihak1(config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.');
        setNipPihak1(config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008');

        setJabatanPihak2('Pengurus Barang & Pengelola Aset');
        setNamaPihak2(config.TREASURER || 'Siti Rahmawati, S.Pd.');
        setNipPihak2(config.TREASURER_NIP || '19870921 201001 2 005');
      }
    } else if (type === 'STOCK_OPNAME') {
      const op = opnameSessions.find((s) => s.ID === id);
      if (op) {
        const scans = db.getStockOpnameScans(op.ID);
        setJudulBA('BERITA ACARA HASIL PEMERIKSAAN FISIK PERSEDIAAN (STOCK OPNAME)');
        setNomorBA(`027/BA-OPNAME/${op.NOMOR_OPNAME || year}`);
        setTanggalBA(op.TANGGAL || new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Berdasarkan hasil pemeriksaan fisik dan rekonsiliasi buku persediaan yang dilaksanakan pada ${op.TANGGAL} bertempat di ${op.LOKASI || 'Gudang Sekolah'}, Tim Pemeriksa Persediaan menyatakan rincian hasil opname sebagai berikut:`
        );
        setTableHeaders('No, Kode Barang, Nama Barang, Stok Sistem, Stok Fisik, Selisih, Satuan, Status');
        if (scans.length > 0) {
          const rowsStr = scans
            .map(
              (s, idx) =>
                `${idx + 1}, ${s.KODE_BARANG}, ${s.NAMA_BARANG}, ${s.STOK_SISTEM}, ${s.STOK_FISIK}, ${s.SELISIH}, ${s.JENIS_SATUAN}, ${s.STATUS}`
            )
            .join('\n');
          setTableRowsRaw(rowsStr);
        } else {
          setTableRowsRaw(`1, BRG-ALL, Rekap Seluruh Item Opname, ${op.JUMLAH_ITEM}, ${op.JUMLAH_ITEM}, ${op.TOTAL_SELSIH}, Item, ${op.STATUS}`);
        }

        setJabatanPihak1('Petugas Pemeriksa Fisik (Opname)');
        setNamaPihak1(op.PETUGAS || config.WAREHOUSE_OFFICER);
        setNipPihak1(config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008');

        setJabatanPihak2('Pengurus Barang & Pengelola Aset');
        setNamaPihak2(config.TREASURER || 'Siti Rahmawati, S.Pd.');
        setNipPihak2(config.TREASURER_NIP || '19870921 201001 2 005');
      }
    } else if (type === 'PENGHAPUSAN') {
      const ph = penghapusanList.find((p) => p.ID === id);
      if (ph) {
        setJudulBA('BERITA ACARA USULAN PENGHAPUSAN & PEMUSNAHAN BARANG RUSAK BERAT');
        setNomorBA(`027/BA-HAPUS/${year}/${String(documents.length + 1).padStart(3, '0')}`);
        setTanggalBA(ph.TANGGAL || new Date().toISOString().slice(0, 10));
        setDeskripsiBA(
          `Berdasarkan hasil verifikasi kondisi fisik barang inventaris dan pertimbangan teknis efisiensi biaya pemeliharaan, barang inventaris berikut dinyatakan RUSAK TOTAL / MELEBIHI MASA MANFAAT dan diusulkan untuk dihapus dari Buku Inventaris Sekolah:`
        );
        setTableHeaders('No, Kode Aset, Nama Barang, Alasan Penghapusan, Kondisi Akhir, Status');
        setTableRowsRaw(`1, ${ph.KODE_ASET}, ${ph.NAMA_BARANG}, ${ph.ALASAN}, ${ph.KONDISI_AKHIR}, ${ph.STATUS}`);

        setJabatanPihak1('Pengurus Barang / Pengelola Aset');
        setNamaPihak1(config.TREASURER);
        setNipPihak1(config.TREASURER_NIP || '19870921 201001 2 005');

        setJabatanPihak2('Ketua Tim Pemeriksa Teknis');
        setNamaPihak2(ph.PETUGAS || config.WAREHOUSE_OFFICER);
        setNipPihak2(config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008');
      }
    }
  };

  // Multiple Asset Selection for BA Serah Terima Aset (KIR)
  const handleToggleAsset = (ast: Asset) => {
    const isSelected = selectedAssetIds.includes(ast.ID);
    const newSelected = isSelected
      ? selectedAssetIds.filter((id) => id !== ast.ID)
      : [...selectedAssetIds, ast.ID];
    setSelectedAssetIds(newSelected);

    const year = new Date().getFullYear();
    setJudulBA('BERITA ACARA SERAH TERIMA PENGGUNAAN ASET & INVENTARIS RUANGAN');
    setNomorBA(`027/BAST-ASET/SDN6/${year}`);
    setTableHeaders('No, Kode Aset, Nama Aset, Merk/Spesifikasi, Jumlah, Lokasi Ruangan, Penanggung Jawab, Kondisi');

    const chosenAssets = assetList.filter((a) => newSelected.includes(a.ID));
    if (chosenAssets.length > 0) {
      const rows = chosenAssets
        .map(
          (a, idx) =>
            `${idx + 1}, ${a.KODE_ASET}, ${a.NAMA_BARANG}, ${a.MERK || '-'} ${a.SPESIFIKASI || ''}, ${a.JUMLAH || 1} ${a.JENIS_SATUAN || 'Unit'}, ${a.LOKASI}, ${a.PENANGGUNG_JAWAB}, ${a.KONDISI}`
        )
        .join('\n');
      setTableRowsRaw(rows);

      setDeskripsiBA(
        `Pada hari ini telah diserahterimakan pengelolaan dan pemeliharaan aset inventaris tetap sekolah kepada penanggung jawab ruangan/guru kelas dengan rincian daftar aset sebagai berikut:`
      );

      setJabatanPihak1('Pihak Pertama (Pengurus Barang Sekolah)');
      setNamaPihak1(config.TREASURER || 'Siti Rahmawati, S.Pd.');
      setNipPihak1(config.TREASURER_NIP || '19870921 201001 2 005');

      const firstAsset = chosenAssets[0];
      setJabatanPihak2(`Pihak Kedua (Penanggung Jawab - ${firstAsset.LOKASI})`);
      setNamaPihak2(firstAsset.PENANGGUNG_JAWAB);

      // Attempt matching user NIP
      const matchU = users.find((u) => firstAsset.PENANGGUNG_JAWAB.includes(u.NAMA));
      setNipPihak2(matchU?.NIP || '-');
    }
  };

  // AI Narrative Auto-Drafter (Gemini API)
  const handleGenerateAINarrative = async () => {
    setIsGeneratingAI(true);
    setAiSuccessMsg('');
    try {
      const res = await fetch('/api/ai/draft-berita-acara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: judulBA,
          transactionData: {
            nomor: nomorBA,
            tanggal: tanggalBA,
            deskripsi: deskripsiBA,
            items: tableRowsRaw,
          },
          parties: {
            pihak1: { nama: namaPihak1, nip: nipPihak1, jabatan: jabatanPihak1 },
            pihak2: { nama: namaPihak2, nip: nipPihak2, jabatan: jabatanPihak2 },
            mengetahui: { nama: namaMengetahui, nip: nipMengetahui, jabatan: jabatanMengetahui },
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.judul) setJudulBA(json.data.judul);
        if (json.data.nomor) setNomorBA(json.data.nomor);
        if (json.data.paragrafPembuka) setDeskripsiBA(json.data.paragrafPembuka);
        if (json.data.paragrafPenutup) setCatatanPenutup(json.data.paragrafPenutup);
        setAiSuccessMsg('Draf narasi dan konsiderans hukum dinas berhasil disempurnakan oleh AI!');
        setTimeout(() => setAiSuccessMsg(''), 4000);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal membuat narasi AI: ' + e.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const buildCurrentOptions = (): BeritaAcaraOptions => {
    const headers = tableHeaders.split(',').map((h) => h.trim());
    const rows = tableRowsRaw
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(',').map((c) => c.trim()));

    return {
      title: judulBA,
      docNo: nomorBA,
      description: deskripsiBA,
      tableHeaders: headers,
      tableRows: rows,
      footerText: catatanPenutup,
      leftSigner: {
        title: jabatanPihak1.endsWith(',') ? jabatanPihak1 : jabatanPihak1 + ',',
        name: namaPihak1,
        nip: nipPihak1 ? (nipPihak1.startsWith('NIP') ? nipPihak1 : `NIP. ${nipPihak1}`) : '',
      },
      rightSigner: {
        title: jabatanPihak2.endsWith(',') ? jabatanPihak2 : jabatanPihak2 + ',',
        name: namaPihak2,
        nip: nipPihak2 ? (nipPihak2.startsWith('NIP') ? nipPihak2 : `NIP. ${nipPihak2}`) : '',
      },
      centerSigner: {
        title: jabatanMengetahui || 'Kepala UPT Satuan Pendidikan',
        name: namaMengetahui,
        nip: nipMengetahui,
      },
      includeHeadmaster,
      paperSize,
      kopSurat: {
        show: true,
        alignment: kopAlignment,
        borderStyle: 'double',
      },
      styling: {
        themeColor,
        includeVerificationQR,
        watermark,
      },
    };
  };

  const handleRefreshFromSheets = async (silent = false) => {
    setIsSyncingData(true);
    try {
      const syncStatus = autoSyncService.getStatus();
      if (syncStatus.connectionType === 'NONE') {
        if (!silent) {
          setSyncToastMsg('Data lokal siap (Google Sheets belum dikonfigurasi).');
          setTimeout(() => setSyncToastMsg(null), 3500);
        }
        setIsSyncingData(false);
        return;
      }

      const res = await autoSyncService.triggerSync(true);
      if (res.success) {
        refreshData();
        if (!silent) {
          setSyncToastMsg('Data persediaan & aset berhasil diperbarui dari Google Sheets!');
          setTimeout(() => setSyncToastMsg(null), 3500);
        }
      } else {
        if (!silent) {
          setSyncToastMsg(res.message);
          setTimeout(() => setSyncToastMsg(null), 4000);
        }
      }
    } catch (e: any) {
      if (!silent) {
        setSyncToastMsg(`Sinkronisasi Sheets: ${e.message}`);
        setTimeout(() => setSyncToastMsg(null), 4000);
      }
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleOpenPreviewModal = async () => {
    if (!judulBA || !nomorBA) {
      alert('Mohon lengkapi Judul dan Nomor Berita Acara terlebih dahulu.');
      return;
    }
    // Auto-refresh from Sheets in background if connected
    handleRefreshFromSheets(true);

    const currentOpt = buildCurrentOptions();
    setPreviewModalOptions(currentOpt);
    setIsPreviewModalOpen(true);
  };

  const handleCreateAndDownloadPDF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulBA || !nomorBA || !namaPihak1 || !namaPihak2) {
      alert('Mohon lengkapi Judul, Nomor BA, dan Pihak Penandatangan.');
      return;
    }

    // Auto-refresh from Sheets in background if connected
    handleRefreshFromSheets(true);

    const currentOpt = buildCurrentOptions();

    // Save record to repository
    db.createDocument({
      NOMOR_DOKUMEN: nomorBA,
      JENIS_DOKUMEN: judulBA.includes('BAST')
        ? 'BAST_PENGADAAN'
        : judulBA.includes('DIST') || judulBA.includes('SPB')
        ? 'BA_DISTRIBUSI'
        : judulBA.includes('OPNAME')
        ? 'BA_OPNAME'
        : judulBA.includes('HAPUS')
        ? 'BA_PENGHAPUSAN'
        : 'BERITA_ACARA',
      TANGGAL: tanggalBA,
      PIHAK_TERKAIT: `${namaPihak1} & ${namaPihak2}`,
      KETERANGAN: deskripsiBA,
      FILE_URL: driveUrl || undefined,
      DATA: {
        title: judulBA,
        headers: currentOpt.tableHeaders,
        rows: currentOpt.tableRows,
        leftSigner: currentOpt.leftSigner,
        rightSigner: currentOpt.rightSigner,
        includeHeadmaster,
        paperSize,
        kopAlignment,
      },
    });

    // Generate and Download Official PDF
    pdfService.generateBeritaAcara(currentOpt);

    refreshData();
  };

  const handlePreviewDoc = (doc: DocumentRecord) => {
    if (doc.DATA) {
      const data = doc.DATA;
      const docOptions: BeritaAcaraOptions = {
        title: data.title || doc.JENIS_DOKUMEN,
        docNo: doc.NOMOR_DOKUMEN,
        description: doc.KETERANGAN || '',
        tableHeaders: data.headers || ['No', 'Item', 'Qty', 'Keterangan'],
        tableRows: data.rows || [[1, doc.PIHAK_TERKAIT, 1, 'Baik']],
        footerText:
          'Demikian dokumen Berita Acara ini diterbitkan secara sah dan diarsipkan dalam sistem inventaris sekolah.',
        leftSigner: data.leftSigner,
        rightSigner: data.rightSigner,
        centerSigner: {
          title: jabatanMengetahui || 'Kepala UPT Satuan Pendidikan',
          name: namaMengetahui,
          nip: nipMengetahui,
        },
        includeHeadmaster: data.includeHeadmaster !== false,
        paperSize: data.paperSize || 'a4',
        kopSurat: {
          show: true,
          alignment: data.kopAlignment || 'dual_logo',
          borderStyle: 'double',
        },
        styling: {
          themeColor: 'emerald',
          includeVerificationQR: true,
        },
      };
      setPreviewModalOptions(docOptions);
      setIsPreviewModalOpen(true);
    } else {
      alert('Dokumen ini diarsipkan dari modul transaksi.');
    }
  };

  const handleDownloadDoc = (doc: DocumentRecord) => {
    if (doc.DATA) {
      const data = doc.DATA;
      pdfService.generateBeritaAcara({
        title: data.title || doc.JENIS_DOKUMEN,
        docNo: doc.NOMOR_DOKUMEN,
        description: doc.KETERANGAN || '',
        tableHeaders: data.headers || ['No', 'Item', 'Qty', 'Keterangan'],
        tableRows: data.rows || [[1, doc.PIHAK_TERKAIT, 1, 'Baik']],
        footerText:
          'Demikian dokumen Berita Acara ini diterbitkan secara sah dan diarsipkan dalam sistem inventaris sekolah.',
        leftSigner: data.leftSigner,
        rightSigner: data.rightSigner,
        paperSize: data.paperSize || 'a4',
        kopSurat: {
          show: true,
          alignment: data.kopAlignment || 'dual_logo',
        },
      });
    } else {
      alert('Dokumen ini diarsipkan dari modul transaksi.');
    }
  };

  const handleApplyTemplate = (tpl: BATemplate) => {
    setJudulBA(tpl.title);
    const year = new Date().getFullYear();
    const count = documents.length + 1;
    const docNo = tpl.docNumberPattern
      ? tpl.docNumberPattern.replace('{YEAR}', String(year)).replace('{NO}', String(count).padStart(3, '0'))
      : `027/BAST-BOS/SDN6/${year}/${String(count).padStart(3, '0')}`;
    setNomorBA(docNo);
    if (tpl.openingClause) setDeskripsiBA(tpl.openingClause);
    if (tpl.closingClause) setCatatanPenutup(tpl.closingClause);
    if (tpl.defaultHeaders) setTableHeaders(tpl.defaultHeaders.join(', '));
    if (tpl.defaultSampleRows) {
      setTableRowsRaw(tpl.defaultSampleRows.map((r) => r.join(', ')).join('\n'));
    }
    if (tpl.paperSize) setPaperSize(tpl.paperSize);
    if (tpl.kopAlignment) setKopAlignment(tpl.kopAlignment);
    if (tpl.themeColor) setThemeColor(tpl.themeColor);
    if (tpl.leftSignerTitle) setJabatanPihak1(tpl.leftSignerTitle.replace(/,$/, ''));
    if (tpl.leftSignerName) setNamaPihak1(tpl.leftSignerName);
    if (tpl.leftSignerNip) setNipPihak1(tpl.leftSignerNip.replace(/^NIP\.\s*/, ''));
    if (tpl.rightSignerTitle) setJabatanPihak2(tpl.rightSignerTitle.replace(/,$/, ''));
    if (tpl.rightSignerName) setNamaPihak2(tpl.rightSignerName);
    if (tpl.rightSignerNip) setNipPihak2(tpl.rightSignerNip.replace(/^NIP\.\s*/, ''));
    if (tpl.centerSignerTitle) setJabatanMengetahui(tpl.centerSignerTitle);
    if (tpl.centerSignerName) setNamaMengetahui(tpl.centerSignerName);
    if (tpl.centerSignerNip) setNipMengetahui(tpl.centerSignerNip.replace(/^NIP\.\s*/, ''));
    if (tpl.includeHeadmaster !== undefined) setIncludeHeadmaster(tpl.includeHeadmaster);
    if (tpl.includeVerificationQR !== undefined) setIncludeVerificationQR(tpl.includeVerificationQR);
    if (tpl.watermark !== undefined) setWatermark(tpl.watermark);

    setAppliedTemplateMsg(`Template "${tpl.name}" berhasil diterapkan!`);
    setTimeout(() => setAppliedTemplateMsg(null), 4000);
    setActiveTab('GENERATOR');
  };

  const handlePreviewTemplate = (tpl: BATemplate) => {
    const docOpt: BeritaAcaraOptions = {
      title: tpl.title,
      docNo: tpl.docNumberPattern
        ? tpl.docNumberPattern.replace('{YEAR}', String(new Date().getFullYear())).replace('{NO}', '001')
        : '027/BAST-BOS/SDN6/2026/001',
      description: tpl.openingClause || '',
      tableHeaders: tpl.defaultHeaders || ['No', 'Item', 'Qty', 'Keterangan'],
      tableRows: tpl.defaultSampleRows || [['1', 'Contoh Item Barang', '10', 'Baik']],
      footerText: tpl.closingClause || 'Demikian Berita Acara ini dibuat sebagaimana mestinya.',
      leftSigner: {
        title: tpl.leftSignerTitle || 'Pihak Pertama,',
        name: tpl.leftSignerName || config.WAREHOUSE_OFFICER,
        nip: tpl.leftSignerNip,
      },
      rightSigner: {
        title: tpl.rightSignerTitle || 'Pihak Kedua,',
        name: tpl.rightSignerName || config.TREASURER,
        nip: tpl.rightSignerNip,
      },
      centerSigner: {
        title: tpl.centerSignerTitle || 'Kepala UPT Satuan Pendidikan',
        name: tpl.centerSignerName || config.HEADMASTER,
        nip: tpl.centerSignerNip,
      },
      includeHeadmaster: tpl.includeHeadmaster !== false,
      paperSize: tpl.paperSize || 'a4',
      orientation: tpl.orientation || 'portrait',
      kopSurat: {
        show: true,
        alignment: tpl.kopAlignment || 'dual_logo',
        borderStyle: tpl.kopBorderStyle || 'double',
        line1: tpl.governingBody,
        line2: tpl.institutionAgency,
        line3: tpl.institutionName ? `UPT SATUAN PENDIDIKAN ${tpl.institutionName.toUpperCase()}` : undefined,
        line4: tpl.institutionAddress,
      },
      styling: {
        themeColor: tpl.themeColor || 'emerald',
        fontFamily: tpl.fontFamily || 'helvetica',
        tableDensity: tpl.tableDensity || 'normal',
        includeVerificationQR: tpl.includeVerificationQR !== false,
        watermark: tpl.watermark || '',
      },
      pageNumbering: {
        enabled: tpl.autoPageNumbering !== false,
        position: tpl.pageNumberPosition || 'bottom_center',
      },
      headerFooter: {
        enabled: true,
        runningHeader: tpl.runningHeaderText,
        runningFooter: tpl.runningFooterText,
        style: tpl.headerFooterStyle || 'formal_line',
      },
    };
    setPreviewModalOptions(docOpt);
    setIsPreviewModalOpen(true);
  };

  const filteredDocs = documents.filter(
    (d) =>
      !search ||
      d.NOMOR_DOKUMEN.toLowerCase().includes(search.toLowerCase()) ||
      d.JENIS_DOKUMEN.toLowerCase().includes(search.toLowerCase()) ||
      d.PIHAK_TERKAIT.toLowerCase().includes(search.toLowerCase()) ||
      d.KETERANGAN.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Toast notifications */}
      {(appliedTemplateMsg || batchToastMsg || syncToastMsg) && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slide-in">
          <Check size={16} />
          <span>{appliedTemplateMsg || batchToastMsg || syncToastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileCheck size={20} className="text-purple-700" />
              Document Center & Generator Berita Acara (BA)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
              Auto-Populate & NIP Penandatangan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan Berita Acara otomatis dari data transaksi riil (Pengadaan BOS, Distribusi Guru, Buku Persediaan, Opname, Penghapusan) terintegrasi Asisten AI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Action: Google Sheets Auto-Refresh */}
          <button
            type="button"
            onClick={() => handleRefreshFromSheets(false)}
            disabled={isSyncingData}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors border border-purple-200 flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Muat ulang dan sinkronkan data stok serta aset terkini dari Google Sheets"
          >
            <RefreshCw size={14} className={`text-purple-700 ${isSyncingData ? 'animate-spin' : ''}`} />
            <span>{isSyncingData ? 'Menyinkronkan...' : 'Refresh Data Sheets'}</span>
          </button>

          {/* Quick Action: Batch Status Update */}
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200 flex items-center gap-1.5 shadow-2xs"
            title="Perbarui status, kondisi, atau lokasi banyak aset sekaligus"
          >
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Update Status Massal</span>
            {suggestedCodesFromBA.length > 0 && (
              <span className="bg-emerald-700 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full">
                {suggestedCodesFromBA.length}
              </span>
            )}
          </button>

          {/* 4-Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('GENERATOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'GENERATOR'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} /> Generator BA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TEMPLATES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'TEMPLATES'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark size={14} /> Template Master
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BULK_QR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'BULK_QR'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode size={14} /> Cetak Label & QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REPOSITORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'REPOSITORY'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList size={14} /> Arsip ({documents.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'BULK_QR' ? (
        <BulkQRLabelGenerator onBackToGenerator={() => setActiveTab('GENERATOR')} />
      ) : activeTab === 'TEMPLATES' ? (
        <DocumentTemplateManager
          onApplyTemplate={handleApplyTemplate}
          onPreviewTemplate={handlePreviewTemplate}
        />
      ) : activeTab === 'GENERATOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Transaction Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={16} className="text-purple-700" />
                  1. Pilih Sumber Transaksi
                </span>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  Auto-Fill
                </span>
              </div>

              {/* Source Type Pills - 6 Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSourceType('BARANG_MASUK');
                    setSelectedTxId('');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'BARANG_MASUK'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PackagePlus size={15} className="text-emerald-700 shrink-0" />
                  <div>
                    <div>Belanja Masuk</div>
                    <div className="text-[9px] font-normal text-slate-500">Pengadaan BOS</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('BARANG_KELUAR');
                    setSelectedTxId('');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'BARANG_KELUAR'
                      ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PackageMinus size={15} className="text-blue-700 shrink-0" />
                  <div>
                    <div>Distribusi ATK</div>
                    <div className="text-[9px] font-normal text-slate-500">SPB Guru/Kelas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('STOCK_LEDGER');
                    handleSelectTransaction('STOCK_LEDGER', 'SUMMARY_ALL');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'STOCK_LEDGER'
                      ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet size={15} className="text-teal-700 shrink-0" />
                  <div>
                    <div>Buku Persediaan</div>
                    <div className="text-[9px] font-normal text-slate-500">Stock Ledger</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('ASET');
                    setSelectedTxId('');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'ASET'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Box size={15} className="text-indigo-700 shrink-0" />
                  <div>
                    <div>Aset & Ruangan</div>
                    <div className="text-[9px] font-normal text-slate-500">KIR Inventaris</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('STOCK_OPNAME');
                    setSelectedTxId('');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'STOCK_OPNAME'
                      ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList size={15} className="text-amber-700 shrink-0" />
                  <div>
                    <div>Stock Opname</div>
                    <div className="text-[9px] font-normal text-slate-500">Hasil Fisik</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('PENGHAPUSAN');
                    setSelectedTxId('');
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                    sourceType === 'PENGHAPUSAN'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Flame size={15} className="text-rose-700 shrink-0" />
                  <div>
                    <div>Penghapusan</div>
                    <div className="text-[9px] font-normal text-slate-500">Barang Rusak</div>
                  </div>
                </button>
              </div>

              {/* Transactions List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {sourceType === 'STOCK_LEDGER' ? 'Rekap Saldo & Kartu Stok:' : 'Daftar Transaksi Tersedia:'}
                </span>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {sourceType === 'STOCK_LEDGER' && (
                    <div className="space-y-2">
                      {/* Master Summary Card */}
                      <div
                        onClick={() => handleSelectTransaction('STOCK_LEDGER', 'SUMMARY_ALL')}
                        className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                          selectedTxId === 'SUMMARY_ALL'
                            ? 'bg-teal-100/80 border-teal-500 text-teal-950 shadow-2xs'
                            : 'bg-teal-50/50 hover:bg-teal-50 border-teal-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-teal-900">⚡ Rekap Seluruh Saldo Persediaan</span>
                          <span className="text-[10px] font-mono bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                            {stockSummaryList.length} Item
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-800 mt-1 leading-snug">
                          Rekonsiliasi total barang masuk, distribusi, dan sisa saldo persediaan tahun berjalan.
                        </p>
                      </div>

                      {/* Individual Items */}
                      <div className="text-[10px] font-bold text-slate-400 uppercase pt-1">
                        Atau Pilih Kartu Stok Per Item:
                      </div>
                      {stockSummaryList.map((item) => (
                        <div
                          key={item.KODE_BARANG}
                          onClick={() => handleSelectTransaction('STOCK_LEDGER', item.KODE_BARANG)}
                          className={`p-2.5 rounded-xl cursor-pointer border text-xs transition-all ${
                            selectedTxId === item.KODE_BARANG
                              ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="truncate mr-1">{item.NAMA_BARANG}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                item.STATUS === 'MINIMUM'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Stok: {item.STOK} {item.JENIS_SATUAN}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                            <span className="font-mono">{item.KODE_BARANG}</span>
                            <span>Masuk: {item.TOTAL_MASUK} • Keluar: {item.TOTAL_KELUAR}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sourceType === 'BARANG_MASUK' && (
                    barangMasukList.length > 0 ? (
                      barangMasukList.map((bm) => (
                        <div
                          key={bm.ID}
                          onClick={() => handleSelectTransaction('BARANG_MASUK', bm.ID)}
                          className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                            selectedTxId === bm.ID
                              ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-900">{bm.NAMA_BARANG}</span>
                            <span className="text-[10px] font-mono bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded">
                              {bm.JUMLAH} {bm.JENIS_SATUAN}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>Toko: {bm.NAMA_TOKO || '-'}</span>
                            <span className="font-semibold text-slate-700">
                              Rp {(bm.TOTAL_PENGADAAN || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {bm.TANGGAL} • BKU: {bm.NOMOR_BKU || '-'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada data barang masuk.
                      </div>
                    )
                  )}

                  {sourceType === 'BARANG_KELUAR' && (
                    barangKeluarList.length > 0 ? (
                      barangKeluarList.map((bk) => (
                        <div
                          key={bk.ID}
                          onClick={() => handleSelectTransaction('BARANG_KELUAR', bk.ID)}
                          className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                            selectedTxId === bk.ID
                              ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-blue-950">{bk.NAMA_BARANG}</span>
                            <span className="text-[10px] font-mono bg-blue-100/70 text-blue-800 px-1.5 py-0.5 rounded">
                              {bk.JUMLAH} {bk.JENIS_SATUAN}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            Penerima: <strong>{bk.PENERIMA}</strong> ({bk.UNIT_RUANGAN})
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {bk.TANGGAL} • No: {bk.NOMOR_DOKUMEN || '-'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada barang keluar yang disetujui.
                      </div>
                    )
                  )}

                  {sourceType === 'ASET' && (
                    assetList.length > 0 ? (
                      assetList.map((ast) => {
                        const isChecked = selectedAssetIds.includes(ast.ID);
                        return (
                          <div
                            key={ast.ID}
                            onClick={() => handleToggleAsset(ast)}
                            className={`p-3 rounded-xl cursor-pointer border text-xs transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-1 rounded text-purple-700 focus:ring-purple-600"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-slate-800">{ast.NAMA_BARANG}</div>
                              <div className="text-[11px] text-indigo-800 font-mono font-semibold">
                                {ast.KODE_ASET}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Ruang: {ast.LOKASI} • PJ: {ast.PENANGGUNG_JAWAB}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada data register aset.
                      </div>
                    )
                  )}

                  {sourceType === 'STOCK_OPNAME' && (
                    opnameSessions.length > 0 ? (
                      opnameSessions.map((op) => (
                        <div
                          key={op.ID}
                          onClick={() => handleSelectTransaction('STOCK_OPNAME', op.ID)}
                          className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                            selectedTxId === op.ID
                              ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-amber-950">{op.NOMOR_OPNAME}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              {op.STATUS}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            Lokasi: {op.LOKASI} • Item: {op.JUMLAH_ITEM}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Tanggal: {op.TANGGAL} • Petugas: {op.PETUGAS}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada sesi stock opname.
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: BA Editor & Preview */}
          <div className="lg:col-span-8 space-y-4">
            <form onSubmit={handleCreateAndDownloadPDF} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    2. Rincian & Format Berita Acara Resmi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otomatis dilengkapi kop surat dinas dan NIP penandatangan.
                  </p>
                </div>

                {/* AI Assistant Button */}
                <button
                  type="button"
                  onClick={handleGenerateAINarrative}
                  disabled={isGeneratingAI}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-300 shadow-2xs self-start sm:self-auto"
                >
                  <Sparkles size={14} className={isGeneratingAI ? 'animate-spin text-purple-700' : 'text-purple-700'} />
                  {isGeneratingAI ? 'Menyusun AI...' : '🤖 Sempurnakan Narasi AI (Gemini)'}
                </button>
              </div>

              {aiSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check size={16} className="text-emerald-700 shrink-0" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}

              {/* Title, Doc Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Dokumen Berita Acara
                  </label>
                  <input
                    type="text"
                    required
                    value={judulBA}
                    onChange={(e) => setJudulBA(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold focus:outline-purple-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Dokumen
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalBA}
                    onChange={(e) => setTanggalBA(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-purple-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Surat Dinas Berita Acara
                </label>
                <input
                  type="text"
                  required
                  value={nomorBA}
                  onChange={(e) => setNomorBA(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:outline-purple-700 bg-slate-50"
                />
              </div>

              {/* Legal Opening Clause */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paragraf Pembuka / Konsiderans Serah Terima
                </label>
                <textarea
                  rows={2}
                  required
                  value={deskripsiBA}
                  onChange={(e) => setDeskripsiBA(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-purple-700 leading-relaxed"
                />
              </div>

              {/* Table Data Structure */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Kolom Header Tabel (Pisahkan dengan Koma)
                </label>
                <input
                  type="text"
                  required
                  value={tableHeaders}
                  onChange={(e) => setTableHeaders(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-[11px] focus:outline-purple-700"
                />

                <label className="block text-xs font-bold text-slate-700 mt-2">
                  Baris Item Transaksi (1 Baris = 1 Item, Kolom dipisah Koma)
                </label>
                <textarea
                  rows={4}
                  required
                  value={tableRowsRaw}
                  onChange={(e) => setTableRowsRaw(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-[11px] leading-relaxed focus:outline-purple-700 bg-slate-50"
                />
              </div>

              {/* Closing Clause */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paragraf Penutup Dokumen
                </label>
                <input
                  type="text"
                  value={catatanPenutup}
                  onChange={(e) => setCatatanPenutup(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-purple-700 text-xs"
                />
              </div>

              {/* Google Drive Link Integration */}
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1.5">
                <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <FolderOpen size={15} className="text-purple-700" />
                  Tautkan Berkas Google Drive / Bukti Digital (Opsional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Masukkan link Google Drive untuk mengaitkan berkas scan fisik atau dokumen pendukung.
                </p>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 bg-white focus:outline-purple-700 font-mono"
                />
              </div>

              {/* Signatories with NIP */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={16} className="text-purple-700" />
                    3. Pejabat Penandatangan & NIP Resmi
                  </span>
                  <span className="text-[10px] text-slate-500">Format Dinas Standard</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Left Signer */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Pihak Pertama (Kiri)</span>
                    <input
                      type="text"
                      placeholder="Jabatan Kedinasan"
                      value={jabatanPihak1}
                      onChange={(e) => setJabatanPihak1(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Nama Lengkap & Gelar"
                      required
                      value={namaPihak1}
                      onChange={(e) => setNamaPihak1(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="NIP. 19870921 201001 2 005 (atau '-')"
                      value={nipPihak1}
                      onChange={(e) => setNipPihak1(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>

                  {/* Right Signer */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Pihak Kedua (Kanan)</span>
                    <input
                      type="text"
                      placeholder="Jabatan Kedinasan"
                      value={jabatanPihak2}
                      onChange={(e) => setJabatanPihak2(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Nama Lengkap Pihak Kedua"
                      required
                      value={namaPihak2}
                      onChange={(e) => setNamaPihak2(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="NIP. (atau '-')"
                      value={nipPihak2}
                      onChange={(e) => setNipPihak2(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Headmaster (Mengetahui) */}
                <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-100 space-y-2">
                  <span className="text-xs font-bold text-purple-950 block">Mengetahui: Kepala Sekolah</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={namaMengetahui}
                      onChange={(e) => setNamaMengetahui(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={nipMengetahui}
                      onChange={(e) => setNipMengetahui(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Format Dokumen & Kop Surat Settings */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 size={16} className="text-purple-700" />
                    4. Format Kertas & Kop Surat Dokumen
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    Standar Berkas Dinas & Sekolah
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Paper Size Selector */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block flex items-center gap-1">
                      <Layout size={13} className="text-emerald-600" />
                      Ukuran Kertas:
                    </label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as any)}
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-purple-700"
                    >
                      <option value="a4">A4 Standar (210 × 297 mm)</option>
                      <option value="f4">F4 / Folio (215 × 330 mm) [Dinas]</option>
                      <option value="letter">Letter / Kuarto (216 × 279 mm)</option>
                      <option value="legal">Legal Panjang (216 × 356 mm)</option>
                    </select>
                  </div>

                  {/* Kop Surat Alignment */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block flex items-center gap-1">
                      <Building2 size={13} className="text-blue-600" />
                      Tata Letak Kop Surat:
                    </label>
                    <select
                      value={kopAlignment}
                      onChange={(e) => setKopAlignment(e.target.value as any)}
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-purple-700"
                    >
                      <option value="dual_logo">Logo Ganda (Pemda + Sekolah)</option>
                      <option value="center">Rata Tengah (1 Logo)</option>
                      <option value="left">Rata Kiri Modern</option>
                    </select>
                  </div>

                  {/* Theme & Extras */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block flex items-center gap-1">
                      <ShieldCheck size={13} className="text-purple-600" />
                      Warna & Barcode:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value as any)}
                        className="flex-1 text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-purple-700"
                      >
                        <option value="emerald">Emerald Hijau Dinas</option>
                        <option value="navy">Navy Biru Formal</option>
                        <option value="monochrome">Monokrom Hitam</option>
                        <option value="slate">Slate Gray</option>
                        <option value="amber">Amber / Gold</option>
                      </select>
                      <label
                        className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                        title="Tampilkan QR Code Verifikasi Keaslian Dokumen"
                      >
                        <input
                          type="checkbox"
                          checked={includeVerificationQR}
                          onChange={(e) => setIncludeVerificationQR(e.target.checked)}
                          className="w-3.5 h-3.5 text-purple-700 rounded border-slate-300"
                        />
                        QR
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Preview Modal + Download PDF */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>Kertas aktif: <strong>{paperSize.toUpperCase()}</strong> {paperSize === 'f4' ? '(Folio)' : ''}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPreviewModal}
                    className="px-5 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs shadow-xs transition-all flex items-center gap-2 border border-purple-300"
                  >
                    <Eye size={15} /> Pratinjau Dokumen (Preview Modal)
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Download size={15} /> Terbitkan & Unduh PDF
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Repository Tab */
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari arsip Berita Acara berdasarkan nomor, jenis dokumen, atau nama pihak terkait..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-purple-700 shadow-2xs"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nomor Dokumen</th>
                    <th className="py-3 px-4">Jenis Berita Acara</th>
                    <th className="py-3 px-4">Pihak Penandatangan</th>
                    <th className="py-3 px-4">Berkas Drive</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                      <tr key={doc.ID} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{(doc as any).TANGGAL || doc.TIMESTAMP.split('T')[0]}</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-950 whitespace-nowrap">
                          {doc.NOMOR_DOKUMEN}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold">
                            {doc.JENIS_DOKUMEN.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">{doc.PIHAK_TERKAIT}</td>
                        <td className="py-3 px-4">
                          {doc.FILE_URL ? (
                            <a
                              href={doc.FILE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-semibold"
                            >
                              <ExternalLink size={12} /> Google Drive
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {doc.STATUS}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-colors inline-flex items-center gap-1"
                              title="Pratinjau & Cetak Dokumen"
                            >
                              <Eye size={13} /> Pratinjau
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors inline-flex items-center gap-1"
                              title="Unduh PDF Langsung"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada dokumen Berita Acara yang tersimpan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Berita Acara Live Preview Modal with Paper Size & Kop Customization */}
      {isPreviewModalOpen && (
        <BeritaAcaraPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          options={previewModalOptions || buildCurrentOptions()}
        />
      )}

      {/* Batch Status Update Modal */}
      {isBatchModalOpen && (
        <BatchStatusUpdateModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          currentDocNumber={nomorBA}
          suggestedCodes={suggestedCodesFromBA}
          onSuccess={(msg) => {
            setBatchToastMsg(msg);
            setTimeout(() => setBatchToastMsg(null), 4000);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
