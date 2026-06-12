import React from 'react';
import { Search, Camera } from 'lucide-react';
import {
  VoiceButton,
  SearchSuggestions,
  VoiceStreamOverlay,
  SearchHintOverlay
} from './SearchBar';
import type { HeaderSearchProps } from './headerTypes';

// Camera button - triggers image search modal
interface CameraButtonProps {
  onClick?: () => void;
}

const CameraButton: React.FC<CameraButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-gray-500 hover:text-theme-primary transition-colors"
      title="AI Product Search - Upload or capture an image"
    >
      <Camera size={20} />
    </button>
  );
};


export const DesktopSearchBar: React.FC<HeaderSearchProps> = ({
  containerRef,
  activeSearchValue,
  onInputChange,
  suggestions,
  isSuggestionsOpen,
  onSuggestionClick,
  activeHint,
  activeHintIndex,
  isListening,
  liveTranscript,
  supportsVoiceSearch,
  onVoiceSearch,
  onVisualSearch
}) => (
  <div ref={containerRef} className="hidden md:flex flex-1 max-w-2xl relative">
    <SearchHintOverlay
      activeSearchValue={activeSearchValue}
      activeHint={activeHint}
      activeHintIndex={activeHintIndex}
      offsetClass="left-5"
    />
    <input
      type="text"
      placeholder={activeHint ? '' : 'Search products...'}
      value={activeSearchValue}
      onChange={(event) => onInputChange(event.target.value)}
      className="relative flex items-center bg-white rounded-lg transition-all duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange- 500 w-full py-2 pl-4 pr-12 text-sm focus:outline-none"
    />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
      {/* <CameraButton onClick={onVisualSearch} /> */}
      {/* <VoiceButton
        isListening={isListening}
        supportsVoiceSearch={supportsVoiceSearch}
        onVoiceSearch={onVoiceSearch}
      /> */}
      {/* <button className="btn-order px-5 py-2 rounded-full font-semibold hover:shadow-lg active:scale-95">
        <Search size={18} />
      </button> */}
    </div>
    {isSuggestionsOpen && suggestions.length > 0 && (
      <SearchSuggestions suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
    )}
    <VoiceStreamOverlay isListening={isListening} transcript={liveTranscript} />
  </div>
);

export const MobileSearchBar: React.FC<HeaderSearchProps> = ({
  containerRef,
  activeSearchValue,
  onInputChange,
  suggestions,
  isSuggestionsOpen,
  onSuggestionClick,
  activeHint,
  activeHintIndex,
  isListening,
  liveTranscript,
  supportsVoiceSearch,
  onVoiceSearch,
  onVisualSearch
}) => (
  <div ref={containerRef} className="flex-1 relative">
    <SearchHintOverlay
      activeSearchValue={activeSearchValue}
      activeHint={activeHint}
      activeHintIndex={activeHintIndex}
      offsetClass="left-4"
    />
    <input
      type="text"
      placeholder={activeHint ? '' : 'Search products...'}
      value={activeSearchValue}
      onChange={(event) => onInputChange(event.target.value)}
      className="w-full border-2 border-gray-200 focus:border-theme-primary rounded-full py-3 pl-4 pr-28 text-sm focus:outline-none focus:ring-4 focus:ring-theme-primary/10 bg-gray-50 focus:bg-white transition-all"
    />
    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
      <CameraButton onClick={onVisualSearch} />
      <VoiceButton
        isListening={isListening}
        supportsVoiceSearch={supportsVoiceSearch}
        onVoiceSearch={onVoiceSearch}
      />
      <button className="btn-order p-2.5 rounded-full active:scale-95">
        <Search size={16} />
      </button>
    </div>
    {isSuggestionsOpen && suggestions.length > 0 && (
      <div className="absolute left-0 right-0 top-full mt-2 z-50">
        <SearchSuggestions suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
      </div>
    )}
    <VoiceStreamOverlay isListening={isListening} transcript={liveTranscript} />
  </div>
);
