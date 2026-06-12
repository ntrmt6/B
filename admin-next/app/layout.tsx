import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { AppProvider } from './providers';
import { GlobalErrorListener } from '@/components/GlobalErrorListener';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Best E-commerce SaaS Platform in Bangladesh | SystemNextIT',
  description: 'Build, manage, and scale your online store with SystemNextIT’s powerful E-commerce SaaS solution. Enjoy seamless payments, inventory management, and 24/7 support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className={`${roboto.className} min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300`} suppressHydrationWarning>
        <AppProvider>
          <GlobalErrorListener>
            {children}
          </GlobalErrorListener>
        </AppProvider>
      </body>
    </html>
  );
}
