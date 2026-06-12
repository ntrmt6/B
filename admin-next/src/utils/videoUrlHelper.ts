/**
 * Shared helpers for parsing video URLs from YouTube, Facebook, Instagram, etc.
 */

/** Extract YouTube video ID from various URL formats */
export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** Get a YouTube thumbnail URL from a video ID */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
