import QRCode from 'qrcode';
import { Asset, Config } from '../types';

export interface QRStickerCustomLayout {
  // Header options
  showKop?: boolean;
  kopText?: string;
  showSchoolName?: boolean;
  schoolName?: string;
  showNpsn?: boolean;
  npsnText?: string;

  // Asset Information Toggles
  showAssetCode?: boolean;
  showAssetName?: boolean;
  showCategory?: boolean;
  showSpecification?: boolean;
  showLocation?: boolean;
  showPj?: boolean;
  showNip?: boolean;
  customPj?: string;
  customNip?: string;
  showYear?: boolean;
  showCondition?: boolean;
  showPrice?: boolean;

  // Visual & Structure Layout
  layoutMode?: 'landscape_left' | 'landscape_right' | 'portrait_top' | 'compact' | 'badge';
  colorTheme?: 'emerald' | 'navy' | 'slate' | 'monochrome' | 'amber' | 'burgundy';
  borderStyle?: 'double' | 'single' | 'rounded' | 'none';
  fontSizeScale?: number; // 0.8 to 1.3
  qrSizeRatio?: 'compact' | 'normal' | 'large';
  qrFgColor?: string;
  qrBgColor?: string;
  qrErrorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  includeLogoInQR?: boolean;
  logoSource?: 'school' | 'city' | 'tutwuri' | 'custom';
  customLogoUrl?: string;
}

