// utils/apiClient.js

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Gestion simple pour éviter les rafraîchissements concurrents ---
let isRefreshing = false;
let refreshPromise = null;
// ---

// Fonction pour tenter de rafraîchir le token
async function refreshToken() {
  console.log("Tentative de rafraîchissement du token...");
  const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!currentRefreshToken) {
    console.log("Aucun refresh token trouvé.");
    throw new Error("Refresh token manquant.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    const data = await response.json(); // Toujours lire le JSON

    if (!response.ok) {
      // Si le refresh échoue (ex: refresh token invalide/expiré), on déconnecte
      console.error(
        "Échec du rafraîchissement du token:",
        data.message || response.status
      );
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      // On pourrait rediriger ici, mais il est préférable de laisser le composant appelant gérer la redirection
      // en attrapant l'erreur spécifique 'Session expirée'.
      throw new Error("Session expirée");
    }

    // Succès du rafraîchissement
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken; // L'API PEUT renvoyer un nouveau refresh token

    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    if (newRefreshToken) {
      // Si l'API renvoie un nouveau refresh token, mettons-le à jour
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      console.log("Nouveau refresh token stocké.");
    }
    console.log("Token rafraîchi avec succès.");
    return newAccessToken; // Retourne le nouveau token pour la requête initiale
  } catch (err) {
    console.error("Erreur critique lors du rafraîchissement:", err);
    // Si l'erreur vient du throw 'Session expirée', on la propage
    if (err.message === "Session expirée") {
      throw err;
    }
    // Pour d'autres erreurs (ex: réseau), on les propage aussi mais on pourrait vouloir les distinguer
    throw new Error("Erreur lors du rafraîchissement du token.");
  }
}

// Fonction principale pour les appels API authentifiés
export async function fetchWithAuth(endpoint, options = {}) {
  if (!API_BASE_URL) {
    console.error(
      "Erreur: La variable d'environnement NEXT_PUBLIC_API_BASE_URL n'est pas définie."
    );
    throw new Error("Configuration API manquante.");
  }

  let token = localStorage.getItem(ACCESS_TOKEN_KEY);

  // --- Fonction interne pour exécuter la requête ---
  const executeFetch = async (currentToken) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }), // Ajoute le token s'il existe
    };

    const config = {
      ...options, // Fusionne les options passées (method, body, etc.)
      headers: {
        ...defaultHeaders,
        ...options.headers, // Permet de surcharger les headers par défaut
      },
    };

    try {
      return await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (networkError) {
      console.error("Erreur réseau:", networkError);
      throw new Error("Erreur réseau lors de la communication avec l'API.");
    }
  };
  // --- Fin de la fonction interne ---

  // Premier essai avec le token actuel
  let response = await executeFetch(token);

  // Si la réponse est 401 (Non autorisé) -> Tenter le rafraîchissement
  if (response.status === 401) {
    console.warn(
      `Réponse 401 reçue pour ${endpoint}. Tentative de rafraîchissement.`
    );

    // --- Gestion de la concurrence ---
    if (!isRefreshing) {
      isRefreshing = true;
      // Lance le rafraîchissement et stocke la promesse
      refreshPromise = refreshToken().finally(() => {
        isRefreshing = false; // Réinitialise le flag une fois terminé (succès ou échec)
        refreshPromise = null; // Nettoie la promesse stockée
      });
    } else {
      console.log("Attente d'un rafraîchissement déjà en cours...");
    }
    // ---

    try {
      // Attend que la promesse de rafraîchissement (en cours ou nouvelle) se termine
      const newAccessToken = await refreshPromise;
      console.log(
        "Nouvel accessToken obtenu, réessai de la requête originale..."
      );
      // Réessaie la requête originale avec le nouveau token
      response = await executeFetch(newAccessToken);
    } catch (refreshError) {
      console.error(
        "Le rafraîchissement a échoué, impossible de réessayer la requête.",
        refreshError
      );
      // Si l'erreur est 'Session expirée', on la propage pour que le composant redirige
      if (refreshError.message === "Session expirée") {
        throw refreshError;
      }
      // Pour d'autres erreurs, on propage une erreur générique ou spécifique si besoin
      throw new Error("Échec de la récupération de la session.");
    }
  }

  // --- Gestion finale de la réponse (après succès initial ou succès après refresh) ---
  // Si après tout ça, la réponse n'est toujours pas OK (ex: erreur 403, 404, 500...)
  if (!response.ok) {
    let errorData = { message: `Erreur HTTP ${response.status}` };
    try {
      errorData = await response.json();
    } catch (parseError) {
      console.warn(
        "La réponse d'erreur finale n'était pas du JSON valide:",
        parseError
      );
    }
    console.error(`Erreur API finale pour ${endpoint}:`, errorData);
    // Lance une erreur avec le message de l'API si possible
    throw new Error(errorData.message || `Erreur ${response.status}`);
  }

  // Si la réponse est OK, essaie de parser le JSON
  // Gère le cas où il n'y a pas de corps (ex: 204 No Content)
  if (response.status === 204) {
    return null; // Ou undefined, selon la préférence
  }
  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Erreur lors du parsing JSON de la réponse:", jsonError);
    throw new Error("Réponse invalide reçue de l'API.");
  }
}
