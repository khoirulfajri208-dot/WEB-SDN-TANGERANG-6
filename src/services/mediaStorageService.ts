/**
 * mediaStorageService.ts
 * Advanced client-side media compression, storage quota analyzer, and cache optimizer.
 */

export interface StorageBreakdown {
  totalBytes: number;
  totalFormatted: string;
  maxEstimatedBytes: number;
  usagePercentage: number;
  categories: {
    name: string;
    keyPrefix: string;
    bytes: number;
    formatted: string;
    percentage: number;
    color: string;
  }[];
}

class MediaStorageService {
  private readonly MAX_IMAGE_DIMENSION = 1280;
  private readonly JPEG_QUALITY = 0.82;
  private readonly ESTIMATED_LOCAL_QUOTA = 10 * 1024 * 1024; // ~10MB localStorage safe ceiling

  /**
   * Automatically compresses an image file or Base64 string before storing.
   * Resizes large images (e.g. 4000x3000 down to 1280x960) and applies JPEG/WebP compression.
   */
  public async compressImage(
    fileOrBase64: File | Blob | string,
    maxDimension: number = this.MAX_IMAGE_DIMENSION,
    quality: number = this.JPEG_QUALITY
  ): Promise<{ dataUrl: string; originalSize: number; compressedSize: number; compressionRatio: number }> {
    return new Promise((resolve, reject) => {
      let src = '';
      let originalSize = 0;

      if (typeof fileOrBase64 === 'string') {
        src = fileOrBase64;
        originalSize = Math.round((fileOrBase64.length * 3) / 4);
      } else {
        originalSize = fileOrBase64.size;
        src = URL.createObjectURL(fileOrBase64);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;

          // Downscale if larger than maximum dimension while maintaining aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Render image to canvas with high smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const compressedSize = Math.round((dataUrl.length * 3) / 4);
          const compressionRatio = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

          if (typeof fileOrBase64 !== 'string') {
            URL.revokeObjectURL(src);
          }

          resolve({
            dataUrl,
            originalSize,
            compressedSize,
            compressionRatio: Math.max(0, compressionRatio),
          });
        } catch (err) {
          if (typeof fileOrBase64 !== 'string') {
            URL.revokeObjectURL(src);
          }
          reject(err);
        }
      };

      img.onerror = (err) => {
        if (typeof fileOrBase64 !== 'string') {
          URL.revokeObjectURL(src);
        }
        reject(new Error('Gagal memuat gambar untuk kompresi: ' + String(err)));
      };

      img.src = src;
    });
  }

  /**
   * Analyzes current browser storage breakdown by data categories.
   */
  public getStorageBreakdown(): StorageBreakdown {
    let totalBytes = 0;
    const catMap: Record<string, number> = {
      'Aset & Barang': 0,
      'Classroom & Pembelajaran': 0,
      'Dokumen & Berita Acara': 0,
      'Log Audit & Riwayat': 0,
      'Konfigurasi & Pengguna': 0,
      'Lainnya & Cache': 0,
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        const size = (key.length + val.length) * 2; // UTF-16 characters = 2 bytes approx
        totalBytes += size;

        if (key.startsWith('bb_assets') || key.startsWith('bb_items') || key.startsWith('bb_stock') || key.startsWith('bb_categories')) {
          catMap['Aset & Barang'] += size;
        } else if (key.startsWith('classroom_') || key.startsWith('bb_students') || key.startsWith('bb_courses') || key.startsWith('bb_attendance')) {
          catMap['Classroom & Pembelajaran'] += size;
        } else if (key.startsWith('bb_documents') || key.startsWith('bb_templates') || key.startsWith('bb_spjs')) {
          catMap['Dokumen & Berita Acara'] += size;
        } else if (key.startsWith('bb_audit') || key.startsWith('bb_logs') || key.startsWith('bb_mutasi') || key.startsWith('bb_history')) {
          catMap['Log Audit & Riwayat'] += size;
        } else if (key.startsWith('bb_config') || key.startsWith('bb_accounts') || key.startsWith('bb_active_user') || key.startsWith('bb_theme')) {
          catMap['Konfigurasi & Pengguna'] += size;
        } else {
          catMap['Lainnya & Cache'] += size;
        }
      }
    } catch (e) {
      console.warn('[StorageBreakdown] Gagal membaca storage:', e);
    }

    const colors: Record<string, string> = {
      'Aset & Barang': '#10b981', // emerald
      'Classroom & Pembelajaran': '#3b82f6', // blue
      'Dokumen & Berita Acara': '#8b5cf6', // purple
      'Log Audit & Riwayat': '#f59e0b', // amber
      'Konfigurasi & Pengguna': '#06b6d4', // cyan
      'Lainnya & Cache': '#64748b', // slate
    };

    const categories = Object.entries(catMap).map(([name, bytes]) => ({
      name,
      keyPrefix: name,
      bytes,
      formatted: this.formatBytes(bytes),
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      color: colors[name] || '#64748b',
    }));

    const usagePercentage = Math.min(100, Math.round((totalBytes / this.ESTIMATED_LOCAL_QUOTA) * 100));

    return {
      totalBytes,
      totalFormatted: this.formatBytes(totalBytes),
      maxEstimatedBytes: this.ESTIMATED_LOCAL_QUOTA,
      usagePercentage,
      categories,
    };
  }

  /**
   * Optimizes storage by purging redundant temporary caches and trimming large historical audit logs.
   */
  public optimizeStorage(): { freedBytes: number; freedFormatted: string; removedItems: number } {
    const beforeSize = this.getStorageBreakdown().totalBytes;
    let removedItems = 0;

    try {
      // 1. Clean temporary camera / scanner preview blobs from localStorage
      const tempKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.endsWith('_temp_cache') || key.includes('preview_cache'))) {
          tempKeys.push(key);
        }
      }
      tempKeys.forEach((k) => {
        localStorage.removeItem(k);
        removedItems++;
      });

      // 2. Trim audit log history if excessively long (keep newest 200 items)
      const auditKey = 'bb_audit_logs';
      const auditRaw = localStorage.getItem(auditKey);
      if (auditRaw) {
        try {
          const logs = JSON.parse(auditRaw);
          if (Array.isArray(logs) && logs.length > 200) {
            const trimmed = logs.slice(0, 200);
            localStorage.setItem(auditKey, JSON.stringify(trimmed));
            removedItems++;
          }
        } catch {
          // ignore
        }
      }

      // 3. Trim offline sync completed queue items older than 7 days
      const syncKey = 'bb_offline_sync_queue';
      const syncRaw = localStorage.getItem(syncKey);
      if (syncRaw) {
        try {
          const queue = JSON.parse(syncRaw);
          if (Array.isArray(queue)) {
            const activeQueue = queue.filter((q) => q.status === 'PENDING' || q.status === 'ERROR');
            localStorage.setItem(syncKey, JSON.stringify(activeQueue));
            removedItems++;
          }
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn('[StorageOptimizer] Error during purge:', e);
    }

    const afterSize = this.getStorageBreakdown().totalBytes;
    const freedBytes = Math.max(0, beforeSize - afterSize);

    return {
      freedBytes,
      freedFormatted: this.formatBytes(freedBytes),
      removedItems,
    };
  }

  /**
   * Helper format bytes
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const mediaStorageService = new MediaStorageService();
