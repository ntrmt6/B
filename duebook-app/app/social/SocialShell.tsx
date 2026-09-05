'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Home, Video, MessageCircle, User, ChevronLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: ReactNode;
  title?: string;
  back?: string;
  right?: ReactNode;
  hideNav?: boolean;
}

export default function SocialShell({ children, title = 'DueBook Social', back, right, hideNav }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const items = [
    { href: '/social', label: 'Feed', icon: Home, match: (p: string) => p === '/social' || p === '/social/' },
    { href: '/social/shorts', label: 'Shorts', icon: Video, match: (p: string) => p.startsWith('/social/shorts') },
    { href: '/social/messages', label: 'Chat', icon: MessageCircle, match: (p: string) => p.startsWith('/social/messages') },
    { href: '/social/invite', label: 'Invite', icon: UserPlus, match: (p: string) => p.startsWith('/social/invite') },
    { href: '/social/profile', label: 'Me', icon: User, match: (p: string) => p.startsWith('/social/profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="mx-auto max-w-xl px-3 py-2.5 flex items-center gap-2">
          {back ? (
            <button onClick={() => router.push(back)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
              <ChevronLeft size={18} />
            </button>
          ) : (
            <Link href="/due-book"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
              <ChevronLeft size={18} />
            </Link>
          )}
          <h1 className="text-[15px] font-semibold flex-1 truncate">{title}</h1>
          {right}
        </div>
      </header>
      <main className={`mx-auto max-w-xl px-0 pb-24 ${hideNav ? '' : 'pt-1'}`}>{children}</main>
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200 dark:border-slate-800">
          <ul className="mx-auto max-w-xl grid grid-cols-5">
            {items.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname || '');
              return (
                <li key={href}>
                  <Link href={href}
                    className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? 'text-sky-600 dark:text-sky-400 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                    <Icon size={19} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function Avatar({ name, image, size = 36, onClick }: { name?: string; image?: string; size?: number; onClick?: () => void }) {
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || '?';
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (image) {
    return (
      <img src={image} alt={name || ''} onClick={onClick}
        style={style}
        className={`rounded-full object-cover bg-gray-100 dark:bg-slate-800 ${onClick ? 'cursor-pointer' : ''}`} />
    );
  }
  return (
    <div onClick={onClick}
      style={style}
      className={`rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-semibold ${onClick ? 'cursor-pointer' : ''}`}>
      {initials}
    </div>
  );
}
