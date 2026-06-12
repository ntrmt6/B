import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, activeTab, onTabChange }) => (
  <Button
    onClick={() => onTabChange(id)}
    variant="ghost"
    className={cn(
      'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap',
      activeTab === id
        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-gray-900'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
    )}
  >
    {icon} {label}
  </Button>
);

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  variant = '', 
  className = '', 
  ...props 
}) => (
  <Button
    variant="ghost"
    className={cn('px-4 py-2 rounded-lg text-sm font-bold', variant, className)}
    {...props}
  >
    {children}
  </Button>
);
