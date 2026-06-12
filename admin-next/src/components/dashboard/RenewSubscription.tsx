import React, { useState, useEffect } from 'react';
// import { AdminBilling } from '../../pages/AdminBilling';
import { 
  X, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Calendar,
  ChevronDown
} from 'lucide-react';

interface RenewSubscriptionProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedPlan?: string;
}

const RenewSubscription: React.FC<RenewSubscriptionProps> = ({ isOpen: externalIsOpen, onClose: externalOnClose, selectedPlan }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, submitting, success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: selectedPlan || 'startup',
    duration: '12 months',
    message: ''
  });

  // Use external control if provided, otherwise internal state
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  // Automatically open the popup for demonstration after a short delay (only if not controlled)
  useEffect(() => {
    if (!isControlled) {
      const timer = setTimeout(() => setInternalIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isControlled]);

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Format WhatsApp message with form data
    const message = `🔔 Subscription Renewal Request

📋 *Customer Details:*
• Name: ${formData.name}
• Email: ${formData.email}

📦 *Subscription Details:*
• Plan: ${formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1)}
• Duration: ${formData.duration}

${formData.message ? `💬 *Additional Requests:*\n${formData.message}` : ''}

---
Sent from SystemNext IT Dashboard`;

    // WhatsApp number (Bangladesh: 880 + number without leading 0)
    const whatsappNumber = '8801410050031';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Show success after brief delay
    setTimeout(() => {
      setStatus('success');
    }, 500);
  };

  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
    // Reset status after animation
    setTimeout(() => setStatus('idle'), 300);
  };

  // Generate duration options 1-12
  const durationOptions = Array.from({ length: 12 }, (_, i) => {
    const months = i + 1;
    return `${months} month${months > 1 ? 's' : ''}`;
  });

  // If controlled externally and not open, return null (don't show standalone button)
  if (!isOpen && status !== 'success') {
    if (isControlled) {
      return null;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <button 
          onClick={() => setInternalIsOpen(true)}
          className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-600 transition-all active:scale-95"
        >
          Renew Subscription
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col md:flex-row">
        
        {/* Left Side: Brand/Info with the requested gradient */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-b from-orange-500 to-amber-500 p-4 sm:p-6 lg:p-8 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">SystemNext IT</span>
            </div>
            
            <h2 className="text-2xl font-bold leading-tight mb-4">
              Don't lose your progress.
            </h2>
            <p className="text-orange-50 text-sm leading-relaxed mb-6">
              Renew Your Package now to maintain priority support and uninterrupted services.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-orange-200" />
                <span>Locked-in price for selected duration</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-orange-200" />
                <span>Premium API access</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-400 flex items-center justify-center text-[10px] font-bold">
                    U{i}
                  </div>
                ))}
              </div>
              <span className="text-xs text-orange-50">Joined by 2k+ teams</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-4 sm:p-6 sm:p-8 bg-white">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {status === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your renewal request for {formData.duration} of the {formData.plan} plan has been sent via WhatsApp. Our team will respond shortly.
              </p>
              <button 
                onClick={handleClose}
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Renew Subscription</h3>
                <p className="text-slate-500 text-sm">Contact our sales team for renewal options.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Work Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Plan Tier</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                        value={formData.plan}
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                      >
                        <option value="startup">Startup</option>
                        <option value="enterprise">Enterprise</option>
                        <option value="advanced">Advanced</option>
                         <option value="premium">Premium</option>
                      </select>
                      {/* <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" /> */}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Duration</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      >
                        {durationOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {/* <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" /> */}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Specific Requests (Optional)</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm resize-none h-24"
                    placeholder="Do you need more seats or specific billing cycles?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button 
                  disabled={status === 'submitting'}
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Renewal Request
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewSubscription;