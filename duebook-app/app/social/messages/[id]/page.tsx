'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { social, SocialMessage, SocialConversation, socialTimeAgo } from '@/lib/socialApi';
import SocialShell, { Avatar } from '../../SocialShell';
import { Send, Loader2, ChevronLeft, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [convo, setConvo] = useState<SocialConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [convos, msgs] = await Promise.all([social.conversations(), social.messages(id)]);
      setConvo(convos.find(c => c._id === id) || null);
      setMessages(msgs);
    } catch { toast.error('Failed to load'); router.push('/social/messages'); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const m = await social.sendMessage(id, t);
      setMessages(list => [...list, m]);
      setText('');
    } catch { toast.error('Failed'); }
    finally { setSending(false); }
  }

  async function sendImage(file: File) {
    try {
      const up = await social.uploadMedia(file);
      const m = await social.sendMessage(id, '', up.url);
      setMessages(list => [...list, m]);
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="mx-auto max-w-xl px-3 py-2.5 flex items-center gap-2">
          <button onClick={() => router.push('/social/messages')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <ChevronLeft size={18} />
          </button>
          {convo?.other && (
            <Link href={`/social/profile/${convo.other._id}`} className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar name={convo.other.name} image={convo.other.image} size={34} />
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold truncate">{convo.other.name}</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400">DueBook member</div>
              </div>
            </Link>
          )}
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto mx-auto max-w-xl w-full px-3 py-3 space-y-2">
        {loading && <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-sky-500" /></div>}
        {!loading && messages.length === 0 && (
          <div className="text-center text-[12px] text-gray-500 py-16">Say hi 👋</div>
        )}
        {messages.map(m => (
          <div key={m._id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${m.fromMe ? 'bg-sky-500 text-white' : 'bg-white dark:bg-slate-800'} rounded-2xl px-3 py-2 shadow-sm`}>
              {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded-lg mb-1 max-h-64 object-cover" />}
              {m.text && <div className="text-[13.5px] whitespace-pre-wrap break-words">{m.text}</div>}
              <div className={`text-[10px] mt-1 ${m.fromMe ? 'text-white/70' : 'text-gray-400'}`}>{socialTimeAgo(m.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200 dark:border-slate-800">
        <div className="mx-auto max-w-xl px-3 py-2 flex items-center gap-2">
          <input ref={imgRef} type="file" accept="image/*" hidden
            onChange={e => e.target.files?.[0] && sendImage(e.target.files[0])} />
          <button onClick={() => imgRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-emerald-600">
            <ImagePlus size={17} />
          </button>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message…"
            className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full px-4 py-2 text-[13.5px] outline-none" />
          <button onClick={send} disabled={sending || !text.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 disabled:opacity-40 text-white">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
