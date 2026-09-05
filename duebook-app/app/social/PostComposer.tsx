'use client';

import { useRef, useState } from 'react';
import { X, ImagePlus, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { social, SocialPost } from '@/lib/socialApi';
import { Avatar } from './SocialShell';

interface Props {
  onCreated: (post: SocialPost) => void;
  authorName?: string;
  authorImage?: string;
  defaultKind?: 'post' | 'short';
  compact?: boolean;
}

export default function PostComposer({ onCreated, authorName, authorImage, defaultKind = 'post', compact }: Props) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [kind, setKind] = useState<'post' | 'short'>(defaultKind);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  async function uploadImage(f: File) {
    setUploading(true);
    try {
      const r = await social.uploadMedia(f);
      setImages(prev => [...prev, r.url].slice(0, 6));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function uploadVideo(f: File) {
    setUploading(true);
    try {
      const r = await social.uploadMedia(f);
      setVideoUrl(r.url);
      if (kind !== 'short') setKind('short');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function submit() {
    const t = text.trim();
    if (!t && !images.length && !videoUrl) { toast.error('Say something first'); return; }
    setPosting(true);
    try {
      const p = await social.createPost({
        kind: videoUrl && kind === 'short' ? 'short' : 'post',
        text: t || undefined,
        images,
        videoUrl: videoUrl || undefined,
      });
      onCreated(p);
      setText(''); setImages([]); setVideoUrl('');
      toast.success('Posted');
    } catch { toast.error('Failed'); }
    finally { setPosting(false); }
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex gap-2.5">
        <Avatar name={authorName} image={authorImage} size={compact ? 34 : 40} />
        <div className="flex-1">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder={kind === 'short' ? 'Add a caption…' : "What's happening in your shop?"}
            className="w-full min-h-[52px] bg-transparent outline-none resize-none text-[14px] placeholder:text-gray-400"
            maxLength={5000} />
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button onClick={() => setImages(list => list.filter((_, ii) => ii !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-black/70 text-white rounded-full">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {videoUrl && (
            <div className="mt-2 relative w-40">
              <video src={videoUrl} className="w-40 rounded-lg" muted playsInline />
              <button onClick={() => setVideoUrl('')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-black/70 text-white rounded-full">
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <input ref={imgRef} type="file" accept="image/*" hidden
          onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
        <input ref={vidRef} type="file" accept="video/*" hidden
          onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
        <button onClick={() => imgRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
          <ImagePlus size={16} /> Photo
        </button>
        <button onClick={() => vidRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40">
          <Video size={16} /> {kind === 'short' ? 'Short' : 'Video'}
        </button>
        {uploading && <Loader2 size={14} className="animate-spin text-gray-400" />}
        <div className="flex-1" />
        <button onClick={submit} disabled={posting}
          className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-[13px] font-semibold">
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
