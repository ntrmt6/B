import React, { useState } from 'react';
import { Unplug, X, Rocket } from 'lucide-react';

// Interface for Coming Soon Modal Props
interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Coming Soon Modal Component
 * Displays a professional overlay when a feature is not yet ready.
 */
const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Rocket className="text-indigo-600 dark:text-indigo-400" size={32} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Roboto']">
            Coming Soon!
          </h2>

          <p className="text-gray-600 dark:text-gray-400">
            Ei feature-ti niye amra kaj korchhi. Khub shiggory-i eti apnader jonno available hobe. Stay tuned!
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * useComingSoon hook
 * Returns showComingSoon function and ComingSoonPopup JSX.
 */
export function useComingSoon() {
  const [isOpen, setIsOpen] = useState(false);

  const showComingSoon = (_title?: string) => {
    setIsOpen(true);
  };

  const ComingSoonPopup = (
    <ComingSoonModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  );

  return { showComingSoon, ComingSoonPopup };
}

/**
 * Main App Component
 * Demonstrates the menu item and the modal trigger.
 */
export default function App() {
  const [showComingSoon, setShowComingSoon] = useState<boolean>(false);

  const toggleComingSoon = (): void => {
    setShowComingSoon((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-xs bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-4">
          Settings & Extras
        </p>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={toggleComingSoon}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-['Roboto'] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          >
            <Unplug className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm font-medium">Up Coming..</span>
          </button>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
      />
    </div>
  );
}
