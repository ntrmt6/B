import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchWebsiteConfig, getSubdomain } from '../lib/tenant';
import StoreHomeClient, { StorePageSkeleton } from './store-home-client';

/**
 * ISR: Revalidate the home page every 60 seconds.
 * On-demand revalidation via /api/revalidate overrides this when
 * the backend notifies of product/theme/config changes.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const websiteConfig = await fetchWebsiteConfig();
  const subdomain = await getSubdomain();

  if (!websiteConfig) {
    return {};
  }

  const {
    seoTitle,
    seoDescription,
    seoKeywords,
    ogImage,
    storeName,
    shortDescription,
    googleSiteVerification,
    headerLogo,
  } = websiteConfig;

  // Use SEO fields if set, otherwise fallback to basic store info
  const title = seoTitle || storeName || 'Online Store';
  const description = seoDescription || shortDescription || '';
  const keywords = seoKeywords ? seoKeywords.split(',').map((k: string) => k.trim()) : undefined;
  const image = ogImage || headerLogo;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image && { images: [{ url: image }] }),
      ...(subdomain && { url: `https://${subdomain}.allinbangla.com` }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
    ...(googleSiteVerification && {
      verification: {
        google: googleSiteVerification,
      },
    }),
  };
}

function generateSchemaScript(config: any, subdomain: string) {
  if (!config?.schemaType) return null;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': config.schemaType,
    name: config.schemaName || config.storeName || 'Store',
    description: config.schemaDescription || config.shortDescription || '',
  };

  if (subdomain) {
    schema.url = `https://${subdomain}.allinbangla.com`;
  }
  if (config.schemaLogo || config.headerLogo) {
    schema.logo = config.schemaLogo || config.headerLogo;
  }
  if (config.schemaAddress) {
    schema.address = config.schemaAddress;
  }
  if (config.schemaPhone) {
    schema.telephone = config.schemaPhone;
  }
  if (config.schemaEmail) {
    schema.email = config.schemaEmail;
  }
  if (config.schemaPriceRange) {
    schema.priceRange = config.schemaPriceRange;
  }
  if (config.schemaOpeningHours) {
    schema.openingHours = config.schemaOpeningHours;
  }

  return schema;
}

export default async function HomePage() {
  const [websiteConfig, subdomain] = await Promise.all([
    fetchWebsiteConfig(),
    getSubdomain(),
  ]);

  const schemaData = generateSchemaScript(websiteConfig, subdomain);

  return (
    <>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <Suspense fallback={<StorePageSkeleton />}>
        <StoreHomeClient />
      </Suspense>
    </>
  );
}
