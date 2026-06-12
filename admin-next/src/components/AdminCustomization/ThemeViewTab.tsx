import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { WebsiteConfig } from './types';
import { THEME_DEMO_IMAGES } from './constants';

// Ready-made themes — each entry bundles a storefront + product-detail page.
// Selecting a theme auto-sets both readyTheme and productDetailTheme.
const READY_MADE_THEMES = [
  { id: 'gadgets1', title: 'Gadgets Theme 1', productDetailTheme: 'gadgets' },
  { id: 'gadgets2', title: 'Gadgets Theme 2', productDetailTheme: 'gadgets' },
  { id: 'gadgets3', title: 'Gadgets Theme 3', productDetailTheme: 'gadgets' },
  { id: 'gadgets4', title: 'Gadgets Theme 4', productDetailTheme: 'gadgets' },
  { id: 'storefront1', title: 'StoreFront Theme 1', productDetailTheme: 'modern' },
  { id: 'storefront2', title: 'StoreFront Theme 2', productDetailTheme: 'modern' },
];

// "Coming Soon" niche categories
const COMING_SOON_CATEGORIES = [
  { id: 'fashion', title: 'Fashion Theme', themes: ['fashion1', 'fashion2', 'fashion3', 'fashion4'] },
  { id: 'grocery', title: 'Grocery Theme', themes: ['grocery1', 'grocery2', 'grocery3', 'grocery4'] },
  { id: 'cosmetics', title: 'Cosmetics Theme', themes: ['cosmetics1', 'cosmetics2', 'cosmetics3', 'cosmetics4'] },
  { id: 'pharmacy', title: 'Pharmacy Theme', themes: ['pharmacy1', 'pharmacy2', 'pharmacy3', 'pharmacy4'] },
];

// "Coming Soon" individual component sections
const COMING_SOON_SECTIONS = [
  { id: 'footer', title: 'Footer' },
  { id: 'category', title: 'Category' },
  { id: 'showcase', title: 'Showcase' },
  { id: 'brands', title: 'Brands' },
];

const DEFAULT_PRODUCT_DETAIL_THEME = 'modern';

// Ready Colours preset combinations
const READY_COLOURS = [
  { id: 1, primary: '#1e90ff', secondary: '#ff6a00', depthAccent: '#00400e', font: '#000000' },
  { id: 2, primary: '#f01d1d', secondary: '#1d9904', depthAccent: '#530777', font: '#000000' },
  { id: 3, primary: '#dd008c', secondary: '#00b7cb', depthAccent: '#322d8f', font: '#3c3c3c' },
  { id: 4, primary: '#b70707', secondary: '#ff6200', depthAccent: '#00a1ca', font: '#000000' },
];

interface ThemeViewTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
}

// Color input component
const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
      <label
        style={{
          fontFamily: '"Lato", sans-serif',
          fontWeight: 600,
          fontSize: '14px',
          color: '#023337',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: value,
            border: '1px solid #ddd',
          }}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            fontFamily: '"Lato", sans-serif',
            fontSize: '14px',
            color: '#333',
            outline: 'none',
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            cursor: 'pointer',
            opacity: 0,
            position: 'absolute',
          }}
        />
      </div>
    </div>
  );
};

