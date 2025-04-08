// components/ShopHeader.js
"use client";
import { useAuth } from "../context/AuthContext"; // Adapte chemin si besoin
import { Button } from "@/components/ui/button";
// Importe les composants Avatar
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Optionnel: Icone pour le fallback de l'avatar
import { User } from "lucide-react";

export default function ShopHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  // Construit l'URL de l'avatar si l'utilisateur est connecté
  const avatarUrl =
    isAuthenticated && user?.username
      ? `https://minotar.net/avatar/${user.username}/40.png` // Demande une taille spécifique (ex: 40px)
      : "";

  return (
    // Utilise Flexbox pour aligner Titre à gauche et UserInfo à droite
    <div className="mb-6 p-4 bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Titre */}
      <h1 className="text-3xl font-bold text-primary order-1 sm:order-none">
        SHOP
      </h1>

      {/* Section Utilisateur (Alignée à droite sur grand écran) */}
      {isAuthenticated && user ? (
        <div className="flex items-center gap-3 order-2 sm:order-none">
          {/* Infos Texte (Nom + Solde) */}
          <div className="text-right sm:text-left">
            <div className="text-sm font-medium">{user.username}</div>
            <div className="text-xs text-muted-foreground">
              Solde:{" "}
              <span className="font-semibold text-primary">
                {user.balance ?? "N/A"} $
              </span>
            </div>
          </div>

          {/* Avatar */}
          <Avatar className="h-10 w-10 border">
            {" "}
            {/* Taille de l'avatar */}
            <AvatarImage
              src={avatarUrl}
              alt={user.username}
              // style={{ imageRendering: 'pixelated' }} // Applique le rendu pixelisé si l'avatar l'est
            />
            {/* Fallback si l'image ne charge pas ou si username est court */}
            <AvatarFallback>
              {/* Affiche les 2 premières lettres du pseudo ou une icone */}
              {user.username?.substring(0, 2).toUpperCase() || (
                <User className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Bouton Déconnexion */}
          <Button
            variant="outline" // Change pour 'outline' pour moins d'emphase ? Ou garde 'destructive'
            size="sm"
            onClick={logout}
            className="ml-2" // Ajoute un peu d'espace
          >
            Déconnexion
          </Button>
        </div>
      ) : (
        // Placeholder si non connecté (ne devrait pas arriver sur cette page)
        <div className="text-sm text-muted-foreground order-2 sm:order-none">
          (Non connecté)
        </div>
      )}
    </div>
  );
}
