 import React, { useState, useEffect } from 'react';
import { Clock, ShieldQuestion } from 'lucide-react';

export const RenewModal = ({ is_active, onClose, onRenew }: { is_active: boolean; onClose: () => void; onRenew: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (is_active) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [is_active]);

  if (!is_active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className={`bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Top Decoration */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 h-32 flex items-center justify-center">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Text Content */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Subscription Expired</h2>
          <p className="text-slate-600 mb-6">
            Your 30-day subscription period has come to an end. Please renew your plan to continue 
            enjoying premium features and maintain access to your tenant dashboard.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={onRenew}
              className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Renew Now
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors focus:outline-none"
            >
              Maybe Later
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-6 flex items-center justify-center gap-1 text-xs text-slate-400">
            <ShieldQuestion className="w-3 h-3" />
            <span>Need help? </span>
            <a href="#" className="text-blue-500 hover:underline ml-1">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Example: Auto-show for expired tenants
  useEffect(() => {
    const timer = setTimeout(() => setIsModalOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRenew = () => {
    setIsModalOpen(false);
    setMessage('Redirecting to secure payment portal...');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
        </header>

        {/* Toast Notification */}
        {message && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800 text-white rounded-full text-sm shadow-xl animate-bounce">
            {message}
          </div>
        )}
      </div>

      <RenewModal 
        is_active={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRenew={handleRenew}
      />
    </div>
  );
}


