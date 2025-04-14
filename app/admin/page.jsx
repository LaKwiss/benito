// app/admin/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./components/AdminLayout";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

// --- Import du client API ---
// Adaptez le chemin si nécessaire
import { fetchWithAuth } from "@/utils/apiClient"; // Utilise la fonction exportée

// --- Clés localStorage (doivent correspondre à celles dans apiClient.js) ---
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export default function AdminPage() {
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // --- Fonction de Déconnexion ---
  const handleLogout = useCallback(() => {
    console.log("Admin Logout: Removing tokens and redirecting...");
    // Vider les tokens côté client
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setIsAdminVerified(false);
    router.push("/"); // Rediriger vers l'accueil ou page de login
  }, [router]);

  // --- Vérification de l'authentification et du rôle au chargement ---
  useEffect(() => {
    const verifyAdminStatus = async () => {
      setIsLoading(true);
      try {
        console.log("Vérification du statut admin...");
        // Appel à /api/users/me en utilisant fetchWithAuth
        // fetchWithAuth gère l'ajout du token et le refresh automatiquement
        const userData = await fetchWithAuth("/api/users/me"); // Appel GET par défaut

        // Vérifier si la réponse contient le rôle admin
        if (userData && userData.role === "admin") {
          console.log("Vérification Admin réussie pour:", userData.username);
          setIsAdminVerified(true);
        } else {
          console.warn(
            "Utilisateur non admin ou réponse inattendue:",
            userData
          );
          setIsAdminVerified(false);
          router.push("/"); // Rediriger si pas admin
        }
      } catch (error) {
        console.error(
          "Échec de la vérification du statut admin:",
          error.message
        );
        setIsAdminVerified(false);
        // Si l'erreur est "Session expirée", le logout/clear a déjà été fait dans apiClient
        // Sinon, on s'assure de déconnecter et rediriger
        if (error.message !== "Session expirée") {
          handleLogout(); // Assure le nettoyage et la redirection
        } else {
          // Si la session a expiré, apiClient a vidé les tokens, on redirige juste
          router.push("/"); // Ou vers une page de login
        }
      } finally {
        setIsLoading(false);
        console.log("Fin de la vérification admin status.");
      }
    };

    // Vérifier si un token existe avant de lancer la vérification API
    // pour éviter un appel inutile si l'utilisateur n'est clairement pas connecté
    const initialToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!initialToken) {
      console.log("Aucun token initial trouvé, redirection...");
      setIsLoading(false);
      setIsAdminVerified(false);
      router.push("/"); // Ou '/login'
    } else {
      verifyAdminStatus();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Dépendance à router pour la redirection. handleLogout est stable.

  // --- Vérification périodique (optionnelle) ou sur événement 'storage' ---
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === ACCESS_TOKEN_KEY && !event.newValue) {
        console.log("Access token supprimé (event storage), déconnexion...");
        handleLogout();
      }
      if (event.key === REFRESH_TOKEN_KEY && !event.newValue) {
        console.log("Refresh token supprimé (event storage), déconnexion...");
        handleLogout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleLogout]); // Utilise handleLogout qui a router comme dépendance

  // Affichage pendant le chargement/vérification
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Vérification de l'accès administrateur...
      </div>
    );
  }

  // Affichage final basé sur la vérification
  return (
    <>
      {isAdminVerified ? (
        // Si admin vérifié, afficher le Layout Admin
        // AdminLayout n'a plus besoin de gérer l'API directement si ses enfants utilisent l'apiClient importé
        <AdminLayout onLogout={handleLogout} />
      ) : (
        // Si pas admin vérifié (après chargement), on est normalement redirigé.
        // On peut afficher un message court ou rien du tout.
        <div className="flex justify-center items-center min-h-screen">
          <p>Accès refusé. Redirection...</p>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}
