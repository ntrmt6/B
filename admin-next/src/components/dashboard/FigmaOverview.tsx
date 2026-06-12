import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Icon URLs
const ICON_URLS = {
  totalProduct: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299040/37cbe9c7-7489-4eca-acf5-4297e1239d98.png',
  totalOrder: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299063/b9bb412c-4fee-4396-aeb6-e84795023817.png',
  lowStock: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299067/4d3812fe-5698-4a94-a762-cab5f2051a94.png',
  totalAmount: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299080/3e56db20-1dd3-4bcf-86f1-c654a54606ab.png',
  toReview: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299106/4f3d7667-c5b1-4034-af64-5e5303ae644b.png',
  totalStock: 'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299067/4d3812fe-5698-4a94-a762-cab5f2051a94.png'
};

interface StatCardProps {
  title: string;
  value: string | number;
  iconUrl: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, iconUrl }) => {
  return (
    <div className="bg-[#F5F5F5] dark:bg-gray-700 h-[68px] rounded-lg overflow-hidden flex items-center justify-between px-4">
      <div className="flex flex-col justify-center">
        <div className="text-black dark:text-white text-xl sm:text-2xl lg:text-xl sm:text-2xl lg:text-[28px] font-medium font-['Roboto'] leading-tight">{value}</div>
        <div className="text-black dark:text-gray-300 text-[13px] font-normal font-['Roboto']">{title}</div>
      </div>
      <div className="w-11 h-11 bg-white dark:bg-gray-600 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
        <img src={iconUrl} alt={title} className="w-8 h-8 object-contain" />
      </div>
    </div>
  );
};

// Combined Language and Date display component
const LanguageDateCard: React.FC<{
  currentLang: string;
  onLangChange: (lang: 'en' | 'bn') => void;
  date: string;
  dayName: string;
}> = ({ currentLang, onLangChange, date, dayName }) => {
  const { t } = useLanguage();
  return (
    <div style={{width: '100%', height: '100%', position: 'relative', background: '#F9F9F9', overflow: 'hidden', borderRadius: 8}}>
      {/* Language Selector - exact Figma design */}
      <div style={{left: 16, top: 10, position: 'absolute', color: 'black', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', wordWrap: 'break-word'}}>{t("language")}

        <div style={{width: 92, height: 26, left: 16, top: 32, position: 'absolute', background: 'rgba(255, 255, 255, 0)', overflow: 'hidden', borderRadius: 24, outline: '1px white solid', outlineOffset: '-1px'}}></div>
       
        <div style={{width: 43, height: 18, left: 4, top: 4, position: 'absolute', background: 'white', overflow: 'hidden', borderRadius: 20}}>

<div style={{left: 11, top: 5, position: 'absolute', textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', lineHeight: 111.25, wordWrap: 'break-word'}}>

          <button 
            onClick={() => onLangChange('en')}
            className={`w-[43px] h-[18px] left-[4px] top-[4px] absolute rounded-[20px] overflow-hidden transition-all ${
              currentLang === 'en' ? 'bg-white dark:bg-gray-500 shadow-sm' : 'bg-transparent'
            }`}
          >
            <span className="left-[11px] top-[3px] absolute text-black dark:text-white text-[10px] font-normal font-['Roboto']">Eng</span>
          </button>
          <button 
            onClick={() => onLangChange('bn')}
            className={`w-[43px] h-[18px] right-[2px] top-[4px] absolute rounded-[20px] overflow-hidden transition-all ${
              currentLang === 'bn' ? 'bg-white dark:bg-gray-500 shadow-sm' : 'bg-transparent'
            }`}
          >
            <div style={{left: 54, top: 9, position: 'absolute', textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', lineHeight: 111.25, wordWrap: 'break-word'}}>বাংলা</div>

          </button>
          </div>
        </div>
      </div>
      
      {/* Date Display - exact Figma design */}
      <div className="w-[122px] h-[68px] relative bg-[#F5F5F5] dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
        <div className="w-40 h-40 left-[26px] top-[22px] absolute bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
        <div className="left-[10px] top-[10px] absolute text-black dark:text-white text-[15px] font-medium font-['Roboto'] z-10">{date}</div>
        <div className="left-[67px] top-[34px] absolute text-white text-2xl font-medium font-['Roboto'] z-10">{dayName}</div>
      </div>
    </div>
  );
};

interface NotificationCardProps {
  title: string;
  images?: string[];
}

const NotificationCard: React.FC<NotificationCardProps> = ({ title, images }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Sample notification images if none provided
  const sampleImages = images || [
    'https://res.cloudinary.com/dvierzkzj/image/upload/v1779299197/04a67a6d-715d-4847-8b5f-4ab5f521e0aa.png',
  ];

  return (
    <div className="">
      <div className="text-black dark:text-white text-sm font-medium font-['Roboto'] mb-3">Important Notification</div>
      <div className="w-full h-24 bg-white dark:bg-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
        <img 
          className="w-full h-full object-contain p-2" 
          src="https://hdnfltv.com/image/nitimages/pasted_1770753032030.webp" 
          alt="Notification"
        />
      </div>
      <div className="flex justify-center items-center gap-1 mt-3">
        <div className="w-5 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
      </div>
    </div>
  );
};

interface FigmaOverviewProps {
  stats?: {
    totalProducts?: number;
    totalOrders?: number;
    totalAmount?: string;
    lowStock?: number;
    toReview?: number;
    totalStock?: number;
  };
  currentLang?: string;
  onLangChange?: (lang: 'en' | 'bn') => void;
  notificationImages?: string[];
}

const FigmaOverview: React.FC<FigmaOverviewProps> = ({
  stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalAmount: '৳0',
    lowStock: 0,
    toReview: 0,
    totalStock: 0
  },
  currentLang = 'en',
  onLangChange = () => {},
  notificationImages
}) => {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl mx-2 sm:mx-4 md:mx-6 p-4 sm:p-6 shadow-sm overflow-hidden">
      <h2 className="text-base font-semibold text-black dark:text-white mb-5 font-['Roboto']">Overview</h2>
      
      {/* Main grid - Cards + Notification */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        
        {/* Left side - 2 rows of cards */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-4">
            <StatCard
              title={t("total_products")}
              value={stats.totalProducts || 0}
              iconUrl={ICON_URLS.totalProduct}
            />
            
            <StatCard
              title={t("total_orders")}
              value={(stats.totalOrders || 0).toLocaleString()}
              iconUrl={ICON_URLS.totalOrder}
            />
            
            <LanguageDateCard 
              currentLang={currentLang} 
              onLangChange={onLangChange}
              date={currentDate}
              dayName={currentDay}
            />
          </div>
          
          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-4">
            <StatCard
              title={t("low_stock")}
              value={stats.lowStock || 0 }
              iconUrl={ICON_URLS.lowStock}
            />
            
            <StatCard
              title={t("total_amount")}
              value={stats.totalAmount || '৳0'}
              iconUrl={ICON_URLS.totalAmount}
            />
            
            {/* <StatCard
              title={t("total_stock")}
              value={(stats.totalStock ||  0).toLocaleString()}
              iconUrl={ICON_URLS.totalStock}
            /> */}
            
            <StatCard
              title={t("to_be_reviewed")}
              value={stats.toReview || 0}
              iconUrl={ICON_URLS.toReview}
            />
          </div>
        </div>
        
        {/* Right side - Notification card spans full height */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 self-stretch">
          <NotificationCard title="Important Notification" images={notificationImages} />
        </div>
      </div>
    </div>
  );
};

export default FigmaOverview;
