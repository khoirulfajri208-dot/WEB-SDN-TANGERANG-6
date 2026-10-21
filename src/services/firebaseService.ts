import 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './localStorageService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Global Firestore Error Handler matching the skill instructions
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isOfflineError =
    errMsg.includes('Could not reach Cloud Firestore backend') ||
    errMsg.includes('the client is offline') ||
    errMsg.includes('unavailable');

  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: isOfflineError ? 'Operating in local offline mode (backend unreachable).' : errMsg,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path
  };

  if (isOfflineError) {
    console.info('[Firestore Sync] Operating in local offline persistence mode for path:', path);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isRealtimeActive: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastError: string | null;
  cloudStats: {
    inventoryItems: number;
    assets: number;
    transactions: number;
    classroomCourses: number;
    assignments: number;
    submissions: number;
    students: number;
  };
}

class FirebaseService {
  private isSyncing: boolean = false;
  private isConnected: boolean = false;
  private isRealtimeActive: boolean = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private unsubs: Array<() => void> = [];
  private listeners: Array<() => void> = [];
  private debounceTimer: any = null;
  private isApplyingRemoteUpdate: boolean = false;

  private cloudStats = {
    inventoryItems: 0,
    assets: 0,
    transactions: 0,
    classroomCourses: 0,
    assignments: 0,
    submissions: 0,
    students: 0,
  };

  // Define normalized collections and their mapping to LocalStorage keys
  private collectionsConfig = [
    { key: 'BB_ACCOUNTS', path: 'accounts', name: 'Akun Pengguna' },
    { key: 'BB_ASSETS', path: 'assets', name: 'Aset Sekolah' },
    { key: 'BB_ITEMS', path: 'inventory_items', name: 'Stok Barang' },
    { key: 'BB_BARANG_MASUK', path: 'barang_masuk', name: 'Barang Masuk' },
    { key: 'BB_BARANG_KELUAR', path: 'barang_keluar', name: 'Barang Keluar' },
    { key: 'BB_CLASSROOM_COURSES', path: 'courses', name: 'Kelas & Mapel' },
    { key: 'BB_CLASSROOM_ASSIGNMENTS', path: 'assignments', name: 'Tugas Belajar' },
    { key: 'BB_CLASSROOM_SUBMISSIONS', path: 'submissions', name: 'Pengumpulan Siswa' },
    { key: 'BB_CLASSROOM_REPORTS', path: 'reports', name: 'Buku e-Rapor' },
    { key: 'BB_CLASSROOM_FORUM_POSTS_V3', path: 'forum_posts', name: 'Postingan Forum' },
    { key: 'BB_CLASSROOM_ATTENDANCE_V3', path: 'attendance', name: 'Absensi Kelas' },
    { key: 'BB_CLASSROOM_QUIZZES_V3', path: 'quizzes', name: 'Kuis CBT' },
    { key: 'BB_SUPPLIERS', path: 'suppliers', name: 'Pemasok Barang' },
    { key: 'BB_MUTASI', path: 'mutasi', name: 'Mutasi Barang' },
    { key: 'BB_PEMELIHARAAN', path: 'pemeliharaan', name: 'Pemeliharaan Aset' },
    { key: 'BB_PENGHAPUSAN', path: 'penghapusan', name: 'Penghapusan Aset' },
    { key: 'BB_PENGAMBILAN_ATK', path: 'pengambilan_atk', name: 'Pengambilan ATK' },
    { key: 'BB_STOCK_OPNAME_SESSIONS', path: 'stock_opname_sessions', name: 'Sesi Opname' },
    { key: 'BB_STOCK_OPNAME_SCANS', path: 'stock_opname_scans', name: 'Scan Opname' },
    { key: 'BB_PROCUREMENT_PLANS', path: 'procurement_plans', name: 'Rencana ARKAS' },
    { key: 'BB_PROCUREMENT_PLAN_DETAILS', path: 'procurement_plan_details', name: 'Detail Rencana ARKAS' }
  ];

