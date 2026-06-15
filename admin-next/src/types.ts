
import React, { ReactNode } from 'react';

export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'active' | 'trialing' | 'suspended' | 'archived' | 'inactive' | 'pending';

export interface ShopStatus {
  isTrialing: boolean;
  isStartups: boolean;
  isEnterprise: boolean;
  isPremium: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
}

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface DomainMapping {
  id: string;
  tenantId: string;
  domain: string;
  type: 'subdomain' | 'custom';
  verified: boolean;
  isPrimary: boolean;
  sslEnabled: boolean;
  createdAt: string;
  verificationToken?: string;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
    verified: boolean;
  }[];
}

export interface Tenant {
  id: string;
  _id?: string; // MongoDB compatibility
  name: string;
  subdomain: string;
  customDomain?: string;
  customDomains?: DomainMapping[];
  contactEmail: string;
  contactName?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminAuthUid?: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  // Subscription fields
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  billingCycle?: 'monthly' | 'yearly';
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  locale?: string;
  currency?: string;
  branding?: TenantBranding;
  settings?: Record<string, any>;
  // Package/Subscription Management
  subscription?: {
    packageStartDate: string;
    packageDays: number;
    gracePeriodDays: number;
    isBlocked: boolean;
    lastRenewalDate?: string;
    lastNotificationShown?: string;
    renewalDismissedAt?: string;
  };
  // Shop Status
  shopStatus?: ShopStatus;
}

export interface CreateTenantPayload {
  name: string;
  contactEmail: string;
  contactName?: string;
  subdomain: string;
  plan?: TenantPlan;
  adminEmail: string;
  adminPassword: string;
}

export interface ProductVariantSelection {
  color: string;
  size: string;
}

export interface ProductVariantStock extends ProductVariantSelection {
  stock: number;
  sku?: string;
}

// Enhanced variant system with image support
export interface ProductVariantOption {
  attribute: string;
  extraPrice: number;
  image?: string;
}

export interface ProductVariantGroup {
  title: string;
  isMandatory?: boolean;
  options: ProductVariantOption[];
}

interface Variant {
  color: string;
  sizes: {
    size: string;
    stock?: number; // Optional, but good for inventory
  }[];
}

export interface Product {
  _id: string;
  condition: string;
  coins: ReactNode;
  sold: ReactNode;
  // sold: import("react/jsx-runtime").JSX.Element;
  title: string;
  salePrice: any;
  totalSold?: number;
  sales?: number;
  id: number;
  name: string;
  tenantId?: string;
  shopName?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number; // Cost price for profit calculation
  sku?: string; // Stock Keeping Unit
  isWholesale?: boolean; // Wholesale product flag
  image: string;
  galleryImages?: string[];
  slug?: string;
  discount?: string;
  videoUrl?: string; // YouTube video URL
  tag?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  subCategory?: string; // Added
  childCategory?: string; // Added
  brand?: string; // Added
  categories?: string[]; // Multi-select categories
  subCategories?: string[]; // Multi-select subcategories
  childCategories?: string[]; // Multi-select child categories
  brands?: string[]; // Multi-select brands
  tags?: string[];
  searchTags?: string[]; // Deep search tags for advanced product search
  deepSearch?: string; // Deep search keywords for product discovery
  colors?: string[]; // Added: Array of color codes or names
  sizes?: string[]; // Added: Array of size strings (S, M, L, XL etc)
  variantGroups?: ProductVariantGroup[]; // Enhanced variants with images
  status?: 'Active' | 'Draft'; // Added for filtering
  stock?: number;
  variantDefaults?: Partial<ProductVariantSelection>;
  variantStock?: ProductVariantStock[];
  flashSale?: boolean; // Flash sale flag
  flashSaleStartDate?: string; // ISO date string
  flashSaleEndDate?: string; // ISO date string
  soldCount?: number; // Adding '?' makes it optional if some products don't have it
  serial?: number;
  unitName?: string;
  warranty?: string;
  barcode?: string;
  initialSoldCount?: number;
  productionStart?: string;
  expirationEnd?: string;
  variants?: Variant[];
  details?: { type: string; description: string }[]; // Key features (e.g., Ram: 16 GB)
  shortDescription?: string; // Brief product description
  // Shipping
  deliveryCharge?: number;
  useDefaultDelivery?: boolean;
  deliveryChargeDefault?: number;
  deliveryByCity?: { city: string; charge: number }[];
  // SEO
  seoKeyword?: string;
  seoDescription?: string;
  seoTitle?: string;
  // Unfiltered/authentic product images
  unfilteredImages?: { url: string; uploadedAt: string }[];
  // RAG embedding for vector search
  embedding?: number[];
  // Multi-vendor marketplace
  vendorId?: string;
  vendorName?: string;
  // Marketplace aggregation fields (set when products come from /api/marketplace/*)
  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;
}

