// app/(main)/_components/AuthGuard.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("AuthGuard: User not authenticated, redirecting to /login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Affiche un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Vérification de la session...
      </div>
    );
  }

  // Si authentifié, affiche le contenu protégé
  return children;
}
