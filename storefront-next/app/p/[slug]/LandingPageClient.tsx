'use client';
import { Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '../../providers';
import dynamic from 'next/dynamic';

const LandingPagePreview = dynamic(() => import('@/views/LandingPagePreview'), { ssr: false });

export default function LandingPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const app = useApp();

  const page = useMemo(() =>
    app.landingPages.find(lp => lp.urlSlug === slug && lp.status === 'published') || null,
    [app.landingPages, slug]
  );

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This landing page does not exist or is not published.</p>
        </div>
      </div>
    );
  }

  const product = page.productId ? app.products.find(p => p.id === page.productId) : undefined;

  return (
    <Suspense fallback={null}>
      <LandingPagePreview
        page={page}
        product={product}
        onBack={() => window.history.back()}
        onSubmitLandingOrder={app.handlers.handleLandingOrderSubmit}
      />
    </Suspense>
  );
}
