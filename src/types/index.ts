export interface Config {
  SCHOOL_NAME: string;
  SCHOOL_NPSN: string;
  ADDRESS: string;
  HEADMASTER: string;
  HEADMASTER_NIP?: string;
  TREASURER: string;
  TREASURER_NIP?: string;
  WAREHOUSE_OFFICER: string;
  WAREHOUSE_OFFICER_NIP?: string;
  REPORT_SIGNATURE_CITY: string;
  REQUIRE_APPROVAL: 'YA' | 'TIDAK';
  BACKUP_AUTO: 'YA' | 'TIDAK';
  BACKUP_FOLDER: string;
  STOCK_MIN_ALERT: 'YA' | 'TIDAK';
  AUTO_SYNC_ENABLED?: 'YA' | 'TIDAK';
  AUTO_SYNC_INTERVAL_MINUTES?: number;
  REALTIME_SYNC_ENABLED?: 'YA' | 'TIDAK';
  SECURITY_PIN?: string;
  SCHOOL_LOGO_URL?: string;
  CITY_LOGO_URL?: string;
  SCHOOL_EMAIL?: string;
  SCHOOL_WEBSITE?: string;
  BA_DEFAULT_CITY?: string;
  BA_SHOW_DOCUMENTATION?: 'YA' | 'TIDAK';
  QR_PROVIDER?: string;
  PUBLIC_WEB_TITLE?: string;
  PUBLIC_WEB_WELCOME_TITLE?: string;
  PUBLIC_WEB_WELCOME_DESC?: string;
  PUBLIC_WEB_HERO_IMAGE?: string;
  PUBLIC_WEB_VISI?: string;
  PUBLIC_WEB_MISI?: string;
  PUBLIC_WEB_FOOTER_DESC?: string;
  SYSTEM_THEME?: 'classic_blue' | 'luxury_gold' | 'emerald_nature' | 'dark_violet' | 'crimson_scholastic';
  SYSTEM_THEME_MODE?: 'light' | 'dark' | 'high_contrast';
}

export interface User {
  ID: string;
  NIP: string;
  NAMA: string;
  GELAR?: string;
  EMAIL: string;
  ROLE: 'ADMIN' | 'BENDAHARA' | 'KEPALA SEKOLAH' | 'OPERATOR' | 'GURU' | 'AUDITOR' | 'STAFF';
  STATUS: 'AKTIF' | 'NONAKTIF';
  JABATAN?: string;
  GOLONGAN_RUANG?: string;
  TELEPON?: string;
}

export interface Supplier {
  ID: string;
  NAMA_TOKO: string;
  ALAMAT: string;
  TELEPON: string;
  NARAHUBUNG: string;
  STATUS: 'AKTIF' | 'NONAKTIF';
}

export interface Item {
  ID: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  KATEGORI: string;
  JENIS_SATUAN: string;
  TIPE: string;
  KODE_REKENING_RKAS?: string;
  BATAS_MINIMUM: number;
  MINIMUM_STOK?: number;
  LOKASI_DEFAULT: string;
  STATUS: 'AKTIF' | 'NONAKTIF';
  HARGA_ESTIMASI?: number;
  HARGA_STANDAR?: number;
  SUMBER_DANA_DEFAULT?: string;
  MERK?: string;
  SPESIFIKASI?: string;
}

export interface BarangMasuk {
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  BULAN_PENGADAAN?: string;
  NAMA_TOKO: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  KATEGORI?: string;
  JUMLAH: number;
  JENIS_SATUAN: string;
  HARGA_SATUAN: number;
  TOTAL_PENGADAAN: number;
  TOTAL_HARGA?: number;
  NAMA_SEKOLAH: string;
  SUMBER_ANGGARAN: string;
  SUMBER_DANA?: string;
  KODE_REKENING_RKAS: string;
  NOMOR_BKU: string;
  NOMOR_KWITANSI: string;
  FOTO_LINK?: string;
  PENERIMA?: string;
  PETUGAS: string;
  KETERANGAN: string;
  STOCK_SYNC_STATUS?: string;
  STOCK_SYNC_AT?: string;
}

