// app/shop/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../../utils/apiClient"; // Vérifie ce chemin

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// --- Composant Icone Placeholder ---
const ItemPlaceholderIcon = (
  { size = "w-10 h-10" } // Taille par défaut plus petite pour la liste
) => (
  <div
    className={`${size} bg-black bg-opacity-50 border border-gray-600 flex items-center justify-center text-gray-400 text-[10px] italic shrink-0`}
  >
    Icon
  </div>
);

// --- Composant Placeholder pour Tête de Vendeur ---
const SellerHeadPlaceholder = ({ size = "w-5 h-5" }) => (
  <div
    className={`${size} bg-blue-800 border border-blue-900 inline-block align-middle mr-1`}
    title="Seller Icon Placeholder"
  ></div>
);

export default function ShopPage() {
  // États (inchangés)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState({
    message: "",
    type: "",
    listingId: null,
  });
  // purchasingId n'est plus utilisé car on retire le bouton Acheter par ligne pour l'instant
  // const [purchasingId, setPurchasingId] = useState(null);

  // Fonctions fetchItems (inchangée pour la logique)
  const fetchItems = async () => {
    setLoading(true);
    setError("");
    setPurchaseStatus({ message: "", type: "", listingId: null });
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setError("Non connecté. Redirection...");
      setLoading(false);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }
    try {
      const data = await fetchWithAuth("/api/shop/items", { method: "GET" });
      setItems(Array.isArray(data) ? data : data.items || data.listings || []);
    } catch (err) {
      console.error("Erreur fetchItems:", err);
      if (err.message === "Session expirée") {
        setError("Session expirée. Redirection...");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(err.message || "Impossible de charger les items.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction handlePurchase (on la garde mais elle n'est plus appelée par un bouton pour l'instant)
  const handlePurchase = async (listingId) => {
    /* ... logique d'achat inchangée ... */
  };

  useEffect(() => {
    fetchItems(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // --- Rendu ---
  if (loading) {
    /* ... JSX chargement ... */
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white font-minecraft">
        <div className="p-6 bg-black bg-opacity-30 border-2 border-gray-600">
          Chargement du marché...
        </div>
      </div>
    );
  }
  if (error && !loading) {
    /* ... JSX erreur ... */
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-red-400 font-minecraft p-4">
        <div className="p-6 bg-black bg-opacity-50 border-2 border-red-700 text-center">
          <p className="text-xl mb-4">Erreur : {error}</p>
          {!error.includes("Redirection") && (
            <button
              onClick={fetchItems}
              className="mt-4 px-4 py-2 bg-gray-500 text-white border-2 border-t-gray-400 border-l-gray-400 border-b-gray-700 border-r-gray-700 hover:bg-gray-600 active:bg-gray-700 active:border-t-gray-700 active:border-b-gray-400"
            >
              Réessayer
            </button>
          )}
          <button
            onClick={() => router.push("/login")}
            className="mt-2 ml-2 px-4 py-2 bg-gray-600 text-white border-2 border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800 hover:bg-gray-700"
          >
            Connexion
          </button>
        </div>
      </div>
    );
  }

  // Affichage normal - Style inspiré de l'image
  return (
    <div className="min-h-screen bg-[#313131] p-0 font-minecraft text-white antialiased flex justify-center">
      {/* Conteneur principal avec largeur max */}
      <div className="w-full max-w-screen-lg bg-[#484848] shadow-lg flex flex-col">
        {/* TODO: Bannière décorative haute (style auvent vert/blanc) */}
        <div className="h-8 bg-gradient-to-r from-lime-500 via-white to-lime-500 opacity-50">
          {/* Placeholder pour l'auvent */}
        </div>

        {/* Header Principal */}
        <div className="flex justify-between items-center p-3 px-5 bg-black bg-opacity-30 border-b-2 border-black/50">
          <h1 className="text-3xl font-bold text-lime-400 text-shadow-sm">
            MARKET
          </h1>
          {/* TODO: Afficher les vraies infos utilisateur */}
          <div className="text-right text-sm">
            <div>
              <span className="text-lime-300">959.475</span> $
            </div>
            <div>
              <span className="text-lime-300">4.500</span> PB
            </div>
          </div>
        </div>

        {/* Barre d'onglets */}
        <div className="flex items-center bg-black bg-opacity-20 px-3 py-1 border-b-2 border-black/50">
          {/* Onglet Actif */}
          <button className="px-5 py-2 bg-red-600 text-white font-bold text-sm border-2 border-t-red-500 border-l-red-500 border-b-red-800 border-r-red-800 mr-2">
            ACHETER
          </button>
          {/* Autres Onglets (non actifs) */}
          <button className="px-5 py-2 bg-gray-600 text-gray-300 font-bold text-sm border-2 border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800 mr-1 hover:bg-gray-700">
            VENDRE
          </button>
          <button className="px-4 py-2 bg-gray-600 text-gray-300 font-bold text-sm border-2 border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800 mr-1 hover:bg-gray-700">
            STATS
          </button>
          <button className="px-4 py-2 bg-gray-600 text-gray-300 font-bold text-sm border-2 border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800 mr-1 hover:bg-gray-700">
            HISTORIQUE
          </button>
        </div>

        {/* Barre d'actions (Recherche, Filtres) */}
        <div className="flex items-center gap-2 p-3 bg-black bg-opacity-10 border-b-2 border-black/50">
          {/* Input Recherche (Style simple) */}
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-grow px-2 py-1 bg-gray-700 border border-gray-500 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-gray-400"
          />
          {/* Bouton Icone (Placeholder) */}
          <button className="p-1 bg-red-600 border border-red-800 w-7 h-7 flex items-center justify-center text-white">
            🔍
          </button>{" "}
          {/* Icone simple */}
          {/* Dropdown Catégorie (Style simple) */}
          <select className="px-2 py-1 bg-gray-700 border border-gray-500 text-white text-sm focus:outline-none appearance-none w-32">
            <option>Catégorie</option> {/* TODO: Remplir les options */}
          </select>
          {/* Dropdown Trier Par (Style simple) */}
          <select className="px-2 py-1 bg-gray-700 border border-gray-500 text-white text-sm focus:outline-none appearance-none w-32">
            <option>Trier par</option> {/* TODO: Remplir les options */}
          </select>
          {/* Bouton Icone (Placeholder) */}
          <button className="p-1 bg-red-600 border border-red-800 w-7 h-7 flex items-center justify-center text-white">
            ⚙️
          </button>{" "}
          {/* Icone simple */}
        </div>

        {/* --- Liste des Items --- */}
        {/* Conteneur scrollable si besoin */}
        <div className="flex-grow overflow-y-auto p-2 bg-[#313131]">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 mt-10 text-lg">
              Le marché est vide !
            </p>
          ) : (
            <div className="space-y-1">
              {" "}
              {/* Espace entre les lignes */}
              {items.map((item) => (
                // --- Ligne d'item ---
                <div
                  key={item.listingId}
                  // Fond légèrement différent, bordure basse pour séparation
                  className={`flex items-center p-2 bg-black bg-opacity-20 border-b border-gray-600/50 cursor-pointer hover:bg-opacity-30 transition-colors duration-100
                         ${
                           item.seller === "AdminShop"
                             ? "border-l-4 border-yellow-500 pl-1"
                             : ""
                         } // Marqueur AdminShop
                     `}
                  // TODO: Ajouter onClick pour ouvrir détails/acheter ?
                  // onClick={() => handlePurchase(item.listingId)}
                >
                  {/* Icone Item */}
                  <div className="mr-3">
                    <ItemPlaceholderIcon size="w-8 h-8" />{" "}
                    {/* Icone plus petite */}
                  </div>

                  {/* Nom Item */}
                  <div
                    className="flex-grow font-semibold text-sm text-white mr-4"
                    title={item.name}
                  >
                    {/* Optionnel: Ajouter une étoile ou autre pour AdminShop */}
                    {item.seller === "AdminShop" && (
                      <span className="text-yellow-400 mr-1">★</span>
                    )}
                    {item.name}
                    {/* Affichage Quantité sous le nom */}
                    <span className="block text-xs text-gray-400">
                      (Qt: {item.quantity})
                    </span>
                  </div>

                  {/* Vendeur */}
                  <div
                    className="w-28 shrink-0 text-xs text-gray-300 mr-4 text-left overflow-hidden whitespace-nowrap text-ellipsis"
                    title={item.seller}
                  >
                    <SellerHeadPlaceholder size="w-4 h-4" />{" "}
                    {/* Placeholder tête */}
                    {item.seller}
                  </div>

                  {/* Prix (PB - Placeholder) */}
                  <div className="w-20 shrink-0 text-sm text-lime-300 font-bold text-right mr-4">
                    {/* Remplacer par le vrai prix PB si disponible */}
                    {Math.floor(item.price * 10)} PB
                  </div>

                  {/* Prix ($/€) */}
                  <div className="w-20 shrink-0 text-sm text-yellow-400 font-bold text-right">
                    {item.price} $ {/* Utilise $ ou € */}
                  </div>
                </div>
                // --- Fin Ligne d'item ---
              ))}
            </div>
          )}
        </div>
        {/* --- Fin Liste des Items --- */}
      </div>{" "}
      {/* Fin Conteneur principal */}
    </div> // Fin div racine
  );
}
