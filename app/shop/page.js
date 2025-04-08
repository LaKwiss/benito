// app/shop/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWithAuth } from "../../utils/apiClient";
import { useAuth } from "../context/AuthContext";

// Importe les composants enfants
import ShopHeader from "../components/ShopHeader";
import PurchaseStatusAlert from "../components/PurchaseStatusAlert";
import ItemCard from "../components/ItemCard"; // On va devoir le modifier aussi

// Importe les composants shadcn/ui
import { Button } from "@/components/ui/button"; // Assure-toi qu'il est importé
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, ArrowUpDown } from "lucide-react";
// Imports pour la modale Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Pour le bouton Fermer
} from "@/components/ui/dialog";

const VERCEL_API_URL = "https://minecraft-api.vercel.app/api/items";

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "Date inconnue";
  try {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("fr-CH", options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

export default function ShopPage() {
  // --- États ---
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    fetchUserData,
  } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [itemMetadataMap, setItemMetadataMap] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState({
    message: "",
    type: "",
    listingId: null,
  });
  const [purchasingId, setPurchasingId] = useState(null);

  // --- États pour Filtre/Tri/Recherche ---
  const [filterMode, setFilterMode] = useState("all");
  const [sortKey, setSortKey] = useState("listedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Nouvel état pour la modale ---
  const [selectedItem, setSelectedItem] = useState(null); // Stocke l'item cliqué
  const [isModalOpen, setIsModalOpen] = useState(false); // Contrôle l'ouverture

  // --- Fonctions API (fetchShopItems, fetchMetadata inchangées) ---
  const fetchShopItems = async () => {
    setLoadingShop(true);
    setError("");
    setPurchaseStatus({ message: "", type: "", listingId: null });
    try {
      const data = await fetchWithAuth("/api/shop/items", { method: "GET" });
      setItems(Array.isArray(data) ? data : data.items || data.listings || []);
      return true;
    } catch (err) {
      console.error("Erreur fetchShopItems:", err);
      if (err.message === "Session expirée") {
        setError("Session expirée.");
      } else {
        setError(err.message || "Impossible de charger les items du shop.");
      }
      return false;
    } finally {
      setLoadingShop(false);
    }
  };

  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      const response = await fetch(VERCEL_API_URL);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status} (Metadata API)`);
      }
      const metaDataArray = await response.json();
      const map = new Map();
      metaDataArray.forEach((metaItem) => {
        if (metaItem.namespacedId) {
          map.set(metaItem.namespacedId, metaItem);
        }
      });
      setItemMetadataMap(map);
      return true;
    } catch (err) {
      console.error("Erreur fetchMetadata:", err);
      setError((prev) =>
        prev
          ? `${prev}\nErreur métadonnées: ${err.message}`
          : `Erreur métadonnées: ${err.message}`
      );
      setItemMetadataMap(new Map());
      return false;
    } finally {
      setLoadingMeta(false);
    }
  };

  // handlePurchase modifié pour fermer la modale si besoin
  const handlePurchase = async (listingId) => {
    if (!listingId) return; // Sécurité
    console.log(`Tentative achat depuis modale: ${listingId}`);
    setPurchasingId(listingId);
    setPurchaseStatus({ message: "", type: "", listingId: null }); // Clear l'alerte globale
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
      await fetchUserData();
      await fetchShopItems(); // Utilise await pour être sûr que c'est fini avant de fermer
      setIsModalOpen(false); // Ferme la modale après succès
    } catch (err) {
      console.error("Erreur achat:", err);
      if (err.message === "Session expirée") {
        setPurchaseStatus({
          message: "Session expirée.",
          type: "error",
          listingId,
        });
        setIsModalOpen(false); // Ferme aussi en cas d'erreur de session
      } else {
        setPurchaseStatus({
          message: err.message || "Erreur lors de l'achat.",
          type: "error",
          listingId,
        });
        // Ne ferme pas la modale pour les autres erreurs d'achat
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const clearPurchaseStatus = () => {
    setPurchaseStatus({ message: "", type: "", listingId: null });
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        Promise.all([fetchShopItems(), fetchMetadata()]).then(
          ([shopSuccess, metaSuccess]) => {
            if (!user && shopSuccess) {
              fetchUserData();
            }
          }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading, router]);

  const processedItems = useMemo(() => {
    console.log("Recalculating processedItems...");
    let tempItems = [...items];

    // 1. Filtre par Mode
    if (filterMode === "admin") {
      tempItems = tempItems.filter((item) => item.seller === "AdminShop");
    } else if (filterMode === "players") {
      tempItems = tempItems.filter((item) => item.seller !== "AdminShop");
    }

    // 2. Filtre par Recherche
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      tempItems = tempItems.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // 3. Tri
    tempItems.sort((a, b) => {
      let compareA = a[sortKey];
      let compareB = b[sortKey];
      if (sortKey === "listedAt") {
        compareA = new Date(compareA).getTime() || 0;
        compareB = new Date(compareB).getTime() || 0;
      } else if (sortKey === "price") {
        compareA = Number(compareA) || 0;
        compareB = Number(compareB) || 0;
      } else if (sortKey === "name") {
        compareA = String(compareA).toLowerCase();
        compareB = String(compareB).toLowerCase();
        return sortOrder === "asc"
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      }
      return sortOrder === "asc" ? compareA - compareB : compareB - compareA;
    });
    return tempItems;
  }, [items, filterMode, searchQuery, sortKey, sortOrder]);

  // --- Fonction pour ouvrir la modale ---
  const handleItemClick = (item) => {
    console.log("Item clicked for modal:", item);
    setSelectedItem(item);
    setIsModalOpen(true);
    clearPurchaseStatus(); // Nettoie les anciens messages d'achat
  };

  // --- Rendu ---
  if (isAuthLoading || loadingShop || loadingMeta) {
    /* ... Loading JSX ... */
  }
  if (!isAuthenticated && !isAuthLoading) {
    /* ... Redirecting JSX ... */
  }
  if (error && items.length === 0 && !loadingShop) {
    /* ... Error JSX ... */
  }

  // Logique pour l'image de l'item sélectionné (pour la modale)
  const selectedItemMeta = selectedItem
    ? itemMetadataMap?.get(selectedItem.itemId || selectedItem.namespacedId)
    : null;
  const selectedItemImageUrl = selectedItemMeta?.image;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 font-sans text-foreground">
      <ShopHeader />

      {/* Barre d'Actions Unifiée */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
        {/* Filtre (ToggleGroup) */}
        <ToggleGroup
          type="single"
          value={filterMode}
          onValueChange={(value) => {
            if (value) setFilterMode(value);
          }}
          aria-label="Filtrer les items"
          className="justify-center sm:justify-start"
          variant="outline"
          size="lg"
        >
          <ToggleGroupItem
            value="all"
            aria-label="Afficher tous les items"
            className="flex-grow-6"
          >
            Tous
          </ToggleGroupItem>
          <ToggleGroupItem
            value="admin"
            aria-label="Afficher AdminShop"
            className="flex-grow-12"
          >
            AdminShop
          </ToggleGroupItem>
          <ToggleGroupItem
            value="players"
            aria-label="Afficher Joueurs"
            className="flex-grow-8"
          >
            Joueurs
          </ToggleGroupItem>
        </ToggleGroup>
        {/* Recherche */}
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        {/* Sélecteurs de Tri */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="listedAt">Date</SelectItem>
              <SelectItem value="price">Prix</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <PurchaseStatusAlert
        status={purchaseStatus}
        onDismiss={clearPurchaseStatus}
      />

      {/* Grille des Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {processedItems.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground mt-10 text-lg">
            Aucun item ne correspond à vos critères.
          </p>
        ) : (
          processedItems.map((item) => {
            const meta = itemMetadataMap?.get(item.itemId || item.namespacedId);
            const imageUrl = meta?.image;
            return (
              // Wrapper Dialog autour de ItemCard
              // Note: La clé est maintenant sur Dialog pour React
              <Dialog key={item.listingId}>
                <DialogTrigger asChild>
                  {/* Passe une fonction anonyme pour appeler handleItemClick */}
                  {/* NE PAS passer handlePurchase ici */}
                  <ItemCard
                    item={item}
                    imageUrl={imageUrl}
                    // isPurchasing n'est plus pertinent pour la carte elle-même
                    hasError={!!error && items.length === 0}
                    onClick={() => handleItemClick(item)} // Passe la fonction pour gérer le clic
                    // onPurchase n'est plus passé à ItemCard
                  />
                </DialogTrigger>
                {/* Le contenu de la modale est défini plus bas */}
              </Dialog>
            );
          })
        )}
      </div>

      {/* Contenu de la Modale (DialogContent) */}
      {/* Contrôlé par l'état isModalOpen et selectedItem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#1E1E1E] border-[#555555] text-white">
          {selectedItem && ( // S'assurer qu'un item est sélectionné
            <>
              <DialogHeader className="items-center pt-4">
                {" "}
                {/* Ajout padding top */}
                <div className="mb-4 h-16 w-16 flex items-center justify-center bg-black/30 border border-gray-600/50 shadow-inner rounded-md">
                  {" "}
                  {/* Ajout rounded */}
                  {selectedItemImageUrl ? (
                    <Image
                      src={selectedItemImageUrl}
                      alt={selectedItem.name}
                      width={48} // Taille réduite pour mieux fitter
                      height={48}
                      unoptimized={true}
                      className="object-contain image-rendering-pixelated"
                      onError={(e) => {
                        e.currentTarget.src = "/images/items/default.png";
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 rounded-md">
                      ?
                    </div> // Ajout rounded
                  )}
                </div>
                <DialogTitle className="text-xl text-white text-shadow-sm">
                  {selectedItem.name}
                </DialogTitle>
                <DialogDescription className="text-center text-gray-400 text-xs pt-1 px-4">
                  {" "}
                  {/* Ajout padding horizontal */}
                  Vendu par : {selectedItem.seller}{" "}
                  <span className="mx-1">|</span> Quantité :{" "}
                  {selectedItem.quantity} <br />
                  Mis en vente le : {formatDate(selectedItem.listedAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 px-4 space-y-3 text-sm text-gray-300 max-h-[40vh] overflow-y-auto">
                {" "}
                {/* Limite hauteur et scroll */}
                {selectedItem.description && (
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    {" "}
                    {/* Ajout mt-3 */}
                    <p className="font-semibold text-gray-200 mb-1">
                      Description :
                    </p>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>
                )}
                <div className="text-center text-xl font-bold text-yellow-300 text-shadow-sm pt-3 border-t border-gray-600 mt-3">
                  {" "}
                  {/* Ajout bordure et mt */}
                  Prix : {selectedItem.price} $
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-gray-600">
                <DialogClose asChild>
                  {/* Bouton Fermer - Reste en outline pour l'instant */}
                  <Button
                    type="button"
                    variant="default" // Utilise la variante par défaut
                    className="text-white border-gray-500"
                  >
                    Fermer
                  </Button>
                </DialogClose>
                {/* Bouton Confirmer Achat - Utilise variant="default" */}
                <Button
                  type="button"
                  variant="default" // Applique la variante par défaut (devrait être le style primaire)
                  onClick={() => handlePurchase(selectedItem.listingId)}
                  disabled={purchasingId != null} // La variante gère le style disabled
                  // Retire les classes bg-* personnalisées d'ici
                >
                  {/* Le texte change toujours en fonction de l'état purchasingId */}
                  {purchasingId === selectedItem.listingId
                    ? "Achat..."
                    : "Confirmer Achat"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div> // Fin du div principal
  );
}
