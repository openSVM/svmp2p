/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9945FF', // Solana purple
          foreground: '#FFFFFF',
        },
        sonic: '#00C2FF',
        eclipse: '#0052FF',
        svmbnb: '#F0B90B',
        s00n: '#00FF9D',
        background: '#f8f9fa',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#333333',
        },
        border: '#e0e0e0',
        muted: {
          DEFAULT: '#f0f0f0',
          foreground: '#666666',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        DEFAULT: '0 2px 10px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      height: {
        header: '70px',
        footer: '60px',
      },
      transitionProperty: {
        DEFAULT: 'all',
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
    },
  },
  plugins: [],
}
