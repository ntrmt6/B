import React from 'react';

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ visible, onClick }) => (
  <button
    className={`fixed bottom-20 md:bottom-4 right-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full p-2.5 shadow-lg transition-all duration-300 z-40 ${
      visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    onClick={onClick}
    aria-label="Scroll to top"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  </button>
);
