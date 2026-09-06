'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { social, SocialPost, socialTimeAgo } from '@/lib/socialApi';
import { Heart, MessageCircle, Share2, ChevronLeft, Plus, Volume2, VolumeX, Home, Video as VideoIcon, User as UserIcon, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../SocialShell';
import PostComposer from '../PostComposer';

export default function ShortsPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [muted, setMuted] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedIds, setPausedIds] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await social.feed({ kind: 'short', limit: 25 });
      setPosts(list);
    } catch { toast.error('Failed to load shorts'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!authLoading && !user && typeof window !== 'undefined') window.location.href = '/login';
  }, [user, authLoading]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(ent => {
          const idx = Number((ent.target as HTMLElement).dataset.idx || '0');
          const video = videoRefs.current[idx];
          if (!video) return;
          if (ent.isIntersecting && ent.intersectionRatio > 0.5) {
            setActiveIndex(idx);
            video.currentTime = 0;
            const p = video.play();
            if (p && typeof p.then === 'function') {
              p.catch(() => {
                const id = (ent.target as HTMLElement).dataset.postid || '';
                if (id) setPausedIds(prev => ({ ...prev, [id]: true }));
              });
            }
          } else {
            video.pause();
          }
        });
      },
      { root: c, threshold: [0, 0.6, 1] }
    );
    const nodes = c.querySelectorAll('[data-idx]');
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [posts]);

  async function like(post: SocialPost) {
    const idx = posts.findIndex(p => p._id === post._id);
    if (idx < 0) return;
    const prev = posts[idx];
    setPosts(list => list.map((p, i) => i === idx ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p));
    try {
      const r = await social.like(post._id);
      setPosts(list => list.map((p, i) => i === idx ? { ...p, liked: r.liked, likeCount: r.likeCount } : p));
    } catch {
      setPosts(list => list.map((p, i) => i === idx ? prev : p));
    }
  }

  async function doShare(post: SocialPost) {
    const url = `${window.location.origin}/social/post/${post._id}`;
    try {
      if ((navigator as any).share) await (navigator as any).share({ url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
      await social.share(post._id);
    } catch {}
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div className="absolute top-0 inset-x-0 z-30 px-3 py-2.5 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent">
        <Link href="/social" title="Back to feed" aria-label="Back to feed"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 text-[14px] font-semibold">Shorts</div>
        <button onClick={() => setMuted(m => !m)}
          title={muted ? 'Unmute video / সাউন্ড চালু করুন' : 'Mute video / সাউন্ড বন্ধ করুন'}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button onClick={() => setShowComposer(true)}
          title="Post a new short / নতুন শর্ট পোস্ট করুন" aria-label="Post a new short"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black">
          <Plus size={18} />
        </button>
      </div>

      {posts.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[15px] font-semibold text-white mb-1">এখনো কোনো শর্ট নেই</div>
          <div className="text-[12px] mb-4 text-white/60 max-w-xs">
            ছোট ভিডিও শেয়ার করুন — কাস্টমার আপনার দোকান/পণ্য দেখতে পাবে।
          </div>
          <button onClick={() => setShowComposer(true)}
            className="px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold flex items-center gap-1.5">
            <Plus size={15} /> প্রথম শর্ট পোস্ট করুন
          </button>
        </div>
      )}

      <div ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory">
        {posts.map((p, i) => (
          <section key={p._id} data-idx={i} data-postid={p._id}
            className="relative h-[100dvh] w-full snap-start flex items-center justify-center bg-black">
            {p.videoUrl && (
              <video ref={el => { videoRefs.current[i] = el; }}
                src={p.videoUrl}
                poster={p.thumbnailUrl}
                muted={muted}
                loop
                preload="metadata"
                playsInline
                // eslint-disable-next-line react/no-unknown-property
                webkit-playsinline="true"
                onPlay={() => setPausedIds(prev => ({ ...prev, [p._id]: false }))}
                onPause={() => setPausedIds(prev => ({ ...prev, [p._id]: true }))}
                onClick={e => { const v = e.currentTarget; v.paused ? v.play().catch(() => {}) : v.pause(); }}
                className="absolute inset-0 w-full h-full object-contain" />
            )}
            {pausedIds[p._id] && (
              <button
                onClick={() => {
                  const v = videoRefs.current[i];
                  if (v) { v.muted = true; setMuted(true); v.play().catch(() => {}); }
                }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg">
                  <Play size={28} fill="currentColor" />
                </div>
              </button>
            )}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 pb-14 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <Link href={`/social/profile/${p.authorId}`} className="flex items-center gap-2 mb-2">
                <Avatar name={p.author?.name} image={p.author?.image} size={34} />
                <div>
                  <div className="text-[13.5px] font-semibold">{p.author?.name || 'Unknown'}</div>
                  <div className="text-[11px] text-white/60">{socialTimeAgo(p.createdAt)}</div>
                </div>
              </Link>
              {p.text && <div className="text-[13px] whitespace-pre-wrap max-w-[80%] leading-snug">{p.text}</div>}
            </div>

            <div className="absolute right-2 bottom-24 z-10 flex flex-col gap-4 items-center">
              <button onClick={() => like(p)} title={p.liked ? 'Unlike' : 'Like'} aria-label={p.liked ? 'Unlike' : 'Like'}
                className="flex flex-col items-center">
                <div className={`w-11 h-11 flex items-center justify-center rounded-full bg-black/40 ${p.liked ? 'text-rose-500' : ''}`}>
                  <Heart size={20} fill={p.liked ? 'currentColor' : 'none'} />
                </div>
                <span className="text-[11px] mt-0.5">{p.likeCount || 0}</span>
              </button>
              <Link href={`/social/post/${p._id}`} title="Comments" aria-label="Comments"
                className="flex flex-col items-center">
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40">
                  <MessageCircle size={20} />
                </div>
                <span className="text-[11px] mt-0.5">{p.commentCount || 0}</span>
              </Link>
              <button onClick={() => doShare(p)} title="Share" aria-label="Share"
                className="flex flex-col items-center">
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40">
                  <Share2 size={19} />
                </div>
                <span className="text-[11px] mt-0.5">{p.shareCount || 0}</span>
              </button>
            </div>
          </section>
        ))}
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-black/80 backdrop-blur">
        <ul className="mx-auto max-w-xl grid grid-cols-3">
          <li><Link href="/social" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-white/70">
            <Home size={19} /><span>Feed</span></Link></li>
          <li><Link href="/social/shorts" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-sky-400 font-semibold">
            <VideoIcon size={19} /><span>Shorts</span></Link></li>
          <li><Link href="/social/profile" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-white/70">
            <UserIcon size={19} /><span>Me</span></Link></li>
        </ul>
      </nav>

      {showComposer && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={() => setShowComposer(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center">
              <div className="flex-1 text-[14px] font-semibold">New Short</div>
              <button onClick={() => setShowComposer(false)} className="text-[13px] text-gray-500">Close</button>
            </div>
            <PostComposer defaultKind="short" onCreated={(p) => {
              setShowComposer(false);
              if (p.kind === 'short') setPosts(prev => [p, ...prev]);
              else toast('Uploaded as a regular post');
            }} authorName={user?.name} authorImage={(user as any)?.image} />
          </div>
        </div>
      )}
    </div>
  );
}
