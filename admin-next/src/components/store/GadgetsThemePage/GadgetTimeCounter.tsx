import React, { memo, useState, useEffect } from 'react';

export const GadgetTimeCounter = memo(({ expiresAt }: { expiresAt?: string }) => {
  const getSecondsLeft = () => {
    if (expiresAt) {
      return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    }
    // Fallback: rolling timer to next hour
    const now = new Date();
    return (59 - now.getMinutes()) * 60 + (59 - now.getSeconds());
  };

  const [seconds, setSeconds] = useState(getSecondsLeft);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative items-center bg-transparent flex gap-x-[6px] gap-y-[6px] justify-center max-w-[430px] text-center w-auto z-[2] mx-auto md:bg-white md:w-full">
      {[
        { v: pad(h), l: 'Hours' },
        { v: pad(m), l: 'Mins' },
        { v: pad(s), l: 'Sec' },
      ].map(({ v, l }) => (
        <div key={l} className="items-center flex flex-col h-[34px] justify-center w-10 border-violet-700 rounded-[5px] border-2 border-solid">
          <div className="text-violet-700 text-xs font-bold leading-3">{v}</div>
          <div className="text-violet-700 text-[11px] font-medium brightness-[1.2] leading-3">{l}</div>
        </div>
      ))}
    </div>
  );
});
GadgetTimeCounter.displayName = 'GadgetTimeCounter';
