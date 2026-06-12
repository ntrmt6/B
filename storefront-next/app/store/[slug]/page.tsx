import type { Metadata } from 'next';
import StoreProfileClient from './StoreProfileClient';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const storeName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${storeName} — All Products | AllInBangla Marketplace`,
    description: `Browse all products from ${storeName} on AllInBangla marketplace.`,
  };
}

export default async function StoreProfilePage({ params }: PageProps) {
  const { slug } = await params;
  return <StoreProfileClient slug={slug} />;
}
