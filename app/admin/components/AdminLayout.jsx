// app/admin/components/AdminLayout.jsx
"use client";

import { useState, useEffect } from "react"; // Import useEffect si besoin de logique au montage
import AdminSidebar from "./AdminSidebar";
import TodoListManager from "./TodoListManager";
import QuestDefinitionManager from "./QuestDefinitionManager";
import { Toaster } from "@/components/ui/sonner";

// Clés localStorage (pour référence, devraient être importées d'un fichier central)
const ACCESS_TOKEN_KEY = "accessToken_ernesto";
const REFRESH_TOKEN_KEY = "refreshToken_ernesto";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- SQUELETTE D'UN CLIENT API AUTHENTIFIÉ (A METTRE DANS UN FICHIER SÉPARÉ, ex: utils/apiClient.js) ---
/*
 * Il est FORTEMENT RECOMMANDÉ de créer un fichier séparé (ex: utils/apiClient.js ou hooks/useApiClient.js)
 * qui encapsule la logique suivante. Les composants enfants (TodoListManager, etc.)
 * importeraient et utiliseraient ce client au lieu de faire des appels fetch/axios directs.
 */
const createApiClient = (triggerLogout) => {
  // Fonction pour obtenir les tokens
  const getAuthTokens = () => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  });

  // Fonction pour mettre à jour les tokens
  const setAuthTokens = (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  };

  // Fonction pour vider les tokens
  const clearAuthTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  let isRefreshing = false;
  let refreshSubscribers = [];

  const onRefreshed = (token) => refreshSubscribers.forEach((cb) => cb(token));
  const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb);

  // Fonction principale pour faire les appels (exemple avec fetch)
  const request = async (endpoint, options = {}) => {
    let { accessToken, refreshToken } = getAuthTokens();

    const makeRequestInternal = async (tokenToUse) => {
      const config = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
        },
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config); // Assurez-vous que /api est le bon préfixe

        if (response.status === 401) {
          let errorData;
          try {
            errorData = await response.clone().json();
          } catch (e) {
            /* ignore */
          }

          if (errorData?.error === "token_expired" && refreshToken) {
            if (!isRefreshing) {
              console.log("[ApiClient] Token expiré, tentative de refresh...");
              isRefreshing = true;
              try {
                const refreshRes = await fetch(
                  `${API_BASE_URL}/api/auth/refresh`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: refreshToken }),
                  }
                );
                const refreshData = await refreshRes.json();

                isRefreshing = false; // Reset flag

                if (!refreshRes.ok) {
                  console.error(
                    "[ApiClient] Echec du refresh token:",
                    refreshData
                  );
                  //clearAuthTokens(); // Vider tokens
                  onRefreshed(null); // Notifier échec aux subscribers
                  if (triggerLogout) triggerLogout(); // Déclencher logout global
                  throw new Error(refreshData.message || "Session expirée.");
                }

                const {
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                } = refreshData;
                setAuthTokens(newAccessToken, newRefreshToken); // Stocker nouveaux tokens
                onRefreshed(newAccessToken); // Notifier succès aux subscribers
                console.log(
                  "[ApiClient] Refresh réussi, relance de la requête..."
                );
                return makeRequestInternal(newAccessToken); // Relancer avec nouveau token
              } catch (refreshError) {
                console.error(
                  "[ApiClient] Erreur critique pendant le refresh:",
                  refreshError
                );
                isRefreshing = false;
                onRefreshed(null);
                //clearAuthTokens();
                if (triggerLogout) triggerLogout();
                throw refreshError;
              }
            } else {
              // Refresh déjà en cours, mettre en attente
              return new Promise((resolve, reject) => {
                addRefreshSubscriber((newAccessToken) => {
                  if (newAccessToken) {
                    console.log(
                      "[ApiClient] Refresh terminé (attente), relance de la requête..."
                    );
                    resolve(makeRequestInternal(newAccessToken));
                  } else {
                    reject(
                      new Error("Session expirée pendant le refresh (attente).")
                    );
                  }
                });
              });
            }
          } else {
            // 401 mais pas expiré, ou pas de refresh token
            console.error(
              "[ApiClient] Erreur 401 non gérée ou pas de refresh token."
            );
            //clearAuthTokens();
            if (triggerLogout) triggerLogout();
            throw new Error(errorData?.message || "Authentification requise.");
          }
        } // Fin du if (response.status === 401)

        if (!response.ok) {
          const errorBody = await response.text(); // Lire comme texte pour éviter erreur JSON si vide
          let errorMessage = `Erreur HTTP ${response.status}`;
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            if (errorBody) errorMessage += `: ${errorBody}`;
          }
          // Gérer le cas 403 Forbidden spécifiquement si besoin
          if (response.status === 403) {
            console.warn(`[ApiClient] Accès interdit (403) à ${endpoint}`);
            // Peut-être afficher un message spécifique à l'utilisateur
          }
          throw new Error(errorMessage);
        }

        // Gérer réponse vide (ex: 204 No Content pour DELETE)
        if (
          response.status === 204 ||
          response.headers.get("content-length") === "0"
        ) {
          return null; // Ou undefined
        }

        return response.json(); // Succès
      } catch (error) {
        // Gérer les erreurs réseau ou autres exceptions
        console.error(
          `[ApiClient] Erreur lors de l'appel à ${endpoint}:`,
          error
        );
        // Ne pas déconnecter pour une erreur réseau simple
        throw error; // Propager l'erreur pour que le composant appelant puisse la gérer
      }
    }; // Fin de makeRequestInternal

    return makeRequestInternal(accessToken); // Appel initial
  }; // Fin de la fonction request

  // Retourner un objet ou des fonctions spécifiques (get, post, patch, delete)
  // qui utilisent la fonction `request` interne.
  return {
    get: (endpoint, options = {}) =>
      request(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options = {}) =>
      request(endpoint, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      }),
    patch: (endpoint, body, options = {}) =>
      request(endpoint, {
        ...options,
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (endpoint, options = {}) =>
      request(endpoint, { ...options, method: "DELETE" }),
    // Ajoutez put etc. si nécessaire
  };
};
// --- FIN DU SQUELETTE API CLIENT ---

