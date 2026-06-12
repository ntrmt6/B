import type { Metadata } from 'next';
import { fetchSlimBootstrap, isMarketplaceDomain, fetchMarketplaceProducts } from '../../../lib/tenant';
import ProductDetailClient from './ProductDetailClient';

/**
 * ISR: Revalidate product detail pages every 60 seconds.
 * On-demand revalidation via /api/revalidate triggers instant refresh
 * when products are updated in the admin dashboard.
 */
export const revalidate = 60;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // On marketplace domain, search across all stores
  const isMarketplace = await isMarketplaceDomain();
  let products: any[] = [];

  if (isMarketplace) {
    const mpData = await fetchMarketplaceProducts({ limit: 100 });
    products = mpData?.products || [];
  } else {
    const bootstrapData = await fetchSlimBootstrap();
    products = bootstrapData?.products || [];
  }

  const product = products.find((p: any) => p.slug === slug)
    || (!Number.isNaN(Number(slug)) ? products.find((p: any) => p.id === Number(slug)) : null)
    || null;

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = product.seoTitle || product.name || 'Product';
  const description = product.seoDescription
    || (product.description ? stripHtml(product.description).slice(0, 160) : `Buy ${product.name} at our store`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(product.image ? { images: [product.image] } : {}),
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}