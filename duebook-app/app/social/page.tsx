'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { social, SocialPost } from '@/lib/socialApi';
import SocialShell from './SocialShell';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, X, Sparkles } from 'lucide-react';

const WELCOME_KEY = 'duebook_social_welcome_v1';

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(WELCOME_KEY)) setShowWelcome(true); } catch {}
  }, []);
  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch {}
  };

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const before = mode === 'more' && posts.length ? posts[posts.length - 1].createdAt : undefined;
      const list = await social.feed({ kind: 'post', before, limit: 15 });
      if (mode === 'more') {
        setPosts(prev => [...prev, ...list]);
        if (list.length < 15) setDone(true);
      } else {
        setPosts(list);
        setDone(list.length < 15);
      }
    } catch { toast.error('Failed to load feed'); }
    finally {
      setLoading(false); setRefreshing(false); setLoadingMore(false);
    }
  }, [posts]);

  useEffect(() => { load('initial'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreated = (p: SocialPost) => setPosts(prev => [p, ...prev]);
  const onDelete = (id: string) => setPosts(prev => prev.filter(p => p._id !== id));
  const onChange = (p: SocialPost) => setPosts(prev => prev.map(x => x._id === p._id ? { ...x, ...p } : x));

  useEffect(() => {
    if (loadingMore || done) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        load('more');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadingMore, done, load]);

  return (
    <SocialShell
      title="Social"
      right={
        <button onClick={() => load('refresh')} title="Refresh feed" aria-label="Refresh feed"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      }
    >
      {showWelcome && (
        <div className="mx-3 mt-2 mb-1 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-900 p-3 relative">
          <button onClick={dismissWelcome} aria-label="Dismiss welcome"
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-white/60">
            <X size={13} />
          </button>
          <div className="flex items-start gap-2 pr-6">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="text-[12px] leading-relaxed text-gray-700 dark:text-slate-200">
              <div className="font-bold text-[13px] text-sky-700 dark:text-sky-300 mb-0.5">DueBook Social এ স্বাগতম!</div>
              দোকানের নতুন অফার, ছবি বা ভিডিও শেয়ার করুন। নিচের বক্সে লিখে <b>Post</b> চাপুন — কাস্টমার দেখতে পাবে।
            </div>
          </div>
        </div>
      )}
      <PostComposer onCreated={onCreated} authorName={user?.name} authorImage={(user as any)?.image} />
      {loading && (
        <div className="py-10 flex justify-center"><Loader2 size={22} className="animate-spin text-sky-500" /></div>
      )}
      {!loading && posts.length === 0 && (
        <div className="py-14 px-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
            <Sparkles size={24} className="text-sky-500" />
          </div>
          <div className="text-[14px] font-semibold text-gray-700 dark:text-slate-200">এখনো কোনো পোস্ট নেই</div>
          <div className="text-[12px] text-gray-500 dark:text-slate-400 mt-1">
            No posts yet — উপরের বক্সে লিখে প্রথম পোস্ট করুন।
          </div>
        </div>
      )}
      <div>
        {posts.map(p => (
          <PostCard key={p._id} post={p} currentUserId={user?._id} onDelete={onDelete} onChange={onChange} />
        ))}
      </div>
      {loadingMore && (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin text-sky-500" /></div>
      )}
      {done && posts.length > 0 && (
        <div className="py-6 text-center text-[11px] text-gray-400">You're all caught up</div>
      )}
    </SocialShell>
  );
}
