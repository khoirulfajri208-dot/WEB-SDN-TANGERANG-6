export * from './types/index';

import {
  Config,
  User,
  Supplier,
  Item,
  BarangMasuk,
  BarangKeluar,
  Asset,
  Mutasi,
  Pemeliharaan,
  Penghapusan,
  StockOpnameScan,
  StockSummaryItem,
  StockLedgerEntry,
  AuditTrail,
  DocumentIndex,
} from './types/index';

// Compatibility aliases
export type MutasiAset = Mutasi & {
  ASET_ID?: string;
  LOKASI_LAMA?: string;
  LOKASI_BARU?: string;
  PJ_LAMA?: string;
  PJ_BARU?: string;
  NOMOR_BA_MUTASI?: string;
  ALASAN_MUTASI?: string;
};

export type PemeliharaanAset = Pemeliharaan & {
  ASET_ID?: string;
  URAIAN_KERUSAKAN?: string;
  BENGKEL_PELAKSANA?: string;
  KONDISI_SETELAH?: string;
};

export type PenghapusanAset = Penghapusan & {
  ASET_ID?: string;
  NOMOR_BA_PENGHAPUSAN?: string;
  ALASAN_PENGHAPUSAN?: string;
  METODE?: string;
  STATUS_PERSETUJUAN?: string;
};

export type StockOpname = StockOpnameScan & {
  NOMOR_OPNAME?: string;
  TANGGAL?: string;
  ITEMS?: any[];
};

export type StockSummary = StockSummaryItem;
export type StockLedger = StockLedgerEntry;
export type AuditLog = AuditTrail & {
  ACTION?: string;
  MODULE?: string;
  USER_NAME?: string;
  DETAILS?: string;
};

export type DocumentRecord = DocumentIndex & {
  PIHAK_TERKAIT?: string;
  DATA?: any;
};

export type AppConfig = Config & {
  INSTITUTION_NAME?: string;
  INSTITUTION_ADDRESS?: string;
  CITY?: string;
  FISCAL_YEAR?: string;
  DOC_NUMBER_PREFIX?: string;
  HEADMASTER_NAME?: string;
  HEADMASTER_NIP?: string;
  TREASURER_NAME?: string;
  TREASURER_NIP?: string;
  CHIEF_STAFF_NAME?: string;
  CHIEF_STAFF_NIP?: string;
};
