import React from 'react';
import { ExternalLink, MousePointerClick, Search, ShoppingCart, Globe } from 'lucide-react';
import { DetailListCard } from './DetailListCard';
import { truncateWords } from './utils';
import type {
  SourceReferrerStat,
  SourceProductStat,
  SourceSearchStat,
  SourceCheckoutJourney,
  SourceRecentVisitor
} from './types';

/* ─── Top Referrers ─── */

interface ReferrersListProps {
  referrers: SourceReferrerStat[];
}

export const ReferrersList: React.FC<ReferrersListProps> = ({ referrers }) => (
  <DetailListCard
    title="Top Referrers"
    icon={<ExternalLink size={16} className="text-sky-500" />}
    emptyLabel="No referrer URLs recorded for this source yet."
  >
    {referrers.length
      ? referrers.map(referrer => (
          <div
            key={referrer.referrer}
            className="flex items-start justify-between gap-2 overflow-hidden rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                {referrer.referrer}
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              {referrer.count}
            </span>
          </div>
        ))
      : null}
  </DetailListCard>
);

/* ─── Product Clicks ─── */

interface ProductClicksListProps {
  products: SourceProductStat[];
}

export const ProductClicksList: React.FC<ProductClicksListProps> = ({ products }) => (
  <DetailListCard
    title="Product Clicks"
    icon={<MousePointerClick size={16} className="text-orange-500" />}
    emptyLabel="No product detail visits were recorded for this source in the selected period."
  >
    {products.length
      ? products.map(product => (
          <div
            key={product.page}
            className="overflow-hidden rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800 dark:text-slate-100" title={product.productLabel}>
                  {truncateWords(product.productLabel, 3)}
                </div>
                <div className="truncate text-[11px] text-slate-400">{product.page}</div>
              </div>
              <span className="flex-shrink-0 whitespace-nowrap text-xs font-semibold text-orange-600 dark:text-orange-300">
                {product.views} views
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {product.visitors} visitors clicked this product
            </div>
          </div>
        ))
      : null}
  </DetailListCard>
);

/* ─── Search Terms ─── */

interface SearchTermsListProps {
  searches: SourceSearchStat[];
  formatTimeAgo: (value: string) => string;
}

export const SearchTermsList: React.FC<SearchTermsListProps> = ({ searches, formatTimeAgo }) => (
  <DetailListCard
    title="Search Terms"
    icon={<Search size={16} className="text-emerald-500" />}
    emptyLabel="Search queries will appear here after visitors use the storefront search bar."
  >
    {searches.length
      ? searches.map(search => (
          <div
            key={`${search.query}-${search.lastSeen}`}
            className="flex items-center justify-between gap-2 overflow-hidden rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-800 dark:text-slate-100">{search.query}</div>
              <div className="text-[11px] text-slate-400">Last seen {formatTimeAgo(search.lastSeen)}</div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {search.count}
            </span>
          </div>
        ))
      : null}
  </DetailListCard>
);

/* ─── Checkout Journeys ─── */

interface CheckoutJourneysListProps {
  journeys: SourceCheckoutJourney[];
  formatTimeAgo: (value: string) => string;
}

export const CheckoutJourneysList: React.FC<CheckoutJourneysListProps> = ({ journeys, formatTimeAgo }) => (
  <DetailListCard
    title="Checkout Journeys"
    icon={<ShoppingCart size={16} className="text-violet-500" />}
    emptyLabel="Checkout transitions from products will appear here as visitors move into checkout."
  >
    {journeys.length
      ? journeys.map(journey => (
          <div
            key={`${journey.productPage}-${journey.lastSeen}`}
            className="overflow-hidden rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800 dark:text-slate-100" title={journey.productLabel}>
                  {truncateWords(journey.productLabel, 3)}
                </div>
                <div className="truncate text-[11px] text-slate-400">{journey.productPage}</div>
              </div>
              <span className="flex-shrink-0 whitespace-nowrap text-xs font-semibold text-violet-600 dark:text-violet-300">
                {journey.count} starts
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {journey.visitors} visitors • last seen {formatTimeAgo(journey.lastSeen)}
            </div>
          </div>
        ))
      : null}
  </DetailListCard>
);

/* ─── Recent Visitors ─── */

interface RecentVisitorsListProps {
  visitors: SourceRecentVisitor[];
  formatTimeAgo: (value: string) => string;
}

export const RecentVisitorsList: React.FC<RecentVisitorsListProps> = ({ visitors, formatTimeAgo }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-3 lg:col-span-2 dark:border-slate-800 dark:bg-slate-800/70">
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
      <Globe size={16} className="text-slate-500" />
      <span>Recent Visitors</span>
    </div>
    {visitors.length ? (
      <div className="grid gap-2 md:grid-cols-2">
        {visitors.map(visitor => (
          <div
            key={`${visitor.visitorId}-${visitor.lastSeen}`}
            className="overflow-hidden rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800 dark:text-slate-100">
                  {visitor.lastPage || '/'}
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  {visitor.pageViews} views • first seen {formatTimeAgo(visitor.firstSeen)}
                </div>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {formatTimeAgo(visitor.lastSeen)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 overflow-hidden">
              {visitor.pages.slice(0, 4).map(page => (
                <span
                  key={`${visitor.visitorId}-${page}`}
                  className="max-w-[140px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 sm:max-w-[200px] dark:bg-slate-800 dark:text-slate-300"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-slate-400">
        Recent visitor activity will show here when data becomes available.
      </p>
    )}
  </div>
);
