import { db } from './localStorageService';
import { googleWorkspace } from './googleWorkspace';

export interface AutoSyncStatus {
  isEnabled: boolean;
  intervalMinutes: number;
  realtimeEnabled: boolean;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  connectionType: 'OAUTH' | 'APPS_SCRIPT' | 'NONE';
  isSyncing: boolean;
  isRealtimePending: boolean;
  lastError: string | null;
}

class AutoSyncService {
  private timerId: any = null;
  private isSyncing: boolean = false;
  private lastError: string | null = null;
  private listeners: Array<() => void> = [];
  private realtimeDebounceTimer: any = null;
  private realtimeUnsub: (() => void) | null = null;

  // Keys that represent actual inventory/transaction data changes worth syncing
  private static readonly DATA_SYNC_KEYS = new Set([
    'BB_ITEMS',
    'BB_SUPPLIERS',
    'BB_BARANG_MASUK',
    'BB_BARANG_KELUAR',
    'BB_ASSETS',
    'BB_MUTASI',
    'BB_PEMELIHARAAN',
    'BB_PENGHAPUSAN',
    'BB_PENGAMBILAN_ATK',
    'BB_STOCK_OPNAME_SESSIONS',
    'BB_STOCK_OPNAME_SCANS',
    'BB_PROCUREMENT_PLANS',
    'BB_PROCUREMENT_PLAN_DETAILS',
    'BB_DOCUMENTS',
  ]);

  constructor() {
    if (typeof window !== 'undefined') {
      // Periodic ticker to check if auto-sync condition is met
      this.timerId = setInterval(() => {
        this.checkAndTriggerSync();
      }, 30000); // check every 30 seconds

      // Real-time event-driven sync: listen to storage changes
      this.realtimeUnsub = db.subscribe((key: string) => {
        this.handleDataChange(key);
      });
    }
  }

  private handleDataChange(key: string): void {
    const config = db.getConfig();
    if (config.REALTIME_SYNC_ENABLED !== 'YA') return;

    // Only sync for actual data mutations, not audit/config/notifications
    if (!AutoSyncService.DATA_SYNC_KEYS.has(key)) return;

    // Debounce: batch rapid consecutive changes (e.g., multi-item barang keluar)
    if (this.realtimeDebounceTimer) {
      clearTimeout(this.realtimeDebounceTimer);
    }
    this.realtimeDebounceTimer = setTimeout(() => {
      this.realtimeDebounceTimer = null;
      this.triggerSync(false);
    }, 5000); // 5-second debounce window
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bendahara-sync-completed'));
    }
  }

  public getStatus(): AutoSyncStatus {
    const config = db.getConfig();
    const isEnabled = config.AUTO_SYNC_ENABLED === 'YA';
    const intervalMinutes = Number(config.AUTO_SYNC_INTERVAL_MINUTES) || 15;
    const lastSyncTime = db.getLastSyncTime();

    const accessToken = db.getGoogleAccessToken();
    const sheetId = db.getConnectedGoogleSheetId();
    const appsScriptUrl = db.getAppsScriptUrl();

    let connectionType: 'OAUTH' | 'APPS_SCRIPT' | 'NONE' = 'NONE';
    if (accessToken && sheetId) {
      connectionType = 'OAUTH';
    } else if (appsScriptUrl) {
      connectionType = 'APPS_SCRIPT';
    }

    let nextSyncTime: string | null = null;
    if (isEnabled && connectionType !== 'NONE') {
      if (lastSyncTime) {
        const nextMs = new Date(lastSyncTime).getTime() + intervalMinutes * 60 * 1000;
        nextSyncTime = new Date(nextMs).toISOString();
      } else {
        nextSyncTime = new Date().toISOString();
      }
    }

    return {
      isEnabled,
      intervalMinutes,
      realtimeEnabled: config.REALTIME_SYNC_ENABLED === 'YA',
      lastSyncTime,
      nextSyncTime,
      connectionType,
      isSyncing: this.isSyncing,
      isRealtimePending: this.realtimeDebounceTimer !== null,
      lastError: this.lastError,
    };
  }

  public async triggerSync(isManual: boolean = false): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berjalan...' };
    }

    const config = db.getConfig();
    const accessToken = db.getGoogleAccessToken();
    const sheetId = db.getConnectedGoogleSheetId();
    const appsScriptUrl = db.getAppsScriptUrl();

    if (!accessToken && !sheetId && !appsScriptUrl) {
      const msg = 'Google Sheets belum terhubung. Silakan konfigurasi akun atau Apps Script terlebih dahulu.';
      this.lastError = msg;
      return { success: false, message: msg };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      if (accessToken && sheetId) {
        await googleWorkspace.pushAllDataToSheet(accessToken, sheetId);
        db.setLastSyncTime();
        db.logAudit('SYNC', 'AUTO_SYNC', sheetId, {
          mode: isManual ? 'MANUAL_TRIGGER' : 'BACKGROUND_INTERVAL',
          intervalMinutes: config.AUTO_SYNC_INTERVAL_MINUTES || 15,
        });
      } else if (appsScriptUrl) {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PUSH');
        db.setLastSyncTime();
        db.logAudit('SYNC', 'AUTO_SYNC', 'APPS_SCRIPT_WEB_APP', {
          mode: isManual ? 'MANUAL_TRIGGER' : 'BACKGROUND_INTERVAL',
          intervalMinutes: config.AUTO_SYNC_INTERVAL_MINUTES || 15,
        });
      }

      this.isSyncing = false;
      this.lastError = null;
      this.notify();
      return { success: true, message: 'Sinkronisasi berhasil diselesaikan!' };
    } catch (err: any) {
      this.isSyncing = false;
      const errMsg = err?.message || String(err);
      this.lastError = errMsg;
      this.notify();
      return { success: false, message: `Gagal sinkronisasi: ${errMsg}` };
    }
  }

  private async checkAndTriggerSync() {
    const config = db.getConfig();
    if (config.AUTO_SYNC_ENABLED !== 'YA') {
      return;
    }

    const accessToken = db.getGoogleAccessToken();
    const sheetId = db.getConnectedGoogleSheetId();
    const appsScriptUrl = db.getAppsScriptUrl();

    if ((!accessToken || !sheetId) && !appsScriptUrl) {
      return;
    }

    const intervalMinutes = Number(config.AUTO_SYNC_INTERVAL_MINUTES) || 15;
    const intervalMs = intervalMinutes * 60 * 1000;
    const lastSyncTime = db.getLastSyncTime();

    if (!lastSyncTime) {
      // Never synced, trigger first background sync
      await this.triggerSync(false);
      return;
    }

    const elapsed = Date.now() - new Date(lastSyncTime).getTime();
    if (elapsed >= intervalMs) {
      await this.triggerSync(false);
    }
  }
}

export const autoSyncService = new AutoSyncService();
