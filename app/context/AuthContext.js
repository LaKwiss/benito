// context/AuthContext.js
"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../../utils/apiClient";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { username: '...', balance: 0, ... } ou null
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Pour gérer le chargement initial
  const router = useRouter();

  // Fonction pour récupérer les infos utilisateur
  const fetchUserData = useCallback(async () => {
    console.log("AuthContext: Tentative de fetchUserData...");
    try {
      // Utilise fetchWithAuth pour appeler /api/users/me
      const userData = await fetchWithAuth("/api/users/me", { method: "GET" });
      console.log("AuthContext: User data received:", userData);
      setUser(userData); // Met à jour l'état user
      setIsAuthenticated(true);
      return userData; // Retourne les données si besoin
    } catch (error) {
      console.error("AuthContext: Failed to fetch user data", error);
      // Si erreur (token invalide/expiré après refresh échoué), déconnecte
      if (
        error.message === "Session expirée" ||
        error.message.includes("401")
      ) {
        await logout(); // Appelle la fonction logout pour nettoyer
      } else {
        // Autre erreur, on garde l'état actuel mais on log
        setUser(null);
        setIsAuthenticated(false);
      }
      return null;
    }
  }, [router]); // router est une dépendance pour le logout potentiel

  // Fonction de connexion (appelée depuis la page Login)
  const login = useCallback(
    async (tokenData) => {
      console.log("AuthContext: Login attempt with tokens", tokenData);
      localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refreshToken);
      setIsAuthenticated(true); // Met à jour l'état immédiatement
      // Récupère les données utilisateur après avoir stocké les tokens
      const fetchedUser = await fetchUserData();
      if (fetchedUser) {
        router.push("/"); // Redirige vers le shop si succès
      } else {
        // Si fetchUserData échoue juste après login, on logout pour nettoyer
        await logout();
        // Reste sur la page login ou affiche une erreur ? Pour l'instant on logout silencieusement.
        console.error(
          "AuthContext: Fetch user data failed immediately after login."
        );
        // On pourrait vouloir setter une erreur ici
      }
    },
    [fetchUserData, router]
  );

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    console.log("AuthContext: Logout attempt...");
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    console.log("AuthContext: User logged out locally.");

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // Appelle l'API de logout (optionnel mais recommandé - Critère F5.2)
    if (refreshToken) {
      try {
        // Pas besoin d'utiliser fetchWithAuth car on n'a pas besoin du access token
        // et on ne veut pas déclencher de refresh ici.
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (apiBaseUrl) {
          await fetch(`${apiBaseUrl}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          console.log("AuthContext: Logout API call successful");
        }
      } catch (error) {
        console.error(
          "AuthContext: Logout API call failed (but logged out locally)",
          error
        );
      }
    }
    // Redirige vers la page de connexion
    router.push("/login");
  }, [router]);

  // Vérification initiale au montage du composant Provider
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      console.log(
        "AuthContext: Checking initial auth status, token found:",
        !!token
      );
      if (token) {
        // Si un token existe, essaie de récupérer les données utilisateur
        await fetchUserData(); // fetchUserData gère la mise à jour de isAuthenticated et user
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
      console.log("AuthContext: Initial auth check finished.");
    };
    checkAuthStatus();
    // On ne met fetchUserData dans les dépendances que si on veut re-vérifier à chaque changement de fetchUserData
    // Pour l'instant, on ne le fait qu'au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // S'exécute une seule fois

  // Valeur fournie par le contexte
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchUserData, // Expose la fonction pour pouvoir rafraîchir les données user si besoin
    setUser, // Utile pour mettre à jour le solde directement si l'API d'achat le renvoie
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser facilement le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
