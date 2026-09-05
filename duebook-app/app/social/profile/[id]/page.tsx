'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { social, SocialAuthor, SocialPost } from '@/lib/socialApi';
import SocialShell, { Avatar } from '../../SocialShell';
import PostCard from '../../PostCard';
import { Loader2, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [prof, setProf] = useState<(SocialAuthor & { isFollowing: boolean; coverImage?: string }) | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, list] = await Promise.all([social.profile(id), social.profilePosts(id)]);
      setProf(p);
      setPosts(list);
    } catch { toast.error('Failed to load'); }
  }, [id]);

  useEffect(() => {
    if (user && user._id === id) { router.replace('/social/profile'); return; }
    load();
  }, [id, load, router, user]);

  async function toggleFollow() {
    if (!prof) return;
    setBusy(true);
    try {
      const r = await social.follow(prof._id);
      setProf(p => p ? { ...p, isFollowing: r.following, followerCount: (p.followerCount || 0) + (r.following ? 1 : -1) } : p);
    } catch { toast.error('Failed'); }
    finally { setBusy(false); }
  }

  async function startChat() {
    if (!prof) return;
    try {
      const c = await social.startConversation(prof._id);
      router.push(`/social/messages/${c._id}`);
    } catch { toast.error('Failed'); }
  }

  return (
    <SocialShell title={prof?.name || 'Profile'}>
      {!prof && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={22} /></div>}
      {prof && (
        <>
          <div className="relative">
            <div className="h-32 bg-gradient-to-br from-fuchsia-400 to-orange-400">
              {prof.coverImage && <img src={prof.coverImage} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="px-3 -mt-10">
              <Avatar name={prof.name} image={prof.image} size={80} />
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold truncate">{prof.name}</div>
                  {prof.bio && <div className="text-[13px] mt-1 whitespace-pre-wrap">{prof.bio}</div>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={toggleFollow} disabled={busy}
                    className={`text-[12px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 ${prof.isFollowing ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                    {prof.isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    {prof.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={startChat}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700">
                    <MessageCircle size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-5 text-[13px]">
                <div><span className="font-semibold">{prof.postCount || 0}</span> <span className="text-gray-500">posts</span></div>
                <div><span className="font-semibold">{prof.followerCount || 0}</span> <span className="text-gray-500">followers</span></div>
                <div><span className="font-semibold">{prof.followingCount || 0}</span> <span className="text-gray-500">following</span></div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            {posts.length === 0 && <div className="py-10 text-center text-[12px] text-gray-500">No posts yet</div>}
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
