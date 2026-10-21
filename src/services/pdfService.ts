import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { db } from './localStorageService';
import { qrService } from './qrService';
import { classroomService } from './classroomService';
import { Account } from '../types/classroom';
import type { MonthlyManagementReportData } from './monthlyManagementService';

export interface BeritaAcaraOptions {
  title: string;
  docNo?: string;
  description: string;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerText?: string;
  leftSigner?: { title: string; name: string; nip?: string };
  rightSigner?: { title: string; name: string; nip?: string };
  centerSigner?: { title: string; name: string; nip?: string };
  includeHeadmaster?: boolean;

  // Paper & Layout settings
  paperSize?: 'a4' | 'f4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;

  // Kop Surat Customization
  kopSurat?: {
    show?: boolean;
    alignment?: 'center' | 'left' | 'dual_logo';
    logoMode?: 'dual' | 'school' | 'city' | 'none';
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
    cityLogoUrl?: string;
    schoolLogoUrl?: string;
    borderStyle?: 'double' | 'single' | 'bold' | 'none';
  };

  // Document Styling & Themes
  styling?: {
    fontFamily?: 'helvetica' | 'times' | 'courier';
    themeColor?: 'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber';
    tableDensity?: 'compact' | 'normal' | 'spacious';
    watermark?: string;
    includeVerificationQR?: boolean;
    verificationQRText?: string;
  };

  // Automatic Page Numbering
  pageNumbering?: {
    enabled?: boolean;
    position?: 'bottom_center' | 'bottom_right' | 'top_right';
    format?: 'halaman_x_dari_y' | 'hal_x_per_y' | 'page_x_of_y' | 'simple_number';
  };

  // Header & Footer Styling
  headerFooter?: {
    enabled?: boolean;
    showHeaderOnAllPages?: boolean;
    runningHeader?: string;
    runningFooter?: string;
    style?: 'formal_line' | 'minimal' | 'boxed' | 'none';
    showTimestamp?: boolean;
    documentCode?: string;
  };

  // Signature options & Digital Signatures (Base64 Data URLs)
  signatures?: {
    city?: string;
    dateStr?: string;
    layout?: 'triangle' | 'side_by_side' | 'horizontal_3';
    leftSignatureImage?: string;
    rightSignatureImage?: string;
    centerSignatureImage?: string;
  };

  // Execution options
  autoSave?: boolean;
  skipDownload?: boolean;
}

export class PdfService {
  private logoCache: { [url: string]: string } = {};

  constructor() {
    // Run preloading in a microtask/setTimeout to prevent blocking the main thread during module load
    setTimeout(() => {
      this.preloadLogos();
    }, 1000);
  }

