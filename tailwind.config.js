// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        minecraft: ["var(--font-minecraft)", "sans-serif"],
        "geist-sans": ["var(--font-geist-sans)", "sans-serif"],
        "geist-mono": ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "pixel-sm": "2px 2px 0px 0px rgba(0,0,0,0.5)",
        "pixel-md": "4px 4px 0px 0px rgba(0,0,0,0.5)",
        "pixel-inner": "inset 2px 2px 0px 0px rgba(0,0,0,0.3)",
      },
      textShadow: {
        sm: "1px 1px 0px rgba(0, 0, 0, 0.7)",
        md: "2px 2px 0px rgba(0, 0, 0, 0.7)",
      },
      // AJOUTER CES DEUX SECTIONS
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.2s ease-out infinite",
      },
      // FIN DES AJOUTS
    },
  },
  plugins: [
    // require('tailwindcss-textshadow'),
  ],
};
