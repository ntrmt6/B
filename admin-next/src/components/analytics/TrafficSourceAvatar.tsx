import React, { useState } from 'react';

interface SourceConfig {
  color: string;
  bgColor: string;
  icon?: string;
  image?: string;
}

const ICON_SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

const SOURCE_IMAGE_ASSETS = {
  facebook: 'https://hdnfltv.com/image/nitimages/fb-icon.webp',
  google: 'https://hdnfltv.com/image/nitimages/google-icon.webp',
  other: 'https://hdnfltv.com/image/nitimages/other.webp',
  link: 'https://hdnfltv.com/image/nitimages/Link-icon.webp',
};

const SOURCE_CONFIG: Record<string, SourceConfig> = {
  Direct: { color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.12)', image: SOURCE_IMAGE_ASSETS.link, icon: '🔗' },
  'Google Search': { color: '#4285F4', bgColor: 'rgba(66, 133, 244, 0.12)', image: SOURCE_IMAGE_ASSETS.google, icon: '🔍' },
  Facebook: { color: '#1877F2', bgColor: 'rgba(24, 119, 242, 0.12)', image: SOURCE_IMAGE_ASSETS.facebook, icon: '📘' },
  Instagram: { color: '#E4405F', bgColor: 'rgba(228, 64, 95, 0.1)', icon: '📷' },
  YouTube: { color: '#FF0000', bgColor: 'rgba(255, 0, 0, 0.1)', icon: '▶️' },
  'Twitter/X': { color: '#1DA1F2', bgColor: 'rgba(29, 161, 242, 0.1)', icon: '🐦' },
  TikTok: { color: '#000000', bgColor: 'rgba(0, 0, 0, 0.08)', icon: '🎵' },
  LinkedIn: { color: '#0A66C2', bgColor: 'rgba(10, 102, 194, 0.1)', icon: '💼' },
  Pinterest: { color: '#E60023', bgColor: 'rgba(230, 0, 35, 0.1)', icon: '📌' },
  WhatsApp: { color: '#25D366', bgColor: 'rgba(37, 211, 102, 0.1)', icon: '💬' },
  Telegram: { color: '#0088CC', bgColor: 'rgba(0, 136, 204, 0.1)', icon: '✈️' },
  Reddit: { color: '#FF4500', bgColor: 'rgba(255, 69, 0, 0.1)', icon: '🔴' },
  Bing: { color: '#008373', bgColor: 'rgba(0, 131, 115, 0.1)', icon: '🔎' },
  Yahoo: { color: '#6001D2', bgColor: 'rgba(96, 1, 210, 0.1)', icon: '🟣' },
  Baidu: { color: '#2932E1', bgColor: 'rgba(41, 50, 225, 0.1)', icon: '🔵' },
  Other: { color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.12)', image: SOURCE_IMAGE_ASSETS.other, icon: '🌐' },
};

export const resolveSourceKey = (name: string) => {
  const normalized = name.toLowerCase();

  if (normalized.includes('facebook')) return 'Facebook';
  if (normalized.includes('google')) return 'Google Search';
  if (normalized.includes('direct') || normalized.includes('link')) return 'Direct';
  if (normalized.includes('other')) return 'Other';

  return name;
};

export const getSourceConfig = (name: string) => SOURCE_CONFIG[resolveSourceKey(name)] || SOURCE_CONFIG.Other;

interface TrafficSourceAvatarProps {
  source: string;
  size?: keyof typeof ICON_SIZE_CLASSES;
}

export const TrafficSourceAvatar: React.FC<TrafficSourceAvatarProps> = ({ source, size = 'md' }) => {
  const config = getSourceConfig(source);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={`flex items-center justify-center rounded-xl ${size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'}`}
      style={{ backgroundColor: config.bgColor }}
    >
      {config.image && !imageFailed ? (
        <img
          src={config.image}
          alt={`${source} icon`}
          className={`${ICON_SIZE_CLASSES[size]} object-contain`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'}>{config.icon}</span>
      )}
    </div>
  );
};
