import React, { useState, useRef, useEffect } from 'react';
import { Truck, CreditCard, MessageCircle, Link2, MessageSquare, Coins, Store, User, Camera, RefreshCw, Download, ChevronRight, Lock, Image as ImageIcon, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useComingSoon } from '../services/CommingSoon';
import IncompleteOrder from '../components/NewComponentMentItem';
import { GalleryPicker } from '../components/GalleryPicker';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { convertFileToWebP, dataUrlToFile } from '../services/imageUtils';
import { uploadPreparedImageToServer } from '../services/imageUploadService';
import { useDarkMode } from '../context/DarkModeContext';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

// Settings card - Mobile responsive with flexbox
const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, icon, onClick }) => (
  <button 
    onClick={onClick} 
    className="bg-white rounded-lg w-full border-none cursor-pointer text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] p-3 sm:p-4 min-h-[90px] sm:min-h-[120px] flex flex-col relative overflow-hidden dark:bg-gray-800 dark:text-gray-200"
  >
    {/* Icon container - positioned top right */}
    <div 
      className="absolute right-2 to p-2 sm:right-4 sm:to p-4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center"
      style={{
        background: 'linear-gradient(to right, rgba(255,156,27,0.04), rgba(255,106,1,0.04))',
      }}
    >
      <div className="scale-50 sm:scale-75 md:scale-100">
        {icon}
      </div>
    </div>
    
    {/* Text content - flexible width to avoid icon */}
    <div className="flex flex-col gap-0.5 sm:gap-1 pr-14 sm:pr-20 md:pr-24">
      {/* Title */}
      <p className="font-semibold text-xs sm:text-sm md:text-base text-black m-0 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {title}
      </p>
      
      {/* Description */}
      <p className="font-normal text-[9px] sm:text-[10px] md:text-xs text-gray-700 m-0 leading-snug line-clamp-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {description}
      </p>
    </div>
  </button>
);

