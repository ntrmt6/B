import { useState, useEffect } from 'react';

interface TagCountdownTimerProps {
  expiresAt: string;
  tagName?: string;
  compact?: boolean;
}

const getTimeRemaining = (expiresAt: string) => {
  const now = Date.now();
  const end = new Date(expiresAt).getTime();
  const diff = Math.max(0, end - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: diff <= 0 };
};

const padZero = (n: number) => n.toString().padStart(2, '0');

export const TagCountdownTimer = ({ expiresAt, tagName, compact = false }: TagCountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiresAt));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeLeft(remaining);
      if (remaining.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  
  if (timeLeft.expired) return null;

  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  const primaryColor = 'rgb(var(--color-primary-rgb, 0 113 173))';
  const primaryRgbVal = 'var(--color-primary-rgb, 0 113 173)';

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs" role="timer" aria-label={`${tagName || 'Tag'} countdown`}>
        <div className="flex items-center gap-0.5">
          <span className="font-bold px-1 py-0.5 rounded text-[10px] min-w-[22px] text-center border" style={{ color: primaryColor, borderColor: primaryColor }}>{padZero(totalHours)}</span>
          <span className="font-bold text-[10px]" style={{ color: primaryColor }}>:</span>
          <span className="font-bold px-1 py-0.5 rounded text-[10px] min-w-[22px] text-center border" style={{ color: primaryColor, borderColor: primaryColor }}>{padZero(timeLeft.minutes)}</span>
          <span className="font-bold text-[10px]" style={{ color: primaryColor }}>:</span>
          <span className="font-bold px-1 py-0.5 rounded text-[10px] min-w-[22px] text-center border" style={{ color: primaryColor, borderColor: primaryColor }}>{padZero(timeLeft.seconds)}</span>
        </div>
      </div>
    );
  }

  const items = [
    { label: 'H', value: padZero(totalHours) },
    { label: 'M', value: padZero(timeLeft.minutes) },
    { label: 'S', value: padZero(timeLeft.seconds) },
  ];

  return (
    <div className="flex items-center gap-0 lg:gap-3" role="timer" aria-label={`${tagName || 'Tag'} countdown`}>
      <div className="flex items-center gap-0 lg:gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-0 lg:gap-3">

            {/* Box */}
            <div className="relative w-10 h-10 rounded-[4px] bg-white flex items-center justify-center">
              {/* Number */}
              {/* style={{ color: primaryColor }} */}
              <span className="text-sm font-black text-gray-900 leading-none font-lato">{item.value}</span>

              {/* Label badge — bottom left corner */}
              <div className="absolute bottom-[-10px] left-0 bg-[#FF9C1A] rounded-[0_4px_0_4px] px-1">
                <span className="text-white text-[10px] font-bold leading-none font-lato">{item.label}</span>
              </div>
            </div>

            {/* Colon separator */}
            {index < items.length - 1 && (
              <span className="text-[#FF9C1A] font-black text-2xl sm:text-3xl leading-none font-lato">:</span>
            )}
          </div>
        ))}
        </div>
      </div>
  );
};

export default TagCountdownTimer;
