'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomeRedirectGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const kitchen = typeof window !== 'undefined' && localStorage.getItem('duebook_kitchen_mode') === '1';
    router.replace(kitchen ? '/due-book/orders' : '/due-book');
  }, [user, loading, router]);

  return null;
}
