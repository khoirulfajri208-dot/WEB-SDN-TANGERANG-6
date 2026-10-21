/**
 * Secure Data Masking Service
 *
 * Implements privacy-preserving data masking (NIS, Email, Personal Details)
 * with Data Loss Prevention (DLP) anti-exfiltration protections (disabling
 * clipboard copy/cut and right-click context menu on sensitive student data).
 */

export type SensitiveDataType =
  | 'nis'
  | 'email'
  | 'phone'
  | 'personal'
  | 'password'
  | 'nik'
  | 'text';

export interface MaskingAuditLog {
  id: string;
  timestamp: string;
  fieldId?: string;
  fieldName?: string;
  action: 'REVEAL' | 'MASK' | 'DLP_PREVENT_COPY' | 'DLP_PREVENT_CONTEXT_MENU' | 'GLOBAL_TOGGLE';
  actor?: string;
  details?: string;
}

export interface DlpAlert {
  id: string;
  action: 'copy' | 'cut' | 'contextmenu';
  fieldLabel?: string;
  timestamp: number;
  message: string;
}

const STORAGE_KEYS = {
  GLOBAL_MASKING: 'SDN6_SECURE_MASKING_ACTIVE',
  AUDIT_LOGS: 'SDN6_SECURE_MASKING_AUDIT',
};

