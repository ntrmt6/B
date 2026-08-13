import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

// basePath the app is served under ("/B" on GitHub Pages, "" elsewhere).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'DueBook',
  description: 'Track money owed and given',
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DueBook' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('${BASE_PATH}/sw.js').catch(()=>{}))}` }} />
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