export interface BarangKeluar {
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  KATEGORI?: string;
  JUMLAH: number;
  JENIS_SATUAN: string;
  TOTAL_NILAI?: number;
  PENERIMA: string;
  PENERIMA_NIP?: string;
  NIP_PENERIMA?: string;
  UNIT_RUANGAN: string;
  PERUNTUKAN?: string;
  TUJUAN_PENGGUNAAN: string;
  PETUGAS: string;
  PETUGAS_GUDANG?: string;
  FOTO_LINK?: string;
  PARAF_LINK?: string;
  KETERANGAN: string;
  STATUS_TRANSAKSI: 'MENUNGGU_PERSETUJUAN' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';
  NOMOR_DOKUMEN: string;
  DISETUJUI_OLEH?: string;
  WAKTU_PERSETUJUAN?: string;
  CATATAN_PERSETUJUAN?: string;
  STOCK_SYNC_STATUS?: string;
  STOCK_SYNC_AT?: string;
}

export interface Asset {
  ID: string;
  KODE_ASET: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  KATEGORI?: string;
  KIB_KATEGORI?: string;
  TAHUN_PEROLEHAN?: string;
  SUB_KEGIATAN: string;
  KODE_REKENING: string;
  KODE_LOKASI: string;
  TANGGAL_BKU: string;
  NOMOR_BKU: string;
  NOMOR_KWITANSI: string;
  NAMA_TOKO: string;
  NAMA_BARANG_RKAS: string;
  MERK: string;
  SPESIFIKASI: string;
  MERK_SPESIFIKASI?: string;
  JUMLAH: number;
  JENIS_SATUAN: string;
  HARGA_SATUAN: number;
  HARGA_PEROLEHAN?: number;
  TOTAL_NILAI: number;
  NILAI_BUKU?: number;
  LOKASI: string;
  PENANGGUNG_JAWAB: string;
  SUMBER_PEROLEHAN?: string;
  KONDISI: 'BAIK' | 'RUSAK RINGAN' | 'RUSAK BERAT';
  STATUS: 'AKTIF' | 'TIDAK AKTIF' | 'DIHAPUS';
  FOTO_LINK?: string;
  KETERANGAN?: string;
  QR_TOKEN?: string;
  QR_URL?: string;
  QR_TARGET_URL?: string;
  QR_TYPE?: 'DETAIL_ASSET' | 'LINK' | 'CUSTOM';
  DRIVE_FILE_URL?: string;
}

export interface Mutasi {
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  KODE_BARANG: string;
  KODE_ASET: string;
  NAMA_BARANG: string;
  DARI_LOKASI: string;
  KE_LOKASI: string;
  DARI_PJ: string;
  KE_PJ: string;
  PETUGAS: string;
  FOTO_LINK?: string;
  ALASAN: string;
  KETERANGAN: string;
}

export interface StockOpnameSession {
  ID: string;
  TIMESTAMP: string;
  NOMOR_OPNAME: string;
  TANGGAL: string;
  LOKASI: string;
  PETUGAS: string;
  STATUS: 'DRAFT' | 'FINAL';
  JUMLAH_ITEM: number;
  TOTAL_SELSIH: number;
  CATATAN?: string;
}

export interface StockOpnameScan {
  ID: string;
  SESSION_ID: string;
  TIMESTAMP: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  STOK_SISTEM: number;
  STOK_FISIK: number;
  SELISIH: number;
  JENIS_SATUAN: string;
  LOKASI: string;
  FOTO_LINK?: string;
  PETUGAS: string;
  STATUS: string;
  KETERANGAN?: string;
}

export interface Pemeliharaan {
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  KODE_ASET: string;
  NAMA_BARANG: string;
  JENIS_PEMELIHARAAN: string;
  BIAYA: number;
  PENYEDIA: string;
  STATUS: 'DIAJUKAN' | 'PROSES' | 'SELESAI' | 'BATAL';
  PETUGAS: string;
  KETERANGAN: string;
}

