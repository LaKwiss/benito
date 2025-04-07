// app/shop/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWithAuth } from "../../utils/apiClient";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const VERCEL_API_URL = "https://minecraft-api.vercel.app/api/items"; // URL de l'API externe

export default function ShopPage() {
  // --- États ---
  const [items, setItems] = useState([]); // Items de notre shop API
  const [itemMetadataMap, setItemMetadataMap] = useState(null); // Map des métadonnées Vercel (key: namespacedId)
  const [loadingShop, setLoadingShop] = useState(true); // Chargement de notre API
  const [loadingMeta, setLoadingMeta] = useState(true); // Chargement de l'API Vercel
  const [error, setError] = useState("");
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState({
    message: "",
    type: "",
    listingId: null,
  });
  const [purchasingId, setPurchasingId] = useState(null);
  const [filterMode, setFilterMode] = useState("all");

  // --- Fonctions API ---

  // Récupère les items en vente depuis notre API
  const fetchShopItems = async () => {
    setLoadingShop(true);
    setError("");
    setPurchaseStatus({ message: "", type: "", listingId: null });
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setError("Non connecté. Redirection...");
      setLoadingShop(false);
      setLoadingMeta(false);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setTimeout(() => router.push("/login"), 2000);
      return false;
    } // Indique échec
    try {
      const data = await fetchWithAuth("/api/shop/items", { method: "GET" });
      setItems(Array.isArray(data) ? data : data.items || data.listings || []);
      return true; // Indique succès
    } catch (err) {
      console.error("Erreur fetchShopItems:", err);
      if (err.message === "Session expirée") {
        setError("Session expirée. Redirection...");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(err.message || "Impossible de charger les items du shop.");
      }
      return false; // Indique échec
    } finally {
      setLoadingShop(false);
    }
  };

  // Récupère les métadonnées (images, etc.) depuis l'API Vercel
  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      console.log("Fetching metadata from Vercel API...");
      const response = await fetch(VERCEL_API_URL);
      if (!response.ok) {
        throw new Error(
          `Erreur ${response.status} lors de la récupération des métadonnées.`
        );
      }
      const metaDataArray = await response.json();
      console.log(`Metadata received: ${metaDataArray.length} items`);

      // Convertit le tableau en Map pour accès rapide par namespacedId
      const map = new Map();
      metaDataArray.forEach((metaItem) => {
        if (metaItem.namespacedId) {
          map.set(metaItem.namespacedId, metaItem);
        }
      });
      setItemMetadataMap(map);
      console.log("Metadata Map created.");
      return true; // Succès
    } catch (err) {
      console.error("Erreur fetchMetadata:", err);
      // On peut choisir de continuer sans les images ou afficher une erreur bloquante
      setError((prev) =>
        prev
          ? `${prev}\nErreur métadonnées: ${err.message}`
          : `Erreur métadonnées: ${err.message}`
      );
      setItemMetadataMap(new Map()); // Initialise une map vide pour éviter les erreurs plus loin
      return false; // Échec
    } finally {
      setLoadingMeta(false);
    }
  };

  // Logique d'achat (inchangée)
  const handlePurchase = async (listingId) => {
    /* ... */ console.log(`Tentative achat: ${listingId}`);
    setPurchasingId(listingId);
    setPurchaseStatus({ message: "", type: "", listingId: null });
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setError("Non connecté. Redirection...");
      setPurchasingId(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }
    try {
      const data = await fetchWithAuth("/api/shop/purchase", {
        method: "POST",
        body: JSON.stringify({ listingId: listingId }),
      });
      console.log("Réponse achat:", data);
      let msg = "Achat réussi !";
      if (data.status === "delivered") {
        msg = data.message || "Achat réussi ! Item livré.";
        setPurchaseStatus({ message: msg, type: "success", listingId });
      } else if (data.status === "pending_delivery") {
        msg = data.message || "Achat réussi ! Utilisez /redeem en jeu.";
        setPurchaseStatus({ message: msg, type: "info", listingId });
      } else {
        setPurchaseStatus({
          message: data.message || "Statut inconnu.",
          type: "info",
          listingId,
        });
      }
      fetchShopItems();
    } catch (err) {
      console.error("Erreur achat:", err);
      if (err.message === "Session expirée") {
        setPurchaseStatus({
          message: "Session expirée. Reconnectez-vous.",
          type: "error",
          listingId,
        });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setPurchaseStatus({
          message: err.message || "Erreur lors de l'achat.",
          type: "error",
          listingId,
        });
      }
    } finally {
      setPurchasingId(null);
    }
  };

  // --- Effet Initial pour charger les deux APIs ---
  useEffect(() => {
    // Lance les deux fetches en parallèle
    Promise.all([fetchShopItems(), fetchMetadata()]).then(
      ([shopSuccess, metaSuccess]) => {
        console.log("Initial fetches complete.", { shopSuccess, metaSuccess });
        // On pourrait gérer des erreurs spécifiques ici si nécessaire
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuté une seule fois au montage

  // --- Calcul Items Filtrés (inchangé) ---
  const filteredItems = items.filter((item) => {
    if (filterMode === "admin") return item.seller === "AdminShop";
    if (filterMode === "players") return item.seller !== "AdminShop";
    return true;
  });

  // --- Rendu ---
  // Attend que les DEUX chargements soient terminés
  if (loadingShop || loadingMeta) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#373737] text-white font-minecraft">
        <div className="p-6 bg-black bg-opacity-30 border-2 border-gray-600 shadow-pixel-md">
          Chargement...
        </div>
      </div>
    );
  }
  // Affiche l'erreur principale si le chargement du shop a échoué
  if (error && items.length === 0) {
    // Vérifie items.length pour distinguer erreur de chargement vs erreur metadata
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#373737] text-red-300 font-minecraft p-4">
        <div className="p-6 bg-black bg-opacity-50 border-2 border-red-700 text-center shadow-pixel-md">
          <p className="text-xl mb-4 text-shadow-sm">Erreur : {error}</p>
          {!error.includes("Redirection") && (
            <button
              onClick={() => {
                fetchShopItems();
                fetchMetadata();
              }}
              className="mt-4 px-4 py-2 bg-gray-500 text-white border-2 border-t-gray-400 border-l-gray-400 border-b-gray-700 border-r-gray-700 hover:bg-gray-600 active:bg-gray-700 active:border-t-gray-700 active:border-b-gray-400 shadow-pixel-sm active:shadow-none active:translate-y-px"
            >
              Réessayer
            </button>
          )}
          <button
            onClick={() => router.push("/login")}
            className="mt-2 ml-2 px-4 py-2 bg-gray-600 text-white border-2 border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800 hover:bg-gray-700 shadow-pixel-sm active:shadow-none active:translate-y-px"
          >
            Connexion
          </button>
        </div>
      </div>
    );
  }

  // Affichage normal
  return (
    <div className="min-h-screen bg-[#373737] p-4 sm:p-6 md:p-8 font-minecraft text-white antialiased">
      {/* Header */}
      <div className="mb-6 p-4 bg-gradient-to-b from-gray-700 to-gray-800 border-t-2 border-b-2 border-t-gray-500 border-b-black/50 shadow-lg text-center">
        {" "}
        <h1 className="text-4xl font-bold text-lime-300 text-shadow-md">
          SHOP
        </h1>{" "}
        <div className="mt-2 text-sm text-gray-400">
          (Pseudo, Solde, Déconnexion)
        </div>{" "}
      </div>
      {/* Barre de Filtres */}
      <div className="mb-6 flex justify-center items-center gap-2 sm:gap-4 p-2 bg-black bg-opacity-20 rounded-md shadow-inner border border-black/50">
        {" "}
        {["all", "admin", "players"].map((mode) => {
          const isActive = filterMode === mode;
          let label = "";
          let baseBg = "bg-gray-600",
            hoverBg = "hover:bg-gray-700",
            activeStateBg = "bg-gray-700",
            activeBorder =
              "active:border-t-gray-800 active:border-l-gray-800 active:border-b-gray-500 active:border-r-gray-500",
            normalBorder =
              "border-t-gray-500 border-l-gray-500 border-b-gray-800 border-r-gray-800",
            activeClass = "translate-y-px shadow-none brightness-90";
          switch (mode) {
            case "all":
              label = "Tous";
              baseBg = "bg-green-600";
              hoverBg = "hover:bg-green-700";
              activeStateBg = "bg-green-800";
              activeBorder =
                "active:border-t-green-900 active:border-l-green-900 active:border-b-green-600 active:border-r-green-600";
              normalBorder =
                "border-t-green-500 border-l-green-500 border-b-green-800 border-r-green-800";
              break;
            case "admin":
              label = "AdminShop";
              baseBg = "bg-yellow-600";
              hoverBg = "hover:bg-yellow-700";
              activeStateBg = "bg-yellow-800";
              activeBorder =
                "active:border-t-yellow-900 active:border-l-yellow-900 active:border-b-yellow-600 active:border-r-yellow-600";
              normalBorder =
                "border-t-yellow-500 border-l-yellow-500 border-b-yellow-800 border-r-yellow-800";
              break;
            case "players":
              label = "Joueurs";
              baseBg = "bg-blue-600";
              hoverBg = "hover:bg-blue-700";
              activeStateBg = "bg-blue-800";
              activeBorder =
                "active:border-t-blue-900 active:border-l-blue-900 active:border-b-blue-600 active:border-r-blue-600";
              normalBorder =
                "border-t-blue-500 border-l-blue-500 border-b-blue-800 border-r-blue-800";
              break;
          }
          return (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={` py-1.5 px-4 font-minecraft text-xs sm:text-sm text-white focus:outline-none transition-all duration-100 ease-out border-2 shadow-pixel-sm text-shadow-sm ${
                isActive
                  ? `${activeStateBg} ${activeBorder} ${activeClass}`
                  : `${baseBg} ${normalBorder} ${hoverBg} active:${activeStateBg} ${activeBorder} active:shadow-none active:translate-y-px active:brightness-90`
              } `}
            >
              {" "}
              {label}{" "}
            </button>
          );
        })}{" "}
      </div>
      {/* Message Statut Achat */}
      {purchaseStatus.message && (
        <div
          className={`mb-6 p-3 rounded text-center border ${
            purchaseStatus.type === "success"
              ? "bg-green-800/70 border-green-600 text-green-100"
              : purchaseStatus.type === "error"
              ? "bg-red-800/70 border-red-600 text-red-200"
              : "bg-blue-800/70 border-blue-600 text-blue-100"
          } shadow-md`}
        >
          {" "}
          {purchaseStatus.message}{" "}
        </div>
      )}

      {/* Grille des Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.length === 0 ? (
          <p className="col-span-full text-center text-gray-400 mt-10 text-lg">
            {" "}
            {filterMode === "admin"
              ? "Aucun item AdminShop trouvé."
              : filterMode === "players"
              ? "Aucun item de joueur trouvé."
              : "Le shop est vide !"}{" "}
          </p>
        ) : (
          filteredItems.map((item) => {
            // --- Récupération de l'image depuis les métadonnées ---
            // Utilise item.itemId (ou item.namespacedId si c'est ça que ton API renvoie)
            const meta = itemMetadataMap?.get(item.itemId || item.namespacedId);
            const imageUrl = meta?.image; // Prend l'URL de l'image depuis les métadonnées
            // ---

            return (
              // --- Carte d'item ---
              <div
                key={item.listingId}
                className={`bg-[#1E1E1E] border-4 border-t-[#555555] border-l-[#555555] border-b-[#2a2a2a] border-r-[#2a2a2a] p-3 flex flex-col justify-between shadow-pixel-md relative transition-transform hover:scale-[1.03] duration-150 ${
                  item.seller === "AdminShop"
                    ? "outline outline-2 outline-yellow-400 outline-offset-[-4px]"
                    : ""
                }`}
              >
                {item.seller === "AdminShop" && (
                  <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] px-1 leading-none font-bold border border-yellow-700 shadow-sm z-10">
                    ADMIN
                  </span>
                )}
                <div className="flex-grow mb-3 flex flex-col text-center">
                  {/* Icone / Image */}
                  <div className="mb-4 mt-1 h-16 w-16 mx-auto flex items-center justify-center bg-black/30 border border-gray-600/50 shadow-inner">
                    {imageUrl ? ( // Affiche l'image si l'URL a été trouvée
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        width={48}
                        height={48}
                        unoptimized={true}
                        className="object-contain image-rendering-pixelated"
                        onError={(e) => {
                          try {
                            e.currentTarget.src = "/images/items/default.png";
                            e.currentTarget.onerror = null;
                          } catch (err) {
                            console.error("Erreur fallback image", err);
                          }
                        }}
                      />
                    ) : (
                      // Sinon, affiche un placeholder
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs italic">
                        ?
                      </div>
                    )}
                  </div>
                  {/* Reste des infos */}
                  <h2
                    className="text-base font-bold text-white mb-2 leading-tight text-shadow-sm"
                    title={item.name}
                  >
                    {item.name}
                  </h2>
                  <p className="text-lg font-bold text-yellow-300 mb-3 leading-tight text-shadow-sm">
                    {item.price} <span className="text-sm">$</span>
                  </p>
                  <div className="text-[11px] text-gray-400 mb-3 leading-tight">
                    {" "}
                    <span>Qt: {item.quantity}</span>{" "}
                    <span className="mx-1.5">|</span>{" "}
                    <span title={item.seller}>Par: {item.seller}</span>{" "}
                  </div>
                </div>
                {/* Bouton Acheter */}
                <div className="mt-auto">
                  {" "}
                  <button
                    onClick={() => handlePurchase(item.listingId)}
                    disabled={purchasingId === item.listingId || !!error}
                    className={` w-full py-2 px-2 font-minecraft text-sm text-white focus:outline-none transition-all duration-100 ease-out border-2 shadow-pixel-sm ${
                      purchasingId === item.listingId || !!error
                        ? "bg-gray-600 border-gray-700 text-gray-400 cursor-wait shadow-none"
                        : `bg-blue-600 border-t-blue-400 border-l-blue-400 border-b-blue-800 border-r-blue-800 hover:bg-blue-700 hover:brightness-110 active:bg-blue-800 active:border-t-blue-800 active:border-l-blue-800 active:border-b-blue-400 active:border-r-blue-400 active:shadow-none active:translate-y-px active:brightness-90`
                    } `}
                  >
                    {" "}
                    {purchasingId === item.listingId
                      ? "Achat..."
                      : "Acheter"}{" "}
                  </button>{" "}
                </div>
              </div>
              // --- Fin Carte d'item ---
            );
          }) // Fin map
        )}
      </div>
    </div>
  );
}
