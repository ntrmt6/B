import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, RefreshCw, X, Pipette } from 'lucide-react';
import { WebsiteConfig, ColorKey } from './types';
import { DEFAULT_COLORS, normalizeHexColor } from './constants';

interface ThemeColorsTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  themeColors: Record<ColorKey, string>;
  setThemeColors: React.Dispatch<React.SetStateAction<Record<ColorKey, string>>>;
}

// Figma preset color combinations
const PRESET_COLOR_COMBINATIONS = [
  { id: 1, primary: '#1e90ff', secondary: '#ff6a00', tertiary: '#00400e', font: '#000000', selected: true },
  { id: 2, primary: '#f01d1d', secondary: '#1d9904', tertiary: '#530777', font: '#000000', selected: false },
  { id: 3, primary: '#dd008c', secondary: '#00b7cb', tertiary: '#322d8f', font: '#3c3c3c', selected: false },
  { id: 4, primary: '#b70707', secondary: '#ff6200', tertiary: '#00a1ca', font: '#000000', selected: false },
];

// Gradient direction options for color picker
const GRADIENT_DIRECTIONS = [
  { id: 'vertical', style: 'linear-gradient(180deg, #38bdf8 0%, #1e90ff 100%)' },
  { id: 'horizontal', style: 'linear-gradient(90deg, #38bdf8 0%, #1e90ff 100%)' },
  { id: 'diagonal1', style: 'linear-gradient(122deg, #38bdf8 0%, #1e90ff 100%)' },
  { id: 'diagonal2', style: 'linear-gradient(239deg, #38bdf8 0%, #1e90ff 100%)' },
];

// Default last used colors
const DEFAULT_LAST_USED = ['#000000', '#1e90ff', '#00c853', '#ffc107', '#9c27b0', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'];

// ============================================================================
// Color Utility Functions
// ============================================================================

// Convert hex to HSV
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, v: 1 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, v: v * 100 };
};

