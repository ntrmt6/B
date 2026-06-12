import React, { useState, useRef, useEffect } from 'react';
import { Facebook, Phone, Home, MessageCircle, Menu, ShoppingCart, User, Grid, Search } from 'lucide-react';
import { User as UserType, WebsiteConfig } from '../../types';

const buildWhatsAppLink = (rawNumber?: string | null) => {
    if (!rawNumber) return null;
    const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
};

// Gradient Chat Icon Component - Blue to Pink gradient with white chat bubble
const GradientChatIcon = ({ size = 44 }: { size?: number }) => (
    <div 
        className="rounded-full flex items-center justify-center shadow-lg"
        style={{
            width: size,
            height: size,
            background: 'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 50%, #EC4899 100%)',
        }}
    >
        <MessageCircle size={size * 0.5} strokeWidth={2} className="text-white" />
    </div>
);

export interface MobileBottomNavProps {
    onHomeClick: () => void;
    onCartClick: () => void;
    onAccountClick: () => void;
    onChatClick?: () => void;
    onMenuClick?: () => void;
    cartCount?: number;
    websiteConfig?: WebsiteConfig;
    activeTab?: string;
    user?: UserType | null;
    onLogoutClick?: () => void;
}

// Style 1: Default - Clean Modern Design with Glassmorphism and elevated Home button
const BottomNavStyle1: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, onChatClick, onMenuClick, websiteConfig, activeTab = 'home'
}) => {
    const facebookLinkRaw = websiteConfig?.socialLinks?.find((link) => {
        const platformKey = (link.platform || '').toLowerCase();
        return platformKey.includes('facebook') || platformKey === 'fb';
    })?.url?.trim();
    const facebookLink = facebookLinkRaw ? (/^https?:\/\//i.test(facebookLinkRaw) ? facebookLinkRaw : `https://${facebookLinkRaw.replace(/^\/+/, '')}`) : null;
    const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
    const chatEnabled = websiteConfig?.chatEnabled ?? true;
    const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-white/90 backdrop-blur-2xl border-t border-white/50 shadow-[0_-8px_32px_rgba(31,38,135,0.15)] py-2 px-1 flex justify-around items-center md:hidden z-50 pb-safe h-[60px]">
            {chatEnabled && onChatClick ? (
                <button onClick={onChatClick} className={`flex flex-col items-center gap-0.5 transition w-1/5 group ${activeTab === 'chat' ? 'scale-110' : 'hover:scale-110'}`}>
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-600">Chat</span>
                </button>
            ) : chatFallbackLink ? (
                <a href={chatFallbackLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-600">Chat</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5 opacity-50" type="button" disabled>
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-400">Chat</span>
                </button>
            )}
            {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md border border-gray-200/60 flex items-center justify-center group-hover:bg-white transition-colors shadow-md">
                        <Phone size={24} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">Call</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5" type="button" disabled>
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center"><Phone size={24} className="text-gray-300" /></div>
                    <span className="text-[10px] font-medium text-gray-300">Call</span>
                </button>
            )}
            <button onClick={onHomeClick} className={`flex flex-col items-center transition w-1/5 group ${activeTab === 'home' ? 'scale-110' : 'hover:scale-110'}`}>
                <div className="w-16 h-16 rounded-full bg-theme-primary flex items-center justify-center shadow-lg shadow-theme-primary/30 group-hover:shadow-theme-primary/50 group-active:scale-95 transition-all border-4 border-white transform -translate-y-2">
                    <Home size={28} strokeWidth={2.5} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-theme-primary mt-0.5">Home</span>
            </button>
            {facebookLink ? (
                <a href={facebookLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md border border-gray-200/60 flex items-center justify-center group-hover:bg-white transition-colors shadow-md">
                        <Facebook size={24} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">Page</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5" type="button" disabled>
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center"><Facebook size={24} className="text-gray-300" /></div>
                    <span className="text-[10px] font-medium text-gray-300">Page</span>
                </button>
            )}
            <button onClick={onMenuClick} className={`flex flex-col items-center gap-0.5 transition w-1/5 group ${activeTab === 'menu' ? 'scale-110' : 'hover:scale-110'}`}>
                <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md border border-gray-200/60 flex items-center justify-center group-hover:bg-white transition-colors shadow-md">
                    <Menu size={24} className="text-gray-600" />
                </div>
                <span className="text-[10px] font-medium text-gray-500">Menu</span>
            </button>
        </div>
    );
};

// Style 2: Minimal Flat - Clean flat design with subtle indicators
const BottomNavStyle2: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, onCartClick, onAccountClick, onMenuClick, cartCount, activeTab = 'home'
}) => (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center md:hidden z-50 pb-safe h-[56px]">
        <button onClick={onHomeClick} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-theme-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">Home</span>
            {activeTab === 'home' && <div className="w-1 h-1 bg-theme-primary rounded-full" />}
        </button>
        <button onClick={onMenuClick} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'categories' ? 'text-theme-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <Grid size={22} strokeWidth={activeTab === 'categories' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">Categories</span>
        </button>
        <button onClick={onCartClick} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'cart' ? 'text-theme-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
                <ShoppingCart size={22} strokeWidth={activeTab === 'cart' ? 2.5 : 1.8} />
                {(cartCount ?? 0) > 0 && <span className="absolute -to p-1.5 -right-1.5 bg-theme-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
        </button>
        <button onClick={onAccountClick} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'account' ? 'text-theme-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <User size={22} strokeWidth={activeTab === 'account' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">Account</span>
        </button>
    </div>
);

// Style 3: Rounded Pill - Modern pill-shaped navigation with gradient
const BottomNavStyle3: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, onCartClick, onAccountClick, onMenuClick, cartCount, activeTab = 'home'
}) => (
    <div className="fixed bottom-3 left-3 right-3 md:hidden z-50">
        <div className="bg-gray-900 rounded-2xl py-2.5 px-3 flex justify-around items-center shadow-2xl shadow-black/20">
            <button onClick={onHomeClick} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${activeTab === 'home' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <Home size={20} strokeWidth={2} />
                <span className="text-[9px] font-medium">Home</span>
            </button>
            <button onClick={onMenuClick} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <Search size={20} strokeWidth={2} />
                <span className="text-[9px] font-medium">Search</span>
            </button>
            <button onClick={onCartClick} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all relative ${activeTab === 'cart' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <div className="relative">
                    <ShoppingCart size={20} strokeWidth={2} />
                    {(cartCount ?? 0) > 0 && <span className="absolute -top-1 -right-2 bg-theme-primary text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                </div>
                <span className="text-[9px] font-medium">Cart</span>
            </button>
            <button onClick={onAccountClick} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${activeTab === 'account' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <User size={20} strokeWidth={2} />
                <span className="text-[9px] font-medium">Me</span>
            </button>
        </div>
    </div>
);

// Style 4: Iconic - Large centered icons with floating active indicator
const BottomNavStyle4: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, onCartClick, onAccountClick, onChatClick, cartCount, websiteConfig, activeTab = 'home'
}) => {
    const chatEnabled = websiteConfig?.chatEnabled ?? true;
    const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
    const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-gradient-to-t from-white via-white to-white/90 backdrop-blur-lg border-t border-gray-100 py-2 px-3 sm:px-4 lg:px-6 flex justify-between items-end md:hidden z-50 pb-safe h-[68px]">
            <button onClick={onHomeClick} className="flex flex-col items-center gap-1 transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'home' ? 'bg-theme-primary shadow-lg shadow-theme-primary/30' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <Home size={24} className={activeTab === 'home' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-semibold ${activeTab === 'home' ? 'text-theme-primary' : 'text-gray-400'}`}>Home</span>
            </button>
            <button onClick={onCartClick} className="flex flex-col items-center gap-1 transition-all relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'cart' ? 'bg-theme-primary shadow-lg shadow-theme-primary/30' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <ShoppingCart size={24} className={activeTab === 'cart' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
                </div>
                {(cartCount ?? 0) > 0 && <span className="absolute top-0 right-0 bg-theme-primary text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">{cartCount}</span>}
                <span className={`text-[10px] font-semibold ${activeTab === 'cart' ? 'text-theme-primary' : 'text-gray-400'}`}>Cart</span>
            </button>
            {chatEnabled && onChatClick ? (
                <button onClick={onChatClick} className="flex flex-col items-center gap-1 transition-all -translate-y-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30 border-4 border-white">
                        <MessageCircle size={28} className="text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-purple-500">Chat</span>
                </button>
            ) : chatFallbackLink ? (
                <a href={chatFallbackLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 transition-all -translate-y-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30 border-4 border-white">
                        <MessageCircle size={28} className="text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-green-500">WhatsApp</span>
                </a>
            ) : (
                <div className="flex flex-col items-center gap-1 transition-all -translate-y-3 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white">
                        <MessageCircle size={28} className="text-gray-400" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">Chat</span>
                </div>
            )}
            <button onClick={onAccountClick} className="flex flex-col items-center gap-1 transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'account' ? 'bg-theme-primary shadow-lg shadow-theme-primary/30' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <User size={24} className={activeTab === 'account' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-semibold ${activeTab === 'account' ? 'text-theme-primary' : 'text-gray-400'}`}>Account</span>
            </button>
        </div>
    );
};

// Style 5: E-commerce - Optimized for shopping with prominent cart and categories
const BottomNavStyle5: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, onCartClick, onAccountClick, onMenuClick, cartCount, activeTab = 'home'
}) => (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-white border-t-2 border-theme-primary/10 py-1.5 px-2 flex justify-around items-center md:hidden z-50 pb-safe h-[60px]">
        <button onClick={onHomeClick} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition-all ${activeTab === 'home' ? 'bg-theme-primary/10' : ''}`}>
            <div className={`p-1.5 rounded-lg ${activeTab === 'home' ? 'bg-theme-primary' : ''}`}>
                <Home size={20} className={activeTab === 'home' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
            </div>
            <span className={`text-[9px] font-semibold ${activeTab === 'home' ? 'text-theme-primary' : 'text-gray-500'}`}>Home</span>
        </button>
        <button onClick={onMenuClick} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition-all ${activeTab === 'categories' ? 'bg-theme-primary/10' : ''}`}>
            <div className={`p-1.5 rounded-lg ${activeTab === 'categories' ? 'bg-theme-primary' : ''}`}>
                <Grid size={20} className={activeTab === 'categories' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
            </div>
            <span className={`text-[9px] font-semibold ${activeTab === 'categories' ? 'text-theme-primary' : 'text-gray-500'}`}>Shop</span>
        </button>
        <button onClick={onCartClick} className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all -translate-y-2">
            <div className="relative w-14 h-14 rounded-full bg-gradient-theme-br flex items-center justify-center shadow-lg shadow-theme-primary/40 border-4 border-white">
                <ShoppingCart size={24} className="text-white" strokeWidth={2} />
                {(cartCount ?? 0) > 0 && <span className="absolute -top-1 -right-1 bg-theme-primary text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow border-2 border-white">{cartCount}</span>}
            </div>
            <span className="text-[9px] font-bold text-theme-primary">Cart</span>
        </button>
        <button onClick={onMenuClick} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition-all ${activeTab === 'search' ? 'bg-theme-primary/10' : ''}`}>
            <div className={`p-1.5 rounded-lg ${activeTab === 'search' ? 'bg-theme-primary' : ''}`}>
                <Search size={20} className={activeTab === 'search' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
            </div>
            <span className={`text-[9px] font-semibold ${activeTab === 'search' ? 'text-theme-primary' : 'text-gray-500'}`}>Search</span>
        </button>
        <button onClick={onAccountClick} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition-all ${activeTab === 'account' ? 'bg-theme-primary/10' : ''}`}>
            <div className={`p-1.5 rounded-lg ${activeTab === 'account' ? 'bg-theme-primary' : ''}`}>
                <User size={20} className={activeTab === 'account' ? 'text-white' : 'text-gray-500'} strokeWidth={2} />
            </div>
            <span className={`text-[9px] font-semibold ${activeTab === 'account' ? 'text-theme-primary' : 'text-gray-500'}`}>Me</span>
        </button>
    </div>
);

