import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Section: React.FC<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-[0px_4px_11.4px_-2px_rgba(0,0,0,0.08)] px-4 py-5">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <h2 className="text-[20px] font-medium text-black font-['Lato']">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#a2a2a2] mt-1">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 flex items-center justify-center">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      {isOpen && <div className="mt-6">{children}</div>}
    </div>
  );
};

export const InputField: React.FC<{
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'textarea';
  rows?: number;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}> = ({ label, required, placeholder, value, onChange, type = 'text', rows = 3, icon, rightIcon }) => {
  const displayValue = value === 0 ? '' : value;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[16px] text-black font-['Lato']">
        {label}
        {required && <span className="text-[#e30000]">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        {type === 'textarea' ? (
          <textarea
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-[#f9f9f9] rounded-lg px-3 py-3 text-[14px] text-black placeholder:text-[#a2a2a2] outline-none resize-none"
          />
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-10 bg-[#f9f9f9] rounded-lg text-[14px] text-black placeholder:text-[#a2a2a2] outline-none ${icon ? 'pl-9 pr-3' : 'px-3'} ${rightIcon ? 'pr-10' : ''}`}
          />
        )}
        {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>}
      </div>
    </div>
  );
};

export const Toggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  labelPosition?: 'left' | 'right';
}> = ({ label, value, onChange, labelPosition = 'left' }) => (
  <div className="flex items-center gap-2">
    {labelPosition === 'left' && <span className="text-[14px] sm:text-[16px] text-black font-['Lato'] whitespace-nowrap">{label}</span>}
    <button
      onClick={() => onChange(!value)}
      className={`w-[38px] h-5 rounded-full transition-colors ${value ? 'bg-[#ff6a00]' : 'bg-gray-300'} relative`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
    {labelPosition === 'right' && <span className="text-[14px] sm:text-[16px] text-black font-['Lato'] whitespace-nowrap">{label}</span>}
  </div>
);

export const SelectField: React.FC<{
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}> = ({ label, required, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 200);
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      {label && (
        <label className="text-[16px] text-black font-['Lato']">
          {label}
          {required && <span className="text-[#e30000]">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="w-full h-10 bg-[#f9f9f9] rounded-lg px-3 flex items-center justify-between text-[14px] text-black"
        >
          <span className={selectedOption ? 'text-black' : 'text-[#a2a2a2]'}>
            {selectedOption?.label || placeholder || 'Select...'}
          </span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 right-0 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-auto ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-left text-[14px] hover:bg-gray-50 ${value === option.value ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
