'use client';

/**
 * Helmet shim for Next.js App Router
 * 
 * next/head does NOT work in the App Router — it's a Pages Router API.
 * In App Router, use next/head's replacement: the Metadata API or <head> in layout.tsx.
 * 
 * For the migration, Helmet becomes a no-op. Link preloads and meta tags
 * from admin-main components are safely ignored; Next.js handles metadata
 * via the Metadata API in layout.tsx.
 */
import React from 'react';

export function Helmet({ children }: { children?: React.ReactNode }) {
  return null;
}

export function HelmetProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
