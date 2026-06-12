import { Suspense } from 'react';
import type { Metadata } from 'next';
import SuccessOrderClient, { SuccessOrderSkeleton } from './success-order-client';

/**
 * ISR: Revalidate the success order page shell every 60 seconds.
 * Order content is user-specific (loaded client-side), but the page
 * shell benefits from static caching.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Order Successful',
  description: 'Your order has been placed successfully.',
};

export default function SuccessOrderPage() {
  return (
    <Suspense fallback={<SuccessOrderSkeleton />}>
      <SuccessOrderClient />
    </Suspense>
  );
}
