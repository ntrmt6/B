import type { Metadata } from 'next';
import PostDetailClient from './PostDetailClient';

const SITE_URL = 'https://duebook.shopbdit.com';
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.shopbdit.com').replace(/\/$/, '').replace(/\/api$/, '');

interface FetchedPost {
  _id: string;
  text?: string;
  images?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  kind?: 'post' | 'short';
  author?: { name?: string; image?: string } | null;
}

// Convert `/uploads/social/foo.jpg` (or already-absolute URLs) to absolute
// URLs on the DueBook origin, since crawlers won't run through the Next.js
// rewrite and OG tags require absolute src.
function absoluteMedia(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

async function fetchPost(id: string): Promise<FetchedPost | null> {
  try {
    const res = await fetch(`${API_BASE}/api/duebook/social/posts/${encodeURIComponent(id)}`, {
      // Cache briefly so link previewers don't hammer the backend but shares
      // still reflect edits within a minute.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as FetchedPost;
  } catch {
    return null;
  }
}

function excerpt(s: string | undefined, n: number) {
  if (!s) return '';
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n - 1) + '…' : clean;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPost(id);
  const url = `${SITE_URL}/social/post/${id}`;

  if (!post) {
    return {
      title: 'DueBook Social post',
      description: 'Open in DueBook to view this post.',
      openGraph: { url, siteName: 'DueBook Social' },
      alternates: { canonical: url },
    };
  }

  const authorName = post.author?.name || 'DueBook user';
  const isVideo = !!post.videoUrl;
  const bodyText = excerpt(post.text, 200);
  const title = excerpt(post.text, 80) || (isVideo ? `${authorName} shared a video` : `${authorName} posted on DueBook`);
  const description = bodyText || `${authorName} on DueBook Social — বাংলাদেশি দোকানদারদের কমিউনিটি।`;

  // Preview image priority: explicit thumbnail → first image → generic OG.
  const previewImage =
    absoluteMedia(post.thumbnailUrl) ||
    absoluteMedia(post.images?.[0]) ||
    `${SITE_URL}/opengraph-image`;
  const videoAbs = absoluteMedia(post.videoUrl);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: isVideo ? 'video.other' : 'article',
      siteName: 'DueBook Social',
      url,
      title,
      description,
      images: previewImage ? [{ url: previewImage, width: 1200, height: 630, alt: title }] : undefined,
      videos: videoAbs ? [{ url: videoAbs, secureUrl: videoAbs, type: 'video/mp4' }] : undefined,
    },
    twitter: {
      card: isVideo ? 'player' : 'summary_large_image',
      title,
      description,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
