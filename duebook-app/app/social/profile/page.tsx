'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { social, MyProfile, SocialPost } from '@/lib/socialApi';
import { useAuth } from '@/context/AuthContext';
import SocialShell, { Avatar } from '../SocialShell';
import PostCard from '../PostCard';
import { LogOut, Camera, Pencil, Loader2, Users, MessageCircle, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const avRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const p = await social.myProfile();
      setProfile(p);
      setForm({ name: p.name, bio: p.bio || '', phone: p.phone || '', address: p.address || '' });
      const mine = await social.profilePosts(p._id);
      setPosts(mine);
    } catch { toast.error('Failed to load'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const p = await social.updateProfile({
        name: form.name.trim() || undefined,
        bio: form.bio,
        phone: form.phone,
        address: form.address,
      });
      setProfile(p);
      setEditing(false);
      toast.success('Saved');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  }

  async function pickAvatar(file: File) {
    try {
      const up = await social.uploadMedia(file);
      const p = await social.updateProfile({ image: up.url });
      setProfile(p);
      toast.success('Avatar updated');
    } catch { toast.error('Failed'); }
  }

  async function pickCover(file: File) {
    try {
      const up = await social.uploadMedia(file);
      const p = await social.updateProfile({ coverImage: up.url });
      setProfile(p);
      toast.success('Cover updated');
    } catch { toast.error('Failed'); }
  }

  return (
    <SocialShell
      title="My Profile"
      right={
        <button onClick={() => { logout(); router.push('/login'); }}
          title="Log out / লগ আউট" aria-label="Log out"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
          <LogOut size={16} />
        </button>
      }
    >
      {!profile && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={22} /></div>}
      {profile && (
        <>
          <div className="relative">
            <div className="h-32 bg-gradient-to-br from-sky-400 to-indigo-500 relative">
              {profile.coverImage && <img src={profile.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <button onClick={() => cvRef.current?.click()}
                title="Change cover photo / কভার ছবি বদলান" aria-label="Change cover photo"
                className="absolute right-2 bottom-2 h-8 px-2.5 flex items-center gap-1 rounded-full bg-black/60 hover:bg-black/70 text-white text-[11px] font-semibold">
                <Camera size={13} /> Cover
              </button>
              <input ref={cvRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && pickCover(e.target.files[0])} />
            </div>
            <div className="px-3 -mt-10">
              <div className="relative w-20 h-20">
                <Avatar name={profile.name} image={profile.image} size={80} />
                <button onClick={() => avRef.current?.click()}
                  title="Change profile photo / প্রোফাইল ছবি বদলান" aria-label="Change profile photo"
                  className="absolute -right-1 -bottom-1 w-7 h-7 flex items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 text-white ring-2 ring-white dark:ring-slate-900">
                  <Camera size={12} />
                </button>
                <input ref={avRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && pickAvatar(e.target.files[0])} />
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold truncate">{profile.name}</div>
                  <div className="text-[12px] text-gray-500 truncate">{profile.email}</div>
                  {profile.bio && !editing && <div className="text-[13px] mt-1 whitespace-pre-wrap">{profile.bio}</div>}
                </div>
                <button onClick={() => setEditing(v => !v)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing && (
                <div className="mt-3 space-y-2 bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] outline-none" />
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Bio (up to 500 chars)" rows={3} maxLength={500}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] outline-none resize-none" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] outline-none" />
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] outline-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(false)}
                      className="px-4 py-1.5 text-[13px] rounded-full border border-gray-300 dark:border-slate-700">Cancel</button>
                    <button onClick={save} disabled={saving}
                      className="px-4 py-1.5 text-[13px] rounded-full bg-sky-500 hover:bg-sky-600 text-white font-semibold disabled:opacity-50 flex items-center gap-1">
                      <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-5 text-[13px]">
                <div><span className="font-semibold">{profile.postCount || 0}</span> <span className="text-gray-500">posts</span></div>
                <div><span className="font-semibold">{profile.followerCount || 0}</span> <span className="text-gray-500">followers</span></div>
                <div><span className="font-semibold">{profile.followingCount || 0}</span> <span className="text-gray-500">following</span></div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="px-3 pb-2 text-[13px] font-semibold text-gray-500 dark:text-slate-400">Posts</div>
            {posts.length === 0 && (
              <div className="py-8 px-6 text-center text-[12px] text-gray-500 dark:text-slate-400">
                এখনো কোনো পোস্ট নেই — Feed-এ গিয়ে আপনার প্রথম পোস্ট তৈরি করুন।
              </div>
            )}
            {posts.map(p => (
              <PostCard key={p._id} post={p} currentUserId={user?._id}
                onDelete={id => setPosts(list => list.filter(p => p._id !== id))} />
            ))}
          </div>
        </>
      )}
    </SocialShell>
  );
}
