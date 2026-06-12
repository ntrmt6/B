/**
 * Next.js + TypeScript shim for react-helmet-async
 * The <Helmet> component is a no-op since Next.js uses its own <Head>.
 */
'use client';

const Helmet = (_props: Record<string, unknown>) => null;
const HelmetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export { Helmet, HelmetProvider };
export default Helmet;
