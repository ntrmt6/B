// Section Variant Definitions for Store Studio Component Library

export interface SectionVariant {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  settings: Record<string, any>;
}

export interface SectionCategory {
  id: string;
  name: string;
  icon: string;
  variants: SectionVariant[];
}

// Demo images for style previews
export const THEME_DEMO_IMAGES: Record<string, Record<string, string>> = {
  headerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1771447828354.webp',
    style2: 'https://hdnfltv.com/image/nitimages/header-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/header-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/header-4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/header_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/pasted_1771520591605.webp',
    style7: 'https://hdnfltv.com/image/nitimages/Header7.webp',
  },
  mobileHeaderStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/mobile_header_-_1_1768841563.webp',
    style2: 'https://hdnfltv.com/image/nitimages/mobile_header_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/mobile_header_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/mobile_header_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/mobile_header_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Mobile_header_6.webp',
  },
  productCardStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/product_card_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/pasted_1772910489898.webp',
    style3: 'https://hdnfltv.com/image/nitimages/product_card_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/product_card_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/product_card_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Product_card_style6.webp',
  },
  footerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1773259417132.webp',
    style2: 'https://hdnfltv.com/image/nitimages/footer_-_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/footer_-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/footer_-4_orginal.webp',
    style5: 'https://hdnfltv.com/image/nitimages/footer_5_1768901505.webp',
  },
  bottomNavStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/bottomNav-1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/bottomNav-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/bottomNav-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/bottomNav_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/bottomNav-5.webp',
  },
  categorySectionStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/category_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/category-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/category_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/category_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style7: 'https://hdnfltv.com/image/nitimages/category-5.webp',
  },
};

// Header Style Variants (5 styles)
const headerVariants: SectionVariant[] = [
  { id: 'header-style1', name: '1', description: 'Classic centered logo with horizontal menu', thumbnail: THEME_DEMO_IMAGES.headerStyle.style1, settings: { headerStyle: 'style1' } },
  { id: 'header-style2', name: 'Header Style 2', description: 'Left logo with search bar and cart', thumbnail: THEME_DEMO_IMAGES.headerStyle.style2, settings: { headerStyle: 'style2' } },
  { id: 'header-style3', name: 'Header Style 3', description: 'Minimal header with hamburger menu', thumbnail: THEME_DEMO_IMAGES.headerStyle.style3, settings: { headerStyle: 'style3' } },
  { id: 'header-style4', name: 'Header Style 4', description: 'Full-width with category dropdown', thumbnail: THEME_DEMO_IMAGES.headerStyle.style4, settings: { headerStyle: 'style4' } },
  { id: 'header-style5', name: 'Header Style 5', description: 'Modern header with mega menu', thumbnail: THEME_DEMO_IMAGES.headerStyle.style5, settings: { headerStyle: 'style5' } },
  { id: 'header-style6', name: 'Header Style 6', description: 'Vibrant orange gradient with pill search', thumbnail: THEME_DEMO_IMAGES.headerStyle.style6, settings: { headerStyle: 'style6' } },
  { id: 'header-style7', name: 'Header Style 7', description: 'Gadgets theme with admin notice bar, lime accent search & cart', thumbnail: THEME_DEMO_IMAGES.headerStyle.style7, settings: { headerStyle: 'style7' } },
];

// Mobile Header Style Variants (5 styles)
const mobileHeaderVariants: SectionVariant[] = [
  { id: 'mobile-header-style1', name: 'Mobile Header 1', description: 'Compact with logo and icons', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style1, settings: { mobileHeaderStyle: 'style1' } },
  { id: 'mobile-header-style2', name: 'Mobile Header 2', description: 'Search-focused mobile header', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style2, settings: { mobileHeaderStyle: 'style2' } },
  { id: 'mobile-header-style3', name: 'Mobile Header 3', description: 'Minimal icons with slide menu', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style3, settings: { mobileHeaderStyle: 'style3' } },
  { id: 'mobile-header-style4', name: 'Mobile Header 4', description: 'Full search bar mobile header', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style4, settings: { mobileHeaderStyle: 'style4' } },
  { id: 'mobile-header-style5', name: 'Mobile Header 5', description: 'Category tabs mobile header', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style5, settings: { mobileHeaderStyle: 'style5' } },
  { id: 'mobile-header-style6', name: 'Mobile Header 6', description: 'Vibrant orange gradient mobile header', thumbnail: THEME_DEMO_IMAGES.mobileHeaderStyle.style6, settings: { mobileHeaderStyle: 'style6' } },
];

