import {
  Config,
  User,
  Supplier,
  Item,
  BarangMasuk,
  BarangKeluar,
  Asset,
  Mutasi,
  StockOpnameSession,
  StockOpnameScan,
  Pemeliharaan,
  Penghapusan,
  PengambilanATK,
  StockLedgerEntry,
  StockSummaryItem,
  ProcurementPlan,
  ProcurementPlanDetail,
  DocumentIndex,
  AuditTrail,
  NotificationItem,
  AppTask,
  ARKASAccount,
  AssetDepreciation,
  SchoolUnitConsolidation,
  QRStickerPreset,
  BATemplate,
  BATemplateVersion,
  PublicMediaItem,
  DailyScanDeliveryLog,
  DailyScanScheduleConfig,
} from '../types';
import {
  DATASET_VERSION,
  OFFICIAL_CONFIG,
  OFFICIAL_USERS,
  OFFICIAL_SUPPLIERS,
  OFFICIAL_ITEMS,
  OFFICIAL_BARANG_MASUK,
  OFFICIAL_BARANG_KELUAR,
  OFFICIAL_ASSETS,
  OFFICIAL_ARKAS_ACCOUNTS,
} from '../data/officialSchoolData';

const STORAGE_KEYS = {
  CONFIG: 'BB_CONFIG',
  USERS: 'BB_USERS',
  SUPPLIERS: 'BB_SUPPLIERS',
  ITEMS: 'BB_ITEMS',
  BARANG_MASUK: 'BB_BARANG_MASUK',
  BARANG_KELUAR: 'BB_BARANG_KELUAR',
  ASSETS: 'BB_ASSETS',
  MUTASI: 'BB_MUTASI',
  STOCK_OPNAME_SESSIONS: 'BB_STOCK_OPNAME_SESSIONS',
  STOCK_OPNAME_SCANS: 'BB_STOCK_OPNAME_SCANS',
  PEMELIHARAAN: 'BB_PEMELIHARAAN',
  PENGHAPUSAN: 'BB_PENGHAPUSAN',
  PENGAMBILAN_ATK: 'BB_PENGAMBILAN_ATK',
  STOCK_LEDGER: 'BB_STOCK_LEDGER',
  PROCUREMENT_PLANS: 'BB_PROCUREMENT_PLANS',
  PROCUREMENT_PLAN_DETAILS: 'BB_PROCUREMENT_PLAN_DETAILS',
  DOCUMENTS: 'BB_DOCUMENTS',
  AUDIT: 'BB_AUDIT',
  NOTIFICATIONS: 'BB_NOTIFICATIONS',
  ACTIVE_USER: 'BB_ACTIVE_USER',
  GOOGLE_CLIENT_ID: 'BB_GOOGLE_CLIENT_ID',
  GOOGLE_SHEET_ID: 'BB_GOOGLE_SHEET_ID',
  GOOGLE_ACCESS_TOKEN: 'BB_GOOGLE_ACCESS_TOKEN',
  APPS_SCRIPT_URL: 'BB_APPS_SCRIPT_URL',
  LAST_SYNC: 'BB_LAST_SYNC',
  ARKAS_ACCOUNTS: 'BB_ARKAS_ACCOUNTS',
  CONSOLIDATED_SCHOOLS: 'BB_CONSOLIDATED_SCHOOLS',
  THERMAL_SETTINGS: 'BB_THERMAL_SETTINGS',
  QR_STICKER_PRESETS: 'BB_QR_STICKER_PRESETS',
  BA_TEMPLATES: 'BB_BA_TEMPLATES',
  BA_TEMPLATE_VERSIONS: 'BB_BA_TEMPLATE_VERSIONS',
  PUBLIC_MEDIA_ITEMS: 'BB_PUBLIC_MEDIA_ITEMS',
  DATASET_VERSION: 'BB_DATASET_VERSION',
  DAILY_SCAN_LOGS: 'SDN6_DAILY_SCAN_LOGS',
  DAILY_SCAN_CONFIG: 'SDN6_DAILY_SCAN_CONFIG',
};

const DEFAULT_CONFIG: Config = OFFICIAL_CONFIG;
const DEFAULT_USERS: User[] = OFFICIAL_USERS;
const DEFAULT_SUPPLIERS: Supplier[] = OFFICIAL_SUPPLIERS;
const DEFAULT_ITEMS: Item[] = OFFICIAL_ITEMS;
const DEFAULT_BARANG_MASUK: BarangMasuk[] = OFFICIAL_BARANG_MASUK;
const DEFAULT_BARANG_KELUAR: BarangKeluar[] = OFFICIAL_BARANG_KELUAR;
const DEFAULT_ASSETS: Asset[] = OFFICIAL_ASSETS;
const DEFAULT_ARKAS_ACCOUNTS: ARKASAccount[] = OFFICIAL_ARKAS_ACCOUNTS;

const DEFAULT_PUBLIC_MEDIA: PublicMediaItem[] = [
  {
    id: 'PUB-MED-01',
    title: 'Pramuka Penggalang & Siaga SDN Tangerang 6',
    category: 'ESKUL',
    description: 'Kegiatan latihan rutin kepramukaan mingguan untuk membentuk disiplin, kemandirian, dan karakter gotong royong peserta didik.',
    photoUrl: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&q=80&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    dateOrYear: 'Tahun Ajaran 2025/2026',
  },
  {
    id: 'PUB-MED-02',
    title: 'Seni Tari Tradisional Betawi & Nusantara',
    category: 'ESKUL',
    description: 'Pelatihan tari tradisional untuk melestarikan kebudayaan lokal Banten dan Betawi, rutin tampil dalam acara perpisahan dan lomba seni.',
    photoUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    dateOrYear: 'Rutin Setiap Jumat',
  },
  {
    id: 'PUB-MED-03',
    title: 'Juara 1 Lomba Cerdas Cermat Tingkat Kota Tangerang',
    category: 'PRESTASI',
    description: 'Tim Cerdas Cermat SDN Tangerang 6 berhasil meraih Juara 1 tingkat Kota Tangerang dalam ajang Kompetisi Sains & Literasi Siswa SD.',
    photoUrl: 'https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?auto=format&fit=crop&q=80&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    dateOrYear: 'Desember 2025',
  },
  {
    id: 'PUB-MED-04',
    title: 'Festival Tunas Bahasa Ibu (FTBI) - Juara Mendongeng Bahasa Sunda',
    category: 'PRESTASI',
    description: 'Siswa perwakilan SDN Tangerang 6 sukses meraih juara pertama mendongeng daerah, membanggakan UPT Dinas Pendidikan Kota Tangerang.',
    photoUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    dateOrYear: 'November 2025',
  },
];

class LocalStorageService {
  private cache: Record<string, any> = {};

