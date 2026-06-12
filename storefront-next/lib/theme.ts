import { hexToRgb } from '@/utils/appHelpers';
import type { ThemeConfig } from '@/types';

export function applyThemeToRoot(themeConfig: ThemeConfig | null | undefined): void {
  if (typeof window === 'undefined' || !themeConfig) return;

  const root = document.documentElement;
  const primaryRgb = hexToRgb(themeConfig.primaryColor || '#22c55e');
  const secondaryRgb = hexToRgb(themeConfig.secondaryColor || '#ec4899');
  const tertiaryRgb = hexToRgb(themeConfig.tertiaryColor || '#9333ea');
  const fontRgb = hexToRgb(themeConfig.fontColor || '#0f172a');
  const hoverRgb = hexToRgb(themeConfig.hoverColor || '#f97316');
  const surfaceRgb = hexToRgb(themeConfig.surfaceColor || '#e2e8f0');

  root.style.setProperty('--color-primary-rgb', primaryRgb);
  root.style.setProperty('--color-secondary-rgb', secondaryRgb);
  root.style.setProperty('--color-tertiary-rgb', tertiaryRgb);
  root.style.setProperty('--color-font-rgb', fontRgb);
  root.style.setProperty('--color-hover-rgb', hoverRgb);
  root.style.setProperty('--color-surface-rgb', surfaceRgb);
  root.style.setProperty('--primary', primaryRgb);
  root.style.setProperty('--secondary', secondaryRgb);
  root.style.setProperty('--accent', tertiaryRgb);
  root.style.setProperty('--ring', primaryRgb);
  root.style.setProperty('--foreground', fontRgb);
  root.style.setProperty('--muted', surfaceRgb);
  root.style.setProperty('--border', surfaceRgb);
  root.style.setProperty('--input', surfaceRgb);
}
