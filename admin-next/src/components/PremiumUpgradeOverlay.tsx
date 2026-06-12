import React from 'react';
import { Crown, ArrowUpCircle, Sparkles, Lock } from 'lucide-react';

interface PremiumUpgradeOverlayProps {
  /** The display name of the locked section */
  sectionName: string;
  /** Callback when the user clicks the upgrade/contact button */
  onUpgrade?: () => void;
  /** Optional callback to navigate back */
  onBack?: () => void;
}

/**
 * Professional overlay shown when a tenant accesses a premium-gated section.
 * Displays an upgrade prompt with a call-to-action.
 */
const PremiumUpgradeOverlay: React.FC<PremiumUpgradeOverlayProps> = ({
  sectionName,
  onUpgrade,
  onBack,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-lg w-full text-center">
        {/* Gradient Background Card */}
        <div className="relative bg-gradient-to-br from-amber-50 via-white to-purple-50 rounded-3xl shadow-xl border border-amber-100/50 p-8 sm:p-12 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-tr-full" />

          {/* Lock Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50">
            <Crown className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="relative text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Premium Feature
          </h2>

          {/* Subtitle */}
          <p className="relative text-base text-slate-600 mb-2">
            <span className="font-semibold text-amber-700">{sectionName}</span> is a premium feature
          </p>
          <p className="relative text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Upgrade your subscription to unlock this feature and get access to advanced tools that help grow your business.
          </p>

          {/* Benefits */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            {[
              'Access to all premium features',
              'Priority customer support',
              'Advanced analytics & reports',
              'Unlimited usage & storage',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onUpgrade}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-200/50 transition-all hover:shadow-xl hover:shadow-amber-300/50 hover:-translate-y-0.5"
            >
              <ArrowUpCircle className="w-5 h-5" />
              Upgrade Your Subscription
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeOverlay;
