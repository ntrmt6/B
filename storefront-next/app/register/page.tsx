import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

/**
 * ISR: Revalidate the register page shell every 300 seconds (5 min).
 * Registration form is client-side, but the page shell benefits from caching.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Create Your Store',
  description: 'Register and create your own online store.',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
