import { db } from './localStorageService';
import { User, Item } from '../types';

// Schema mapping for all Google Sheets
export const SHEET_SCHEMAS: Record<string, string[]> = {
  CONFIG: ['KEY', 'VALUE'],
  USERS: ['ID', 'NIP', 'NAMA', 'EMAIL', 'ROLE', 'STATUS'],
  SUPPLIERS: ['ID', 'NAMA_TOKO', 'ALAMAT', 'TELEPON', 'NARAHUBUNG', 'STATUS'],
  ITEMS: [
    'ID',
    'KODE_BARANG',
    'NAMA_BARANG',
    'KATEGORI',
    'JENIS_SATUAN',
    'TIPE',
    'KODE_REKENING_RKAS',
    'BATAS_MINIMUM',
    'LOKASI_DEFAULT',
    'STATUS',
  ],
  BARANG_MASUK: [
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'BULAN_PENGADAAN',
    'NAMA_TOKO',
    'KODE_BARANG',
    'NAMA_BARANG',
    'JUMLAH',
    'JENIS_SATUAN',
    'HARGA_SATUAN',
    'TOTAL_PENGADAAN',
    'NAMA_SEKOLAH',
    'SUMBER_ANGGARAN',
    'KODE_REKENING_RKAS',
    'NOMOR_BKU',
    'NOMOR_KWITANSI',
    'FOTO_LINK',
    'PETUGAS',
    'KETERANGAN',
    'STOCK_SYNC_STATUS',
    'STOCK_SYNC_AT',
  ],
  BARANG_KELUAR: [
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'KODE_BARANG',
    'NAMA_BARANG',
    'JUMLAH',
    'JENIS_SATUAN',
    'PENERIMA',
    'UNIT_RUANGAN',
    'TUJUAN_PENGGUNAAN',
    'PETUGAS',
    'FOTO_LINK',
    'PARAF_LINK',
    'KETERANGAN',
    'STATUS_TRANSAKSI',
    'NOMOR_DOKUMEN',
    'DISETUJUI_OLEH',
    'WAKTU_PERSETUJUAN',
    'CATATAN_PERSETUJUAN',
    'STOCK_SYNC_STATUS',
    'STOCK_SYNC_AT',
  ],
  ASET: [
    'ID',
    'KODE_ASET',
    'KODE_BARANG',
    'NAMA_BARANG',
    'SUB_KEGIATAN',
    'KODE_REKENING',
    'KODE_LOKASI',
    'TANGGAL_BKU',
    'NOMOR_BKU',
    'NOMOR_KWITANSI',
    'NAMA_TOKO',
    'NAMA_BARANG_RKAS',
    'MERK',
    'SPESIFIKASI',
    'JUMLAH',
    'JENIS_SATUAN',
    'HARGA_SATUAN',
    'TOTAL_NILAI',
    'LOKASI',
    'PENANGGUNG_JAWAB',
    'KONDISI',
    'STATUS',
    'FOTO_LINK',
    'KETERANGAN',
    'QR_TOKEN',
    'QR_URL',
    'QR_TARGET_URL',
    'QR_TYPE',
  ],
  MUTASI: [
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'KODE_BARANG',
    'KODE_ASET',
    'NAMA_BARANG',
    'DARI_LOKASI',
    'KE_LOKASI',
    'DARI_PJ',
    'KE_PJ',
    'PETUGAS',
    'FOTO_LINK',
    'ALASAN',
    'KETERANGAN',
  ],
  STOCK_OPNAME_SESSION: [
    'ID',
    'TIMESTAMP',
    'NOMOR_OPNAME',
    'TANGGAL',
    'LOKASI',
    'PETUGAS',
    'STATUS',
    'JUMLAH_ITEM',
    'TOTAL_SELSIH',
    'CATATAN',
  ],
  STOCK_OPNAME_SCAN: [
    'ID',
    'SESSION_ID',
    'TIMESTAMP',
    'KODE_BARANG',
    'NAMA_BARANG',
    'STOK_SISTEM',
    'STOK_FISIK',
    'SELISIH',
    'JENIS_SATUAN',
    'LOKASI',
    'FOTO_LINK',
    'PETUGAS',
    'STATUS',
    'KETERANGAN',
  ],
  PEMELIHARAAN: [
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'KODE_ASET',
    'NAMA_BARANG',
    'JENIS_PEMELIHARAAN',
    'BIAYA',
    'PENYEDIA',
    'STATUS',
    'PETUGAS',
    'KETERANGAN',
  ],
  PENGHAPUSAN: [
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'KODE_ASET',
    'NAMA_BARANG',
    'ALASAN',
    'KONDISI_AKHIR',
    'DOKUMEN',
    'STATUS',
    'PETUGAS',
    'KETERANGAN',
  ],
  PENGAMBILAN_ATK: [
    'NO',
    'ID',
    'TIMESTAMP',
    'TANGGAL',
    'NIP',
    'NAMA_LENGKAP',
    'JABATAN',
    'NAMA_BARANG',
    'FOTO_BUKTI_LINK',
    'PARAF_LINK',
    'PETUGAS',
    'KETERANGAN',
  ],
  STOCK_LEDGER: [
    'LEDGER_ID',
    'TIMESTAMP',
    'TANGGAL',
    'KODE_BARANG',
    'NAMA_BARANG',
    'JENIS_SATUAN',
    'QTY_IN',
    'QTY_OUT',
    'SALDO_SESUDAH',
    'REF_TYPE',
    'REF_ID',
    'NOMOR_DOKUMEN',
    'STATUS',
    'SOURCE',
    'LEDGER_KEY',
  ],
  STOCK_SUMMARY: [
    'KODE_BARANG',
    'NAMA_BARANG',
    'JENIS_SATUAN',
    'TOTAL_MASUK',
    'TOTAL_KELUAR',
    'TOTAL_ADJUSTMENT',
    'STOK',
    'BATAS_MINIMUM',
    'LAST_MOVEMENT',
    'UPDATED_AT',
  ],
  PROCUREMENT_PLANS: [
    'ID',
    'TIMESTAMP',
    'NOMOR_RENCANA',
    'PERIODE',
    'STATUS',
    'DIAJUKAN_OLEH',
    'DISETUJUI_OLEH',
    'WAKTU_PERSETUJUAN',
    'CATATAN',
  ],
  PROCUREMENT_PLAN_DETAIL: [
    'ID',
    'PLAN_ID',
    'KODE_BARANG',
    'NAMA_BARANG',
    'STOK_SAAT_INI',
    'BATAS_MINIMUM',
    'RATA2_KELUAR_BULANAN',
    'LEAD_TIME_HARI',
    'TARGET_STOK',
    'REKOMENDASI_QTY',
    'ESTIMASI_HARGA',
    'ESTIMASI_TOTAL',
    'CATATAN',
  ],
  DOCUMENT_INDEX: [
    'ID',
    'TIMESTAMP',
    'JENIS_DOKUMEN',
    'NOMOR_DOKUMEN',
    'PERIODE',
    'MODULE',
    'RECORD_ID',
    'FILE_ID',
    'FILE_URL',
    'STATUS',
    'DIBUAT_OLEH',
    'KETERANGAN',
  ],
  AUDIT_TRAIL: ['ID', 'TIMESTAMP', 'AKSI', 'MODUL', 'RECORD_ID', 'USER_EMAIL', 'DATA_JSON'],
};

