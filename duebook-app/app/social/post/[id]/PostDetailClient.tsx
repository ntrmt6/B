'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SocialPost } from '@/lib/socialApi';
import { useAuth } from '@/context/AuthContext';
import SocialShell from '../../SocialShell';
import PostCard from '../../PostCard';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<SocialPost>(`/duebook/social/posts/${id}`);
      setPost(r.data);
    } catch { toast.error('Not found'); router.push('/social'); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  return (
    <SocialShell title="Post" back="/social">
      {loading && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={22} /></div>}
      {post && (
        <PostCard post={post} currentUserId={user?._id}
          onDelete={() => router.push('/social')}
          onChange={p => setPost(prev => prev ? { ...prev, ...p } : prev)} />
      )}
    </SocialShell>
  );
}