export interface Penghapusan {
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  KODE_ASET: string;
  NAMA_BARANG: string;
  ALASAN: string;
  KONDISI_AKHIR: string;
  DOKUMEN?: string;
  STATUS: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI';
  PETUGAS: string;
  KETERANGAN: string;
}

export interface PengambilanATK {
  NO: number;
  ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  NIP: string;
  NAMA_LENGKAP: string;
  JABATAN: string;
  NAMA_BARANG: string;
  FOTO_BUKTI_LINK?: string;
  PARAF_LINK?: string;
  PETUGAS: string;
  KETERANGAN?: string;
}

export interface StockLedgerEntry {
  LEDGER_ID: string;
  TIMESTAMP: string;
  TANGGAL: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  JENIS_SATUAN: string;
  QTY_IN: number;
  QTY_OUT: number;
  SALDO_SESUDAH: number;
  REF_TYPE: string;
  REF_ID: string;
  NOMOR_DOKUMEN: string;
  STATUS: string;
  SOURCE: string;
  LEDGER_KEY: string;
  JENIS_MUTASI?: string;
  KETERANGAN?: string;
  MASUK?: number;
  KELUAR?: number;
  SALDO_AKHIR?: number;
}

export interface StockSummaryItem {
  KODE_BARANG: string;
  NAMA_BARANG: string;
  JENIS_SATUAN: string;
  TOTAL_MASUK: number;
  TOTAL_KELUAR: number;
  TOTAL_ADJUSTMENT: number;
  STOK: number;
  BATAS_MINIMUM: number;
  LAST_MOVEMENT?: string;
  UPDATED_AT?: string;
  STATUS: 'AMAN' | 'MINIMUM';
}

export interface ProcurementPlan {
  ID: string;
  TIMESTAMP: string;
  NOMOR_RENCANA: string;
  PERIODE: string;
  STATUS: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';
  DIAJUKAN_OLEH: string;
  DISETUJUI_OLEH?: string;
  WAKTU_PERSETUJUAN?: string;
  CATATAN?: string;
}

export interface ProcurementPlanDetail {
  ID: string;
  PLAN_ID: string;
  KODE_BARANG: string;
  NAMA_BARANG: string;
  STOK_SAAT_INI: number;
  BATAS_MINIMUM: number;
  RATA2_KELUAR_BULANAN: number;
  LEAD_TIME_HARI: number;
  TARGET_STOK: number;
  REKOMENDASI_QTY: number;
  ESTIMASI_HARGA: number;
  ESTIMASI_TOTAL: number;
  CATATAN?: string;
  JENIS_SATUAN?: string;
}

export interface DocumentIndex {
  ID: string;
  TIMESTAMP: string;
  JENIS_DOKUMEN: string;
  NOMOR_DOKUMEN: string;
  PERIODE: string;
  MODULE: string;
  RECORD_ID: string;
  FILE_ID?: string;
  FILE_URL?: string;
  STATUS: string;
  DIBUAT_OLEH: string;
  KETERANGAN: string;
}

export interface AuditTrail {
  ID: string;
  TIMESTAMP: string;
  AKSI: string;
  MODUL: string;
  RECORD_ID: string;
  USER_EMAIL: string;
  DATA_JSON: string;
}

export interface NotificationItem {
  ID: string;
  TIMESTAMP: string;
  USER_EMAIL: string;
  TYPE: string;
  TITLE: string;
  MESSAGE: string;
  MODULE: string;
  RECORD_ID: string;
  READ_AT?: string;
  STATUS: 'UNREAD' | 'READ';
}

export interface BATemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  versionTag?: string;
  timestamp: string;
  author: string;
  summary: string;
  snapshot: BATemplate;
}

export interface BATemplate {
  id: string;
  name: string;
  category: 'PENGADAAN' | 'MUTASI' | 'PENGHAPUSAN' | 'PEMERIKSAAN' | 'STOCK_OPNAME' | 'SERAH_TERIMA' | 'LAINNYA';
  description?: string;
  isSystem?: boolean;
  createdAt: string;
  updatedAt?: string;
  versionCount?: number;