export interface Popup {
  id: number;
  name: string;
  image: string;
  url?: string;
  urlType?: 'Internal' | 'External';
  priority?: number;
  status: 'Draft' | 'Publish';
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  customerPhone: string | undefined;
  grandTotal: any;
  total: any;
  createdAt: string | number | Date;
  items: any;
  weight: number;
  pathaoArea: number;
  pathaoZone: number;
  pathaoCity: number;
  sku: string;
  productImage: any;
  id: string;
  tenantId?: string;
  customer: string;
  location: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'On Hold' | 'Processing' | 'Shipped' | 'Sent to Courier' | 'Delivered' | 'Cancelled' | 'Return' | 'Refund' | 'Returned Receive' | 'Incomplete';
  email?: string; // To link with registered user
  trackingId?: string; // Added for Courier Integration
  phone?: string;
  division?: string;
  district?: string;
  promoCode?: string;
  promoDiscount?: number;
  upazila?: string;
  variant?: ProductVariantSelection;
  productId?: number;
  productName?: string;
  quantity?: number;
  deliveryType?: 'Regular' | 'Express' | 'Free';
  deliveryCharge?: number;
  courierProvider?: 'Steadfast' | 'Pathao';
  courierMeta?: Record<string, any>;
  source?: 'store' | 'landing_page' | 'admin';
  landingPageId?: string;
  // Payment method info (for manual MFS payments)
  paymentMethod?: string; // e.g., 'bKash (Manual)', 'Nagad (Manual)', 'COD'
  paymentMethodId?: string; // ID of the selected payment method
  transactionId?: string; // Customer's transaction ID for manual payments
  customerPaymentPhone?: string; // Customer's payment phone number
  
  // Discount fields
  discountType?: 'percentage' | 'taka' | 'none';
  discountValue?: number; // Percentage (0-100) or amount in taka
  discountAmount?: number; // Calculated discount amount in taka
  // Multi-vendor fields
  vendorId?: string;
  isMasterOrder?: boolean;
  masterOrderId?: string;
  subOrderIds?: string[];
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  tenantId?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: string; // ID of the custom role defined in AdminControl
  roleDetails?: Role;
  username?: string; // Added for admin profile
  image?: string; // Added for admin profile
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string; // Added for admin profile
  updatedAt?: string; // Added for admin profile
  tenantDetails?: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    shopStatus?: ShopStatus;
  };
}

export type ResourceType = 
  | 'dashboard' | 'orders' | 'products' | 'customers' | 'inventory'
  | 'catalog' | 'landing_pages' | 'gallery' | 'reviews' | 'daily_target'
  | 'business_report' | 'expenses' | 'income' | 'due_book' | 'profit_loss'
  | 'notes' | 'customization' | 'settings' | 'admin_control' | 'tenants'
  | 'customers_reviews' | 'vendors';

export type ActionType = 'read' | 'write' | 'edit' | 'delete';

export interface Permission {
  resource: ResourceType;
  actions: ActionType[];
}

