'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutGrid, ShoppingBag, ShoppingCart, Receipt,
  Package, Wallet, BookOpen, Users, BarChart3,
  LogOut, Menu, X, User, Tag, Banknote, Zap, Shield,
  Warehouse, Truck, Settings
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <LayoutGrid size={20} /> },
  { name: 'Products', href: '/products', icon: <Package size={20} /> },
  { name: 'Sell', href: '/sell', icon: <Tag size={20} /> },
  { name: 'Quick Sell', href: '/quick-sell', icon: <Zap size={20} /> },
  { name: 'Sale Book', href: '/sales', icon: <BookOpen size={20} /> },
  { name: 'Purchases', href: '/purchases', icon: <ShoppingBag size={20} /> },
  { name: 'Expenses', href: '/expenses', icon: <Receipt size={20} /> },
  { name: 'Cashbox', href: '/cashbox', icon: <Banknote size={20} /> },
  { name: 'Due Book', href: '/due-book', icon: <ShoppingCart size={20} /> },
  { name: 'Contacts', href: '/contacts', icon: <Users size={20} /> },
  { name: 'Inventory', href: '/inventory', icon: <Warehouse size={20} /> },
  { name: 'Online Orders', href: '/online-orders', icon: <Truck size={20} /> },
  { name: 'Reports', href: '/reports', icon: <BarChart3 size={20} /> },
  { name: 'Access', href: '/access', icon: <Shield size={20} /> },
  { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, tenantConfig } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-gradient-to-b from-[var(--sidebar-bg)] to-[var(--sidebar-bg-dark)] transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-12 px-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[var(--crystal-orange)] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-xs font-bold text-white">{tenantConfig.logoChar}</span>
              </div>
              <span className="font-bold text-white text-sm">{tenantConfig.appName}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium mb-0.5 transition-all ${
                    active
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                  }`}
                >
                  <span className={active ? 'text-[var(--crystal-orange)]' : ''}>{item.icon}</span>
                  {item.name}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--crystal-orange)]" />}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 p-2">
            <div className="flex items-center gap-2 mb-1.5 px-2">
              <div className="w-7 h-7 bg-[var(--crystal-blue)] rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-white/50 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/15 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-12 px-3 bg-gradient-to-r from-[var(--sidebar-bg)] to-[var(--crystal-blue-dark)] shadow-md">
          <button onClick={() => setSidebarOpen(true)} className="text-white/80 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-bold text-white text-sm">{tenantConfig.appName}</span>
          <div className="w-7 h-7 bg-[var(--crystal-orange)] rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{tenantConfig.logoChar}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
