// Utility/helper functions for FigmaProductList

/** Normalize an image URL to ensure it has a leading slash or full URL */
export const normalizeImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
};

/** Detect if the parsed CSV headers match the Daraz/Lazada export format */
export const isDarazFormat = (headers: string[]): boolean => {
  const advancedHeaders = ['Product Name(English)', '*Product Name(English)', 'Product Images1', '*Product Images1', 'Main Description'];
  const basicHeaders = ['SellerSKU', '*SellerSKU', 'Seller SKU', '*Seller SKU', 'Image 1', 'Image1', '*Image 1', '*Image1', 'Short Description', '*Short Description', 'Package Weight', '*Package Weight', 'Package Content', '*Package Content', 'Color Family'];
  const normalizedHeaders = headers.map(h => h.replace(/^\*/, '').trim());
  const hasAdvanced = advancedHeaders.some(h => normalizedHeaders.some(header => header.includes(h.replace('*', ''))));
  const hasBasic = basicHeaders.some(h => normalizedHeaders.some(header => header === h.replace('*', '').trim()));
  const hasProductName = normalizedHeaders.some(h => h === 'Product Name' || h === 'Product Name(English)');
  const hasImageOrSku = normalizedHeaders.some(h => /^Image\s*\d/i.test(h) || /SellerSKU|Seller SKU/i.test(h));
  return hasAdvanced || hasBasic || (hasProductName && hasImageOrSku);
};

/** Strip HTML tags to get plain text (uses DOMParser to avoid innerHTML XSS risks) */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
};

/** Get the store front URL for a given subdomain (SSR-safe) */
export { getStoreUrl } from '../../utils/appHelpers';

/** Get Tailwind className for a courier status badge based on status label */
export const getCourierBadgeClassName = (label: string): string => {
  const normalized = label.toLowerCase();
  if (normalized.includes('deliver')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (normalized.includes('cancel') || normalized.includes('return') || normalized.includes('fail')) return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (normalized.includes('transit') || normalized.includes('pickup') || normalized.includes('process')) return 'bg-sky-50 text-sky-700 border border-sky-200';
  return 'bg-violet-50 text-violet-700 border border-violet-200';
};