  constructor() {
    this.lastSyncTime = localStorage.getItem('BB_FIREBASE_LAST_SYNC') || null;
    this.init();
  }

  public init() {
    try {
      if (typeof window !== 'undefined') {
        this.setupRealtimeListeners();
        this.setupLocalMutationListener();
      }
    } catch (err: any) {
      console.warn('Firebase sync initialization notice:', err?.message);
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Firebase listener error:', e);
      }
    });
  }

  public getStatus(): FirebaseSyncStatus {
    return {
      isConfigured: true,
      isConnected: this.isConnected,
      isRealtimeActive: this.isRealtimeActive,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      cloudStats: { ...this.cloudStats },
    };
  }

  // =========================================================================
  // PRODUCTION REALTIME LISTENER (NORMALIZED COLLECTION STREAMS)
  // =========================================================================
  public setupRealtimeListeners() {
    // Clear any previous active listeners
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];

    try {
      // Safety check: ensure firestore is initialized and usable
      if (!firestore || !(firestore as any).app) {
        console.warn('[FirebaseSync] Firestore instance not ready or stubbed. Local storage active.');
        return;
      }

      // Connect to each normalized Firestore collection in real-time
      this.collectionsConfig.forEach((col) => {
        const colRef = collection(firestore, col.path);
        
        const unsub = onSnapshot(
          colRef,
          (snapshot) => {
            this.isConnected = true;
            this.isRealtimeActive = true;
            this.lastError = null;

            const items: any[] = [];
            snapshot.forEach((docSnap) => {
              items.push(docSnap.data());
            });

            // Update stats
            this.updateCloudStatsForCol(col.key, items.length);

            // Sync down to LocalStorage only if we are not currently pushing
            if (!this.isSyncing && !this.isApplyingRemoteUpdate) {
              const localLast = Number(localStorage.getItem('BB_LOCAL_MUTATION_TS') || '0');
              const remoteLast = Number(localStorage.getItem(`BB_REMOTE_TS_${col.key}`) || '0');
              
              if (Date.now() - localLast > 4500) { // Safety margin to avoid clobbering active local changes
                // Protect seeded/local data from being wiped by an empty/fresh Firestore
                const localDataRaw = localStorage.getItem(col.key);
                let localCount = 0;
                try {
                  if (localDataRaw) {
                    const parsed = JSON.parse(localDataRaw);
                    if (Array.isArray(parsed)) localCount = parsed.length;
                  }
                } catch {
                  localCount = 0;
                }

                if (items.length === 0 && localCount > 0) {
                  console.info(`[Firebase Sync] Skip overwriting seeded local storage for '${col.key}' because remote collection is empty.`);
                } else {
                  this.isApplyingRemoteUpdate = true;
                  localStorage.setItem(col.key, JSON.stringify(items));
                  this.isApplyingRemoteUpdate = false;
                }
              }
            }
            this.notify();
          },
          (error) => {
            const isOffline =
              error.message.includes('Could not reach Cloud Firestore backend') ||
              error.message.includes('the client is offline') ||
              error.message.includes('unavailable');

            if (isOffline) {
              this.isConnected = false;
              this.isRealtimeActive = false;
              this.lastError = 'Mode Offline (Penyimpanan Lokal Aktif)';
              console.info(`[Firestore] Collection '${col.path}' operating in local offline mode.`);
            } else {
              console.warn(`Firestore collection listener failed on path '${col.path}':`, error.message);
              this.lastError = error.message;
            }
            this.notify();
          }
        );
        this.unsubs.push(unsub);
      });

      // Special Listener for Config Document
      const configRef = doc(firestore, 'configs', 'school_config');
      const unsubConfig = onSnapshot(configRef, (snap) => {
        if (snap.exists() && !this.isSyncing && !this.isApplyingRemoteUpdate) {
          localStorage.setItem('BB_CONFIG', JSON.stringify(snap.data()));
          this.notify();
        }
      });
      this.unsubs.push(unsubConfig);

    } catch (err: any) {
      console.warn('Error setting up production realtime collection listeners:', err?.message);
    }
  }

  private updateCloudStatsForCol(key: string, count: number) {
    switch (key) {
      case 'BB_ITEMS':
        this.cloudStats.inventoryItems = count;
        break;
      case 'BB_ASSETS':
        this.cloudStats.assets = count;
        break;
      case 'BB_BARANG_MASUK':
      case 'BB_BARANG_KELUAR':
        this.cloudStats.transactions = (this.cloudStats.transactions || 0) + count;
        break;
      case 'BB_CLASSROOM_COURSES':
        this.cloudStats.classroomCourses = count;
        break;
      case 'BB_CLASSROOM_ASSIGNMENTS':
        this.cloudStats.assignments = count;
        break;
      case 'BB_CLASSROOM_SUBMISSIONS':
        this.cloudStats.submissions = count;
        break;
      case 'BB_ACCOUNTS':
        this.cloudStats.students = count;
        break;
    }
  }

  // =========================================================================
  // LOCAL STORAGE CHANGE TRIGGER
  // =========================================================================
  private setupLocalMutationListener() {
    if (typeof window === 'undefined') return;

    db.subscribe((key: string) => {
      if (this.isApplyingRemoteUpdate) return;

      const now = Date.now();
      localStorage.setItem('BB_LOCAL_MUTATION_TS', String(now));

      // Debounce push to Firestore
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.pushAllToCloud(false);
      }, 4000);
    });
  }

  // =========================================================================
  // SYNC ACTION: DIFFERENTIAL COLLECTION PUSH (ANTI-1MB & ANTI-RACE CONDITION)
  // =========================================================================
  public async pushAllToCloud(isManual: boolean = true): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      const now = new Date().toISOString();
      const mutationTimestamp = Date.now();

      // 1. Sync Config document
      const configData = db.getConfig();
      try {
        await setDoc(doc(firestore, 'configs', 'school_config'), configData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'configs/school_config');
      }

      // 2. Sync all normalizable collections individually
      for (const col of this.collectionsConfig) {
        const localDataRaw = localStorage.getItem(col.key) || '[]';
        const items: any[] = JSON.parse(localDataRaw);

        // Fetch current cloud state to do differential write (only write what changed)
        const cloudSnap = await getDocs(collection(firestore, col.path));
        const cloudDocsMap = new Map<string, any>();
        cloudSnap.forEach((docSnap) => {
          cloudDocsMap.set(docSnap.id, docSnap.data());
        });

        // Track seen ids to detect deletions
        const localIds = new Set<string>();

        // Push new or updated docs
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const docId = String(item.ID || item.id || `doc-${i}`);
          localIds.add(docId);

          const existingDoc = cloudDocsMap.get(docId);
          const needsWrite = !existingDoc || JSON.stringify(existingDoc) !== JSON.stringify(item);

          if (needsWrite) {
            try {
              await setDoc(doc(firestore, col.path, docId), item);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `${col.path}/${docId}`);
            }
          }
        }

        // Delete documents that are removed locally (Differential Cleanup)
        for (const cloudId of cloudDocsMap.keys()) {
          if (!localIds.has(cloudId)) {
            try {
              await deleteDoc(doc(firestore, col.path, cloudId));
            } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, `${col.path}/${cloudId}`);
            }
          }
        }

        // Keep track of statistics
        this.updateCloudStatsForCol(col.key, items.length);
      }

      this.lastSyncTime = now.replace('T', ' ').substring(0, 19);
      localStorage.setItem('BB_FIREBASE_LAST_SYNC', this.lastSyncTime);
      this.isConnected = true;
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        message: 'Solusi Terbaik Aktif: Seluruh koleksi dinormalisasi & disinkronkan tanpa konflik!',
      };
    } catch (err: any) {
      console.error('Error syncing to production firestore:', err);
      this.lastError = err?.message || 'Gagal sinkronisasi ternormalisasi';
      this.isSyncing = false;
      this.notify();
      return {
        success: false,
        message: this.lastError || 'Gagal sinkronisasi data',
      };
    }
  }

  // =========================================================================
  // SYNC ACTION: PULL FROM PRODUCTION STACK
  // =========================================================================
  public async pullAllFromCloud(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      this.isApplyingRemoteUpdate = true;
      let colCount = 0;

      // 1. Pull Config
      const configSnap = await getDoc(doc(firestore, 'configs', 'school_config'));
      if (configSnap.exists()) {
        localStorage.setItem('BB_CONFIG', JSON.stringify(configSnap.data()));
      }

      // 2. Pull all normalized collections
      for (const col of this.collectionsConfig) {
        try {
          const colSnap = await getDocs(collection(firestore, col.path));
          const items: any[] = [];
          colSnap.forEach((docSnap) => {
            items.push(docSnap.data());
          });

          localStorage.setItem(col.key, JSON.stringify(items));
          this.updateCloudStatsForCol(col.key, items.length);
          colCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, col.path);
        }
      }

      const now = new Date().toISOString();
      this.lastSyncTime = now.replace('T', ' ').substring(0, 19);
      localStorage.setItem('BB_FIREBASE_LAST_SYNC', this.lastSyncTime);
      this.isConnected = true;
      this.isSyncing = false;
      this.isApplyingRemoteUpdate = false;
      this.notify();

      return {
        success: true,
        message: `Berhasil mengunduh & menormalisasi ${colCount} koleksi data terpisah dari Google Cloud!`,
      };
    } catch (err: any) {
      console.error('Error pulling from production firestore:', err);
      this.lastError = err?.message || 'Gagal mengunduh dari Cloud Database';
      this.isSyncing = false;
      this.isApplyingRemoteUpdate = false;
      this.notify();
      return {
        success: false,
        message: this.lastError || 'Gagal mengunduh data',
      };
    }
  }

  // File compression helper
  public async processFileAttachment(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }> {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              resolve({
                name: file.name,
                size: Math.round((compressedDataUrl.length * 3) / 4),
                type: 'image/jpeg',
                dataUrl: compressedDataUrl,
              });
            } else {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target?.result as string,
              });
            }
          };
          img.onerror = () => reject(new Error('Gagal memuat berkas gambar'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Gagal membaca berkas'));
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: e.target?.result as string,
          });
        };
        reader.onerror = () => reject(new Error('Gagal membaca berkas'));
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * Sync single account directly to Cloud Firestore
   */
  public async syncSingleAccountToCloud(account: any): Promise<boolean> {
    if (!account || !account.ID) return false;
    try {
      if (!firestore || !(firestore as any).app) return false;
      await setDoc(doc(firestore, 'accounts', account.ID), account, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FirebaseSync] Notice: could not persist account to cloud:', e);
      return false;
    }
  }

  /**
   * Specifically sync all accounts to Cloud Firestore
   */
  public async syncAccountsToCloud(): Promise<boolean> {
    try {
      if (!firestore || !(firestore as any).app) return false;
      const rawAccounts = localStorage.getItem('BB_ACCOUNTS') || '[]';
      const accounts: any[] = JSON.parse(rawAccounts);
      for (const acc of accounts) {
        if (!acc.ID) continue;
        await setDoc(doc(firestore, 'accounts', acc.ID), acc, { merge: true });
      }
      return true;
    } catch (e) {
      console.warn('[FirebaseSync] Notice: could not batch sync accounts to cloud:', e);
      return false;
    }
  }
  /**
   * Delete single account directly from Cloud Firestore
   */
  public async deleteSingleAccountFromCloud(accountId: string): Promise<boolean> {
    if (!accountId) return false;
    try {
      if (!firestore || !(firestore as any).app) return false;
      await deleteDoc(doc(firestore, 'accounts', accountId));
      return true;
    } catch (e) {
      console.warn('[FirebaseSync] Notice: could not delete account from cloud:', e);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
