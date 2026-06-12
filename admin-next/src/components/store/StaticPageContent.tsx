import React from 'react';
import type { WebsiteConfig } from '../../types';

interface StaticPageContentProps {
  websiteConfig?: WebsiteConfig;
}

// Map URLs to content keys and titles
const staticPageMap: Record<string, { key: keyof WebsiteConfig; title: string }> = {
  'about': { key: 'aboutUs', title: 'About Us' },
  'about-us': { key: 'aboutUs', title: 'About Us' },
  'privacy': { key: 'privacyPolicy', title: 'Privacy Policy' },
  'privacy-policy': { key: 'privacyPolicy', title: 'Privacy Policy' },
  'terms': { key: 'termsAndConditions', title: 'Terms and Conditions' },
  'termsnconditions': { key: 'termsAndConditions', title: 'Terms and Conditions' },
  'terms-and-conditions': { key: 'termsAndConditions', title: 'Terms and Conditions' },
  'returnpolicy': { key: 'returnPolicy', title: 'Return & Cancellation Policy' },
  'return-policy': { key: 'returnPolicy', title: 'Return & Cancellation Policy' },
  'refund': { key: 'returnPolicy', title: 'Refund Policy' },
  'refund-policy': { key: 'returnPolicy', title: 'Refund Policy' },
  'contact': { key: 'contactInfo', title: 'Contact Us' },
};

export const getStaticPageInfo = (path: string) => {
  const cleanPath = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return staticPageMap[cleanPath] || null;
};

export const StaticPageContent: React.FC<StaticPageContentProps> = ({ websiteConfig }) => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const pageInfo = getStaticPageInfo(pathname);

  if (!pageInfo) return null;

  const content = websiteConfig?.[pageInfo.key] as string | undefined;
  const isTermsPage = pageInfo.key === 'termsAndConditions';
  const isReturnPage = pageInfo.key === 'returnPolicy';
  const isPolicyPage = isTermsPage || isReturnPage;
  const policyBadge = isTermsPage ? 'Legal Terms' : isReturnPage ? 'Returns & Refunds' : 'Information';
  const richTextClassName = isPolicyPage
    ? 'prose max-w-none leading-7 text-[#244868] prose-headings:text-[#0E4C92] prose-headings:font-semibold prose-headings:leading-tight prose-p:text-[#244868] prose-p:my-4 prose-p:text-justify prose-li:text-[#244868] prose-li:text-justify prose-strong:text-[#0E4C92] prose-a:text-[#C46300] prose-a:no-underline hover:prose-a:underline prose-ul:marker:text-[#0E4C92] prose-ol:marker:text-[#0E4C92] [&_*]:break-words [&_*]:[overflow-wrap:anywhere] [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_img]:h-auto [&_img]:max-w-full'
    : 'prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-theme-primary [&_*]:break-words [&_*]:[overflow-wrap:anywhere]';

  const onHomeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.location.href = '/';
  };

  return (
      <><div className={`px-4 py-3 border-b ${isPolicyPage ? 'bg-[#EAF4FF] border-[#B9D9FF]' : 'bg-gray-50 border-gray-200'}`}>
      <button onClick={onHomeClick} className={`px-4 py-2.5 rounded-xl transition-all inline-flex items-center ${isPolicyPage ? 'bg-white text-[#0E4C92] border border-[#B9D9FF] hover:bg-[#F5FAFF] hover:shadow-sm' : 'hover:bg-white/80 hover:text-theme-primary hover:shadow-sm'}`}><img src="https://cdn-icons-png.flaticon.com/512/93/93634.png" alt="Back to Home" className="w-5 h-5 mr-2 inline-block" />Back to Home</button>
    </div>
    <div className={`min-h-[60vh] py-8 md:py-12 ${isPolicyPage ? 'bg-[#F3F9FF]' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl border p-6 md:p-10 ${isPolicyPage ? 'bg-white border-[#B9D9FF] shadow-[0_8px_30px_rgba(14,76,146,0.08)]' : 'bg-white border-gray-200 shadow-sm'}`}>
            {isPolicyPage && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-[#FFBC7A] bg-[#FFF3E8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#C46300]">
                  {policyBadge}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#B9D9FF] bg-[#EAF4FF] px-3 py-1 text-xs font-medium text-[#0E4C92]">
                  Last updated information from store settings
                </span>
              </div>
            )}

            <h1 className={`text-2xl md:text-3xl font-bold mb-6 pb-4 border-b leading-tight ${isPolicyPage ? 'text-[#0E4C92] border-[#B9D9FF]' : 'text-gray-900 border-gray-200'}`}>
              {pageInfo.title}
            </h1>
            {content ? (
              <>
                <div
                  className={richTextClassName}
                  dangerouslySetInnerHTML={{ __html: content }} />
                {/* render chat support info on contact page if available */}
                {pageInfo.key === 'contactInfo' && (
                  <div className={`mt-8 border-t pt-6 ${isPolicyPage ? 'border-[#B9D9FF]' : ''}`}>
                    <h2 className={`text-xl font-semibold mb-4 ${isPolicyPage ? 'text-[#0E4C92]' : 'text-gray-900'}`}>Chat Support</h2>
                    <div className="space-y-2 text-gray-700">
                      {websiteConfig?.chatSupportPhone && (
                        <div>
                          <strong>Phone:</strong>{' '}
                          <a
                            href={`tel:${websiteConfig.chatSupportPhone}`}
                            className={isPolicyPage ? 'text-[#C46300] hover:underline' : 'text-theme-primary hover:underline'}
                          >
                            {websiteConfig.chatSupportPhone}
                          </a>
                        </div>
                      )}
                      {websiteConfig?.chatSupportWhatsapp && (
                        <div>
                          <strong>WhatsApp:</strong>{' '}
                          <a
                            href={websiteConfig.chatSupportWhatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={isPolicyPage ? 'text-[#C46300] hover:underline' : 'text-theme-primary hover:underline'}
                          >
                            {websiteConfig.chatSupportWhatsapp}
                          </a>
                        </div>
                      )}
                      {websiteConfig?.chatSupportMessenger && (
                        <div>
                          <strong>Messenger:</strong>{' '}
                          <a
                            href={websiteConfig.chatSupportMessenger}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={isPolicyPage ? 'text-[#C46300] hover:underline' : 'text-theme-primary hover:underline'}
                          >
                            {websiteConfig.chatSupportMessenger}
                          </a>
                        </div>
                      )}
                      {!websiteConfig?.chatSupportPhone &&
                        !websiteConfig?.chatSupportWhatsapp &&
                        !websiteConfig?.chatSupportMessenger && (
                          <p className="text-gray-500">No chat support information provided.</p>
                        )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-12 ${isPolicyPage ? 'text-[#2E5A84]' : 'text-gray-500'}`}>
                <p className="text-lg">Content coming soon...</p>
                <p className="text-sm mt-2">Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div></>
  );
};

export default StaticPageContent;