// Theme card component for Ready Made Theme
const ThemeCard: React.FC<{
  themeId: string;
  isSelected: boolean;
  onSelect: () => void;
  imageUrl?: string;
}> = ({ themeId, isSelected, onSelect, imageUrl }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onSelect}
      style={{
        width: '262px',
        backgroundColor: 'white',
        border: isSelected ? '1.5px solid #ff6a00' : '1.5px solid #f9f9f9',
        borderRadius: '8px',
        overflow: 'hidden',
        paddingBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', width: '100%' }}>
        {/* Preview Image */}
        <div
          style={{
            width: '100%',
            height: '168px',
            backgroundColor: '#f0f0f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`Theme ${themeId}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '14px',
            }}>
              Theme Preview
            </div>
          )}
        </div>

        {/* Select/Selected Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          style={{
            width: '142px',
            height: '33px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '"Lato", sans-serif',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '-0.3px',
            transition: 'all 0.2s ease',
            ...(isSelected
              ? {
                  background: 'linear-gradient(180deg, rgba(255,106,0,0.2) 0%, rgba(255,159,28,0.2) 100%)',
                  color: 'transparent',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundImage: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
                }
              : {
                  backgroundColor: '#f9f9f9',
                  color: 'black',
                }),
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
};

export const ThemeViewTab: React.FC<ThemeViewTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration
}) => {
  const [selectedColourPreset, setSelectedColourPreset] = useState(1);
  const [themeColorsEnabled, setThemeColorsEnabled] = useState(
    (websiteConfiguration as any).themeColorsEnabled ?? false
  );
  const [themeColors, setThemeColors] = useState({
    primary: '#1e90ff',
    secondary: '#ff6a00',
    depthAccent: '#00400e',
    font: '#000000',
  });

  // Get selected ready theme from config
  const selectedTheme = (websiteConfiguration as any).readyTheme || 'gadgets1';

  const handleThemeSelect = (themeId: string) => {
    // Find the matching ready-made theme to get its bundled productDetailTheme
    const themeEntry = READY_MADE_THEMES.find(t => t.id === themeId);
    const bundledProductDetailTheme = themeEntry?.productDetailTheme || DEFAULT_PRODUCT_DETAIL_THEME;
    setWebsiteConfiguration(prev => ({
      ...prev,
      readyTheme: themeId,
      productDetailTheme: bundledProductDetailTheme,
    }));
  };

  const handleColorPresetSelect = (preset: typeof READY_COLOURS[0]) => {
    setSelectedColourPreset(preset.id);
    setThemeColors({
      primary: preset.primary,
      secondary: preset.secondary,
      depthAccent: preset.depthAccent,
      font: preset.font,
    });
    // Update website config with colors
    setWebsiteConfiguration(prev => ({
      ...prev,
      themeColors: {
        primary: preset.primary,
        secondary: preset.secondary,
        depthAccent: preset.depthAccent,
        font: preset.font,
      }
    }));
  };

  const handleShuffleColors = () => {
    const randomIndex = Math.floor(Math.random() * READY_COLOURS.length);
    handleColorPresetSelect(READY_COLOURS[randomIndex]);
  };

  const handleColorChange = (colorKey: keyof typeof themeColors, value: string) => {
    setThemeColors(prev => ({ ...prev, [colorKey]: value }));
    setWebsiteConfiguration(prev => ({
      ...prev,
      themeColors: {
        ...(prev as any).themeColors,
        [colorKey]: value,
      }
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Theme Colour Section */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        {/* Enable/Disable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3
            style={{
              fontFamily: '"Lato", sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: '#023337',
              margin: 0,
            }}
          >
            Theme Colour
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#666' }}>
              {themeColorsEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => {
                const newValue = !themeColorsEnabled;
                setThemeColorsEnabled(newValue);
                setWebsiteConfiguration(prev => ({
                  ...prev,
                  themeColorsEnabled: newValue
                }));
              }}
              style={{
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: themeColorsEnabled ? '#22c55e' : '#d1d5db',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: themeColorsEnabled ? '26px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Color Inputs Row */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '24px',
          opacity: themeColorsEnabled ? 1 : 0.5,
          pointerEvents: themeColorsEnabled ? 'auto' : 'none',
        }}>
          <ColorInput
            label="Primary"
            value={themeColors.primary}
            onChange={(val) => handleColorChange('primary', val)}
          />
          <ColorInput
            label="Secondary"
            value={themeColors.secondary}
            onChange={(val) => handleColorChange('secondary', val)}
          />
          <ColorInput
            label="Depth Accent"
            value={themeColors.depthAccent}
            onChange={(val) => handleColorChange('depthAccent', val)}
          />
          <ColorInput
            label="Font Colour"
            value={themeColors.font}
            onChange={(val) => handleColorChange('font', val)}
          />
        </div>

        {/* Ready Colours Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          opacity: themeColorsEnabled ? 1 : 0.5,
          pointerEvents: themeColorsEnabled ? 'auto' : 'none',
        }}>
          <span
            style={{
              fontFamily: '"Lato", sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: '#023337',
            }}
          >
            Ready Colours
          </span>

          {/* Color Presets */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {READY_COLOURS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleColorPresetSelect(preset)}
                style={{
                  display: 'flex',
                  gap: '3px',
                  padding: '6px 8px',
                  backgroundColor: selectedColourPreset === preset.id ? '#e8f4ff' : '#f9f9f9',
                  border: selectedColourPreset === preset.id ? '2px solid #1e90ff' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: preset.primary }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: preset.secondary }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: preset.depthAccent }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: preset.font }} />
              </button>
            ))}
          </div>

          {/* Shuffle Button */}
          <button
            onClick={handleShuffleColors}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: '"Lato", sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: '#333',
              transition: 'all 0.2s ease',
            }}
          >
            <Shuffle size={16} />
            Shuffle
          </button>
        </div>
      </div>

      {/* Ready-Made Themes — all storefront + product detail combos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* ── All Ready-Made Themes (Gadgets + StoreFront merged) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '22px', color: '#023337', letterSpacing: '0.11px', margin: 0 }}>
            Ready Made Themes
          </h3>
          <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#666', margin: 0 }}>
            Select a theme for your store. Each theme includes a matching storefront and product detail page.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {READY_MADE_THEMES.map((theme) => {
              const demoImage = THEME_DEMO_IMAGES.readyThemes?.[theme.id];
              return (
                <ThemeCard
                  key={theme.id}
                  themeId={theme.id}
                  isSelected={selectedTheme === theme.id}
                  onSelect={() => handleThemeSelect(theme.id)}
                  imageUrl={demoImage}
                />
              );
            })}
          </div>
        </div>

        {/* ── Coming-Soon niche categories (Fashion, Grocery, Cosmetics, Pharmacy) ── */}
        {COMING_SOON_CATEGORIES.map((category) => (
          <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '22px', color: '#023337', letterSpacing: '0.11px', margin: 0 }}>
              {category.title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {category.themes.map((themeId) => {
                const demoImage = THEME_DEMO_IMAGES.readyThemes?.[themeId];
                return (
                  <ThemeCard
                    key={themeId}
                    themeId={themeId}
                    isSelected={selectedTheme === themeId}
                    onSelect={() => handleThemeSelect(themeId)}
                    imageUrl={demoImage}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Coming-Soon component sections (Footer, Category, Showcase, Brands) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {COMING_SOON_SECTIONS.map((section) => (
            <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '22px', color: '#023337', letterSpacing: '0.11px', margin: 0 }}>
                {section.title}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  backgroundColor: '#f9fafc',
                  borderRadius: '8px',
                  border: '1.5px dashed #e0e0e0',
                }}
              >
                <span style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '15px', color: '#999' }}>
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeViewTab;
