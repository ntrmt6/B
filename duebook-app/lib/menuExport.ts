import type { MenuItemDoc, MenuSettingsDoc } from './menuApi';
import { toBn, formatBdt, formatBnDate } from './bn';

/* ─────────────── Font loading (cached) ─────────────── */

let fontCache: { regular?: string; bold?: string } = {};

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function loadBengaliFonts() {
  if (!fontCache.regular) {
    fontCache.regular = await fetchAsBase64('/fonts/NotoSansBengali-Regular.ttf');
  }
  if (!fontCache.bold) {
    fontCache.bold = await fetchAsBase64('/fonts/NotoSansBengali-Bold.ttf');
  }
  return fontCache as { regular: string; bold: string };
}

/* ─────────────── PDF generation ─────────────── */

export type PdfFormat = 'a4' | 'a5';

interface PdfOpts {
  items: MenuItemDoc[];
  settings: MenuSettingsDoc;
  format: PdfFormat;
}

interface JsPdfDoc {
  addFileToVFS(name: string, base64: string): void;
  addFont(name: string, id: string, style: string): void;
  setFont(id: string, style?: string): void;
  setFontSize(pt: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setLineWidth(w: number): void;
  text(text: string, x: number, y: number, opts?: { align?: 'left' | 'center' | 'right' }): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: 'F' | 'S' | 'FD'): void;
  addPage(): void;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  getTextWidth(text: string): number;
  save(name: string): void;
  output(type: 'blob'): Blob;
}

interface JsPdfCtor {
  new (opts: { orientation: 'portrait'; unit: 'mm'; format: 'a4' | 'a5' }): JsPdfDoc;
}

async function makePdfBlob({ items, settings, format }: PdfOpts): Promise<Blob> {
  const { jsPDF } = await import('jspdf') as unknown as { jsPDF: JsPdfCtor };
  const { regular, bold } = await loadBengaliFonts();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format });
  doc.addFileToVFS('NotoSansBengali-Regular.ttf', regular);
  doc.addFont('NotoSansBengali-Regular.ttf', 'NotoBn', 'normal');
  doc.addFileToVFS('NotoSansBengali-Bold.ttf', bold);
  doc.addFont('NotoSansBengali-Bold.ttf', 'NotoBn', 'bold');

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const isA5 = format === 'a5';
  const marginX = isA5 ? 10 : 14;
  const contentW = w - marginX * 2;

  // Header band
  doc.setFillColor(255, 236, 210);
  doc.rect(0, 0, w, isA5 ? 26 : 32, 'F');
  doc.setDrawColor(234, 137, 24);
  doc.setLineWidth(0.6);
  doc.line(0, isA5 ? 26 : 32, w, isA5 ? 26 : 32);

  const shopName = settings.shopNameBn || 'আমাদের মেনু';
  doc.setFont('NotoBn', 'bold');
  doc.setTextColor(120, 53, 15);
  doc.setFontSize(isA5 ? 20 : 26);
  doc.text(shopName, w / 2, isA5 ? 13 : 15, { align: 'center' });

  if (settings.taglineBn) {
    doc.setFont('NotoBn', 'normal');
    doc.setFontSize(isA5 ? 11 : 13);
    doc.setTextColor(180, 83, 9);
    doc.text(settings.taglineBn, w / 2, isA5 ? 20 : 24, { align: 'center' });
  }

  // Body
  const groups = groupByCategory(items.filter(i => i.available));
  let y = (isA5 ? 26 : 32) + 8;
  const nameFontSize = isA5 ? 12 : 14;
  const priceFontSize = isA5 ? 13 : 15;
  const catFontSize = isA5 ? 14 : 17;
  const lineH = isA5 ? 7.5 : 9;
  const catGap = isA5 ? 6 : 8;
  const footerReserve = isA5 ? 18 : 22;

  const ensureSpace = (need: number) => {
    if (y + need > h - footerReserve) {
      doc.addPage();
      y = marginX;
    }
  };

  for (const [cat, list] of groups) {
    ensureSpace(catGap + lineH);
    doc.setFont('NotoBn', 'bold');
    doc.setTextColor(154, 52, 18);
    doc.setFontSize(catFontSize);
    doc.text(cat, marginX, y);
    y += 2;
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + contentW, y);
    y += 4;

    for (const it of list) {
      ensureSpace(lineH);
      doc.setFont('NotoBn', 'normal');
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(nameFontSize);
      doc.text(it.nameBn, marginX, y);

      doc.setFont('NotoBn', 'bold');
      doc.setFontSize(priceFontSize);
      const priceStr = formatBdt(it.price);
      const priceW = doc.getTextWidth(priceStr);
      doc.text(priceStr, marginX + contentW - priceW, y);

      // Dotted leader
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      const nameW = (() => { doc.setFont('NotoBn', 'normal'); doc.setFontSize(nameFontSize); return doc.getTextWidth(it.nameBn); })();
      const dotStart = marginX + nameW + 2;
      const dotEnd = marginX + contentW - priceW - 2;
      for (let x = dotStart; x < dotEnd; x += 1.6) doc.line(x, y - 1, x + 0.6, y - 1);

      y += lineH;
    }
    y += catGap;
  }

  if (groups.length === 0) {
    doc.setFont('NotoBn', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    doc.text('কোনো আইটেম নেই', w / 2, h / 2, { align: 'center' });
  }

  // Footer
  const notes = settings.footerNotesBn.filter(n => n && n.trim());
  if (notes.length > 0) {
    doc.setFillColor(255, 247, 231);
    doc.rect(0, h - footerReserve, w, footerReserve, 'F');
    doc.setDrawColor(251, 191, 36);
    doc.line(0, h - footerReserve, w, h - footerReserve);

    doc.setFont('NotoBn', 'bold');
    doc.setTextColor(120, 53, 15);
    doc.setFontSize(isA5 ? 10 : 12);
    let fy = h - footerReserve + (isA5 ? 7 : 8);
    for (const n of notes.slice(0, 3)) {
      doc.text(n, w / 2, fy, { align: 'center' });
      fy += isA5 ? 5 : 6;
    }
  }

  return doc.output('blob');
}

function groupByCategory(items: MenuItemDoc[]): [string, MenuItemDoc[]][] {
  const map = new Map<string, MenuItemDoc[]>();
  for (const it of items) {
    const arr = map.get(it.category) || [];
    arr.push(it);
    map.set(it.category, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
  return Array.from(map.entries());
}

/* ─────────────── PNG generation from DOM ─────────────── */

export async function makePngBlob(elementId: string): Promise<Blob> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('preview element not found');
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob); else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}

/* ─────────────── Share sheet + download ─────────────── */

export async function shareOrDownload(blob: Blob, fileName: string, mime: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: mime });
  const canShareFiles = typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof (navigator as any).canShare === 'function'
    && (navigator as any).canShare({ files: [file] });
  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (err: any) {
      // AbortError = user cancelled; fall through to download
      if (err?.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}

/* ─────────────── Public API ─────────────── */

export async function exportMenuPdf(opts: PdfOpts): Promise<{ blob: Blob; fileName: string }> {
  const blob = await makePdfBlob(opts);
  const stamp = fileStamp();
  const suffix = opts.format === 'a5' ? 'A5' : 'A4';
  const fileName = `menu-${suffix}-${stamp}.pdf`;
  return { blob, fileName };
}

export async function exportMenuPng(elementId: string): Promise<{ blob: Blob; fileName: string }> {
  const blob = await makePngBlob(elementId);
  const fileName = `menu-${fileStamp()}.png`;
  return { blob, fileName };
}

function fileStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export { toBn, formatBdt, formatBnDate };
