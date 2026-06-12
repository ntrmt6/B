import React, { memo } from 'react';
import type { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { DARK } from './constants';

export const SFFooter = memo(({ logo, websiteConfig }: { logo?: string | null; websiteConfig?: WebsiteConfig }) => {
  const storeName = websiteConfig?.storeName || 'Store';
  return (
    <footer className="text-white py-12" style={{ backgroundColor: DARK }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            {logo ? (
              <img src={normalizeImageUrl(logo)} alt={storeName} className="h-8 mb-4 object-contain brightness-0 invert" />
            ) : (
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>{storeName}</h3>
            )}
            <p className="text-white/70 text-sm leading-relaxed" style={{ fontFamily: "'Lato', sans-serif" }}>
              Your one-stop destination for quality products at great prices.
            </p>
          </div>
          {['Shop', 'Help', 'Company'].map((section) => (
            <div key={section}>
              <h4 className="font-bold text-base mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>{section}</h4>
              <ul className="space-y-2 text-white/70 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
                {section === 'Shop' && ['All Products', 'Categories', 'Brands', 'Deals'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
                {section === 'Help' && ['FAQ', 'Shipping', 'Returns', 'Contact Us'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
                {section === 'Company' && ['About Us', 'Privacy Policy', 'Terms of Service'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-6 text-center text-white/50 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
});
SFFooter.displayName = 'SFFooter';
