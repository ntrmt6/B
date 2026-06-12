import React from 'react';

/**
 * ResponsiveGrid - Enhanced layout wrapper for storefront sections
 * Provides consistent responsive behavior and better spacing across all screens
 */
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapMap = {
  sm: 'gap-2',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 sm:gap-5 md:gap-6'
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 2, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 'md',
  className = ''
}) => {
  const gridColsClass = `
    grid-cols-${cols.xs || 2}
    sm:grid-cols-${cols.sm || 2}
    md:grid-cols-${cols.md || 3}
    lg:grid-cols-${cols.lg || 4}
    xl:grid-cols-${cols.xl || 5}
  `.trim().replace(/\n\s+/g, ' ');

  return (
    <div className={`grid ${gridColsClass} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * SectionContainer - Enhanced section wrapper with consistent padding and spacing
 */
export interface SectionContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  accent?: 'blue' | 'green' | 'orange' | 'purple';
  className?: string;
}

const accentColors = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600'
};

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  title,
  subtitle,
  accent = 'blue',
  className = ''
}) => {
  return (
    <section className={`py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 ${className}`}>
      {title && (
        <div className="mb-6 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${accentColors[accent]}`} />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          </div>
          {subtitle && <p className="text-gray-600 text-sm md:text-base ml-4">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
};

/**
 * CardWrapper - Consistent card styling for product cards and other components
 */
export interface CardWrapperProps {
  children: React.ReactNode;
  hover?: boolean;
  border?: boolean;
  className?: string;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  hover = true,
  border = true,
  className = ''
}) => {
  return (
    <div className={`
      bg-white rounded-lg overflow-hidden
      ${border ? 'border border-gray-100' : ''}
      ${hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
