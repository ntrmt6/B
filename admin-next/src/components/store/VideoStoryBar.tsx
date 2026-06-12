import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoStory, Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { getYouTubeId } from '../../utils/videoUrlHelper';

/* ─── Video URL helpers ───────────────────────────────────────────── */

type VideoSource = { type: 'youtube'; embedUrl: string } | { type: 'facebook'; embedUrl: string } | { type: 'instagram'; embedUrl: string } | { type: 'direct'; url: string };

/** Classify a video URL and return the appropriate embed info */
function parseVideoUrl(url: string): VideoSource {
  if (!url) return { type: 'direct', url };

  // YouTube
  const ytId = getYouTubeId(url);
  if (ytId) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1` };

  // Facebook video
  if (/facebook\.com|fb\.watch/i.test(url)) {
    return { type: 'facebook', embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true&muted=true` };
  }

  // Instagram reel / post
  if (/instagram\.com\/(reel|p|tv)\//i.test(url)) {
    const clean = url.split('?')[0].replace(/\/$/, '');
    return { type: 'instagram', embedUrl: `${clean}/embed/` };
  }

  return { type: 'direct', url };
}

interface VideoStoryBarProps {
  tenantId?: string;
  products?: Product[];
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

/** Horizontal scrollable circle bar for Video Stories (Instagram-style). */
export const VideoStoryBar: React.FC<VideoStoryBarProps> = ({
  tenantId,
  products = [],
  onProductClick,
  onAddToCart,
}) => {
  const [stories, setStories] = useState<VideoStory[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/stories/${tenantId}`)
      .then(r => (r.ok ? r.json() : []))
      .then((data: VideoStory[]) => setStories(data))
      .catch(() => {});
  }, [tenantId]);

  if (stories.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const linkedProduct = (story: VideoStory) =>
    story.productId ? products.find(p => p.id === story.productId) : undefined;

  return (
    <>
      {/* Story Circles Bar */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-3 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setActiveIndex(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1 group/item"
            >
              {/* Circle with gradient ring */}
              <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  {story.thumbnailUrl ? (
                    <img
                      src={normalizeImageUrl(story.thumbnailUrl)}
                      alt={story.title}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <Play size={20} className="text-slate-400" />
                    </div>
                  )}
                </div>
                {/* Play badge */}
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                    <Play size={8} className="text-white ml-[1px]" fill="white" />
                  </div>
                </div>
              </div>
              {/* Label */}
              <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate max-w-[64px] sm:max-w-[72px] text-center leading-tight">
                {story.title}
              </span>
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Full-screen Story Player Overlay */}
      {activeIndex !== null && (
        <VideoStoryPlayer
          stories={stories}
          startIndex={activeIndex}
          products={products}
          onClose={() => setActiveIndex(null)}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
};

/* ─────────────────── StoryMedia — renders video or embed ─────────────────── */

const StoryMedia: React.FC<{
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnded: () => void;
}> = ({ videoUrl, videoRef, onEnded }) => {
  const source = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  if (source.type === 'youtube' || source.type === 'facebook' || source.type === 'instagram') {
    return (
      <iframe
        src={source.embedUrl}
        title="Embedded video player"
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
      />
    );
  }

  // Direct video file
  return (
    <video
      ref={videoRef}
      src={source.url}
      className="w-full h-full object-contain"
      autoPlay
      muted
      playsInline
      onEnded={onEnded}
    />
  );
};

/* ──────────────────────────── Full-Screen Player ──────────────────────────── */

interface VideoStoryPlayerProps {
  stories: VideoStory[];
  startIndex: number;
  products: Product[];
  onClose: () => void;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const VideoStoryPlayer: React.FC<VideoStoryPlayerProps> = ({
  stories,
  startIndex,
  products,
  onClose,
  onProductClick,
  onAddToCart,
}) => {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [showProductCard, setShowProductCard] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const story = stories[index];
  const product = story?.productId ? products.find(p => p.id === story.productId) : undefined;

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex(prev => prev + 1);
      setProgress(0);
      setShowProductCard(false);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      setProgress(0);
      setShowProductCard(false);
    }
  }, [index]);

  // Progress bar timer
  useEffect(() => {
    setProgress(0);
    const duration = (story?.duration || 30) * 1000;
    const interval = 50;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        goNext();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, story?.duration, goNext]);

  // Reset video on story change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-3">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                transition: i === index ? 'width 50ms linear' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 p-[2px]">
            {story.thumbnailUrl ? (
              <img src={normalizeImageUrl(story.thumbnailUrl)} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-black/50" />
            )}
          </div>
          <span className="text-white text-sm font-semibold">{story.title}</span>
        </div>
        <button onClick={onClose} className="text-white text-2xl leading-none p-1" aria-label="Close">
          ✕
        </button>
      </div>

      {/* Touch / Click navigation zones */}
      <div className="absolute inset-0 z-10 flex">
        <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full cursor-pointer" onClick={goNext} />
      </div>

      {/* Video / Embed */}
      <StoryMedia videoUrl={story.videoUrl} videoRef={videoRef} onEnded={goNext} />

      {/* View Product Button */}
      {product && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
          {!showProductCard ? (
            <button
              onClick={() => setShowProductCard(true)}
              className="bg-white/95 backdrop-blur text-slate-900 rounded-full px-6 py-3 font-bold text-sm shadow-2xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Play size={16} fill="currentColor" /> View Product
            </button>
          ) : (
            <MiniProductCard
              product={product}
              onClose={() => setShowProductCard(false)}
              onViewDetails={() => { onClose(); onProductClick?.(product); }}
              onAddToCart={() => onAddToCart?.(product)}
            />
          )}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────── Mini Product Card ────────────────────────── */

interface MiniProductCardProps {
  product: Product;
  onClose: () => void;
  onViewDetails: () => void;
  onAddToCart: () => void;
}

const MiniProductCard: React.FC<MiniProductCardProps> = ({ product, onClose, onViewDetails, onAddToCart }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 animate-in slide-in-from-bottom">
      {/* Close */}
      <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-lg">✕</button>

      <div className="flex gap-3">
        {/* Image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
          <img
            src={normalizeImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
          <p className="text-lg font-black text-slate-900 mt-0.5">
            ৳ {product.price?.toLocaleString()}
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through ml-2">৳ {product.originalPrice.toLocaleString()}</span>
            )}
          </p>
        </div>
      </div>

      {/* Variant selectors */}
      <div className="mt-3 space-y-2">
        {product.colors && product.colors.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {product.colors.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                  selectedColor === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {product.sizes && product.sizes.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {product.sizes.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                  selectedSize === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAddToCart}
          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold active:scale-95 transition-transform"
        >
          Add to Cart
        </button>
        <button
          onClick={onViewDetails}
          className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition-transform"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default VideoStoryBar;
