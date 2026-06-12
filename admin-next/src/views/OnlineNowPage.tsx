import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Users } from 'lucide-react';
import { getAuthHeader } from '../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
import { VisitorsAnalysisHeader } from '../components/analytics/VisitorsAnalysisHeader';
import { VisitorsSidebarPanels } from '../components/analytics/VisitorsSidebarPanels';
import { VisitorsSummaryCards } from '../components/analytics/VisitorsSummaryCards';
import { TrafficSourcesPanel } from '../components/analytics/TrafficSourcesPanel';
import type { SourcesData, TrafficSourceDetails } from '../components/analytics/types';

interface OnlineNowPageProps {
  tenantId?: string;
  onBack?: () => void;
}

const LoadingSkeleton = () => (
  <div className="space-y-4 p-4 sm:p-6">
    <div className="mb-6 flex items-center gap-3">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(item => (
        <div key={item} className="animate-pulse rounded-xl bg-white p-5 dark:bg-gray-800">
          <div className="mb-3 h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="mb-2 h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
    <div className="rounded-xl bg-white p-5 animate-pulse dark:bg-gray-800">
      <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      {[1, 2, 3, 4, 5].map(item => (
        <div key={item} className="mb-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  </div>
);

const OnlineNowPage: React.FC<OnlineNowPageProps> = ({ tenantId, onBack }) => {
  const [data, setData] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [selectedSourceDetails, setSelectedSourceDetails] = useState<TrafficSourceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const activeTenantId = tenantId || localStorage.getItem('activeTenantId');
    if (!activeTenantId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/visitors/${activeTenantId}/sources?period=${period}`, { headers: getAuthHeader() });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching traffic sources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, period]);

  const fetchSourceDetails = useCallback(
    async (sourceName: string) => {
      const activeTenantId = tenantId || localStorage.getItem('activeTenantId');
      if (!activeTenantId) {
        setDetailsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/visitors/${activeTenantId}/sources/${encodeURIComponent(sourceName)}/details?period=${period}`,
          { headers: getAuthHeader() }
        );
        if (res.ok) {
          const result = await res.json();
          setSelectedSourceDetails(result);
        }
      } catch (error) {
        console.error('Error fetching source details:', error);
      } finally {
        setDetailsLoading(false);
      }
    },
    [tenantId, period]
  );

  useEffect(() => {
    setLoading(true);
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const availableSources = data?.sources || [];
    if (!availableSources.length) {
      setSelectedSourceName(null);
      setSelectedSourceDetails(null);
      return;
    }

    if (!selectedSourceName || !availableSources.some(source => source.name === selectedSourceName)) {
      setSelectedSourceName(availableSources[0].name);
    }
  }, [data?.sources, selectedSourceName]);

  useEffect(() => {
    if (!selectedSourceName) {
      setSelectedSourceDetails(null);
      setDetailsLoading(false);
      return;
    }

    setSelectedSourceDetails(null);
    setDetailsLoading(true);
    fetchSourceDetails(selectedSourceName);
  }, [selectedSourceName, fetchSourceDetails, data?.totalViews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatTimeAgo = (dateValue: string) => {
    const diff = Date.now() - new Date(dateValue).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const onlineCount = data?.onlineCount || 0;
  const totalViews = data?.totalViews || 0;
  const sources = data?.sources || [];
  const onlineVisitors = data?.onlineVisitors || [];
  const onlineBySource = data?.onlineBySource || {};
  const topSource = sources.length > 0 ? sources[0].name : 'N/A';
  const topSourcePercentage = sources[0]?.percentage || 0;

  return (
    <div className="mx-auto max-w-[1360px] space-y-3 p-3 sm:p-4 lg:p-5">
      <VisitorsAnalysisHeader
        period={period}
        refreshing={refreshing}
        onBack={onBack}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
      />

      <VisitorsSummaryCards
        onlineCount={onlineCount}
        totalViews={totalViews}
        topSource={topSource}
        topSourcePercentage={topSourcePercentage}
        uniqueSourceCount={sources.length}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <TrafficSourcesPanel
          sources={sources}
          selectedSourceName={selectedSourceName}
          details={selectedSourceDetails}
          detailsLoading={detailsLoading}
          onSourceSelect={setSelectedSourceName}
          formatTimeAgo={formatTimeAgo}
        />

        <VisitorsSidebarPanels
          onlineBySource={onlineBySource}
          onlineCount={onlineCount}
          onlineVisitors={onlineVisitors}
          formatTimeAgo={formatTimeAgo}
        />
      </div>

      {!sources.length && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Globe size={20} />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Traffic source history will appear here as visitor data is collected.</p>
          <p className="mt-1 text-xs text-slate-400">Search terms, product clicks, and checkout paths start building automatically once visitors interact with the storefront.</p>
        </div>
      )}

      {!onlineVisitors.length && sources.length > 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200 px-4 py-3 text-center dark:border-orange-500/20">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300">
            <Users size={18} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No one is live right now, but historical drill-down data remains available on each source card.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnlineNowPage;
