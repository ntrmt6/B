import React, { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import type { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import {
  defaultQuickLinks,
  defaultUsefulLinks,
  GADGET_FOOTER_EMAIL_ICON,
  GADGET_FOOTER_PHONE_ICON,
  GADGET_FOOTER_ADDRESS_ICON,
  GADGET_SOCIAL_ICON_URLS,
} from './constants';

const buildWhatsAppLink = (rawNumber?: string | null) => {
  if (!rawNumber) return null;
  const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
  return sanitized ? `https://wa.me/${sanitized}` : null;
};

export const GadgetFooter = memo(({ websiteConfig, logo, onOpenChat }: { websiteConfig?: WebsiteConfig; logo?: string | null; onOpenChat?: () => void }) => {
  const storeName = websiteConfig?.storeName || 'Store';
  const description = websiteConfig?.shortDescription || '';
  const emails = websiteConfig?.emails || [];
  const phones = websiteConfig?.phones || [];
  const addresses = websiteConfig?.addresses || [];
  const socialLinks = websiteConfig?.socialLinks || [];
  const rawQuickLinks = websiteConfig?.footerQuickLinks || [];
  const rawUsefulLinks = websiteConfig?.footerUsefulLinks || [];
  const quickLinks = rawQuickLinks.filter(l => l.label && l.url).length > 0
    ? rawQuickLinks.filter(l => l.label && l.url)
    : defaultQuickLinks;
  const usefulLinks = rawUsefulLinks.filter(l => l.label && l.url).length > 0
    ? rawUsefulLinks.filter(l => l.label && l.url)
    : defaultUsefulLinks;

  return (
    <>
    <div>
      {/* Desktop Footer */}
      <div className="hidden md:block">
        <div className="bg-white mt-2">
          <div className="max-w-[1340px] w-[95%] mx-auto">
            <div className="gap-x-4 grid grid-cols-[1fr] gap-y-4 p-[10px] md:gap-x-5 md:grid-cols-[repeat(4,1fr)] md:gap-y-4 md:px-2 md:py-3">
              {/* Brand */}
              <div className="text-center w-full md:text-start">
                <div className="flex justify-center text-center mb-3 md:block md:justify-normal md:text-start">
                  {logo ? (
                    <img alt={storeName} src={normalizeImageUrl(logo)} className="block h-10 max-w-[180px] object-contain w-full" />
                  ) : (
                    <span className="text-xl font-bold text-neutral-900">{storeName}</span>
                  )}
                </div>
                {description && <p className="text-sm text-center md:text-start">{description}</p>}
                {socialLinks.length > 0 && (
                  <div className="items-center gap-x-2 flex justify-center gap-y-2 text-center mt-3 md:justify-normal md:text-start">
                    {socialLinks.map((s, i) => {
                      const platform = String(s.platform || '').toLowerCase();
                      const iconSrc = GADGET_SOCIAL_ICON_URLS[platform] || GADGET_SOCIAL_ICON_URLS.facebook;
                      return (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="bg-gray-400/30 flex items-center justify-center w-9 h-9 rounded-full hover:bg-lime-500 transition-colors overflow-hidden">
                          <img src={iconSrc} alt={s.platform || 'social'} className="w-5 h-5 object-contain" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="text-center md:text-start">
                <b className="text-xl font-semibold block tracking-[-0.3px] leading-[30px] mb-3">Contact Us</b>
                <ul className="list-none pl-0">
                  {emails.map((e, i) => (
                    <li key={`e${i}`} className="items-center gap-x-2 flex flex-wrap justify-center gap-y-1.5 text-center w-full mb-1.5 md:flex-nowrap md:justify-start md:text-start">
                      <img src={GADGET_FOOTER_EMAIL_ICON} alt="email" className="w-4 h-4 object-contain" />
                      <span className="text-sm leading-[26px]">{e}</span>
                    </li>
                  ))}
                  {phones.map((p, i) => (
                    <li key={`p${i}`} className="items-center gap-x-2 flex flex-wrap justify-center gap-y-1.5 text-center w-full mb-1.5 md:flex-nowrap md:justify-start md:text-start">
                      <img src={GADGET_FOOTER_PHONE_ICON} alt="phone" className="w-4 h-4 object-contain" />
                      <a href={`tel:${p}`} className="text-sm leading-[26px] hover:text-black hover:no-underline">{p}</a>
                    </li>
                  ))}
                  {addresses.map((a, i) => (
                    <li key={`a${i}`} className="items-center gap-x-2 flex flex-wrap justify-center gap-y-1.5 text-center w-full mb-1.5 md:flex-nowrap md:justify-start md:text-start">
                      <img src={GADGET_FOOTER_ADDRESS_ICON} alt="address" className="w-4 h-4 object-contain" />
                      <span className="text-sm leading-[26px]">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              {quickLinks.length > 0 && (
                <div className="text-center md:text-start">
                  <b className="text-xl font-semibold block tracking-[-0.3px] leading-[30px] mb-3">Quick Links</b>
                  <ul className="list-none pl-0">
                    {quickLinks.map((link, i) => (
                      <li key={i} className="text-center py-1 md:text-start">
                        <a href={link.url} className="text-zinc-800 inline-block hover:text-blue-600 hover:no-underline">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Useful Links */}
              {usefulLinks.length > 0 && (
                <div className="text-center md:text-start">
                  <b className="text-xl font-semibold block tracking-[-0.3px] leading-[30px] mb-3">Useful Links</b>
                  <ul className="list-none pl-0">
                    {usefulLinks.map((link, i) => (
                      <li key={i} className="text-center py-1 md:text-start">
                        <a href={link.url} className="text-zinc-800 inline-block hover:text-blue-600 hover:no-underline">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Copyright */}
            {!websiteConfig?.hideCopyright && (
              <div className="border-t-indigo-300 flex justify-center mb-0 border-t px-3 py-3 md:px-6 md:py-4">
                <b className="text-neutral-600 text-sm block leading-[22px] text-center">
                  Copyright © {new Date().getFullYear()} {storeName}
                  {websiteConfig?.showPoweredBy && (
                    <><br /><span className="font-normal text-xs text-gray-400">Powered by Paatalika</span></>
                  )}
                </b>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="block md:hidden">
        <div className="bg-white mt-2">
          <div className="max-w-[1340px] w-[95%] mx-auto">
            <div className="gap-x-3 grid grid-cols-[1fr] gap-y-3 p-[10px]">
              <div className="text-center w-full">
                <div className="flex justify-center mb-3">
                  {logo ? (
                    <img alt={storeName} src={normalizeImageUrl(logo)} className="block h-10 max-w-[180px] object-contain w-full" />
                  ) : (
                    <span className="text-xl font-bold">{storeName}</span>
                  )}
                </div>
                {description && <p className="text-sm text-center mb-2">{description}</p>}
                {socialLinks.length > 0 && (
                  <div className="flex justify-center gap-2 mb-2">
                    {socialLinks.map((s, i) => {
                      const platform = String(s.platform || '').toLowerCase();
                      const iconSrc = GADGET_SOCIAL_ICON_URLS[platform] || GADGET_SOCIAL_ICON_URLS.facebook;
                      return (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="bg-gray-400/30 flex items-center justify-center w-auto h-auto rounded-full hover:bg-lime-500 transition-colors overflow-hidden">
                          <img src={iconSrc} alt={s.platform || 'social'} className="w-5 h-5 object-contain" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Contact */}
              {(emails.length > 0 || phones.length > 0 || addresses.length > 0) && (
                <div className="text-center">
                  <b className="text-base font-semibold block mb-1.5">Contact Us</b>
                  <ul className="list-none pl-0">
                    {emails.map((e, i) => (
                      <li key={`e${i}`} className="text-sm mb-0.5 flex items-center justify-center gap-1.5">
                        <img src={GADGET_FOOTER_EMAIL_ICON} alt="email" className="w-4 h-4 object-contain" />
                        <span>{e}</span>
                      </li>
                    ))}
                    {phones.map((p, i) => (
                      <li key={`p${i}`} className="text-sm mb-0.5 flex items-center justify-center gap-1.5">
                        <img src={GADGET_FOOTER_PHONE_ICON} alt="phone" className="w-4 h-4 object-contain" />
                        <a href={`tel:${p}`} className="hover:no-underline">{p}</a>
                      </li>
                    ))}
                    {addresses.map((a, i) => (
                      <li key={`a${i}`} className="text-sm mb-0.5 flex items-center justify-center gap-1.5">
                        <img src={GADGET_FOOTER_ADDRESS_ICON} alt="address" className="w-4 h-4 object-contain" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Quick Links */}
              <div className="text-center">
                <b className="text-base font-semibold block mb-1.5">Quick Links</b>
                <ul className="list-none pl-0">
                  {quickLinks.map((link, i) => (
                    <li key={i} className="py-0.5">
                      <a href={link.url} className="text-sm text-zinc-800 hover:text-lime-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Useful Links */}
              <div className="text-center">
                <b className="text-base font-semibold block mb-1.5">Useful Links</b>
                <ul className="list-none pl-0">
                  {usefulLinks.map((link, i) => (
                    <li key={i} className="py-0.5">
                      <a href={link.url} className="text-sm text-zinc-800 hover:text-lime-600 hover:no-underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {!websiteConfig?.hideCopyright && (
              <div className="border-t-indigo-300 flex justify-center mb-2 border-t px-3 py-2.5">
                <b className="text-neutral-600 text-sm block leading-[22px] text-center">
                  Copyright © {new Date().getFullYear()} {storeName}
                </b>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {/* Floating Chat Button */}
    {(() => {
      const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
      const chatEnabled = websiteConfig?.chatEnabled ?? true;
      const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;
      const baseClasses = 'hidden md:flex fixed bottom-20 right-8 w-14 h-14 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-105 z-40 shadow-lg';
      const chatIcon = <MessageCircle size={24} strokeWidth={2} className="text-white" />;
      if (chatEnabled && onOpenChat) {
        return <button type="button" onClick={onOpenChat} aria-label="Open live chat" className={`${baseClasses} hover:shadow-xl`} style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>{chatIcon}</button>;
      }
      if (chatFallbackLink) {
        return <a href={chatFallbackLink} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className={`${baseClasses} bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-xl hover:shadow-green-500/30`}>{chatIcon}</a>;
      }
      return null;
    })()}
    </>
  );
});
GadgetFooter.displayName = 'GadgetFooter';