// Product Card Style Variants (6 styles)
const productCardVariants: SectionVariant[] = [
  { id: 'product-card-style1', name: 'Product Card 1', description: 'Classic card with image and price', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style1, settings: { productCardStyle: 'style1' } },
  { id: 'product-card-style2', name: 'Product Card 2', description: 'Card with hover effects', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style2, settings: { productCardStyle: 'style2' } },
  { id: 'product-card-style3', name: 'Product Card 3', description: 'Minimal card with quick add', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style3, settings: { productCardStyle: 'style3' } },
  { id: 'product-card-style4', name: 'Product Card 4', description: 'Card with rating and discount', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style4, settings: { productCardStyle: 'style4' } },
  { id: 'product-card-style5', name: 'Product Card 5', description: 'Modern card with animations', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style5, settings: { productCardStyle: 'style5' } },
  { id: 'product-card-style6', name: 'Product Card 6', description: 'Overlay card with gradient and badges', thumbnail: THEME_DEMO_IMAGES.productCardStyle.style6, settings: { productCardStyle: 'style6' } },
];

// Category Section Style Variants (5 styles)
const categorySectionVariants: SectionVariant[] = [
  { id: 'category-style1', name: 'Category Style 1', description: 'Grid layout with images', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style1, settings: { categorySectionStyle: 'style1' } },
  { id: 'category-style2', name: 'Category Style 2', description: 'Circular icons style', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style2, settings: { categorySectionStyle: 'style2' } },
  { id: 'category-style3', name: 'Category Style 3', description: 'Card-based categories', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style3, settings: { categorySectionStyle: 'style3' } },
  { id: 'category-style4', name: 'Category Style 4', description: 'Banner style categories', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style4, settings: { categorySectionStyle: 'style4' } },
  { id: 'category-style5', name: 'Category Style 5', description: 'Modern slider categories', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style5, settings: { categorySectionStyle: 'style5' } },
  { id: 'category-style6', name: 'Category Style 6', description: 'Colorful large cards', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style6, settings: { categorySectionStyle: 'style6' } },
  { id: 'category-style7', name: 'Category Style 7', description: 'Gadgets theme with rounded cards, 2-col mobile / 8-col desktop', thumbnail: THEME_DEMO_IMAGES.categorySectionStyle.style7, settings: { categorySectionStyle: 'style7' } },
];

// Product Section Style Variants (5 styles)
const productSectionVariants: SectionVariant[] = [
  { id: 'product-section-style1', name: 'Product Section 1', description: 'Standard grid layout', settings: { productSectionStyle: 'style1' } },
  { id: 'product-section-style2', name: 'Product Section 2', description: 'Compact grid with borders', settings: { productSectionStyle: 'style2' } },
  { id: 'product-section-style3', name: 'Product Section 3', description: 'Cards with shadow', settings: { productSectionStyle: 'style3' } },
  { id: 'product-section-style4', name: 'Product Section 4', description: 'Minimal clean layout', settings: { productSectionStyle: 'style4' } },
  { id: 'product-section-style5', name: 'Product Section 5', description: 'Modern with animations', settings: { productSectionStyle: 'style5' } },
];

