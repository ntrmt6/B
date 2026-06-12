import React from 'react';

interface AdminNoticeTickerProps {
  noticeText?: string | null;
}

export const AdminNoticeTicker: React.FC<AdminNoticeTickerProps> = ({ noticeText }) => {
  if (!noticeText) return null;

  return (
    <div className="w-full bg-white border-b border-gray-100 py-1.5 overflow-hidden">
      <div className="marquee-container">
        <div className="marquee-content">
          <span className="marquee-text text-gray-900">{noticeText}</span>
        </div>
      </div>
      <style>{`
        .marquee-container {
          display: flex;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          animation: scroll-right-to-left 25s linear infinite;
        }
        .marquee-text {
          font-size: 0.875rem;
          white-space: nowrap;
          padding: 0 2rem;
          display: inline-block;
        }
        @keyframes scroll-right-to-left {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};
