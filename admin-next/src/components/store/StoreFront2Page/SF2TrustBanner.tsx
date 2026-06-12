import React, { memo } from 'react';
import { Package, Tag, Clock, Heart } from 'lucide-react';
import { C } from './constants';

export const TrustBanner = memo(() => {
  const items = [
    { icon: <Package size={22} />, title: 'Free Delivery', desc: 'On orders over ৳999' },
    { icon: <Tag size={22} />, title: 'Best Prices', desc: 'Guaranteed lowest prices' },
    { icon: <Clock size={22} />, title: '24/7 Support', desc: 'Always here to help' },
    { icon: <Heart size={22} />, title: 'Trusted Store', desc: '10,000+ happy customers' },
  ];

  return (
    <section
      className="border-y py-6"
      style={{ backgroundColor: C.accentLight, borderColor: '#fde8d0' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x"
          style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}
        >
          {items.map((item) => (
            <div key={item.title} className="flex items-center gap-3 px-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.accent, color: '#fff' }}
              >
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: C.primary }}>{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
TrustBanner.displayName = 'TrustBanner';
