/** @type {import('tailwindcss').Config} */
// Color tokens mirror src/theme/tokens.ts (§6 of CLAUDE.md). Keep them in sync.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0B0E1A',
        surface: '#161C2E',
        cardFace: '#1B2236',
        cardBorder: '#2C3550',
        eclipse: '#C2362F',
        lantern: '#F2B95C',
        swamp: '#A9B24E',
        bone: '#ECE6D6',
        muted: '#9AA0B5',
        // archetype colors
        revenant: '#B11E2F',
        devout: '#E6B84A',
        cursed: '#7A4FA3',
        conjurer: '#1FA398',
        marksman: '#4A6FA5',
        maker: '#C8742E',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lantern: '0 0 24px -4px rgba(242, 185, 92, 0.6)',
        eclipse: '0 0 28px -2px rgba(194, 54, 47, 0.6)',
      },
    },
  },
  plugins: [],
};
