export interface TenantConfig {
  // Branding
  appName: string;
  appDescription: string;
  logoChar: string;
  logoUrl?: string;

  // Localization
  language: string;       // "en", "bn"
  locale: string;         // "en-BD", "en-US"

  // Currency
  currency: {
    symbol: string;       // "৳", "$", "€"
    code: string;         // "BDT", "USD"
    locale: string;       // locale for toLocaleString
    decimals: number;
  };

  // Configurable lists
  expenseCategories: string[];
  orderStatuses: string[];
  entityTypes: string[];
}

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  appName: 'Hishabee',
  appDescription: 'Business Management Platform',
  logoChar: 'হি',

  language: 'en',
  locale: 'en-BD',

  currency: {
    symbol: '৳',
    code: 'BDT',
    locale: 'en-BD',
    decimals: 2,
  },

  expenseCategories: ['Rent', 'Salary', 'Utilities', 'Transport', 'Food', 'Office Supplies', 'Marketing', 'Other'],
  orderStatuses: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return'],
  entityTypes: ['Customer', 'Supplier', 'Employee'],
};

export function formatCurrency(amount: number, config: TenantConfig['currency'] = DEFAULT_TENANT_CONFIG.currency): string {
  return `${config.symbol}${amount.toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: config.decimals,
  })}`;
}
