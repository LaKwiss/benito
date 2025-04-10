// app/layout.js  <--- C'est ce fichier qu'il faut vérifier

import { AuthProvider } from "./context/AuthContext"; // Chemin vers AuthContext
import "./globals.css";
// ... autres imports (polices, etc.)

// export const metadata = { ... };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body /* ... tes classes ... */>
        {/* 👇 AuthProvider DOIT être ici, autour de children 👇 */}
        <AuthProvider>{children}</AuthProvider>
        {/* 👆 AuthProvider DOIT être ici, autour de children 👆 */}
      </body>
    </html>
  );
}