export default function AdminLayout({ onLogout }) {
  const [activeSection, setActiveSection] = useState("todos"); // 'todos' par défaut

  // Crée une instance du client API en lui passant la fonction de logout
  // Idéalement, ce client serait fourni via un Contexte React pour être
  // accessible partout dans la partie admin sans le recréer ou le passer en props.
  const apiClient = createApiClient(onLogout);

  // Logique pour afficher le bon composant manager
  const renderContent = () => {
    console.log("AdminLayout affiche section:", activeSection);
    switch (activeSection) {
      case "todos":
        // IMPORTANT: TodoListManager DOIT maintenant utiliser `apiClient` pour ses appels
        // Exemple: const todos = await apiClient.get('/admin/todos');
        //          await apiClient.post('/admin/todos', newTodoData);
        //          await apiClient.patch(`/admin/todos/${id}`, updateData);
        //          await apiClient.delete(`/admin/todos/${id}`);
        return <TodoListManager apiClient={apiClient} />; // Passer le client en prop

      case "questDefinitions":
        // IMPORTANT: QuestDefinitionManager DOIT maintenant utiliser `apiClient` pour ses appels
        // Exemple: const quests = await apiClient.get('/admin/quests');
        //          await apiClient.post('/admin/quests', newQuestData);
        // etc...
        return <QuestDefinitionManager apiClient={apiClient} />; // Passer le client en prop

      default:
        return <div>Section invalide ({activeSection}).</div>;
    }
  };

  // Effet pour vérifier si le token existe toujours au cas où.
  // Si le token est supprimé (ex: autre onglet), on devrait déconnecter.
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Si la clé du token d'accès est modifiée ou supprimée dans un autre onglet/fenêtre
      if (event.key === ACCESS_TOKEN_KEY && !event.newValue) {
        console.log("Access token supprimé d'une autre source, déconnexion...");
        onLogout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    // Nettoyage
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [onLogout]);

  return (
    <>
      <div className="flex h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout} // La sidebar peut aussi déclencher le logout
        />
        <main className="flex-1 p-6 overflow-auto">
          {/* Les composants enfants reçoivent maintenant le client API */}
          {renderContent()}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