class SecureDataMaskingService {
  private globalMaskingActive: boolean = true;
  private revealedFieldIds: Set<string> = new Set<string>();
  private autoMaskTimers: Map<string, any> = new Map<string, any>();
  private listeners: Set<() => void> = new Set<() => void>();
  private dlpListeners: Set<(alert: DlpAlert) => void> = new Set<(alert: DlpAlert) => void>();
  private auditLogs: MaskingAuditLog[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // By default, Secure Data Masking is always ACTIVE for high security
      const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_MASKING);
      if (stored !== null) {
        this.globalMaskingActive = stored === 'true';
      } else {
        this.globalMaskingActive = true;
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs).slice(-100);
      }
    } catch {
      this.globalMaskingActive = true;
    }
  }

  // --- STATE ACCESSORS ---

  public isGlobalMaskingEnabled(): boolean {
    return this.globalMaskingActive;
  }

  public setGlobalMasking(enabled: boolean): void {
    this.globalMaskingActive = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_MASKING, String(enabled));
    } catch {}

    // If re-enabling global masking, immediately obscure all individual revealed fields
    if (enabled) {
      this.clearAllRevealed();
    }

    this.logAudit({
      action: 'GLOBAL_TOGGLE',
      fieldName: 'Master DLP Toggle',
      details: enabled ? 'DLP & Masking diaktifkan' : 'DLP & Masking dinonaktifkan sementara',
    });

    this.notifyListeners();
  }

  public toggleGlobalMasking(): boolean {
    this.setGlobalMasking(!this.globalMaskingActive);
    return this.globalMaskingActive;
  }

  public isFieldRevealed(fieldId: string): boolean {
    if (!this.globalMaskingActive) return true;
    return this.revealedFieldIds.has(fieldId);
  }

  public revealField(fieldId: string, durationMs: number = 45000): void {
    this.revealedFieldIds.add(fieldId);

    // Cancel existing timer if any
    if (this.autoMaskTimers.has(fieldId)) {
      clearTimeout(this.autoMaskTimers.get(fieldId));
    }

    // Auto-remask after duration for maximum security compliance
    if (durationMs > 0) {
      const timer = setTimeout(() => {
        this.hideField(fieldId);
      }, durationMs);
      this.autoMaskTimers.set(fieldId, timer);
    }

    this.logAudit({
      action: 'REVEAL',
      fieldId,
      details: `Field "${fieldId}" ditampilkan (Auto-mask dalam ${Math.round(durationMs / 1000)} detik)`,
    });

    this.notifyListeners();
  }

  public hideField(fieldId: string): void {
    this.revealedFieldIds.delete(fieldId);
    if (this.autoMaskTimers.has(fieldId)) {
      clearTimeout(this.autoMaskTimers.get(fieldId));
      this.autoMaskTimers.delete(fieldId);
    }

    this.logAudit({
      action: 'MASK',
      fieldId,
      details: `Field "${fieldId}" disamarkan kembali`,
    });

    this.notifyListeners();
  }

  public toggleField(fieldId: string, durationMs: number = 45000): boolean {
    if (this.isFieldRevealed(fieldId)) {
      this.hideField(fieldId);
      return false;
    } else {
      this.revealField(fieldId, durationMs);
      return true;
    }
  }

  public clearAllRevealed(): void {
    this.revealedFieldIds.clear();
    this.autoMaskTimers.forEach((timer) => clearTimeout(timer));
    this.autoMaskTimers.clear();
    this.notifyListeners();
  }

  // --- MASKING ALGORITHMS ---

  /**
   * Masks NIS / NISN / NIPD
   * Example:
   * "6672" -> "6••2"
   * "3150148820" -> "31••••••20"
   */
  public maskNis(nis: string | number | undefined | null, isRevealed = false): string {
    if (nis === undefined || nis === null) return '-';
    const str = String(nis).trim();
    if (!str || str === '-') return '-';
    if (isRevealed || !this.globalMaskingActive) return str;

    if (str.length <= 4) {
      if (str.length <= 2) return '••';
      return `${str[0]}${'•'.repeat(str.length - 2)}${str[str.length - 1]}`;
    }

    // Keep first 2 and last 2 characters
    const first = str.slice(0, 2);
    const last = str.slice(-2);
    const middleCount = Math.max(str.length - 4, 4);
    return `${first}${'•'.repeat(middleCount)}${last}`;
  }

  /**
   * Masks Email addresses
   * Example:
   * "3150148820@siswa.sdntangerang6.sch.id" -> "31••••••20@siswa.sdntangerang6.sch.id"
   * "ahmad.fauzi@sdntangerang6.sch.id" -> "ah••••••zi@sdntangerang6.sch.id"
   */
  public maskEmail(email: string | undefined | null, isRevealed = false): string {
    if (!email) return '-';
    const str = String(email).trim();
    if (!str || str === '-') return '-';
    if (isRevealed || !this.globalMaskingActive) return str;

    const atIndex = str.indexOf('@');
    if (atIndex === -1) return this.maskGeneric(str);

    const userPart = str.slice(0, atIndex);
    const domainPart = str.slice(atIndex);

    let maskedUser = '';
    if (userPart.length <= 3) {
      maskedUser = `${userPart[0]}••`;
    } else {
      const first = userPart.slice(0, 2);
      const last = userPart.slice(-2);
      const middleDots = '•'.repeat(Math.min(userPart.length - 4, 6));
      maskedUser = `${first}${middleDots}${last}`;
    }

    return `${maskedUser}${domainPart}`;
  }

  /**
   * Masks Phone / Telepon
   * Example:
   * "081234567890" -> "0812•••••890"
   */
  public maskPhone(phone: string | undefined | null, isRevealed = false): string {
    if (!phone) return '-';
    const str = String(phone).trim();
    if (!str || str === '-') return '-';
    if (isRevealed || !this.globalMaskingActive) return str;

    if (str.length <= 6) return '••••••••';
    const first = str.slice(0, 4);
    const last = str.slice(-3);
    const middleCount = Math.max(str.length - 7, 4);
    return `${first}${'•'.repeat(middleCount)}${last}`;
  }

  /**
   * Masks Personal Details (Alamat, Tempat/Tanggal Lahir, Nama Orang Tua, dll)
   * Example:
   * "JAKARTA, 15-08-2015" -> "JAK••••••• (Tersamar)"
   */
  public maskPersonalDetails(text: string | undefined | null, isRevealed = false): string {
    if (!text) return '-';
    const str = String(text).trim();
    if (!str || str === '-') return '-';
    if (isRevealed || !this.globalMaskingActive) return str;

    if (str.length <= 4) return '••••';
    const visiblePrefix = str.slice(0, Math.min(3, Math.floor(str.length / 3)));
    return `${visiblePrefix}•••••••• (Sensitif)`;
  }

  /**
   * Masks Passwords
   */
  public maskPassword(password: string | undefined | null, isRevealed = false): string {
    if (!password) return '••••••••';
    if (isRevealed || !this.globalMaskingActive) return password;
    return '••••••••';
  }

  /**
   * Generic Masker
   */
  public maskGeneric(val: string | number | undefined | null, isRevealed = false): string {
    if (val === undefined || val === null) return '-';
    const str = String(val).trim();
    if (!str) return '-';
    if (isRevealed || !this.globalMaskingActive) return str;

    if (str.length <= 3) return '•••';
    const first = str[0];
    const last = str[str.length - 1];
    return `${first}${'•'.repeat(Math.min(str.length - 2, 6))}${last}`;
  }

  /**
   * Master mask formatter based on type
   */
  public maskValue(
    value: string | number | undefined | null,
    type: SensitiveDataType = 'text',
    isRevealed = false
  ): string {
    switch (type) {
      case 'nis':
        return this.maskNis(value, isRevealed);
      case 'email':
        return this.maskEmail(value ? String(value) : '', isRevealed);
      case 'phone':
        return this.maskPhone(value ? String(value) : '', isRevealed);
      case 'password':
        return this.maskPassword(value ? String(value) : '', isRevealed);
      case 'personal':
      case 'nik':
        return this.maskPersonalDetails(value ? String(value) : '', isRevealed);
      default:
        return this.maskGeneric(value, isRevealed);
    }
  }

  // --- DLP & ANTI-EXFILTRATION PROTECTION ---

  /**
   * Intercepts and blocks clipboard copy attempts on sensitive student data
   */
  public preventClipboardCopy(
    e: React.ClipboardEvent | ClipboardEvent,
    fieldLabel?: string
  ): void {
    e.preventDefault();
    if ('stopPropagation' in e) e.stopPropagation();

    this.triggerDlpAlert('copy', fieldLabel);
    this.logAudit({
      action: 'DLP_PREVENT_COPY',
      fieldName: fieldLabel || 'Data Sensitif Siswa',
      details: 'Percobaan penyalinan ke clipboard diblokir oleh Secure Data Masking',
    });
  }

  /**
   * Intercepts and blocks clipboard cut attempts on sensitive student data
   */
  public preventClipboardCut(
    e: React.ClipboardEvent | ClipboardEvent,
    fieldLabel?: string
  ): void {
    e.preventDefault();
    if ('stopPropagation' in e) e.stopPropagation();

    this.triggerDlpAlert('cut', fieldLabel);
    this.logAudit({
      action: 'DLP_PREVENT_COPY',
      fieldName: fieldLabel || 'Data Sensitif Siswa',
      details: 'Percobaan pemotongan ke clipboard diblokir oleh Secure Data Masking',
    });
  }

  /**
   * Intercepts and blocks right-click context menu on sensitive student data
   */
  public preventContextMenu(
    e: React.MouseEvent | MouseEvent,
    fieldLabel?: string
  ): void {
    e.preventDefault();
    if ('stopPropagation' in e) e.stopPropagation();

    this.triggerDlpAlert('contextmenu', fieldLabel);
    this.logAudit({
      action: 'DLP_PREVENT_CONTEXT_MENU',
      fieldName: fieldLabel || 'Data Sensitif Siswa',
      details: 'Menu klik kanan (context menu) diblokir untuk mencegah eksfiltrasi data',
    });
  }

  private triggerDlpAlert(action: 'copy' | 'cut' | 'contextmenu', fieldLabel?: string): void {
    const actionLabel =
      action === 'copy'
        ? 'Penyalinan (Clipboard Copy)'
        : action === 'cut'
        ? 'Pemotongan Teks (Cut)'
        : 'Klik Kanan (Context Menu)';

    const alert: DlpAlert = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      fieldLabel,
      timestamp: Date.now(),
      message: `Perlindungan Privasi Siswa Aktif: ${actionLabel} pada ${
        fieldLabel || 'data sensitif'
      } dibatasi untuk mencegah kebocoran data (Data Loss Prevention / DLP).`,
    };

    this.dlpListeners.forEach((fn) => {
      try {
        fn(alert);
      } catch (err) {
        console.error('Error in DLP listener:', err);
      }
    });

    // Also trigger custom browser window event for wide broadcast
    try {
      window.dispatchEvent(
        new CustomEvent('sdn6-dlp-violation-prevented', {
          detail: alert,
        })
      );
    } catch {}
  }

  // --- SUBSCRIBERS & AUDIT ---

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public subscribeDlpAlert(fn: (alert: DlpAlert) => void): () => void {
    this.dlpListeners.add(fn);
    return () => {
      this.dlpListeners.delete(fn);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error notifying masking listener:', err);
      }
    });
  }

  private logAudit(entry: Omit<MaskingAuditLog, 'id' | 'timestamp'>): void {
    const log: MaskingAuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
    } catch {}
  }

  public getAuditLogs(): MaskingAuditLog[] {
    return [...this.auditLogs];
  }
}

export const maskingService = new SecureDataMaskingService();