class GoogleWorkspaceService {
  private defaultClientId = '';
  private scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/meetings.space.created',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ];

  public getClientId(): string {
    return (
      db.getGoogleClientId() ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      this.defaultClientId
    );
  }

  public getAccessToken(): string | null {
    return db.getGoogleAccessToken();
  }

  public getSpreadsheetId(): string | null {
    return db.getConnectedGoogleSheetId();
  }

  public getAppsScriptUrl(): string | null {
    return db.getAppsScriptUrl();
  }

  public async requestOAuthToken(customClientId?: string): Promise<string> {
    const activeClientId = (customClientId || this.getClientId() || '').trim();

    if (!activeClientId) {
      throw new Error(
        'OAuth 2.0 Client ID belum diisi. Masukkan Client ID dari Google Cloud Console Anda di bawah ini.'
      );
    }

    return new Promise((resolve, reject) => {
      // @ts-expect-error Google GIS Client injected in index.html
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        reject(new Error('Google Identity Services SDK belum siap. Pastikan koneksi internet aktif.'));
        return;
      }

      try {
        // @ts-expect-error GIS initTokenClient
        const client = google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: this.scopes.join(' '),
          callback: (response: { access_token?: string; error?: string }) => {
            if (response.error) {
              if (response.error === 'popup_closed_by_user') {
                reject(new Error('Jendela persetujuan login Google ditutup oleh pengguna.'));
              } else if (response.error === 'access_denied') {
                reject(new Error('Akses ditolak. Berikan izin akses Google Sheets & Drive untuk melanjutkan.'));
              } else {
                reject(new Error(`Google OAuth Error: ${response.error}`));
              }
              return;
            }
            if (response.access_token) {
              db.setGoogleAccessToken(response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Gagal mendapatkan Access Token Google.'));
            }
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Apps Script Web App Sync (No OAuth Client ID Needed) ---
  public async syncWithAppsScript(webAppUrl: string, action: 'PUSH' | 'PULL'): Promise<any> {
    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('https://script.google.com/')) {
      throw new Error('URL Apps Script harus dimulai dengan https://script.google.com/...');
    }

    if (action === 'PUSH') {
      const payload = {
        action: 'PUSH',
        data: JSON.parse(db.exportFullJson()),
      };

      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Gagal menghubungi Apps Script (${res.status} ${res.statusText})`);
      }

      const resJson = await res.json();
      if (resJson.status !== 'success') {
        throw new Error(resJson.message || 'Gagal sinkronisasi data via Apps Script.');
      }
      db.setLastSyncTime();
      db.logAudit('SYNC', 'APPS_SCRIPT', 'WEB_APP', { action: 'PUSH_DATA' });
      return resJson;
    } else {
      const res = await fetch(`${cleanUrl}?action=PULL`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error(`Gagal mengambil data dari Apps Script (${res.status} ${res.statusText})`);
      }

      const resJson = await res.json();
      if (resJson.status !== 'success' || !resJson.data) {
        throw new Error(resJson.message || 'Format data dari Apps Script tidak valid.');
      }

      db.importFullJson(JSON.stringify(resJson.data));
      db.setLastSyncTime();
      db.logAudit('SYNC', 'APPS_SCRIPT', 'WEB_APP', { action: 'PULL_DATA' });
      return resJson;
    }
  }

  public async listUserSpreadsheets(accessToken: string): Promise<Array<{ id: string; name: string }>> {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=25`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal memuat daftar Google Spreadsheet.');
    }
    const json = await res.json();
    return json.files || [];
  }

  public async createCompleteDatabaseSpreadsheet(
    accessToken: string,
    title = 'Database Bendahara Barang Sekolah'
  ): Promise<{ id: string; url: string; title: string }> {
    const sheetTitles = Object.keys(SHEET_SCHEMAS);
    const sheetsPayload = sheetTitles.map((t) => ({
      properties: {
        title: t,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
    }));

    // 1. Create Spreadsheet with sheets
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `${title} - ${new Date().toLocaleDateString('id-ID')}`,
        },
        sheets: sheetsPayload,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
    }

    const created = await res.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    db.setConnectedGoogleSheetId(spreadsheetId);

    // 2. Populate Headers and Initial Data
    await this.pushAllDataToSheet(accessToken, spreadsheetId);

    return {
      id: spreadsheetId,
      url: spreadsheetUrl,
      title: created.properties?.title || title,
    };
  }

  public async pushAllDataToSheet(accessToken: string, spreadsheetId: string): Promise<void> {
    const config = db.getConfig();
    const users = db.getUsers();
    const suppliers = db.getSuppliers();
    const items = db.getItems();
    const masuk = db.getBarangMasuk();
    const keluar = db.getBarangKeluar();
    const assets = db.getAssets();
    const mutasi = db.getMutasi();
    const opSessions = db.getStockOpnameSessions();
    const opScans = db.getStockOpnameScans();
    const pemeliharaan = db.getPemeliharaan();
    const penghapusan = db.getPenghapusan();
    const atk = db.getPengambilanATK();
    const ledger = db.getStockLedger();
    const summary = db.getStockSummary();
    const plans = db.getProcurementPlans();
    const planDetails = db.getProcurementPlanDetails();
    const docs = db.getDocuments();
    const audit = db.getAuditTrail();

    const configRows = Object.entries(config).map(([k, v]) => [k, String(v ?? '')]);

    const valueRanges = [
      {
        range: 'CONFIG!A1:B' + (configRows.length + 1),
        values: [SHEET_SCHEMAS.CONFIG, ...configRows],
      },
      {
        range: 'USERS!A1:F' + (users.length + 1),
        values: [
          SHEET_SCHEMAS.USERS,
          ...users.map((u) => [u.ID, u.NIP, u.NAMA, u.EMAIL, u.ROLE, u.STATUS]),
        ],
      },
      {
        range: 'SUPPLIERS!A1:F' + (suppliers.length + 1),
        values: [
          SHEET_SCHEMAS.SUPPLIERS,
          ...suppliers.map((s) => [s.ID, s.NAMA_TOKO, s.ALAMAT, s.TELEPON, s.NARAHUBUNG, s.STATUS]),
        ],
      },
      {
        range: 'ITEMS!A1:J' + (items.length + 1),
        values: [
          SHEET_SCHEMAS.ITEMS,
          ...items.map((i) => [
            i.ID,
            i.KODE_BARANG,
            i.NAMA_BARANG,
            i.KATEGORI,
            i.JENIS_SATUAN,
            i.TIPE,
            i.KODE_REKENING_RKAS || '',
            i.BATAS_MINIMUM,
            i.LOKASI_DEFAULT,
            i.STATUS,
          ]),
        ],
      },
      {
        range: 'BARANG_MASUK!A1:U' + (masuk.length + 1),
        values: [
          SHEET_SCHEMAS.BARANG_MASUK,
          ...masuk.map((m) => [
            m.ID,
            m.TIMESTAMP,
            m.TANGGAL,
            m.BULAN_PENGADAAN || '',
            m.NAMA_TOKO,
            m.KODE_BARANG,
            m.NAMA_BARANG,
            m.JUMLAH,
            m.JENIS_SATUAN,
            m.HARGA_SATUAN,
            m.TOTAL_PENGADAAN,
            m.NAMA_SEKOLAH,
            m.SUMBER_ANGGARAN,
            m.KODE_REKENING_RKAS,
            m.NOMOR_BKU,
            m.NOMOR_KWITANSI,
            m.FOTO_LINK || '',
            m.PETUGAS,
            m.KETERANGAN,
            m.STOCK_SYNC_STATUS || 'SYNCED',
            m.STOCK_SYNC_AT || '',
          ]),
        ],
      },
      {
        range: 'BARANG_KELUAR!A1:U' + (keluar.length + 1),
        values: [
          SHEET_SCHEMAS.BARANG_KELUAR,
          ...keluar.map((k) => [
            k.ID,
            k.TIMESTAMP,
            k.TANGGAL,
            k.KODE_BARANG,
            k.NAMA_BARANG,
            k.JUMLAH,
            k.JENIS_SATUAN,
            k.PENERIMA,
            k.UNIT_RUANGAN,
            k.TUJUAN_PENGGUNAAN,
            k.PETUGAS,
            k.FOTO_LINK || '',
            k.PARAF_LINK || '',
            k.KETERANGAN,
            k.STATUS_TRANSAKSI,
            k.NOMOR_DOKUMEN,
            k.DISETUJUI_OLEH || '',
            k.WAKTU_PERSETUJUAN || '',
            k.CATATAN_PERSETUJUAN || '',
            k.STOCK_SYNC_STATUS || 'SYNCED',
            k.STOCK_SYNC_AT || '',
          ]),
        ],
      },
      {
        range: 'ASET!A1:AB' + (assets.length + 1),
        values: [
          SHEET_SCHEMAS.ASET,
          ...assets.map((a) => [
            a.ID,
            a.KODE_ASET,
            a.KODE_BARANG,
            a.NAMA_BARANG,
            a.SUB_KEGIATAN,
            a.KODE_REKENING,
            a.KODE_LOKASI,
            a.TANGGAL_BKU,
            a.NOMOR_BKU,
            a.NOMOR_KWITANSI,
            a.NAMA_TOKO,
            a.NAMA_BARANG_RKAS,
            a.MERK,
            a.SPESIFIKASI,
            a.JUMLAH,
            a.JENIS_SATUAN,
            a.HARGA_SATUAN,
            a.TOTAL_NILAI,
            a.LOKASI,
            a.PENANGGUNG_JAWAB,
            a.KONDISI,
            a.STATUS,
            a.FOTO_LINK || '',
            a.KETERANGAN || '',
            a.QR_TOKEN || a.KODE_ASET,
            a.QR_URL || '',
            a.QR_TARGET_URL || '',
            a.QR_TYPE || 'DETAIL_ASSET',
          ]),
        ],
      },
      {
        range: 'STOCK_SUMMARY!A1:J' + (summary.length + 1),
        values: [
          SHEET_SCHEMAS.STOCK_SUMMARY,
          ...summary.map((s) => [
            s.KODE_BARANG,
            s.NAMA_BARANG,
            s.JENIS_SATUAN,
            s.TOTAL_MASUK,
            s.TOTAL_KELUAR,
            s.TOTAL_ADJUSTMENT,
            s.STOK,
            s.BATAS_MINIMUM,
            s.LAST_MOVEMENT || '',
            s.UPDATED_AT || '',
          ]),
        ],
      },
      {
        range: 'STOCK_LEDGER!A1:O' + (ledger.length + 1),
        values: [
          SHEET_SCHEMAS.STOCK_LEDGER,
          ...ledger.map((l) => [
            l.LEDGER_ID,
            l.TIMESTAMP,
            l.TANGGAL,
            l.KODE_BARANG,
            l.NAMA_BARANG,
            l.JENIS_SATUAN,
            l.QTY_IN,
            l.QTY_OUT,
            l.SALDO_SESUDAH,
            l.REF_TYPE,
            l.REF_ID,
            l.NOMOR_DOKUMEN,
            l.STATUS,
            l.SOURCE,
            l.LEDGER_KEY,
          ]),
        ],
      },
    ];

    const body = {
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    };

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menyinkronkan data ke Google Sheet.');
    }

    db.setLastSyncTime();
    db.logAudit('SYNC', 'GOOGLE_SHEETS', spreadsheetId, { action: 'PUSH_ALL' });
  }

  public async testConnection(
    type: 'OAUTH' | 'APPS_SCRIPT',
    params?: { token?: string; sheetId?: string; appsScriptUrl?: string }
  ): Promise<{ success: boolean; message: string; latencyMs: number; details?: any }> {
    const startTime = Date.now();
    try {
      if (type === 'OAUTH') {
        const token = params?.token || this.getAccessToken();
        const sId = params?.sheetId || this.getSpreadsheetId();

        if (!token) {
          return {
            success: false,
            message: 'Token otentikasi Google belum ada. Hubungkan akun Google terlebih dahulu.',
            latencyMs: 0,
          };
        }

        // Test Drive access / User Info
        const driveRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!driveRes.ok) {
          const err = await driveRes.json().catch(() => ({}));
          throw new Error(
            err.error?.message || `Token tidak valid atau telah kedaluwarsa (${driveRes.status}). Silakan hubungkan ulang.`
          );
        }

        const driveData = await driveRes.json();
        const userEmail = driveData.user?.emailAddress || 'Akun Google Terverifikasi';

        // If sheetId exists, verify Sheet access
        let sheetTitle = '';
        if (sId) {
          const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sId}?fields=properties.title`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (sheetRes.ok) {
            const sheetData = await sheetRes.json();
            sheetTitle = sheetData.properties?.title || '';
          }
        }

        const latency = Date.now() - startTime;
        return {
          success: true,
          message: `Koneksi Google OAuth & Drive Berhasil! (${latency}ms)`,
          latencyMs: latency,
          details: {
            email: userEmail,
            sheetTitle,
            scopes: this.scopes,
          },
        };
      } else {
        const url = (params?.appsScriptUrl || this.getAppsScriptUrl() || '').trim();
        if (!url || !url.startsWith('https://script.google.com/')) {
          return {
            success: false,
            message: 'URL Google Apps Script belum valid (harus dimulai https://script.google.com/...)',
            latencyMs: 0,
          };
        }

        const res = await fetch(`${url}?action=PING`, { method: 'GET' });
        if (!res.ok) {
          throw new Error(`Apps Script merespons error status: ${res.status} ${res.statusText}`);
        }

        const latency = Date.now() - startTime;
        const resJson = await res.json().catch(() => ({ status: 'success' }));
        return {
          success: true,
          message: `Koneksi Apps Script Web App Terhubung! (${latency}ms)`,
          latencyMs: latency,
          details: resJson,
        };
      }
    } catch (err: any) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server Google.',
        latencyMs: latency,
      };
    }
  }

  public async pullDataFromSheet(accessToken: string, spreadsheetId: string): Promise<void> {
    const ranges = [
      'CONFIG!A1:B150',
      'USERS!A1:F300',
      'SUPPLIERS!A1:F300',
      'ITEMS!A1:J1000',
      'BARANG_MASUK!A1:U2000',
      'BARANG_KELUAR!A1:U2000',
      'ASET!A1:AB2000',
      'MUTASI!A1:N1000',
      'PEMELIHARAAN!A1:L1000',
      'PENGHAPUSAN!A1:L1000',
      'PENGAMBILAN_ATK!A1:L1000',
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&')}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menarik data dari Google Sheet.');
    }

    const json = await res.json();
    const valueRanges = json.valueRanges || [];

    // 1. CONFIG
    const configRange = valueRanges.find((r: { range: string }) => r.range.startsWith('CONFIG'));
    if (configRange && configRange.values && configRange.values.length > 1) {
      const currentConfig = db.getConfig();
      const updatedConfig: any = { ...currentConfig };
      configRange.values.slice(1).forEach((row: string[]) => {
        if (row[0] && row[1] !== undefined) {
          updatedConfig[row[0]] = row[1];
        }
      });
      db.saveConfig(updatedConfig);
    }

    // 2. USERS
    const usersRange = valueRanges.find((r: { range: string }) => r.range.startsWith('USERS'));
    if (usersRange && usersRange.values && usersRange.values.length > 1) {
      const parsedUsers = usersRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        NIP: r[1] || '',
        NAMA: r[2] || '',
        EMAIL: r[3] || '',
        ROLE: (r[4] || 'GURU') as User['ROLE'],
        STATUS: (r[5] || 'AKTIF') as User['STATUS'],
      })).filter((u: { ID: string }) => u.ID);
      if (parsedUsers.length > 0) {
        localStorage.setItem('BB_USERS', JSON.stringify(parsedUsers));
      }
    }

    // 3. SUPPLIERS
    const suppliersRange = valueRanges.find((r: { range: string }) => r.range.startsWith('SUPPLIERS'));
    if (suppliersRange && suppliersRange.values && suppliersRange.values.length > 1) {
      const parsedSuppliers = suppliersRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        NAMA_TOKO: r[1] || '',
        ALAMAT: r[2] || '',
        TELEPON: r[3] || '',
        NARAHUBUNG: r[4] || '',
        STATUS: (r[5] || 'AKTIF') as 'AKTIF' | 'NONAKTIF',
      })).filter((s: { ID: string }) => s.ID);
      if (parsedSuppliers.length > 0) {
        localStorage.setItem('BB_SUPPLIERS', JSON.stringify(parsedSuppliers));
      }
    }

    // 4. ITEMS
    const itemsRange = valueRanges.find((r: { range: string }) => r.range.startsWith('ITEMS'));
    if (itemsRange && itemsRange.values && itemsRange.values.length > 1) {
      const parsedItems = itemsRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        KODE_BARANG: r[1] || '',
        NAMA_BARANG: r[2] || '',
        KATEGORI: r[3] || 'Umum',
        JENIS_SATUAN: r[4] || 'Pcs',
        TIPE: (r[5] || 'Habis Pakai') as any,
        KODE_REKENING_RKAS: r[6] || '',
        BATAS_MINIMUM: Number(r[7]) || 5,
        LOKASI_DEFAULT: r[8] || 'Gudang Utama',
        STATUS: (r[9] || 'AKTIF') as Item['STATUS'],
      })).filter((i: { ID: string }) => i.ID);
      if (parsedItems.length > 0) {
        localStorage.setItem('BB_ITEMS', JSON.stringify(parsedItems));
      }
    }

    // 5. BARANG_MASUK
    const masukRange = valueRanges.find((r: { range: string }) => r.range.startsWith('BARANG_MASUK'));
    if (masukRange && masukRange.values && masukRange.values.length > 1) {
      const parsedMasuk = masukRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        TIMESTAMP: r[1] || new Date().toISOString(),
        TANGGAL: r[2] || '',
        BULAN_PENGADAAN: r[3] || '',
        NAMA_TOKO: r[4] || '',
        KODE_BARANG: r[5] || '',
        NAMA_BARANG: r[6] || '',
        JUMLAH: Number(r[7]) || 0,
        JENIS_SATUAN: r[8] || 'Pcs',
        HARGA_SATUAN: Number(r[9]) || 0,
        TOTAL_PENGADAAN: Number(r[10]) || 0,
        NAMA_SEKOLAH: r[11] || '',
        SUMBER_ANGGARAN: r[12] || 'BOS Reguler',
        KODE_REKENING_RKAS: r[13] || '',
        NOMOR_BKU: r[14] || '',
        NOMOR_KWITANSI: r[15] || '',
        FOTO_LINK: r[16] || '',
        PETUGAS: r[17] || '',
        KETERANGAN: r[18] || '',
        STOCK_SYNC_STATUS: (r[19] || 'SYNCED') as any,
        STOCK_SYNC_AT: r[20] || '',
      })).filter((m: { ID: string }) => m.ID);
      if (parsedMasuk.length > 0) {
        localStorage.setItem('BB_BARANG_MASUK', JSON.stringify(parsedMasuk));
      }
    }

    // 6. BARANG_KELUAR
    const keluarRange = valueRanges.find((r: { range: string }) => r.range.startsWith('BARANG_KELUAR'));
    if (keluarRange && keluarRange.values && keluarRange.values.length > 1) {
      const parsedKeluar = keluarRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        TIMESTAMP: r[1] || new Date().toISOString(),
        TANGGAL: r[2] || '',
        KODE_BARANG: r[3] || '',
        NAMA_BARANG: r[4] || '',
        JUMLAH: Number(r[5]) || 0,
        JENIS_SATUAN: r[6] || 'Pcs',
        PENERIMA: r[7] || '',
        UNIT_RUANGAN: r[8] || '',
        TUJUAN_PENGGUNAAN: r[9] || '',
        PETUGAS: r[10] || '',
        FOTO_LINK: r[11] || '',
        PARAF_LINK: r[12] || '',
        KETERANGAN: r[13] || '',
        STATUS_TRANSAKSI: (r[14] || 'DISETUJUI') as any,
        NOMOR_DOKUMEN: r[15] || '',
        DISETUJUI_OLEH: r[16] || '',
        WAKTU_PERSETUJUAN: r[17] || '',
        CATATAN_PERSETUJUAN: r[18] || '',
        STOCK_SYNC_STATUS: (r[19] || 'SYNCED') as any,
        STOCK_SYNC_AT: r[20] || '',
      })).filter((k: { ID: string }) => k.ID);
      if (parsedKeluar.length > 0) {
        localStorage.setItem('BB_BARANG_KELUAR', JSON.stringify(parsedKeluar));
      }
    }

    // 7. ASET
    const asetRange = valueRanges.find((r: { range: string }) => r.range.startsWith('ASET'));
    if (asetRange && asetRange.values && asetRange.values.length > 1) {
      const parsedAset = asetRange.values.slice(1).map((r: string[]) => ({
        ID: r[0] || '',
        KODE_ASET: r[1] || '',
        KODE_BARANG: r[2] || '',
        NAMA_BARANG: r[3] || '',
        SUB_KEGIATAN: r[4] || '',
        KODE_REKENING: r[5] || '',
        KODE_LOKASI: r[6] || '',
        TANGGAL_BKU: r[7] || '',
        NOMOR_BKU: r[8] || '',
        NOMOR_KWITANSI: r[9] || '',
        NAMA_TOKO: r[10] || '',
        NAMA_BARANG_RKAS: r[11] || '',
        MERK: r[12] || '',
        SPESIFIKASI: r[13] || '',
        JUMLAH: Number(r[14]) || 1,
        JENIS_SATUAN: r[15] || 'Unit',
        HARGA_SATUAN: Number(r[16]) || 0,
        TOTAL_NILAI: Number(r[17]) || 0,
        LOKASI: r[18] || '',
        PENANGGUNG_JAWAB: r[19] || '',
        KONDISI: (r[20] || 'Baik') as any,
        STATUS: (r[21] || 'TERSEDIA') as any,
        FOTO_LINK: r[22] || '',
        KETERANGAN: r[23] || '',
        QR_TOKEN: r[24] || r[1] || '',
        QR_URL: r[25] || '',
        QR_TARGET_URL: r[26] || '',
        QR_TYPE: (r[27] || 'DETAIL_ASSET') as any,
      })).filter((a: { ID: string }) => a.ID);
      if (parsedAset.length > 0) {
        localStorage.setItem('BB_ASSETS', JSON.stringify(parsedAset));
      }
    }

    db.rebuildStockLedger();
    db.setLastSyncTime();
    db.logAudit('SYNC', 'GOOGLE_SHEETS', spreadsheetId, { action: 'PULL_DATA' });
  }

  // --- Google Drive Backup & File Management ---

  public async ensureDriveFolder(accessToken: string, folderName = 'Backup Bendahara Barang'): Promise<string> {
    const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      if (searchJson.files && searchJson.files.length > 0) {
        return searchJson.files[0].id;
      }
    }

    const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createFolderRes.ok) {
      const err = await createFolderRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive.');
    }

    const folderJson = await createFolderRes.json();
    return folderJson.id;
  }

  public async getDriveFolderUrl(accessToken: string, folderName = 'Backup Bendahara Barang'): Promise<string> {
    const folderId = await this.ensureDriveFolder(accessToken, folderName);
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  public async createDriveBackup(
    accessToken: string,
    folderName = 'Backup Bendahara Barang'
  ): Promise<{ fileId: string; fileName: string; webViewLink: string; sizeBytes: number; createdTime: string }> {
    const folderId = await this.ensureDriveFolder(accessToken, folderName);
    const config = db.getConfig();
    const schoolName = (config.SCHOOL_NAME || 'Sekolah').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Backup_BendaharaBarang_${schoolName}_${timestamp}.json`;

    const fullData = db.exportFullJson();
    const blob = new Blob([fullData], { type: 'application/json' });

    const metadata = {
      name: fileName,
      parents: [folderId],
      description: `Pencadangan database lengkap Bendahara Barang Sekolah (${new Date().toLocaleString('id-ID')})`,
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal mengunggah file cadangan ke Google Drive.');
    }

    const uploadJson = await uploadRes.json();
    db.logAudit('BACKUP', 'GOOGLE_DRIVE', uploadJson.id, { fileName, size: uploadJson.size });

    return {
      fileId: uploadJson.id,
      fileName: uploadJson.name || fileName,
      webViewLink: uploadJson.webViewLink || `https://drive.google.com/file/d/${uploadJson.id}/view`,
      sizeBytes: Number(uploadJson.size) || fullData.length,
      createdTime: uploadJson.createdTime || new Date().toISOString(),
    };
  }

  public async listDriveBackups(
    accessToken: string,
    folderName = 'Backup Bendahara Barang'
  ): Promise<Array<{ id: string; name: string; size: string; createdTime: string; webViewLink: string }>> {
    const folderId = await this.ensureDriveFolder(accessToken, folderName);
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,createdTime,webViewLink)&orderBy=createdTime desc&pageSize=30`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membaca daftar file di Google Drive.');
    }

    const json = await res.json();
    return (json.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      size: f.size ? `${(Number(f.size) / 1024).toFixed(1)} KB` : 'JSON',
      createdTime: f.createdTime,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    }));
  }

  public async restoreFromDriveBackup(accessToken: string, fileId: string): Promise<void> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengunduh file cadangan dari Google Drive (${res.status} ${res.statusText}).`);
    }

    const rawJson = await res.text();
    db.importFullJson(rawJson);
    db.logAudit('RESTORE', 'GOOGLE_DRIVE', fileId, { action: 'RESTORE_FROM_DRIVE_BACKUP' });
  }