// Custom SVG icon URLs for Style 6
const ICON_CART = 'https://details-snit.vercel.app/images/shopping-cart-02.svg';
const ICON_USER = 'https://details-snit.vercel.app/images/user-circle.svg';
const ICON_MENU = 'https://details-snit.vercel.app/images/menu-01.svg';

const HomeIcon = ({ color = '#A2A2A2', size = 22 }: { color?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 18V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.07 2.81997L3.14002 8.36997C2.36002 8.98997 1.86002 10.3 2.03002 11.28L3.36002 19.24C3.60002 20.66 4.96002 21.81 6.40002 21.81H17.6C19.03 21.81 20.4 20.65 20.64 19.24L21.97 11.28C22.13 10.3 21.63 8.98997 20.86 8.36997L13.93 2.82997C12.86 1.96997 11.13 1.96997 10.07 2.81997Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChatIcon = ({ color = '#A2A2A2', size = 22 }: { color?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 8H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 13H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Style 6: MobileTabBar - Clean compact tab bar with custom SVG icons
const BottomNavStyle6: React.FC<MobileBottomNavProps> = ({
    onHomeClick, onCartClick, onAccountClick, onMenuClick, onChatClick, cartCount, activeTab = 'home', websiteConfig
}) => {
    const chatEnabled = websiteConfig?.chatEnabled ?? true;
    const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
    const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;

    return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-white border-t border-gray-100 py-1 px-2 flex justify-around items-center md:hidden z-50 pb-safe h-[52px]">
        <button type="button" onClick={() => { onHomeClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${activeTab === 'home' ? 'text-theme-primary' : 'text-gray-400'}`}>
            <HomeIcon color={activeTab === 'home' ? 'rgb(var(--color-primary-rgb))' : '#A2A2A2'} size={22} />
            <span className="text-[9px] font-semibold">Home</span>
        </button>
        {chatEnabled && onChatClick ? (
            <button type="button" onClick={onChatClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${activeTab === 'chat' ? 'text-theme-primary' : 'text-gray-400'}`}>
                <ChatIcon color={activeTab === 'chat' ? 'rgb(var(--color-primary-rgb))' : '#A2A2A2'} size={22} />
                <span className="text-[9px] font-semibold">Chat</span>
            </button>
        ) : chatFallbackLink ? (
            <a href={chatFallbackLink} target="_blank" rel="noreferrer" className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 ${activeTab === 'chat' ? 'text-theme-primary' : 'text-gray-400'}`}>
                <ChatIcon color={activeTab === 'chat' ? 'rgb(var(--color-primary-rgb))' : '#A2A2A2'} size={22} />
                <span className="text-[9px] font-semibold">Chat</span>
            </a>
        ) : (
            <button type="button" onClick={onChatClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${activeTab === 'chat' ? 'text-theme-primary' : 'text-gray-400'}`}>
                <ChatIcon color={activeTab === 'chat' ? 'rgb(var(--color-primary-rgb))' : '#A2A2A2'} size={22} />
                <span className="text-[9px] font-semibold">Chat</span>
            </button>
        )}
        <button type="button" onClick={onCartClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative text-gray-400 cursor-pointer">
            <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'cart' ? 'bg-theme-primary shadow-md shadow-theme-primary/30' : 'bg-gray-100'}`}>
                    <img src={ICON_CART} alt="Cart" className="w-5 h-5" style={activeTab === 'cart' ? { filter: 'brightness(0) invert(1)' } : { opacity: 0.5 }} />
                </div>
                {(cartCount ?? 0) > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
            </div>
        </button>
        <button type="button" onClick={onAccountClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${activeTab === 'account' ? 'text-theme-primary' : 'text-gray-400'}`}>
            <img src={ICON_USER} alt="Account" className={`w-[22px] h-[22px] ${activeTab === 'account' ? '' : 'opacity-50'}`} style={activeTab === 'account' ? { filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(97%) contrast(105%)' } : undefined} />
            <span className="text-[9px] font-semibold">Account</span>
        </button>
        <button type="button" onClick={onMenuClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${activeTab === 'menu' ? 'text-theme-primary' : 'text-gray-400'}`}>
            <img src={ICON_MENU} alt="Menu" className={`w-[22px] h-[22px] ${activeTab === 'menu' ? '' : 'opacity-50'}`} style={activeTab === 'menu' ? { filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(97%) contrast(105%)' } : undefined} />
            <span className="text-[9px] font-semibold">Menu</span>
        </button>
    </div>
    );
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = (props) => {
    const style = props.websiteConfig?.bottomNavStyle || 'style6';
    
    switch (style) {
        case 'style2':
            return <BottomNavStyle2 {...props} />;
        case 'style3':
            return <BottomNavStyle3 {...props} />;
        case 'style4':
            return <BottomNavStyle4 {...props} />;
        case 'style5':
            return <BottomNavStyle5 {...props} />;
        case 'style6':
            return <BottomNavStyle6 {...props} />;
        case 'style1':
        default:
            return <BottomNavStyle6 {...props} />;
    }
};

export default MobileBottomNav;
