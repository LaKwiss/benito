// app/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Clé pour stocker les tokens dans localStorage
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Récupère l'URL de l'API depuis les variables d'environnement
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      setError("L'URL de l'API n'est pas configurée.");
      setLoading(false);
      console.error(
        "Erreur: La variable d'environnement NEXT_PUBLIC_API_BASE_URL n'est pas définie."
      );
      return;
    }

    try {
      const requestBody = { username: username, code: code };

      // Appel réel à l'API POST /api/auth/login (Critère F1.4)
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Assure-toi que les noms correspondent à ce que ton API attend
        body: JSON.stringify({ username: username, code: code }),
      });

      // Gestion de la réponse (Critère F1.5)
      if (!response.ok) {
        let errorData = { message: `Erreur HTTP ${response.status}` };
        try {
          // Essaye de lire le message d'erreur de l'API s'il existe
          errorData = await response.json();
        } catch (parseError) {
          // Ignore l'erreur de parsing si le corps n'est pas du JSON valide
          console.warn(
            "La réponse d'erreur n'était pas du JSON valide:",
            parseError
          );
        }
        // Utilise le message de l'API ou un message par défaut
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      // Succès (200 OK)
      const data = await response.json();
      console.log("Connexion réussie, tokens reçus:", data);

      // Stockage des tokens (Critère F1.5 & F1.7)
      // ATTENTION: localStorage est vulnérable aux attaques XSS.
      // Pour une meilleure sécurité, le refreshToken devrait idéalement
      // être stocké dans un cookie HttpOnly géré côté serveur (via API Routes Next.js par exemple).
      // Pour cet exemple client-side pur, nous utilisons localStorage.
      if (data.accessToken && data.refreshToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        console.log("Tokens stockés dans localStorage.");

        // Redirection vers la boutique (Critère F1.5)
        router.push("/shop"); // Ou '/'
      } else {
        throw new Error("Les tokens n'ont pas été reçus de l'API.");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError(err.message || "Échec de la connexion."); // Message d'erreur pour l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  // Le reste du JSX reste identique...
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700 text-white p-4">
      <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm border-4 border-gray-600">
        <h1 className="text-2xl font-bold mb-6 text-center text-yellow-400">
          Connexion au Shop
        </h1>
        <p className="mb-4 text-sm text-gray-300 text-center">
          Pour obtenir votre code temporaire, tapez{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded font-mono">
            /login
          </code>{" "}
          en jeu.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Pseudo Minecraft
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
              placeholder="VotrePseudo"
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="code"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Code Temporaire (6 chiffres)
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              pattern="\d{6}"
              title="Le code doit contenir exactement 6 chiffres."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-white placeholder-gray-500 font-mono text-lg tracking-widest"
              placeholder="123456"
              inputMode="numeric"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-400 bg-red-900 bg-opacity-50 p-2 rounded border border-red-700 text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white font-bold`}
          >
            {loading ? "Connexion..." : "Se Connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