  // Custom institution & address fields
  institutionName?: string;
  institutionAddress?: string;
  institutionNpsn?: string;
  institutionCity?: string;
  institutionAgency?: string; // e.g. "DINAS PENDIDIKAN"
  governingBody?: string; // e.g. "PEMERINTAH KOTA TANGERANG"
  institutionEmail?: string;
  institutionWebsite?: string;

  // Document metadata defaults
  title: string;
  docNumberPattern?: string; // e.g. "020/{NO}/BAST-INV/{YEAR}"
  openingClause: string;
  closingClause: string;
  defaultHeaders: string[];
  defaultSampleRows?: (string | number)[][];

  // Signatories defaults
  leftSignerTitle: string;
  leftSignerName?: string;
  leftSignerNip?: string;
  rightSignerTitle: string;
  rightSignerName?: string;
  rightSignerNip?: string;
  centerSignerTitle?: string;
  centerSignerName?: string;
  centerSignerNip?: string;
  includeHeadmaster?: boolean;

  // Layout & Formatting defaults
  paperSize: 'a4' | 'f4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  kopAlignment: 'dual_logo' | 'center' | 'left';
  kopBorderStyle: 'double' | 'single' | 'bold' | 'none';
  themeColor: 'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber';
  fontFamily: 'helvetica' | 'times' | 'courier';
  tableDensity: 'compact' | 'normal' | 'spacious';
  includeVerificationQR: boolean;
  autoPageNumbering?: boolean;
  pageNumberPosition?: 'bottom_center' | 'bottom_right' | 'top_right';
  headerFooterStyle?: 'formal_line' | 'minimal' | 'boxed' | 'none';
  runningHeaderText?: string;
  runningFooterText?: string;
  watermark?: string;
}

export interface AppTask {
  ID: string;
  TYPE: 'APPROVAL' | 'STOCK' | 'OPNAME' | 'TASK';
  TITLE: string;
  DESCRIPTION: string;
  MODULE: string;
  RECORD_ID: string;
  DUE_DATE: string;
  PRIORITY: 'HIGH' | 'MEDIUM' | 'LOW';
  STATUS: 'OPEN' | 'DONE';
}

export interface ARKASAccount {
  KODE_REKENING: string;
  NAMA_REKENING: string;
  KATEGORI_BELANJA: 'OPERASIONAL' | 'MODAL_ASET' | 'JASA' | 'PEMELIHARAAN' | 'MODAL';
  SUMBER_DANA: string;
  PAGU_ANGGARAN: number;
  REALISASI: number;
  SISA_ANGGARAN: number;
  STATUS: 'AKTIF' | 'NONAKTIF';
  DESKRIPSI?: string;
}

export interface AssetDepreciation {
  ID: string;
  KODE_ASET: string;
  NAMA_BARANG: string;
  KATEGORI_SAP: 'PERALATAN_MESIN' | 'GEDUNG_BANGUNAN' | 'KENDARAAN' | 'MEBELAIR' | 'BUKU' | 'ASET_LAIN';
  TANGGAL_PEROLEHAN: string;
  HARGA_PEROLEHAN: number;
  MASA_MANFAAT_TAHUN: number;
  PERSENTASE_PENYUSUTAN: number;
  NILAI_RESIDU: number;
  UMUR_BERJALAN_BULAN: number;
  PENYUSUTAN_PER_TAHUN: number;
  AKUMULASI_PENYUSUTAN: number;
  NILAI_BUKU: number;
  STATUS_PENYUSUTAN: 'BERJALAN' | 'HABIS_MANFAAT';
  LOKASI: string;
  KONDISI: string;
}