export class QrService {
  public async generateQRCode(
    text: string,
    width = 300,
    fgColor = '#000000',
    bgColor = '#ffffff',
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'H'
  ): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width,
        margin: 1,
        errorCorrectionLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
    } catch (e) {
      console.error('QR generation error:', e);
      return '';
    }
  }

  public async drawAssetSticker(
    canvas: HTMLCanvasElement,
    asset: Asset,
    config: Config,
    options?: QRStickerCustomLayout
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Theme Colors
    const theme = options?.colorTheme || 'emerald';
    const themes = {
      emerald: {
        primary: '#14532d',
        accent: '#166534',
        subtle: '#dcfce7',
        border: '#15803d',
        divider: '#bbf7d0',
        textDark: '#0f172a',
        textMuted: '#475569',
        headerBg: '#f0fdf4',
      },
      navy: {
        primary: '#1e3a8a',
        accent: '#2563eb',
        subtle: '#dbeafe',
        border: '#1d4ed8',
        divider: '#bfdbfe',
        textDark: '#0f172a',
        textMuted: '#475569',
        headerBg: '#eff6ff',
      },
      slate: {
        primary: '#334155',
        accent: '#475569',
        subtle: '#f1f5f9',
        border: '#64748b',
        divider: '#e2e8f0',
        textDark: '#0f172a',
        textMuted: '#64748b',
        headerBg: '#f8fafc',
      },
      monochrome: {
        primary: '#000000',
        accent: '#111111',
        subtle: '#ffffff',
        border: '#000000',
        divider: '#cccccc',
        textDark: '#000000',
        textMuted: '#333333',
        headerBg: '#ffffff',
      },
      amber: {
        primary: '#92400e',
        accent: '#d97706',
        subtle: '#fef3c7',
        border: '#b45309',
        divider: '#fde68a',
        textDark: '#1e293b',
        textMuted: '#78350f',
        headerBg: '#fffbeb',
      },
      burgundy: {
        primary: '#881337',
        accent: '#be123c',
        subtle: '#ffe4e6',
        border: '#9f1239',
        divider: '#fecdd3',
        textDark: '#1e293b',
        textMuted: '#4c0519',
        headerBg: '#fff1f2',
      },
    };
    const c = themes[theme] || themes.emerald;

    // Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const borderStyle = options?.borderStyle || 'double';
    const border = Math.max(5, Math.round(h * 0.022));
    const radius = borderStyle === 'rounded' ? Math.max(16, Math.round(h * 0.08)) : 10;

    // Outer Border Drawing
    if (borderStyle !== 'none') {
      ctx.strokeStyle = c.primary;
      ctx.lineWidth = border;
      this.roundRect(ctx, border / 2, border / 2, w - border, h - border, radius);
      ctx.stroke();

      if (borderStyle === 'double') {
        const innerOffset = border * 1.6;
        ctx.strokeStyle = c.border;
        ctx.lineWidth = Math.max(1.5, Math.round(border * 0.25));
        this.roundRect(
          ctx,
          innerOffset,
          innerOffset,
          w - innerOffset * 2,
          h - innerOffset * 2,
          Math.max(4, radius - border)
        );
        ctx.stroke();
      }
    }

    const layoutMode = options?.layoutMode || 'landscape_left';

    // QR Target generation
    const qrTarget =
      asset.QR_TARGET_URL ||
      `${window.location.origin}/?scan=${encodeURIComponent(asset.KODE_ASET)}${
        asset.DRIVE_FILE_URL ? '&drive=' + encodeURIComponent(asset.DRIVE_FILE_URL) : ''
      }`;

    // Layout Mode 1: Portrait / Top QR Mode
    if (layoutMode === 'portrait_top') {
      await this.drawPortraitLayout(ctx, w, h, asset, config, options, c, qrTarget);
      return;
    }

    // Layout Mode 2: Landscape Right QR Mode
    if (layoutMode === 'landscape_right') {
      await this.drawLandscapeRightLayout(ctx, w, h, asset, config, options, c, qrTarget);
      return;
    }

    // Layout Mode 3: Badge / Official ID Card Style
    if (layoutMode === 'badge') {
      await this.drawBadgeLayout(ctx, w, h, asset, config, options, c, qrTarget);
      return;
    }

    // Default: Landscape Left QR Mode
    await this.drawLandscapeLeftLayout(ctx, w, h, asset, config, options, c, qrTarget);
  }

  // --- Landscape Left QR Layout ---
  private async drawLandscapeLeftLayout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    asset: Asset,
    config: Config,
    options: QRStickerCustomLayout | undefined,
    c: any,
    qrTarget: string
  ): Promise<void> {
    const qrRatio = options?.qrSizeRatio || 'normal';
    const leftRatio = qrRatio === 'large' ? 0.88 : qrRatio === 'compact' ? 0.68 : 0.78;
    const leftWidth = Math.round(h * leftRatio);
    const qrPadding = Math.round(h * 0.07);
    const qrSize = leftWidth - 2 * qrPadding;

    // Divider Line
    ctx.beginPath();
    ctx.strokeStyle = c.divider;
    ctx.lineWidth = Math.max(2, Math.round(h * 0.008));
    ctx.moveTo(leftWidth, Math.round(h * 0.08));
    ctx.lineTo(leftWidth, h - Math.round(h * 0.08));
    ctx.stroke();

    // QR Image & Center Logo
    await this.drawQRCodeWithLogo(ctx, qrPadding, qrPadding, qrSize, qrTarget, config, options, c.primary);

    // Right Content Area
    const textStartX = leftWidth + Math.round(h * 0.08);
    const maxTextWidth = w - textStartX - Math.round(h * 0.06);

    let curY = Math.round(h * 0.16);

    // 1. Header (Kop Instansi)
    if (options?.showKop !== false) {
      const kop = options?.kopText || 'UPT SATUAN PENDIDIKAN';
      ctx.fillStyle = c.textMuted;
      ctx.font = `700 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      ctx.textAlign = 'left';
      this.fitText(ctx, kop.toUpperCase(), textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.11);
    }

    // 2. School Name & NPSN
    if (options?.showSchoolName !== false) {
      const school = options?.schoolName || config.SCHOOL_NAME;
      const npsn = options?.showNpsn !== false ? ` • NPSN: ${options?.npsnText || config.SCHOOL_NPSN || '20606498'}` : '';
      ctx.fillStyle = c.primary;
      ctx.font = `900 ${Math.round(h * 0.095)}px Inter, system-ui, Arial`;
      this.fitText(ctx, `${school}${npsn}`, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.08);

      // Horizontal separator
      ctx.beginPath();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = Math.max(2.5, Math.round(h * 0.01));
      ctx.moveTo(textStartX, curY);
      ctx.lineTo(w - Math.round(h * 0.06), curY);
      ctx.stroke();
      curY += Math.round(h * 0.14);
    }

    // 3. Kode Aset
    if (options?.showAssetCode !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `900 ${Math.round(h * 0.14)}px "Courier New", monospace, Arial`;
      this.fitText(ctx, asset.KODE_ASET, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.12);
    }

    // 4. Nama Aset & Kategori
    if (options?.showAssetName !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `800 ${Math.round(h * 0.1)}px Inter, system-ui, Arial`;
      const catTag = options?.showCategory !== false ? ` [${asset.KIB_KATEGORI || asset.KATEGORI || 'KIB B'}]` : '';
      this.fitText(ctx, `${asset.NAMA_BARANG}${catTag}`, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.1);
    }

    // 5. Spesifikasi / Merk (Opsional)
    if (options?.showSpecification !== false && asset.MERK_SPESIFIKASI) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `600 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      this.fitText(ctx, `Merk/Spek: ${asset.MERK_SPESIFIKASI}`, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.09);
    }

    // 6. Penanggung Jawab & NIP
    const pjName = options?.customPj || asset.PENANGGUNG_JAWAB || 'Penanggung Jawab Ruangan';
    const nipVal = options?.customNip || (asset as any).NIP || (asset as any).NIP_PJ || '';
    if (options?.showPj !== false || (options?.showNip !== false && nipVal)) {
      ctx.fillStyle = c.primary;
      ctx.font = `700 ${Math.round(h * 0.075)}px Inter, system-ui, Arial`;
      let pjText = `PJ: ${pjName}`;
      if (options?.showNip !== false && nipVal) {
        pjText += ` (NIP: ${nipVal})`;
      }
      this.fitText(ctx, pjText, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.09);
    }

    // 7. Lokasi, Tahun & Kondisi Baris Bawah
    const footerParts: string[] = [];
    if (options?.showLocation !== false) footerParts.push(`Lok: ${asset.LOKASI}`);
    if (options?.showYear !== false) footerParts.push(`Thn: ${asset.TAHUN_PEROLEHAN}`);
    if (options?.showCondition !== false) footerParts.push(`Kondisi: ${asset.KONDISI}`);
    if (options?.showPrice && asset.TOTAL_NILAI) {
      footerParts.push(`Nilai: Rp ${asset.TOTAL_NILAI.toLocaleString('id-ID')}`);
    }

    if (footerParts.length > 0) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `600 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      this.fitText(ctx, footerParts.join(' • '), textStartX, curY, maxTextWidth);
    }
  }

  // --- Landscape Right QR Layout ---
  private async drawLandscapeRightLayout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    asset: Asset,
    config: Config,
    options: QRStickerCustomLayout | undefined,
    c: any,
    qrTarget: string
  ): Promise<void> {
    const qrSize = Math.round(h * 0.72);
    const qrPadding = Math.round(h * 0.08);
    const qrX = w - qrSize - qrPadding;
    const qrY = qrPadding;

    // Divider Line
    ctx.beginPath();
    ctx.strokeStyle = c.divider;
    ctx.lineWidth = Math.max(2, Math.round(h * 0.008));
    ctx.moveTo(qrX - Math.round(h * 0.06), Math.round(h * 0.08));
    ctx.lineTo(qrX - Math.round(h * 0.06), h - Math.round(h * 0.08));
    ctx.stroke();

    // QR Code on right with Center Logo
    await this.drawQRCodeWithLogo(ctx, qrX, qrY, qrSize, qrTarget, config, options, c.primary);

    // Left Typography Area
    const textStartX = Math.round(h * 0.08);
    const maxTextWidth = qrX - textStartX - Math.round(h * 0.1);
    let curY = Math.round(h * 0.16);

    // Kop
    if (options?.showKop !== false) {
      const kop = options?.kopText || 'UPT SATUAN PENDIDIKAN';
      ctx.fillStyle = c.textMuted;
      ctx.font = `700 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      this.fitText(ctx, kop.toUpperCase(), textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.11);
    }

    // School Name
    if (options?.showSchoolName !== false) {
      const school = options?.schoolName || config.SCHOOL_NAME;
      ctx.fillStyle = c.primary;
      ctx.font = `900 ${Math.round(h * 0.095)}px Inter, system-ui, Arial`;
      this.fitText(ctx, school, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.08);

      ctx.beginPath();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = Math.max(2.5, Math.round(h * 0.01));
      ctx.moveTo(textStartX, curY);
      ctx.lineTo(qrX - Math.round(h * 0.08), curY);
      ctx.stroke();
      curY += Math.round(h * 0.14);
    }

    // Kode Aset
    if (options?.showAssetCode !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `900 ${Math.round(h * 0.14)}px "Courier New", monospace, Arial`;
      this.fitText(ctx, asset.KODE_ASET, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.12);
    }

    // Nama Aset
    if (options?.showAssetName !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `800 ${Math.round(h * 0.1)}px Inter, system-ui, Arial`;
      const catTag = options?.showCategory !== false ? ` (${asset.KIB_KATEGORI || 'KIB B'})` : '';
      this.fitText(ctx, `${asset.NAMA_BARANG}${catTag}`, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.1);
    }

    // PJ & NIP
    const pjName = options?.customPj || asset.PENANGGUNG_JAWAB || 'Penanggung Jawab';
    const nipVal = options?.customNip || (asset as any).NIP || (asset as any).NIP_PJ || '';
    if (options?.showPj !== false) {
      ctx.fillStyle = c.primary;
      ctx.font = `700 ${Math.round(h * 0.075)}px Inter, system-ui, Arial`;
      let pjText = `PJ: ${pjName}`;
      if (options?.showNip !== false && nipVal) pjText += ` • NIP: ${nipVal}`;
      this.fitText(ctx, pjText, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.09);
    }

    // Footer info
    const footerParts: string[] = [];
    if (options?.showLocation !== false) footerParts.push(`Lok: ${asset.LOKASI}`);
    if (options?.showYear !== false) footerParts.push(`Thn: ${asset.TAHUN_PEROLEHAN}`);
    if (options?.showCondition !== false) footerParts.push(`Kondisi: ${asset.KONDISI}`);
    if (footerParts.length > 0) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `600 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      this.fitText(ctx, footerParts.join(' • '), textStartX, curY, maxTextWidth);
    }
  }

  // --- Portrait / Top QR Layout ---
  private async drawPortraitLayout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    asset: Asset,
    config: Config,
    options: QRStickerCustomLayout | undefined,
    c: any,
    qrTarget: string
  ): Promise<void> {
    const pad = Math.round(w * 0.06);
    let curY = pad + Math.round(h * 0.04);

    // 1. Header Box
    if (options?.showKop !== false || options?.showSchoolName !== false) {
      ctx.textAlign = 'center';
      if (options?.showKop !== false) {
        ctx.fillStyle = c.textMuted;
        ctx.font = `700 ${Math.round(w * 0.045)}px Inter, system-ui, Arial`;
        ctx.fillText((options?.kopText || 'UPT SATUAN PENDIDIKAN').toUpperCase(), w / 2, curY);
        curY += Math.round(h * 0.04);
      }
      if (options?.showSchoolName !== false) {
        ctx.fillStyle = c.primary;
        ctx.font = `900 ${Math.round(w * 0.055)}px Inter, system-ui, Arial`;
        this.fitText(ctx, options?.schoolName || config.SCHOOL_NAME, w / 2, curY, w - pad * 2, 'center');
        curY += Math.round(h * 0.035);
      }

      ctx.beginPath();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 3;
      ctx.moveTo(pad, curY);
      ctx.lineTo(w - pad, curY);
      ctx.stroke();
      curY += Math.round(h * 0.03);
    }

    // 2. QR Code (Centered Top) with Center Logo
    const qrSize = Math.round(w * 0.48);
    const qrX = (w - qrSize) / 2;
    await this.drawQRCodeWithLogo(ctx, qrX, curY, qrSize, qrTarget, config, options, c.primary);
    curY += qrSize + Math.round(h * 0.04);

    // 3. Asset Details
    ctx.textAlign = 'center';

    if (options?.showAssetCode !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `900 ${Math.round(w * 0.07)}px "Courier New", monospace, Arial`;
      this.fitText(ctx, asset.KODE_ASET, w / 2, curY, w - pad * 2, 'center');
      curY += Math.round(h * 0.05);
    }

    if (options?.showAssetName !== false) {
      ctx.fillStyle = c.primary;
      ctx.font = `800 ${Math.round(w * 0.055)}px Inter, system-ui, Arial`;
      this.fitText(ctx, asset.NAMA_BARANG, w / 2, curY, w - pad * 2, 'center');
      curY += Math.round(h * 0.045);
    }

    if (options?.showCategory !== false) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `700 ${Math.round(w * 0.04)}px Inter, system-ui, Arial`;
      this.fitText(ctx, `Kategori: ${asset.KIB_KATEGORI || asset.KATEGORI || 'KIB B'}`, w / 2, curY, w - pad * 2, 'center');
      curY += Math.round(h * 0.04);
    }

    const pjName = options?.customPj || asset.PENANGGUNG_JAWAB || '';
    const nipVal = options?.customNip || (asset as any).NIP || (asset as any).NIP_PJ || '';
    if (options?.showPj !== false && pjName) {
      ctx.fillStyle = c.textDark;
      ctx.font = `600 ${Math.round(w * 0.04)}px Inter, system-ui, Arial`;
      let pjText = `PJ: ${pjName}`;
      if (options?.showNip !== false && nipVal) pjText += ` (NIP: ${nipVal})`;
      this.fitText(ctx, pjText, w / 2, curY, w - pad * 2, 'center');
      curY += Math.round(h * 0.04);
    }

    const footerParts: string[] = [];
    if (options?.showLocation !== false) footerParts.push(asset.LOKASI);
    if (options?.showYear !== false) footerParts.push(`Thn ${asset.TAHUN_PEROLEHAN}`);
    if (options?.showCondition !== false) footerParts.push(asset.KONDISI);
    if (footerParts.length > 0) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `600 ${Math.round(w * 0.038)}px Inter, system-ui, Arial`;
      this.fitText(ctx, footerParts.join(' • '), w / 2, curY, w - pad * 2, 'center');
    }
  }

  // --- Official Badge Layout ---
  private async drawBadgeLayout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    asset: Asset,
    config: Config,
    options: QRStickerCustomLayout | undefined,
    c: any,
    qrTarget: string
  ): Promise<void> {
    const headerH = Math.round(h * 0.24);

    // Top Header Banner Fill
    ctx.fillStyle = c.primary;
    this.roundRect(ctx, 4, 4, w - 8, headerH, 8);
    ctx.fill();

    // Top Header Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
    ctx.fillText((options?.kopText || 'KARTU INVENTARIS BARANG MILIK DAERAH (BMD)').toUpperCase(), w / 2, Math.round(headerH * 0.42));

    ctx.font = `900 ${Math.round(h * 0.09)}px Inter, system-ui, Arial`;
    this.fitText(ctx, options?.schoolName || config.SCHOOL_NAME, w / 2, Math.round(headerH * 0.82), w - 40, 'center');

    // Body: Left Details & Right QR with Center Logo
    const bodyTop = headerH + Math.round(h * 0.06);
    const qrSize = Math.round(h * 0.62);
    const qrX = w - qrSize - Math.round(h * 0.06);
    const qrY = bodyTop + Math.round(h * 0.02);

    await this.drawQRCodeWithLogo(ctx, qrX, qrY, qrSize, qrTarget, config, options, c.primary);

    // Left info
    const textStartX = Math.round(h * 0.08);
    const maxTextWidth = qrX - textStartX - Math.round(h * 0.06);
    let curY = bodyTop + Math.round(h * 0.08);
    ctx.textAlign = 'left';

    // Kode Register
    ctx.fillStyle = c.primary;
    ctx.font = `900 ${Math.round(h * 0.12)}px "Courier New", monospace, Arial`;
    this.fitText(ctx, `KODE: ${asset.KODE_ASET}`, textStartX, curY, maxTextWidth);
    curY += Math.round(h * 0.11);

    // Nama Aset
    ctx.fillStyle = c.textDark;
    ctx.font = `800 ${Math.round(h * 0.095)}px Inter, system-ui, Arial`;
    this.fitText(ctx, asset.NAMA_BARANG, textStartX, curY, maxTextWidth);
    curY += Math.round(h * 0.09);

    // Kategori
    if (options?.showCategory !== false) {
      ctx.fillStyle = c.textMuted;
      ctx.font = `700 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      this.fitText(ctx, `Kategori: ${asset.KIB_KATEGORI || 'KIB B'}`, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.08);
    }

    // PJ & NIP
    const pjName = options?.customPj || asset.PENANGGUNG_JAWAB || 'Pengurus Barang';
    const nipVal = options?.customNip || (asset as any).NIP || (asset as any).NIP_PJ || '';
    if (options?.showPj !== false) {
      ctx.fillStyle = c.textDark;
      ctx.font = `600 ${Math.round(h * 0.07)}px Inter, system-ui, Arial`;
      let pjText = `Penanggung Jawab: ${pjName}`;
      if (options?.showNip !== false && nipVal) pjText += ` (NIP. ${nipVal})`;
      this.fitText(ctx, pjText, textStartX, curY, maxTextWidth);
      curY += Math.round(h * 0.08);
    }

    // Location & Condition
    const footer = `Lokasi: ${asset.LOKASI} • Thn: ${asset.TAHUN_PEROLEHAN} • Kondisi: ${asset.KONDISI}`;
    ctx.fillStyle = c.textMuted;
    ctx.font = `600 ${Math.round(h * 0.065)}px Inter, system-ui, Arial`;
    this.fitText(ctx, footer, textStartX, curY, maxTextWidth);
  }

  private fitText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    align: CanvasTextAlign = 'left'
  ): void {
    ctx.textAlign = align;
    let currentWidth = ctx.measureText(text).width;
    if (currentWidth <= maxWidth) {
      ctx.fillText(text, x, y);
      return;
    }
    const fontStr = ctx.font;
    const match = fontStr.match(/(\d+)px/);
    let size = match ? parseInt(match[1], 10) : 30;

    while (currentWidth > maxWidth && size > 10) {
      size -= 1.5;
      ctx.font = fontStr.replace(/\d+px/, `${Math.round(size)}px`);
      currentWidth = ctx.measureText(text).width;
    }
    ctx.fillText(text, x, y);
    ctx.font = fontStr; // restore original font size
  }

  private async drawQRCodeWithLogo(
    ctx: CanvasRenderingContext2D,
    qrX: number,
    qrY: number,
    qrSize: number,
    qrTarget: string,
    config: Config,
    options: QRStickerCustomLayout | undefined,
    fallbackColor: string
  ): Promise<void> {
    const fgColor = options?.qrFgColor || fallbackColor || '#000000';
    const bgColor = options?.qrBgColor || '#ffffff';

    // When logo is included, ensure error correction level is at least 'H' (or 'Q')
    let ecc: 'L' | 'M' | 'Q' | 'H' = options?.qrErrorCorrectionLevel || 'H';
    if (options?.includeLogoInQR && (ecc === 'L' || ecc === 'M')) {
      ecc = 'H';
    }

    const qrDataUrl = await this.generateQRCode(qrTarget, qrSize, fgColor, bgColor, ecc);
    if (qrDataUrl) {
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });
    }

    // Overlay Center Logo if enabled
    if (options?.includeLogoInQR) {
      const centerX = qrX + qrSize / 2;
      const centerY = qrY + qrSize / 2;
      const boxSize = Math.round(qrSize * 0.24);
      const boxX = Math.round(centerX - boxSize / 2);
      const boxY = Math.round(centerY - boxSize / 2);
      const boxRadius = Math.max(4, Math.round(boxSize * 0.22));

      // 1. Draw Clean White Rounded Box with crisp border & subtle drop-shadow
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      this.roundRect(ctx, boxX, boxY, boxSize, boxSize, boxRadius);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = fgColor;
      ctx.lineWidth = Math.max(1.5, Math.round(boxSize * 0.045));
      this.roundRect(ctx, boxX, boxY, boxSize, boxSize, boxRadius);
      ctx.stroke();

      // 2. Load and render Logo Image or Vector Fallback
      let logoUrl = '';
      if (options.logoSource === 'custom' && options.customLogoUrl) {
        logoUrl = options.customLogoUrl;
      } else if (options.logoSource === 'city' && config.CITY_LOGO_URL) {
        logoUrl = config.CITY_LOGO_URL;
      } else if (options.logoSource === 'school' && config.SCHOOL_LOGO_URL) {
        logoUrl = config.SCHOOL_LOGO_URL;
      } else if (config.SCHOOL_LOGO_URL) {
        logoUrl = config.SCHOOL_LOGO_URL;
      }

      let rendered = false;
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = logoUrl;
            setTimeout(() => reject(), 1000);
          });
          const pad = Math.round(boxSize * 0.12);
          ctx.drawImage(img, boxX + pad, boxY + pad, boxSize - pad * 2, boxSize - pad * 2);
          rendered = true;
        } catch {
          rendered = false;
        }
      }

      if (!rendered) {
        this.drawVectorEmblem(ctx, centerX, centerY, boxSize, fgColor);
      }
    }
  }

  private drawVectorEmblem(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string
  ): void {
    const s = size * 0.58;
    ctx.save();
    ctx.translate(cx, cy);

    // Draw educational emblem: Graduation cap & open book
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, size * 0.04);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cap Diamond Top
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.lineTo(s * 0.48, -s * 0.18);
    ctx.lineTo(0, 0.06);
    ctx.lineTo(-s * 0.48, -s * 0.18);
    ctx.closePath();
    ctx.fill();

    // Cap Lower Arc
    ctx.beginPath();
    ctx.arc(0, -s * 0.04, s * 0.24, 0, Math.PI);
    ctx.fill();

    // Open Book Wings
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.24);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.14, 0, s * 0.24);
    ctx.quadraticCurveTo(s * 0.2, s * 0.14, s * 0.42, s * 0.24);
    ctx.lineTo(s * 0.42, s * 0.44);
    ctx.quadraticCurveTo(s * 0.2, s * 0.34, 0, s * 0.44);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.34, -s * 0.42, s * 0.44);
    ctx.closePath();
    ctx.fill();

    // Center spine
    ctx.beginPath();
    ctx.moveTo(0, s * 0.24);
    ctx.lineTo(0, s * 0.46);
    ctx.stroke();

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export const qrService = new QrService();