// Convert HSV to hex
const hsvToHex = (h: number, s: number, v: number): string => {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Get hue color for gradient background
const hueToHex = (h: number): string => hsvToHex(h, 100, 100);

// ============================================================================
// Advanced Figma Color Picker Component
// ============================================================================

const FigmaColorPicker: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
  onBlur?: () => void;
}> = ({ label, color, onChange, onBlur }) => {
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid');
  const [showPicker, setShowPicker] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#38bdf8');
  const [gradientColor2, setGradientColor2] = useState('#1e90ff');
  const [selectedDirection, setSelectedDirection] = useState('horizontal');
  const [inputValue, setInputValue] = useState(color.replace('#', '').toUpperCase());
  const [opacity, setOpacity] = useState(100);
  const [lastUsedColors, setLastUsedColors] = useState<string[]>(DEFAULT_LAST_USED);
  
  // HSV state for color picker
  const initialHsv = hexToHsv(color);
  const [hue, setHue] = useState(initialHsv.h);
  const [saturation, setSaturation] = useState(initialHsv.s);
  const [brightness, setBrightness] = useState(initialHsv.v);
  
  // Refs for drag handling
  const satBrightRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDraggingSatBright = useRef(false);
  const isDraggingHue = useRef(false);
  const isDraggingOpacity = useRef(false);

  // Sync input value with color prop
  useEffect(() => {
    setInputValue(color.replace('#', '').toUpperCase());
    const hsv = hexToHsv(color);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
  }, [color]);

  // Update color when HSV changes
  const updateColorFromHsv = useCallback((h: number, s: number, v: number) => {
    const newColor = hsvToHex(h, s, v);
    onChange(newColor);
    setInputValue(newColor.replace('#', '').toUpperCase());
  }, [onChange]);

  // Handle saturation/brightness picker interaction
  const handleSatBrightChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!satBrightRef.current) return;
    const rect = satBrightRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const newSat = (x / rect.width) * 100;
    const newBright = 100 - (y / rect.height) * 100;
    setSaturation(newSat);
    setBrightness(newBright);
    updateColorFromHsv(hue, newSat, newBright);
  }, [hue, updateColorFromHsv]);

  // Handle hue slider interaction
  const handleHueChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
    updateColorFromHsv(newHue, saturation, brightness);
  }, [saturation, brightness, updateColorFromHsv]);

  // Handle opacity slider interaction
  const handleOpacityChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!opacitySliderRef.current) return;
    const rect = opacitySliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newOpacity = Math.round((x / rect.width) * 100);
    setOpacity(newOpacity);
  }, []);

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSatBright.current) handleSatBrightChange(e);
      if (isDraggingHue.current) handleHueChange(e);
      if (isDraggingOpacity.current) handleOpacityChange(e);
    };
    
    const handleMouseUp = () => {
      isDraggingSatBright.current = false;
      isDraggingHue.current = false;
      isDraggingOpacity.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSatBrightChange, handleHueChange, handleOpacityChange]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        if (showPicker) {
          // Add current color to last used
          setLastUsedColors(prev => {
            const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
            return [color, ...filtered].slice(0, 9);
          });
        }
        setShowPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker, color]);

  const handleInputChange = (value: string) => {
    setInputValue(value.toUpperCase());
    if (/^[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(`#${value}`);
    }
  };

  const handleInputBlur = () => {
    if (/^[0-9A-Fa-f]{6}$/.test(inputValue)) {
      onChange(`#${inputValue}`);
    } else {
      setInputValue(color.replace('#', '').toUpperCase());
    }
    onBlur?.();
  };

  const handleLastUsedClick = (usedColor: string) => {
    onChange(usedColor);
    const hsv = hexToHsv(usedColor);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
  };

  // Picker styles matching Figma exactly
  const pickerStyles = {
    container: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      zIndex: 9999,
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      width: '320px',
      marginTop: '8px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid #eee',
    },
    title: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '16px',
      color: '#27222a',
      margin: 0,
      textTransform: 'capitalize' as const,
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      padding: '16px',
    },
    toggle: {
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '4px',
      display: 'flex',
      gap: '4px',
      height: '36px',
    },
    toggleBtn: (active: boolean) => ({
      flex: 1,
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '14px',
      backgroundColor: active ? 'white' : 'transparent',
      color: active ? '#27222a' : '#706a73',
      boxShadow: active ? '2px 2px 8px rgba(44,38,46,0.12)' : 'none',
      transition: 'all 0.2s ease',
    }),
    satBrightArea: {
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      border: '1px solid #eee',
      position: 'relative' as const,
      cursor: 'crosshair',
      background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 100%), linear-gradient(90deg, rgb(255,255,255) 0%, ${hueToHex(hue)} 100%)`,
    },
    handle: {
      position: 'absolute' as const,
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none' as const,
    },
    sliderRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    colorLump: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      border: '1px solid #eee',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    colorLumpLeft: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: '50%',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23ccc'/%3E%3C/svg%3E")`,
      backgroundSize: '8px 8px',
    },
    colorLumpRight: (clr: string) => ({
      position: 'absolute' as const,
      right: 0,
      top: 0,
      bottom: 0,
      width: '50%',
      backgroundColor: clr,
      borderTopRightRadius: '4px',
      borderBottomRightRadius: '4px',
    }),
    sliderWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    slider: {
      height: '16px',
      borderRadius: '8px',
      border: '1px solid #eee',
      position: 'relative' as const,
      cursor: 'pointer',
    },
    hueSlider: {
      background: 'linear-gradient(90deg, rgb(255,0,0) 0%, rgb(255,255,0) 16.6%, rgb(0,255,0) 33.3%, rgb(0,255,255) 50%, rgb(0,0,255) 65%, rgb(158,0,255) 75%, rgb(255,0,167) 89.5%, rgb(255,0,0) 100%)',
    },
    opacitySlider: (clr: string) => ({
      backgroundImage: `linear-gradient(90deg, transparent 0%, ${clr} 100%), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23ccc'/%3E%3C/svg%3E")`,
      backgroundSize: '100% 100%, 8px 8px',
    }),
    sliderHandle: {
      position: 'absolute' as const,
      top: '0',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      transform: 'translateX(-50%)',
      pointerEvents: 'none' as const,
    },
    inputRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    pipetteBtn: {
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#706a73',
    },
    inputGroup: {
      flex: 1,
      display: 'flex',
      gap: '8px',
    },
    hexInput: {
      flex: 1,
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    },
    hashSign: {
      color: '#969298',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '14px',
      width: '10px',
    },
    hexText: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '14px',
      color: '#27222a',
      width: '60px',
    },
    opacityInput: {
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      width: '72px',
    },
    opacityText: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '14px',
      color: '#27222a',
      width: '28px',
      textAlign: 'right' as const,
    },
    percentSign: {
      color: '#969298',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '14px',
    },
    lastUsedSection: {
      borderTop: '1px solid #eee',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    lastUsedTitle: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '12px',
      color: '#27222a',
      margin: 0,
      textTransform: 'capitalize' as const,
    },
    lastUsedGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
    },
    lastUsedColor: (clr: string) => ({
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      backgroundColor: clr,
      border: '1px solid #eee',
      cursor: 'pointer',
      transition: 'transform 0.1s ease',
    }),
  };

  return (
    <div ref={pickerRef} style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
      {/* Label */}
      <p
        style={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          color: '#6c6c6c',
          margin: 0,
        }}
      >
        {label}
      </p>

      {/* Color Input Box */}
      <div
        onClick={() => setShowPicker(!showPicker)}
        style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '8px 7px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Color Preview */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: color,
          }}
        />
        {/* Hex Value */}
        <input
          type="text"
          value={`#${inputValue}`}
          onChange={(e) => handleInputChange(e.target.value.replace('#', ''))}
          onBlur={handleInputBlur}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: '16px',
            color: color,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '80px',
          }}
        />
      </div>

      {/* Advanced Color Picker Popup - Figma Design */}
      {showPicker && (
        <div style={pickerStyles.container}>
          {/* Header with Title and Close */}
          <div style={pickerStyles.header}>
            <p style={pickerStyles.title}>Color Picker</p>
            <button 
              style={pickerStyles.closeBtn}
              onClick={() => setShowPicker(false)}
            >
              <X size={16} color="#27222a" />
            </button>
          </div>

          {/* Content */}
          <div style={pickerStyles.content}>
            {/* Solid/Gradient Toggle */}
            <div style={pickerStyles.toggle}>
              <button
                onClick={() => setColorMode('solid')}
                style={pickerStyles.toggleBtn(colorMode === 'solid')}
              >
                Solid
              </button>
              <button
                onClick={() => setColorMode('gradient')}
                style={pickerStyles.toggleBtn(colorMode === 'gradient')}
              >
                Gradient
              </button>
            </div>

            {colorMode === 'solid' ? (
              <>
                {/* Saturation/Brightness Picker Area */}
                <div
                  ref={satBrightRef}
                  style={pickerStyles.satBrightArea}
                  onMouseDown={(e) => {
                    isDraggingSatBright.current = true;
                    handleSatBrightChange(e);
                  }}
                >
                  {/* Handle/Cursor */}
                  <div
                    style={{
                      ...pickerStyles.handle,
                      left: `${saturation}%`,
                      top: `${100 - brightness}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                {/* Sliders Row */}
                <div style={pickerStyles.sliderRow}>
                  {/* Color Preview Lump */}
                  <div style={pickerStyles.colorLump}>
                    <div style={pickerStyles.colorLumpLeft} />
                    <div style={{ ...pickerStyles.colorLumpLeft, backgroundColor: `${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')}` }} />
                    <div style={pickerStyles.colorLumpRight(color)} />
                  </div>

                  {/* Hue and Opacity Sliders */}
                  <div style={pickerStyles.sliderWrapper}>
                    {/* Hue Slider */}
                    <div
                      ref={hueSliderRef}
                      style={{ ...pickerStyles.slider, ...pickerStyles.hueSlider }}
                      onMouseDown={(e) => {
                        isDraggingHue.current = true;
                        handleHueChange(e);
                      }}
                    >
                      <div
                        style={{
                          ...pickerStyles.sliderHandle,
                          left: `${(hue / 360) * 100}%`,
                          backgroundColor: hueToHex(hue),
                        }}
                      />
                    </div>

                    {/* Opacity Slider */}
                    <div
                      ref={opacitySliderRef}
                      style={{ ...pickerStyles.slider, ...pickerStyles.opacitySlider(color) }}
                      onMouseDown={(e) => {
                        isDraggingOpacity.current = true;
                        handleOpacityChange(e);
                      }}
                    >
                      <div
                        style={{
                          ...pickerStyles.sliderHandle,
                          left: `${opacity}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hex and Opacity Inputs */}
                <div style={pickerStyles.inputRow}>
                  {/* Pipette Icon */}
                  <button style={pickerStyles.pipetteBtn} title="Pick color from screen">
                    <Pipette size={18} />
                  </button>

                  <div style={pickerStyles.inputGroup}>
                    {/* Hex Input */}
                    <div style={pickerStyles.hexInput}>
                      <span style={pickerStyles.hashSign}>#</span>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleInputBlur}
                        style={pickerStyles.hexText}
                        maxLength={6}
                      />
                    </div>

                    {/* Opacity Input */}
                    <div style={pickerStyles.opacityInput}>
                      <input
                        type="number"
                        value={opacity}
                        onChange={(e) => setOpacity(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        style={pickerStyles.opacityText}
                        min={0}
                        max={100}
                      />
                      <span style={pickerStyles.percentSign}>%</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Gradient Mode - Keep existing implementation */
              <>
                {/* Gradient Preview with Color Stop Handles */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '-8px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: gradientColor1,
                      borderRadius: '4px',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = gradientColor1;
                      input.onchange = (e) => setGradientColor1((e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '-8px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: gradientColor2,
                      borderRadius: '4px',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = gradientColor2;
                      input.onchange = (e) => setGradientColor2((e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <div
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      marginTop: '16px',
                      background: `linear-gradient(90deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`,
                    }}
                  />
                </div>

                {/* Color 1 Input */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = gradientColor1;
                      input.onchange = (e) => setGradientColor1((e.target as HTMLInputElement).value);
                      input.click();
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: gradientColor1,
                      cursor: 'pointer',
                    }}
                  />
                  <div style={pickerStyles.hexInput}>
                    <span style={pickerStyles.hashSign}>#</span>
                    <input
                      type="text"
                      value={gradientColor1.replace('#', '').toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value.replace('#', '').toUpperCase();
                        if (/^[0-9A-Fa-f]{0,6}$/.test(val) && val.length === 6) {
                          setGradientColor1(`#${val}`);
                        }
                      }}
                      style={pickerStyles.hexText}
                      maxLength={6}
                    />
                  </div>
                  <div style={pickerStyles.opacityInput}>
                    <span style={{ ...pickerStyles.opacityText, width: 'auto' }}>100</span>
                    <span style={pickerStyles.percentSign}>%</span>
                  </div>
                </div>

                {/* Color 2 Input */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = gradientColor2;
                      input.onchange = (e) => setGradientColor2((e.target as HTMLInputElement).value);
                      input.click();
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: gradientColor2,
                      cursor: 'pointer',
                    }}
                  />
                  <div style={pickerStyles.hexInput}>
                    <span style={pickerStyles.hashSign}>#</span>
                    <input
                      type="text"
                      value={gradientColor2.replace('#', '').toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value.replace('#', '').toUpperCase();
                        if (/^[0-9A-Fa-f]{0,6}$/.test(val) && val.length === 6) {
                          setGradientColor2(`#${val}`);
                        }
                      }}
                      style={pickerStyles.hexText}
                      maxLength={6}
                    />
                  </div>
                  <div style={pickerStyles.opacityInput}>
                    <span style={{ ...pickerStyles.opacityText, width: 'auto' }}>100</span>
                    <span style={pickerStyles.percentSign}>%</span>
                  </div>
                </div>

                {/* Gradient Directions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ ...pickerStyles.title, fontSize: '12px' }}>Color Style</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {GRADIENT_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.id}
                        onClick={() => {
                          setSelectedDirection(dir.id);
                          onChange(gradientColor1);
                        }}
                        style={{
                          width: '66px',
                          height: '40px',
                          borderRadius: '8px',
                          border: selectedDirection === dir.id ? '2px solid #38bdf8' : 'none',
                          background: dir.style.replace('#38bdf8', gradientColor1).replace('#1e90ff', gradientColor2),
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Last Used Section */}
          <div style={pickerStyles.lastUsedSection}>
            <p style={pickerStyles.lastUsedTitle}>Last used</p>
            <div style={pickerStyles.lastUsedGrid}>
              {lastUsedColors.map((usedColor, idx) => (
                <div
                  key={idx}
                  style={pickerStyles.lastUsedColor(usedColor)}
                  onClick={() => handleLastUsedClick(usedColor)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ThemeColorsTab: React.FC<ThemeColorsTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  themeColors,
  setThemeColors
}) => {
  const [colorDrafts, setColorDrafts] = useState({ ...DEFAULT_COLORS });

  // Derive selected preset from current themeColors by comparing values
  const selectedPreset = useMemo(() => {
    const matchingPreset = PRESET_COLOR_COMBINATIONS.find(
      (preset) =>
        preset.primary.toLowerCase() === themeColors.primary?.toLowerCase() &&
        preset.secondary.toLowerCase() === themeColors.secondary?.toLowerCase() &&
        preset.tertiary.toLowerCase() === themeColors.tertiary?.toLowerCase() &&
        preset.font.toLowerCase() === themeColors.font?.toLowerCase()
    );
    return matchingPreset?.id ?? null;
  }, [themeColors]);

  // Sync color drafts with theme colors
  useEffect(() => {
    setColorDrafts(themeColors);
  }, [themeColors]);

  const updateThemeColor = (colorKey: ColorKey, value: string): void => {
    const normalized = normalizeHexColor(value);
    if (normalized) {
      setThemeColors((prev) => ({ ...prev, [colorKey]: normalized }));
    }
  };

  const applyPreset = (preset: typeof PRESET_COLOR_COMBINATIONS[0]) => {
    setThemeColors({
      ...themeColors,
      primary: preset.primary,
      secondary: preset.secondary,
      tertiary: preset.tertiary,
      font: preset.font,
    });
  };

  const shuffleColors = () => {
    // Filter out the currently selected preset to ensure a different one is chosen
    const availablePresets = PRESET_COLOR_COMBINATIONS.filter(p => p.id !== selectedPreset);
    const randomPreset = availablePresets[Math.floor(Math.random() * availablePresets.length)];
    applyPreset(randomPreset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Theme Colour Section */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontFamily: '"Lato", sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            color: '#023337',
            letterSpacing: '0.1px',
            margin: '0 0 20px 0',
          }}
        >
          Theme Colour
        </h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Color Pickers */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <FigmaColorPicker
              label="Primary"
              color={themeColors.primary}
              onChange={(color) => updateThemeColor('primary', color)}
            />
            <FigmaColorPicker
              label="Secondary"
              color={themeColors.secondary}
              onChange={(color) => updateThemeColor('secondary', color)}
            />
            <FigmaColorPicker
              label="Depth Accent"
              color={themeColors.tertiary}
              onChange={(color) => updateThemeColor('tertiary', color)}
            />
            <FigmaColorPicker
              label="Font Colour"
              color={themeColors.font}
              onChange={(color) => updateThemeColor('font', color)}
            />
          </div>

          {/* Ready Colours Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  color: '#6c6c6c',
                  margin: 0,
                }}
              >
                Ready Colours
              </p>
              <button
                onClick={shuffleColors}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Shuffle
                </span>
                <RefreshCw size={20} style={{ color: '#ff6a00' }} />
              </button>
            </div>

            {/* Preset Color Combinations */}
            <div
              style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                padding: '7px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {PRESET_COLOR_COMBINATIONS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {/* Checkmark Circle */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: selectedPreset === preset.id ? '2px solid #22c55e' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selectedPreset === preset.id ? '#22c55e' : '#e5e5e5',
                    }}
                  >
                    {selectedPreset === preset.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {/* Color Swatches */}
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: preset.primary }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: preset.secondary }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: preset.tertiary }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: preset.font }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Hints Section */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Search size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <h3
              style={{
                fontFamily: '"Lato", sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                color: '#023337',
                margin: 0,
              }}
            >
              Search Hints
            </h3>
            <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: '12px', color: '#6c6c6c', margin: 0 }}>
              Suggest keywords to help customers find products
            </p>
          </div>
        </div>
        <input
          type="text"
          value={websiteConfiguration.searchHints || ''}
          onChange={(e) => setWebsiteConfiguration((p) => ({ ...p, searchHints: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e5e5e5',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
            fontFamily: '"Poppins", sans-serif',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          placeholder="gadget, gift, toy, electronics..."
        />
      </div>
    </div>
  );
};

export default ThemeColorsTab;
