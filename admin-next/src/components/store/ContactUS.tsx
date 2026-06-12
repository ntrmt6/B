import React, { useState, useEffect } from 'react';
import type { WebsiteConfig } from '../../types';
import { DataService } from '../../services/DataService';

/**
 * Dynamic Multi-Tenant Contact Component
 * Features:
 * - Tenant-specific branding (Colors, Logos, Names)
 * - Dynamic Subject Lines based on tenant type
 * - Conditional rendering of contact methods
 * - Style-injection for dynamic brand colors
 */

interface ContactUSProps {
  tenantId?: string;
  websiteConfig?: WebsiteConfig | null;
  primaryColor?: string; // Optional override for primary color
  name?: string; // Optional override for tenant/store name
}

const ContactUS: React.FC<ContactUSProps> = ({ tenantId: propTenantId, websiteConfig: initialWebsiteConfig }) => {
  const [tenantId, setTenantId] = useState<string | undefined>(propTenantId);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(initialWebsiteConfig || null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState('idle');

  // Resolve tenantId if not passed in (localStorage or subdomain)
  useEffect(() => {
    if (tenantId) return;
    if (typeof window === 'undefined') return;
    // Preferred: active tenant in localStorage
    const active = localStorage.getItem('seven-days-active-tenant');
    if (active) {
      setTenantId(active);
      return;
    }
    // Fallback: derive from subdomain (e.g. tenant.example.com)
    try {
      const host = window.location.hostname;
      const parts = host.split('.');
      if (parts.length > 2) setTenantId(parts[0]);
    } catch {}
  }, [tenantId]);

  // Load websiteConfig when tenantId changes and no config provided
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initialWebsiteConfig) return;
      const tid = tenantId;
      if (!tid) return;
      try {
        const cfg = await DataService.getWebsiteConfig(tid);
        if (!cancelled) setWebsiteConfig(cfg || null);
      } catch (e) {
        console.warn('[ContactUS] failed to load websiteConfig', e);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId, initialWebsiteConfig]);

  // Reset form subject when websiteConfig loaded
  useEffect(() => {
    const defaultSubjects = ['General Inquiry', 'Order Support', 'Returns', 'Other'];
    const subjects = (websiteConfig as any)?.contactSubjects || defaultSubjects;
    setFormData(prev => ({ ...prev, subject: subjects?.[0] || defaultSubjects[0] }));
  }, [websiteConfig]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call to tenant-specific endpoint (should POST to tenant-scoped API)
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        const defaultSubjects = (websiteConfig as any)?.contactSubjects || ['General Inquiry'];
        setFormData({ name: '', email: '', subject: defaultSubjects[0], message: '' });
        setStatus('idle');
      }, 3000);
    }, 1500);
  };

  const Icons = {
    Mail: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    Phone: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    Loader: () => <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-500">
      {/* Header Section */}
      <header 
        style={{ backgroundColor: (websiteConfig?.themeColors?.primary as string) || '#334155' }}
        className="py-24 px-6 transition-colors duration-500"
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-5xl mb-6 transform hover:scale-110 transition-transform cursor-default">
            {websiteConfig?.websiteName?.[0] || '🏬'}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Contact {websiteConfig?.websiteName || websiteConfig?.storeName || 'Our Store'}
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {websiteConfig?.shortDescription || 'Get in touch with the store team.'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-12 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Dynamic Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
              <h2 className="text-xl font-bold mb-8 text-slate-800">Direct Channels</h2>
              
              <div className="space-y-10">
                {/* Email - Always exists */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${(websiteConfig?.themeColors?.primary as string) || '#334155'}15`, color: (websiteConfig?.themeColors?.primary as string) || '#334155' }}>
                    <Icons.Mail />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Support</p>
                    <p className="text-slate-800 font-semibold break-all">{websiteConfig?.emails?.[0] || websiteConfig?.shortDescription || 'support@store.example'}</p>
                  </div>
                </div>

                {/* Phone - Conditional */}
                {(websiteConfig?.phones?.[0] || websiteConfig?.chatSupportPhone) && (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
                      <Icons.Phone />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Call Center</p>
                      <p className="text-slate-800 font-semibold">{websiteConfig?.phones?.[0] || websiteConfig?.chatSupportPhone}</p>
                    </div>
                  </div>
                )}

                {/* Address - Always exists in mock but could be conditional */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
                    <Icons.MapPin />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                    <p className="text-slate-800 font-medium leading-relaxed italic">
                      {websiteConfig?.addresses?.[0] || 'No address provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Help Link (if provided in config) */}
              { (websiteConfig as any)?.helpCenterUrl && (
                <div className="mt-12 pt-8 border-t border-slate-100">
                   <a 
                    href={(websiteConfig as any).helpCenterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-all bg-slate-50/50"
                  >
                    <span className="text-sm font-bold text-slate-700">Browse Help Docs</span>
                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden h-full">
              
              {/* Success Overlay */}
              {status === 'success' && (
                <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                  <div 
                    style={{ backgroundColor: `${(websiteConfig?.themeColors?.primary as string) || '#334155'}20`, color: (websiteConfig?.themeColors?.primary as string) || '#334155' }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800">Thank You!</h3>
                  <p className="text-slate-500 mt-4 max-w-sm text-lg">
                    The {websiteConfig?.websiteName || websiteConfig?.storeName || 'store'} team has received your message and will be in touch shortly.
                  </p>
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-800 mb-8">Send an Inquiry</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Your Name</label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all"
                     style={{ '--tw-ring-color': (websiteConfig?.themeColors?.primary as string) || '#334155' } as React.CSSProperties}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all"
                     style={{ '--tw-ring-color': (websiteConfig?.themeColors?.primary as string) || '#334155' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Inquiry Topic</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all bg-white appearance-none cursor-pointer"
                    style={{ '--tw-ring-color': (websiteConfig?.themeColors?.primary as string) || '#334155' } as React.CSSProperties}
                  >
                    {((websiteConfig as any)?.contactSubjects || ['General Inquiry']).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={`How can we help your experience with ${websiteConfig?.websiteName || websiteConfig?.storeName || 'us'}?`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all resize-none"
                    style={{ '--tw-ring-color': (websiteConfig?.themeColors?.primary as string) || '#334155' } as React.CSSProperties}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{ backgroundColor: (websiteConfig?.themeColors?.primary as string) || '#334155' }}
                  className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Icons.Loader />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send to {websiteConfig?.websiteName || websiteConfig?.storeName || 'Store'}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Footer */}
      <footer className="text-center py-12 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {websiteConfig?.websiteName || websiteConfig?.storeName || tenantId || 'Store'}. Powered by MultiTenantCommerce.</p>
      </footer>
    </div>
  );
};

export default ContactUS;