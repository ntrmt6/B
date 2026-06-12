import React, { useState } from 'react';
import { sectionCategories, SectionCategory, SectionVariant, variantToSectionType, variantToThemeConfigKey } from './SectionVariants';

interface ComponentLibraryProps {
  onAddSection: (variantId: string, sectionType: string, settings: Record<string, any>, variantName: string) => void;
  onSelectStyle?: (themeConfigKey: string, styleValue: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentStyles?: Record<string, string>;
  onHoverPreview?: (thumbnail: string | null) => void;
}

// Category Icons
const CategoryIcons: Record<string, React.ReactElement> = {
  'layout': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"/></svg>,
  'star': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth="2"/></svg>,
  'type': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="4,7 4,4 20,4 20,7" strokeWidth="2"/><line x1="9" y1="20" x2="15" y2="20" strokeWidth="2"/><line x1="12" y1="4" x2="12" y2="20" strokeWidth="2"/></svg>,
  'image': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/><polyline points="21,15 16,10 5,21" strokeWidth="2"/></svg>,
  'grid': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" strokeWidth="2"/></svg>,
  'zap': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeWidth="2"/></svg>,
  'shield': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/></svg>,
  'message': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeWidth="2"/></svg>,
  'shopping-bag': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeWidth="2"/><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/><path d="M16 10a4 4 0 01-8 0" strokeWidth="2"/></svg>,
  'layers': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12,2 2,7 12,12 22,7" strokeWidth="2"/><polyline points="2,17 12,22 22,17" strokeWidth="2"/><polyline points="2,12 12,17 22,12" strokeWidth="2"/></svg>,
  'megaphone': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2"/></svg>,
  'navigation': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/><line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/></svg>,
  'footer': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><line x1="3" y1="15" x2="21" y2="15" strokeWidth="2"/></svg>,
};

const SearchIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"/></svg>;
const ChevronRight = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" strokeWidth="2"/></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>;
const CheckIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" strokeWidth="2"/></svg>;

// Check if variant is a theme style (header, footer, product card, etc.)
const isThemeStyle = (variantId: string): boolean => {
  return variantId in variantToThemeConfigKey;
};

// Get style value from variant ID (e.g., "header-style1" -> "style1")
const getStyleValue = (variantId: string): string => {
  const match = variantId.match(/style(\d+)$/);
  return match ? `style${match[1]}` : 'style1';
};

// Variant Preview Card - shows style name and description; selecting shows live preview
const VariantPreviewCard: React.FC<{ 
  variant: SectionVariant; 
  onAdd: () => void;
  onSelectStyle?: () => void;
  isSelected?: boolean;
  isStyleSelector?: boolean;
  onHoverPreview?: (thumbnail: string | null) => void;
}> = ({ variant, onAdd, onSelectStyle, isSelected, isStyleSelector, onHoverPreview }) => {
  const handleClick = () => {
    if (isStyleSelector && onSelectStyle) {
      onSelectStyle();
    } else {
      onAdd();
    }
  };
  
  return (
    <div 
      className={`relative cursor-pointer transition-all ${isSelected ? 'ring-2 ring-indigo-500 rounded-lg' : ''}`}
      onClick={handleClick}
    >
      <div className={`border rounded-lg overflow-hidden transition-all bg-white ${isSelected ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'}`}>
        {/* Preview Area */}
        <div className={`${isStyleSelector ? 'h-16' : 'h-20'} relative overflow-hidden`}>
          {isStyleSelector ? (
            /* Theme styles: show name and description as label */
            <div className={`w-full h-full flex flex-col items-center justify-center gap-1 px-2 ${
              isSelected 
                ? 'bg-indigo-50' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-blue-50'
            }`}>
              <span className={`text-xs font-semibold text-center ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                {variant.name}
              </span>
              <span className="text-[10px] text-gray-400 text-center leading-tight">{variant.description}</span>
            </div>
          ) : (
            /* Non-theme variants: show description */
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 text-center px-2">{variant.description}</span>
            </div>
          )}
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white">
              <CheckIcon />
            </div>
          )}
        </div>
        
        {/* Variant Name */}
        <div className={`px-2 py-1.5 border-t ${isSelected ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100'}`}>
          <span className={`text-xs font-medium block truncate ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
            {isStyleSelector ? (isSelected ? '✓ Selected' : 'Click to apply') : variant.name}
          </span>
        </div>
      </div>
    </div>
  );
};

// Category Accordion Component
const CategoryAccordion: React.FC<{
  category: SectionCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onAddVariant: (variant: SectionVariant) => void;
  onSelectStyle?: (variant: SectionVariant) => void;
  currentStyles?: Record<string, string>;
  searchQuery: string;
  onHoverPreview?: (thumbnail: string | null) => void;
}> = ({ category, isExpanded, onToggle, onAddVariant, onSelectStyle, currentStyles, searchQuery, onHoverPreview }) => {
  const filteredVariants = searchQuery
    ? category.variants.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : category.variants;
    
  if (searchQuery && filteredVariants.length === 0) return null;
  
  // Check if this category contains theme styles
  const hasThemeStyles = filteredVariants.some(v => isThemeStyle(v.id));
  
  // Get currently selected style for this category
  const getSelectedStyleId = (): string | null => {
    if (!currentStyles || !hasThemeStyles) return null;
    const firstVariant = filteredVariants[0];
    if (!firstVariant) return null;
    const configKey = variantToThemeConfigKey[firstVariant.id];
    if (!configKey || !currentStyles[configKey]) return null;
    const currentStyle = currentStyles[configKey];
    return filteredVariants.find(v => getStyleValue(v.id) === currentStyle)?.id || null;
  };
  
  const selectedStyleId = getSelectedStyleId();
  
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button 
        onClick={onToggle} 
        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50/50 transition-colors ${isExpanded ? 'bg-indigo-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className={`${isExpanded ? 'text-indigo-600' : 'text-gray-500'}`}>
            {CategoryIcons[category.icon] || CategoryIcons['layers']}
          </span>
          <div className="text-left">
            <span className={`font-semibold text-sm ${isExpanded ? 'text-indigo-700' : 'text-gray-800'}`}>
              {category.name}
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {filteredVariants.length} variants
            </span>
          </div>
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`}>
          <ChevronRight />
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-4 pt-2 bg-gray-50/50">
          {hasThemeStyles && (
            <div className="mb-2 px-1">
              <span className="text-xs text-indigo-600 font-medium">
                ✨ Select a style to preview and apply
              </span>
            </div>
          )}
          
          {/* Show actual store preview of currently selected style */}
          {hasThemeStyles && selectedStyleId && (() => {
            const selectedVariant = filteredVariants.find(v => v.id === selectedStyleId);
            if (selectedVariant?.thumbnail) {
              return (
                <div className="mb-3 rounded-lg overflow-hidden border border-indigo-200 shadow-sm">
                  <div className="px-2 py-1 bg-indigo-50 text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Preview icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>
                    Live Preview — How it looks in your store
                  </div>
                  <img 
                    src={selectedVariant.thumbnail} 
                    alt={`${selectedVariant.name} — Store Preview`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="px-2 py-1.5 bg-indigo-50 text-xs text-indigo-700 font-medium text-center">
                    {selectedVariant.name} — Currently Applied
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          <div className="grid grid-cols-2 gap-2">
            {filteredVariants.map((variant) => (
              <VariantPreviewCard 
                key={variant.id} 
                variant={variant} 
                onAdd={() => onAddVariant(variant)}
                onSelectStyle={onSelectStyle ? () => onSelectStyle(variant) : undefined}
                isSelected={selectedStyleId === variant.id}
                isStyleSelector={hasThemeStyles}
                onHoverPreview={onHoverPreview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main ComponentLibrary Component
export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ 
  onAddSection, 
  onSelectStyle,
  searchQuery, 
  onSearchChange,
  currentStyles,
  onHoverPreview
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('header');

  const handleAddVariant = (variant: SectionVariant) => {
    const sectionType = variantToSectionType[variant.id] || 'rich-text';
    onAddSection(variant.id, sectionType, variant.settings, variant.name);
  };

  const handleSelectStyle = (variant: SectionVariant) => {
    const configKey = variantToThemeConfigKey[variant.id];
    if (configKey && onSelectStyle) {
      const styleValue = getStyleValue(variant.id);
      onSelectStyle(configKey, styleValue);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = searchQuery
    ? sectionCategories.filter(cat => 
        cat.variants.some(v => 
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          v.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sectionCategories;

  const totalComponents = sectionCategories.reduce((acc, cat) => acc + cat.variants.length, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input 
            type="text" 
            placeholder="Search components..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white" 
          />
        </div>
      </div>
      
      {/* Categories List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <CategoryAccordion 
            key={category.id} 
            category={category} 
            isExpanded={expandedCategory === category.id || !!searchQuery} 
            onToggle={() => toggleCategory(category.id)} 
            onAddVariant={handleAddVariant}
            onSelectStyle={handleSelectStyle}
            currentStyles={currentStyles}
            searchQuery={searchQuery}
            onHoverPreview={onHoverPreview}
          />
        ))}
        
        {filteredCategories.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <SearchIcon />
            </div>
            <p className="font-medium">No components found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center font-medium">
          {totalComponents} total components
        </p>
      </div>
    </div>
  );
};

export default ComponentLibrary;
