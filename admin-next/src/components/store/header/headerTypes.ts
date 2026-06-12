import type { RefObject } from 'react';
import type { Product } from '../../../types';

export type CatalogGroup = {
  key: string;
  label: string;
  items: string[];
};

export interface HeaderSearchProps {
  inputProps: {};
  containerRef: RefObject<HTMLDivElement>;
  activeSearchValue: string;
  onInputChange: (value: string) => void;
  suggestions: Product[];
  isSuggestionsOpen: boolean;
  onSuggestionClick: (product: Product) => void;
  activeHint: string;
  activeHintIndex: number;
  isListening: boolean;
  liveTranscript: string;
  supportsVoiceSearch: boolean;
  onVoiceSearch: () => void;
  onVisualSearch?: () => void;
}