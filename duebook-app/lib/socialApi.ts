import api from '@/lib/api';

export interface SocialAuthor {
  _id: string;
  name: string;
  image?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
}

export interface SocialPost {
  _id: string;
  authorId: string;
  kind: 'post' | 'short';
  text?: string;
  images: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  author?: SocialAuthor | null;
  liked?: boolean;
}

export interface SocialComment {
  _id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  text: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author?: SocialAuthor | null;
}

export interface SocialConversation {
  _id: string;
  other: SocialAuthor | null;
  lastMessage?: string;
  lastMessageAt?: string;
  lastFromMe?: boolean;
  updatedAt: string;
}

export interface SocialMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  fromMe?: boolean;
  createdAt: string;
}

export interface MyProfile extends SocialAuthor {
  email: string;
  phone?: string;
  address?: string;
  coverImage?: string;
}

const base = '/duebook/social';

export const social = {
  feed: (opts: { kind?: 'post' | 'short'; before?: string; limit?: number } = {}) =>
    api.get<SocialPost[]>(`${base}/feed`, { params: opts }).then(r => r.data),

  createPost: (body: { kind?: 'post' | 'short'; text?: string; images?: string[]; videoUrl?: string; thumbnailUrl?: string; }) =>
    api.post<SocialPost>(`${base}/posts`, body).then(r => r.data),

  deletePost: (id: string) => api.delete(`${base}/posts/${id}`).then(r => r.data),

  like: (postId: string) =>
    api.post<{ liked: boolean; likeCount: number }>(`${base}/posts/${postId}/like`).then(r => r.data),

  share: (postId: string) =>
    api.post<{ shareCount: number }>(`${base}/posts/${postId}/share`).then(r => r.data),

  comments: (postId: string) =>
    api.get<SocialComment[]>(`${base}/posts/${postId}/comments`).then(r => r.data),

  addComment: (postId: string, text: string, parentId?: string) =>
    api.post<SocialComment>(`${base}/posts/${postId}/comments`, { text, parentId }).then(r => r.data),

  deleteComment: (id: string) => api.delete(`${base}/comments/${id}`).then(r => r.data),

  myProfile: () => api.get<MyProfile>(`${base}/profile/me`).then(r => r.data),

  updateProfile: (body: Partial<MyProfile>) =>
    api.put<MyProfile>(`${base}/profile/me`, body).then(r => r.data),

  profile: (id: string) =>
    api.get<SocialAuthor & { isFollowing: boolean; coverImage?: string }>(`${base}/profile/${id}`).then(r => r.data),

  profilePosts: (id: string) =>
    api.get<SocialPost[]>(`${base}/profile/${id}/posts`).then(r => r.data),

  follow: (id: string) =>
    api.post<{ following: boolean }>(`${base}/profile/${id}/follow`).then(r => r.data),

  people: (q?: string) =>
    api.get<(SocialAuthor & { isFollowing: boolean })[]>(`${base}/people`, { params: q ? { q } : {} }).then(r => r.data),

  conversations: () => api.get<SocialConversation[]>(`${base}/conversations`).then(r => r.data),

  startConversation: (userId: string) =>
    api.post<SocialConversation>(`${base}/conversations`, { userId }).then(r => r.data),

  messages: (convoId: string) =>
    api.get<SocialMessage[]>(`${base}/conversations/${convoId}/messages`).then(r => r.data),

  sendMessage: (convoId: string, text: string, imageUrl?: string) =>
    api.post<SocialMessage>(`${base}/conversations/${convoId}/messages`, { text, imageUrl }).then(r => r.data),

  invite: (to: string) =>
    api.post<{ ok: boolean; inviteUrl: string; message: string }>(`${base}/invite`, { to }).then(r => r.data),

  uploadMedia: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await api.post<{ url: string; mimeType: string; size: number }>(`${base}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data;
  },
};

export function socialTimeAgo(iso?: string) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(mo / 12);
  return `${y}y`;
}
