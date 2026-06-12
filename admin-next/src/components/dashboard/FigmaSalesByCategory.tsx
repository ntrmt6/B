import React, { useMemo } from 'react';
import { Order } from '../../types';

interface CategoryData {
  name: string;
  percentage: number;
  color: string;
  bgColor: string;
  textColor: string;
}

interface FigmaSalesByCategoryProps {
  categories?: CategoryData[];
  orders?: Order[];
}

// Predefined colors for categories
const categoryColors = [
  { color: '#4F46E5', bgColor: 'bg-indigo-600', textColor: 'text-indigo-600' },
  { color: '#FB923C', bgColor: 'bg-orange-400', textColor: 'text-orange-400' },
  { color: '#FCA5A5', bgColor: 'bg-red-300', textColor: 'text-red-300' },
  { color: '#EF4444', bgColor: 'bg-red-500', textColor: 'text-red-500' },
  { color: '#A3E635', bgColor: 'bg-lime-400', textColor: 'text-lime-400' },
  { color: '#38BDF8', bgColor: 'bg-sky-400', textColor: 'text-slate-600' },
  { color: '#A21CAF', bgColor: 'bg-fuchsia-700', textColor: 'text-fuchsia-700' },
  { color: '#059669', bgColor: 'bg-emerald-600', textColor: 'text-emerald-600' },
  { color: '#7C3AED', bgColor: 'bg-violet-600', textColor: 'text-violet-600' },
  { color: '#DB2777', bgColor: 'bg-pink-600', textColor: 'text-pink-600' }
];

const defaultCategories: CategoryData[] = [
  { name: 'Hair care', percentage: 0, color: '#4F46E5', bgColor: 'bg-indigo-600', textColor: 'text-indigo-600' },
  { name: 'Serum', percentage: 0, color: '#FB923C', bgColor: 'bg-orange-400', textColor: 'text-orange-400' },
  { name: 'Cream', percentage: 0, color: '#FCA5A5', bgColor: 'bg-red-300', textColor: 'text-red-300' },
  { name: 'Home & kitchen', percentage: 0, color: '#EF4444', bgColor: 'bg-red-500', textColor: 'text-red-500' },
  { name: 'Lip care', percentage: 0, color: '#A3E635', bgColor: 'bg-lime-400', textColor: 'text-lime-400' },
  { name: 'Air Conditioner', percentage: 0, color: '#38BDF8', bgColor: 'bg-sky-400', textColor: 'text-slate-600' },
  { name: 'Skin care', percentage: 0, color: '#A21CAF', bgColor: 'bg-fuchsia-700', textColor: 'text-fuchsia-700' }
];

const FigmaSalesByCategory: React.FC<FigmaSalesByCategoryProps> = ({
  categories,
  orders = []
}) => {
  // Compute categories from orders if no categories prop provided
  const computedCategories = useMemo(() => {
    if (categories) return categories;
    if (orders.length === 0) return defaultCategories;

    // Count orders by product category (using productName as fallback category)
    const categoryCount: Record<string, number> = {};
    
    orders.forEach(order => {
      // Try to get category from order items
      const items = Array.isArray(order.items) ? order.items : [];
      if (items.length > 0) {
        items.forEach((item: any) => {
          const category = item.category || item.productName || 'Other';
          categoryCount[category] = (categoryCount[category] || 0) + (item.quantity || 1);
        });
      } else {
        // Use productName as category fallback
        const category = order.productName || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + (order.quantity || 1);
      }
    });

    const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
    
    // Sort by count and take top categories
    const sorted = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7);

    return sorted.map(([name, count], index) => ({
      name,
      percentage: Math.round((count / total) * 100),
      ...categoryColors[index % categoryColors.length]
    }));
  }, [categories, orders]);
  
  // Calculate angles for pie chart
  let currentAngle = 0;
  const segments = computedCategories.map((category) => {
    const angle = (category.percentage / 100) * 360;
    const segment = {
      ...category,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle
    };
    currentAngle += angle;
    return segment;
  });

  // Function to create SVG path for pie segment
  const createPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number = 0) => {
    const start = polarToCartesian(100, 100, outerRadius, endAngle);
    const end = polarToCartesian(100, 100, outerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    if (innerRadius > 0) {
      const innerStart = polarToCartesian(100, 100, innerRadius, endAngle);
      const innerEnd = polarToCartesian(100, 100, innerRadius, startAngle);
      return [
        "M", start.x, start.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "Z"
      ].join(" ");
    } else {
      return [
        "M", start.x, start.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "L", 100, 100,
        "Z"
      ].join(" ");
    }
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="w-full h-auto p-2.5 sm:p-3 bg-white dark:bg-gray-800 rounded-xl border border-zinc-200 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Title */}
      <div className="mb-2 sm:mb-3">
        <div className="text-zinc-800 dark:text-white text-lg font-bold font-family: Poppins, Helvetica, sans-serif">Sale By Category</div>
      </div>

      {/* Pie Chart - Donut style */}
      <div className="flex-shrink-0 w-32 h-32 sm:w-44 sm:h-44 mx-auto overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={createPath(segment.startAngle, segment.endAngle, 90, 50)}
              fill={segment.color}
            />
          ))}
        </svg>
      </div>

      {/* Legend - Responsive grid */}
      <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-x-1.5 gap-y-0.5 xs:gap-x-2 xs:gap-y-1 sm:gap-x-3 sm:gap-y-1.5">
        {computedCategories.map((category, index) => (
          <div key={index} className="flex justify-start items-center gap-1 xs:gap-1.5 sm:gap-2.5">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${category.bgColor} rounded-full flex-shrink-0`} />
            <div className="justify-start truncate">
              <span className="text-black dark:text-gray-300 text-xs sm:text-sm font-medium  font-family: Poppins, Helvetica, sans-serif">{category.name}(</span>
              <span className={`${category.textColor} text-xs sm:text-sm font-medium font-family: Poppins, Helvetica, sans-serif`}>{category.percentage}%</span>
              <span className="text-black dark:text-gray-300 text-xs sm:text-sm font-medium font-family: Poppins, Helvetica, sans-serif">)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FigmaSalesByCategory;
