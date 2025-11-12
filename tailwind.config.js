/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary palette
        purple: '#A4193D',
        yellow: '#FFDFB9',
        black: '#000000',
        cream: '#FFDFB9',
        white: '#FDFDFD',
        // Extended palette
        peach: '#FFD9C4',
        mint: '#BFF2E6',
        lemon: '#FFF8B7',
        lilac: '#E7D9FF',
        accent: '#FF698A',
        mist: '#C6E8D7',
        lavender: '#EBDDFB',
        bone: '#F8F2E8',
        charcoal: '#333333',
        // Semantic
        success: '#BFF2E6',
        warning: '#FFDFB9',
        danger: '#FF698A',
        info: '#E7D9FF',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        pill: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      fontFamily: {
        sans: ['SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
