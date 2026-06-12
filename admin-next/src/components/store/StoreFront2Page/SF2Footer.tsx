import React, { memo } from 'react';
import { Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import type { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { C } from './constants';

export const SF2Footer = memo(
  ({
    logo,
    websiteConfig,
  }: {
    logo?: string | null;
    websiteConfig?: WebsiteConfig;
  }) => {
    const storeName = websiteConfig?.storeName || 'Our Store';
    const phone = websiteConfig?.phones || '';
    const email = websiteConfig?.emails || '';

    return (
      <footer style={{ backgroundColor: C.primary }}>
        {/* Newsletter */}
        <div
          className="py-12 border-b border-white/10"
          style={{ background: `linear-gradient(135deg, ${C.accent}22, transparent)` }}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
            <h3 className="text-2xl font-extrabold text-white mb-2">
              Stay in the Loop
            </h3>
            <p className="text-white/60 mb-6">
              Get exclusive deals and updates delivered to your inbox.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-full bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/50 text-sm"
              />
              <button
                type="submit"
                className="px-7 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.accent }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Links */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              {logo ? (
                <img
                  src={normalizeImageUrl(logo)}
                  alt={storeName}
                  className="h-8 mb-4 object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-white font-extrabold text-xl mb-4 block">{storeName}</span>
              )}
              <p className="text-white/50 text-sm leading-relaxed">
                Quality products at prices that make sense.
              </p>
              <div className="flex gap-3 mt-5">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: C.accent }}
                  >
                    <Icon size={15} className="text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            {[
              {
                title: 'Shop',
                links: ['All Products', 'New Arrivals', 'Best Sellers', 'Flash Sale'],
              },
              {
                title: 'Help',
                links: ['FAQ', 'Shipping Info', 'Returns', 'Contact'],
              },
              {
                title: 'Company',
                links: ['About Us', 'Privacy Policy', 'Terms of Service'],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
                  {title}
                </h4>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact row */}
          {(phone || email) && (
            <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-white/10">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                  <Phone size={16} style={{ color: C.accent }} />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                  <Mail size={16} style={{ color: C.accent }} />
                  {email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-5 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </footer>
    );
  }
);
SF2Footer.displayName = 'SF2Footer';
