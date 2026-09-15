// Bengali numerals and currency formatting helpers.
// Use these everywhere user-facing numbers appear in the menu / order flows.

const EN_TO_BN: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

export const toBn = (input: number | string | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const s = typeof input === 'number' ? String(input) : input;
  return s.replace(/[0-9]/g, (d) => EN_TO_BN[d] || d);
};

export const formatBdt = (n: number | null | undefined): string => {
  const value = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  const rounded = Math.round(value * 100) / 100;
  const [intPart, decPart] = rounded.toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const withDec = decPart && decPart !== '00' ? `${grouped}.${decPart}` : grouped;
  return `৳ ${toBn(withDec)}`;
};

const BN_MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগ', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];

export const formatBnDate = (input: Date | string | number): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return `${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}`;
};

export const formatBnTime = (input: Date | string | number): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const h24 = d.getHours();
  const suffix = h24 < 12 ? 'সকাল' : h24 < 17 ? 'দুপুর' : 'সন্ধ্যা';
  const h12 = ((h24 + 11) % 12) + 1;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${suffix} ${toBn(h12)}:${toBn(m)}`;
};

// Font file paths (served from /public/fonts). Import these when loading into jsPDF.
export const BENGALI_FONT_URLS = {
  regular: '/fonts/NotoSansBengali-Regular.ttf',
  bold: '/fonts/NotoSansBengali-Bold.ttf',
} as const;
