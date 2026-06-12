import React, { memo } from 'react';
import { DARK, LIGHT_GREEN } from './constants';

export const CTASection = memo(() => (
  <section className="py-16 text-center" style={{ backgroundColor: LIGHT_GREEN }}>
    <div className="max-w-[1400px] mx-auto px-4 md:px-8">
      <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: DARK, fontFamily: "'Lato', sans-serif" }}>
        Join the Shopping Revolution
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-base" style={{ fontFamily: "'Lato', sans-serif" }}>
        Explore a vast marketplace of incredible deals from trusted sellers worldwide. Shop top brands, enjoy fast delivery, and discover exclusive offers.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="px-8 py-3 rounded-full text-white font-bold text-base transition-colors hover:opacity-90" style={{ backgroundColor: DARK }}>
          Start Shopping
        </button>
        <button className="px-8 py-3 rounded-full border-2 font-bold text-base transition-colors hover:bg-gray-50" style={{ borderColor: DARK, color: DARK }}>
          Become a Seller
        </button>
      </div>
    </div>
  </section>
));
CTASection.displayName = 'CTASection';
