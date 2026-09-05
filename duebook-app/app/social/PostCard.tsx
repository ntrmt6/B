'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { social, socialTimeAgo, SocialPost, SocialComment } from '@/lib/socialApi';
import { Avatar } from './SocialShell';

interface Props {
  post: SocialPost;
  currentUserId?: string | null;
  onDelete?: (id: string) => void;
  onChange?: (post: SocialPost) => void;
}

export default function PostCard({ post, currentUserId, onDelete, onChange }: Props) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const canDelete = currentUserId && String(currentUserId) === String(post.authorId);

  async function toggleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(c => c + (prevLiked ? -1 : 1));
    try {
      const r = await social.like(post._id);
      setLiked(r.liked);
      setLikeCount(r.likeCount);
      onChange?.({ ...post, liked: r.liked, likeCount: r.likeCount });
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('Failed');
    }
  }

  async function loadComments() {
    setLoadingComments(true);
    try {
      const list = await social.comments(post._id);
      setComments(list);
    } catch { toast.error('Failed to load comments'); }
    finally { setLoadingComments(false); }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) await loadComments();
  }

  async function submitComment() {
    const text = newComment.trim();
    if (!text) return;
    try {
      const c = await social.addComment(post._id, text);
      setComments(list => [...list, c]);
      setNewComment('');
      onChange?.({ ...post, commentCount: post.commentCount + 1 });
    } catch { toast.error('Failed'); }
  }

  async function submitReply(parentId: string) {
    const text = replyText.trim();
    if (!text) return;
    try {
      const c = await social.addComment(post._id, text, parentId);
      setComments(list => [...list, c]);
      setReplyText('');
      setReplyTo(null);
      onChange?.({ ...post, commentCount: post.commentCount + 1 });
    } catch { toast.error('Failed'); }
  }

  async function removeComment(id: string) {
    try {
      await social.deleteComment(id);
      setComments(list => list.filter(c => c._id !== id));
      onChange?.({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
    } catch { toast.error('Failed'); }
  }

  async function doShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/social/post/${post._id}` : '';
    const shareData = { title: 'DueBook post', text: post.text?.slice(0, 100) || '', url };
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
      const r = await social.share(post._id);
      onChange?.({ ...post, shareCount: r.shareCount });
    } catch { /* user cancel */ }
  }

  async function doDelete() {
    if (!confirm('Delete this post?')) return;
    try {
      await social.deletePost(post._id);
      onDelete?.(post._id);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  }

  const roots = comments.filter(c => !c.parentId);
  const repliesOf = (id: string) => comments.filter(c => c.parentId === id);

  return (
    <article className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
      <header className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <Link href={`/social/profile/${post.authorId}`}>
          <Avatar name={post.author?.name} image={post.author?.image} size={38} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/social/profile/${post.authorId}`} className="block text-[13.5px] font-semibold truncate">
            {post.author?.name || 'Unknown'}
          </Link>
          <div className="text-[11px] text-gray-500 dark:text-slate-400">{socialTimeAgo(post.createdAt)}</div>
        </div>
        {canDelete && (
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
              <MoreHorizontal size={17} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 z-20 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-[13px]">
                <button onClick={doDelete} className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {post.text && (
        <div className="px-3 pb-2 text-[14px] whitespace-pre-wrap break-words">{post.text}</div>
      )}

      {post.images.length > 0 && (
        <div className={`grid gap-0.5 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" className="w-full max-h-[420px] object-cover bg-gray-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {post.videoUrl && post.kind === 'post' && (
        <video src={post.videoUrl} poster={post.thumbnailUrl} controls playsInline className="w-full max-h-[500px] bg-black" />
      )}

      <div className="px-2 py-1.5 flex items-center gap-1 text-gray-600 dark:text-slate-300">
        <button onClick={toggleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium ${liked ? 'text-rose-500' : ''} hover:bg-gray-100 dark:hover:bg-slate-800`}>
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount || ''}</span>
        </button>
        <button onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-slate-800">
          <MessageCircle size={17} />
          <span>{post.commentCount || ''}</span>
        </button>
        <button onClick={doShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-slate-800">
          <Share2 size={16} />
          <span>{post.shareCount || ''}</span>
        </button>
      </div>

      {showComments && (
        <div className="px-3 pb-3 border-t border-gray-100 dark:border-slate-800">
          {loadingComments && <div className="py-3 text-center text-[12px] text-gray-500 dark:text-slate-400">Loading…</div>}
          {!loadingComments && roots.length === 0 && (
            <div className="py-3 text-center text-[12px] text-gray-500 dark:text-slate-400">No comments yet</div>
          )}
          <ul className="space-y-2 mt-2">
            {roots.map(c => (
              <li key={c._id}>
                <div className="flex gap-2">
                  <Avatar name={c.author?.name} image={c.author?.image} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5">
                      <div className="text-[12px] font-semibold">{c.author?.name || 'Unknown'}</div>
                      <div className="text-[13px] whitespace-pre-wrap break-words">{c.text}</div>
                    </div>
                    <div className="flex gap-3 text-[11px] text-gray-500 dark:text-slate-400 px-3 mt-0.5">
                      <span>{socialTimeAgo(c.createdAt)}</span>
                      <button onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}>Reply</button>
                      {currentUserId && String(currentUserId) === String(c.authorId) && (
                        <button onClick={() => removeComment(c._id)} className="text-red-500">Delete</button>
                      )}
                    </div>
                    {repliesOf(c._id).length > 0 && (
                      <ul className="mt-1 pl-3 space-y-1.5 border-l-2 border-gray-100 dark:border-slate-800">
                        {repliesOf(c._id).map(r => (
                          <li key={r._id} className="flex gap-2">
                            <Avatar name={r.author?.name} image={r.author?.image} size={26} />
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5">
                                <div className="text-[12px] font-semibold">{r.author?.name || 'Unknown'}</div>
                                <div className="text-[13px] whitespace-pre-wrap break-words">{r.text}</div>
                              </div>
                              <div className="flex gap-3 text-[11px] text-gray-500 dark:text-slate-400 px-3 mt-0.5">
                                <span>{socialTimeAgo(r.createdAt)}</span>
                                {currentUserId && String(currentUserId) === String(r.authorId) && (
                                  <button onClick={() => removeComment(r._id)} className="text-red-500">Delete</button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {replyTo === c._id && (
                      <div className="mt-2 flex gap-2">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)}
                          placeholder="Write a reply…"
                          className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full px-3 py-1.5 text-[13px] outline-none" />
                        <button onClick={() => submitReply(c._id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 text-white">
                          <Send size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
              placeholder="Write a comment…"
              className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full px-3 py-2 text-[13px] outline-none" />
            <button onClick={submitComment}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 text-white">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