// Brand Section Style Variants (5 styles)
const brandSectionVariants: SectionVariant[] = [
  { id: 'brand-section-style1', name: 'Brand Style 1', description: 'Marquee auto-scroll logos', settings: { brandSectionStyle: 'style1' } },
  { id: 'brand-section-style2', name: 'Brand Style 2', description: 'Grid with hover effects', settings: { brandSectionStyle: 'style2' } },
  { id: 'brand-section-style3', name: 'Brand Style 3', description: 'Horizontal scroll strip', settings: { brandSectionStyle: 'style3' } },
  { id: 'brand-section-style4', name: 'Brand Style 4', description: 'Card-based brand display', settings: { brandSectionStyle: 'style4' } },
  { id: 'brand-section-style5', name: 'Brand Style 5', description: 'Circular brand badges', settings: { brandSectionStyle: 'style5' } },
];

// Footer Style Variants (5 styles)
const footerVariants: SectionVariant[] = [
  { id: 'footer-style1', name: 'Footer Style 1', description: 'Classic multi-column footer', thumbnail: THEME_DEMO_IMAGES.footerStyle.style1, settings: { footerStyle: 'style1' } },
  { id: 'footer-style2', name: 'Footer Style 2', description: 'Minimal centered footer', thumbnail: THEME_DEMO_IMAGES.footerStyle.style2, settings: { footerStyle: 'style2' } },
  { id: 'footer-style3', name: 'Footer Style 3', description: 'Footer with newsletter', thumbnail: THEME_DEMO_IMAGES.footerStyle.style3, settings: { footerStyle: 'style3' } },
  { id: 'footer-style4', name: 'Footer Style 4', description: 'Dark themed footer', thumbnail: THEME_DEMO_IMAGES.footerStyle.style4, settings: { footerStyle: 'style4' } },
  { id: 'footer-style5', name: 'Footer Style 5', description: 'Modern footer with social', thumbnail: THEME_DEMO_IMAGES.footerStyle.style5, settings: { footerStyle: 'style5' } },
];

// Bottom Nav Style Variants (5 styles)
const bottomNavVariants: SectionVariant[] = [
  { id: 'bottom-nav-style1', name: 'Bottom Nav 1', description: 'Classic 5-icon navigation', thumbnail: THEME_DEMO_IMAGES.bottomNavStyle.style1, settings: { bottomNavStyle: 'style1' } },
  { id: 'bottom-nav-style2', name: 'Bottom Nav 2', description: 'Floating action button style', thumbnail: THEME_DEMO_IMAGES.bottomNavStyle.style2, settings: { bottomNavStyle: 'style2' } },
  { id: 'bottom-nav-style3', name: 'Bottom Nav 3', description: 'Minimal icons navigation', thumbnail: THEME_DEMO_IMAGES.bottomNavStyle.style3, settings: { bottomNavStyle: 'style3' } },
  { id: 'bottom-nav-style4', name: 'Bottom Nav 4', description: 'Curved bottom navigation', thumbnail: THEME_DEMO_IMAGES.bottomNavStyle.style4, settings: { bottomNavStyle: 'style4' } },
  { id: 'bottom-nav-style5', name: 'Bottom Nav 5', description: 'Pill-shaped active state', thumbnail: THEME_DEMO_IMAGES.bottomNavStyle.style5, settings: { bottomNavStyle: 'style5' } },
];

// Announcement Bar Variants
const announcementVariants: SectionVariant[] = [
  { id: 'announcement-1', name: 'Announcement Bar 1', description: 'Gradient background with icons', settings: { backgroundColor: '#7c3aed', textColor: '#ffffff', text: '🎉 For a limited time, enjoy a 20% discount on all our products! 🎉' } },
  { id: 'announcement-2', name: 'Announcement Bar 2', description: 'With phone and social media links', settings: { backgroundColor: '#1e40af', textColor: '#ffffff', showPhone: true, showSocial: true } },
  { id: 'announcement-3', name: 'Announcement Bar 3', description: 'With contact links and email/phone', settings: { backgroundColor: '#059669', textColor: '#ffffff', showContact: true } },
];

