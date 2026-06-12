// import type { Config } from 'tailwindcss';

// const config: Config = {
//   content: [
//     './app/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   darkMode: 'class',
//   theme: {
//     extend: {
//       screens: {
//         xxs: '350px',
//         xs: '480px',
//       },
//       colors: {
//         primary: 'var(--color-primary, #4F46E5)',
//         'primary-dark': 'var(--color-primary-dark, #4338CA)',
//         secondary: 'var(--color-secondary, #7C3AED)',
//         accent: 'var(--color-accent, #F59E0B)',
//       },
//       fontFamily: {
//         sans: ['var(--font-family, "Inter")', 'system-ui', 'sans-serif'],
//         inter: ['Inter', 'system-ui', 'sans-serif'],
//         lato: ['Lato', 'sans-serif'],
//         poppins: ['Poppins', 'sans-serif'],
//       },
//       animation: {
//         'slide-in-right': 'slideInRight 0.3s ease-out',
//         'fade-in': 'fadeIn 0.3s ease-out',
//         marquee: 'marquee 25s linear infinite',
//       },
//       keyframes: {
//         slideInRight: {
//           '0%': { transform: 'translateX(100%)', opacity: '0' },
//           '100%': { transform: 'translateX(0)', opacity: '1' },
//         },
//         fadeIn: {
//           '0%': { opacity: '0' },
//           '100%': { opacity: '1' },
//         },
//         marquee: {
//           '0%': { transform: 'translateX(0%)' },
//           '100%': { transform: 'translateX(-100%)' },
//         },
//       },
//     },
//   },
//   plugins: [
//     require('@tailwindcss/typography'),
//   ],
// };

// export default config;


import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Common components folder added
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xxs: '350px',
        xs: '480px',
      },
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
        brandPrimary: 'var(--color-primary, #4F46E5)',
        'primary-dark': 'var(--color-primary-dark, #4338CA)',
        brandSecondary: 'var(--color-secondary, #7C3AED)',
        brandAccent: 'var(--color-accent, #F59E0B)',
      },
      fontFamily: {
        // Roboto k primary sans font hishebe set kora hoyeche
        sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        // Roboto-r optimized weight gulo define kora holo dashboard-er jonno
        regular: '400',
        medium: '500',
        bold: '700',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        marquee: 'marquee 25s linear infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // Tabular numbers (price alignment) er jonno utility plugin
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.tabular-nums': {
          'font-variant-numeric': 'tabular-nums',
        },
      })
    },
  ],
};

export default config;