  constructor() {
    this.initDatabase();
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (this.cache[key] !== undefined) {
      return this.cache[key] as T;
    }
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      const parsed = JSON.parse(data) as T;
      this.cache[key] = parsed;
      return parsed;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T, notify = true): void {
    try {
      this.cache[key] = value;
      localStorage.setItem(key, JSON.stringify(value));
      if (notify && typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key } }));
        }, 0);
      }
    } catch (e) {
      console.error(`Error saving to localStorage [${key}]:`, e);
    }
  }

  public clearCache(): void {
    this.cache = {};
  }

  public subscribe(callback: (key: string) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ key: string }>;
      callback(custom.detail?.key || '');
    };
    window.addEventListener('bb_storage_sync', handler);
    return () => {
      window.removeEventListener('bb_storage_sync', handler);
    };
  }

  // --- Initialization & Reset ---
  public initDatabase(): void {
    const currentDatasetVersion = localStorage.getItem(STORAGE_KEYS.DATASET_VERSION);
    const existingConfig = this.getConfig();

    // Auto-migrate if first run, or if previous dataset was placeholder 'SD Negeri 1 Nusantara' or older version
    if (
      !currentDatasetVersion ||
      currentDatasetVersion !== DATASET_VERSION ||
      existingConfig.SCHOOL_NAME === 'SD Negeri 1 Nusantara' ||
      !existingConfig.HEADMASTER_NIP ||
      existingConfig.HEADMASTER_NIP.includes('19680412') // Old demo NIP
    ) {
      this.loadOfficialSchoolData(false);
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.setItem(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    
    // Self-healing check for empty arrays to prevent blank database issues
    const getStoredLength = (key: string): number => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    };

    if (!localStorage.getItem(STORAGE_KEYS.USERS) || getStoredLength(STORAGE_KEYS.USERS) === 0) {
      this.setItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || getStoredLength(STORAGE_KEYS.SUPPLIERS) === 0) {
      this.setItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS) || getStoredLength(STORAGE_KEYS.ITEMS) === 0) {
      this.setItem(STORAGE_KEYS.ITEMS, DEFAULT_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BARANG_MASUK) || getStoredLength(STORAGE_KEYS.BARANG_MASUK) === 0) {
      this.setItem(STORAGE_KEYS.BARANG_MASUK, DEFAULT_BARANG_MASUK);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BARANG_KELUAR) || getStoredLength(STORAGE_KEYS.BARANG_KELUAR) === 0) {
      this.setItem(STORAGE_KEYS.BARANG_KELUAR, DEFAULT_BARANG_KELUAR);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS) || getStoredLength(STORAGE_KEYS.ASSETS) === 0) {
      this.setItem(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ARKAS_ACCOUNTS) || getStoredLength(STORAGE_KEYS.ARKAS_ACCOUNTS) === 0) {
      this.setItem(STORAGE_KEYS.ARKAS_ACCOUNTS, DEFAULT_ARKAS_ACCOUNTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
      this.setItem(STORAGE_KEYS.ACTIVE_USER, DEFAULT_USERS[3] || DEFAULT_USERS[0]);
    }
    this.rebuildStockLedger();
  }

  public loadOfficialSchoolData(notify = true): void {
    this.setItem(STORAGE_KEYS.CONFIG, OFFICIAL_CONFIG, notify);
    this.setItem(STORAGE_KEYS.USERS, OFFICIAL_USERS, notify);
    this.setItem(STORAGE_KEYS.SUPPLIERS, OFFICIAL_SUPPLIERS, notify);
    this.setItem(STORAGE_KEYS.ITEMS, OFFICIAL_ITEMS, notify);
    this.setItem(STORAGE_KEYS.BARANG_MASUK, OFFICIAL_BARANG_MASUK, notify);
    this.setItem(STORAGE_KEYS.BARANG_KELUAR, OFFICIAL_BARANG_KELUAR, notify);
    this.setItem(STORAGE_KEYS.ASSETS, OFFICIAL_ASSETS, notify);
    this.setItem(STORAGE_KEYS.ARKAS_ACCOUNTS, OFFICIAL_ARKAS_ACCOUNTS, notify);
    this.setItem(STORAGE_KEYS.ACTIVE_USER, OFFICIAL_USERS[3] || OFFICIAL_USERS[0], notify);
    localStorage.setItem(STORAGE_KEYS.DATASET_VERSION, DATASET_VERSION);
    this.rebuildStockLedger();
    this.logAudit('IMPORT', 'DATABASE', 'OFFICIAL_DATA_SEED', { version: DATASET_VERSION });
  }

  // --- Active User ---
  public getActiveUser(): User {
    return this.getItem<User>(STORAGE_KEYS.ACTIVE_USER, DEFAULT_USERS[4]);
  }

  public setActiveUser(user: User): void {
    this.setItem(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // --- Config ---
  public getConfig(): Config {
    const cfg = this.getItem<Config>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    let changed = false;
    if (!cfg.SCHOOL_NPSN || cfg.SCHOOL_NPSN === '20606016' || cfg.SCHOOL_NPSN === '20606621') {
      cfg.SCHOOL_NPSN = '20606498';
      changed = true;
    }
    if (!cfg.CITY_LOGO_URL) {
      cfg.CITY_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Lambang_Daerah_Kota_Tangerang.png';
      changed = true;
    }
    if (!cfg.SCHOOL_LOGO_URL) {
      cfg.SCHOOL_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo-Tut-Wuri-Handayani-PNG-Warna.png';
      changed = true;
    }
    if (changed) {
      this.setItem(STORAGE_KEYS.CONFIG, cfg);
    }
    return cfg;
  }

  public saveConfig(config: Partial<Config>): Config {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    this.setItem(STORAGE_KEYS.CONFIG, updated);
    this.logAudit('UPDATE', 'CONFIG', 'APP_CONFIG', updated);
    return updated;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  public saveUser(user: Partial<User>): User {
    const users = this.getUsers();
    let saved: User;
    if (user.ID) {
      const idx = users.findIndex((u) => u.ID === user.ID);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user } as User;
        saved = users[idx];
      } else {
        saved = { ...user, ID: user.ID } as User;
        users.push(saved);
      }
    } else {
      const nextNum = users.length + 1;
      saved = {
        ID: `USR-${String(nextNum).padStart(4, '0')}`,
        NIP: user.NIP || '',
        NAMA: user.NAMA || '',
        EMAIL: user.EMAIL || '',
        ROLE: user.ROLE || 'GURU',
        STATUS: user.STATUS || 'AKTIF',
        JABATAN: user.JABATAN || 'Guru',
      };
      users.push(saved);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
    this.logAudit(user.ID ? 'UPDATE' : 'CREATE', 'USERS', saved.ID, saved);
    return saved;
  }

  public deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.ID !== id);
    this.setItem(STORAGE_KEYS.USERS, users);
    this.logAudit('DELETE', 'USERS', id, { deletedId: id });
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
  }

  public saveSupplier(supplier: Partial<Supplier>): Supplier {
    const list = this.getSuppliers();
    let saved: Supplier;
    if (supplier.ID) {
      const idx = list.findIndex((s) => s.ID === supplier.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...supplier } as Supplier;
        saved = list[idx];
      } else {
        saved = { ...supplier, ID: supplier.ID } as Supplier;
        list.push(saved);
      }
    } else {
      const nextNum = list.length + 1;
      saved = {
        ID: `SUP-${String(nextNum).padStart(4, '0')}`,
        NAMA_TOKO: supplier.NAMA_TOKO || '',
        ALAMAT: supplier.ALAMAT || '',
        TELEPON: supplier.TELEPON || '',
        NARAHUBUNG: supplier.NARAHUBUNG || '',
        STATUS: supplier.STATUS || 'AKTIF',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.SUPPLIERS, list);
    this.logAudit(supplier.ID ? 'UPDATE' : 'CREATE', 'SUPPLIERS', saved.ID, saved);
    return saved;
  }

  public deleteSupplier(id: string): void {
    const list = this.getSuppliers().filter((s) => s.ID !== id);
    this.setItem(STORAGE_KEYS.SUPPLIERS, list);
    this.logAudit('DELETE', 'SUPPLIERS', id, { id });
  }

  // --- Items (Master Barang) ---
  public getItems(): Item[] {
    return this.getItem<Item[]>(STORAGE_KEYS.ITEMS, DEFAULT_ITEMS);
  }

  public saveItem(item: Partial<Item>): Item {
    const list = this.getItems();
    let saved: Item;
    if (item.ID) {
      const idx = list.findIndex((i) => i.ID === item.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item } as Item;
        saved = list[idx];
      } else {
        saved = { ...item, ID: item.ID } as Item;
        list.push(saved);
      }
    } else {
      const nextNum = list.length + 1;
      saved = {
        ID: `ITM-${String(nextNum).padStart(4, '0')}`,
        KODE_BARANG: item.KODE_BARANG || `BRG-${String(nextNum).padStart(4, '0')}`,
        NAMA_BARANG: item.NAMA_BARANG || '',
        KATEGORI: item.KATEGORI || 'Umum',
        JENIS_SATUAN: item.JENIS_SATUAN || 'Pcs',
        TIPE: item.TIPE || 'Habis Pakai',
        KODE_REKENING_RKAS: item.KODE_REKENING_RKAS || '',
        BATAS_MINIMUM: Number(item.BATAS_MINIMUM) || 5,
        LOKASI_DEFAULT: item.LOKASI_DEFAULT || 'Gudang Utama',
        STATUS: item.STATUS || 'AKTIF',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.ITEMS, list);
    this.logAudit(item.ID ? 'UPDATE' : 'CREATE', 'ITEMS', saved.ID, saved);
    this.rebuildStockLedger();
    return saved;
  }

  public deleteItem(id: string): void {
    const list = this.getItems().filter((i) => i.ID !== id);
    this.setItem(STORAGE_KEYS.ITEMS, list);
    this.logAudit('DELETE', 'ITEMS', id, { id });
    this.rebuildStockLedger();
  }

  // --- Barang Masuk ---
  public getBarangMasuk(): BarangMasuk[] {
    return this.getItem<BarangMasuk[]>(STORAGE_KEYS.BARANG_MASUK, DEFAULT_BARANG_MASUK);
  }

  public createBarangMasuk(data: Partial<BarangMasuk>): BarangMasuk {
    const list = this.getBarangMasuk();
    const nextNum = list.length + 1;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const id = `BM-${now.getFullYear()}-${String(nextNum).padStart(4, '0')}`;

    const jumlah = Number(data.JUMLAH) || 0;
    const harga = Number(data.HARGA_SATUAN) || 0;
    const total = jumlah * harga;

    const saved: BarangMasuk = {
      ID: id,
      TIMESTAMP: timestamp,
      TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
      BULAN_PENGADAAN: data.BULAN_PENGADAAN || now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      NAMA_TOKO: data.NAMA_TOKO || '',
      KODE_BARANG: data.KODE_BARANG || '',
      NAMA_BARANG: data.NAMA_BARANG || '',
      JUMLAH: jumlah,
      JENIS_SATUAN: data.JENIS_SATUAN || 'Pcs',
      HARGA_SATUAN: harga,
      TOTAL_PENGADAAN: total,
      NAMA_SEKOLAH: data.NAMA_SEKOLAH || this.getConfig().SCHOOL_NAME,
      SUMBER_ANGGARAN: data.SUMBER_ANGGARAN || 'BOS Reguler',
      KODE_REKENING_RKAS: data.KODE_REKENING_RKAS || '',
      NOMOR_BKU: data.NOMOR_BKU || '',
      NOMOR_KWITANSI: data.NOMOR_KWITANSI || '',
      FOTO_LINK: data.FOTO_LINK || '',
      PETUGAS: data.PETUGAS || this.getActiveUser().NAMA,
      KETERANGAN: data.KETERANGAN || '',
      STOCK_SYNC_STATUS: 'SYNCED',
      STOCK_SYNC_AT: timestamp,
    };

    list.push(saved);
    this.setItem(STORAGE_KEYS.BARANG_MASUK, list);
    this.logAudit('CREATE', 'BARANG_MASUK', saved.ID, saved);
    this.rebuildStockLedger();
    return saved;
  }

  // --- Barang Keluar (with approval and stock deduction) ---
  public getBarangKeluar(): BarangKeluar[] {
    return this.getItem<BarangKeluar[]>(STORAGE_KEYS.BARANG_KELUAR, DEFAULT_BARANG_KELUAR);
  }

  public createBarangKeluar(data: {
    TANGGAL: string;
    PENERIMA: string;
    PENERIMA_NIP?: string;
    UNIT_RUANGAN: string;
    TUJUAN_PENGGUNAAN: string;
    KETERANGAN?: string;
    FOTO_LINK?: string;
    PARAF_LINK?: string;
    ITEMS: Array<{
      KODE_BARANG: string;
      NAMA_BARANG: string;
      JUMLAH: number;
      JENIS_SATUAN: string;
    }>;
  }): { count: number; docNo: string; items: BarangKeluar[] } {
    const config = this.getConfig();
    const requireApproval = config.REQUIRE_APPROVAL === 'YA';
    const status = requireApproval ? 'MENUNGGU_PERSETUJUAN' : 'DISETUJUI';
    const activeUser = this.getActiveUser();

    const now = new Date();
    const dateCode = (data.TANGGAL || now.toISOString().slice(0, 10)).replace(/-/g, '');
    const currentList = this.getBarangKeluar();
    const docSeq = String(currentList.length + 1).padStart(4, '0');
    const docNo = `BK-${dateCode}-${docSeq}`;
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const createdItems: BarangKeluar[] = [];

    // Stock verification
    const currentStockMap = this.getStockMap();
    for (const item of data.ITEMS) {
      const avail = currentStockMap[item.KODE_BARANG] || 0;
      if (item.JUMLAH > avail) {
        throw new Error(
          `Stok untuk ${item.NAMA_BARANG} (${item.KODE_BARANG}) tidak mencukupi! Tersedia: ${avail} ${item.JENIS_SATUAN}, diminta: ${item.JUMLAH}`
        );
      }
    }

    for (let i = 0; i < data.ITEMS.length; i++) {
      const itm = data.ITEMS[i];
      const id = `BK-${now.getFullYear()}-${String(currentList.length + i + 1).padStart(4, '0')}`;
      const record: BarangKeluar = {
        ID: id,
        TIMESTAMP: timestamp,
        TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
        KODE_BARANG: itm.KODE_BARANG,
        NAMA_BARANG: itm.NAMA_BARANG,
        JUMLAH: Number(itm.JUMLAH) || 1,
        JENIS_SATUAN: itm.JENIS_SATUAN,
        PENERIMA: data.PENERIMA,
        PENERIMA_NIP: data.PENERIMA_NIP || '',
        UNIT_RUANGAN: data.UNIT_RUANGAN,
        TUJUAN_PENGGUNAAN: data.TUJUAN_PENGGUNAAN,
        PETUGAS: activeUser.NAMA,
        FOTO_LINK: data.FOTO_LINK || '',
        PARAF_LINK: data.PARAF_LINK || '',
        KETERANGAN: data.KETERANGAN || '',
        STATUS_TRANSAKSI: status,
        NOMOR_DOKUMEN: docNo,
        DISETUJUI_OLEH: !requireApproval ? activeUser.NAMA : undefined,
        WAKTU_PERSETUJUAN: !requireApproval ? timestamp : undefined,
        STOCK_SYNC_STATUS: status === 'DISETUJUI' ? 'SYNCED' : 'PENDING',
        STOCK_SYNC_AT: timestamp,
      };
      createdItems.push(record);
      currentList.push(record);
    }

    this.setItem(STORAGE_KEYS.BARANG_KELUAR, currentList);
    this.logAudit('CREATE', 'BARANG_KELUAR', docNo, { docNo, itemsCount: createdItems.length, status });
    this.rebuildStockLedger();

    return { count: createdItems.length, docNo, items: createdItems };
  }

  public approveBarangKeluar(nomorDokumen: string, catatan = ''): void {
    const list = this.getBarangKeluar();
    const activeUser = this.getActiveUser();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let updated = 0;
    list.forEach((item) => {
      if (item.NOMOR_DOKUMEN === nomorDokumen || item.ID === nomorDokumen) {
        item.STATUS_TRANSAKSI = 'DISETUJUI';
        item.DISETUJUI_OLEH = activeUser.NAMA;
        item.WAKTU_PERSETUJUAN = now;
        item.CATATAN_PERSETUJUAN = catatan;
        item.STOCK_SYNC_STATUS = 'SYNCED';
        item.STOCK_SYNC_AT = now;
        updated++;
      }
    });

    if (updated > 0) {
      this.setItem(STORAGE_KEYS.BARANG_KELUAR, list);
      this.logAudit('APPROVE', 'BARANG_KELUAR', nomorDokumen, { nomorDokumen, catatan });
      this.rebuildStockLedger();
    }
  }

  public rejectBarangKeluar(nomorDokumen: string, catatan = ''): void {
    const list = this.getBarangKeluar();
    list.forEach((item) => {
      if (item.NOMOR_DOKUMEN === nomorDokumen || item.ID === nomorDokumen) {
        item.STATUS_TRANSAKSI = 'DITOLAK';
        item.CATATAN_PERSETUJUAN = catatan;
      }
    });
    this.setItem(STORAGE_KEYS.BARANG_KELUAR, list);
    this.logAudit('REJECT', 'BARANG_KELUAR', nomorDokumen, { nomorDokumen, catatan });
    this.rebuildStockLedger();
  }

  // --- Pengambilan ATK (Special Teacher Receipts) ---
  public getPengambilanATK(): PengambilanATK[] {
    return this.getItem<PengambilanATK[]>(STORAGE_KEYS.PENGAMBILAN_ATK, []);
  }

  public createPengambilanATK(data: {
    TANGGAL: string;
    NIP: string;
    NAMA_LENGKAP: string;
    JABATAN: string;
    KETERANGAN?: string;
    FOTO_BUKTI_LINK?: string;
    PARAF_LINK?: string;
    ITEMS: Array<{ NAMA_BARANG: string }>;
  }): { count: number; no: number } {
    const list = this.getPengambilanATK();
    const nextNo = list.length > 0 ? Math.max(...list.map((r) => r.NO)) + 1 : 1;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const activeUser = this.getActiveUser();

    for (let i = 0; i < data.ITEMS.length; i++) {
      const itm = data.ITEMS[i];
      const entry: PengambilanATK = {
        NO: nextNo,
        ID: `ATK-${now.getFullYear()}-${String(list.length + i + 1).padStart(4, '0')}`,
        TIMESTAMP: timestamp,
        TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
        NIP: data.NIP,
        NAMA_LENGKAP: data.NAMA_LENGKAP,
        JABATAN: data.JABATAN,
        NAMA_BARANG: itm.NAMA_BARANG,
        FOTO_BUKTI_LINK: data.FOTO_BUKTI_LINK || '',
        PARAF_LINK: data.PARAF_LINK || '',
        PETUGAS: activeUser.NAMA,
        KETERANGAN: data.KETERANGAN || '',
      };
      list.push(entry);
    }

    this.setItem(STORAGE_KEYS.PENGAMBILAN_ATK, list);
    this.logAudit('CREATE', 'PENGAMBILAN_ATK', String(nextNo), { no: nextNo, itemsCount: data.ITEMS.length });
    return { count: data.ITEMS.length, no: nextNo };
  }

  // --- Assets & Inventory ---
  public getAssets(): Asset[] {
    return this.getItem<Asset[]>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
  }

  public saveAsset(asset: Partial<Asset>): Asset {
    const list = this.getAssets();
    let saved: Asset;
    const now = new Date();
    if (asset.ID) {
      const idx = list.findIndex((a) => a.ID === asset.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...asset } as Asset;
        saved = list[idx];
      } else {
        saved = { ...asset, ID: asset.ID } as Asset;
        list.push(saved);
      }
    } else {
      const nextNum = list.length + 1;
      const code = asset.KODE_ASET || `ASET-${now.getFullYear()}-${String(nextNum).padStart(4, '0')}`;
      const qty = Number(asset.JUMLAH) || 1;
      const harga = Number(asset.HARGA_SATUAN) || 0;
      saved = {
        ID: `AST-${String(nextNum).padStart(4, '0')}`,
        KODE_ASET: code,
        KODE_BARANG: asset.KODE_BARANG || '',
        NAMA_BARANG: asset.NAMA_BARANG || '',
        SUB_KEGIATAN: asset.SUB_KEGIATAN || 'Pengadaan Sarana & Prasarana',
        KODE_REKENING: asset.KODE_REKENING || '',
        KODE_LOKASI: asset.KODE_LOKASI || '',
        TANGGAL_BKU: asset.TANGGAL_BKU || now.toISOString().slice(0, 10),
        NOMOR_BKU: asset.NOMOR_BKU || '',
        NOMOR_KWITANSI: asset.NOMOR_KWITANSI || '',
        NAMA_TOKO: asset.NAMA_TOKO || '',
        NAMA_BARANG_RKAS: asset.NAMA_BARANG_RKAS || '',
        MERK: asset.MERK || '',
        SPESIFIKASI: asset.SPESIFIKASI || '',
        JUMLAH: qty,
        JENIS_SATUAN: asset.JENIS_SATUAN || 'Unit',
        HARGA_SATUAN: harga,
        TOTAL_NILAI: qty * harga,
        LOKASI: asset.LOKASI || 'Gudang Utama',
        PENANGGUNG_JAWAB: asset.PENANGGUNG_JAWAB || this.getConfig().WAREHOUSE_OFFICER,
        KONDISI: asset.KONDISI || 'BAIK',
        STATUS: asset.STATUS || 'AKTIF',
        FOTO_LINK: asset.FOTO_LINK || '',
        KETERANGAN: asset.KETERANGAN || '',
        QR_TOKEN: code,
        QR_TYPE: 'DETAIL_ASSET',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.ASSETS, list);
    this.logAudit(asset.ID ? 'UPDATE' : 'CREATE', 'ASET', saved.KODE_ASET, saved);
    return saved;
  }

  public deleteAsset(id: string): void {
    const list = this.getAssets().filter((a) => a.ID !== id && a.KODE_ASET !== id);
    this.setItem(STORAGE_KEYS.ASSETS, list);
    this.logAudit('DELETE', 'ASET', id, { id });
  }

  // --- Mutasi Aset ---
  public getMutasi(): Mutasi[] {
    return this.getItem<Mutasi[]>(STORAGE_KEYS.MUTASI, []);
  }

  public createMutasi(data: Partial<Mutasi>): Mutasi {
    const list = this.getMutasi();
    const now = new Date();
    const id = `MUT-${now.getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const record: Mutasi = {
      ID: id,
      TIMESTAMP: timestamp,
      TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
      KODE_BARANG: data.KODE_BARANG || '',
      KODE_ASET: data.KODE_ASET || '',
      NAMA_BARANG: data.NAMA_BARANG || '',
      DARI_LOKASI: data.DARI_LOKASI || '',
      KE_LOKASI: data.KE_LOKASI || '',
      DARI_PJ: data.DARI_PJ || '',
      KE_PJ: data.KE_PJ || '',
      PETUGAS: data.PETUGAS || this.getActiveUser().NAMA,
      FOTO_LINK: data.FOTO_LINK || '',
      ALASAN: data.ALASAN || '',
      KETERANGAN: data.KETERANGAN || '',
    };

    list.push(record);
    this.setItem(STORAGE_KEYS.MUTASI, list);

    // Update asset location and custodian if KODE_ASET provided
    if (data.KODE_ASET) {
      const assets = this.getAssets();
      const ast = assets.find((a) => a.KODE_ASET === data.KODE_ASET);
      if (ast) {
        if (data.KE_LOKASI) ast.LOKASI = data.KE_LOKASI;
        if (data.KE_PJ) ast.PENANGGUNG_JAWAB = data.KE_PJ;
        this.setItem(STORAGE_KEYS.ASSETS, assets);
      }
    }

    this.logAudit('CREATE', 'MUTASI', id, record);
    return record;
  }

  // --- Stock Opname Sessions & Scans ---
  public getStockOpnameSessions(): StockOpnameSession[] {
    return this.getItem<StockOpnameSession[]>(STORAGE_KEYS.STOCK_OPNAME_SESSIONS, []);
  }

  public getStockOpnameScans(sessionId?: string): StockOpnameScan[] {
    const list = this.getItem<StockOpnameScan[]>(STORAGE_KEYS.STOCK_OPNAME_SCANS, []);
    if (sessionId) {
      return list.filter((s) => s.SESSION_ID === sessionId);
    }
    return list;
  }

  public startOpnameSession(lokasi = 'Semua Ruang', catatan = ''): StockOpnameSession {
    const sessions = this.getStockOpnameSessions();
    const now = new Date();
    const ym = now.toISOString().slice(0, 7).replace('-', '');
    const nomor = `SO-${ym}-${String(sessions.length + 1).padStart(4, '0')}`;
    const id = `SOS-${Date.now()}`;
    const session: StockOpnameSession = {
      ID: id,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      NOMOR_OPNAME: nomor,
      TANGGAL: now.toISOString().slice(0, 10),
      LOKASI: lokasi,
      PETUGAS: this.getActiveUser().NAMA,
      STATUS: 'DRAFT',
      JUMLAH_ITEM: 0,
      TOTAL_SELSIH: 0,
      CATATAN: catatan,
    };
    sessions.push(session);
    this.setItem(STORAGE_KEYS.STOCK_OPNAME_SESSIONS, sessions);
    this.logAudit('CREATE', 'STOCK_OPNAME_SESSION', nomor, session);
    return session;
  }

  public recordOpnameScan(data: {
    SESSION_ID: string;
    KODE_BARANG: string;
    NAMA_BARANG: string;
    STOK_FISIK: number;
    JENIS_SATUAN: string;
    LOKASI?: string;
    KETERANGAN?: string;
  }): StockOpnameScan {
    const scans = this.getStockOpnameScans();
    const stockMap = this.getStockMap();
    const stokSistem = stockMap[data.KODE_BARANG] || 0;
    const selisih = Number(data.STOK_FISIK) - stokSistem;

    const record: StockOpnameScan = {
      ID: `SCAN-${Date.now()}`,
      SESSION_ID: data.SESSION_ID,
      TIMESTAMP: new Date().toISOString().replace('T', ' ').substring(0, 19),
      KODE_BARANG: data.KODE_BARANG,
      NAMA_BARANG: data.NAMA_BARANG,
      STOK_SISTEM: stokSistem,
      STOK_FISIK: Number(data.STOK_FISIK),
      SELISIH: selisih,
      JENIS_SATUAN: data.JENIS_SATUAN,
      LOKASI: data.LOKASI || 'Gudang',
      PETUGAS: this.getActiveUser().NAMA,
      STATUS: 'DRAFT',
      KETERANGAN: data.KETERANGAN || '',
    };

    scans.push(record);
    this.setItem(STORAGE_KEYS.STOCK_OPNAME_SCANS, scans);

    // update session aggregates
    const sessions = this.getStockOpnameSessions();
    const sess = sessions.find((s) => s.ID === data.SESSION_ID);
    if (sess) {
      const sessionScans = scans.filter((s) => s.SESSION_ID === data.SESSION_ID);
      sess.JUMLAH_ITEM = sessionScans.length;
      sess.TOTAL_SELSIH = sessionScans.reduce((sum, s) => sum + s.SELISIH, 0);
      this.setItem(STORAGE_KEYS.STOCK_OPNAME_SESSIONS, sessions);
    }

    return record;
  }

  public finalizeOpnameSession(sessionId: string): StockOpnameSession {
    const sessions = this.getStockOpnameSessions();
    const sess = sessions.find((s) => s.ID === sessionId);
    if (!sess) throw new Error('Sesi opname tidak ditemukan.');
    sess.STATUS = 'FINAL';
    this.setItem(STORAGE_KEYS.STOCK_OPNAME_SESSIONS, sessions);
    this.logAudit('FINALIZE', 'STOCK_OPNAME_SESSION', sess.NOMOR_OPNAME, sess);
    return sess;
  }

  // --- Pemeliharaan & Penghapusan ---
  public getPemeliharaan(): Pemeliharaan[] {
    return this.getItem<Pemeliharaan[]>(STORAGE_KEYS.PEMELIHARAAN, []);
  }

  public createPemeliharaan(data: Partial<Pemeliharaan>): Pemeliharaan {
    const list = this.getPemeliharaan();
    const now = new Date();
    const id = `MNT-${now.getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;
    const record: Pemeliharaan = {
      ID: id,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
      KODE_ASET: data.KODE_ASET || '',
      NAMA_BARANG: data.NAMA_BARANG || '',
      JENIS_PEMELIHARAAN: data.JENIS_PEMELIHARAAN || 'Servis Rutin',
      BIAYA: Number(data.BIAYA) || 0,
      PENYEDIA: data.PENYEDIA || '',
      STATUS: data.STATUS || 'SELESAI',
      PETUGAS: data.PETUGAS || this.getActiveUser().NAMA,
      KETERANGAN: data.KETERANGAN || '',
    };
    list.push(record);
    this.setItem(STORAGE_KEYS.PEMELIHARAAN, list);
    this.logAudit('CREATE', 'PEMELIHARAAN', id, record);
    return record;
  }

  public getPenghapusan(): Penghapusan[] {
    return this.getItem<Penghapusan[]>(STORAGE_KEYS.PENGHAPUSAN, []);
  }

  public createPenghapusan(data: Partial<Penghapusan>): Penghapusan {
    const list = this.getPenghapusan();
    const now = new Date();
    const id = `DEL-${now.getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;
    const record: Penghapusan = {
      ID: id,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      TANGGAL: data.TANGGAL || now.toISOString().slice(0, 10),
      KODE_ASET: data.KODE_ASET || '',
      NAMA_BARANG: data.NAMA_BARANG || '',
      ALASAN: data.ALASAN || 'Rusak Berat & Usang',
      KONDISI_AKHIR: data.KONDISI_AKHIR || 'RUSAK BERAT',
      DOKUMEN: data.DOKUMEN || '',
      STATUS: 'DISETUJUI',
      PETUGAS: data.PETUGAS || this.getActiveUser().NAMA,
      KETERANGAN: data.KETERANGAN || '',
    };
    list.push(record);
    this.setItem(STORAGE_KEYS.PENGHAPUSAN, list);

    // Update asset status
    if (data.KODE_ASET) {
      const assets = this.getAssets();
      const ast = assets.find((a) => a.KODE_ASET === data.KODE_ASET);
      if (ast) {
        ast.STATUS = 'DIHAPUS';
        ast.KONDISI = 'RUSAK BERAT';
        this.setItem(STORAGE_KEYS.ASSETS, assets);
      }
    }

    this.logAudit('CREATE', 'PENGHAPUSAN', id, record);
    return record;
  }

  // --- Procurement Plans ---
  public getProcurementPlans(): ProcurementPlan[] {
    return this.getItem<ProcurementPlan[]>(STORAGE_KEYS.PROCUREMENT_PLANS, []);
  }

  public getProcurementPlanDetails(): ProcurementPlanDetail[] {
    return this.getItem<ProcurementPlanDetail[]>(STORAGE_KEYS.PROCUREMENT_PLAN_DETAILS, []);
  }

  public createProcurementPlan(data: {
    PERIODE: string;
    CATATAN?: string;
    ITEMS: Array<{
      KODE_BARANG: string;
      NAMA_BARANG: string;
      STOK_SAAT_INI: number;
      BATAS_MINIMUM: number;
      RATA2_KELUAR_BULANAN: number;
      LEAD_TIME_HARI: number;
      TARGET_STOK: number;
      REKOMENDASI_QTY: number;
      ESTIMASI_HARGA: number;
      JENIS_SATUAN: string;
      CATATAN?: string;
    }>;
  }): { id: string; nomorRencana: string } {
    const plans = this.getProcurementPlans();
    const details = this.getProcurementPlanDetails();
    const now = new Date();
    const ym = now.toISOString().slice(0, 7).replace('-', '');
    const nomor = `RN-${ym}-${String(plans.length + 1).padStart(4, '0')}`;
    const planId = `PLN-${Date.now()}`;

    const plan: ProcurementPlan = {
      ID: planId,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      NOMOR_RENCANA: nomor,
      PERIODE: data.PERIODE || now.toISOString().slice(0, 7),
      STATUS: 'DIAJUKAN',
      DIAJUKAN_OLEH: this.getActiveUser().NAMA,
      CATATAN: data.CATATAN || '',
    };
    plans.push(plan);

    for (const itm of data.ITEMS) {
      const detail: ProcurementPlanDetail = {
        ID: `PND-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        PLAN_ID: planId,
        KODE_BARANG: itm.KODE_BARANG,
        NAMA_BARANG: itm.NAMA_BARANG,
        STOK_SAAT_INI: itm.STOK_SAAT_INI,
        BATAS_MINIMUM: itm.BATAS_MINIMUM,
        RATA2_KELUAR_BULANAN: itm.RATA2_KELUAR_BULANAN,
        LEAD_TIME_HARI: itm.LEAD_TIME_HARI,
        TARGET_STOK: itm.TARGET_STOK,
        REKOMENDASI_QTY: itm.REKOMENDASI_QTY,
        ESTIMASI_HARGA: itm.ESTIMASI_HARGA,
        ESTIMASI_TOTAL: itm.REKOMENDASI_QTY * itm.ESTIMASI_HARGA,
        CATATAN: itm.CATATAN || '',
        JENIS_SATUAN: itm.JENIS_SATUAN,
      };
      details.push(detail);
    }

    this.setItem(STORAGE_KEYS.PROCUREMENT_PLANS, plans);
    this.setItem(STORAGE_KEYS.PROCUREMENT_PLAN_DETAILS, details);
    this.logAudit('CREATE', 'PROCUREMENT_PLAN', nomor, { nomor, itemsCount: data.ITEMS.length });
    return { id: planId, nomorRencana: nomor };
  }

  // --- Document Index ---
  public getDocuments(): DocumentIndex[] {
    return this.getItem<DocumentIndex[]>(STORAGE_KEYS.DOCUMENTS, []);
  }

  public recordDocument(doc: Partial<DocumentIndex>): DocumentIndex {
    const list = this.getDocuments();
    const now = new Date();
    const record: DocumentIndex = {
      ID: `DOC-${Date.now()}`,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      JENIS_DOKUMEN: doc.JENIS_DOKUMEN || 'BERITA_ACARA',
      NOMOR_DOKUMEN: doc.NOMOR_DOKUMEN || `BA-${Date.now()}`,
      PERIODE: doc.PERIODE || now.toISOString().slice(0, 7),
      MODULE: doc.MODULE || 'GENERAL',
      RECORD_ID: doc.RECORD_ID || '',
      FILE_ID: doc.FILE_ID || '',
      FILE_URL: doc.FILE_URL || '',
      STATUS: 'FINAL',
      DIBUAT_OLEH: this.getActiveUser().NAMA,
      KETERANGAN: doc.KETERANGAN || '',
    };
    list.push(record);
    this.setItem(STORAGE_KEYS.DOCUMENTS, list);
    return record;
  }

  // --- Stock Ledger & Materialized Summary Calculation ---
  public calculateStockLedgerAndSummary(): { ledgerEntries: StockLedgerEntry[]; summary: StockSummaryItem[] } {
    const items = this.getItems();
    const incoming = this.getBarangMasuk();
    const outgoing = this.getBarangKeluar();

    interface EventItem {
      date: string;
      timestamp: string;
      code: string;
      name: string;
      unit: string;
      qtyIn: number;
      qtyOut: number;
      refType: string;
      refId: string;
      docNo: string;
      status: string;
    }

    const events: EventItem[] = [];

    // Collect incoming
    incoming.forEach((bm) => {
      if (bm.JUMLAH > 0) {
        events.push({
          date: bm.TANGGAL,
          timestamp: bm.TIMESTAMP,
          code: bm.KODE_BARANG,
          name: bm.NAMA_BARANG,
          unit: bm.JENIS_SATUAN,
          qtyIn: bm.JUMLAH,
          qtyOut: 0,
          refType: 'BARANG_MASUK',
          refId: bm.ID,
          docNo: bm.NOMOR_KWITANSI || bm.NOMOR_BKU || bm.ID,
          status: 'DISETUJUI',
        });
      }
    });

    // Collect outgoing (only approved)
    outgoing.forEach((bk) => {
      if (bk.JUMLAH > 0 && bk.STATUS_TRANSAKSI === 'DISETUJUI') {
        events.push({
          date: bk.TANGGAL,
          timestamp: bk.TIMESTAMP,
          code: bk.KODE_BARANG,
          name: bk.NAMA_BARANG,
          unit: bk.JENIS_SATUAN,
          qtyIn: 0,
          qtyOut: bk.JUMLAH,
          refType: 'BARANG_KELUAR',
          refId: bk.ID,
          docNo: bk.NOMOR_DOKUMEN || bk.ID,
          status: 'DISETUJUI',
        });
      }
    });

    // Sort chronologically: Date ASC -> IN before OUT -> ID ASC
    events.sort((a, b) => {
      const dDiff = a.date.localeCompare(b.date);
      if (dDiff !== 0) return dDiff;
      if (a.qtyIn > 0 && b.qtyOut > 0) return -1;
      if (a.qtyOut > 0 && b.qtyIn > 0) return 1;
      return a.timestamp.localeCompare(b.timestamp);
    });

    const runningBalance: Record<string, number> = {};
    const ledgerEntries: StockLedgerEntry[] = [];
    const summaryMap: Record<
      string,
      {
        in: number;
        out: number;
        adj: number;
        lastMovement: string;
      }
    > = {};

    events.forEach((ev) => {
      const code = ev.code;
      const current = runningBalance[code] || 0;
      const newBal = current + ev.qtyIn - ev.qtyOut;
      runningBalance[code] = newBal;

      if (!summaryMap[code]) {
        summaryMap[code] = { in: 0, out: 0, adj: 0, lastMovement: ev.date };
      }
      summaryMap[code].in += ev.qtyIn;
      summaryMap[code].out += ev.qtyOut;
      summaryMap[code].lastMovement = ev.date;

      ledgerEntries.push({
        LEDGER_ID: `LED-${ledgerEntries.length + 1}`,
        TIMESTAMP: ev.timestamp,
        TANGGAL: ev.date,
        KODE_BARANG: ev.code,
        NAMA_BARANG: ev.name,
        JENIS_SATUAN: ev.unit,
        QTY_IN: ev.qtyIn,
        QTY_OUT: ev.qtyOut,
        SALDO_SESUDAH: newBal,
        REF_TYPE: ev.refType,
        REF_ID: ev.refId,
        NOMOR_DOKUMEN: ev.docNo,
        STATUS: ev.status,
        SOURCE: 'REBUILD',
        LEDGER_KEY: `${ev.refType}|${ev.refId}|${ev.code}`,
      });
    });

    // Build complete summary for all master items
    const summaryList: StockSummaryItem[] = items.map((itm) => {
      const st = summaryMap[itm.KODE_BARANG] || { in: 0, out: 0, adj: 0, lastMovement: '' };
      const currentStock = runningBalance[itm.KODE_BARANG] || 0;
      return {
        KODE_BARANG: itm.KODE_BARANG,
        NAMA_BARANG: itm.NAMA_BARANG,
        JENIS_SATUAN: itm.JENIS_SATUAN,
        TOTAL_MASUK: st.in,
        TOTAL_KELUAR: st.out,
        TOTAL_ADJUSTMENT: st.adj,
        STOK: currentStock,
        BATAS_MINIMUM: itm.BATAS_MINIMUM,
        LAST_MOVEMENT: st.lastMovement,
        UPDATED_AT: new Date().toISOString(),
        STATUS: currentStock <= itm.BATAS_MINIMUM ? 'MINIMUM' : 'AMAN',
      };
    });

    return { ledgerEntries, summary: summaryList };
  }

  public rebuildStockLedger(): { ledgerCount: number; summary: StockSummaryItem[] } {
    const res = this.calculateStockLedgerAndSummary();
    this.setItem(STORAGE_KEYS.STOCK_LEDGER, res.ledgerEntries, false);
    return { ledgerCount: res.ledgerEntries.length, summary: res.summary };
  }

  public getStockLedger(kodeBarang?: string): StockLedgerEntry[] {
    const res = this.calculateStockLedgerAndSummary();
    if (!kodeBarang) return res.ledgerEntries;
    return res.ledgerEntries.filter((l) => l.KODE_BARANG === kodeBarang);
  }

  public getStockSummary(): StockSummaryItem[] {
    return this.calculateStockLedgerAndSummary().summary;
  }

  public getStockMap(): Record<string, number> {
    const summary = this.getStockSummary();
    const map: Record<string, number> = {};
    summary.forEach((s) => {
      map[s.KODE_BARANG] = s.STOK;
    });
    return map;
  }

  // --- Audit Trail ---
  public getAuditTrail(): AuditTrail[] {
    return this.getItem<AuditTrail[]>(STORAGE_KEYS.AUDIT, []);
  }

  public logAudit(aksi: string, modul: string, recordId: string, data: unknown): void {
    const list = this.getAuditTrail();
    const now = new Date();
    const entry: AuditTrail = {
      ID: `AUD-${Date.now()}`,
      TIMESTAMP: now.toISOString().replace('T', ' ').substring(0, 19),
      AKSI: aksi,
      MODUL: modul,
      RECORD_ID: recordId,
      USER_EMAIL: this.getActiveUser().EMAIL || 'admin@school.id',
      DATA_JSON: JSON.stringify(data),
    };
    list.unshift(entry);
    if (list.length > 500) list.pop();
    this.setItem(STORAGE_KEYS.AUDIT, list);
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const notif = list.find((n) => n.ID === id);
    if (notif) {
      notif.STATUS = 'READ';
      notif.READ_AT = new Date().toISOString();
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsRead(): void {
    const list = this.getNotifications();
    const now = new Date().toISOString();
    list.forEach((n) => {
      n.STATUS = 'READ';
      n.READ_AT = now;
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public addNotification(notif: { title: string; message: string; type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'; link?: string }): void {
    const list = this.getNotifications();
    const item: NotificationItem = {
      ID: `NOTIF-${Date.now()}`,
      TITLE: notif.title,
      MESSAGE: notif.message,
      TYPE: notif.type || 'INFO',
      TIMESTAMP: new Date().toISOString(),
      STATUS: 'UNREAD',
      USER_EMAIL: this.getActiveUser()?.EMAIL || 'system@sdntangerang6.sch.id',
      MODULE: 'SCAN_SCHEDULER',
      RECORD_ID: notif.link || 'DAILY_SCAN',
    };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 50));
  }

  // --- Today's Tasks ---
  public getTodayTasks(): AppTask[] {
    const tasks: AppTask[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const bkList = this.getBarangKeluar();
    const stockSummary = this.getStockSummary();

    // 1. Pending approvals
    const pendingBk = bkList.filter((bk) => bk.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN');
    const groupedPending: Record<string, BarangKeluar[]> = {};
    pendingBk.forEach((bk) => {
      groupedPending[bk.NOMOR_DOKUMEN] = groupedPending[bk.NOMOR_DOKUMEN] || [];
      groupedPending[bk.NOMOR_DOKUMEN].push(bk);
    });

    Object.keys(groupedPending).forEach((docNo) => {
      const items = groupedPending[docNo];
      tasks.push({
        ID: `TSK-APP-${docNo}`,
        TYPE: 'APPROVAL',
        TITLE: `Persetujuan Dokumen ${docNo}`,
        DESCRIPTION: `${items.length} item dimohon oleh ${items[0].PENERIMA} (${items[0].UNIT_RUANGAN})`,
        MODULE: 'barang_keluar',
        RECORD_ID: docNo,
        DUE_DATE: today,
        PRIORITY: 'HIGH',
        STATUS: 'OPEN',
      });
    });

    // 2. Minimum stock alerts
    stockSummary
      .filter((s) => s.STATUS === 'MINIMUM')
      .forEach((s) => {
        tasks.push({
          ID: `TSK-STK-${s.KODE_BARANG}`,
          TYPE: 'STOCK',
          TITLE: `Stok Kritis: ${s.NAMA_BARANG}`,
          DESCRIPTION: `Sisa ${s.STOK} ${s.JENIS_SATUAN} (Batas minimum: ${s.BATAS_MINIMUM}). Perlu pengadaan.`,
          MODULE: 'procurement_planner',
          RECORD_ID: s.KODE_BARANG,
          DUE_DATE: today,
          PRIORITY: 'MEDIUM',
          STATUS: 'OPEN',
        });
      });

    return tasks;
  }

  // --- Google Sheets Integration State ---
  public getGoogleClientId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
  }

  public setGoogleClientId(clientId: string | null): void {
    if (clientId && clientId.trim()) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, clientId.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
    }
  }

  public getAppsScriptUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL);
  }

  public setAppsScriptUrl(url: string | null): void {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.APPS_SCRIPT_URL);
    }
  }

  public getConnectedGoogleSheetId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_ID);
  }

  public setConnectedGoogleSheetId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_SHEET_ID);
    }
  }

  public getGoogleAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
  }

  public setGoogleAccessToken(token: string | null): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
    }
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  public setLastSyncTime(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // --- Full Database Export & Import ---
  public exportFullJson(): string {
    const payload = {
      version: '8.1.6',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      users: this.getUsers(),
      suppliers: this.getSuppliers(),
      items: this.getItems(),
      barangMasuk: this.getBarangMasuk(),
      barangKeluar: this.getBarangKeluar(),
      assets: this.getAssets(),
      mutasi: this.getMutasi(),
      stockOpnameSessions: this.getStockOpnameSessions(),
      stockOpnameScans: this.getStockOpnameScans(),
      pemeliharaan: this.getPemeliharaan(),
      penghapusan: this.getPenghapusan(),
      pengambilanATK: this.getPengambilanATK(),
      procurementPlans: this.getProcurementPlans(),
      procurementPlanDetails: this.getProcurementPlanDetails(),
      documents: this.getDocuments(),
      auditTrail: this.getAuditTrail(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public importFullJson(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    if (data.config) this.setItem(STORAGE_KEYS.CONFIG, data.config);
    if (data.users) this.setItem(STORAGE_KEYS.USERS, data.users);
    if (data.suppliers) this.setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
    if (data.items) this.setItem(STORAGE_KEYS.ITEMS, data.items);
    if (data.barangMasuk) this.setItem(STORAGE_KEYS.BARANG_MASUK, data.barangMasuk);
    if (data.barangKeluar) this.setItem(STORAGE_KEYS.BARANG_KELUAR, data.barangKeluar);
    if (data.assets) this.setItem(STORAGE_KEYS.ASSETS, data.assets);
    if (data.mutasi) this.setItem(STORAGE_KEYS.MUTASI, data.mutasi);
    if (data.stockOpnameSessions) this.setItem(STORAGE_KEYS.STOCK_OPNAME_SESSIONS, data.stockOpnameSessions);
    if (data.stockOpnameScans) this.setItem(STORAGE_KEYS.STOCK_OPNAME_SCANS, data.stockOpnameScans);
    if (data.pemeliharaan) this.setItem(STORAGE_KEYS.PEMELIHARAAN, data.pemeliharaan);
    if (data.penghapusan) this.setItem(STORAGE_KEYS.PENGHAPUSAN, data.penghapusan);
    if (data.pengambilanATK) this.setItem(STORAGE_KEYS.PENGAMBILAN_ATK, data.pengambilanATK);
    if (data.procurementPlans) this.setItem(STORAGE_KEYS.PROCUREMENT_PLANS, data.procurementPlans);
    if (data.procurementPlanDetails) this.setItem(STORAGE_KEYS.PROCUREMENT_PLAN_DETAILS, data.procurementPlanDetails);
    if (data.documents) this.setItem(STORAGE_KEYS.DOCUMENTS, data.documents);
    this.rebuildStockLedger();
    this.logAudit('IMPORT', 'DATABASE', 'FULL_RESTORE', { importedAt: new Date().toISOString() });
  }

  public exportAllDataAsJSON(): string {
    return this.exportFullJson();
  }

  public importAllDataFromJSON(jsonStr: string): void {
    this.importFullJson(jsonStr);
  }

  public resetToSampleData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.initDatabase();
    this.rebuildStockLedger();
  }

  public getMutasiAset(): any[] {
    return this.getMutasi().map((m) => ({
      ...m,
      ASET_ID: m.ID,
      LOKASI_LAMA: m.DARI_LOKASI,
      LOKASI_BARU: m.KE_LOKASI,
      PJ_LAMA: m.DARI_PJ,
      PJ_BARU: m.KE_PJ,
      NOMOR_BA_MUTASI: m.ID,
      ALASAN_MUTASI: m.ALASAN,
    }));
  }

  public createMutasiAset(data: any): string {
    const res = this.createMutasi({
      KODE_ASET: data.KODE_ASET,
      NAMA_BARANG: data.NAMA_BARANG,
      DARI_LOKASI: data.LOKASI_LAMA,
      KE_LOKASI: data.LOKASI_BARU,
      DARI_PJ: data.PJ_LAMA,
      KE_PJ: data.PJ_BARU,
      ALASAN: data.ALASAN_MUTASI,
      TANGGAL: data.TANGGAL,
    });
    return res.ID;
  }

  public getPemeliharaanAset(): any[] {
    return this.getPemeliharaan().map((p) => ({
      ...p,
      ASET_ID: p.ID,
      URAIAN_KERUSAKAN: p.KETERANGAN,
      BENGKEL_PELAKSANA: p.PENYEDIA,
      KONDISI_SETELAH: 'BAIK',
    }));
  }

  public createPemeliharaanAset(data: any): void {
    this.createPemeliharaan({
      KODE_ASET: data.KODE_ASET,
      NAMA_BARANG: data.NAMA_BARANG,
      JENIS_PEMELIHARAAN: data.JENIS_PEMELIHARAAN,
      BIAYA: data.BIAYA,
      PENYEDIA: data.BENGKEL_PELAKSANA,
      KETERANGAN: data.URAIAN_KERUSAKAN,
      TANGGAL: data.TANGGAL,
      STATUS: 'SELESAI',
    });
  }

  public getPenghapusanAset(): any[] {
    return this.getPenghapusan().map((d) => ({
      ...d,
      ASET_ID: d.ID,
      NOMOR_BA_PENGHAPUSAN: d.ID,
      ALASAN_PENGHAPUSAN: d.ALASAN,
      METODE: 'PEMUSNAHAN',
      STATUS_PERSETUJUAN: d.STATUS,
    }));
  }

  public createPenghapusanAset(data: any): string {
    const res = this.createPenghapusan({
      KODE_ASET: data.KODE_ASET,
      NAMA_BARANG: data.NAMA_BARANG,
      ALASAN: data.ALASAN_PENGHAPUSAN,
      TANGGAL: data.TANGGAL,
      STATUS: 'SELESAI',
    });
    return res.ID;
  }

  public getStockOpname(): any[] {
    return this.getStockOpnameScans().map((s) => ({
      ...s,
      NOMOR_OPNAME: s.SESSION_ID,
    }));
  }

  public createStockOpname(data: { TANGGAL: string; PETUGAS: string; ITEMS: any[] }): string {
    const session = this.startOpnameSession('Gudang Utama', 'Stock Opname Fisik');
    const allItems = this.getItems();
    data.ITEMS.forEach((item) => {
      const itm = allItems.find((i) => i.KODE_BARANG === item.KODE_BARANG);
      this.recordOpnameScan({
        SESSION_ID: session.NOMOR_OPNAME,
        KODE_BARANG: item.KODE_BARANG,
        NAMA_BARANG: itm?.NAMA_BARANG || item.NAMA_BARANG || 'Item Persediaan',
        JENIS_SATUAN: itm?.JENIS_SATUAN || 'Pcs',
        STOK_FISIK: Number(item.STOK_FISIK) || 0,
        KETERANGAN: item.KETERANGAN || '',
      });
    });
    return session.NOMOR_OPNAME;
  }

  public getAuditLogs(): any[] {
    return this.getAuditTrail().map((a) => ({
      ...a,
      ACTION: a.AKSI,
      MODULE: a.MODUL,
      USER_NAME: a.USER_EMAIL,
      DETAILS: a.DATA_JSON,
    }));
  }

  public createDocument(data: any): string {
    const list = this.getDocuments();
    const docId = `DOC-${Date.now()}`;
    list.push({
      ID: docId,
      TIMESTAMP: new Date().toISOString(),
      JENIS_DOKUMEN: data.JENIS_DOKUMEN || 'BERITA_ACARA',
      NOMOR_DOKUMEN: data.NOMOR_DOKUMEN || docId,
      PERIODE: new Date().getFullYear().toString(),
      MODULE: 'document_center',
      RECORD_ID: docId,
      STATUS: 'TERBIT',
      DIBUAT_OLEH: this.getActiveUser().NAMA,
      KETERANGAN: data.KETERANGAN || '',
    });
    this.setItem(STORAGE_KEYS.DOCUMENTS, list);
    return docId;
  }

  // --- FASE 2: KODE REKENING BELANJA ARKAS & SIPLAH ---
  public getARKASAccounts(): ARKASAccount[] {
    const saved = this.getItem<ARKASAccount[]>(STORAGE_KEYS.ARKAS_ACCOUNTS, []);
    if (saved && saved.length > 0) return saved;

    const defaults: ARKASAccount[] = [
      {
        KODE_REKENING: '5.1.02.01.01.0024',
        NAMA_REKENING: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor (ATK)',
        KATEGORI_BELANJA: 'OPERASIONAL',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 18500000,
        REALISASI: 11250000,
        SISA_ANGGARAN: 7250000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.1.02.01.01.0026',
        NAMA_REKENING: 'Belanja Bahan Cetak dan Penggandaan Formulir / Ujian',
        KATEGORI_BELANJA: 'OPERASIONAL',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 12000000,
        REALISASI: 8400000,
        SISA_ANGGARAN: 3600000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.1.02.01.01.0029',
        NAMA_REKENING: 'Belanja Bahan Praktik Sekolah / Laboratorium IPA & Komputer',
        KATEGORI_BELANJA: 'OPERASIONAL',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 9500000,
        REALISASI: 4200000,
        SISA_ANGGARAN: 5300000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.1.02.01.01.0030',
        NAMA_REKENING: 'Belanja Bahan Kebersihan dan Sanitasi Lingkungan Sekolah',
        KATEGORI_BELANJA: 'OPERASIONAL',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 6500000,
        REALISASI: 3900000,
        SISA_ANGGARAN: 2600000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.2.02.10.01.0002',
        NAMA_REKENING: 'Belanja Modal Komputer, Laptop & Chromebook Peserta Didik',
        KATEGORI_BELANJA: 'MODAL_ASET',
        SUMBER_DANA: 'BOS Kinerja / Afirmasi',
        PAGU_ANGGARAN: 45000000,
        REALISASI: 38500000,
        SISA_ANGGARAN: 6500000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.2.02.10.02.0003',
        NAMA_REKENING: 'Belanja Modal Peralatan Jaringan Internet, Wifi & Access Point',
        KATEGORI_BELANJA: 'MODAL_ASET',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 8000000,
        REALISASI: 7500000,
        SISA_ANGGARAN: 500000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.2.02.08.01.0005',
        NAMA_REKENING: 'Belanja Modal Buku Teks Utama Kurikulum Merdeka & Perpustakaan',
        KATEGORI_BELANJA: 'MODAL_ASET',
        SUMBER_DANA: 'BOS Reguler',
        PAGU_ANGGARAN: 22000000,
        REALISASI: 19800000,
        SISA_ANGGARAN: 2200000,
        STATUS: 'AKTIF',
      },
      {
        KODE_REKENING: '5.2.02.05.01.0001',
        NAMA_REKENING: 'Belanja Modal Mebelair Meja & Kursi Kelas Siswa',
        KATEGORI_BELANJA: 'MODAL_ASET',
        SUMBER_DANA: 'Komite Sekolah',
        PAGU_ANGGARAN: 15000000,
        REALISASI: 14200000,
        SISA_ANGGARAN: 800000,
        STATUS: 'AKTIF',
      },
    ];

    this.setItem(STORAGE_KEYS.ARKAS_ACCOUNTS, defaults);
    return defaults;
  }

  public saveARKASAccount(account: ARKASAccount): void {
    const list = this.getARKASAccounts();
    const idx = list.findIndex((a) => a.KODE_REKENING === account.KODE_REKENING);
    account.SISA_ANGGARAN = Math.max(0, account.PAGU_ANGGARAN - (account.REALISASI || 0));
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    this.setItem(STORAGE_KEYS.ARKAS_ACCOUNTS, list);
    this.logAudit('SIMPAN_REKENING_ARKAS', 'arkas', account.KODE_REKENING, account);
  }

  // --- FASE 3: PENYUSUTAN NILAI ASET (DEPRESIASI STANDAR SAP) ---
  public getAssetDepreciations(): AssetDepreciation[] {
    const assets = this.getAssets().filter((a) => a.STATUS !== 'DIHAPUS');
    const now = new Date();

    return assets.map((a) => {
      // Determine SAP asset category & useful life (Masa Manfaat)
      const nameUpper = (a.NAMA_BARANG + ' ' + (a.SPESIFIKASI || '')).toUpperCase();
      let category: AssetDepreciation['KATEGORI_SAP'] = 'PERALATAN_MESIN';
      let usefulYears = 5;

      if (nameUpper.includes('LAPTOP') || nameUpper.includes('KOMPUTER') || nameUpper.includes('PC') || nameUpper.includes('PRINTER') || nameUpper.includes('PROJECTOR') || nameUpper.includes('INFOCUS')) {
        category = 'PERALATAN_MESIN';
        usefulYears = 4;
      } else if (nameUpper.includes('MOTOR') || nameUpper.includes('MOBIL') || nameUpper.includes('KENDARAAN')) {
        category = 'KENDARAAN';
        usefulYears = 7;
      } else if (nameUpper.includes('MEJA') || nameUpper.includes('KURSI') || nameUpper.includes('LEMARI') || nameUpper.includes('RAK')) {
        category = 'MEBELAIR';
        usefulYears = 5;
      } else if (nameUpper.includes('BUKU') || nameUpper.includes('ENSIKLOPEDIA') || nameUpper.includes('MODUL')) {
        category = 'BUKU';
        usefulYears = 5;
      } else if (nameUpper.includes('GEDUNG') || nameUpper.includes('RUANG') || nameUpper.includes('BANGUNAN')) {
        category = 'GEDUNG_BANGUNAN';
        usefulYears = 50;
      } else {
        category = 'ASET_LAIN';
        usefulYears = 5;
      }

      const acquisitionDate = a.TANGGAL_BKU ? new Date(a.TANGGAL_BKU) : new Date(now.getFullYear() - 1, 0, 1);
      const diffMonths = Math.max(1, (now.getFullYear() - acquisitionDate.getFullYear()) * 12 + (now.getMonth() - acquisitionDate.getMonth()));
      const totalCost = Number(a.TOTAL_NILAI) || (Number(a.JUMLAH) * Number(a.HARGA_SATUAN)) || 0;
      
      const depreciationPerYear = totalCost / usefulYears;
      const depreciationPerMonth = depreciationPerYear / 12;
      const maxMonths = usefulYears * 12;
      const effectiveMonths = Math.min(diffMonths, maxMonths);
      
      const accumulatedDepreciation = Math.min(totalCost - 1, Math.round(effectiveMonths * depreciationPerMonth));
      const bookValue = Math.max(1, totalCost - accumulatedDepreciation);
      const isFullyDepreciated = diffMonths >= maxMonths;

      return {
        ID: a.ID,
        KODE_ASET: a.KODE_ASET || a.ID,
        NAMA_BARANG: a.NAMA_BARANG,
        KATEGORI_SAP: category,
        TANGGAL_PEROLEHAN: a.TANGGAL_BKU || '2023-01-15',
        HARGA_PEROLEHAN: totalCost,
        MASA_MANFAAT_TAHUN: usefulYears,
        PERSENTASE_PENYUSUTAN: Math.round((1 / usefulYears) * 100 * 10) / 10,
        NILAI_RESIDU: 1,
        UMUR_BERJALAN_BULAN: diffMonths,
        PENYUSUTAN_PER_TAHUN: Math.round(depreciationPerYear),
        AKUMULASI_PENYUSUTAN: accumulatedDepreciation,
        NILAI_BUKU: bookValue,
        STATUS_PENYUSUTAN: isFullyDepreciated ? 'HABIS_MANFAAT' : 'BERJALAN',
        LOKASI: a.LOKASI || 'Gudang Sekolah',
        KONDISI: a.KONDISI || 'BAIK',
      };
    });
  }

  // --- FASE 3: KONSOLIDASI MULTI-SEKOLAH / KORWIL DINAS ---
  public getConsolidatedSchools(): SchoolUnitConsolidation[] {
    const saved = this.getItem<SchoolUnitConsolidation[]>(STORAGE_KEYS.CONSOLIDATED_SCHOOLS, []);
    if (saved && saved.length > 0) return saved;

    const totalAssets = this.getAssets().reduce((acc, cur) => acc + (cur.TOTAL_NILAI || 0), 0);
    const totalInventory = this.getItems().length * 1500000;

    const defaults: SchoolUnitConsolidation[] = [
      {
        ID: 'SCH-001',
        NPSN: '20606498',
        NAMA_SEKOLAH: 'SD Negeri Tangerang 6 (Unit Ini)',
        JENJANG: 'SD',
        KECAMATAN: 'Tangerang',
        KEPALA_SEKOLAH: 'Liestya Kusuma Sari, S.Pd., M.Pd.',
        BENDAHARA: 'Siti Rahmawati, S.Pd.',
        TOTAL_NILAI_ASET: totalAssets || 184500000,
        TOTAL_NILAI_PERSEDIAAN: totalInventory || 12600000,
        TOTAL_ITEM_ASET: this.getAssets().length || 15,
        TOTAL_ITEM_PERSEDIAAN: this.getItems().length || 15,
        STATUS_SINKRON: 'TERHUBUNG',
        TERAKHIR_SINKRON: new Date().toISOString(),
        KONDISI_BAIK_PCT: 95,
        KONDISI_RUSAK_PCT: 5,
        PENYERAPAN_BOS_PCT: 92.4,
      },
      {
        ID: 'SCH-002',
        NPSN: '20601552',
        NAMA_SEKOLAH: 'SMP Negeri 2 Harapan Bangsa',
        JENJANG: 'SMP',
        KECAMATAN: 'Cipondoh',
        KEPALA_SEKOLAH: 'Dra. Hj. Nurhayati, M.M.',
        BENDAHARA: 'Agus Setiawan, S.E.',
        TOTAL_NILAI_ASET: 245000000,
        TOTAL_NILAI_PERSEDIAAN: 22800000,
        TOTAL_ITEM_ASET: 88,
        TOTAL_ITEM_PERSEDIAAN: 35,
        STATUS_SINKRON: 'TERHUBUNG',
        TERAKHIR_SINKRON: new Date(Date.now() - 3600000 * 2).toISOString(),
        KONDISI_BAIK_PCT: 88,
        KONDISI_RUSAK_PCT: 12,
        PENYERAPAN_BOS_PCT: 91.2,
      },
      {
        ID: 'SCH-003',
        NPSN: '20602198',
        NAMA_SEKOLAH: 'SMK Negeri 1 Unggulan Vokasi',
        JENJANG: 'SMK',
        KECAMATAN: 'Tangerang',
        KEPALA_SEKOLAH: 'Ir. Hendra Gunawan, M.T.',
        BENDAHARA: 'Rina Kusuma, S.Ak.',
        TOTAL_NILAI_ASET: 612000000,
        TOTAL_NILAI_PERSEDIAAN: 48500000,
        TOTAL_ITEM_ASET: 164,
        TOTAL_ITEM_PERSEDIAAN: 62,
        STATUS_SINKRON: 'TERHUBUNG',
        TERAKHIR_SINKRON: new Date(Date.now() - 3600000 * 5).toISOString(),
        KONDISI_BAIK_PCT: 95,
        KONDISI_RUSAK_PCT: 5,
        PENYERAPAN_BOS_PCT: 78.5,
      },
      {
        ID: 'SCH-004',
        NPSN: '20603810',
        NAMA_SEKOLAH: 'SD Negeri 3 Cendikia Cerdas',
        JENJANG: 'SD',
        KECAMATAN: 'Pinang',
        KEPALA_SEKOLAH: 'H. Bambang Irawan, S.Pd.',
        BENDAHARA: 'Dewi Lestari, S.Pd.',
        TOTAL_NILAI_ASET: 94000000,
        TOTAL_NILAI_PERSEDIAAN: 9800000,
        TOTAL_ITEM_ASET: 31,
        TOTAL_ITEM_PERSEDIAAN: 14,
        STATUS_SINKRON: 'MENUNGGU',
        TERAKHIR_SINKRON: new Date(Date.now() - 86400000).toISOString(),
        KONDISI_BAIK_PCT: 84,
        KONDISI_RUSAK_PCT: 16,
        PENYERAPAN_BOS_PCT: 82.0,
      },
      {
        ID: 'SCH-005',
        NPSN: 'KORWIL-CIP',
        NAMA_SEKOLAH: 'Gudang Cadangan Logistik Korwil Pendidikan',
        JENJANG: 'DINAS',
        KECAMATAN: 'Cipondoh',
        KEPALA_SEKOLAH: 'Drs. Supardi, M.Si. (Koordinator Wilayah)',
        BENDAHARA: 'Eko Wahyudi, S.Sos.',
        TOTAL_NILAI_ASET: 180000000,
        TOTAL_NILAI_PERSEDIAAN: 65000000,
        TOTAL_ITEM_ASET: 52,
        TOTAL_ITEM_PERSEDIAAN: 40,
        STATUS_SINKRON: 'TERHUBUNG',
        TERAKHIR_SINKRON: new Date(Date.now() - 3600000 * 12).toISOString(),
        KONDISI_BAIK_PCT: 98,
        KONDISI_RUSAK_PCT: 2,
        PENYERAPAN_BOS_PCT: 95.0,
      },
    ];

    this.setItem(STORAGE_KEYS.CONSOLIDATED_SCHOOLS, defaults);
    return defaults;
  }

  public saveConsolidatedSchool(school: SchoolUnitConsolidation): void {
    const list = this.getConsolidatedSchools();
    const idx = list.findIndex((s) => s.ID === school.ID || s.NPSN === school.NPSN);
    if (idx >= 0) {
      list[idx] = school;
    } else {
      list.push(school);
    }
    this.setItem(STORAGE_KEYS.CONSOLIDATED_SCHOOLS, list);
    this.logAudit('UPDATE_KONSOLIDASI_UNIT', 'konsolidasi', school.NPSN, school);
  }

  // --- FASE 1: PENGATURAN CETAK THERMAL ---
  public getThermalSettings(): {
    paperSize: '50x30' | '40x20' | '58mm' | '80mm';
    showQr: boolean;
    showLogo: boolean;
    showNip: boolean;
    customHeader: string;
  } {
    const saved = this.getItem<any>(STORAGE_KEYS.THERMAL_SETTINGS, null);
    if (saved) return saved;
    return {
      paperSize: '50x30',
      showQr: true,
      showLogo: true,
      showNip: true,
      customHeader: 'INVENTARIS SEKOLAH',
    };
  }

  public saveThermalSettings(settings: any): void {
    this.setItem(STORAGE_KEYS.THERMAL_SETTINGS, settings);
  }

  // --- PRESET TATA LETAK STIKER QR (CUSTOM LAYOUT PRESETS) ---
  public getDefaultQRStickerPresets(): QRStickerPreset[] {
    return [
      {
        ID: 'preset_official',
        NAME: 'Kedinasan Lengkap (Standar Permendagri)',
        DESCRIPTION: 'Format formal lengkap: Kop instansi, Kategori KIB, Spesifikasi, Lokasi, PJ & NIP resmi',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'standard',
        LAYOUT_MODE: 'landscape_left',
        COLOR_THEME: 'emerald',
        BORDER_STYLE: 'double',
        FONT_SIZE_SCALE: 1.0,
        QR_SIZE_RATIO: 'normal',
        SHOW_KOP: true,
        KOP_TEXT: 'UPT SATUAN PENDIDIKAN',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: true,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: true,
        SHOW_SPECIFICATION: true,
        SHOW_LOCATION: true,
        SHOW_PJ: true,
        SHOW_NIP: true,
        SHOW_YEAR: true,
        SHOW_CONDITION: true,
        SHOW_PRICE: false,
      },
      {
        ID: 'preset_pj_nip',
        NAME: 'Fokus Akuntabilitas (PJ & NIP Tegas)',
        DESCRIPTION: 'Menonjolkan Nama & NIP Penanggung Jawab dan lokasi ruangan dengan tema biru pemerintahan',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'standard',
        LAYOUT_MODE: 'landscape_left',
        COLOR_THEME: 'navy',
        BORDER_STYLE: 'double',
        FONT_SIZE_SCALE: 1.05,
        QR_SIZE_RATIO: 'normal',
        SHOW_KOP: true,
        KOP_TEXT: 'UPT SATUAN PENDIDIKAN',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: true,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: true,
        SHOW_SPECIFICATION: false,
        SHOW_LOCATION: true,
        SHOW_PJ: true,
        SHOW_NIP: true,
        SHOW_YEAR: true,
        SHOW_CONDITION: true,
        SHOW_PRICE: false,
      },
      {
        ID: 'preset_badge_bmd',
        NAME: 'Kartu BMD / Badge Properti Daerah',
        DESCRIPTION: 'Header solid bergaya plat aset daerah dengan nomor register besar',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'large',
        LAYOUT_MODE: 'badge',
        COLOR_THEME: 'emerald',
        BORDER_STYLE: 'rounded',
        FONT_SIZE_SCALE: 1.0,
        QR_SIZE_RATIO: 'large',
        SHOW_KOP: true,
        KOP_TEXT: 'PEMERINTAH KOTA / KABUPATEN',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: true,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: true,
        SHOW_SPECIFICATION: true,
        SHOW_LOCATION: true,
        SHOW_PJ: true,
        SHOW_NIP: true,
        SHOW_YEAR: true,
        SHOW_CONDITION: true,
        SHOW_PRICE: false,
      },
      {
        ID: 'preset_compact_mini',
        NAME: 'Label Ringkas & Mini (Barang Kecil/Laptop)',
        DESCRIPTION: 'Hanya Nama Barang, Kode Aset, Lokasi & QR untuk label permukaan sempit',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'small',
        LAYOUT_MODE: 'landscape_left',
        COLOR_THEME: 'slate',
        BORDER_STYLE: 'single',
        FONT_SIZE_SCALE: 0.9,
        QR_SIZE_RATIO: 'compact',
        SHOW_KOP: false,
        KOP_TEXT: '',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: false,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: false,
        SHOW_SPECIFICATION: false,
        SHOW_LOCATION: true,
        SHOW_PJ: false,
        SHOW_NIP: false,
        SHOW_YEAR: false,
        SHOW_CONDITION: false,
        SHOW_PRICE: false,
      },
      {
        ID: 'preset_monochrome_eco',
        NAME: 'Monokrom B/W (Hemat Tinta Printer)',
        DESCRIPTION: 'Hitam-putih tajam 100% kontras tinggi tanpa blok warna tebal',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'standard',
        LAYOUT_MODE: 'landscape_left',
        COLOR_THEME: 'monochrome',
        BORDER_STYLE: 'single',
        FONT_SIZE_SCALE: 1.0,
        QR_SIZE_RATIO: 'normal',
        SHOW_KOP: true,
        KOP_TEXT: 'UPT SATUAN PENDIDIKAN',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: true,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: true,
        SHOW_SPECIFICATION: true,
        SHOW_LOCATION: true,
        SHOW_PJ: true,
        SHOW_NIP: true,
        SHOW_YEAR: true,
        SHOW_CONDITION: true,
        SHOW_PRICE: false,
      },
      {
        ID: 'preset_vertical_door',
        NAME: 'Vertikal / Pintu Lemari & Ruangan',
        DESCRIPTION: 'Orientasi tegak (portrait) dengan QR di atas untuk pintu lemari, meja, atau rak',
        IS_SYSTEM: true,
        CREATED_AT: new Date('2026-01-01').toISOString(),
        SIZE: 'standard',
        LAYOUT_MODE: 'portrait_top',
        COLOR_THEME: 'amber',
        BORDER_STYLE: 'rounded',
        FONT_SIZE_SCALE: 1.0,
        QR_SIZE_RATIO: 'normal',
        SHOW_KOP: true,
        KOP_TEXT: 'UPT SATUAN PENDIDIKAN',
        SHOW_SCHOOL_NAME: true,
        SHOW_NPSN: true,
        SHOW_ASSET_CODE: true,
        SHOW_ASSET_NAME: true,
        SHOW_CATEGORY: true,
        SHOW_SPECIFICATION: false,
        SHOW_LOCATION: true,
        SHOW_PJ: true,
        SHOW_NIP: true,
        SHOW_YEAR: true,
        SHOW_CONDITION: true,
        SHOW_PRICE: false,
      },
    ];
  }

  public getQRStickerPresets(): QRStickerPreset[] {
    const saved = this.getItem<QRStickerPreset[]>(STORAGE_KEYS.QR_STICKER_PRESETS, null);
    if (!saved || saved.length === 0) {
      const defaults = this.getDefaultQRStickerPresets();
      this.setItem(STORAGE_KEYS.QR_STICKER_PRESETS, defaults);
      return defaults;
    }
    return saved;
  }

  public saveQRStickerPreset(preset: Omit<QRStickerPreset, 'ID' | 'CREATED_AT'> & { ID?: string; CREATED_AT?: string }): QRStickerPreset {
    const list = this.getQRStickerPresets();
    const existingIndex = preset.ID ? list.findIndex((p) => p.ID === preset.ID) : -1;

    const finalPreset: QRStickerPreset = {
      ...preset,
      ID: preset.ID || `custom_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      CREATED_AT: preset.CREATED_AT || new Date().toISOString(),
      IS_SYSTEM: false,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = finalPreset;
    } else {
      list.push(finalPreset);
    }

    this.setItem(STORAGE_KEYS.QR_STICKER_PRESETS, list);
    this.logAudit('SIMPAN_PRESET_STIKER', 'aset', finalPreset.ID, { name: finalPreset.NAME });
    return finalPreset;
  }

  public deleteQRStickerPreset(id: string): boolean {
    const list = this.getQRStickerPresets();
    const target = list.find((p) => p.ID === id);
    if (!target || target.IS_SYSTEM) return false;

    const filtered = list.filter((p) => p.ID !== id);
    this.setItem(STORAGE_KEYS.QR_STICKER_PRESETS, filtered);
    this.logAudit('HAPUS_PRESET_STIKER', 'aset', id, { name: target.NAME });
    return true;
  }

  public resetDefaultQRStickerPresets(): QRStickerPreset[] {
    const defaults = this.getDefaultQRStickerPresets();
    this.setItem(STORAGE_KEYS.QR_STICKER_PRESETS, defaults);
    return defaults;
  }

  // --- BERITA ACARA DOCUMENT TEMPLATES MANAGER ---
  public getDefaultBATemplates(): BATemplate[] {
    const cfg = this.getConfig();
    const city = cfg.BA_DEFAULT_CITY || cfg.REPORT_SIGNATURE_CITY || 'Tangerang';
    const schoolName = cfg.SCHOOL_NAME || 'SD NEGERI TANGERANG 6';
    const npsn = cfg.SCHOOL_NPSN || '20606498';
    const addr = cfg.ADDRESS || 'Jl. Perintis Kemerdekaan No. 6';

    return [
      {
        id: 'tpl_bast_pengadaan',
        name: 'BAST Pengadaan Belanja Modal & Operasional (BOS/BOP)',
        category: 'PENGADAAN',
        description: 'Format baku Berita Acara Serah Terima hasil belanja barang masuk dari pihak penyedia/toko rekanan ke sekolah.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA SERAH TERIMA HASIL PENGADAAN BARANG (BAST)',
        docNumberPattern: `020/{NO}/BAST-INV/${new Date().getFullYear()}`,
        openingClause: `Pada hari ini, tanggal ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, bertempat di lingkungan UPT Satuan Pendidikan ${schoolName}, yang bertanda tangan di bawah ini telah melaksanakan serah terima dan pemeriksaan barang hasil pengadaan inventaris:`,
        closingClause: 'Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dapat dipergunakan sebagaimana mestinya.',
        defaultHeaders: ['No', 'Kode Barang', 'Nama Barang / Spesifikasi', 'Volume', 'Satuan', 'Harga Satuan (Rp)', 'Total (Rp)', 'Kondisi'],
        defaultSampleRows: [
          [1, 'BRG-ATK-001', 'Kertas HVS A4 75gr Sinar Dunia (Rim)', 20, 'Rim', '52.000', '1.040.000', 'Baik / Baru'],
          [2, 'BRG-ELK-002', 'Toner Printer HP LaserJet Original 85A', 2, 'Pcs', '450.000', '900.000', 'Baik / Baru'],
        ],
        leftSignerTitle: 'Pihak Pertama (Penyedia / Toko Rekanan),',
        leftSignerName: 'CV. Multi Sarana Mandiri',
        leftSignerNip: '-',
        rightSignerTitle: 'Pihak Kedua (Pengurus Barang Sekolah),',
        rightSignerName: cfg.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
        rightSignerNip: cfg.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'a4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'emerald',
        fontFamily: 'helvetica',
        tableDensity: 'normal',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Dokumen Berita Acara Serah Terima (BAST) — SIPERSEDA',
        runningFooterText: `Arsip Sah UPT Satuan Pendidikan ${schoolName}`,
      },
      {
        id: 'tpl_serah_terima_guru',
        name: 'Berita Acara Pendistribusian & Pengambilan ATK Guru/Staf',
        category: 'SERAH_TERIMA',
        description: 'Format serah terima pemakaian barang habis pakai (ATK/Peralatan) untuk menunjang kegiatan belajar mengajar.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA SERAH TERIMA PENDISTRIBUSIAN ATK & PERLENGKAPAN KERJA',
        docNumberPattern: `021/{NO}/BA-ATK/${new Date().getFullYear()}`,
        openingClause: `Pada hari ini telah diserahkan sejumlah barang inventaris/alat tulis kantor (ATK) persediaan sekolah untuk keperluan operasional kedinasan/pembelajaran guru dan staf:`,
        closingClause: 'Barang tersebut telah diterima dalam keadaan baik, lengkap, dan siap dipergunakan sesuai kebutuhan unit kerja.',
        defaultHeaders: ['No', 'Kode Barang', 'Nama Barang / Merk', 'Jumlah', 'Satuan', 'Peruntukan / Ruangan', 'Keterangan'],
        defaultSampleRows: [
          [1, 'BRG-ATK-003', 'Spidol Whiteboard Snowman Hitam', 12, 'Pcs', 'Ruang Kelas 1 s/d 6', 'Pemakaian Reguler'],
          [2, 'BRG-ATK-004', 'Penghapus Papan Tulis Magnetik', 6, 'Pcs', 'Ruang Guru & Kelas', 'Pemakaian Reguler'],
        ],
        leftSignerTitle: 'Yang Menyerahkan (Pengurus Barang),',
        leftSignerName: cfg.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
        leftSignerNip: cfg.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
        rightSignerTitle: 'Yang Menerima (Perwakilan Guru/Staf),',
        rightSignerName: 'H. Bambang Irawan, S.Pd.',
        rightSignerNip: '19790514 200801 1 012',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'a4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'navy',
        fontFamily: 'helvetica',
        tableDensity: 'compact',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Bukti Serah Terima Distribusi Perlengkapan',
        runningFooterText: `Sistem Inventaris Sekolah — ${schoolName}`,
      },
      {
        id: 'tpl_pemeriksaan_barang',
        name: 'Berita Acara Pemeriksaan Fisik & Uji Fungsi Barang Masuk',
        category: 'PEMERIKSAAN',
        description: 'Format berita acara panitia/petugas pemeriksa hasil pekerjaan pengadaan barang dan jasa sekolah.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA HASIL PEMERIKSAAN DAN PENGUJIAN FISIK BARANG (BAP)',
        docNumberPattern: `022/{NO}/BAP-FISIK/${new Date().getFullYear()}`,
        openingClause: `Berdasarkan Surat Pesanan dan Faktur Pembelian, Tim Pemeriksa Barang Sekolah telah melaksanakan pengujian kualitas, spesifikasi teknis, kelengkapan, dan fungsi fisik terhadap barang belanja inventaris:`,
        closingClause: 'Berdasarkan hasil uji fisik dan kesesuaian dokumen pesanan, barang dinyatakan 100% SESUAI spesifikasi dan LAYAK diterima.',
        defaultHeaders: ['No', 'Nama Barang / Model', 'Kuantitas', 'Satuan', 'Kesesuaian Spek', 'Uji Fungsi', 'Hasil Akhir'],
        defaultSampleRows: [
          [1, 'Laptop Asus Core i5 RAM 8GB', 3, 'Unit', 'Sesuai Spesifikasi', 'Berfungsi Normal', 'DITERIMA'],
          [2, 'Proyektor Epson EB-X500 3600 Lumens', 2, 'Unit', 'Sesuai Spesifikasi', 'Berfungsi Normal', 'DITERIMA'],
        ],
        leftSignerTitle: 'Ketua Tim Pemeriksa Barang,',
        leftSignerName: cfg.TREASURER || 'Siti Rahmawati, S.Pd.',
        leftSignerNip: cfg.TREASURER_NIP || '19870921 201001 2 005',
        rightSignerTitle: 'Pengurus Barang / Pengelola Gudang,',
        rightSignerName: cfg.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
        rightSignerNip: cfg.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'f4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'emerald',
        fontFamily: 'times',
        tableDensity: 'normal',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Dokumen Pemeriksaan Fisik Barang Inventaris',
        runningFooterText: `Standar Kedinasan UPT Satuan Pendidikan ${schoolName}`,
      },
      {
        id: 'tpl_stock_opname',
        name: 'Berita Acara Hasil Inventarisasi Fisik / Stock Opname Persediaan',
        category: 'STOCK_OPNAME',
        description: 'Dokumen resmi penetapan saldo fisik akhir periode dan rekonsiliasi selisih persediaan sekolah.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA HASIL INVENTARISASI FISIK (STOCK OPNAME) PERSEDIAAN',
        docNumberPattern: `023/{NO}/BA-OPNAME/${new Date().getFullYear()}`,
        openingClause: `Telah dilaksanakan pencacahan dan verifikasi fisik secara menyeluruh atas saldo persediaan barang pakai habis di seluruh unit ruangan dan gudang sekolah per akhir periode:`,
        closingClause: 'Demikian Berita Acara Inventarisasi Fisik ini dibuat sebagai bukti pertanggungjawaban penatausahaan persediaan sekolah dan lampiran laporan keuangan semesteran.',
        defaultHeaders: ['No', 'Kode', 'Nama Barang', 'Satuan', 'Stok Sistem', 'Stok Fisik', 'Selisih', 'Kondisi / Analisis'],
        defaultSampleRows: [
          [1, 'BRG-ATK-001', 'Kertas HVS A4 75gr', 'Rim', 45, 45, 0, 'Sesuai / Baik'],
          [2, 'BRG-ATK-002', 'Buku Tulis Ekspedisi 100 Lembar', 'Buku', 18, 18, 0, 'Sesuai / Baik'],
        ],
        leftSignerTitle: 'Petugas / Tim Pencacah Fisik,',
        leftSignerName: cfg.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
        leftSignerNip: cfg.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
        rightSignerTitle: 'Bendahara Barang / BOS,',
        rightSignerName: cfg.TREASURER || 'Siti Rahmawati, S.Pd.',
        rightSignerNip: cfg.TREASURER_NIP || '19870921 201001 2 005',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'f4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'slate',
        fontFamily: 'helvetica',
        tableDensity: 'compact',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Laporan Rekonsiliasi Hasil Stock Opname',
        runningFooterText: `Arsip Akuntansi & Persediaan UPT Satuan Pendidikan ${schoolName}`,
      },
      {
        id: 'tpl_penghapusan_aset',
        name: 'Berita Acara Usulan Penghapusan Aset Rusak Berat / Musnah',
        category: 'PENGHAPUSAN',
        description: 'Format resmi usulan penghapusan dari Kartu Inventaris Barang (KIB) akibat rusak total atau hilang.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA PEMERIKSAAN DAN USULAN PENGHAPUSAN BARANG MILIK DAERAH (BMD)',
        docNumberPattern: `024/{NO}/BA-HAPUS/${new Date().getFullYear()}`,
        openingClause: `Pada hari ini, Tim Penilai dan Pengurus Barang telah mengadakan verifikasi teknis terhadap aset tetap milik sekolah yang dinilai sudah tidak bernilai ekonomis / rusak berat dan diusulkan untuk dihapus dari buku induk inventaris:`,
        closingClause: 'Barang-barang tercantum di atas telah diamankan di gudang transit penghapusan dan diteruskan ke Dinas Pendidikan guna penerbitan SK Penghapusan Resmi.',
        defaultHeaders: ['No', 'Kode Aset', 'Nama Barang / Merk', 'Tahun Perolehan', 'Nilai Awal (Rp)', 'Kondisi Akhir', 'Alasan Teknis Usulan'],
        defaultSampleRows: [
          [1, 'AST-KIBE-008', 'Komputer PC Rakitan Intel Core 2 Duo', '2014', '4.500.000', 'Rusak Berat (Mati Total)', 'Motherboard terbakar & suku cadang diskontinu'],
          [2, 'AST-KIBB-015', 'Meja Guru Kayu Jati Lama', '2008', '650.000', 'Rusak Berat / Lapuk', 'Dimakan rayap & tidak dapat diperbaiki'],
        ],
        leftSignerTitle: 'Pengurus Barang Pengguna,',
        leftSignerName: cfg.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
        leftSignerNip: cfg.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
        rightSignerTitle: 'Tim Verifikasi Kelayakan BMD,',
        rightSignerName: cfg.TREASURER || 'Siti Rahmawati, S.Pd.',
        rightSignerNip: cfg.TREASURER_NIP || '19870921 201001 2 005',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'f4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'amber',
        fontFamily: 'times',
        tableDensity: 'normal',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Usulan Penghapusan Barang Milik Daerah (BMD)',
        runningFooterText: `Dokumen Resmi UPT Satuan Pendidikan ${schoolName}`,
      },
      {
        id: 'tpl_mutasi_ruangan',
        name: 'Berita Acara Mutasi & Alih Status Penanggung Jawab Ruangan',
        category: 'MUTASI',
        description: 'Format mutasi perpindahan fisik aset antar ruangan kelas/laboratorium beserta serah terima PJ baru.',
        isSystem: true,
        createdAt: new Date('2026-01-01').toISOString(),
        institutionName: schoolName,
        institutionAddress: addr,
        institutionNpsn: npsn,
        institutionCity: city,
        institutionAgency: 'DINAS PENDIDIKAN',
        governingBody: `PEMERINTAH KOTA ${city.toUpperCase()}`,
        title: 'BERITA ACARA MUTASI / PEMINDAHAN RUANGAN BARANG INVENTARIS',
        docNumberPattern: `025/{NO}/BA-MUTASI/${new Date().getFullYear()}`,
        openingClause: `Telah dilakukan relokasi dan penyesuaian penempatan fisik barang inventaris sekolah beserta pemindahan tanggung jawab pemeliharaan dari ruangan lama ke ruangan baru:`,
        closingClause: 'Dengan ditandatanganinya Berita Acara ini, maka tanggung jawab operasional dan keutuhan barang secara sah beralih kepada Penanggung Jawab baru.',
        defaultHeaders: ['No', 'Kode Aset', 'Nama Barang', 'Lokasi Lama', 'Lokasi Baru', 'PJ Lama', 'PJ Baru', 'Kondisi'],
        defaultSampleRows: [
          [1, 'AST-KIBE-003', 'Smart TV LED Samsung 55 Inch', 'Ruang Multimedia', 'Ruang Lab Komputer 1', 'Dra. Hj. Nurhayati', 'Ahmad Fauzi, S.Kom.', 'Baik'],
        ],
        leftSignerTitle: 'Penanggung Jawab Lama,',
        leftSignerName: 'Dra. Hj. Nurhayati',
        leftSignerNip: '19750820 200212 2 004',
        rightSignerTitle: 'Penanggung Jawab Baru,',
        rightSignerName: 'Ahmad Fauzi, S.Kom.',
        rightSignerNip: '19900315 201802 1 002',
        centerSignerTitle: `Kepala UPT Satuan Pendidikan ${schoolName}`,
        centerSignerName: cfg.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        centerSignerNip: cfg.HEADMASTER_NIP || '19680412 199303 2 005',
        includeHeadmaster: true,
        paperSize: 'a4',
        orientation: 'portrait',
        kopAlignment: 'dual_logo',
        kopBorderStyle: 'double',
        themeColor: 'emerald',
        fontFamily: 'helvetica',
        tableDensity: 'normal',
        includeVerificationQR: true,
        autoPageNumbering: true,
        pageNumberPosition: 'bottom_center',
        headerFooterStyle: 'formal_line',
        runningHeaderText: 'Dokumen Mutasi Internal Inventaris Sekolah',
        runningFooterText: `UPT Satuan Pendidikan ${schoolName}`,
      },
    ];
  }

  public getBATemplates(): BATemplate[] {
    const saved = this.getItem<BATemplate[]>(STORAGE_KEYS.BA_TEMPLATES, null);
    if (!saved || saved.length === 0) {
      const defaults = this.getDefaultBATemplates();
      this.setItem(STORAGE_KEYS.BA_TEMPLATES, defaults);
      return defaults;
    }
    return saved;
  }

  public saveBATemplate(template: Omit<BATemplate, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): BATemplate {
    const list = this.getBATemplates();
    const isExisting = template.id ? list.findIndex((t) => t.id === template.id) : -1;

    const finalTpl: BATemplate = {
      ...template,
      id: template.id || `custom_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSystem: template.isSystem ?? false,
      paperSize: template.paperSize || 'a4',
      orientation: template.orientation || 'portrait',
      kopAlignment: template.kopAlignment || 'dual_logo',
      kopBorderStyle: template.kopBorderStyle || 'double',
      themeColor: template.themeColor || 'emerald',
      fontFamily: template.fontFamily || 'helvetica',
      tableDensity: template.tableDensity || 'normal',
      includeVerificationQR: template.includeVerificationQR ?? true,
      defaultHeaders: template.defaultHeaders && template.defaultHeaders.length > 0 ? template.defaultHeaders : ['No', 'Nama Barang', 'Jumlah', 'Satuan', 'Keterangan'],
      openingClause: template.openingClause || 'Pada hari ini telah dilaksanakan serah terima barang inventaris sebagai berikut:',
      closingClause: template.closingClause || 'Demikian Berita Acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
      leftSignerTitle: template.leftSignerTitle || 'Pihak Pertama,',
      rightSignerTitle: template.rightSignerTitle || 'Pihak Kedua,',
    };

    if (isExisting >= 0) {
      // Create a version snapshot before overwriting
      const oldTemplate = list[isExisting];
      this.saveBATemplateVersion(
        oldTemplate.id,
        `Pembaruan tata letak template ${finalTpl.name}`,
        this.getActiveUser().NAMA || 'Administrator'
      );
      list[isExisting] = finalTpl;
    } else {
      list.push(finalTpl);
    }

    this.setItem(STORAGE_KEYS.BA_TEMPLATES, list);
    this.logAudit('SIMPAN_TEMPLATE_BA', 'document_center', finalTpl.id, { name: finalTpl.name });
    return finalTpl;
  }

  public deleteBATemplate(id: string): boolean {
    const list = this.getBATemplates();
    const target = list.find((t) => t.id === id);
    if (!target || target.isSystem) return false;

    const filtered = list.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.BA_TEMPLATES, filtered);
    this.logAudit('HAPUS_TEMPLATE_BA', 'document_center', id, { name: target.name });
    return true;
  }

  public resetDefaultBATemplates(): BATemplate[] {
    const defaults = this.getDefaultBATemplates();
    this.setItem(STORAGE_KEYS.BA_TEMPLATES, defaults);
    return defaults;
  }

  // --- BATemplate Versioning System ---
  public getBATemplateVersions(templateId?: string): BATemplateVersion[] {
    const allVersions = this.getItem<BATemplateVersion[]>(STORAGE_KEYS.BA_TEMPLATE_VERSIONS, []);
    if (!templateId) return allVersions;
    return allVersions
      .filter((v) => v.templateId === templateId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public saveBATemplateVersion(
    templateId: string,
    summary: string,
    author?: string,
    versionTag?: string
  ): BATemplateVersion | null {
    const templates = this.getBATemplates();
    const target = templates.find((t) => t.id === templateId);
    if (!target) return null;

    const allVersions = this.getItem<BATemplateVersion[]>(STORAGE_KEYS.BA_TEMPLATE_VERSIONS, []);
    const existingForTemplate = allVersions.filter((v) => v.templateId === templateId);
    const nextVerNum = existingForTemplate.length + 1;

    const newVersion: BATemplateVersion = {
      id: `ver_${templateId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      templateId,
      versionNumber: nextVerNum,
      versionTag: versionTag || `v1.${nextVerNum}`,
      timestamp: new Date().toISOString(),
      author: author || this.getActiveUser().NAMA || 'Pengurus Barang',
      summary: summary || `Snapshot versi ${nextVerNum}`,
      snapshot: JSON.parse(JSON.stringify(target)),
    };

    allVersions.unshift(newVersion);
    // Keep max 50 versions in storage
    if (allVersions.length > 50) allVersions.pop();
    this.setItem(STORAGE_KEYS.BA_TEMPLATE_VERSIONS, allVersions);
    this.logAudit('CREATE_TEMPLATE_VERSION', 'document_center', templateId, {
      versionNumber: nextVerNum,
      summary,
    });
    return newVersion;
  }

  public restoreBATemplateVersion(versionId: string): BATemplate | null {
    const allVersions = this.getBATemplateVersions();
    const ver = allVersions.find((v) => v.id === versionId);
    if (!ver || !ver.snapshot) return null;

    const templates = this.getBATemplates();
    const idx = templates.findIndex((t) => t.id === ver.templateId);
    const restoredTpl: BATemplate = {
      ...ver.snapshot,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      // Save current state before restoring
      this.saveBATemplateVersion(
        templates[idx].id,
        `Snapshot otomatis sebelum pemulihan ke versi ${ver.versionTag || ver.versionNumber}`,
        this.getActiveUser().NAMA || 'Administrator'
      );
      templates[idx] = restoredTpl;
    } else {
      templates.push(restoredTpl);
    }

    this.setItem(STORAGE_KEYS.BA_TEMPLATES, templates);
    this.logAudit('RESTORE_TEMPLATE_VERSION', 'document_center', ver.templateId, {
      versionId,
      versionTag: ver.versionTag,
    });
    return restoredTpl;
  }

  public deleteBATemplateVersion(versionId: string): boolean {
    const allVersions = this.getBATemplateVersions();
    const filtered = allVersions.filter((v) => v.id !== versionId);
    if (filtered.length === allVersions.length) return false;
    this.setItem(STORAGE_KEYS.BA_TEMPLATE_VERSIONS, filtered);
    return true;
  }

  // --- Batch Status Update for Assets & Inventory Items ---
  public batchUpdateAssets(
    assetIds: string[],
    updates: {
      STATUS?: 'AKTIF' | 'TIDAK AKTIF' | 'DIHAPUS';
      KONDISI?: 'BAIK' | 'RUSAK RINGAN' | 'RUSAK BERAT';
      LOKASI?: string;
      PENANGGUNG_JAWAB?: string;
      KETERANGAN?: string;
    },
    docRef?: string
  ): { success: boolean; count: number } {
    if (!assetIds || assetIds.length === 0) return { success: false, count: 0 };

    const assets = this.getAssets();
    let updatedCount = 0;
    const now = new Date().toISOString().slice(0, 10);

    const newAssets = assets.map((ast) => {
      if (assetIds.includes(ast.ID) || assetIds.includes(ast.KODE_ASET)) {
        updatedCount++;
        const newNotes = docRef
          ? `${ast.KETERANGAN ? ast.KETERANGAN + ' | ' : ''}[BA Ref: ${docRef}] ${updates.KETERANGAN || ''}`.trim()
          : updates.KETERANGAN !== undefined
          ? updates.KETERANGAN
          : ast.KETERANGAN;

        return {
          ...ast,
          ...(updates.STATUS ? { STATUS: updates.STATUS } : {}),
          ...(updates.KONDISI ? { KONDISI: updates.KONDISI } : {}),
          ...(updates.LOKASI ? { LOKASI: updates.LOKASI } : {}),
          ...(updates.PENANGGUNG_JAWAB ? { PENANGGUNG_JAWAB: updates.PENANGGUNG_JAWAB } : {}),
          KETERANGAN: newNotes,
        };
      }
      return ast;
    });

    this.setItem(STORAGE_KEYS.ASSETS, newAssets);
    this.logAudit('BATCH_UPDATE_ASSETS', 'document_center', `${updatedCount}_assets`, {
      assetIds,
      updates,
      docRef,
    });
    return { success: true, count: updatedCount };
  }

  public batchUpdateItems(
    itemIds: string[],
    updates: {
      STATUS?: 'AKTIF' | 'NONAKTIF';
      LOKASI_DEFAULT?: string;
      KATEGORI?: string;
    },
    docRef?: string
  ): { success: boolean; count: number } {
    if (!itemIds || itemIds.length === 0) return { success: false, count: 0 };

    const items = this.getItems();
    let updatedCount = 0;

    const newItems = items.map((itm) => {
      if (itemIds.includes(itm.ID) || itemIds.includes(itm.KODE_BARANG)) {
        updatedCount++;
        return {
          ...itm,
          ...(updates.STATUS ? { STATUS: updates.STATUS } : {}),
          ...(updates.LOKASI_DEFAULT ? { LOKASI_DEFAULT: updates.LOKASI_DEFAULT } : {}),
          ...(updates.KATEGORI ? { KATEGORI: updates.KATEGORI } : {}),
        };
      }
      return itm;
    });

    this.setItem(STORAGE_KEYS.ITEMS, newItems);
    this.logAudit('BATCH_UPDATE_ITEMS', 'document_center', `${updatedCount}_items`, {
      itemIds,
      updates,
      docRef,
    });
    return { success: true, count: updatedCount };
  }

  // --- Public Media Items (Eskul & Prestasi) ---
  public getPublicMediaItems(): PublicMediaItem[] {
    return this.getItem<PublicMediaItem[]>(STORAGE_KEYS.PUBLIC_MEDIA_ITEMS, DEFAULT_PUBLIC_MEDIA);
  }

  public savePublicMediaItem(item: PublicMediaItem): PublicMediaItem {
    const items = this.getPublicMediaItems();
    let saved: PublicMediaItem;
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
      saved = items[index];
    } else {
      saved = { ...item, id: item.id || `PUB-MED-${Date.now()}` };
      items.unshift(saved);
    }
    this.setItem(STORAGE_KEYS.PUBLIC_MEDIA_ITEMS, items);
    this.logAudit(index >= 0 ? 'UPDATE' : 'CREATE', 'PUBLIC_MEDIA', saved.id, saved);
    return saved;
  }

  public deletePublicMediaItem(id: string): void {
    const items = this.getPublicMediaItems().filter((i) => i.id !== id);
    this.setItem(STORAGE_KEYS.PUBLIC_MEDIA_ITEMS, items);
    this.logAudit('DELETE', 'PUBLIC_MEDIA', id, { deletedId: id });
  }

  // --- Storage Performance & Health Utilities ---
  public getStorageUsageBreakdown(): { key: string; sizeKB: number }[] {
    const breakdown: { key: string; sizeKB: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const val = localStorage.getItem(k) || '';
          const sizeKB = Math.round((val.length * 2) / 1024 * 10) / 10;
          breakdown.push({ key: k, sizeKB });
        }
      }
      breakdown.sort((a, b) => b.sizeKB - a.sizeKB);
    } catch (e) {
      console.error('Error calculating storage usage:', e);
    }
    return breakdown;
  }

  public cleanExpiredScanLogs(maxDays: number = 30): number {
    let removedCount = 0;
    try {
      const keys = ['sdn6_qr_recent_scans_v1', 'sdn6_fab_recent_scans_v1'];
      const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;

      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const scans: any[] = JSON.parse(raw);
          if (Array.isArray(scans)) {
            const filtered = scans.filter((s) => s.timestamp && s.timestamp >= cutoff);
            removedCount += scans.length - filtered.length;
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      });
    } catch (e) {
      console.error('Error cleaning expired scan logs:', e);
    }
    return removedCount;
  }

  public optimizeStorage(): { freedKB: number; cleanedLogs: number } {
    const beforeBreakdown = this.getStorageUsageBreakdown();
    const totalBefore = beforeBreakdown.reduce((sum, item) => sum + item.sizeKB, 0);

    const cleanedLogs = this.cleanExpiredScanLogs(30);

    const afterBreakdown = this.getStorageUsageBreakdown();
    const totalAfter = afterBreakdown.reduce((sum, item) => sum + item.sizeKB, 0);

    const freedKB = Math.max(0, Math.round((totalBefore - totalAfter) * 10) / 10);
    return { freedKB, cleanedLogs };
  }

  // =========================================================================
  // DAILY SCAN AUTO SCHEDULER & EMAIL LOGS
  // =========================================================================
  public getDailyScanScheduleConfig(): DailyScanScheduleConfig {
    const raw = this.getItem<string>(STORAGE_KEYS.DAILY_SCAN_CONFIG, '');
    const config = this.getConfig();
    const defaultHeadmasterEmail = config.SCHOOL_EMAIL || 'sdnegeritangerang6@gmail.com';
    const defaultHeadmasterName = config.HEADMASTER || 'Liestya Kusuma Sari, S.Pd., M.Pd.';

    if (!raw) {
      return {
        enabled: true,
        time: '15:00',
        targetEmail: defaultHeadmasterEmail,
        targetName: defaultHeadmasterName,
        includeStudentAttendance: true,
        includeAssetScans: true,
        includeAssignmentScans: true,
        includeStockOpname: true,
        autoDriveBackup: true,
      };
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false,
        time: parsed.time || '15:00',
        targetEmail: parsed.targetEmail || defaultHeadmasterEmail,
        targetName: parsed.targetName || defaultHeadmasterName,
        includeStudentAttendance: parsed.includeStudentAttendance !== false,
        includeAssetScans: parsed.includeAssetScans !== false,
        includeAssignmentScans: parsed.includeAssignmentScans !== false,
        includeStockOpname: parsed.includeStockOpname !== false,
        autoDriveBackup: parsed.autoDriveBackup !== false,
        lastSentDate: parsed.lastSentDate,
        lastSentTimestamp: parsed.lastSentTimestamp,
      };
    } catch {
      return {
        enabled: true,
        time: '15:00',
        targetEmail: defaultHeadmasterEmail,
        targetName: defaultHeadmasterName,
        includeStudentAttendance: true,
        includeAssetScans: true,
        includeAssignmentScans: true,
        includeStockOpname: true,
        autoDriveBackup: true,
      };
    }
  }

  public saveDailyScanScheduleConfig(newConfig: Partial<DailyScanScheduleConfig>): void {
    const current = this.getDailyScanScheduleConfig();
    const merged = { ...current, ...newConfig };
    this.setItem(STORAGE_KEYS.DAILY_SCAN_CONFIG, JSON.stringify(merged));
  }

  public getDailyScanDeliveryLogs(): DailyScanDeliveryLog[] {
    const raw = this.getItem<string>(STORAGE_KEYS.DAILY_SCAN_LOGS, '[]');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public addDailyScanDeliveryLog(log: DailyScanDeliveryLog): void {
    const logs = this.getDailyScanDeliveryLogs();
    logs.unshift(log);
    // Keep last 100 delivery logs
    const capped = logs.slice(0, 100);
    this.setItem(STORAGE_KEYS.DAILY_SCAN_LOGS, JSON.stringify(capped));
  }

  public clearDailyScanDeliveryLogs(): void {
    this.setItem(STORAGE_KEYS.DAILY_SCAN_LOGS, JSON.stringify([]));
  }
}

export const db = new LocalStorageService();

