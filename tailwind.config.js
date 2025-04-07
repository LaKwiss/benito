// tailwind.config.js (ou .mjs)

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Ou `export default { ... }` pour .mjs
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
      // Définir des ombres portées plus nettes
      boxShadow: {
        "pixel-sm": "2px 2px 0px 0px rgba(0,0,0,0.5)", // Ombre décalée sans flou
        "pixel-md": "4px 4px 0px 0px rgba(0,0,0,0.5)",
        "pixel-inner": "inset 2px 2px 0px 0px rgba(0,0,0,0.3)", // Ombre intérieure
      },
      // Définir des ombres pour le texte
      textShadow: {
        sm: "1px 1px 0px rgba(0, 0, 0, 0.7)", // Ombre texte nette
        md: "2px 2px 0px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [
    // Plugin pour utiliser text-shadow (si tu l'as installé)
    // require('tailwindcss-textshadow'), // Alternative si tu préfères un plugin
  ],
};