// SVG Icons matching Figma orange gradient style
    const DeliveryIcon = () => (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M39 35C39 37.7614 36.7614 40 34 40C31.2386 40 29 37.7614 29 35C29 32.2386 31.2386 30 34 30C36.7614 30 39 32.2386 39 35Z" stroke="url(#paint0_linear_795_944)" strokeWidth="2.5"/>
    <path d="M19 35C19 37.7614 16.7614 40 14 40C11.2386 40 9 37.7614 9 35C9 32.2386 11.2386 30 14 30C16.7614 30 19 32.2386 19 35Z" stroke="url(#paint1_linear_795_944)" strokeWidth="2.5"/>
    <path d="M29 35H19M30 31V14C30 11.1716 30 9.75736 29.1214 8.87868C28.2426 8 26.8284 8 24 8H10C7.17158 8 5.75736 8 4.87868 8.87868C4 9.75736 4 11.1716 4 14V30C4 31.8692 4 32.8038 4.40192 33.5C4.66522 33.956 5.04394 34.3348 5.5 34.598C6.19616 35 7.13076 35 9 35M31 13H34.6028C36.2622 13 37.0918 13 37.7796 13.3894C38.4672 13.7788 38.8942 14.4902 39.7478 15.913L43.145 21.575C43.5698 22.283 43.7822 22.6372 43.8912 23.0302C44 23.4232 44 23.836 44 24.662V30C44 31.8692 44 32.8038 43.598 33.5C43.3348 33.956 42.956 34.3348 42.5 34.598C41.8038 35 40.8692 35 39 35" stroke="url(#paint2_linear_795_944)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 14V21.9996M21 14V21.9996" stroke="url(#paint3_linear_795_944)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
    <linearGradient id="paint0_linear_795_944" x1="34" y1="30" x2="34" y2="40" gradientUnits="userSpaceOnUse">
    <stop stopColor="#FF6A00"/>
    <stop offset="1" stopColor="#FF9F1C"/>
    </linearGradient>
    <linearGradient id="paint1_linear_795_944" x1="14" y1="30" x2="14" y2="40" gradientUnits="userSpaceOnUse">
    <stop stopColor="#FF6A00"/>
    <stop offset="1" stopColor="#FF9F1C"/>
    </linearGradient>
    <linearGradient id="paint2_linear_795_944" x1="24" y1="8" x2="24" y2="35" gradientUnits="userSpaceOnUse">
    <stop stopColor="#FF6A00"/>
    <stop offset="1" stopColor="#FF9F1C"/>
    </linearGradient>
    <linearGradient id="paint3_linear_795_944" x1="17" y1="14" x2="17" y2="21.9996" gradientUnits="userSpaceOnUse">
    <stop stopColor="#FF6A00"/>
    <stop offset="1" stopColor="#FF9F1C"/>
    </linearGradient>
    </defs>
    </svg>

    );

const PaymentIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 17H34" stroke="url(#pay_gradient)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 33H16" stroke="url(#pay_gradient)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 33H30" stroke="url(#pay_gradient)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M44 24.68V33.02C44 39.4 41.4 42 35.02 42H12.98C6.6 42 4 39.4 4 33.02V14.98C4 8.6 6.6 6 12.98 6H25.02" 
      stroke="url(#pay_gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M38 18C41.3137 18 44 15.3137 44 12C44 8.68629 41.3137 6 38 6C34.6863 6 32 8.68629 32 12C32 15.3137 34.6863 18 38 18Z" 
      stroke="url(#pay_gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M38 9V15" stroke="url(#pay_gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 12H41" stroke="url(#pay_gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="pay_gradient" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff9c1b"/>
        <stop offset="1" stopColor="#ff6a01"/>
      </linearGradient>
    </defs>
  </svg>
);

const MarketingIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 40L14.8257 35.1742M14.8257 35.1742C16.4343 36.7828 18.6565 37.7778 21.1112 37.7778C26.0204 37.7778 30 33.798 30 28.8888C30 23.9796 26.0204 20 21.1112 20C16.2019 20 12.2222 23.9796 12.2222 28.8888C12.2222 31.3434 13.2171 33.5658 14.8257 35.1742Z" stroke="url(#paint0_linear_795_961)" strokeWidth="2.5" strokeLinecap="round"/>
<path d="M6 30.3754C4.72788 28.1828 4 25.6382 4 22.9246C4 14.682 10.7157 8 19 8H29C37.2842 8 44 14.682 44 22.9246C44 29.4228 39.826 34.9512 34 37" stroke="url(#paint1_linear_795_961)" strokeWidth="2.5" strokeLinecap="round"/>
<defs>
<linearGradient id="paint0_linear_795_961" x1="20" y1="20" x2="20" y2="40" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
<linearGradient id="paint1_linear_795_961" x1="24" y1="8" x2="24" y2="37" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
</defs>
</svg>

);

const DomainIcon = () => (
 <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.043 28.8712L28.869 19.0452" stroke="url(#paint0_linear_795_969)" strokeWidth="2.5" strokeLinecap="round"/>
<path d="M25.137 30.2168C26.6164 32.4976 26.2216 34.8356 24.5126 36.5446L18.5222 42.535C16.5654 44.4918 13.3928 44.4918 11.436 42.535L5.46371 36.5628C3.50689 34.606 3.50689 31.4334 5.46371 29.4766L11.4541 23.486C12.858 22.0822 15.5262 21.2714 17.8192 22.9318M30.2166 25.137C32.4974 26.6164 34.8354 26.2218 36.5444 24.5128L42.5348 18.5223C44.4916 16.5655 44.4916 13.3928 42.5348 11.436L36.5626 5.46371C34.6058 3.50689 31.4332 3.50689 29.4764 5.46371L23.4858 11.4542C22.082 12.8581 21.2714 15.5263 22.9318 17.8192" stroke="url(#paint1_linear_795_969)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
<defs>
<linearGradient id="paint0_linear_795_969" x1="23.956" y1="19.0452" x2="23.956" y2="28.8712" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
<linearGradient id="paint1_linear_795_969" x1="23.9993" y1="3.99609" x2="23.9993" y2="44.0026" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
</defs>
</svg>

);

const SMSIcon = () => (
 <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 17H33M15 25H26" stroke="url(#paint0_linear_795_976)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M44 21C44 19.4584 43.973 17.9536 43.9218 16.5006C43.7544 11.7537 43.6706 9.38018 41.7398 7.4349C39.8092 5.48962 37.3686 5.3852 32.4876 5.17638C29.8096 5.0618 26.9582 5 24 5C21.0418 5 18.1903 5.0618 15.5124 5.17638C10.6314 5.3852 8.1909 5.48962 6.26014 7.4349C4.32938 9.38018 4.24564 11.7537 4.07818 16.5006C4.02692 17.9536 4 19.4584 4 21C4 22.5416 4.02692 24.0464 4.07818 25.4994C4.24564 30.2464 4.32938 32.6198 6.26014 34.5652C8.1909 36.5104 10.6315 36.6148 15.5126 36.8236C16.9804 36.8864 18.5003 36.9334 20.0614 36.963C21.5436 36.991 22.2848 37.0052 22.936 37.2532C23.5872 37.5012 24.135 37.971 25.231 38.9106L29.59 42.6484C29.8546 42.8752 30.1916 43 30.5402 43C31.3464 43 32 42.3464 32 41.5402V36.8438C32.1632 36.8372 32.3258 36.8306 32.4876 36.8236C37.3686 36.6148 39.8092 36.5104 41.7398 34.565C43.6706 32.6198 43.7544 30.2464 43.9218 25.4994C43.973 24.0464 44 22.5416 44 21Z" stroke="url(#paint1_linear_795_976)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
<defs>
<linearGradient id="paint0_linear_795_976" x1="24" y1="17" x2="24" y2="25" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
<linearGradient id="paint1_linear_795_976" x1="24" y1="5" x2="24" y2="43" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
</defs>
</svg>

);

const RewardIcon = () => (
 <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28 36C36.8366 36 44 28.8366 44 20C44 11.1634 36.8366 4 28 4C19.1634 4 12 11.1634 12 20C12 28.8366 19.1634 36 28 36Z" stroke="url(#paint0_linear_1343_118)" strokeWidth="3" strokeLinecap="round"/>
<path d="M26.3338 41.9379C24.126 43.2479 21.5484 44.0001 18.795 44.0001C10.6239 44.0001 4 37.3761 4 29.2051C4 26.4517 4.75214 23.8741 6.06214 21.6663" stroke="url(#paint1_linear_1343_118)" strokeWidth="3" strokeLinecap="round"/>
<defs>
<linearGradient id="paint0_linear_1343_118" x1="28" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
<linearGradient id="paint1_linear_1343_118" x1="15.1669" y1="21.6663" x2="15.1669" y2="44.0001" gradientUnits="userSpaceOnUse">
<stop stopColor="#FF6A00"/>
<stop offset="1" stopColor="#FF9F1C"/>
</linearGradient>
</defs>
</svg>

);

const CourierIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 12H28V32H8V12Z" stroke="url(#courier_gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 18H34L40 24V32H28V18Z" stroke="url(#courier_gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="36" r="4" stroke="url(#courier_gradient)" strokeWidth="2.5"/>
    <circle cx="34" cy="36" r="4" stroke="url(#courier_gradient)" strokeWidth="2.5"/>
    <path d="M12 20H20M12 24H18" stroke="url(#courier_gradient)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="courier_gradient" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6A00"/>
        <stop offset="1" stopColor="#FF9F1C"/>
      </linearGradient>
    </defs>
  </svg>
);

const GoogleConsoleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.611 20.083H42V20H24V28H35.303C33.654 32.657 29.223 36 24 36C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24C4 35.045 12.955 44 24 44C35.045 44 44 35.045 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#FFC107"/>
    <path d="M6.30566 14.691L12.877 19.51C14.655 15.108 18.961 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.30566 14.691Z" fill="#FF3D00"/>
    <path d="M24 44C29.166 44 33.86 42.023 37.409 38.808L31.219 33.57C29.2112 35.1484 26.7339 36.002 24.0002 36C18.7972 36 14.3812 32.683 12.717 28.054L6.19522 33.079C9.50522 39.556 16.227 44 24 44Z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24V28H35.303C34.511 30.237 33.072 32.166 31.216 33.571L31.219 33.569L37.409 38.807C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#1976D2"/>
  </svg>
);

const SeoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 40L14.8257 35.1742M14.8257 35.1742C16.4343 36.7828 18.6565 37.7778 21.1112 37.7778C26.0204 37.7778 30 33.798 30 28.8888C30 23.9796 26.0204 20 21.1112 20C16.2019 20 12.2222 23.9796 12.2222 28.8888C12.2222 31.3434 13.2171 33.5658 14.8257 35.1742Z" stroke="url(#seo_gradient)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 8H40M8 16H32M8 24H20" stroke="url(#seo_gradient)" strokeWidth="2.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="seo_gradient" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6A00"/>
        <stop offset="1" stopColor="#FF9F1C"/>
      </linearGradient>
    </defs>
  </svg>
);

interface AdminSettingsNewProps {
  onNavigate: (page: string) => void;
  courierConfig?: any;
  onUpdateCourierConfig?: (config: any) => void;
  activeTenant?: any;
  logo?: string | null;
  onUpdateLogo?: (logo: string | null) => void;
  users?: any[];
  roles?: any[];
  onAddUser?: (user: any) => Promise<void>;
  onUpdateUser?: (userId: string, updates: any) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onAddRole?: (role: any) => Promise<void>;
  onUpdateRole?: (roleId: string, updates: any) => Promise<void>;
  onDeleteRole?: (roleId: string) => Promise<void>;
  onUpdateUserRole?: (userEmail: string, roleId: string) => Promise<void>;
  userPermissions?: Record<string, string[]>;
  onUpgrade?: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    phone?: string;
    username?: string;
    address?: string;
    avatar?: string;
    image?: string;
    role?: string;
    createdAt?: string;
  };
  onUpdateProfile?: (updates: any) => void;
  initialTab?: 'manage_shop' | 'profile_details';
}

// Figma Design Styles
const createFigmaStyles = (isDark: boolean) => ({
  container: {
    background: isDark ? '#111827' : '#f9f9f9',
    minHeight: '100vh',
    padding: '0',
    fontFamily: "'Poppins', sans-serif",
  },
  headerCard: {
    background: isDark ? '#1f2937' : '#ffffff',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  title: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '22px',
    color: '#023337',
    letterSpacing: '0.11px',
    margin: 0,
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start',
  },
  tab: {
    display: 'flex',
    gap: '4px',
    height: '40px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    background: 'white',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
  },
  tabActive: {
    borderBottom: '2px solid #38bdf8',
  },
  tabTextActive: {
    background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 500,
  },
  tabTextInactive: {
    color: 'black',
    fontWeight: 400,
  },
  profileCard: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '14px',
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  profileTitle: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '22px',
    color: '#023337',
    letterSpacing: '0.11px',
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  resetButton: {
    display: 'flex',
    gap: '4px',
    height: '40px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  resetButtonText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    color: '#020202',
    letterSpacing: '-0.32px',
  },
  saveButton: {
    display: 'flex',
    gap: '4px',
    height: '40px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  saveButtonText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    color: 'white',
    letterSpacing: '-0.32px',
  },
  avatarSection: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '14px',
  },
  avatarContainer: {
    position: 'relative' as const,
    width: '112px',
    height: '112px',
  },
  avatar: {
    width: '112px',
    height: '112px',
    borderRadius: '482px',
    background: '#f4f4f4',
    objectFit: 'cover' as const,
  },
  cameraButton: {
    position: 'absolute' as const,
    top: '4px',
    right: '-3px',
    width: '30px',
    height: '30px',
    borderRadius: '37px',
    background: '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  userName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '20px',
    color: 'black',
    margin: 0,
  },
  userRole: {
    display: 'flex',
    gap: '9px',
    alignItems: 'center',
  },
  roleText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: 'black',
  },
  sinceBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1px 8px',
    border: '1px solid #ff6a00',
    borderRadius: '24px',
    background: 'white',
  },
  sinceBadgeText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '12px',
    background: 'linear-gradient(to bottom, #ff6a00, #ff9f1c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  formContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  formLeft: {
    gridColumn: 'span 2',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formRow: {
    display: 'contents',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formLabel: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#023337',
    margin: 0,
  },
  formInput: {
    width: '100%',
    height: '42px',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  formRight: {
    gridColumn: 'span 1',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  addressInput: {
    width: '100%',
    height: '90px',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    resize: 'none' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  changePasswordButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '42px',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  changePasswordLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  changePasswordText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: 'black',
  },
});

const AdminSettingsNew: React.FC<AdminSettingsNewProps> = ({ onNavigate, currentUser, onUpdateProfile, activeTenant, initialTab }) => {
  const { isDarkMode } = useDarkMode();
  const figmaStyles = createFigmaStyles(isDarkMode);
  const authState = useAuth();
  const [activeTab, setActiveTab] = useState<'manage_shop' | 'profile_details'>(initialTab || 'manage_shop');
  const { showComingSoon, ComingSoonPopup } = useComingSoon();
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.image || currentUser?.avatar || null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Sync form with currentUser when it loads/changes
  useEffect(() => {
    if (currentUser && !hasInitialized.current) {
      setProfileForm({
        name: currentUser.name || '',
        username: currentUser.username || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
      });
      setAvatarPreview(currentUser.image || currentUser.avatar || null);
      hasInitialized.current = true;
    }
  }, [currentUser]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProfile();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
  
  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const tenantId = activeTenant?.tenantId || activeTenant?.id || '';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    try {
      // Convert to WebP for optimization
      const webpDataUrl = await convertFileToWebP(file, { quality: 0.85, maxDimension: 400 });
      
      // Upload to server
      if (tenantId) {
        const webpFile = dataUrlToFile(webpDataUrl, `profile-${Date.now()}.webp`);
        const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'gallery');
        setAvatarPreview(uploadedUrl);
        toast.success('Photo uploaded - save to apply');
      } else {
        // Fallback to base64 if no tenant
        setAvatarPreview(webpDataUrl);
        toast.success('Photo ready - save to apply');
      }
    } catch (error) {
      toast.error('Failed to upload photo');
      console.error('Avatar upload error:', error);
    }
    setIsUploadingAvatar(false);
    if (e.target) e.target.value = '';
  };

  const handleGallerySelect = (imageUrl: string) => {
    setAvatarPreview(imageUrl);
    setIsGalleryOpen(false);
    toast.success('Photo selected - save to apply');
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          username: profileForm.username,
          phone: profileForm.phone,
          email: profileForm.email,
          address: profileForm.address,
          image: avatarPreview,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Also call the legacy handler if exists
      if (onUpdateProfile) {
        await onUpdateProfile({
          ...profileForm,
          image: avatarPreview,
        });
      }
      
      toast.success('Profile saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    }
    setIsSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 9) {
      toast.error('Password must be at least 9 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      toast.success('Password changed successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
    setIsChangingPassword(false);
  };

  const handleResetProfile = () => {
    setProfileForm({
      name: currentUser?.name || '',
      username: currentUser?.username || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      address: currentUser?.address || '',
    });
    setAvatarPreview(currentUser?.image || currentUser?.avatar || null);
    toast.success('Form reset to original values');
  };

  const formatSinceDate = () => {
    if (currentUser?.createdAt) {
      const date = new Date(currentUser.createdAt);
      return `Since ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return 'Since 5 Jan 2020';
  };
  const settingsCards = [
    {
      title: 'Delivery Charge',
      description: "Manage your shop's delivery settings to ensure smooth and efficient order fulfillment.",
      icon: <DeliveryIcon />,
      navigateTo: 'settings_delivery',
    },
    {
      title: 'Payment Gateway',
      description: 'Integrate and manage payment options to provide customers with secure and flexible transaction methods.',
      icon: <PaymentIcon />,
      navigateTo: 'settings_payment',
    },
    {
      title: 'Marketing Integrations',
      description: "Enhance your shop's visibility by Google Tag Manager, Facebook Pixel, TikTok Pixel, and SEO tools for better engagement.",
      icon: <MarketingIcon />,
      navigateTo: 'settings_marketing',
      isComingSoon: false,
    },
    {
      title: 'Shop Domain',
      description: "Manage your shop's core configurations, including domain setup and general settings.",
      icon: <DomainIcon />,
      navigateTo: 'settings_domain',
    },
    {
      title: 'SMS Support',
      description: 'Enable SMS notifications and support to keep your customers informed with real-time updates.',
      icon: <SMSIcon />,
      isComingSoon: true,
      navigateTo: 'sms_marketing',
    },
    {
      title: 'Reward Point',
      description: 'Enable SMS notifications and support to keep your customers informed with real-time updates.',
      icon: <RewardIcon />,
      isComingSoon: true,
      navigateTo: 'settings_rewards',
    },
    {
      title: 'Courier',
      description: 'Configure courier services like Steadfast and Pathao for seamless order delivery and tracking.',
      icon: <CourierIcon />,
      navigateTo: 'settings_courier',
    },
    {
      title: 'Google Console',
      description: 'Verify your store domain with Google Search Console so your shop appears in Google search results.',
      icon: <GoogleConsoleIcon />,
      navigateTo: 'settings_google_console',
    },
    {
      title: 'SEO Settings',
      description: 'Configure meta title, description, keywords, and schema markup to improve your shop visibility in search engines.',
      icon: <SeoIcon />,
      navigateTo: 'settings_seo',
    },
  ];

  return (
    <>
      <style>{`
        .profile-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15) !important;
        }
        .profile-input::placeholder {
          color: #9ca3af;
        }
        .change-password-btn:hover {
          background: #f3f4f6 !important;
          border-color: #0ea5e9 !important;
        }
        @media (max-width: 900px) {
          .profile-card {
            padding: 12px !important;
          }
          .profile-header {
            flex-direction: column !important;
            gap: 10px !important;
            align-items: stretch !important;
            margin-bottom: 12px !important;
          }
          .profile-button-group {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          .profile-avatar-section {
            align-items: flex-start !important;
          }
          .profile-form-container {
            grid-template-columns: 1fr !important;
          }
          .profile-form-left {
            grid-column: span 1 !important;
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .profile-tab-wrap {
            padding: 0 6px !important;
          }
          .profile-avatar-section {
            flex-direction: column !important;
          }
          .profile-avatar-meta {
            width: 100% !important;
          }
          .profile-title {
            font-size: 18px !important;
          }
          .profile-button-group {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={figmaStyles.container}>
      {/* Header Card with Tabs */}
      <div style={figmaStyles.headerCard}>
        <h1 style={figmaStyles.title}>Settings</h1>
        
        {/* Tabs */}
        <div style={figmaStyles.tabsContainer}>
          <button
            onClick={() => setActiveTab('manage_shop')}
            style={{
              ...figmaStyles.tab,
              ...(activeTab === 'manage_shop' ? figmaStyles.tabActive : {}),
            }}
          >
            <Store size={24} color={activeTab === 'manage_shop' ? '#38bdf8' : 'black'} />
            <span style={activeTab === 'manage_shop' ? figmaStyles.tabTextActive : figmaStyles.tabTextInactive}>
              Manage Shop
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile_details')}
            style={{
              ...figmaStyles.tab,
              ...(activeTab === 'profile_details' ? figmaStyles.tabActive : {}),
            }}
          >
            <User size={24} color={activeTab === 'profile_details' ? '#38bdf8' : 'black'} />
            <span style={activeTab === 'profile_details' ? figmaStyles.tabTextActive : figmaStyles.tabTextInactive}>
              Profile Details
            </span>
          </button>
        </div>
      </div>

      {/* Manage Shop Tab Content */}
      {activeTab === 'manage_shop' && (
        <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 clamp(6px, 2vw, 20px)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 dark:bg-gray-800 p-4 rounded-lg dark:text-gray-200">
            {settingsCards.map((card, index) => (
              <SettingsCard
                key={index}
                title={card.title}
                description={card.description}
                icon={card.icon}
                onClick={() => {
                  if (card.isComingSoon) {
                    showComingSoon(card.title);
                  } else {
                    onNavigate(card.navigateTo);
                  }
                }}
              />
            ))}
            {ComingSoonPopup}
          </div>

          {/* Incomplete Orders Section */}
          {/* <div className="mt-6">
            <IncompleteOrder tenantId={tenantId} />
          </div> */}
        </div>
      )}

      {/* Profile Details Tab Content */}
      {activeTab === 'profile_details' && (
        <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 clamp(6px, 2vw, 20px)' }} className="profile-tab-wrap">
          <div style={figmaStyles.profileCard} className="profile-card">
            {/* Profile Header */}
            <div style={figmaStyles.profileHeader} className="profile-header">
              <h2 style={figmaStyles.profileTitle} className="profile-title">Profile Details</h2>
              <div style={figmaStyles.buttonGroup} className="profile-button-group">
                <button onClick={handleResetProfile} style={figmaStyles.resetButton} disabled={isSaving}>
                  <RefreshCw size={18} color="#020202" />
                  <span style={figmaStyles.resetButtonText}>Reset</span>
                </button>
                <button onClick={handleSaveProfile} style={{...figmaStyles.saveButton, opacity: isSaving ? 0.7 : 1}} disabled={isSaving}>
                  <Download size={18} color="white" />
                  <span style={figmaStyles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            {/* Avatar Section */}
            <div style={figmaStyles.avatarSection} className="profile-avatar-section">
              <div style={{...figmaStyles.avatarContainer, position: 'relative'}}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={figmaStyles.avatar} />
                ) : (
                  <div style={{...figmaStyles.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6'}}>
                    <User size={48} color="#9ca3af" />
                  </div>
                )}
                {isUploadingAvatar && (
                  <div style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Loader2 size={24} className="animate-spin text-sky-500" />
                  </div>
                )}
                <div style={{position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 4}}>
                  <label style={{...figmaStyles.cameraButton, cursor: 'pointer'}}>
                    <Camera size={20} color="#666" />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    onClick={() => setIsGalleryOpen(true)}
                    style={{...figmaStyles.cameraButton, border: 'none', cursor: 'pointer'}}
                    title="Select from Gallery"
                  >
                    <ImageIcon size={20} color="#666" />
                  </button>
                </div>
              </div>
              <div style={figmaStyles.userInfo} className="profile-avatar-meta">
                <p style={figmaStyles.userName}>{profileForm.name}</p>
                <div style={figmaStyles.userRole}>
                  <span style={figmaStyles.roleText}>{currentUser?.role || 'Owner'}</span>
                  <div style={figmaStyles.sinceBadge}>
                    <span style={figmaStyles.sinceBadgeText}>{formatSinceDate()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div style={figmaStyles.formContainer} className="profile-form-container">
              {/* Left Column - 2 columns grid */}
              <div style={figmaStyles.formLeft} className="profile-form-left">
                <div style={figmaStyles.formGroup}>
                  <label style={figmaStyles.formLabel}>Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="profile-input"
                    style={figmaStyles.formInput}
                  />
                </div>
                <div style={figmaStyles.formGroup}>
                  <label style={figmaStyles.formLabel}>Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="Enter username"
                    className="profile-input"
                    style={figmaStyles.formInput}
                  />
                </div>
                <div style={figmaStyles.formGroup}>
                  <label style={figmaStyles.formLabel}>Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="profile-input"
                    style={figmaStyles.formInput}
                  />
                </div>
                <div style={figmaStyles.formGroup}>
                  <label style={figmaStyles.formLabel}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="profile-input"
                    style={figmaStyles.formInput}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div style={figmaStyles.formRight}>
                <div style={figmaStyles.formGroup}>
                  <label style={figmaStyles.formLabel}>Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Enter your address"
                    className="profile-input"
                    style={figmaStyles.addressInput}
                  />
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  style={figmaStyles.changePasswordButton}
                  className="change-password-btn"
                >
                  <div style={figmaStyles.changePasswordLeft}>
                    <Lock size={24} color="#0ea5e9" />
                    <span style={figmaStyles.changePasswordText}>Change Password</span>
                  </div>
                  <ChevronRight size={24} color="#666" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      <GalleryPicker
        isOpen={isGalleryOpen}
        onSelect={handleGallerySelect}
        onClose={() => setIsGalleryOpen(false)}
        multiple={false}
        title="Select Profile Photo"
      />

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 420,
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 18,
                margin: 0,
              }}>Change Password</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleChangePassword} style={{ padding: 20 }}>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                color: '#6b7280',
                marginBottom: 16,
              }}>
                Password must be at least 9 characters long.
              </p>

              {/* Old Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#374151',
                  marginBottom: 6,
                }}>Current Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 14,
                      outline: 'none',
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showOldPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#374151',
                  marginBottom: 6,
                }}>New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={9}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 14,
                      outline: 'none',
                    }}
                    placeholder="Min 9 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
                  </button>
                </div>
                {passwordForm.newPassword && passwordForm.newPassword.length < 9 && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                    Password must be at least 9 characters ({9 - passwordForm.newPassword.length} more needed)
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#374151',
                  marginBottom: 6,
                }}>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 14,
                    outline: 'none',
                  }}
                  placeholder="Re-enter new password"
                />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isChangingPassword || passwordForm.newPassword.length < 9 || passwordForm.newPassword !== passwordForm.confirmPassword}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: isChangingPassword ? '#9ca3af' : '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Lock size={18} />
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminSettingsNew;
