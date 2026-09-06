'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { social, SocialConversation, socialTimeAgo, SocialAuthor } from '@/lib/socialApi';
import SocialShell, { Avatar } from '../SocialShell';
import { Loader2, Search, X, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const [convos, setConvos] = useState<SocialConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<(SocialAuthor & { isFollowing: boolean })[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setConvos(await social.conversations()); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showNew) return;
    let cancel = false;
    setSearching(true);
    (async () => {
      try {
        const list = await social.people(q);
        if (!cancel) setPeople(list);
      } catch {}
      finally { if (!cancel) setSearching(false); }
    })();
    return () => { cancel = true; };
  }, [q, showNew]);

  async function startWith(userId: string) {
    try {
      const c = await social.startConversation(userId);
      setShowNew(false);
      window.location.href = `/social/messages/${c._id}`;
    } catch { toast.error('Failed'); }
  }

  return (
    <SocialShell
      title="Messages"
      right={
        <button onClick={() => setShowNew(true)}
          title="Start a new chat / নতুন চ্যাট শুরু করুন" aria-label="Start a new chat"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
          <MessageSquarePlus size={17} />
        </button>
      }
    >
      {loading && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={22} /></div>}
      {!loading && convos.length === 0 && (
        <div className="py-14 px-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
            <MessageSquarePlus size={22} className="text-sky-500" />
          </div>
          <div className="text-[14px] font-semibold text-gray-700 dark:text-slate-200">এখনো কোনো চ্যাট নেই</div>
          <div className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 mb-4">
            No conversations yet — কাস্টমার বা বিক্রেতার সাথে সরাসরি কথা বলুন।
          </div>
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[13px] font-semibold">
            <MessageSquarePlus size={14} /> নতুন চ্যাট শুরু করুন
          </button>
        </div>
      )}
      <ul className="divide-y divide-gray-100 dark:divide-slate-800">
        {convos.map(c => (
          <li key={c._id}>
            <Link href={`/social/messages/${c._id}`}
              className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50">
              <Avatar name={c.other?.name} image={c.other?.image} size={42} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-semibold truncate flex-1">{c.other?.name || 'Unknown'}</div>
                  <div className="text-[11px] text-gray-400">{socialTimeAgo(c.lastMessageAt || c.updatedAt)}</div>
                </div>
                <div className="text-[12.5px] text-gray-500 dark:text-slate-400 truncate">
                  {c.lastFromMe ? 'You: ' : ''}{c.lastMessage || 'Start the conversation'}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center">
              <div className="flex-1 text-[14px] font-semibold">New Chat</div>
              <button onClick={() => setShowNew(false)}><X size={17} /></button>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-full px-3 py-2">
                <Search size={15} className="text-gray-500" />
                <input value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search people…" autoFocus
                  className="flex-1 bg-transparent outline-none text-[13px]" />
              </div>
              <div className="mt-3 max-h-[60vh] overflow-y-auto">
                {searching && <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin text-sky-500" /></div>}
                {!searching && people.length === 0 && <div className="py-6 text-center text-[12px] text-gray-500">No one found</div>}
                <ul>
                  {people.map(p => (
                    <li key={p._id}>
                      <button onClick={() => startWith(p._id)}
                        className="w-full flex items-center gap-2.5 py-2 px-1 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-left">
                        <Avatar name={p.name} image={p.image} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold truncate">{p.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">{p.bio || `${p.followerCount || 0} followers`}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </SocialShell>
  );
}
