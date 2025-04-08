// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext"; // Importe le Provider

const geistSans = Geist({
  /* ... */
});
const geistMono = Geist_Mono({
  /* ... */
});

export const metadata = {
  /* ... */
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-minecraft antialiased`}
      >
        {/* Enveloppe l'application avec le Provider */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