  // Upload a photo or signature file to Google Drive
  public async uploadToGoogleDrive(
    accessToken: string,
    fileName: string,
    mimeType: string,
    base64Data: string,
    folderName = 'Bukti Bendahara Barang'
  ): Promise<{ fileId: string; url: string }> {
    const folderId = await this.ensureDriveFolder(accessToken, folderName);

    // Upload file via multipart upload
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error?.message || 'Gagal mengupload file ke Google Drive.');
    }

    const uploadJson = await uploadRes.json();
    return {
      fileId: uploadJson.id,
      url: uploadJson.webViewLink || `https://drive.google.com/file/d/${uploadJson.id}/view`,
    };
  }

  // --- Google Docs ---
  public async createGoogleDoc(accessToken: string, title: string, contentText: string): Promise<{ id: string; url: string }> {
    const res = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat Google Doc.');
    }
    const doc = await res.json();
    const documentId = doc.documentId;

    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: contentText,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal menambahkan konten ke Google Doc.');
    }

    return {
      id: documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  }

  // --- Google Calendar & Google Meet ---
  public async createCalendarEvent(
    accessToken: string,
    event: {
      summary: string;
      description: string;
      location?: string;
      startTime: string; // ISO format
      endTime: string; // ISO format
      addMeetLink?: boolean;
    }
  ): Promise<{ id: string; htmlLink: string; meetLink?: string }> {
    const body: any = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'Asia/Jakarta',
      },
    };

    if (event.addMeetLink) {
      body.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat acara di Google Calendar.');
    }

    const data = await res.json();
    let meetLink = undefined;
    if (data.conferenceData && data.conferenceData.entryPoints) {
      const meetEntryPoint = data.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
      if (meetEntryPoint) {
        meetLink = meetEntryPoint.uri;
      }
    }

    return {
      id: data.id,
      htmlLink: data.htmlLink,
      meetLink,
    };
  }

  // --- Google Slides ---
  public async createInventorySlides(
    accessToken: string,
    title: string,
    slidesData: Array<{ heading: string; bullets: string[] }>
  ): Promise<{ id: string; url: string }> {
    const res = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat presentasi Google Slides.');
    }

    const presentation = await res.json();
    const presentationId = presentation.presentationId;

    const requests: any[] = [];
    slidesData.forEach((slide, idx) => {
      const slideId = `slide_page_${idx}`;
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: idx + 1,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      });

      const titleBoxId = `title_box_${idx}`;
      const bodyBoxId = `body_box_${idx}`;

      requests.push(
        {
          createShape: {
            objectId: titleBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 80, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 50,
                translateY: 50,
                unit: 'PT',
              },
            },
          },
        },
        {
          insertText: {
            objectId: titleBoxId,
            text: slide.heading,
          },
        },
        {
          createShape: {
            objectId: bodyBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 300, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 50,
                translateY: 150,
                unit: 'PT',
              },
            },
          },
        },
        {
          insertText: {
            objectId: bodyBoxId,
            text: slide.bullets.map((b) => `• ${b}`).join('\n'),
          },
        }
      );
    });

    if (requests.length > 0) {
      const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        console.warn('Gagal memproses batchUpdate slides:', err);
      }
    }

    return {
      id: presentationId,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    };
  }
}

export const googleWorkspace = new GoogleWorkspaceService();
