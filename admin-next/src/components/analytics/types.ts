export interface TrafficSource {
  name: string;
  count: number;
  visitors: number;
  percentage: number;
  referrers: string[];
}

export interface OnlineVisitor {
  visitorId: string;
  page: string;
  source: string;
  lastSeen: string;
}

export interface SourcesData {
  sources: TrafficSource[];
  dailySourceData: Array<Record<string, number | string>>;
  onlineCount: number;
  onlineBySource: Record<string, number>;
  onlineVisitors: OnlineVisitor[];
  totalViews: number;
  period: string;
}

export interface SourceReferrerStat {
  referrer: string;
  count: number;
}

export interface SourceProductStat {
  productLabel: string;
  page: string;
  views: number;
  visitors: number;
}

export interface SourceSearchStat {
  query: string;
  count: number;
  lastSeen: string;
}

export interface SourceCheckoutJourney {
  productLabel: string;
  productPage: string;
  count: number;
  visitors: number;
  lastSeen: string;
}

export interface SourceRecentVisitor {
  visitorId: string;
  lastPage: string;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  pages: string[];
  lastReferrer?: string;
}

export interface TrafficSourceDetails {
  source: string;
  visitors: number;
  views: number;
  topReferrers: SourceReferrerStat[];
  topProducts: SourceProductStat[];
  recentSearches: SourceSearchStat[];
  checkoutJourneys: SourceCheckoutJourney[];
  recentVisitors: SourceRecentVisitor[];
}