// Hero Section Variants
const heroVariants: SectionVariant[] = [
  { id: 'hero-1', name: 'Hero Banner 1', description: 'Full-width with centered text', settings: { height: 'large', alignment: 'center', overlayOpacity: 40 } },
  { id: 'hero-2', name: 'Hero Banner 2', description: 'Split layout with image right', settings: { height: 'large', alignment: 'left', layout: 'split' } },
  { id: 'hero-3', name: 'Hero Banner 3', description: 'Video background hero', settings: { height: 'large', alignment: 'center', useVideo: true } },
  { id: 'hero-4', name: 'Hero Banner 4', description: 'Slideshow carousel hero', settings: { height: 'large', alignment: 'center', isSlideshow: true } },
];

// Headings Variants
const headingsVariants: SectionVariant[] = [
  { id: 'heading-1', name: 'Section Heading 1', description: 'Section heading with title, subtitle and optional button', settings: { title: 'Best Product', subtitle: 'Section subtitle text goes here', showButton: false } },
];

// Static Banner Variants
const staticBannerVariants: SectionVariant[] = [
  { id: 'static-1', name: 'Static Banner 1', description: 'Full-width promotional banner', settings: { layout: 'full' } },
  { id: 'static-2', name: 'Static Banner 2', description: 'Two-column banner', settings: { layout: 'two-column' } },
  { id: 'static-3', name: 'Static Banner 3', description: 'Three-column banner', settings: { layout: 'three-column' } },
  { id: 'static-4', name: 'Static Banner 4', description: 'Image with text overlay', settings: { layout: 'overlay' } },
];

// Special Offers Variants
const specialOffersVariants: SectionVariant[] = [
  { id: 'special-1', name: 'Flash Sale 1', description: 'Countdown timer with products', settings: { showCountdown: true, style: 'cards' } },
  { id: 'special-2', name: 'Flash Sale 2', description: 'Banner style flash sale', settings: { showCountdown: true, style: 'banner' } },
  { id: 'special-3', name: 'Deal of the Day', description: 'Single product highlight', settings: { showCountdown: true, style: 'single' } },
  { id: 'special-4', name: 'Limited Time Offer', description: 'Grid of discounted products', settings: { showCountdown: false, style: 'grid' } },
  { id: 'special-5', name: 'Clearance Sale', description: 'Clearance products section', settings: { showCountdown: false, style: 'clearance' } },
];

// Trust Badges Variants
const trustBadgesVariants: SectionVariant[] = [
  { id: 'trust-1', name: 'Trust Badges 1', description: 'Icon badges in a row', settings: { style: 'icons' } },
  { id: 'trust-2', name: 'Trust Badges 2', description: 'Cards with descriptions', settings: { style: 'cards' } },
  { id: 'trust-3', name: 'Trust Badges 3', description: 'Minimal text badges', settings: { style: 'minimal' } },
];

// Reviews Variants
const reviewsVariants: SectionVariant[] = [
  { id: 'reviews-1', name: 'Reviews Carousel', description: 'Sliding testimonial cards', settings: { style: 'carousel' } },
  { id: 'reviews-2', name: 'Reviews Grid', description: 'Grid of review cards', settings: { style: 'grid' } },
  { id: 'reviews-3', name: 'Reviews Wall', description: 'Masonry layout reviews', settings: { style: 'masonry' } },
];

// Brand Showcase Variants
const brandShowcaseVariants: SectionVariant[] = [
  { id: 'brand-1', name: 'Brand Carousel', description: 'Auto-scrolling brand logos', settings: { style: 'carousel', grayscale: true } },
  { id: 'brand-2', name: 'Brand Grid', description: 'Static logo grid', settings: { style: 'grid', grayscale: false } },
  { id: 'brand-3', name: 'Brand Marquee', description: 'Infinite scroll marquee', settings: { style: 'marquee', grayscale: true } },
];

