import React, { useState, useRef, useEffect } from 'react';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export type QuickSelectOption = 'custom' | 'yesterday' | 'last7days' | 'last30days' | 'lastyear';

interface CustomDateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dateRange: DateRange, quickSelect?: QuickSelectOption) => void;
  initialDateRange?: DateRange;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  isOpen,
  onClose,
  onApply,
  initialDateRange,
}) => {
  const [selectedQuickOption, setSelectedQuickOption] = useState<QuickSelectOption>('custom');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick select options
  const quickOptions: { id: QuickSelectOption; label: string }[] = [
    { id: 'custom', label: 'Custom' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'last30days', label: 'Last 30 Days' },
    { id: 'lastyear', label: 'Last Year' },
  ];

  // Calculate date range for quick options
  const getQuickDateRange = (option: QuickSelectOption): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (option) {
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { startDate: yesterday, endDate: yesterday };
      }
      case 'last7days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        return { startDate: start, endDate: today };
      }
      case 'last30days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        return { startDate: start, endDate: today };
      }
      case 'lastyear': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        return { startDate: start, endDate: end };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  // Handle quick option select
  const handleQuickOptionSelect = (option: QuickSelectOption) => {
    setSelectedQuickOption(option);
    
    if (option !== 'custom') {
      const range = getQuickDateRange(option);
      if (range.startDate) {
        setStartDate(formatDateForInput(range.startDate));
      }
      if (range.endDate) {
        setEndDate(formatDateForInput(range.endDate));
      }
    }
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse input date string to Date object
  const parseInputDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Handle apply
  const handleApply = () => {
    const dateRange: DateRange = {
      startDate: parseInputDate(startDate),
      endDate: parseInputDate(endDate),
    };
    onApply(dateRange, selectedQuickOption);
    onClose();
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Initialize with provided date range
  useEffect(() => {
    if (initialDateRange) {
      if (initialDateRange.startDate) {
        setStartDate(formatDateForInput(initialDateRange.startDate));
      }
      if (initialDateRange.endDate) {
        setEndDate(formatDateForInput(initialDateRange.endDate));
      }
    }
  }, [initialDateRange]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0px 4px 11.4px rgba(0, 0, 0, 0.09)',
        width: '280px',
        padding: '10px 16px 16px 16px',
        zIndex: 100,
        fontFamily: '"Poppins", sans-serif',
      }}
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left: Quick Select Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {quickOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleQuickOptionSelect(option.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: option.id === 'custom' ? '4px 8px' : '4px 0',
                backgroundColor: selectedQuickOption === option.id && option.id === 'custom' ? '#f9f9f9' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: option.id === 'custom' ? '"Poppins", sans-serif' : '"Poppins", sans-serif',
                fontWeight: option.id === 'custom' ? 500 : 500,
                fontSize: '12px',
                color: selectedQuickOption === option.id ? '#1e90ff' : 'black',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Right: Date Range Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {/* Header */}
          <p
            style={{
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 300,
              fontSize: '12px',
              color: 'black',
              margin: 0,
            }}
          >
            Select Date Range
          </p>

          {/* Start Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label
              style={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: 'black',
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedQuickOption('custom');
              }}
              style={{
                width: '100%',
                height: '24px',
                padding: '0 7px',
                border: '0.7px solid #f8f8f8',
                borderRadius: '8px',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: startDate ? 'black' : '#c7c7c7',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="DD / MM / YYYY"
            />
          </div>

          {/* End Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label
              style={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: 'black',
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedQuickOption('custom');
              }}
              style={{
                width: '100%',
                height: '24px',
                padding: '0 7px',
                border: '0.7px solid #f8f8f8',
                borderRadius: '8px',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: endDate ? 'black' : '#c7c7c7',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="DD / MM / YYYY"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {/* Cancel Button */}
        <button
          onClick={onClose}
          style={{
            flex: 1,
            height: '24px',
            border: '0.5px solid black',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 500,
            fontSize: '12px',
            color: 'black',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Cancel
        </button>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!startDate || !endDate}
          style={{
            flex: 1,
            height: '24px',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)',
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 500,
            fontSize: '12px',
            color: 'white',
            cursor: startDate && endDate ? 'pointer' : 'not-allowed',
            opacity: startDate && endDate ? 1 : 0.6,
            transition: 'all 0.15s ease',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default CustomDateRangePicker;
