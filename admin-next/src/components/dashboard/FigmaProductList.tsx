"use client";

// Thin re-export: the actual implementation lives in the split component folder.
// This file only exists to preserve the import path used by AdminApp.
export { default } from '../FigmaProductList';
export type { FigmaProductListProps } from '../FigmaProductList/types';
