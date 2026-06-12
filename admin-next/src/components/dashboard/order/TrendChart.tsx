import { useState, useEffect, useMemo } from 'react';

interface TrendChartProps {
  /** [[day, count], ...] — raw visitor counts per day-of-month */
  visitorData?: number[][];
  /** [[day, count], ...] — raw order counts per day-of-month */
  orderData?: number[][];
  /** How many days the month has (default 31) */
  daysInMonth?: number;
}

export const TrendChart = ({
  visitorData = [],
  orderData = [],
  daysInMonth = 31,
}: TrendChartProps) => {
  const [isAnimated, setIsAnimated] = useState(false);

  const hasData = useMemo(() => {
    return visitorData.some(d => d[1] > 0) || orderData.some(d => d[1] > 0);
  }, [visitorData, orderData]);

  useEffect(() => {
    if (hasData) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimated(false);
    }
  }, [hasData]);

  const showAnimated = isAnimated && hasData;

  // Compute a nice max for the Y-axis based on actual data
  const maxValue = useMemo(() => {
    const allValues = [
      ...visitorData.map(d => d[1]),
      ...orderData.map(d => d[1]),
    ];
    const raw = Math.max(...allValues, 1);
    // Round up to a nice ceiling
    if (raw <= 5) return 5;
    if (raw <= 10) return 10;
    if (raw <= 25) return 25;
    if (raw <= 50) return 50;
    if (raw <= 100) return 100;
    return Math.ceil(raw / 50) * 50;
  }, [visitorData, orderData]);

  const yAxisValues = useMemo(() => {
    return [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0];
  }, [maxValue]);

  const chartW = 400;
  const chartH = 100;

  const getPath = (data: number[][], animated: boolean) => {
    if (!data.length) return `M0,${chartH} L${chartW},${chartH}`;
    return data.map((p, i) => {
      const x = ((p[0] - 1) / (daysInMonth - 1)) * chartW;
      const y = animated ? chartH - (p[1] / maxValue) * chartH : chartH - 2;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const getAreaPath = (linePath: string) => `${linePath} L${chartW},${chartH} L0,${chartH} Z`;

  const visitorLine = getPath(visitorData, showAnimated);
  const orderLine = getPath(orderData, showAnimated);

  // X-axis tick labels — show ~5 evenly-spaced day numbers
  const xTicks = useMemo(() => {
    const ticks: number[] = [1];
    const step = Math.max(1, Math.floor((daysInMonth - 1) / 4));
    for (let i = 1; i < 4; i++) ticks.push(1 + step * i);
    ticks.push(daysInMonth);
    return ticks;
  }, [daysInMonth]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1 flex">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between h-full w-8 pr-2 flex-shrink-0">
          {yAxisValues.map(val => (
            <div key={val} className="text-[10px] font-medium text-gray-400 text-right leading-none">{val}</div>
          ))}
        </div>

        {/* Grid + SVG */}
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yAxisValues.map((_, i) => <div key={i} className="w-full h-px bg-gray-200" />)}
          </div>

          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="visitorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FF8A00" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="orderArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path d={getAreaPath(visitorLine)} fill="url(#visitorArea)" style={{ transition: 'all 1s ease' }} />
            <path d={getAreaPath(orderLine)} fill="url(#orderArea)" style={{ transition: 'all 1s ease', transitionDelay: '0.1s' }} />

            <path d={visitorLine} fill="none" stroke="#FF8A00" strokeWidth="1.5" strokeDasharray="4,3" style={{ transition: 'all 1s ease' }} />
            <path d={orderLine} fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4,3" style={{ transition: 'all 1s ease', transitionDelay: '0.1s' }} />
          </svg>
        </div>
      </div>

      {/* X-Axis */}
      <div className="flex justify-between pl-8 pt-1">
        {xTicks.map(day => (
          <div key={day} className="text-[9px] font-medium text-gray-400 text-center">{day}</div>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;