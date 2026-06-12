import React from 'react';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  ArrowRight,
  Heart,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Send,
  ExternalLink
} from 'lucide-react';
import './StoreFooter.css';
import { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { resolveTenantFooterLogo } from '../../../utils/tenantBrandingHelper';

const buildWhatsAppLink = (rawNumber?: string | null) => {
  if (!rawNumber) return null;
  const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
  return sanitized ? `https://wa.me/${sanitized}` : null;
};

export interface StoreFooterProps {
  websiteConfig?: WebsiteConfig;
  logo?: string | null;
  tenantId?: string;
  onOpenChat?: () => void;
}

// Default links fallback
const defaultQuickLinks = [
  { id: '1', label: 'Home', url: '/' },
  { id: '2', label: 'Terms and Conditions', url: '/termsnconditions' },
  { id: '3', label: 'Return Policy', url: '/returnpolicy' },
  // { id: '4', label: 'Contact', url: '/contact' }
];

const defaultUsefulLinks = [
  { id: '1', label: 'About Us', url: '/about' },
  { id: '2', label: 'Privacy Policy', url: '/privacy' },
  { id: '3', label: 'FAQ', url: '/faq' },
  { id: '4', label: 'Track Order', url: '/track' }
];

// Helper to get footer links with fallback
const getFooterQuickLinks = (config?: WebsiteConfig) => {
  const links = config?.footerQuickLinks;
  if (links && Array.isArray(links) && links.length > 0) {
    const filtered = links.filter(l => l.label && l.url);
    if (filtered.length > 0) {
      return filtered;
    }
  }
  return defaultQuickLinks;
};

const getFooterUsefulLinks = (config?: WebsiteConfig) => {
  const links = config?.footerUsefulLinks;
  if (links && Array.isArray(links) && links.length > 0) {
    const filtered = links.filter(l => l.label && l.url);
    if (filtered.length > 0) {
      return filtered;
    }
  }
  return defaultUsefulLinks;
};

// Shared utilities
const getSocialIconMap = (): { [key: string]: React.ReactNode } => ({
  facebook: <Facebook size={18} />,
  instagram: <Instagram size={18} />,
  twitter: <Twitter size={18} />,
  youtube: <Youtube size={18} />,
  linkedin: <Linkedin size={18} />,
  whatsapp: <MessageCircle size={18} />,
  messenger: <MessageCircle size={18} />,
  fb: <Facebook size={18} />,
  ig: <Instagram size={18} />,
  x: <Twitter size={18} />,
  yt: <Youtube size={18} />,
});

const resolveSocialIcon = (platform?: string): React.ReactNode => {
  const map = getSocialIconMap();
  const key = platform?.toLowerCase() || '';
  return map[key] || <Globe size={18} />;
};

const features = [
  { icon: <Truck size={24} />, title: 'Free Delivery', desc: 'On orders over ৳999' },
  { icon: <ShieldCheck size={24} />, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: <CreditCard size={24} />, title: 'Easy Returns', desc: '7 days return policy' },
  { icon: <Headphones size={24} />, title: '24/7 Support', desc: 'Dedicated support' },
];
// Copyright section helper component
interface CopyrightSectionProps {
  websiteConfig?: WebsiteConfig;
  currentYear: number;
  variant?: 'dark' | 'light' | 'gradient';
  className?: string;
  children?: React.ReactNode;
}

const CopyrightSection: React.FC<CopyrightSectionProps> = ({ 
  websiteConfig, 
  currentYear, 
  variant = 'dark',
  className = '',
  children 
}) => {
  // If hideCopyright is true, hide the entire section
  if (websiteConfig?.hideCopyright) {
    return null;
  }

  const textColors = {
    dark: { main: 'text-gray-500', highlight: 'text-white', powered: 'text-gray-400 hover:text-blue-400' },
    light: { main: 'text-gray-500', highlight: 'text-gray-800', powered: 'text-gray-500 hover:text-blue-500' },
    gradient: { main: 'text-white/70', highlight: 'text-white', powered: 'text-white/60 hover:text-white' },
  };
  const colors = textColors[variant];

  return (
    <div className={`flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Copyright text - conditionally shown */}
      {!websiteConfig?.hideCopyrightText && (
        <p className={`text-sm ${colors.main}`}>
          © {currentYear} <span className={`font-medium ${colors.highlight}`}>{websiteConfig?.websiteName || 'Store'}</span>. All rights reserved.
        </p>
      )}
      
      {children}
      
      {/* Powered by - conditionally shown */}
      {websiteConfig?.showPoweredBy && (
        <a 
          href="https://systemnextit.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-xs ${colors.powered} transition-colors flex items-center gap-1`}
        >
          Powered by <span className="font-semibold">System Next IT</span>
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
};



const FloatingChatButton: React.FC<{ websiteConfig?: WebsiteConfig; onOpenChat?: () => void }> = ({ websiteConfig, onOpenChat }) => {
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
};

// Style 1: Default footer matching provided snippet
const FooterStyle1: React.FC<StoreFooterProps> = ({ websiteConfig, logo, tenantId, onOpenChat }) => {
  const resolvedFooterLogo = resolveTenantFooterLogo(websiteConfig, logo, tenantId);
  return (
    <footer className="w-full font-lato">
      <div className="mx-auto max-w-[1720px] bg-black rounded-t-[112px] px-20 pt-14 pb-6 max-md:px-6 max-md:pt-10 max-md:rounded-t-[48px]">

        {/* ── DESKTOP layout (md and above) ── */}
        <div className="hidden md:flex flex-row items-start justify-between gap-8">

          <div className="flex flex-col gap-4 max-w-[220px]">
            {resolvedFooterLogo ? (
              <img
                src={typeof normalizeImageUrl === 'function' ? normalizeImageUrl(resolvedFooterLogo) : String(resolvedFooterLogo)}
                alt={websiteConfig?.websiteName || 'Logo'}
                className="w-[169px]"
              />
            ) : (
              <h3 className="text-2xl font-bold text-white">{websiteConfig?.websiteName || 'Logo'}</h3>
            )}
            <p className="text-[13px] font-inter text-white leading-[1.7] mt-1">
              {websiteConfig?.brandingText || 'we create possibilities for the connected world.'}
            </p>
          </div>

          <div className="flex flex-row gap-20">

            {/* VISIT */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[16px] font-semibold text-[#7DB541] uppercase tracking-wider">
                VISIT
              </h4>
              <p className="text-[12px] text-white leading-[1.8] font-medium">
                {websiteConfig?.addresses || 'D-14/3, Bankcolony,'}
                <br />
              </p>
            </div>

            {/* QUICK LINK */}
            <div className="flex flex-col gap-[20px]">
              <h4 className="text-[16px] font-semibold text-[#7DB541] uppercase tracking-wider">
                QUICK LINK
              </h4>
              <ul className="flex flex-col gap-2">
                {[
                  { label: 'Products', url: '/all-products' },
                  { label: 'Categories', url: '/categories' },
                  { label: 'Campaigns', url: '/campaigns' }
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.url} className="text-[12px] text-white leading-[1.8] font-medium hover:text-[#7DB541] transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* USEFUL LINK */}
            <div className="flex flex-col gap-[20px]">
              <h4 className="text-[16px] font-semibold text-[#7DB541] uppercase tracking-wider">
                SOCIAL LINK
              </h4>
              <ul className="flex flex-col gap-2">
                {websiteConfig?.socialLinks?.slice(0, 5).map((social, idx) => (
                  <li key={idx}>
                    <a href={String(social?.url || '#')} target="_blank" rel="noopener noreferrer" className="text-[12px] text-white leading-[1.8] font-medium">
                      {String(social?.platform || '').charAt(0).toUpperCase() + String(social?.platform || '').slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* LEGAL */}
            <div className="flex flex-col gap-[20px]">
              <h4 className="text-[16px] font-semibold text-[#7DB541] uppercase tracking-wider">
                LEGAL
              </h4>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "Terms & Condition", url: "/termsnconditions" },
                  { label: "Return Policy", url: "/returnpolicy" }
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.url} className="text-[12px] text-white leading-[1.8] font-medium">
                      {item.label}
                    </a>
                  </li>
                  
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── MOBILE layout ── */}
        <div className="flex md:hidden flex-col items-center gap-4">
          {resolvedFooterLogo ? (
            <img
              src={typeof normalizeImageUrl === 'function' ? normalizeImageUrl(resolvedFooterLogo) : String(resolvedFooterLogo)}
              alt={websiteConfig?.websiteName || 'Logo'}
              className="w-[140px]"
            />
          ) : (
            <h3 className="text-xl font-bold text-white">{websiteConfig?.websiteName || 'Logo'}</h3>
          )}

          <p className="text-sm font-medium text-[#635C5C] text-center">
            Oversear Products © 2026. All rights reserved.
          </p>

          {/* Website URL */}
          <a
            href="https://www.opbd.shop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[#3FC3D7] font-medium"
          >
            www.opbd.shop
          </a>
        </div>

        {/* Desktop Copyright */}
        <p className="hidden md:block text-[12px] font-medium text-white mt-6">
          ©2026 System Next IT, All right reserved.
        </p>
      </div>
      <FloatingChatButton websiteConfig={websiteConfig} onOpenChat={onOpenChat} />
    </footer>
  );
};

// Style 2: Minimal - Clean white footer with simple layout
const FooterStyle2: React.FC<StoreFooterProps> = ({ websiteConfig, logo, tenantId, onOpenChat }) => {
  const resolvedFooterLogo = resolveTenantFooterLogo(websiteConfig, logo, tenantId);
  const currentYear = new Date().getFullYear();
  const quickLinks = getFooterQuickLinks(websiteConfig);

    return (
    <>
      <footer className="bg-[#0f1115] text-gray-300 pt-20 pb-10 font-sans selection:bg-theme-primary/30 selection:text-white">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
            
            {/* Column 1: Brand Identity (Spans 4) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="inline-block">
                {resolvedFooterLogo ? (
                  <img 
                    src={typeof normalizeImageUrl === 'function' ? normalizeImageUrl(resolvedFooterLogo) : String(resolvedFooterLogo)} 
                    alt={websiteConfig?.websiteName || 'Logo'} 
                    className="h-12 w-auto object-contain brightness-0 invert transition-transform hover:scale-105 duration-300" 
                  />
                ) : (
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                    {websiteConfig?.websiteName || 'Our Store'}
                  </h3>
                )}
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                {String(websiteConfig?.shortDescription || websiteConfig?.brandingText || 'Elevating your lifestyle with curated premium products. We focus on quality, sustainability, and exceptional customer service.')}
              </p>

              {/* Social Icons with Glowing Hover */}
              <div className="flex gap-4">
                {websiteConfig?.socialLinks?.slice(0, 5).map((social, idx) => (
                  <a 
                    key={idx} 
                    href={String(social?.url || '#')} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-theme-primary hover:border-theme-primary hover:shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.5)] transition-all duration-300 transform hover:-translate-y-1" 
                    aria-label={String(social?.platform || 'social')}
                  >
                    {typeof resolveSocialIcon === 'function' ? resolveSocialIcon(social?.platform) : null}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links (Spans 2) */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-8 relative inline-block">
                Navigation
                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-theme-primary rounded-full"></span>
              </h4>
              <ul className="space-y-4">
                {quickLinks.map((link, idx) => (
                  <li key={link?.id || idx}>
                    <a 
                      href={String(link?.url || '#')} 
                      className="group flex items-center text-sm hover:text-white transition-colors duration-200"
                    >
                      <ArrowRight size={12} className="mr-0 opacity-0 -ml-4 group-hover:mr-2 group-hover:opacity-100 transition-all duration-300 text-theme-primary" />
                      {String(link?.label || '')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Details (Spans 3) */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-8 relative inline-block">
                Get In Touch
                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-theme-primary rounded-full"></span>
              </h4>
              <ul className="space-y-6">
                {websiteConfig?.emails?.[0] && (
                  <li className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-white/5 text-theme-primary"><Mail size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email Us</p>
                      <p className="text-sm text-gray-300 break-all">{String(websiteConfig.emails[0])}</p>
                    </div>
                  </li>
                )}
                {websiteConfig?.phones?.[0] && (
                  <li className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-white/5 text-theme-primary"><Phone size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Call Support</p>
                      <p className="text-sm text-gray-300">{String(websiteConfig.phones[0])}</p>
                    </div>
                  </li>
                )}
                {websiteConfig?.addresses?.[0] && (
                  <li className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-white/5 text-theme-primary"><MapPin size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Our Location</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{String(websiteConfig.addresses[0])}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Newsletter/Promo (Spans 3) */}
            <div className="lg:col-span-3 bg-white/5 p-6 rounded-2xl border border-white/10 self-start">
              <h4 className="text-white font-bold text-sm mb-4">Stay Updated</h4>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">Subscribe to receive updates, access to exclusive deals, and more.</p>
              <div className="flex flex-col gap-2">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all text-white placeholder:text-gray-600"
                />
                <button className="bg-theme-primary hover:bg-theme-primary/90 text-white font-bold py-3 rounded-xl text-xs transition-all active:scale-95 shadow-lg shadow-theme-primary/20">
                  Subscribe Now
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              {!websiteConfig?.hideCopyrightText && (
                <p className="text-xs text-gray-500 font-medium">
                  © {currentYear} <span className="text-gray-300 font-bold">{websiteConfig?.websiteName || 'Our Store'}</span>. Crafted for excellence.
                </p>
              )}
              {websiteConfig?.showPoweredBy && (
                <a 
                  href="https://systemnextit.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-blue-400 transition-all mt-2 group"
                >
                  Project by <span className="font-bold group-hover:underline">System Next IT</span>
                  <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}
            </div>

            {/* Payment & Security Badges */}
            <div className="flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold tracking-tighter">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                SECURE CHECKOUT
              </div>
              <div className="flex gap-2">
                 {[1,2,3].map(i => <div key={i} className="w-8 h-5 bg-white/10 rounded sm:w-10 sm:h-6"></div>)}
              </div>
            </div>
          </div>
        </div>
      </footer>
      {typeof FloatingChatButton === 'function' ? (
        <FloatingChatButton websiteConfig={websiteConfig} onOpenChat={onOpenChat} />
      ) : FloatingChatButton}
    </>
  );
};

// Style 3: Colorful Gradient - Vibrant gradient footer
const FooterStyle3: React.FC<StoreFooterProps> = ({ websiteConfig, logo, tenantId, onOpenChat }) => {
  const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
  const resolvedFooterLogo = resolveTenantFooterLogo(websiteConfig, logo, tenantId);
  const currentYear = new Date().getFullYear();
  const quickLinks = getFooterQuickLinks(websiteConfig);
  const usefulLinks = getFooterUsefulLinks(websiteConfig);

  return (
    <>
      <footer className="bg-gradient-to-br from-theme-primary via-purple-600 to-theme-secondary text-white mt-auto store-footer-minheight">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              {resolvedFooterLogo ? <img src={normalizeImageUrl(resolvedFooterLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="h-12 object-contain mb-4 brightness-0 invert" /> : <h3 className="text-2xl font-bold mb-4">{websiteConfig?.websiteName || 'Store'}</h3>}
              <p className="text-white/80 text-sm mb-6">{websiteConfig?.shortDescription || websiteConfig?.brandingText || 'Your favorite online store.'}</p>
              <div className="flex gap-2">
                {websiteConfig?.socialLinks?.slice(0, 5).map((social, idx) => (
                  <a key={idx} href={social.url || '#'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white hover:text-theme-primary flex items-center justify-center transition-all" aria-label={social.platform}>{resolveSocialIcon(social.platform)}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, idx) => (
                  <li key={link.id || idx}><a href={link.url} className="text-white/80 hover:text-white transition-colors text-sm flex items-center gap-2"><ExternalLink size={12} />{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-lg">Useful Links</h4>
              <ul className="space-y-3">
                {usefulLinks.map((link, idx) => (
                  <li key={link.id || idx}><a href={link.url} className="text-white/80 hover:text-white transition-colors text-sm flex items-center gap-2"><ExternalLink size={12} />{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-lg">Get in Touch</h4>
              <div className="space-y-3 text-sm text-white/80">
                {websiteConfig?.phones?.[0] && <p className="flex items-center gap-2"><Phone size={16} />{websiteConfig.phones[0]}</p>}
                {websiteConfig?.emails?.[0] && <p className="flex items-center gap-2"><Mail size={16} />{websiteConfig.emails[0]}</p>}
                {websiteConfig?.whatsappNumber && <a href={whatsappLink || '#'} className="flex items-center gap-2 hover:text-white"><MessageCircle size={16} />WhatsApp Us</a>}
              </div>
              <div className="mt-6">
                <p className="text-sm mb-2">Subscribe for updates</p>
                <div className="flex"><input type="email" placeholder="Email" className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none" /><button className="px-4 py-2 bg-white text-theme-primary rounded-r-lg font-medium hover:bg-white/90 transition-colors"><Send size={16} /></button></div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-5">
            {!websiteConfig?.hideCopyright && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {!websiteConfig?.hideCopyrightText && (
                  <p className="text-sm text-white/70">© {currentYear} {websiteConfig?.websiteName || 'Store'}. All rights reserved.</p>
                )}
                <div className="flex gap-4 text-sm text-white/70"><a href="/privacy" className="hover:text-white">Privacy</a><a href="/terms" className="hover:text-white">Terms</a></div>
                {websiteConfig?.showPoweredBy && (
                  <a href="https://systemnextit.com" target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1">
                    Powered by <span className="font-semibold">System Next IT</span><ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
      <FloatingChatButton websiteConfig={websiteConfig} onOpenChat={onOpenChat} />
    </>
  );
};

// Style 4: Centered - Centered layout with newsletter focus
const FooterStyle4: React.FC<StoreFooterProps> = ({ websiteConfig, logo, tenantId, onOpenChat }) => {
  const resolvedFooterLogo = resolveTenantFooterLogo(websiteConfig, logo, tenantId);
  const currentYear = new Date().getFullYear();
  const quickLinks = getFooterQuickLinks(websiteConfig);

  return (
    <>
      <footer className="bg-gray-50 mt-auto store-footer-minheight">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <div className="mb-4">
            {resolvedFooterLogo ? <img src={normalizeImageUrl(resolvedFooterLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="h-44 object-contain mx-auto mb-1" /> : <h3 className="text-3xl font-bold text-gray-900 mb-4">{websiteConfig?.websiteName || 'Store'}</h3>}
            <p className="text-gray-600 max-w-md mx-auto">{websiteConfig?.shortDescription || websiteConfig?.brandingText || 'Discover quality products curated just for you.'}</p>
          </div>
          <div className="flex justify-center gap-3 mb-3">
            {websiteConfig?.socialLinks?.slice(0, 5).map((social, idx) => (
              <a key={idx} href={social.url || '#'} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-theme-primary hover:text-white flex items-center justify-center text-gray-600 transition-all" aria-label={social.platform}>{resolveSocialIcon(social.platform)}</a>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8">
            <h4 className="font-bold text-gray-900 text-lg mb-2">Stay Updated</h4>
            <p className="text-gray-600 text-sm mb-4">Subscribe to get exclusive offers and updates</p>
            <div className="flex max-w-md mx-auto"><input type="email" placeholder="Your email address" className="flex-1 px-4 py-3 rounded-l-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary/20" /><button className="px-6 py-3 bg-theme-primary text-white rounded-r-xl font-medium hover:bg-theme-primary/90 transition-colors">Subscribe</button></div>
          </div>
          <nav className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mb-8 text-sm">
            {quickLinks.map((link, idx) => (
              <a key={link.id || idx} href={link.url} className="text-gray-600 hover:text-theme-primary transition-colors">{link.label}</a>
            ))}
          </nav>
        </div>
        <div className="border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-5">
            {!websiteConfig?.hideCopyright && (
              <div className="flex flex-col items-center gap-2">
                {!websiteConfig?.hideCopyrightText && (
                  <p className="text-center text-sm text-gray-500">© {currentYear} {websiteConfig?.websiteName || 'Store'}. Made with <Heart size={12} className="inline text-rose-500 fill-rose-500" /> in Bangladesh</p>
                )}
                {websiteConfig?.showPoweredBy && (
                  <a href="https://systemnextit.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1">
                    Powered by <span className="font-semibold">System Next IT</span><ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
      <FloatingChatButton websiteConfig={websiteConfig} onOpenChat={onOpenChat} />
    </>
  );
};

// Style 5: E-commerce Pro - Full-featured with app download links
const FooterStyle5: React.FC<StoreFooterProps> = ({ websiteConfig, logo, tenantId, onOpenChat }) => {
  const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
  const resolvedFooterLogo = resolveTenantFooterLogo(websiteConfig, logo, tenantId);
  const currentYear = new Date().getFullYear();
  const quickLinks = getFooterQuickLinks(websiteConfig);
  const usefulLinks = getFooterUsefulLinks(websiteConfig);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto store-footer-minheight">
        <div className="bg-theme-primary/5 border-b border-theme-primary/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary flex-shrink-0">{feature.icon}</div>
                  <div><h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4><p className="text-xs text-gray-500">{feature.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              {resolvedFooterLogo ? <img src={normalizeImageUrl(resolvedFooterLogo)} alt={websiteConfig?.websiteName || 'Logo'} className="h-10 object-contain mb-4" /> : <h3 className="text-xl font-bold text-gray-900 mb-4">{websiteConfig?.websiteName || 'Store'}</h3>}
              <p className="text-gray-600 text-sm mb-4">{websiteConfig?.shortDescription || websiteConfig?.brandingText || 'Your trusted shopping destination.'}</p>
              <div className="flex gap-2 mb-4">
                {websiteConfig?.socialLinks?.slice(0, 4).map((social, idx) => (
                  <a key={idx} href={social.url || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-200 hover:border-theme-primary hover:text-theme-primary flex items-center justify-center text-gray-500 transition-all" aria-label={social.platform}>{resolveSocialIcon(social.platform)}</a>
                ))}
              </div>
              <div className="flex gap-2">
                {websiteConfig?.androidAppUrl && <a href={websiteConfig.androidAppUrl} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs flex items-center gap-2 hover:bg-gray-800"><span>Google Play</span></a>}
                {websiteConfig?.iosAppUrl && <a href={websiteConfig.iosAppUrl} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs flex items-center gap-2 hover:bg-gray-800"><span>App Store</span></a>}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link, idx) => (
                  <li key={link.id || idx}><a href={link.url} className="text-gray-600 hover:text-theme-primary text-sm transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Useful Links</h4>
              <ul className="space-y-2">
                {usefulLinks.map((link, idx) => (
                  <li key={link.id || idx}><a href={link.url} className="text-gray-600 hover:text-theme-primary text-sm transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {websiteConfig?.phones?.[0] && <li className="flex items-center gap-2"><Phone size={14} className="text-theme-primary" />{websiteConfig.phones[0]}</li>}
                {websiteConfig?.emails?.[0] && <li className="flex items-center gap-2"><Mail size={14} className="text-theme-primary" />{websiteConfig.emails[0]}</li>}
                {websiteConfig?.whatsappNumber && <li><a href={whatsappLink || '#'} className="flex items-center gap-2 text-green-600 hover:text-green-700"><MessageCircle size={14} />WhatsApp</a></li>}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {!websiteConfig?.hideCopyright && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {!websiteConfig?.hideCopyrightText && (
                  <p className="text-sm text-gray-500">© {currentYear} {websiteConfig?.websiteName || 'Store'}. All rights reserved.</p>
                )}
                <div className="flex items-center gap-3"><span className="text-xs text-gray-500">Payments:</span><div className="flex gap-1">{['bKash', 'Nagad', 'Visa', 'Master'].map((m, i) => <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-600">{m}</span>)}</div></div>
                {websiteConfig?.showPoweredBy && (
                  <a href="https://systemnextit.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1">
                    Powered by <span className="font-semibold">System Next IT</span><ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
      <FloatingChatButton websiteConfig={websiteConfig} onOpenChat={onOpenChat} />
    </>
  );
};

export const StoreFooter: React.FC<StoreFooterProps> = (props) => {
  const style = props.websiteConfig?.footerStyle || 'style1';
  
  switch (style) {
    case 'style2':
      return <FooterStyle2 {...props} />;
    case 'style3':
      return <FooterStyle3 {...props} />;
    case 'style4':
      return <FooterStyle4 {...props} />;
    case 'style5':
      return <FooterStyle5 {...props} />;
    case 'style1':
    default:
      return <FooterStyle1 {...props} />;
  }
};