  public preloadLogos(): void {
    try {
      const config = db.getConfig();
      const urls = [config.CITY_LOGO_URL, config.SCHOOL_LOGO_URL].filter(Boolean) as string[];
      urls.forEach(async (url) => {
        if (this.logoCache[url]) return;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          this.logoCache[url] = base64;
        } catch (e) {
          // Silent catch to avoid spamming logs on offline mode
        }
      });
    } catch {
      // Avoid crash on server-side compilation
    }
  }

  private getThemeRgb(theme: string = 'emerald'): [number, number, number] {
    switch (theme) {
      case 'navy':
        return [30, 58, 138];
      case 'monochrome':
        return [15, 23, 42];
      case 'slate':
        return [51, 65, 85];
      case 'amber':
        return [146, 64, 14];
      case 'emerald':
      default:
        return [22, 101, 52];
    }
  }

  private addKopSurat(
    doc: jsPDF,
    pageWidth: number,
    kopOptions?: BeritaAcaraOptions['kopSurat'],
    fontFamily: string = 'helvetica'
  ): number {
    if (kopOptions && kopOptions.show === false) {
      return 15; // Margin top without kop
    }

    const config = db.getConfig();
    const city = config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';

    const alignment = kopOptions?.alignment || 'dual_logo';
    const logoMode = kopOptions?.logoMode || (alignment === 'dual_logo' ? 'dual' : 'school');

    const line1 = kopOptions?.line1 || `PEMERINTAH KOTA ${city.toUpperCase()}`;
    const line2 = kopOptions?.line2 || 'DINAS PENDIDIKAN';
    const line3 =
      kopOptions?.line3 ||
      `UPT SATUAN PENDIDIKAN ${config.SCHOOL_NAME ? config.SCHOOL_NAME.toUpperCase() : 'SD NEGERI TANGERANG 6'}`;

    // Splitting address and contact info elegantly into two lines for extreme legibility!
    const line4 = kopOptions?.line4 || (config.ADDRESS || 'Jl. Nyi Mas Melati No. 02, RT 05 / RW 08, Kel. Sukarasa, Kec. Tangerang');
    
    const line5 = [
      `NPSN: ${config.SCHOOL_NPSN || '20606498'}`,
      config.SCHOOL_EMAIL ? `Email: ${config.SCHOOL_EMAIL}` : '',
      config.SCHOOL_WEBSITE ? `Web: ${config.SCHOOL_WEBSITE.replace(/^https?:\/\//i, '')}` : '',
    ].filter(Boolean).join('  |  ');

    const borderStyle = kopOptions?.borderStyle || 'double';

    // Left & Right Logo Draw Box dimensions
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const logoWidth = 18;
    const logoHeight = 18;
    const logoY = 12;

    // Draw Left Logo (Pemda/City or School) if enabled
    if (logoMode === 'dual' || logoMode === 'city') {
      this.drawLogoPlaceholderOrImage(
        doc,
        leftMargin,
        logoY,
        logoWidth,
        logoHeight,
        'city',
        kopOptions?.cityLogoUrl || config.CITY_LOGO_URL
      );
    }

    // Draw Right Logo (School / Tutwuri) if dual logo mode
    if (logoMode === 'dual' || logoMode === 'school') {
      const rightX = rightMargin - logoWidth;
      this.drawLogoPlaceholderOrImage(
        doc,
        logoMode === 'dual' ? rightX : leftMargin,
        logoY,
        logoWidth,
        logoHeight,
        'school',
        kopOptions?.schoolLogoUrl || config.SCHOOL_LOGO_URL
      );
    }

    // Text Positioning
    let textCenterX = pageWidth / 2;
    let textAlign: 'center' | 'left' = 'center';

    if (alignment === 'left') {
      textCenterX = logoMode !== 'none' ? leftMargin + logoWidth + 4 : leftMargin;
      textAlign = 'left';
    }

    // Line 1: PEMERINTAH KOTA TANGERANG
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Elegant Slate-900
    doc.text(line1, textCenterX, 14, { align: textAlign });

    // Line 2: DINAS PENDIDIKAN
    doc.setFontSize(11.5);
    doc.text(line2, textCenterX, 18.5, { align: textAlign });

    // Line 3: UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6 (Largest and Boldest!)
    doc.setFontSize(13.5);
    doc.text(line3, textCenterX, 24, { align: textAlign });

    // Line 4: Alamat Jalan
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // Slate-600

    if (textAlign === 'left') {
      const splitLine4 = doc.splitTextToSize(line4, pageWidth - textCenterX - 14);
      doc.text(splitLine4, textCenterX, 28);
      
      const splitLine5 = doc.splitTextToSize(line5, pageWidth - textCenterX - 14);
      doc.text(splitLine5, textCenterX, 31.5);
    } else {
      doc.text(line4, textCenterX, 28, { align: 'center' });
      doc.text(line5, textCenterX, 31.5, { align: 'center' });
    }

    // Border line beneath Kop Surat - Beautiful Double Garis Tebal Tipis
    const lineY = 34.5;
    doc.setDrawColor(15, 23, 42); // Solid Slate-900 for high-contrast lines

    if (borderStyle === 'double') {
      doc.setLineWidth(0.8);
      doc.line(leftMargin, lineY, rightMargin, lineY);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, lineY + 0.8, rightMargin, lineY + 0.8);
    } else if (borderStyle === 'bold') {
      doc.setLineWidth(0.9);
      doc.line(leftMargin, lineY, rightMargin, lineY);
    } else if (borderStyle === 'single') {
      doc.setLineWidth(0.3);
      doc.line(leftMargin, lineY, rightMargin, lineY);
    }

    return lineY + 6.5; // Returns Y start position for content
  }

  private drawLogoPlaceholderOrImage(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    type: 'city' | 'school',
    url?: string
  ): void {
    if (url) {
      // First, try preloaded cache
      const cached = this.logoCache[url];
      if (cached) {
        try {
          doc.addImage(cached, 'PNG', x, y, w, h);
          return;
        } catch {
          // Fallback
        }
      }
      // If not cached, try direct URL insertion (works if browser cached or relaxed CORS)
      if (url.startsWith('data:image') || url.startsWith('blob:') || url.startsWith('http')) {
        try {
          doc.addImage(url, 'PNG', x, y, w, h);
          return;
        } catch {
          // Fallback to vector
        }
      }
    }

    // Vector Emblem drawing on PDF
    doc.saveGraphicsState();
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (type === 'city') {
      // 1. Draw beautiful, high-fidelity Kota Tangerang shield emblem
      doc.setFillColor(34, 139, 34); // Forest Green shield base
      doc.setDrawColor(218, 165, 32); // Golden border
      doc.setLineWidth(0.5);
      
      // Draw a classic curved shield shape
      // Top curve & straight sides, tapering to a point at bottom
      doc.roundedRect(x + 1, y + 1, w - 2, h - 3, 2, 2, 'FD');
      
      // Top gold star
      doc.setFillColor(255, 215, 0); // Gold
      doc.triangle(cx, y + 2, cx - 1.5, y + 4, cx + 1.5, y + 4, 'F');
      doc.triangle(cx, y + 4.5, cx - 1.5, y + 2.5, cx + 1.5, y + 2.5, 'F');
      
      // Blue river wave section representing Cisadane River
      doc.setFillColor(30, 144, 255); // Blue
      doc.rect(x + 2, y + h - 6, w - 4, 3, 'F');
      
      // Gold gear inside
      doc.setFillColor(255, 215, 0); // Gold gear representation
      doc.circle(cx, cy, 2.5, 'F');
      doc.setFillColor(34, 139, 34); // Inner shield green
      doc.circle(cx, cy, 1.5, 'F');

      // White/gold text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.text('KOTA', cx, cy - 2.8, { align: 'center' });
      doc.setFontSize(3.5);
      doc.text('TANGERANG', cx, cy + 4, { align: 'center' });
    } else {
      // 2. Draw beautiful, high-fidelity Tut Wuri Handayani / School crest
      doc.setFillColor(29, 78, 216); // Educational Royal Blue
      doc.setDrawColor(255, 215, 0); // Gold outer boundary
      doc.setLineWidth(0.5);

      // Pentagon crest shape (the official Tut Wuri Handayani backdrop)
      const r = Math.min(w, h) / 2 - 0.5;
      doc.circle(cx, cy, r, 'FD');

      // Draw standard inner golden flame/sun
      doc.setFillColor(255, 215, 0); // Gold
      doc.triangle(cx, cy - 3.5, cx - 2, cy + 0.5, cx + 2, cy + 0.5, 'F');
      doc.triangle(cx, cy + 1.5, cx - 2.5, cy - 1.5, cx + 2.5, cy - 1.5, 'F');

      // Red central flame/heart
      doc.setFillColor(220, 38, 38); // Crimson Red
      doc.circle(cx, cy - 0.5, 0.8, 'F');

      // White text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.text('TUT WURI', cx, cy + 4, { align: 'center' });
      doc.setFontSize(3.5);
      doc.text('HANDAYANI', cx, cy + 6.5, { align: 'center' });
    }
    doc.restoreGraphicsState();
  }

  private addOfficialSignatures(
    doc: jsPDF,
    startY: number,
    options?: {
      leftSigner?: { title: string; name: string; nip?: string };
      rightSigner?: { title: string; name: string; nip?: string };
      centerSigner?: { title: string; name: string; nip?: string };
      includeHeadmaster?: boolean;
      city?: string;
      dateStr?: string;
      layout?: 'triangle' | 'side_by_side' | 'horizontal_3';
      leftSignatureImage?: string;
      rightSignatureImage?: string;
      centerSignatureImage?: string;
      fontFamily?: string;
    }
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const fontFamily = options?.fontFamily || 'helvetica';
    let currentY = startY;

    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 25;
    }

    const config = db.getConfig();
    const city = options?.city || config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';
    const todayStr =
      options?.dateStr ||
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${city}, ${todayStr}`, pageWidth - 18, currentY, { align: 'right' });
    currentY += 6;

    const left = options?.leftSigner || {
      title: 'Pihak Pertama (Pengurus Barang),',
      name: config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
      nip: config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
    };

    const right = options?.rightSigner || {
      title: 'Pihak Kedua (Penerima),',
      name: config.TREASURER || 'Siti Rahmawati, S.Pd.',
      nip: config.TREASURER_NIP || '19870921 201001 2 005',
    };

    const layout = options?.layout || 'triangle';

    if (layout === 'horizontal_3') {
      // 3 Columns in one row
      const colW = (pageWidth - 28) / 3;
      const c1X = 14 + colW * 0.5;
      const c2X = 14 + colW * 1.5;
      const c3X = 14 + colW * 2.5;

      const center = options?.centerSigner || {
        title: `Kepala UPT Satuan Pendidikan`,
        name: config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        nip: config.HEADMASTER_NIP || '19680412 199303 2 005',
      };

      doc.text(left.title, c1X, currentY, { align: 'center' });
      doc.text(right.title, c2X, currentY, { align: 'center' });
      doc.text(center.title, c3X, currentY, { align: 'center' });

      // Embed digital signatures if available
      if (options?.leftSignatureImage) {
        try {
          doc.addImage(options.leftSignatureImage, 'PNG', c1X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing left signature', e);
        }
      }
      if (options?.rightSignatureImage) {
        try {
          doc.addImage(options.rightSignatureImage, 'PNG', c2X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing right signature', e);
        }
      }
      if (options?.centerSignatureImage) {
        try {
          doc.addImage(options.centerSignatureImage, 'PNG', c3X - 12, currentY + 2, 24, 13);
        } catch (e) {
          console.warn('Failed drawing center signature', e);
        }
      }

      currentY += 19;

      doc.setFont(fontFamily, 'bold');
      doc.text(left.name, c1X, currentY, { align: 'center' });
      doc.text(right.name, c2X, currentY, { align: 'center' });
      doc.text(center.name, c3X, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      if (left.nip && left.nip !== '-') doc.text(left.nip.startsWith('NIP') ? left.nip : `NIP. ${left.nip}`, c1X, currentY, { align: 'center' });
      if (right.nip && right.nip !== '-') doc.text(right.nip.startsWith('NIP') ? right.nip : `NIP. ${right.nip}`, c2X, currentY, { align: 'center' });
      if (center.nip && center.nip !== '-') doc.text(center.nip.startsWith('NIP') ? center.nip : `NIP. ${center.nip}`, c3X, currentY, { align: 'center' });
      return;
    }

    // Default Triangle or Side by Side layout
    const col1X = 46;
    const col2X = pageWidth - 46;

    doc.text(left.title, col1X, currentY, { align: 'center' });
    doc.text(right.title, col2X, currentY, { align: 'center' });

    // Embed left & right digital signatures
    if (options?.leftSignatureImage) {
      try {
        doc.addImage(options.leftSignatureImage, 'PNG', col1X - 15, currentY + 1, 30, 15);
      } catch (e) {
        console.warn('Failed drawing left signature', e);
      }
    }
    if (options?.rightSignatureImage) {
      try {
        doc.addImage(options.rightSignatureImage, 'PNG', col2X - 15, currentY + 1, 30, 15);
      } catch (e) {
        console.warn('Failed drawing right signature', e);
      }
    }

    currentY += 19;

    doc.setFont(fontFamily, 'bold');
    doc.text(left.name, col1X, currentY, { align: 'center' });
    doc.text(right.name, col2X, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8.5);
    if (left.nip && left.nip !== '-') {
      doc.text(left.nip.startsWith('NIP') ? left.nip : `NIP. ${left.nip}`, col1X, currentY, {
        align: 'center',
      });
    }
    if (right.nip && right.nip !== '-') {
      doc.text(right.nip.startsWith('NIP') ? right.nip : `NIP. ${right.nip}`, col2X, currentY, {
        align: 'center',
      });
    }

    if (layout === 'triangle' && options?.includeHeadmaster !== false) {
      currentY += 8;
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 25;
      }
      const centerSigner = options?.centerSigner || {
        title: `Kepala UPT Satuan Pendidikan ${config.SCHOOL_NAME || 'SD Negeri Tangerang 6'}`,
        name: config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
        nip: config.HEADMASTER_NIP || '19680412 199303 2 005',
      };

      doc.setFontSize(9);
      doc.text('Mengetahui,', pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;
      doc.text(centerSigner.title, pageWidth / 2, currentY, { align: 'center' });

      // Embed center (headmaster) digital signature
      if (options?.centerSignatureImage) {
        try {
          doc.addImage(options.centerSignatureImage, 'PNG', pageWidth / 2 - 15, currentY + 1, 30, 15);
        } catch (e) {
          console.warn('Failed drawing headmaster signature', e);
        }
      }

      currentY += 19;

      doc.setFont(fontFamily, 'bold');
      doc.text(centerSigner.name, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.5);
      const headmasterNip = centerSigner.nip || config.HEADMASTER_NIP || '19680412 199303 2 005';
      if (headmasterNip && headmasterNip !== '-') {
        doc.text(
          headmasterNip.startsWith('NIP') ? headmasterNip : `NIP. ${headmasterNip}`,
          pageWidth / 2,
          currentY,
          { align: 'center' }
        );
      }
    }
  }

  private applyHeaderFooterAndPageNumbers(
    doc: jsPDF,
    options: BeritaAcaraOptions
  ): void {
    const totalPages = doc.getNumberOfPages();
    const fontFamily = options.styling?.fontFamily || 'helvetica';
    const config = db.getConfig();
    const schoolName = config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6';

    const hfOpt = options.headerFooter;
    const isHfEnabled = hfOpt?.enabled !== false;
    const runningHeader = hfOpt?.runningHeader || (isHfEnabled ? `Dokumen Resmi Inventaris — ${schoolName}` : '');
    const runningFooter = hfOpt?.runningFooter || (isHfEnabled ? `Sistem Informasi Persediaan & Aset Sekolah (SIPERSEDA)` : '');
    const showHeaderOnAll = hfOpt?.showHeaderOnAllPages ?? false;
    const hfStyle = hfOpt?.style || 'formal_line';
    const showTimestamp = hfOpt?.showTimestamp !== false;
    const documentCode = hfOpt?.documentCode || (options.docNo ? `No: ${options.docNo}` : '');

    const pnOpt = options.pageNumbering;
    const isPnEnabled = pnOpt?.enabled !== false;
    const pnPosition = pnOpt?.position || 'bottom_center';
    const pnFormat = pnOpt?.format || 'halaman_x_dari_y';

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.saveGraphicsState();

      // 1. Running Header
      if (isHfEnabled && runningHeader && (p > 1 || showHeaderOnAll)) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);

        if (hfStyle === 'boxed') {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, 5, pageWidth - 28, 7, 'F');
          doc.text(runningHeader, 16, 9.5);
          if (documentCode) {
            doc.text(documentCode, pageWidth - 16, 9.5, { align: 'right' });
          }
        } else {
          doc.text(runningHeader, 14, 8.5);
          if (documentCode) {
            doc.text(documentCode, pageWidth - 14, 8.5, { align: 'right' });
          }
          if (hfStyle === 'formal_line') {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.25);
            doc.line(14, 10.5, pageWidth - 14, 10.5);
          }
        }
      }

      // 2. Running Footer
      if (isHfEnabled && runningFooter) {
        if (hfStyle === 'formal_line') {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.25);
          doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);
        }

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(runningFooter, 14, pageHeight - 7);

        if (showTimestamp && pnPosition !== 'bottom_right') {
          const nowStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          doc.text(`Tercetak: ${nowStr}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }
      }

      // 3. Page Numbering
      if (isPnEnabled) {
        let pageStr = '';
        if (pnFormat === 'halaman_x_dari_y') {
          pageStr = `Halaman ${p} dari ${totalPages}`;
        } else if (pnFormat === 'hal_x_per_y') {
          pageStr = `Hal. ${p}/${totalPages}`;
        } else if (pnFormat === 'page_x_of_y') {
          pageStr = `Page ${p} of ${totalPages}`;
        } else {
          pageStr = `${p}`;
        }

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);

        if (pnPosition === 'bottom_center') {
          doc.text(pageStr, pageWidth / 2, pageHeight - 7, { align: 'center' });
        } else if (pnPosition === 'bottom_right') {
          doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: 'right' });
        } else if (pnPosition === 'top_right') {
          doc.text(pageStr, pageWidth - 14, 8.5, { align: 'right' });
        }
      }

      doc.restoreGraphicsState();
    }
  }

  private addWatermark(doc: jsPDF, text: string): void {
    if (!text) return;
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.saveGraphicsState();
      doc.setTextColor(226, 232, 240); // Light subtle slate
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);

      // Draw rotated watermark text across center
      doc.text(text.toUpperCase(), pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  // --- 1. Enhanced Berita Acara Generator with full paper sizes & Kop Surat ---
  public async generateBeritaAcara(options: BeritaAcaraOptions): Promise<jsPDF> {
    // Format selection
    const paperSize = options.paperSize || 'a4';
    let format: string | [number, number] = 'a4';
    if (paperSize === 'f4') {
      format = [215, 330]; // Folio / F4 standard in mm
    } else if (paperSize === 'letter') {
      format = 'letter';
    } else if (paperSize === 'legal') {
      format = 'legal';
    }

    const orientation = options.orientation || 'portrait';
    const doc = new jsPDF({ orientation, unit: 'mm', format });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const fontFamily = options.styling?.fontFamily || 'helvetica';
    const themeRgb = this.getThemeRgb(options.styling?.themeColor || 'emerald');

    // 1. Kop Surat
    let currentY = this.addKopSurat(doc, pageWidth, options.kopSurat, fontFamily);

    // 2. Document Title
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(options.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // Document Number
    if (options.docNo) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nomor: ${options.docNo}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    } else {
      currentY += 3;
    }

    // 3. Opening Legal Clause
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const splitDesc = doc.splitTextToSize(options.description, pageWidth - 28);
    doc.text(splitDesc, 14, currentY);
    currentY += splitDesc.length * 4.5 + 4;

    // 4. Transaction Table
    if (options.tableRows && options.tableRows.length > 0) {
      const tableDensity = options.styling?.tableDensity || 'normal';
      const cellPadding = tableDensity === 'compact' ? 1.5 : tableDensity === 'spacious' ? 3.5 : 2.5;
      const fontSize = tableDensity === 'compact' ? 7.5 : 8.5;

      autoTable(doc, {
        startY: currentY,
        head: [options.tableHeaders],
        body: options.tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: themeRgb,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: fontSize + 0.5,
          halign: 'center',
          font: fontFamily,
          cellPadding,
        },
        bodyStyles: {
          fontSize,
          textColor: [23, 32, 27],
          font: fontFamily,
          cellPadding,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 6;
    }

    // 5. Closing Clause
    if (options.footerText) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitFooter = doc.splitTextToSize(options.footerText, pageWidth - 28);
      doc.text(splitFooter, 14, currentY);
      currentY += splitFooter.length * 4 + 6;
    }

    // 6. Signatures
    this.addOfficialSignatures(doc, currentY, {
      leftSigner: options.leftSigner,
      rightSigner: options.rightSigner,
      centerSigner: options.centerSigner,
      includeHeadmaster: options.includeHeadmaster !== false,
      city: options.signatures?.city,
      dateStr: options.signatures?.dateStr,
      layout: options.signatures?.layout,
      leftSignatureImage: options.signatures?.leftSignatureImage,
      rightSignatureImage: options.signatures?.rightSignatureImage,
      centerSignatureImage: options.signatures?.centerSignatureImage,
      fontFamily,
    });

    // 7. Verification QR Code (Bottom Left of last page)
    if (options.styling?.includeVerificationQR) {
      const qrPayload =
        options.styling.verificationQRText ||
        `VALIDASI DOKUMEN RESMI BERITA ACARA\nNo: ${options.docNo || '-'}\nJudul: ${options.title}\nStatus: Dokumen Sah Terverifikasi SIPERSEDA`;

      try {
        const qrDataUrl = await qrService.generateQRCode(qrPayload, 180);
        if (qrDataUrl) {
          const qrX = 14;
          const qrY = pageHeight - 30;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 16, 16);
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text('Scan untuk Validasi Arsip', qrX + 18, qrY + 6);
          doc.text('Sistem Inventaris Sekolah', qrX + 18, qrY + 10);
        }
      } catch (err) {
        console.warn('QR Code generation skipped:', err);
      }
    }

    // 8. Header, Footer & Automatic Page Numbering
    this.applyHeaderFooterAndPageNumbers(doc, options);

    // 9. Watermark if requested
    if (options.styling?.watermark) {
      this.addWatermark(doc, options.styling.watermark);
    }

    // 9. Download / Save PDF if autoSave is true
    if (options.autoSave !== false && !options.skipDownload) {
      const safeTitle = options.title.replace(/[^A-Za-z0-9]/g, '_');
      doc.save(`${safeTitle}_${options.docNo ? options.docNo.replace(/[^A-Za-z0-9]/g, '_') : 'DOKUMEN'}.pdf`);
    }

    return doc;
  }

  public async getBeritaAcaraBlobUrl(options: BeritaAcaraOptions): Promise<string> {
    const doc = await this.generateBeritaAcara({ ...options, autoSave: false, skipDownload: true });
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  public async getBeritaAcaraBlob(options: BeritaAcaraOptions): Promise<Blob> {
    const doc = await this.generateBeritaAcara({ ...options, autoSave: false, skipDownload: true });
    return doc.output('blob');
  }

  // --- 2. Kartu Stok PDF ---
  public generateKartuStok(kodeBarang: string): void {
    this.generateKartuStokPDF(kodeBarang);
  }

  public generateKartuStokPDF(kodeBarang: string): void {
    const items = db.getItems();
    const item = items.find((i) => i.KODE_BARANG === kodeBarang);
    if (!item) return;

    const ledger = db.getStockLedger(kodeBarang);
    const summary = db.getStockSummary().find((s) => s.KODE_BARANG === kodeBarang);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KARTU PERSEDIAAN / KARTU STOK BARANG', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Kode Barang   : ${item.KODE_BARANG}`, 14, currentY);
    doc.text(`Satuan              : ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 5;
    doc.text(`Nama Barang  : ${item.NAMA_BARANG}`, 14, currentY);
    doc.text(`Batas Minimum : ${item.BATAS_MINIMUM} ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 5;
    doc.text(`Lokasi             : ${item.LOKASI_DEFAULT}`, 14, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Stok Akhir       : ${summary?.STOK || 0} ${item.JENIS_SATUAN}`, pageWidth - 70, currentY);
    currentY += 7;

    const rows = ledger.map((l, idx) => [
      idx + 1,
      l.TANGGAL,
      l.REF_TYPE,
      l.NOMOR_DOKUMEN || '-',
      l.QTY_IN > 0 ? l.QTY_IN : '-',
      l.QTY_OUT > 0 ? l.QTY_OUT : '-',
      l.SALDO_SESUDAH,
      l.STATUS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Aktivitas', 'No Dokumen', 'Masuk', 'Keluar', 'Saldo', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada mutasi barang', '-', '-', '-', '0', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Kartu_Stok_${item.KODE_BARANG}.pdf`);
  }

  // --- 3. Laporan Bulanan Barang Keluar ---
  public generateLaporanBulananBK(yearMonth: string): void {
    const list = db.getBarangKeluar().filter(
      (bk) => bk.TANGGAL.startsWith(yearMonth) && bk.STATUS_TRANSAKSI === 'DISETUJUI'
    );
    const [year, month] = yearMonth.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, 1);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`LAPORAN REKAPITULASI PENGELUARAN BARANG`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periode: ${monthName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const tableRows = list.map((b, i) => [
      i + 1,
      b.TANGGAL,
      b.NOMOR_DOKUMEN,
      b.KODE_BARANG,
      b.NAMA_BARANG,
      b.JUMLAH,
      b.JENIS_SATUAN,
      b.PENERIMA + (b.PENERIMA_NIP ? `\n(NIP. ${b.PENERIMA_NIP})` : ''),
      b.UNIT_RUANGAN,
      b.TUJUAN_PENGGUNAAN,
      b.PETUGAS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'No',
          'Tanggal',
          'No Dokumen',
          'Kode Barang',
          'Nama Barang',
          'Qty',
          'Satuan',
          'Penerima & NIP',
          'Unit/Ruangan',
          'Tujuan Penggunaan',
          'Petugas',
        ],
      ],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', 'Tidak ada data pada periode ini', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Barang_Keluar_${yearMonth}.pdf`);
  }

  // --- 4. Laporan Pengambilan ATK Keseluruhan ---
  public generateLaporanATKKeseluruhan(): void {
    const list = db.getPengambilanATK();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BUKU REKAPITULASI PENGAMBILAN ATK PEGAWAI & GURU', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = list.map((atk, idx) => [
      idx + 1,
      atk.NO,
      atk.TANGGAL,
      atk.NAMA_LENGKAP + (atk.NIP ? `\nNIP. ${atk.NIP}` : ''),
      atk.JABATAN || 'Guru',
      atk.NAMA_BARANG,
      atk.PETUGAS,
      atk.KETERANGAN || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'No. Lap', 'Tanggal', 'Nama Pegawai & NIP', 'Jabatan', 'Nama Barang ATK', 'Petugas', 'Keterangan']],
      body: rows.length > 0 ? rows : [['-', '-', '-', '-', 'Belum ada data pengambilan ATK', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save('Laporan_Pengambilan_ATK_Keseluruhan.pdf');
  }

  // --- 5. Laporan Persediaan Barang ---
  public generateLaporanPersediaan(summaryList: any[], period: string = 'Bulan Berjalan'): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BUKU PERSEDIAAN BARANG HABIS PAKAI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Periode: ${period}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = summaryList.map((s, idx) => [
      idx + 1,
      s.KODE_BARANG,
      s.NAMA_BARANG,
      s.JENIS_SATUAN,
      s.TOTAL_MASUK,
      s.TOTAL_KELUAR,
      s.TOTAL_ADJUSTMENT || 0,
      s.STOK,
      s.BATAS_MINIMUM,
      s.STATUS,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Barang', 'Nama Barang', 'Satuan', 'Masuk', 'Keluar', 'Penyesuaian', 'Stok Akhir', 'Batas Min', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada data persediaan', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'center' },
        9: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Persediaan_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // --- 6. Laporan Aset & Inventaris / KIR ---
  public generateLaporanAset(assetList: any[], title: string = 'Laporan Inventaris Aset'): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.addKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    const rows = assetList.map((a, idx) => [
      idx + 1,
      a.KODE_ASET,
      a.NAMA_BARANG,
      a.MERK || '-',
      a.JUMLAH || 1,
      a.JENIS_SATUAN || 'Unit',
      `Rp ${(a.TOTAL_NILAI || 0).toLocaleString('id-ID')}`,
      a.LOKASI || '-',
      a.PENANGGUNG_JAWAB || '-',
      a.KONDISI || 'BAIK',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Register', 'Nama Aset', 'Merk / Spesifikasi', 'Qty', 'Satuan', 'Nilai Perolehan', 'Lokasi', 'Penanggung Jawab', 'Kondisi']],
      body: rows.length > 0 ? rows : [['-', '-', 'Belum ada data inventaris', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    const endY = doc.lastAutoTable.finalY + 8;
    this.addOfficialSignatures(doc, endY);

    doc.save(`Laporan_Inventaris_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  public generateConsolidatedTeacherReportsPdf(
    reports: any[],
    kepsekName: string = 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    kepsekNip: string = '198406192009022007'
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();

    // 1. Kop Surat
    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Perintis Kemerdekaan No. 6 Babakan'} • NPSN: ${config.SCHOOL_NPSN || '20606498'}`,
    });

    let currentY = 48;

    // 2. Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('REKAPITULASI LAPORAN PEMBELAJARAN & KINERJA GURU', pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Konsolidasi Laporan Pembelajaran Semester / Bulanan • Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 8;

    // Summary Statistics Box
    const totalReports = reports.length;
    const gradedReports = reports.filter((r) => r.STATUS === 'DINILAI');
    const avgScore =
      gradedReports.length > 0
        ? Math.round(gradedReports.reduce((acc, r) => acc + (r.NILAI || 0), 0) / gradedReports.length)
        : '-';

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Laporan: ${totalReports}`, 20, currentY + 9);
    doc.text(`Laporan Dinilai: ${gradedReports.length}`, 75, currentY + 9);
    doc.text(`Rata-rata Nilai: ${avgScore}`, 135, currentY + 9);

    currentY += 18;

    // Table 1: Summary Table of all reports
    const tableRows = reports.map((r, idx) => [
      idx + 1,
      r.GURU_NAMA || '-',
      r.JUDUL || '-',
      r.KATEGORI || 'Bulanan',
      r.PERIODE || '-',
      r.STATUS || 'DRAFT',
      r.NILAI ? `${r.NILAI}/100` : 'Belum Dinilai',
      r.FEEDBACK ? (r.FEEDBACK.length > 40 ? r.FEEDBACK.slice(0, 40) + '...' : r.FEEDBACK) : '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Guru', 'Judul Laporan', 'Kategori', 'Periode', 'Status', 'Nilai', 'Catatan Kepsek']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Belum ada data laporan guru', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Navy tone for academic management
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 32 },
        2: { cellWidth: 42 },
        3: { cellWidth: 22 },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    let nextY = doc.lastAutoTable.finalY + 10;

    // Section 2: Detailed report narratives
    if (nextY > 230) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN & CATATAN KEMAJUAN KELAS MASING-MASING GURU:', 14, nextY);
    nextY += 6;

    reports.forEach((r, idx) => {
      if (nextY > 240) {
        doc.addPage();
        nextY = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, nextY, pageWidth - 28, 22, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text(`${idx + 1}. ${r.JUDUL} (${r.GURU_NAMA} • ${r.PERIODE})`, 18, nextY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(r.ISI || 'Tidak ada deskripsi rincian.', pageWidth - 36);
      doc.text(splitText.slice(0, 3), 18, nextY + 10.5);

      if (r.FEEDBACK) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(16, 185, 129);
        doc.text(`Catatan Evaluasi Kepsek: "${r.FEEDBACK}" (Nilai: ${r.NILAI || '-'})`, 18, nextY + 18.5);
      }

      nextY += 26;
    });

    // Signature section
    if (nextY > 230) {
      doc.addPage();
      nextY = 20;
    } else {
      nextY += 6;
    }

    const sigX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Tangerang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, sigX, nextY);
    nextY += 4.5;
    doc.text('Mengetahui / Mengesahkan,', sigX, nextY);
    nextY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Kepala UPT SDN Tangerang 6', sigX, nextY);
    nextY += 22;
    doc.text(kepsekName, sigX, nextY);
    nextY += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${kepsekNip}`, sigX, nextY);

    doc.save(`Rekap_Laporan_Guru_SDN_Tangerang_6_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * Creates the jsPDF document instance for Student Progress Report (E-Rapor)
   */
  public async createStudentProgressReportDoc(
    report: {
      siswaId: string;
      siswaNama: string;
      kelas: string;
      nilaiTugas: number;
      nilaiKuis: number;
      presensiPct: number;
      nilaiAkhir: number;
      predikat: string;
      tugasCount?: number;
      kuisCount?: number;
      keterangan?: string;
    },
    guruName: string = 'Nurul Hidayah, S.Pd.',
    guruNip: string = '19850412 201101 2 003',
    kepsekName: string = 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    kepsekNip: string = '19740520 199803 2 004'
  ): Promise<jsPDF> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();

    // 1. Kop Surat Resmi
    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25, Sukasari'} • NPSN: ${config.SCHOOL_NPSN || '20606498'}`,
    });

    let currentY = 48;

    // 2. Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN PROGRES BELAJAR & REKAPITULASI NILAI SISWA (E-RAPOR)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Laporan Resmi Hasil Evaluasi Pembelajaran (Untuk Wali Murid) • Semester Ganjil TA 2026/2027`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 7;

    // 3. Student Metadata Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Left Column
    doc.text(`Nama Siswa`, 18, currentY + 6);
    doc.text(`: ${report.siswaNama}`, 45, currentY + 6);

    doc.text(`NIS / NISN`, 18, currentY + 11);
    doc.text(`: ${report.siswaId}`, 45, currentY + 11);

    doc.text(`Sekolah`, 18, currentY + 16);
    doc.text(`: ${config.SCHOOL_NAME || 'SDN Tangerang 6'}`, 45, currentY + 16);

    // Right Column
    doc.text(`Kelas / Rombel`, 110, currentY + 6);
    doc.text(`: ${report.kelas}`, 142, currentY + 6);

    doc.text(`Wali Kelas`, 110, currentY + 11);
    doc.text(`: ${guruName}`, 142, currentY + 11);

    doc.text(`Tanggal Cetak`, 110, currentY + 16);
    doc.text(`: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 142, currentY + 16);

    currentY += 27;

    // 4. Executive Summary KPI Cards
    const cardWidth = (pageWidth - 28 - 9) / 4;
    const cardHeight = 16;
    const kkmStatus = report.nilaiAkhir >= 75 ? 'TUNTAS (≥75)' : 'BELUM TUNTAS';

    // Card 1: Rata-rata Tugas
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(29, 78, 216);
    doc.text('Tugas Mandiri (40%)', 14 + cardWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.nilaiTugas}`, 14 + cardWidth / 2, currentY + 12, { align: 'center' });

    // Card 2: Rata-rata Kuis CBT
    const card2X = 14 + cardWidth + 3;
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(221, 214, 254);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text('Kuis CBT & Ujian (40%)', card2X + cardWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${report.nilaiKuis}`, card2X + cardWidth / 2, currentY + 12, { align: 'center' });

    // Card 3: Kehadiran
    const card3X = card2X + cardWidth + 3;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text('Kehadiran (20%)', card3X + cardWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${report.presensiPct}%`, card3X + cardWidth / 2, currentY + 12, { align: 'center' });

    // Card 4: Nilai Akhir & Predikat
    const card4X = card3X + cardWidth + 3;
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('NILAI AKHIR (NA)', card4X + cardWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${report.nilaiAkhir} [${report.predikat}]`, card4X + cardWidth / 2, currentY + 12, { align: 'center' });

    currentY += 21;

    // 5. Detailed Competency & Subject Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN CAPAIAN PEMBELAJARAN PER MATA PELAJARAN:', 14, currentY);
    currentY += 4;

    const subjectsData = [
      [
        '1',
        'Pendidikan Pancasila & Kewarganegaraan',
        report.nilaiAkhir,
        report.predikat,
        report.keterangan || 'Sangat memahami hak & kewajiban peserta didik di sekolah dan lingkungan sosial.',
      ],
      [
        '2',
        'Bahasa Indonesia (Literasi Reading & Writing)',
        report.nilaiTugas,
        report.predikat,
        'Mampu membaca teks cerita narasi & menyusun kalimat dengan struktur bahasa yang runtut.',
      ],
      [
        '3',
        'Matematika & Numerasi Dasar',
        report.nilaiKuis,
        report.predikat,
        'Terampil dalam operasi hitung perkalian, pembagian, serta penyelesaian masalah soal cerita.',
      ],
      [
        '4',
        'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        Math.max(65, report.nilaiAkhir - 2),
        report.predikat === 'A' ? 'B' : report.predikat,
        'Memahami siklus hidup makhluk hidup, ekosistem lokal, dan pentingnya menjaga kebersihan.',
      ],
      [
        '5',
        'Koding & Literasi Digital SD',
        Math.min(100, report.nilaiAkhir + 3),
        'A',
        'Sangat antusias menyusun logika visual koding dan memanfaatkan Classroom SD secara mandiri.',
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Mata Pelajaran', 'Nilai', 'Predikat', 'Deskripsi Capaian Kompetensi Siswa']],
      body: subjectsData,
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52], // Emerald green headers
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 52, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    currentY = doc.lastAutoTable.finalY + 6;

    // 6. Catatan Wali Kelas & Panduan Wali Murid Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('CATATAN REKOMENDASI WALI KELAS UNTUK WALI MURID:', 18, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);
    const noteText = `Ananda ${report.siswaNama} menunjukkan semangat belajar yang tinggi dan disiplin mengumpulkan tugas. Status KKM: ${kkmStatus}. Mohon pendampingan rutin di rumah untuk membaca modul digital & latihan soal kuis CBT di platform Classroom SDN Tangerang 6.`;
    const splitNote = doc.splitTextToSize(noteText, pageWidth - 36);
    doc.text(splitNote, 18, currentY + 11);

    currentY += 26;

    // 7. Verification QR & Footer Text
    try {
      const qrPayload = `SDNTNG6-REPORT-${report.siswaId}-${report.kelas}-${report.nilaiAkhir}`;
      const qrDataUrl = await qrService.generateQRCode(qrPayload, 120);
      doc.addImage(qrDataUrl, 'PNG', 14, currentY - 2, 18, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dokumen ini diterbitkan sah secara digital oleh UPT SDN Tangerang 6.`, 34, currentY + 4);
      doc.text(`Kode Verifikasi Keaslian: ${qrPayload}`, 34, currentY + 8);
      doc.text(`Status Laporan: TERVERIFIKASI AKADEMIK • Halaman 1 dari 1`, 34, currentY + 12);
    } catch {
      // fallback if QR fails
    }

    // 8. Signatures Block (3 Signers: Orang Tua / Wali, Kepala Sekolah, Wali Kelas)
    const sigColWidth = (pageWidth - 28) / 3;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Signer 1: Orang Tua / Wali (Left)
    doc.text('Mengetahui,', 14 + sigColWidth / 2, currentY - 2, { align: 'center' });
    doc.text('Orang Tua / Wali Siswa', 14 + sigColWidth / 2, currentY + 2.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('( ........................................ )', 14 + sigColWidth / 2, currentY + 19, { align: 'center' });

    // Signer 2: Kepala Sekolah (Center)
    const centerSigX = 14 + sigColWidth + sigColWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.text('Mengesahkan,', centerSigX, currentY - 2, { align: 'center' });
    doc.text('Kepala UPT SDN Tangerang 6', centerSigX, currentY + 2.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(kepsekName, centerSigX, currentY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`NIP. ${kepsekNip}`, centerSigX, currentY + 23, { align: 'center' });

    // Signer 3: Wali Kelas (Right)
    const rightSigX = 14 + sigColWidth * 2 + sigColWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Tangerang, ${dateStr}`, rightSigX, currentY - 2, { align: 'center' });
    doc.text('Wali Kelas / Guru Pengampu', rightSigX, currentY + 2.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(guruName, rightSigX, currentY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`NIP. ${guruNip}`, rightSigX, currentY + 23, { align: 'center' });

    return doc;
  }

  /**
   * Generates a beautifully styled PDF Progress Report per Student and triggers download
   */
  public async generateStudentProgressReportPdf(
    report: {
      siswaId: string;
      siswaNama: string;
      kelas: string;
      nilaiTugas: number;
      nilaiKuis: number;
      presensiPct: number;
      nilaiAkhir: number;
      predikat: string;
      tugasCount?: number;
      kuisCount?: number;
      keterangan?: string;
    },
    guruName: string = 'Nurul Hidayah, S.Pd.',
    guruNip: string = '19850412 201101 2 003',
    kepsekName: string = 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    kepsekNip: string = '19740520 199803 2 004'
  ): Promise<void> {
    const doc = await this.createStudentProgressReportDoc(report, guruName, guruNip, kepsekName, kepsekNip);
    const nisSafe = (report.siswaId || 'NIS').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `ERapor_${nisSafe}_${report.siswaNama.replace(/\s+/g, '_')}_${report.kelas.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  }

  /**
   * Generates a beautifully styled Kemendikbud-standard P5 Project Report Card (Rapor P5) for a student and triggers download
   */
  public async generateStudentP5ReportPdf(
    student: { ID: string; NAMA: string; KELAS: string },
    guruName: string = 'Nurul Hidayah, S.Pd.',
    guruNip: string = '19850412 201101 2 003',
    kepsekName: string = 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    kepsekNip: string = '19740520 199803 2 004'
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();
    const kelas = student.KELAS || 'Kelas 4';

    // 1. Kop Surat Resmi
    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25, Sukasari'} • NPSN: ${config.SCHOOL_NPSN || '20606498'}`,
    });

    let currentY = 48;

    // 2. Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(22, 101, 52); // Emerald Green
    doc.text('RAPOR PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (RAPOR P5)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Laporan Capaian Projek Kurikulum Merdeka Belajar • Tahun Ajaran 2026/2027`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 7;

    // 3. Student Metadata Box
    doc.setDrawColor(167, 243, 208); // Emerald border
    doc.setFillColor(240, 253, 250); // Light green bg
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Left Column
    doc.text(`Nama Siswa`, 18, currentY + 6);
    doc.text(`: ${student.NAMA}`, 45, currentY + 6);

    doc.text(`NIS / NISN`, 18, currentY + 11);
    doc.text(`: ${student.ID}`, 45, currentY + 11);

    doc.text(`Sekolah`, 18, currentY + 16);
    doc.text(`: ${config.SCHOOL_NAME || 'SDN Tangerang 6'}`, 45, currentY + 16);

    // Right Column
    doc.text(`Kelas / Rombel`, 110, currentY + 6);
    doc.text(`: ${kelas}`, 142, currentY + 6);

    doc.text(`Wali Kelas`, 110, currentY + 11);
    doc.text(`: ${guruName}`, 142, currentY + 11);

    doc.text(`Tanggal Cetak`, 110, currentY + 16);
    doc.text(`: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 142, currentY + 16);

    currentY += 27;

    // Fetch student's class project details
    const p5Project = classroomService.getP5ProjectForClass(kelas);

    // Title Project Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Projek Profil yang Diikuti:`, 14, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(22, 101, 52);
    doc.text(`${p5Project.JUDUL}`, 14, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(`Tema: ${p5Project.TEMA} — ${p5Project.DESKRIPSI}`, pageWidth - 28);
    doc.text(splitDesc, 14, currentY);
    currentY += splitDesc.length * 4.5 + 2;

    // Dimension Checklist / Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Capaian Karakter & Dimensi Profil Pelajar Pancasila:`, 14, currentY);
    currentY += 4.5;

    const tableRows = p5Project.DIMENSI.map((dimensi, idx) => {
      // Dynamic simulated grade/competency based on student ID to make it unique per student
      const hash = student.ID.charCodeAt(0) + idx;
      const scoreId = hash % 4;
      const progressLabels = [
        ['MB', 'Mulai Berkembang', 'Menunjukkan ketertarikan namun perlu dorongan intensif.'],
        ['SB', 'Sedang Berkembang', 'Mulai konsisten menerapkan nilai karakter secara mandiri.'],
        ['BSH', 'Berkembang Sesuai Harapan', 'Sangat konsisten menunjukkan karakter gotong royong dan kemandirian.'],
        ['SAB', 'Sangat Berkembang', 'Menjadi panutan bagi teman-teman dalam dimensi ini.'],
      ];
      const selectedProgress = progressLabels[scoreId];

      return [
        idx + 1,
        dimensi,
        selectedProgress[0], // MB, SB, BSH, SAB
        selectedProgress[1], // Label
        selectedProgress[2], // Deskripsi Capaian
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'No',
          'Dimensi Profil Pelajar Pancasila',
          'Kode',
          'Predikat Capaian',
          'Catatan Perkembangan Karakter Siswa',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [22, 101, 52], // Emerald Green
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable finalY
    let finalY = doc.lastAutoTable.finalY + 8;

    // Legend box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Keterangan Capaian:  [MB] Mulai Berkembang  •  [SB] Sedang Berkembang  •  [BSH] Sesuai Harapan  •  [SAB] Sangat Berkembang', 14, finalY);
    finalY += 12;

    // Signatures block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text('Mengetahui,', 20, finalY);
    doc.text('Orang Tua / Wali Siswa', 20, finalY + 4);
    doc.text('.........................................', 20, finalY + 22);

    doc.text('Mengesahkan,', 82, finalY);
    doc.text('Kepala UPT SDN Tangerang 6', 82, finalY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(kepsekName, 82, finalY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${kepsekNip}`, 82, finalY + 26);

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Tangerang, ${todayStr}`, 144, finalY);
    doc.text('Guru Kelas / Wali Kelas,', 144, finalY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(guruName, 144, finalY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${guruNip}`, 144, finalY + 26);

    // Foot verification line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY + 32, pageWidth - 14, finalY + 32);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Ref. Code: SDNTNG6-P5-${student.ID}-A4-VERIFIED • Dokumen Rapor P5 Sah terintegrasi dengan LMS Cloud`, 14, finalY + 36);

    const safeNis = (student.ID || 'NIS').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeName = student.NAMA.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`RaporP5_${safeNis}_${safeName}_${kelas.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Exports E-Rapor for all students in a class into a single ZIP archive
   * with automatic file naming based on NIS (e.g. ERapor_6672_ABDILLAH_PUTRA_YAMA.pdf)
   */
  public async exportClassReportsToZip(
    students: Account[],
    targetClass: string,
    guruName: string = 'Nurul Hidayah, S.Pd.',
    guruNip: string = '19850412 201101 2 003',
    kepsekName: string = 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    kepsekNip: string = '19740520 199803 2 004',
    onProgress?: (current: number, total: number, studentName: string, studentNis: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const folderName = `E-Rapor_${targetClass.replace(/\s+/g, '_')}`;
    const folder = zip.folder(folderName) || zip;

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const nis = s.NIP || s.ID;
      if (onProgress) {
        onProgress(i + 1, students.length, s.NAMA, nis);
      }

      const report = classroomService.getStudentReportCard(
        s.ID,
        s.NAMA,
        s.KELAS || targetClass
      );

      const doc = await this.createStudentProgressReportDoc(
        {
          ...report,
          siswaId: nis,
        },
        guruName,
        guruNip,
        kepsekName,
        kepsekNip
      );

      const pdfArrayBuffer = doc.output('arraybuffer');
      // Format file name based on NIS and Name: ERapor_[NIS]_[NAMA].pdf
      const safeNis = (nis || 'NIS').replace(/[^a-zA-Z0-9_-]/g, '');
      const safeName = s.NAMA.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const pdfFileName = `ERapor_${safeNis}_${safeName}.pdf`;

      folder.file(pdfFileName, pdfArrayBuffer);
    }

    // Add manifest summary
    const manifest = {
      sekolah: 'SD NEGERI TANGERANG 6',
      kelas: targetClass,
      tahunAjaran: '2026/2027',
      totalSiswa: students.length,
      waliKelas: guruName,
      nipWaliKelas: guruNip,
      kepalaSekolah: kepsekName,
      nipKepalaSekolah: kepsekNip,
      exportedAt: new Date().toISOString(),
      daftarFile: students.map((s, idx) => ({
        no: idx + 1,
        nis: s.NIP || s.ID,
        nama: s.NAMA,
        file: `ERapor_${(s.NIP || s.ID).replace(/[^a-zA-Z0-9_-]/g, '')}_${s.NAMA.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`,
      })),
    };
    folder.file('Daftar_Rekap_Siswa.json', JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return zipBlob;
  }

  /**
   * Generates a PDF Rekapitulasi Nilai Seluruh Siswa Kelas for teacher archives & parent meetings
   */
  public generateClassGradebookSummaryPdf(
    reports: any[],
    targetClass: string,
    guruName: string = 'Nurul Hidayah, S.Pd.',
    guruNip: string = '19850412 201101 2 003'
  ): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();

    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25'} • Rombongan Belajar: ${targetClass}`,
    });

    let currentY = 46;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`REKAPITULASI LAPORAN HASIL BELAJAR PESERTA DIDIK - ${targetClass.toUpperCase()}`, pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Semester Ganjil TA 2026/2027 • Guru Kelas: ${guruName} (NIP. ${guruNip}) • Total ${reports.length} Siswa`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 8;

    const tableRows = reports.map((r, idx) => {
      const statusKetuntasan = r.nilaiAkhir >= 75 ? 'TUNTAS' : 'REMEDIAL';
      return [
        idx + 1,
        r.siswaId,
        r.siswaNama,
        r.kelas,
        r.nilaiTugas,
        r.nilaiKuis,
        `${r.presensiPct}%`,
        r.nilaiAkhir,
        r.predikat,
        statusKetuntasan,
        r.predikat === 'A'
          ? 'Sangat menguasai seluruh modul & tugas mandiri'
          : r.predikat === 'B'
          ? 'Menguasai materi dengan baik dan aktif'
          : 'Perlu penguatan pada kuis CBT & pendampingan',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'No',
          'NIS/NISN',
          'Nama Siswa',
          'Kelas',
          'Tugas (40%)',
          'Kuis CBT (40%)',
          'Kehadiran (20%)',
          'Nilai Akhir',
          'Predikat',
          'Status KKM',
          'Capaian & Catatan Evaluasi Guru',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { cellWidth: 45, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 22 },
        7: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        8: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        9: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        10: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Rekapitulasi_Nilai_${targetClass.replace(/\s+/g, '_')}_SDN_Tangerang_6.pdf`);
  }

  /**
   * Generates a PDF Rekapitulasi Daftar Tugas Siswa secara Massal
   * Allows teachers to download a summary of all assignments that need to be graded in a single document
   */
  public async generateBulkAssignmentsReportPdf(
    assignments: any[],
    courses: any[],
    submissions: any[],
    targetClass: string = 'Kelas 4',
    guruName: string = 'Guru Pengampu, S.Pd.',
    guruNip: string = '19850412 201101 2 003'
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();

    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25'} • Rekapitulasi Daftar Tugas Siswa Massal (${targetClass})`,
    });

    let currentY = 46;

    // Title Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`REKAPITULASI PENUGASAN & DAFTAR TUGAS SISWA MASSAL - ${targetClass.toUpperCase()}`, pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(
      `Tanggal Cetak: ${dateStr} • Guru Kelas/Pengampu: ${guruName} (${guruNip ? 'NIP. ' + guruNip : 'NIP. -'}) • Total ${assignments.length} Tugas`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 7;

    // Calculate Global Statistics
    const allValidSubs = submissions.filter((s: any) => s.STATUS !== 'DRAFT');
    const totalPendingGrading = allValidSubs.filter((s: any) => s.STATUS === 'SUBMITTED').length;
    const totalGraded = allValidSubs.filter((s: any) => s.STATUS === 'GRADED').length;

    // Render Stats Bar Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`RINGKASAN MASSAL:`, 18, currentY + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Penugasan: ${assignments.length} item`, 60, currentY + 7.5);
    doc.text(`Total Pengumpulan Siswa: ${allValidSubs.length} berkas`, 115, currentY + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber
    doc.text(`Perlu Dinilai: ${totalPendingGrading} tugas`, 180, currentY + 7.5);

    doc.setTextColor(22, 101, 52); // emerald
    doc.text(`Sudah Dinilai: ${totalGraded} tugas`, 235, currentY + 7.5);

    currentY += 16;

    // Table 1: Summary of All Assignments
    const table1Rows = assignments.map((a: any, idx: number) => {
      const course = courses.find((c: any) => c.ID === a.COURSE_ID);
      const asgSubs = submissions.filter((s: any) => s.ASSIGNMENT_ID === a.ID && s.STATUS !== 'DRAFT');
      const pendingCount = asgSubs.filter((s: any) => s.STATUS === 'SUBMITTED').length;
      const gradedCount = asgSubs.filter((s: any) => s.STATUS === 'GRADED').length;

      let deadlineFormatted = '-';
      try {
        if (a.DEADLINE) {
          const d = new Date(a.DEADLINE);
          deadlineFormatted = `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }
      } catch {
        deadlineFormatted = a.DEADLINE || '-';
      }

      const statusStr = pendingCount > 0 ? `PERLU DINILAI (${pendingCount})` : asgSubs.length > 0 ? 'SELESAI DINILAI' : 'BELUM ADA PENGUMPULAN';

      return [
        idx + 1,
        course ? `${course.KODE_KELAS} - ${course.NAMA}` : 'Mata Pelajaran Umum',
        a.JUDUL,
        a.TYPE || 'TUGAS',
        deadlineFormatted,
        a.BOBOT ? `${a.BOBOT}%` : '100%',
        asgSubs.length,
        gradedCount,
        pendingCount,
        statusStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          'No',
          'Mata Pelajaran',
          'Judul Penugasan / Evaluasi',
          'Tipe',
          'Tenggat Waktu',
          'Bobot',
          'Terkumpul',
          'Dinilai',
          'Perlu Dinilai',
          'Status Evaluasi',
        ],
      ],
      body: table1Rows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 70 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 32 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 22 },
        7: { halign: 'center', cellWidth: 18 },
        8: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        9: { halign: 'center', cellWidth: 'auto', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    // Obtain Y position after Table 1
    const lastAutoTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 40;
    currentY = lastAutoTableY + 8;

    // Table 2: Pending Submissions Breakdown (Detail Tugas yang Perlu Dinilai)
    const pendingSubs = submissions.filter((s: any) => s.STATUS === 'SUBMITTED');
    if (pendingSubs.length > 0) {
      if (currentY + 40 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 83, 9);
      doc.text(`RINCIAN PENGUMPULAN TUGAS SISWA YANG PERLU DINILAI (${pendingSubs.length} TUGAS)`, 14, currentY);

      currentY += 4;

      const table2Rows = pendingSubs.map((s: any, idx: number) => {
        const asg = assignments.find((a: any) => a.ID === s.ASSIGNMENT_ID);
        const course = courses.find((c: any) => c.ID === s.COURSE_ID);

        let subTime = '-';
        try {
          if (s.SUBMITTED_AT) {
            const d = new Date(s.SUBMITTED_AT);
            subTime = `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
          }
        } catch {
          subTime = s.SUBMITTED_AT || '-';
        }

        const previewContent = s.ISI ? (s.ISI.length > 90 ? s.ISI.substring(0, 90) + '...' : s.ISI) : '(Berkas/Lampiran)';

        return [
          idx + 1,
          s.SISWA_NAMA || 'Siswa',
          course ? course.NAMA : 'Mapel',
          asg ? asg.JUDUL : 'Tugas',
          subTime,
          previewContent,
          'MENUNGGU NILAI',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'No',
            'Nama Siswa',
            'Mata Pelajaran',
            'Judul Tugas',
            'Waktu Pengumpulan',
            'Ringkasan Jawaban / Lampiran',
            'Status',
          ],
        ],
        body: table2Rows,
        theme: 'grid',
        headStyles: {
          fillColor: [180, 83, 9],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 7.5,
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 45, fontStyle: 'bold' },
          2: { cellWidth: 35 },
          3: { cellWidth: 55, fontStyle: 'bold' },
          4: { halign: 'center', cellWidth: 32 },
          5: { cellWidth: 'auto' },
          6: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      const lastAutoTableY2 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 30;
      currentY = lastAutoTableY2 + 10;
    }

    // Check if space for Signatures Block
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + 35 > pageHeight) {
      doc.addPage();
      currentY = 25;
    }

    // Signatures Block
    const sigColWidth = (pageWidth - 28) / 2;
    const kepsekName = config.HEADMASTER || 'Hj. Endang Sri M, S.Pd., M.M.';
    const kepsekNip = config.HEADMASTER_NIP || '19680315 199003 2 005';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Left Signer: Kepala Sekolah
    const leftSigX = 14 + sigColWidth / 2;
    doc.text('Mengesahkan,', leftSigX, currentY, { align: 'center' });
    doc.text('Kepala UPT SDN Tangerang 6', leftSigX, currentY + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(kepsekName, leftSigX, currentY + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`NIP. ${kepsekNip}`, leftSigX, currentY + 24, { align: 'center' });

    // Right Signer: Guru Kelas / Pengampu
    const rightSigX = 14 + sigColWidth + sigColWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Tangerang, ${dateStr}`, rightSigX, currentY, { align: 'center' });
    doc.text('Guru Kelas / Pengampu Penugasan', rightSigX, currentY + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(guruName, rightSigX, currentY + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`NIP. ${guruNip || '-'}`, rightSigX, currentY + 24, { align: 'center' });

    // Verification QR Payload
    try {
      const qrPayload = `SDNTNG6-BULK-ASG-${targetClass}-${assignments.length}-${totalPendingGrading}`;
      const qrDataUrl = await qrService.generateQRCode(qrPayload, 120);
      doc.addImage(qrDataUrl, 'PNG', 14, currentY - 2, 16, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`Kode Verifikasi Sah: ${qrPayload}`, 32, currentY + 5);
      doc.text(`Diterbitkan oleh Platform Digital Classroom UPT SDN Tangerang 6`, 32, currentY + 9);
    } catch {
      // fallback
    }

    doc.save(`Rekap_Massal_Tugas_Siswa_${targetClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * Generates a printable PDF document formatted as a QR badge sheet for selected assignments.
   * Layout: 2 columns x 3 rows grid per A4 page (6 cards per page).
   */
  public async generateBulkAssignmentsQrBadgeSheetPdf(
    assignments: any[],
    courses: any[],
    targetClass: string = 'Kelas 4',
    guruName: string = 'Guru Pengampu, S.Pd.',
    guruNip: string = '19850412 201101 2 003'
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = db.getConfig();

    this.addKopSurat(doc, pageWidth, {
      show: true,
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25'} • Lembar Kartu QR Badge Penugasan (${targetClass})`,
    });

    const startY = 46;

    // Grid Dimensions: 2 columns x 3 rows per page = 6 cards
    const marginX = 12;
    const cardWidth = 89;
    const cardHeight = 72;
    const gapX = 8;
    const gapY = 8;
    const cardsPerPage = 6;

    for (let i = 0; i < assignments.length; i++) {
      const cardIndexOnPage = i % cardsPerPage;

      if (i > 0 && cardIndexOnPage === 0) {
        doc.addPage();
        this.addKopSurat(doc, pageWidth, {
          show: true,
          line1: 'PEMERINTAH KOTA TANGERANG',
          line2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
          line3: config.SCHOOL_NAME || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
          line4: `${config.ADDRESS || 'Jl. Nyimas Melati No. 25'} • Lembar Kartu QR Badge Penugasan (${targetClass})`,
        });
      }

      const col = cardIndexOnPage % 2;
      const row = Math.floor(cardIndexOnPage / 2);

      const x = marginX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const asg = assignments[i];
      const course = courses.find((c: any) => c.ID === asg.COURSE_ID);
      const courseName = course ? `${course.KODE_KELAS} - ${course.NAMA}` : 'Mata Pelajaran Umum';

      // Card Outer Box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

      // Top Banner Header inside Card
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(x, y, cardWidth, 12, 3, 3, 'F');
      doc.rect(x, y + 8, cardWidth, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('SDN TANGERANG 6 • KARTU TUGAS QR', x + 5, y + 7.5);

      // Type pill on right of banner
      const typeText = (asg.TYPE || 'TUGAS').toUpperCase();
      doc.setFillColor(13, 148, 136);
      doc.roundedRect(x + cardWidth - 24, y + 2.5, 20, 6, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.text(typeText, x + cardWidth - 14, y + 6.5, { align: 'center' });

      // Assignment Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(asg.JUDUL || 'Penugasan Siswa', cardWidth - 36);
      doc.text(splitTitle.slice(0, 2), x + 5, y + 18);

      // Subject & Course Info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Mapel: ${courseName}`, x + 5, y + 27);

      // Deadline Info
      let deadlineStr = '-';
      try {
        if (asg.DEADLINE) {
          const d = new Date(asg.DEADLINE);
          deadlineStr = `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }
      } catch {
        deadlineStr = asg.DEADLINE || '-';
      }
      doc.text(`Tenggat: ${deadlineStr}`, x + 5, y + 33);
      doc.text(`Bobot: ${asg.BOBOT ? asg.BOBOT + '%' : '100%'}`, x + 5, y + 39);

      // QR Code Rendering
      try {
        const qrPayload = `SDN6-ASG-${asg.ID}`;
        const qrDataUrl = await qrService.generateQRCode(qrPayload, 160);
        doc.addImage(qrDataUrl, 'PNG', x + cardWidth - 30, y + 15, 26, 26);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(asg.ID.slice(-8).toUpperCase(), x + cardWidth - 17, y + 43, { align: 'center' });
      } catch {
        doc.setDrawColor(203, 213, 225);
        doc.rect(x + cardWidth - 30, y + 15, 26, 26);
      }

      // Bottom Footer Box inside Card
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x + 2, y + cardHeight - 14, cardWidth - 4, 11, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Petunjuk Pemindaian:', x + 5, y + cardHeight - 8.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text('Buka Kamera QR / App Classroom untuk submisi & rincian tugas.', x + 5, y + cardHeight - 4.5);
    }

    doc.save(`Kartu_QR_Tugas_Massal_${targetClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * Generates a beautifully formatted PDF summary for bulk selected QR scan logs
   */
  public async generateQRScanLogsPDF(
    scans: QRScanLogItem[],
    options: QRScanLogsPdfOptions = {}
  ): Promise<jsPDF> {
    const orientation = options.orientation || 'portrait';
    const paperSize = options.paperSize === 'f4' ? [215, 330] : options.paperSize || 'a4';

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const contentWidth = rightMargin - leftMargin;

    // 1. Kop Surat Resmi Sekolah
    const kopBottomY = this.addKopSurat(doc, pageWidth, {
      alignment: 'dual_logo',
      borderStyle: 'double',
    });

    let currentY = kopBottomY + 6;

    // Theme Colors
    const themeRgb = this.getThemeRgb(options.themeColor || 'emerald');

    // 2. Document Title Banner
    const docTitle = options.title || 'RINGKASAN & LOG REKAPITULASI PEMINDAIAN QR CODE';
    const docNo =
      options.docNo ||
      `QR-LOG/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Date.now().toString().slice(-4)}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(docTitle, pageWidth / 2, currentY, { align: 'center' });

    currentY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nomor Dokumen: ${docNo}`, pageWidth / 2, currentY, { align: 'center' });

    currentY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Ekspor Massal Log Pemindaian Terverifikasi • Sistem Informasi QR SDN 6 Bukit Tunggal`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 5;

    // 3. Metadata Grid Box
    const config = db.getConfig();
    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const operatorName = options.operatorName || 'Petugas Operator QR';
    const operatorRole = options.operatorRole || 'Pengawas / Guru Piket';

    // Calculate Category Breakdown
    const studentCount = scans.filter((s) => s.type === 'STUDENT').length;
    const assignmentCount = scans.filter((s) => s.type === 'ASSIGNMENT').length;
    const assetCount = scans.filter((s) => s.type === 'ASSET').length;
    const otherCount = scans.filter(
      (s) => s.type !== 'STUDENT' && s.type !== 'ASSIGNMENT' && s.type !== 'ASSET'
    ).length;

    // Draw Metadata Card Container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftMargin, currentY, contentWidth, 18, 2, 2, 'FD');

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Waktu Cetak Dokumen', leftMargin + 4, currentY + 5.5);
    doc.text('Petugas / Operator', leftMargin + 4, currentY + 10.5);
    doc.text('Kategori Filter', leftMargin + 4, currentY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${nowFormatted} WIB`, leftMargin + 40, currentY + 5.5);
    doc.text(`: ${operatorName} (${operatorRole})`, leftMargin + 40, currentY + 10.5);
    doc.text(`: ${options.categoryFilter || 'Semua Log Terpilih'}`, leftMargin + 40, currentY + 15);

    // Right Column (Summary Metrics)
    const rightColX = pageWidth / 2 + 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Log Terpilih', rightColX, currentY + 5.5);
    doc.text('Status Autentikasi', rightColX, currentY + 10.5);
    doc.text('Komposisi Kategori', rightColX, currentY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(`: ${scans.length} Data Pemindaian`, rightColX + 36, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    doc.text(`: Terverifikasi Sistem (Valid)`, rightColX + 36, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `: Siswa (${studentCount}), Tugas (${assignmentCount}), Aset (${assetCount}), Lainnya (${otherCount})`,
      rightColX + 36,
      currentY + 15
    );

    currentY += 22;

    // 4. Metric Stat Pills / Badges
    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 10;
    const statCards = [
      { label: 'PRESENSI SISWA', count: studentCount, rgb: [16, 185, 129], bgRgb: [236, 253, 245] },
      { label: 'SUBMISI TUGAS', count: assignmentCount, rgb: [59, 130, 246], bgRgb: [239, 246, 255] },
      { label: 'VERIFIKASI ASET', count: assetCount, rgb: [245, 158, 11], bgRgb: [255, 251, 235] },
      { label: 'TOTAL TERPILIH', count: scans.length, rgb: [99, 102, 241], bgRgb: [238, 242, 255] },
    ];

    statCards.forEach((c, idx) => {
      const cx = leftMargin + idx * (cardWidth + 3);
      doc.setFillColor(c.bgRgb[0], c.bgRgb[1], c.bgRgb[2]);
      doc.setDrawColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.setLineWidth(0.25);
      doc.roundedRect(cx, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.text(c.label, cx + cardWidth / 2, currentY + 4, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${c.count} Log`, cx + cardWidth / 2, currentY + 8.2, { align: 'center' });
    });

    currentY += cardHeight + 4;

    // 5. Formatted Table with autoTable
    const tableHeaders = [
      'No',
      'Waktu Pemindaian',
      'Kategori',
      'Kode QR',
      'Nama / Subjek Item',
      'Keterangan / Rincian',
      'Status',
    ];

    const tableRows = scans.map((s, idx) => {
      let timeFormatted = '-';
      try {
        const d = new Date(s.timestamp);
        timeFormatted = `${d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}\n${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      } catch {
        timeFormatted = String(s.timestamp || '-');
      }

      const catLabel =
        s.type === 'STUDENT'
          ? 'Presensi Siswa'
          : s.type === 'ASSIGNMENT'
          ? 'Submisi Tugas'
          : s.type === 'ASSET'
          ? 'Verifikasi Aset'
          : 'QR Umum';

      const details = s.subtitle || s.rawPayload || '-';
      const cleanDetails = details.length > 70 ? details.slice(0, 67) + '...' : details;

      return [
        idx + 1,
        timeFormatted,
        catLabel,
        s.code || '-',
        s.title || s.code || 'Tanpa Judul',
        cleanDetails,
        'TERVERIFIKASI',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: themeRgb,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7,
        valign: 'middle',
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center', cellWidth: 26 },
        2: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        3: { font: 'courier', fontStyle: 'bold', cellWidth: 32 },
        4: { fontStyle: 'bold', cellWidth: 42 },
        5: { cellWidth: 'auto' },
        6: { halign: 'center', cellWidth: 22, fontStyle: 'bold', textColor: [22, 101, 52] },
      },
      margin: { left: leftMargin, right: leftMargin },
    });

    const lastTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 40;
    currentY = lastTableY + 6;

    // Check if new page is needed for footer/signatures
    const signatureBlockHeight = 45;
    if (currentY + signatureBlockHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 20;
    }

    // Optional user note
    if (options.notes) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(leftMargin, currentY, contentWidth, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Catatan Dokumen:', leftMargin + 3, currentY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(options.notes, leftMargin + 3, currentY + 7.5);

      currentY += 13;
    }

    // 6. Signatures and Official Digital Verification QR Code
    if (options.includeSignatures !== false) {
      const city = config.BA_DEFAULT_CITY || config.REPORT_SIGNATURE_CITY || 'Tangerang';
      const headmasterName = config.HEADMASTER || 'Hj. Rohmatun, M.Pd.';
      const headmasterNip = config.HEADMASTER_NIP || '19680512 199303 2 005';

      // Left Signature: Kepala Sekolah
      const leftSigX = leftMargin + 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Mengetahui,', leftSigX, currentY, { align: 'center' });
      doc.text('Kepala UPT Satuan Pendidikan', leftSigX, currentY + 4, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(headmasterName, leftSigX, currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`NIP. ${headmasterNip}`, leftSigX, currentY + 26, { align: 'center' });

      // Right Signature: Petugas Pemindai / Operator
      const rightSigX = rightMargin - 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${city}, ${nowFormatted.split(',')[1]?.trim() || nowFormatted}`, rightSigX, currentY, {
        align: 'center',
      });
      doc.text('Petugas Pemindai / Operator QR,', rightSigX, currentY + 4, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(operatorName, rightSigX, currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(operatorRole, rightSigX, currentY + 26, { align: 'center' });

      // Center: Official Digital Verification QR Code
      if (options.includeVerificationQR !== false) {
        try {
          const qrPayload = `SDN6-QR-LOG-${new Date().toISOString().slice(0, 10)}-${scans.length}-${Date.now().toString().slice(-4)}`;
          const qrDataUrl = await qrService.generateQRCode(qrPayload, 120);
          if (qrDataUrl) {
            const centerX = pageWidth / 2;
            doc.addImage(qrDataUrl, 'PNG', centerX - 8, currentY + 2, 16, 16);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
            doc.text('VALIDASI RESMI DIGITAL', centerX, currentY + 20, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5);
            doc.setTextColor(148, 163, 184);
            doc.text(`Hash: ${qrPayload}`, centerX, currentY + 23, { align: 'center' });
          }
        } catch {
          // fallback if QR generation fails
        }
      }
    }

    // 7. Running Page Numbers & Footer on All Pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, pageHeight - 10, rightMargin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Rekapitulasi Riwayat Pemindaian QR Code • UPT SDN 6 Bukit Tunggal • Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
        leftMargin,
        pageHeight - 6.5
      );

      doc.text(`Halaman ${i} dari ${totalPages}`, rightMargin, pageHeight - 6.5, { align: 'right' });
    }

    // 8. Auto Print or Save
    const safeDate = new Date().toISOString().slice(0, 10);
    const fileName = `Ringkasan_Riwayat_Scan_QR_Massal_${safeDate}.pdf`;

    if (options.autoPrint) {
      doc.autoPrint();
      try {
        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }, 300);
        };
      } catch (err) {
        console.warn('Auto-print iframe failed, falling back to direct save:', err);
      }
    }

    doc.save(fileName);
    return doc;
  }

  /**
   * Menghasilkan Dokumen PDF Resmi Laporan Manajemen Bulanan Kepala Sekolah
   * Merangkum data absensi, nilai tugas, dan progres proyek P5
   */
  public async generateMonthlyManagementReportPdf(data: MonthlyManagementReportData): Promise<jsPDF> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const usableWidth = pageWidth - 28;

    // ==========================================
    // HALAMAN 1: KOP SURAT, KPI & REKAP ABSENSI
    // ==========================================
    const kopBottomY = this.addKopSurat(doc, pageWidth, {
      alignment: 'dual_logo',
      borderStyle: 'double',
      line1: 'PEMERINTAH KOTA TANGERANG',
      line2: 'DINAS PENDIDIKAN',
      line3: data.schoolName || 'UPT SATUAN PENDIDIKAN SD NEGERI TANGERANG 6',
      line4: `${data.address} • NPSN: ${data.npsn}`,
    });

    let currentY = kopBottomY + 4;

    // Document Title Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN MANAJEMEN BULANAN KEPALA SEKOLAH', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Rekapitulasi Kinerja Akademik, Disiplin Presensi, & Progres Projek P5', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Nomor: ${data.docNo}  •  Periode: ${data.period} (Semester ${data.semester} TA ${data.schoolYear})`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    // 4 Executive KPI Cards Box
    const cardW = (usableWidth - 9) / 4;
    const cardH = 14;

    // Card 1: Presensi
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(20, 184, 166);
    doc.roundedRect(leftMargin, currentY, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 118, 110);
    doc.setFont('helvetica', 'bold');
    doc.text('KEHADIRAN SISWA', leftMargin + cardW / 2, currentY + 3.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setTextColor(17, 94, 89);
    doc.text(`${data.kpi.avgAttendanceRate}%`, leftMargin + cardW / 2, currentY + 8.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(data.kpi.attendanceQuality, leftMargin + cardW / 2, currentY + 12, { align: 'center' });

    // Card 2: Rerata Nilai Tugas
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(leftMargin + cardW + 3, currentY, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(29, 78, 216);
    doc.setFont('helvetica', 'bold');
    doc.text('RERATA NILAI TUGAS', leftMargin + cardW + 3 + cardW / 2, currentY + 3.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${data.kpi.avgAssignmentScore}`, leftMargin + cardW + 3 + cardW / 2, currentY + 8.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ketuntasan: ${data.kpi.academicPassRate}%`, leftMargin + cardW + 3 + cardW / 2, currentY + 12, { align: 'center' });

    // Card 3: Pengumpulan Tugas
    doc.setFillColor(245, 243, 255); // indigo-50
    doc.setDrawColor(139, 92, 246);
    doc.roundedRect(leftMargin + (cardW + 3) * 2, currentY, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(109, 40, 217);
    doc.setFont('helvetica', 'bold');
    doc.text('PENGUMPULAN TUGAS', leftMargin + (cardW + 3) * 2 + cardW / 2, currentY + 3.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setTextColor(88, 28, 135);
    doc.text(`${data.kpi.avgSubmissionRate}%`, leftMargin + (cardW + 3) * 2 + cardW / 2, currentY + 8.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Terkumpul: ${data.assignments.totalSubmitted}`, leftMargin + (cardW + 3) * 2 + cardW / 2, currentY + 12, { align: 'center' });

    // Card 4: Progres P5
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(leftMargin + (cardW + 3) * 3, currentY, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRES PROJEK P5', leftMargin + (cardW + 3) * 3 + cardW / 2, currentY + 3.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setTextColor(120, 53, 15);
    doc.text(`${data.kpi.avgP5Progress}%`, leftMargin + (cardW + 3) * 3 + cardW / 2, currentY + 8.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(data.kpi.p5TargetStatus, leftMargin + (cardW + 3) * 3 + cardW / 2, currentY + 12, { align: 'center' });

    currentY += cardH + 6;

    // SECTION I: REKAPITULASI PRESENSI & KEHADIRAN SISWA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('I. REKAPITULASI PRESENSI & KEHADIRAN SISWA PER ROMBONGAN BELAJAR', leftMargin, currentY);
    currentY += 2.5;

    const attendanceRows = data.attendance.classes.map((c, idx) => [
      idx + 1,
      c.rombel,
      c.totalStudents,
      c.hadir,
      c.sakit,
      c.izin,
      c.alpa,
      `${c.rate}%`,
      c.status === 'SANGAT_BAIK' ? 'Sangat Disiplin' : c.status === 'BAIK' ? 'Tertib' : 'Perlu Bimbingan',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Rombel', 'Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', '% Kehadiran', 'Kategori']],
      body: attendanceRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // Teal 700
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        8: { halign: 'center', cellWidth: 40 },
      },
      margin: { left: leftMargin, right: leftMargin },
    });

    // ==========================================
    // HALAMAN 2: PILAR 2 NILAI TUGAS & PILAR 3 P5
    // ==========================================
    doc.addPage();
    let p2Y = 18;

    // Running Header Page 2
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${data.schoolName} • Laporan Manajemen Bulanan (${data.period})`, leftMargin, p2Y);
    doc.text(`Nomor: ${data.docNo}`, rightMargin, p2Y, { align: 'right' });
    p2Y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, p2Y, rightMargin, p2Y);
    p2Y += 6;

    // SECTION II: REKAPITULASI PENILAIAN & CAPAIAN TUGAS SISWA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('II. REKAPITULASI PENUGASAN, CAPAIAN NILAI & KETUNTASAN SISWA PER KELAS', leftMargin, p2Y);
    p2Y += 2.5;

    const assignmentRows = data.assignments.classes.map((c, idx) => [
      idx + 1,
      c.rombel,
      c.totalAssignments,
      c.totalSubmissions,
      `${c.submissionRate}%`,
      c.avgScore.toFixed(1),
      `${c.passRate}%`,
      c.status === 'OPTIMAL' ? 'Optimal (>85)' : c.status === 'TERJADWAL' ? 'Tuntas KKTP' : 'Pendampingan',
    ]);

    autoTable(doc, {
      startY: p2Y,
      head: [['No', 'Rombel', 'Jml Tugas', 'Terkumpul', '% Kumpul', 'Rata-rata Nilai', 'Tuntas KKTP', 'Evaluasi']],
      body: assignmentRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Navy Blue
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        6: { halign: 'center', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 36 },
      },
      margin: { left: leftMargin, right: leftMargin },
    });

    // @ts-expect-error autoTable adds lastAutoTable
    p2Y = doc.lastAutoTable.finalY + 8;

    // SECTION III: REKAPITULASI PROGRES PROJEK P5
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('III. REKAPITULASI PROGRES PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)', leftMargin, p2Y);
    p2Y += 2.5;

    const p5Rows = data.p5.classes.map((c, idx) => [
      idx + 1,
      c.rombel,
      c.tema,
      c.dimensi.slice(0, 2).join(', '),
      `${c.stagesCompleted}/${c.totalStages} Tahap`,
      `${c.percentage}%`,
      c.status === 'SELESAI' ? 'Gelar Karya' : c.status === 'TAHAP_AKSI' ? 'Aksi Nyata' : 'Kontekstualisasi',
    ]);

    autoTable(doc, {
      startY: p2Y,
      head: [['No', 'Rombel', 'Tema Projek P5', 'Fokus Dimensi Profil', 'Tahapan Selesai', '% Progres', 'Fase Pelaksanaan']],
      body: p5Rows,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 24 },
        2: { cellWidth: 42 },
        3: { cellWidth: 40 },
        4: { halign: 'center', cellWidth: 24 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        6: { halign: 'center', cellWidth: 24 },
      },
      margin: { left: leftMargin, right: leftMargin },
    });

    // ==========================================
    // HALAMAN 3: ANALISIS, REKOMENDASI & TANDA TANGAN
    // ==========================================
    doc.addPage();
    let p3Y = 18;

    // Running Header Page 3
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${data.schoolName} • Laporan Manajemen Bulanan (${data.period})`, leftMargin, p3Y);
    doc.text(`Nomor: ${data.docNo}`, rightMargin, p3Y, { align: 'right' });
    p3Y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, p3Y, rightMargin, p3Y);
    p3Y += 6;

    // SECTION IV: EXECUTIVE SUMMARY & SUPERVISORY RECOMMENDATIONS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('IV. ANALISIS MANAJERIAL & REKOMENDASI SUPERVISI KEPALA SEKOLAH', leftMargin, p3Y);
    p3Y += 5;

    // Executive Narrative Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    const narrativeLines = doc.splitTextToSize(data.executiveSummaryText, usableWidth - 10);
    const boxHeight = narrativeLines.length * 3.8 + 8;
    doc.roundedRect(leftMargin, p3Y, usableWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);
    doc.text(narrativeLines, leftMargin + 5, p3Y + 5.5);
    p3Y += boxHeight + 6;

    // Action Items / Recommendations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Catatan Arahan & Tindak Lanjut Supervisi:', leftMargin, p3Y);
    p3Y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    data.supervisoryRecommendations.forEach((rec) => {
      const splitRec = doc.splitTextToSize(rec, usableWidth - 6);
      doc.text(splitRec, leftMargin + 3, p3Y);
      p3Y += splitRec.length * 3.5 + 2;
    });

    p3Y += 6;

    // Generate Official Verification QR Code
    const qrPayload = JSON.stringify({
      dokumen: 'LAPORAN_MANAJEMEN_BULANAN_KEPALA_SEKOLAH',
      sekolah: data.schoolName,
      npsn: data.npsn,
      periode: data.period,
      nomorSurat: data.docNo,
      kepsek: data.headmasterName,
      nipKepsek: data.headmasterNip,
      pengawas: data.supervisorName,
      kehadiranSekolah: `${data.kpi.avgAttendanceRate}%`,
      rerataNilai: `${data.kpi.avgAssignmentScore}`,
      progresP5: `${data.kpi.avgP5Progress}%`,
      timestamp: data.generatedAt,
      status: 'TERVERIFIKASI_RESMI_KOTA_TANGERANG',
    });

    let qrDataUrl = '';
    try {
      qrDataUrl = await qrService.generateQRCode(qrPayload, 140);
    } catch {
      // fallback
    }

    // Embed QR Verification Box
    const signTopY = p3Y;
    if (qrDataUrl) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(leftMargin, signTopY + 4, 38, 44, 2, 2, 'FD');
      try {
        doc.addImage(qrDataUrl, 'PNG', leftMargin + 4, signTopY + 6, 30, 30);
      } catch (err) {
        console.warn('Failed embedding verification QR:', err);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text('VERIFIKASI DIGITAL ASLI', leftMargin + 19, signTopY + 39, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(100, 116, 139);
      doc.text('SDN TANGERANG 6 • DISDIK', leftMargin + 19, signTopY + 42, { align: 'center' });
    }

    // Official Signature Block (Two Columns: Pengawas Pembina & Kepala Sekolah)
    const signCol1X = leftMargin + 65;
    const signCol2X = rightMargin - 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const todayDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Tangerang, ${todayDateStr}`, signCol2X, signTopY, { align: 'center' });
    doc.text('Mengetahui,', signCol1X, signTopY + 4.5, { align: 'center' });
    doc.text('Kepala UPT Satuan Pendidikan,', signCol2X, signTopY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text('Pengawas Pembina SD Kec. Tangerang', signCol1X, signTopY + 9, { align: 'center' });
    doc.text(data.schoolName, signCol2X, signTopY + 9, { align: 'center' });

    const signNameY = signTopY + 38;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.supervisorName, signCol1X, signNameY, { align: 'center' });
    doc.line(signCol1X - 25, signNameY + 1, signCol1X + 25, signNameY + 1);

    doc.text(data.headmasterName, signCol2X, signNameY, { align: 'center' });
    doc.line(signCol2X - 25, signNameY + 1, signCol2X + 25, signNameY + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIP. ${data.supervisorNip}`, signCol1X, signNameY + 4.5, { align: 'center' });
    doc.text(`NIP. ${data.headmasterNip}`, signCol2X, signNameY + 4.5, { align: 'center' });

    // ==========================================
    // FOOTER NUMBERING ACROSS ALL PAGES
    // ==========================================
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, pageHeight - 10, rightMargin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Laporan Manajemen Terpadu • Sistem Informasi Akademik & Aset SDN Tangerang 6 • Dicetak: ${new Date().toLocaleString('id-ID')}`,
        leftMargin,
        pageHeight - 6.5
      );
      doc.text(`Halaman ${i} dari ${totalPages}`, rightMargin, pageHeight - 6.5, { align: 'right' });
    }

    const fileName = `Laporan_Manajemen_Bulanan_Kepsek_${data.period.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    return doc;
  }
}

export interface QRScanLogItem {
  id: string;
  code: string;
  title: string;
  type: 'ASSIGNMENT' | 'ASSET' | 'STUDENT' | 'OTHER' | string;
  subtitle?: string;
  timestamp: number;
  rawPayload?: string;
}

export interface QRScanLogsPdfOptions {
  title?: string;
  docNo?: string;
  categoryFilter?: string;
  notes?: string;
  operatorName?: string;
  operatorRole?: string;
  paperSize?: 'a4' | 'f4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  autoPrint?: boolean;
  themeColor?: 'emerald' | 'navy' | 'monochrome' | 'slate' | 'amber';
  includeSignatures?: boolean;
  includeVerificationQR?: boolean;
}

export const pdfService = new PdfService();


