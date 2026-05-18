/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./apps/site-worker-mobile/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      colors: {
        /**
         * Brand identity colors
         * - Source of truth from design (SVG / Figma)
         * - DO NOT use directly for UI states
         */
        brand: {
          primary: '#007DCA',    // Main brand blue
          secondary: '#33D4C1',  // Brand teal
          accent: '#F6B26B',     // Highlight / accent
        },

        /**
         * UI semantic colors
         * - Used by components (Button, Tab, Nav, etc.)
         */
        primary: {
          DEFAULT: '#007DCA',    // Primary button / main action
          active: '#045799',     // Active / selected / success
        },

        secondary: {
          DEFAULT: '#33D4C1',    // Secondary action
          active: '#1FB6A6',     // Active / selected (same hue)
        },

        /**
         * Status / feedback colors
         * - Success intentionally shares primary.active
         */
        success: {
          DEFAULT: '#0061A3',    // Same as primary.active (intentional)
        },

        warning: {
          DEFAULT: '#F6B26B',
        },

        error: {
          DEFAULT: '#EF4344',
        },
      },
    },
  },
  plugins: [],
}
