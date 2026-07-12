import type { Config } from 'tailwindcss';

// Dizayn tokenlari — spetsifikatsiya 8-bo'lim. --stress FAQAT urg'uli unlida!
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        paper: '#FBFBF8',
        grid: '#E3E6EC',
        stress: '#E8A33D',
        muted: '#6B7684',
        ok: '#3F7D5C',
        miss: '#C4553B',
      },
      fontFamily: {
        sans: ['"Golos Text"', 'system-ui', 'sans-serif'],
        ru: ['"PT Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // type scale: 14 / 16 / 20 / 28 / 40
        sm: ['14px', '1.5'],
        base: ['16px', '1.6'],
        lg: ['20px', '1.5'],
        xl: ['28px', '1.3'],
        '2xl': ['40px', '1.2'],
      },
      borderRadius: {
        DEFAULT: '4px', // daftar burchagi
      },
    },
  },
  plugins: [],
} satisfies Config;
