import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import FigmaDashboardHeader from './FigmaDashboardHeader';
import { AdminBottomNav } from './AdminBottomNav';
import { SidebarProps, DashboardHeaderProps } from './types';
import { X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarProps?: Partial<SidebarProps>;
  headerProps?: DashboardHeaderProps;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebarProps = {},
  headerProps = {},
  className = ""
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close sidebar when clicking outside
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <div className={`flex h-[100dvh] min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300 ${className}`}>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={handleOverlayClick}
          />
        )}

        {/* Sidebar - Hidden on mobile, slide-in drawer */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-in-out
          flex-shrink-0 w-[85vw] max-w-[260px] sm:w-[260px] lg:w-[220px] bg-white dark:bg-gray-800 shadow-lg lg:shadow-none border-r border-gray-100 dark:border-gray-700
        `}>
          <div className="sticky top-0 h-screen overflow-y-auto">
            {/* Logo + Close Button (mobile) */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5 xs:gap-2">
                
                <span className="text-lg font-semibold text-gray-900 dark:text-white font-['Roboto']">
                <img src="https://i.postimg.cc/JnjzJYWq/image.png" alt="System Next IT" className="w-full h-auto" /> 
                </span>
              </div>
              {/* Close button - only on mobile */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 -mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DashboardSidebar
              {...sidebarProps}
              className="p-2 sm:p-3"
              onNavigate={(item) => {
                sidebarProps.onNavigate?.(item);
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-gray-900">
          {/* Header */}
          <div className="sticky top-0 z-30 flex-shrink-0 flex items-center bg-[#F8FAFC]/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="flex-1">
              <FigmaDashboardHeader
                {...headerProps}
                searchQuery={(headerProps as any).searchQuery ?? ""}
                onSearchChange={(headerProps as any).onSearchChange ?? (() => {})}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2.5 sm:space-y-3 lg:space-y-4 p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 pb-20 lg:pb-5">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - rendered outside flex container for proper fixed positioning */}
      <AdminBottomNav
        activeItem={sidebarProps.activeItem}
        onNavigate={(page) => sidebarProps.onNavigate?.(page)}
        onMenuClick={() => setSidebarOpen(true)}
      />
    </>
  );
};

export default DashboardLayout;
