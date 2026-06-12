import React, { memo } from 'react';
import { Star } from 'lucide-react';
import { ACCENT, DARK } from './constants';

export const CustomerReviews = memo(() => {
  const reviews = [
    { name: 'Happy Customer', text: '"Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Earned a loyal customer."' },
    { name: 'Satisfied Buyer', text: '"Amazing products at great prices. I\'ve been shopping here for months and the quality is always consistent."' },
    { name: 'Loyal Shopper', text: '"Best online shopping experience! Easy returns, quick delivery, and awesome product selection."' },
    { name: 'Regular Customer', text: '"Outstanding service! Every order has been perfect. The deals section is my favorite."' },
  ];

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: ACCENT, fontFamily: "'Lato', sans-serif" }}>Our Happy Customers</h2>
        <p className="text-gray-600 max-w-xl mx-auto text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
          Don't just take our word for it – see how our products and services have delighted customers across the globe.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: ACCENT }}>
                {r.name[0]}
              </div>
              <span className="font-bold text-lg" style={{ color: DARK, fontFamily: "'Lato', sans-serif" }}>{r.name}</span>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: "'Lato', sans-serif" }}>{r.text}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <button className="px-8 py-3 rounded-full text-white font-bold text-base transition-colors hover:opacity-90" style={{ backgroundColor: DARK }}>
          GET STARTED
        </button>
      </div>
    </section>
  );
});
CustomerReviews.displayName = 'CustomerReviews';
