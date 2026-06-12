import { ThemeConfig, WebsiteConfig, SocialLink, CarouselItem, FooterLink, Popup, Campaign, Product } from '../../types';

export interface AdminCustomizationProps {
  tenantSubdomain?: string;
  tenantId: string;
  logo: string | null;
  onUpdateLogo: (logo: string | null) => void;
  themeConfig?: ThemeConfig;
  onUpdateTheme?: (config: ThemeConfig) => Promise<void>;
  websiteConfig?: WebsiteConfig;
  onUpdateWebsiteConfig?: (config: WebsiteConfig) => Promise<void>;
  initialTab?: string;
  products?: Product[];
}

export type ColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'font'
  | 'hover'
  | 'surface'
  | 'adminBg'
  | 'adminInputBg'
  | 'adminBorder'
  | 'adminFocus';

export type FooterLinkField = 'footerQuickLinks' | 'footerUsefulLinks';

export type ImageUploadType =
  | 'logo'
  | 'favicon'
  | 'carousel'
  | 'carouselMobile'
  | 'popup'
  | 'headerLogo'
  | 'footerLogo';

export type CarouselFilterStatus = 'All' | 'Publish' | 'Draft' | 'Trash';
export type PopupFilterStatus = 'All' | 'Publish' | 'Draft';
export type CampaignFilterStatus = 'All' | 'Publish' | 'Draft';

// Re-export types from main types file for convenience
export type { ThemeConfig, WebsiteConfig, SocialLink, CarouselItem, FooterLink, Popup, Campaign, Product };