export interface Role {
  _id?: string;
  id?: string;
  tenantId?: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontColor: string;
  hoverColor: string;
  surfaceColor: string;
  darkMode: boolean;
  // Admin theme colors
  adminBgColor?: string;
  adminInputBgColor?: string;
  adminBorderColor?: string;
  adminFocusColor?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  type: string; // Add this line
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface ChatSupportHours {
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: number;
  customerName?: string;
  customerEmail?: string;
  guestSessionId?: string;
  authorName?: string;
  authorEmail?: string;
  authorRole?: User['role'];
  editedAt?: number;
}

export interface CarouselItem {
  subtitle: string;
  title: string;
  imageUrl: string;
  id: string;
  image: string;
  mobileImage?: string;
  name: string;
  url: string;
  urlType: 'Internal' | 'External';
  serial: number;
  status: 'Publish' | 'Draft';
}

export interface Campaign {
  productId?: string;
  id: string;
  name: string;
  logo?: string;
  startDate: string;
  endDate: string;
  url?: string;
  status: 'Publish' | 'Draft';
  serial: number;
}

export interface WebsiteConfig {
  productSectionStyle?: string;
  storeName?: string;
  tenantId?: string;
  websiteName?: string;
  shortDescription?: string;
  whatsappNumber?: string;
  favicon?: string | null;
  headerLogo?: string | null;
  footerLogo?: string | null;
  addresses?: string[];
  emails?: string[];
  phones?: string[];
  socialLinks?: SocialLink[];
  footerQuickLinks?: FooterLink[];
  footerUsefulLinks?: FooterLink[];
  // Display Toggles
  showMobileHeaderCategory?: boolean;
  showNewsSlider?: boolean;
  headerSliderText?: string;
  hideCopyright?: boolean;
  hideCopyrightText?: boolean;
  showPoweredBy?: boolean;
  showFlashSaleCounter?: boolean;
  brandingText?: string;
  // Visual Toggles
  bottomNavStyle?: string;
  footerStyle?: string;
  productCardStyle?: string;
  headerStyle?: string;
  mobileHeaderStyle?: string;
  categorySectionStyle?: string;
  showcaseSectionStyle?: string;
  brandSectionStyle?: string;
  showcaseSection?: string;
  // New Additions
  voiceSearchLanguage?: string; // Adding it as optional (?) is usually safer
  carouselItems: CarouselItem[];
  searchHints?: string;
  orderLanguage?: 'English' | 'Bangla';
  chatEnabled?: boolean;
  chatGreeting?: string;
  chatOfflineMessage?: string;
  chatSupportHours?: ChatSupportHours;
  chatWhatsAppFallback?: boolean;
  chatAccentColor?: string;
  chatSurfaceColor?: string;
  chatBorderColor?: string;
  chatShadowColor?: string;
  // Chat Support Credentials
  chatSupportPhone?: string;
  chatSupportWhatsapp?: string;
  chatSupportMessenger?: string;
  // App Download Links
  androidAppUrl?: string;
  iosAppUrl?: string;
  // Admin Notice Ticker
  adminNoticeText?: string;
  // Campaigns
  campaigns?: Campaign[];
  // Popups
  popups?: Popup[];
  // Custom Domain for storefront
  customDomain?: string | null;
  // Country & Currency Settings
  shopCountry?: string;
  shopCurrency?: string;
  // Social Login Settings
  socialLogins?: { type: string; clientId: string }[];
  // Offer Settings
  // Promo Code Settings
  promoCodes?: {
    code: string;
    discountType: 'amount' | 'percentage';
    discountAmount?: number;
    discountPercentage?: number;
    maxDiscount?: number;
    minPurchase?: number;
    maxDiscountEnabled?: boolean;
    minPurchaseEnabled?: boolean;
    expiryDate?: string;
    isActive?: boolean;
  }[];
  offers?: { type: string; discount: string }[];
  // About/Policy text
  aboutUs?: string;
  privacyPolicy?: string;
  termsAndConditions?: string;
  contactInfo?: string;
  contactSubjects?: string[];
  returnPolicy?: string;
  // Product Settings
  showProductSoldCount?: boolean;
  allowProductImageDownloads?: boolean;
  showEmailFieldForOrder?: boolean;
  enablePromoCode?: boolean;
  // Theme Colors
  themeColorsEnabled?: boolean;
  themeColors?: {
    primary: string;
    secondary: string;
    depthAccent: string;
    font: string;
  };
  
