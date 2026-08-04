'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) router.replace('/due-book');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/due-book');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[280px]">
        <div className="flex flex-col items-center mb-5">
          <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center shadow-md mb-2.5">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-[17px] font-bold text-gray-900">DueBook</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Track money owed &amp; given</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
