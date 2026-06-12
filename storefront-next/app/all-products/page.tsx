import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchWebsiteConfig } from '../../lib/tenant';
import AllProductsClient from './AllProductsClient';

/**
 * ISR: Revalidate the all-products page every 60 seconds.
 * On-demand revalidation refreshes this when products change.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const websiteConfig = await fetchWebsiteConfig();
	const shopName = websiteConfig?.shopName || null;
	const title = shopName ? `All Products | ${shopName}` : 'All Products';

	return {
		title,
		description: shopName
			? `Browse all products available at ${shopName}.`
			: 'Browse all available products.',
	};
}

export default function AllProductsPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 animate-pulse">
				<div className="sticky top-0 z-30 bg-white border-b h-14" />
				<div className="max-w-[1720px] mx-auto px-2 sm:px-4 py-4">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
						{Array.from({ length: 10 }).map((_, i) => (
							<div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
								<div className="bg-gray-200" style={{ aspectRatio: '1/1' }} />
								<div className="p-2 space-y-2">
									<div className="h-3 bg-gray-200 rounded w-3/4" />
									<div className="h-4 bg-gray-200 rounded w-1/2" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		}>
			<AllProductsClient />
		</Suspense>
	);
}
