import React, { useState } from 'react';
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

const DEFAULT_PRODUCT_DETAIL_THEME = 'modern';

interface ThemeViewTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
}

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

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      <h3 style={{ fontFamily: '"Lato", sans-serif', fontWeight: 700, fontSize: '22px', color: '#023337', letterSpacing: '0.11px', margin: '0 0 8px 0' }}>
        Ready Made Themes
      </h3>
      <p style={{ fontFamily: '"Lato", sans-serif', fontSize: '14px', color: '#666', margin: '0 0 20px 0' }}>
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
  );
};

export default ThemeViewTab;