  // Ready Theme Selection types
  readyTheme?: string;
  readyThemeVariant?: string;
  productDetailTheme?: string;
  // Google Search Console verification
  googleSiteVerification?: string;
  //
}

// ─── Video Stories ───
export interface VideoStory {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productId?: number;
  duration: number;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryConfig {
  type: 'Regular' | 'Express' | 'Free';
  isEnabled: boolean;
  division: string;
  insideCharge: number;
  outsideCharge: number;
  freeThreshold: number;
  note: string;
  tenantId?: string;
}

export interface PaymentMethod {
  id: string;
  provider: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'tap' | 'sslcommerz' | 'custom';
  name: string;
  isEnabled: boolean;
  paymentType?: 'send_money' | 'payment' | 'merchant' | 'agent' | 'personal';
  accountNumber?: string;
  accountName?: string;
  paymentInstruction?: string;
  logo?: string;
  tenantId?: string;
}

export interface CourierConfig {
  apiKey: string;
  secretKey: string;
  instruction?: string;
}

export interface PathaoConfig {
  apiKey: string;
  secretKey: string;
  username: string;
  password: string;
  storeId: string;
  instruction?: string;
}

export interface FacebookPixelConfig {
  pixelId: string;
  accessToken: string;
  enableTestEvent: boolean;
  isEnabled: boolean;
}

// Catalog Types
export interface Category {
  slug: any;
  id: string;
  tenantId?: string;
  name: string;
  icon?: string;
  image?: string;
  status: 'Active' | 'Inactive';
  serial?: number;
}

export interface SubCategory {
  categoryName: string;
  id: string;
  tenantId?: string;
  categoryId: string;
  name: string;
  status: 'Active' | 'Inactive';
  serial?: number;
  subCategoryName?: string;
}

export interface ChildCategory {
  id: string;
  tenantId?: string;
  subCategoryId: string;
  name: string;
  status: 'Active' | 'Inactive';
  serial?: number;
}

export interface Brand {
  id: string;
  tenantId?: string;
  name: string;
  logo: string;
  status: 'Active' | 'Inactive';
  serial?: number;
}

export interface Tag {
  id: string;
  tenantId?: string;
  name: string;
  status: 'Active' | 'Inactive';
  serial?: number;
  icon?: string;
  durationDays?: number;
  expiresAt?: string;
  showCountdown?: boolean;
  desktopBanner?: string;
  mobileBanner?: string;
  desktopVideo?: string;
  mobileVideo?: string;
}

export interface GalleryItem {
  id: number;
  tenantId?: string;
  title: string;
  category: string;
  imageUrl: string;
  dateAdded: string;
}

export type LandingPageMode = 'ready' | 'custom';
export type LandingPageStatus = 'draft' | 'published';
export type LandingBlockType = 'hero' | 'features' | 'reviews' | 'faq' | 'cta';

export interface LandingBlockItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface LandingPageBlock {
  id: string;
  type: LandingBlockType;
  title?: string;
  subtitle?: string;
  description?: string;
  mediaUrl?: string;
  ctaLabel?: string;
  ctaLink?: string;
  items?: LandingBlockItem[];
  style?: {
    background?: string;
    textColor?: string;
    accentColor?: string;
    layout?: 'split' | 'stacked';
  };
}

export interface LandingPageSEO {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  keywords?: string[];
}

export interface LandingPageStyle {
  fontFamily?: string;
  primaryColor?: string;
  accentColor?: string;
  background?: string;
  buttonShape?: 'pill' | 'rounded' | 'square';
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  heroLayout: 'split' | 'center';
  featuresLayout: 'grid' | 'stacked';
  buttonShape: 'pill' | 'rounded' | 'square';
}

export interface LandingPage {
  id: string;
  tenantId?: string;
  name: string;
  mode: LandingPageMode;
  productId?: number;
  templateId?: string;
  status: LandingPageStatus;
  urlSlug: string;
  seo: LandingPageSEO;
  blocks: LandingPageBlock[];
  style: LandingPageStyle;
  customConfig?: Record<string, any>;
  onePageCheckout?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Due List Types
export type EntityType = 'Customer' | 'Supplier' | 'Employee';
export type TransactionDirection = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'Pending' | 'Paid' | 'Cancelled';

export interface DueEntity {
  _id?: string;
  tenantId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: EntityType;
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DueTransaction {
  _id?: string;
  tenantId?: string;
  entityId: string;
  entityName: string;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  items?: string;
  transactionType?: string;
  status: TransactionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDueTransactionPayload {
  entityId: string;
  entityName: string;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
}

export interface CreateEntityPayload {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: EntityType;
}

// Offer Page Types
export interface OfferPageBenefit {
  id: string;
  text: string;
}

export interface OfferPage {
  _id?: string;
  id?: string;
  tenantId?: string;
  productId?: number;
  productTitle: string;
  searchQuery?: string;
  imageUrl: string;
  offerEndDate: string;
  description: string;
  productOfferInfo: string;
  paymentSectionTitle: string;
  benefits: OfferPageBenefit[];
  whyBuySection: string;
  urlSlug: string;
  status: 'draft' | 'published';
  views?: number;
  orders?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

// Store Studio Configuration Types
export interface StoreStudioConfig {
  tenantId: string;
  enabled: boolean;
  productDisplayOrder?: number[]; // Array of product IDs in display order
  customLayout?: {
    sections: any[];
    version?: number;
    publishedAt?: string;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface ProductOrderItem {
  id: number;
  name: string;
  image: string;
  price: number;
  order: number;
}

export interface StoreStudioSettings {
  enabled: boolean;
  allowCustomLayouts: boolean;
  allowProductReordering: boolean;
  allowElementEditing: boolean;
}

export interface TenantProfile {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  contactEmail: string;
  contactName?: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  branding?: TenantBranding;
  profileImage?: string;
}

// export interface theme6 {
//   primaryColor: string;
//   secondaryColor: string;
//   depthAccentColor: string;
//   fontColor: string;
// }

// ─── Multi-Vendor Marketplace Types ─────────────────────────────────────────

export interface VendorAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface VendorBankInfo {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  routingNumber?: string;
}

export interface Vendor {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  description?: string;
  logo?: string;
  address?: VendorAddress;
  commissionRate: number;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  userId?: string;
  bankInfo?: VendorBankInfo;
  customDomain?: string;
  domainVerified?: boolean;
  totalSales: number;
  totalCommission: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSubOrder {
  id: string;
  masterOrderId: string;
  vendorId: string;
  vendorName: string;
  tenantId: string;
  customer: string;
  phone?: string;
  email?: string;
  location?: string;
  items: any[];
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
  status: string;
  date: string;
  createdAt: string;
}

export interface CommissionResult {
  vendorId: string;
  vendorName: string;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
}


