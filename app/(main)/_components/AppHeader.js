// app/(main)/_components/AppHeader.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect } from "react"; // Fragment pour les clés dans le mapping
import { useAuth } from "../../context/AuthContext"; // Ajuste le chemin si nécessaire
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Home, ShoppingCart, ScrollText, LogOut } from "lucide-react"; // Ajout d'icônes
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Assure-toi que le chemin est correct

export default function AppHeader() {
  const { user, isAuthenticated, logout, fetchUserData } = useAuth();
  const pathname = usePathname(); // Hook pour obtenir le chemin actuel

  // --- Logique pour mise à jour dynamique du solde ---
  useEffect(() => {
    const handleFocus = () => {
      // Seulement si l'utilisateur est connecté
      if (isAuthenticated) {
        console.log("Window focused, fetching user data...");
        fetchUserData();
      }
    };

    // Re-fetch on window focus
    window.addEventListener("focus", handleFocus);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // fetchUserData est stable grâce à useCallback dans AuthContext
  }, [fetchUserData, isAuthenticated]);
  // --- Fin logique solde dynamique ---

  const avatarUrl = user?.username
    ? `https://minotar.net/avatar/${user.username}/40.png`
    : "";

  // Définir les segments du fil d'Ariane
  const pathSegments = [
    { name: "Accueil", href: "/", icon: Home },
    // Ajoute dynamiquement les segments suivants
    ...(pathname.startsWith("/shop")
      ? [{ name: "Boutique", href: "/shop", icon: ShoppingCart }]
      : []),
    ...(pathname.startsWith("/quests")
      ? [{ name: "Quêtes", href: "/quests", icon: ScrollText }]
      : []),
    // Tu pourrais ajouter d'autres segments ici si tu as des sous-pages
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
      {/* Fil d'Ariane */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {pathSegments.map((segment, index) => (
            <Fragment key={segment.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === pathSegments.length - 1 ? (
                  // Dernière page : utilise BreadcrumbPage
                  <BreadcrumbPage className="flex items-center gap-1">
                    {segment.icon && <segment.icon className="h-4 w-4" />}
                    {segment.name}
                  </BreadcrumbPage>
                ) : (
                  // Pages intermédiaires : utilise BreadcrumbLink
                  <BreadcrumbLink asChild className="flex items-center gap-1">
                    <Link href={segment.href}>
                      {segment.icon && <segment.icon className="h-4 w-4" />}
                      {segment.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Espaceur pour pousser les infos utilisateur à droite */}
      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            {/* Infos Texte (Nom + Solde) */}
            <div className="text-right">
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-muted-foreground">
                Solde:{" "}
                <span className="font-semibold text-primary">
                  {/* Utilise toLocaleString pour formater un peu le nombre */}
                  {typeof user.balance === "number"
                    ? user.balance.toLocaleString("fr-CH")
                    : "N/A"}{" "}
                  $
                </span>
              </div>
            </div>

            {/* Avatar */}
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={avatarUrl} alt={user.username} />
              <AvatarFallback>
                {user.username?.substring(0, 2).toUpperCase() || (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>

            {/* Bouton Déconnexion */}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1 md:mr-0" />{" "}
              {/* Icône seulement sur petit écran ? */}
              <span className="hidden md:inline ml-1">Déconnexion</span>
            </Button>
          </>
        ) : (
          // Optionnel : Afficher un bouton Login si jamais on arrive ici sans être connecté
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
