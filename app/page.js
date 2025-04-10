// app/page.js
"use client";

import { useState, useEffect } from "react"; // Ajout de useEffect
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext"; // Chemin corrigé
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Composant HubCard (dans app/(main)/page.js) - Avec flèche centrée
function HubCard({ title, description, href, className }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Card
      className={cn(
        "flex-1 w-full cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary flex flex-col justify-center items-center text-center p-6 min-h-[200px] sm:min-h-0",
        className // Applique les classes externes (comme max-w-md)
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {/* Arrow container - Centré */}
      <div className="h-6 mt-4 flex justify-center items-center">
        {" "}
        {/* <-- Classes ajoutées */}
        {isHovered && <ArrowRight className="animate-pulse" size={24} />}
      </div>
    </Card>
  );
}

// Page principale CORRIGÉE
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // --- CORRECTION ICI ---
  // Utiliser useEffect pour la redirection
  useEffect(() => {
    // Ne rien faire si l'état d'authentification est encore en chargement
    if (isLoading) {
      return;
    }
    // Si le chargement est terminé et que l'utilisateur n'est PAS authentifié
    if (!isAuthenticated) {
      router.push("/login");
    }
    // Les dépendances assurent que l'effet se ré-exécute si ces valeurs changent
  }, [isAuthenticated, isLoading, router]);
  // --- FIN CORRECTION ---

  // Pendant le chargement ou si on va rediriger, on peut afficher un loader
  // Ou retourner null pour éviter d'afficher la page brièvement avant redirection
  if (isLoading || !isAuthenticated) {
    // Afficher un loader plus stylisé serait mieux
    return (
      <div className="flex justify-center items-center min-h-screen">
        Chargement...
      </div>
    );
  }

  // Rendu normal si authentifié
  return (
    <div className="flex flex-col sm:flex-row items-stretch justify-center min-h-screen p-4 sm:p-8 gap-4 sm:gap-8 bg-background">
      <HubCard
        title="Boutique"
        description="Acheter et vendre des objets."
        href="/shop"
      />
      <HubCard
        title="Quêtes"
        description="Consulter vos défis et objectifs."
        href="/quests"
      />
    </div>
  );
}
