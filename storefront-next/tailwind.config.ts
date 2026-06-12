import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../admin-next/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--border, 226 232 240) / <alpha-value>)',
        input: 'rgb(var(--input, 226 232 240) / <alpha-value>)',
        ring: 'rgb(var(--ring, 79 70 229) / <alpha-value>)',
        background: 'rgb(var(--background, 249 250 251) / <alpha-value>)',
        foreground: 'rgb(var(--foreground, 15 23 42) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary, 79 70 229) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground, 255 255 255) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary, 124 58 237) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground, 255 255 255) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive, 239 68 68) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground, 255 255 255) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted, 241 245 249) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground, 100 116 139) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent, 245 158 11) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground, 255 255 255) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover, 255 255 255) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground, 15 23 42) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card, 255 255 255) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground, 15 23 42) / <alpha-value>)',
        },
        // Legacy brand variables kept for existing storefront/admin-next shared components.
        brandPrimary: 'var(--color-primary, #4F46E5)',
        brandSecondary: 'var(--color-secondary, #7C3AED)',
        brandAccent: 'var(--color-accent, #F59E0B)',
      },
    },
  },
  plugins: [],
};

export default config;
