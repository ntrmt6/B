import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const SITE_URL = 'https://duebook.shopbdit.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DueBook — বাকির খাতা, দোকানের হিসাব ও লেনদেন অ্যাপ | Bangla Due Book',
    template: '%s · DueBook',
  },
  description:
    'DueBook — বাংলাদেশি দোকানদারদের জন্য সহজ বাকির খাতা অ্যাপ। কাস্টমার, সাপ্লায়ার ও কর্মচারীর দেনা-পাওনা, বিকাশ পেমেন্ট, SMS রিমাইন্ডার, অফলাইন সাপোর্ট — সব একসাথে, ফ্রি।',
  keywords: [
    'বাকির খাতা', 'বাকির হিসাব', 'দোকানের হিসাব', 'ক্যাশ বই', 'হিসাব রাখার অ্যাপ',
    'baki khata', 'baki book', 'bakir hisab', 'dokan hisab', 'due book',
    'due book bangla', 'due book bd', 'khata bangla', 'khata app bangladesh',
    'হিসাব খাতা অ্যাপ', 'বাংলা হিসাব অ্যাপ', 'শপ হিসাব', 'ছোট ব্যবসার হিসাব',
    'DueBook', 'DueBook Bangla', 'DueBook Bangladesh', 'baki hishab app',
    'customer due tracker', 'shop ledger bangla', 'udhar book', 'khata bahi',
  ],
  authors: [{ name: 'ShopBD IT' }],
  creator: 'ShopBD IT',
  publisher: 'ShopBD IT',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DueBook' },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'bn-BD': SITE_URL,
      'en-BD': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    alternateLocale: ['en_US'],
    url: SITE_URL,
    siteName: 'DueBook',
    title: 'DueBook — বাকির খাতা অ্যাপ | দোকানের দেনা-পাওনা সহজে',
    description:
      'বাংলাদেশের দোকানদারদের জন্য #১ ফ্রি বাকির খাতা অ্যাপ। কাস্টমারের বাকি, সাপ্লায়ারের পাওনা, বিকাশ পেমেন্ট, SMS রিমাইন্ডার — অফলাইনেও চলে।',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DueBook — বাকির খাতা অ্যাপ',
    description:
      'বাংলাদেশি দোকানদারদের জন্য ফ্রি বাকির খাতা অ্যাপ। দেনা-পাওনা, বিকাশ, SMS রিমাইন্ডার — সব এক জায়গায়।',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'finance',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn-BD">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Bangladesh" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontSize: 13, fontWeight: 600, borderRadius: 10 },
              duration: 2000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
