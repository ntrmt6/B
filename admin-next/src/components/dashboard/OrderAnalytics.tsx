import React, { useState, useEffect } from 'react';
import { useLanguage, formatNumber } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';
import { OrderAnalyticsProps } from './types';
import { getApiUrl } from '../../utils/appHelpers';

// Figma icon assets (hosted on CDN)
const ICONS = {
  productsOnHand: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299040/37cbe9c7-7489-4eca-acf5-4297e1239d98.png',
  totalOrders: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299067/4d3812fe-5698-4a94-a762-cab5f2051a94.png',
  reservedPrice: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299063/b9bb412c-4fee-4396-aeb6-e84795023817.png',
  lowStock: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299080/3e56db20-1dd3-4bcf-86f1-c654a54606ab.png',
  toBeReviewed: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299106/4f3d7667-c5b1-4034-af64-5e5303ae644b.png',
  netProfit: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299063/b9bb412c-4fee-4396-aeb6-e84795023817.png',
};

const StatCard = ({
  value,
  label,
  iconUrl,
  language,
}: {
  value: number | string;
  label: string;
  iconUrl: string;
  language: Language;
}) => (
  <div className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg min-h-[48px] xs:min-h-[52px] sm:h-[58px] flex items-center justify-between px-2 xs:px-2.5 sm:px-3 py-1.5 overflow-hidden">
    <div className="flex flex-col justify-center min-w-0">
      <span className="text-sm xs:text-base sm:text-lg lg:text-xl font-medium font-['Roboto'] leading-tight text-black dark:text-white truncate tabular-nums">
        {typeof value === 'number' ? formatNumber(value, language) : value}
      </span>
      <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium font-['Roboto'] text-black dark:text-gray-300 truncate">
        {label}
      </span>
    </div>
    <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
      <img src={iconUrl} alt={label} className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 object-contain" />
    </div>
  </div>
);

