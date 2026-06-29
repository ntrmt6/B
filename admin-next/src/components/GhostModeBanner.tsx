'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface GhostModeBannerProps {
  className?: string;
}

export const GhostModeBanner: React.FC<GhostModeBannerProps> = ({ className = '' }) => {
  const { isImpersonating, endImpersonation, user } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to exit Ghost Mode and return to Super Admin panel?')) {
      await endImpersonation();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="font-semibold text-sm md:text-base">
                Viewing in Super Admin Ghost Mode
              </span>
            </div>
            {user && (
              <span className="hidden md:inline-block text-xs bg-white/20 px-2 py-1 rounded-full">
                as {user.name} ({user.email})
              </span>
            )}
          </div>

          <button
            onClick={handleEndSession}
            className="flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Exit Ghost Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GhostModeBanner;
