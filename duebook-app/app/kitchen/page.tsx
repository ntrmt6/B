'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function KitchenEntryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('duebook_role', 'employee');
      localStorage.setItem('duebook_kitchen_mode', '1');
    }
    if (loading) return;
    if (!user) router.replace('/login');
    else router.replace('/due-book/orders');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <ChefHat size={48} className="text-orange-400" />
        <div className="text-lg font-bold">রান্নাঘর লোড হচ্ছে…</div>
      </div>
    </div>
  );
}
