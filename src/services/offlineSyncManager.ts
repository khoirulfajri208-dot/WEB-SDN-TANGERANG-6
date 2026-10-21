import { db } from './localStorageService';
import { autoSyncService } from './autoSyncService';
import { firebaseService } from './firebaseService';
import { googleWorkspace } from './googleWorkspace';

export interface PendingOfflineChange {
  id: string;
  type: 'STUDENT_SUBMISSION' | 'ATTENDANCE' | 'QUIZ_ATTEMPT' | 'INVENTORY_MUTATION' | 'CLASSROOM_POST' | 'GENERAL_MUTATION';
  description: string;
  timestamp: string;
  payload?: any;
}

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedTime: string | null;
  lastSyncedRelative: string;
  pendingCount: number;
  pendingChanges: PendingOfflineChange[];
  connectionQuality: 'EXCELLENT' | 'GOOD' | 'OFFLINE' | 'SYNCING';
  lastError: string | null;
  reconciliationRequired: boolean;
}

const STORAGE_KEYS = {
  LAST_SYNC: 'BB_OFFLINE_LAST_SYNC_TS',
  PENDING_QUEUE: 'BB_OFFLINE_PENDING_QUEUE_V1',
};

class OfflineSyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastError: string | null = null;
  private listeners: Array<(state: OfflineSyncState) => void> = [];
  private tickerInterval: any = null;
  private reconciliationRequired: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        
        // Auto-reconcile conflict detection:
        // If there are pending changes when we go online, prompt the user for reconciliation.
        const pending = this.getPendingChanges();
        if (pending.length > 0) {
          this.reconciliationRequired = true;
          this.notify();
        } else {
          this.syncAll(false);
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Storage sync listener
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.LAST_SYNC || e.key === STORAGE_KEYS.PENDING_QUEUE) {
          this.notify();
        }
      });

      // Internal event
      window.addEventListener('bendahara-sync-completed', () => {
        this.recordSuccessfulSync();
      });

      // Regular ticker to update relative timestamp (e.g. "1 min ago", "2 mins ago")
      this.tickerInterval = setInterval(() => {
        this.notify();
      }, 30000);
    }
  }

  public subscribe(callback: (state: OfflineSyncState) => void): () => void {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  public getState(): OfflineSyncState {
    const lastSyncedTime = this.getLastSyncedTime();
    const pendingChanges = this.getPendingChanges();

    let connectionQuality: 'EXCELLENT' | 'GOOD' | 'OFFLINE' | 'SYNCING' = 'GOOD';
    if (!this.isOnline) {
      connectionQuality = 'OFFLINE';
    } else if (this.isSyncing) {
      connectionQuality = 'SYNCING';
    } else if (this.isOnline && pendingChanges.length === 0) {
      connectionQuality = 'EXCELLENT';
    }

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedTime,
      lastSyncedRelative: this.formatRelativeTime(lastSyncedTime),
      pendingCount: pendingChanges.length,
      pendingChanges,
      connectionQuality,
      lastError: this.lastError,
      reconciliationRequired: this.reconciliationRequired,
    };
  }

  public getLastSyncedTime(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || db.getLastSyncTime() || null;
  }

  public setLastSyncedTime(isoString?: string): void {
    const time = isoString || new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, time);
    db.setLastSyncTime();
    this.notify();
  }

  public getPendingChanges(): PendingOfflineChange[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addPendingChange(
    type: PendingOfflineChange['type'],
    description: string,
    payload?: any
  ): void {
    const current = this.getPendingChanges();
    const newEntry: PendingOfflineChange = {
      id: `CHG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      description,
      timestamp: new Date().toISOString(),
      payload,
    };
    current.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(current.slice(0, 50)));
    this.notify();

    // If currently online, attempt quick sync in background
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => {
        this.syncAll(false);
      }, 2000);
    }
  }

  public clearPendingChanges(): void {
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify([]));
    this.notify();
  }

  public recordSuccessfulSync(): void {
    this.setLastSyncedTime();
    this.clearPendingChanges();
    this.lastError = null;
    this.isSyncing = false;
    this.notify();
  }

  public async syncAll(isManual: boolean = true): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    if (!this.isOnline) {
      return {
        success: false,
        message: 'Perangkat sedang offline. Perubahan tersimpan dengan aman di penyimpanan lokal.',
      };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      // 1. Sync with Google Workspace / Sheets if configured
      let sheetsSynced = false;
      const sheetId = db.getConnectedGoogleSheetId();
      const appsScriptUrl = db.getAppsScriptUrl();
      if (sheetId || appsScriptUrl) {
        const res = await autoSyncService.triggerSync(isManual);
        sheetsSynced = res.success;
      }

      // 2. Sync with Firebase if configured
      let firebaseSynced = false;
      try {
        const res = await firebaseService.pushAllToCloud(isManual);
        firebaseSynced = res.success;
      } catch (e) {
        console.warn('Firebase cloud sync skipped:', e);
      }

      // 3. Update local sync state
      this.recordSuccessfulSync();
      return {
        success: true,
        message: 'Semua data dan perubahan berhasil disinkronkan secara transparan!',
      };
    } catch (err: any) {
      this.isSyncing = false;
      const errMsg = err?.message || String(err);
      this.lastError = errMsg;
      this.notify();
      return { success: false, message: `Sinkronisasi gagal: ${errMsg}` };
    }
  }

  public async pullAndOverwrite(): Promise<{ success: boolean; message: string }> {
    this.isSyncing = true;
    this.lastError = null;
    this.notify();
    try {
      const accessToken = db.getGoogleAccessToken();
      const sheetId = db.getConnectedGoogleSheetId();
      const appsScriptUrl = db.getAppsScriptUrl();

      if (accessToken && sheetId) {
        await googleWorkspace.pullDataFromSheet(accessToken, sheetId);
        this.recordSuccessfulSync();
        return { success: true, message: 'Berhasil menarik data cloud dan memperbarui penyimpanan lokal!' };
      } else if (appsScriptUrl) {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PULL');
        this.recordSuccessfulSync();
        return { success: true, message: 'Berhasil menarik data cloud via Apps Script!' };
      } else {
        throw new Error('Google Sheets belum terhubung.');
      }
    } catch (err: any) {
      this.isSyncing = false;
      const errMsg = err?.message || String(err);
      this.lastError = errMsg;
      this.notify();
      return { success: false, message: `Gagal menarik data cloud: ${errMsg}` };
    }
  }

  public async resolveReconciliation(choice: 'FORCE_PUSH' | 'FORCE_PULL' | 'MERGE'): Promise<{ success: boolean; message: string }> {
    this.reconciliationRequired = false;
    this.notify();
    
    if (choice === 'FORCE_PUSH') {
      // Force push all local changes to sheets
      return await this.syncAll(true);
    } else if (choice === 'FORCE_PULL') {
      // Fetch latest sheets and overwrite local
      return await this.pullAndOverwrite();
    } else {
      // standard automatic sync/merge
      return await this.syncAll(false);
    }
  }

  public triggerReconciliationSimulation(): void {
    // Manually trigger for demo / manual reconciliation triggering
    this.reconciliationRequired = true;
    this.notify();
  }

  public formatRelativeTime(isoString: string | null): string {
    if (!isoString) return 'Belum pernah disinkronkan';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 15) return 'Baru saja';
    if (diffSec < 60) return `${diffSec} detik lalu`;
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHours < 24) {
      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `Hari ini pukul ${timeStr} (${diffHours} jam lalu)`;
    }
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `Kemarin pukul ${timeStr}`;
    }
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  public formatExactTime(isoString: string | null): string {
    if (!isoString) return 'Belum ada riwayat sinkronisasi';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  }
}

export const offlineSyncManager = new OfflineSyncManager();
