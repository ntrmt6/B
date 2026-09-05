'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { social, SocialPost } from '@/lib/socialApi';
import SocialShell from './SocialShell';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);

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
        <button onClick={() => load('refresh')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      }
    >
      <PostComposer onCreated={onCreated} authorName={user?.name} authorImage={(user as any)?.image} />
      {loading && (
        <div className="py-10 flex justify-center"><Loader2 size={22} className="animate-spin text-sky-500" /></div>
      )}
      {!loading && posts.length === 0 && (
        <div className="py-16 text-center text-gray-500 dark:text-slate-400 text-[13px]">
          No posts yet. Be the first!
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