const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({
  totalProducts,
  totalOrders,
  totalRevenue,
  lowStockProducts,
  toBeReviewed,
  reservedPrice = 0,
  netProfit,
  notifications = [],
}) => {
  const { language, setLanguage: setLang, t } = useLanguage();
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [bannerNotifications, setBannerNotifications] = useState<Array<{ id: string; image: string; title: string; linkUrl?: string }>>([]);

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
  const currentDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  const netProfitValue = typeof netProfit === 'number' ? netProfit : totalRevenue - reservedPrice;

  // Fetch dashboard banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/notifications/dashboard-banners`);
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            const mapped = result.data.map((b: any) => ({
              id: b._id || b.id || String(Math.random()),
              image: b.imageUrl,
              title: b.title || '',
              linkUrl: b.linkUrl || ''
            }));
            setBannerNotifications(mapped);
          }
        }
      } catch (error) {
        // Silently fail - will show prop notifications or default
      }
    };
    fetchBanners();
  }, []);

  // Use fetched banners first, then prop notifications, then fallback default
  const displayNotifications =
    bannerNotifications.length > 0
      ? bannerNotifications
      : notifications.length > 0
        ? notifications
        : [{ id: '1', image: 'https://hdnfltv.com/image/nitimages/pasted_1770753032030.webp', title: 'গ্রিপ দিল পাতা' }];

  useEffect(() => {
    if (displayNotifications.length <= 1) return;
    const id = setInterval(() => {
      setCurrentNotificationIndex(prev => (prev + 1) % displayNotifications.length);
    }, 5000);
    return () => clearInterval(id);
  }, [displayNotifications.length]);

  return (
    <div className="w-full font-['Roboto']">
      {/* Title */}
      <h2 className="text-xs xs:text-sm font-semibold text-black dark:text-white mb-1.5 xs:mb-2 sm:mb-3 font-['Roboto']">
        Order Analytics
      </h2>

      {/* Body: left cards + right notification */}
      <div className="flex flex-col lg:flex-row gap-2 xs:gap-2.5">

        {/* Left: two rows of stat cards */}
        <div className="flex-1 flex flex-col gap-2 xs:gap-2.5 min-w-0">

          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3">
            {/* Products on Hands */}
            <StatCard
              value={totalProducts}
              label={t('products_on_hand') || 'Products on Hands'}
              iconUrl={ICONS.productsOnHand}
              language={language}
            />

            {/* Total Orders */}
            <StatCard
              value={totalOrders}
              label={t('total_orders') || 'Total Orders'}
              iconUrl={ICONS.totalOrders}
              language={language}
            />

            {/* Language Switcher */}
            <div className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg min-h-[48px] xs:min-h-[52px] sm:h-[58px] flex flex-col justify-center px-2 xs:px-2.5 sm:px-3 py-1.5 overflow-hidden">
              <span className="text-[12px] font-normal text-black dark:text-gray-300 mb-1.5">
                {t('language') || 'Language'}
              </span>
              <div className="w-[92px] h-[26px] rounded-[24px] border border-white dark:border-gray-500 flex items-center px-[3px] relative">
                {/* Active pill */}
                <div
                  className="absolute h-[18px] w-[43px] bg-white dark:bg-gray-500 rounded-[20px] transition-all duration-200 shadow-sm"
                  style={{ left: language === 'en' ? 3 : 46 }}
                />
                <button
                  onClick={() => setLang('en')}
                  className="relative z-10 flex-1 text-[12px] text-black dark:text-white text-center leading-[26px]"
                >
                  Eng
                </button>
                <button
                  onClick={() => setLang('bn')}
                  className="relative z-10 flex-1 text-[12px] text-black dark:text-white text-center leading-[26px]"
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Date / Day */}
            <div className="min-h-[48px] xs:min-h-[52px] sm:h-[58px]">
              <div className="w-full h-full relative bg-[#F9F9F9] dark:bg-gray-700 overflow-hidden rounded-lg">
                <div className="absolute w-[120px] h-[120px] xs:w-[140px] xs:h-[140px] sm:w-[160px] sm:h-[160px] left-5 top-4 xs:top-5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
                <div className="absolute left-2 xs:left-2.5 sm:left-3 top-2 xs:top-2.5 sm:top-3 text-sm xs:text-base font-medium font-['Roboto'] text-black dark:text-white">
                  {currentDate}
                </div>
                <div className="absolute left-[50px] xs:left-[55px] sm:left-[68px] top-7 xs:top-8 sm:top-[34px] text-lg xs:text-xl sm:text-2xl font-medium font-['Roboto'] text-white">
                  {currentDay}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-2.5">
            <StatCard
              value={reservedPrice || totalRevenue}
              label={t('reserved_price') || 'Reserved Price'}
              iconUrl={ICONS.reservedPrice}
              language={language}
            />
            <StatCard
              value={lowStockProducts}
              label={t('low_stock') || 'Low Stock'}
              iconUrl={ICONS.lowStock}
              language={language}
            />
            <StatCard
              value={toBeReviewed}
              label={t('to_be_reviewed') || 'To be Reviewed'}
              iconUrl={ICONS.toBeReviewed}
              language={language}
            />
            <StatCard
              value={`৳${formatNumber(netProfitValue, language)}`}
              label="Net Profit"
              iconUrl={ICONS.netProfit}
              language={language}
            />
            
          </div>
        </div>

        {/* Right: Important Notification */}
        <div className="w-full lg:w-[230px] flex-shrink-0">
          <div className="bg-[#f9f9f9] dark:bg-gray-700 rounded-lg h-full p-2.5 xs:p-3 flex flex-col">
            <span className="text-[10px] xs:text-[11px] font-normal text-black dark:text-gray-300 mb-1.5 xs:mb-2">
              Important Notification
            </span>

            {/* White notification card */}
            <div className="bg-white dark:bg-gray-600 rounded-[8px] overflow-hidden flex-1 flex flex-col items-center justify-center">
              {displayNotifications[currentNotificationIndex]?.image ? (
                displayNotifications[currentNotificationIndex]?.linkUrl ? (
                  <a
                    href={displayNotifications[currentNotificationIndex].linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                  >
                    <img
                      src={displayNotifications[currentNotificationIndex].image}
                      alt={displayNotifications[currentNotificationIndex]?.title || 'notification'}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </a>
                ) : (
                  <img
                    src={displayNotifications[currentNotificationIndex].image}
                    alt={displayNotifications[currentNotificationIndex]?.title || 'notification'}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )
              ) : (
                <span className="text-[11px] text-gray-400 p-2">
                  {displayNotifications[currentNotificationIndex]?.title}
                </span>
              )}
            </div>
            

            {/* Pagination dots */}
            <div className="flex justify-center items-center gap-1 mt-3">
              {displayNotifications.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentNotificationIndex(idx)}
                  className={`rounded-full transition-all ${
                    idx === currentNotificationIndex
                      ? 'w-5 h-2 bg-gradient-to-r from-sky-400 to-blue-500'
                      : 'w-[6px] h-[6px] bg-gray-300 dark:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderAnalytics;