// Product Grid Variants
const productGridVariants: SectionVariant[] = [
  { id: 'product-grid-1', name: 'Product Grid 1', description: '4-column product grid', settings: { columns: 4, style: 'default' } },
  { id: 'product-grid-2', name: 'Product Grid 2', description: '3-column with large cards', settings: { columns: 3, style: 'large' } },
  { id: 'product-grid-3', name: 'Product Carousel', description: 'Sliding product carousel', settings: { columns: 4, style: 'carousel' } },
  { id: 'product-grid-4', name: 'Product List', description: 'List view with details', settings: { columns: 1, style: 'list' } },
];

// Custom Section Variants
const customSectionVariants: SectionVariant[] = [
  { id: 'custom-1', name: 'Custom HTML', description: 'Add your own HTML code', settings: { html: '' } },
  { id: 'custom-2', name: 'Rich Text', description: 'Formatted text content', settings: { content: '' } },
];

// All categories with their variants
export const sectionCategories: SectionCategory[] = [
  { id: 'header', name: 'Header Styles', icon: 'layout', variants: headerVariants },
  { id: 'mobile-header', name: 'Mobile Header', icon: 'navigation', variants: mobileHeaderVariants },
  { id: 'announcement', name: 'Announcement Bars', icon: 'megaphone', variants: announcementVariants },
  { id: 'hero', name: 'Hero Sections', icon: 'star', variants: heroVariants },
  { id: 'headings', name: 'Headings', icon: 'type', variants: headingsVariants },
  { id: 'static-banner', name: 'Static Banners', icon: 'image', variants: staticBannerVariants },
  { id: 'category-section', name: 'Category Sections', icon: 'grid', variants: categorySectionVariants },
  { id: 'special-offers', name: 'Special Offers', icon: 'zap', variants: specialOffersVariants },
  { id: 'product-card', name: 'Product Card Styles', icon: 'shopping-bag', variants: productCardVariants },
  { id: 'product-section', name: 'Product Section Styles', icon: 'grid', variants: productSectionVariants },
  { id: 'product-grid', name: 'Product Grids', icon: 'grid', variants: productGridVariants },
  { id: 'brand-section', name: 'Brand Section Styles', icon: 'layers', variants: brandSectionVariants },
  { id: 'trust-badges', name: 'Trust Badges', icon: 'shield', variants: trustBadgesVariants },
  { id: 'reviews', name: 'Reviews', icon: 'message', variants: reviewsVariants },
  { id: 'brand-showcase', name: 'Brand Showcase', icon: 'layers', variants: brandShowcaseVariants },
  { id: 'footer', name: 'Footer Styles', icon: 'footer', variants: footerVariants },
  { id: 'bottom-nav', name: 'Bottom Navigation', icon: 'navigation', variants: bottomNavVariants },
  { id: 'custom', name: 'Custom Section', icon: 'layers', variants: customSectionVariants },
];

