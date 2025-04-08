// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "minecraft-api.vercel.app", // Celui pour les items
        port: "",
        pathname: "/images/items/**",
      },
      {
        // Ajoute cette section pour Minotar
        protocol: "https",
        hostname: "minotar.net",
        port: "",
        pathname: "/avatar/**", // Autorise les avatars
      },
    ],
  },
};

export default nextConfig;
