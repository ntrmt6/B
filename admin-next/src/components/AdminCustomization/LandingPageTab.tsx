import React from 'react';
import { OfferPageManager } from '../OfferPageManager';
import { WebsiteConfig } from './types';

interface LandingPageTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  tenantId: string;
  tenantSubdomain?: string;
onSave?: (config: WebsiteConfig) => Promise<void>;}

export const LandingPageTab: React.FC<LandingPageTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  tenantId,
  tenantSubdomain,
  onSave
}) => {
  const handleCreateNew = () => {
    // This will be handled by OfferPageManager internally
    console.log('[LandingPageTab] Create new landing page');
  };

  const handleEdit = (page: any) => {
    // This will be handled by OfferPageManager internally
    console.log('[LandingPageTab] Edit landing page:', page);
  };

  const handlePreview = (page: any) => {
    // This will be handled by OfferPageManager internally
    console.log('[LandingPageTab] Preview landing page:', page);
  };

  return (
    <div className="w-full">
      <OfferPageManager
        tenantId={tenantId}
        tenantSubdomain={tenantSubdomain}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onPreview={handlePreview}
      />
    </div>
  );
};

export default LandingPageTab;
