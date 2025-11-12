/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        peach: '#FFD9C4',
        mint: '#BFF2E6',
        lemon: '#FFF8B7',
        lilac: '#E7D9FF',
        accent: '#FF698A',
        white: '#FDFDFD',
        mist: '#C6E8D7',
        lavender: '#EBDDFB',
        bone: '#F8F2E8',
        charcoal: '#333333',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
    },
  },
  plugins: [],
};
