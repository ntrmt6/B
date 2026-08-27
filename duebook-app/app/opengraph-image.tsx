import { ImageResponse } from 'next/og';

export const alt = 'DueBook — বাকির খাতা অ্যাপ';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 84, height: 84, borderRadius: 20,
              background: 'white', color: '#0ea5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 56, fontWeight: 900,
            }}
          >৳</div>
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: -1 }}>DueBook</div>
        </div>
        <div style={{ marginTop: 32, fontSize: 68, fontWeight: 900, lineHeight: 1.1, maxWidth: 900 }}>
          বাকির হিসাব রাখুন, খাতা ছাড়াই।
        </div>
        <div style={{ marginTop: 20, fontSize: 30, opacity: 0.92, maxWidth: 900 }}>
          বাংলাদেশি দোকানদারদের জন্য ফ্রি বাকির খাতা অ্যাপ · অফলাইনেও চলে
        </div>
        <div style={{ marginTop: 40, display: 'flex', gap: 16, fontSize: 22, fontWeight: 700 }}>
          <span style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>📱 বিকাশ / নগদ QR</span>
          <span style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>💬 SMS রিমাইন্ডার</span>
          <span style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>📶 Offline</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