// Map variant IDs to section types
export const variantToSectionType: Record<string, string> = {
  'announcement-1': 'announcement-bar', 'announcement-2': 'announcement-bar', 'announcement-3': 'announcement-bar',
  'header-style1': 'header', 'header-style2': 'header', 'header-style3': 'header', 'header-style4': 'header', 'header-style5': 'header', 'header-style6': 'header', 'header-style7': 'header',
  'mobile-header-style1': 'header', 'mobile-header-style2': 'header', 'mobile-header-style3': 'header', 'mobile-header-style4': 'header', 'mobile-header-style5': 'header', 'mobile-header-style6': 'header', 'mobile-header-style7': 'header',
  'hero-1': 'hero', 'hero-2': 'hero', 'hero-3': 'hero', 'hero-4': 'hero',
  'heading-1': 'rich-text',
  'static-1': 'image-banner', 'static-2': 'image-banner', 'static-3': 'image-banner', 'static-4': 'image-banner',
  'category-style1': 'categories', 'category-style2': 'categories', 'category-style3': 'categories', 'category-style4': 'categories', 'category-style5': 'categories', 'category-style6': 'categories', 'category-style7': 'categories',
  'special-1': 'flash-sale', 'special-2': 'flash-sale', 'special-3': 'flash-sale', 'special-4': 'flash-sale', 'special-5': 'flash-sale',
  'product-card-style1': 'product-grid', 'product-card-style2': 'product-grid', 'product-card-style3': 'product-grid', 'product-card-style4': 'product-grid', 'product-card-style5': 'product-grid',
  'product-section-style1': 'product-grid', 'product-section-style2': 'product-grid', 'product-section-style3': 'product-grid', 'product-section-style4': 'product-grid', 'product-section-style5': 'product-grid',
  'product-grid-1': 'product-grid', 'product-grid-2': 'product-grid', 'product-grid-3': 'product-grid', 'product-grid-4': 'product-grid',
  'brand-section-style1': 'brands', 'brand-section-style2': 'brands', 'brand-section-style3': 'brands', 'brand-section-style4': 'brands', 'brand-section-style5': 'brands',
  'trust-1': 'multicolumn', 'trust-2': 'multicolumn', 'trust-3': 'multicolumn',
  'reviews-1': 'testimonials', 'reviews-2': 'testimonials', 'reviews-3': 'testimonials',
  'brand-1': 'brand-list', 'brand-2': 'brand-list', 'brand-3': 'brand-list',
  'footer-style1': 'footer', 'footer-style2': 'footer', 'footer-style3': 'footer', 'footer-style4': 'footer', 'footer-style5': 'footer',
  'bottom-nav-style1': 'footer', 'bottom-nav-style2': 'footer', 'bottom-nav-style3': 'footer', 'bottom-nav-style4': 'footer', 'bottom-nav-style5': 'footer',
  'custom-1': 'custom-html', 'custom-2': 'rich-text',
};

// Map variant IDs to theme config keys (for styles that affect global theme)
export const variantToThemeConfigKey: Record<string, string> = {
  'header-style1': 'headerStyle', 'header-style2': 'headerStyle', 'header-style3': 'headerStyle', 'header-style4': 'headerStyle', 'header-style5': 'headerStyle', 'header-style6': 'headerStyle', 'header-style7': 'headerStyle',
  'mobile-header-style1': 'mobileHeaderStyle', 'mobile-header-style2': 'mobileHeaderStyle', 'mobile-header-style3': 'mobileHeaderStyle', 'mobile-header-style4': 'mobileHeaderStyle', 'mobile-header-style5': 'mobileHeaderStyle', 'mobile-header-style6': 'mobileHeaderStyle', 'mobile-header-style7': 'mobileHeaderStyle',
  'product-card-style1': 'productCardStyle', 'product-card-style2': 'productCardStyle', 'product-card-style3': 'productCardStyle', 'product-card-style4': 'productCardStyle', 'product-card-style5': 'productCardStyle',
  'product-section-style1': 'productSectionStyle', 'product-section-style2': 'productSectionStyle', 'product-section-style3': 'productSectionStyle', 'product-section-style4': 'productSectionStyle', 'product-section-style5': 'productSectionStyle',
  'category-style1': 'categorySectionStyle', 'category-style2': 'categorySectionStyle', 'category-style3': 'categorySectionStyle', 'category-style4': 'categorySectionStyle', 'category-style5': 'categorySectionStyle', 'category-style6': 'categorySectionStyle', 'category-style7': 'categorySectionStyle',
  'brand-section-style1': 'brandSectionStyle', 'brand-section-style2': 'brandSectionStyle', 'brand-section-style3': 'brandSectionStyle', 'brand-section-style4': 'brandSectionStyle', 'brand-section-style5': 'brandSectionStyle',
  'footer-style1': 'footerStyle', 'footer-style2': 'footerStyle', 'footer-style3': 'footerStyle', 'footer-style4': 'footerStyle', 'footer-style5': 'footerStyle',
  'bottom-nav-style1': 'bottomNavStyle', 'bottom-nav-style2': 'bottomNavStyle', 'bottom-nav-style3': 'bottomNavStyle', 'bottom-nav-style4': 'bottomNavStyle', 'bottom-nav-style5': 'bottomNavStyle',
};
