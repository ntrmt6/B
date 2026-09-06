'use client';

import { useEffect, useState } from 'react';
import { social } from '@/lib/socialApi';
import { useAuth } from '@/context/AuthContext';
import SocialShell from '../SocialShell';
import { Copy, MessageCircle, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvitePage() {
  const { user } = useAuth();
  const [inviteUrl, setInviteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await social.invite('self');
        setInviteUrl(r.inviteUrl);
        setMessage(r.message);
      } catch { toast.error('Failed to build invite'); }
      finally { setLoading(false); }
    })();
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Link copied');
    } catch { toast.error('Copy failed'); }
  }

  async function nativeShare() {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: 'Join DueBook', text: message, url: inviteUrl });
      } else await copyLink();
    } catch {}
  }

  async function sendToPhone() {
    const phone = target.trim().replace(/[^0-9+]/g, '');
    if (!phone) { toast.error('Enter a phone number'); return; }
    const text = encodeURIComponent(message || `Join me on DueBook: ${inviteUrl}`);
    window.open(`https://wa.me/${phone.replace(/^\+/, '')}?text=${text}`, '_blank');
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const smsHref = `sms:?body=${encodeURIComponent(message)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent('Join me on DueBook')}&body=${encodeURIComponent(message)}`;

  return (
    <SocialShell title="Invite friends">
      {loading && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={22} /></div>}
      {!loading && (
        <div className="px-3 py-4 space-y-4">
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="text-[16px] font-bold">কাস্টমারদের DueBook-এ যোগ দিতে বলুন</div>
            <div className="text-[13px] opacity-90 mt-1">
              নিচের ৩টি সহজ ধাপে বন্ধু বা কাস্টমারকে ইনভাইট করুন।
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <div className="text-[13px] font-semibold">লিংক কপি করুন / Copy your invite link</div>
            </div>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteUrl} onClick={e => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-[12.5px] outline-none" />
              <button onClick={copyLink} title="Copy link" aria-label="Copy invite link"
                className="px-3 h-9 flex items-center gap-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[12px] font-semibold">
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <div className="text-[13px] font-semibold">WhatsApp-এ সরাসরি পাঠান</div>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              কাস্টমারের নম্বর লিখুন (দেশের কোডসহ, যেমন +8801XXXXXXXXX)
            </p>
            <div className="flex gap-2">
              <input value={target} onChange={e => setTarget(e.target.value)}
                placeholder="+8801XXXXXXXXX" inputMode="tel"
                className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-[13px] outline-none" />
              <button onClick={sendToPhone}
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold flex items-center gap-1">
                <Send size={13} /> Send
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <div className="text-[13px] font-semibold">অথবা অন্য মাধ্যমে শেয়ার করুন</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={whatsappHref} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[13px] font-medium">
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a href={smsHref}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 text-[13px] font-medium">
                SMS
              </a>
              <a href={mailHref}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-[13px] font-medium">
                Email
              </a>
              <button onClick={nativeShare}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 text-[13px] font-medium">
                More…
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Message preview</div>
            <div className="text-[13px] text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{message}</div>
          </div>
        </div>
      )}
    </SocialShell>
  );
}
