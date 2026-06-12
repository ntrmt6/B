import React from 'react';

interface ModernKpiCardProps {
  title: string;
  value: string | number;
  iconUrl?: string;
  trend?: { value: string; isPositive: boolean };
}

const ModernKpiCard: React.FC<ModernKpiCardProps> = ({
  title,
  value,
  iconUrl = "https://res.cloudinary.com/dvierzkzj/image/upload/v1779299040/37cbe9c7-7489-4eca-acf5-4297e1239d98.png",
  trend,
}) => (
  <div className="w-full bg-[#F9F9F9] rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
    <div className="flex-1 min-w-0">
      <div className="text-xl sm:text-2xl font-semibold text-gray-900 font-poppins truncate">{value}</div>
      <div className="text-[11px] sm:text-xs font-medium text-gray-500 font-poppins mt-0.5 truncate">{title}</div>
      {trend && (
        <div className={`text-[10px] sm:text-xs font-medium mt-1 ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.isPositive ? '\u2191' : '\u2193'} {trend.value}
        </div>
      )}
    </div>
    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
      <img src={iconUrl} alt={title} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
    </div>
  </div>
);

export default ModernKpiCard;