export interface SchoolUnitConsolidation {
  ID: string;
  NPSN: string;
  NAMA_SEKOLAH: string;
  JENJANG: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'DINAS';
  KECAMATAN: string;
  KEPALA_SEKOLAH: string;
  BENDAHARA: string;
  TOTAL_NILAI_ASET: number;
  TOTAL_NILAI_PERSEDIAAN: number;
  TOTAL_ITEM_ASET: number;
  TOTAL_ITEM_PERSEDIAAN: number;
  STATUS_SINKRON: 'TERHUBUNG' | 'BELUM_SYNC' | 'MENUNGGU';
  TERAKHIR_SINKRON: string;
  KONDISI_BAIK_PCT: number;
  KONDISI_RUSAK_PCT: number;
  PENYERAPAN_BOS_PCT: number;
}

export interface QRStickerPreset {
  ID: string;
  NAME: string;
  DESCRIPTION?: string;
  IS_SYSTEM?: boolean;
  CREATED_AT: string;
  SIZE: 'standard' | 'compact' | 'small' | 'large';
  LAYOUT_MODE: 'landscape_left' | 'landscape_right' | 'portrait_top' | 'badge' | 'compact';
  COLOR_THEME: 'emerald' | 'navy' | 'slate' | 'monochrome' | 'amber' | 'burgundy';
  BORDER_STYLE: 'double' | 'single' | 'rounded' | 'none';
  FONT_SIZE_SCALE: number;
  QR_SIZE_RATIO: 'compact' | 'normal' | 'large';
  QR_FG_COLOR?: string;
  QR_ERROR_CORRECTION?: 'L' | 'M' | 'Q' | 'H';
  INCLUDE_LOGO_IN_QR?: boolean;
  LOGO_SOURCE?: 'school' | 'city' | 'tutwuri' | 'custom';
  CUSTOM_LOGO_URL?: string;
  SHOW_KOP: boolean;
  KOP_TEXT: string;
  SHOW_SCHOOL_NAME: boolean;
  SHOW_NPSN: boolean;
  SHOW_ASSET_CODE: boolean;
  SHOW_ASSET_NAME: boolean;
  SHOW_CATEGORY: boolean;
  SHOW_SPECIFICATION: boolean;
  SHOW_LOCATION: boolean;
  SHOW_PJ: boolean;
  SHOW_NIP: boolean;
  SHOW_YEAR: boolean;
  SHOW_CONDITION: boolean;
  SHOW_PRICE: boolean;
}

export interface PublicMediaItem {
  id: string;
  title: string;
  category: 'ESKUL' | 'PRESTASI';
  description: string;
  photoUrl: string;
  youtubeUrl: string;
  dateOrYear?: string;
}

export type ActivePage =
  | 'dashboard'
  | 'master'
  | 'pegawai'
  | 'supplier'
  | 'barang_masuk'
  | 'barang_keluar'
  | 'pengambilan_atk'
  | 'persediaan'
  | 'stock_ledger'
  | 'aset'
  | 'asset_lifecycle'
  | 'depresiasi_aset'
  | 'mutasi'
  | 'stock_opname'
  | 'pemeliharaan'
  | 'penghapusan'
  | 'procurement_planner'
  | 'arkas_siplah'
  | 'konsolidasi_sekolah'
  | 'document_center'
  | 'laporan'
  | 'audit'
  | 'control_center'
  | 'config'
  | 'google_sheets_sync';

export interface DailyScanDeliveryLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  targetEmail: string;
  targetName: string;
  totalScans: number;
  pdfFileName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  serviceUsed: 'GMAIL_API' | 'APPS_SCRIPT' | 'SERVER_INTEGRATION' | 'GOOGLE_DRIVE' | 'CLIENT_AUTOMATION';
  driveFileUrl?: string;
  messageId?: string;
  error?: string;
}

export interface DailyScanScheduleConfig {
  enabled: boolean;
  time: string; // e.g. '15:00'
  targetEmail: string;
  targetName: string;
  includeStudentAttendance: boolean;
  includeAssetScans: boolean;
  includeAssignmentScans: boolean;
  includeStockOpname: boolean;
  autoDriveBackup: boolean;
  lastSentDate?: string;
  lastSentTimestamp?: string;
}




