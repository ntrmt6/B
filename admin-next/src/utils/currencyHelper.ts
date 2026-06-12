/**
 * Currency helper - maps shopCurrency config to symbol
 */
const CURRENCY_MAP: Record<string, string> = {
  BDT: '৳',
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AED: 'د.إ',
  SAR: '﷼',
  MYR: 'RM',
  SGD: 'S$',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  THB: '฿',
  PKR: '₨',
  NPR: 'रू',
  LKR: 'Rs',
};

export function getCurrencySymbol(shopCurrency?: string): string {
  if (!shopCurrency) return '৳';
  return CURRENCY_MAP[shopCurrency] || '৳';
}
