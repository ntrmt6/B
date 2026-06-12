import React, { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { SidebarProps, DashboardHeaderProps } from './types';
import { Menu, X, ChevronLeft } from 'lucide-react';

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
  sidebarProps?: Partial<SidebarProps>;
  headerProps?: Partial<DashboardHeaderProps>;
  className?: string;
}

/**
 * TenantDashboardLayout
 * 
 * Responsive layout for tenant admin dashboard.
 * - Mobile (<768px): Full-screen sidebar drawer with overlay
 * - Tablet (768-1023 px): Collapsible sidebar, push content
 * - Desktop (>=1024px): Persistent sidebar with collapse toggle
 * 
 * Breakpoints: xs(480) sm(640) md(768) lg(1024) xl(1280) 2xl(1536)
 */
export const TenantDashboardLayout: React.FC<TenantDashboardLayoutProps> = ({
  children,
  sidebarProps = {},
  headerProps = {},
  className = ""
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect viewport size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const handleNavigation = useCallback((item: string) => {
    sidebarProps.onNavigate?.(item);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [sidebarProps.onNavigate, isMobile]);

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-[250px] sm:w-[260px]';

  return (
    <div className={`flex min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300 ${className}`}>
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          transition-all duration-300 ease-in-out
          shrink-0 ${sidebarWidth}
          bg-white dark:bg-gray-800 
          shadow-lg lg:shadow-sm 
          border-r border-gray-100 dark:border-gray-700
        `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto overflow-x-hidden scrollbar-thin">
          {/* Logo + Close/Collapse */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src="https://hdnfltv.com/image/nitimages/04aad350-812e-4678-a009-7d576378b603.webp" 
                  alt="System Next IT" 
                  className="w-full max-w-[160px] h-auto" 
                />
              </div>
            )}
            
            {/* Mobile: Close button */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 -mr-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Desktop: Collapse toggle */}
            {!isMobile && (
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Navigation */}
          {!sidebarCollapsed ? (
            <DashboardSidebar
              {...sidebarProps}
              className="p-2 sm:p-3"
              onNavigate={handleNavigation}
            />
          ) : (
            <DashboardSidebar
              {...sidebarProps}
              className="p-2 [&_span]:hidden [&_p]:hidden [&_.space-y-1>div>button]:justify-center [&_.space-y-1>div>button]:px-2"
              onNavigate={handleNavigation}
            />
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-1 p-2 sm:p-3 lg:p-4">
            {/* Mobile hamburger */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm border border-gray-200 dark:border-gray-600"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <DashboardHeader
                {...(headerProps as DashboardHeaderProps)}
                searchQuery={(headerProps as any).searchQuery ?? ""}
                onSearchChange={(headerProps as any).onSearchChange ?? (() => {})}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantDashboardLayout;
