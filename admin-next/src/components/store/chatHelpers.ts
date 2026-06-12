/** Build a WhatsApp direct link from a raw phone number. */
export const buildWhatsAppLink = (rawNumber?: string | null): string | null => {
    if (!rawNumber) return null;
    const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
};

/** Build a Messenger direct link from a raw identifier. */
export const buildMessengerLink = (rawValue?: string | null): string | null => {
    if (!rawValue) return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    if (trimmed.startsWith('m.me/')) {
        return `https://${trimmed}`;
    }
    if (trimmed.startsWith('@')) {
        return `https://m.me/${trimmed.slice(1)}`;
    }
    return `https://m.me/${trimmed.replace(/^\//, '')}`;
};

/** Convert a hex colour string to an "R, G, B" CSS string. */
export const hexToRgb = (hex: string): string => {
    if (!hex) return '0, 0, 0';
    let sanitized = hex.replace('#', '');
    if (sanitized.length === 3) {
        sanitized = sanitized.split('').map((char) => char + char).join('');
    }
    if (sanitized.length !== 6) return '0, 0, 0';
    const numeric = parseInt(sanitized, 16);
    const r = (numeric >> 16) & 255;
    const g = (numeric >> 8) & 255;
    const b = numeric & 255;
    return `${r}, ${g}, ${b}`;
};
