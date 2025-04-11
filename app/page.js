// app/(main)/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext"; // Vérifie le chemin
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image"; // Importé pour les futurs screenshots

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirection si non authentifié (ou si déjà authentifié, optionnel)
  useEffect(() => {
    if (isLoading) return; // Attendre la fin du chargement

    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Affichage pendant le chargement ou la redirection
  if (isLoading || (!isLoading && !isAuthenticated)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <span>Chargement...</span>
      </div>
    );
  }

  // Affichage de la landing page si authentifié
  return (
    <div className="flex flex-col">
      {" "}
      {/* Conteneur principal vertical */}
      {/* Section "Hero" */}
      <section className="w-full py-24 md:py-32 lg:py-40 text-center">
        <div className="container mx-auto px-4">
          {/* Titre Principal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-foreground">
            Interface Benito {/* Adapte ce titre */}
          </h1>
          {/* Sous-titre / Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Accédez à la boutique du serveur, gérez vos objets et suivez vos
            quêtes.
          </p>
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push("/shop")}
              className="shadow-md"
            >
              Accéder à la Boutique
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/quests")}
              className="shadow"
            >
              Voir mes Quêtes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      {/* Section Screenshots */}
      <section className="w-full py-16 md:py-24 bg-muted/30 border-t">
        {" "}
        {/* Fond léger et bordure */}
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Aperçu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="border bg-card rounded-lg overflow-hidden shadow-lg p-4">
              <h3 className="font-semibold text-center mb-2">Boutique</h3>

              <Image
                src="/images/shop.png"
                alt="Aperçu de la boutique"
                width={1920} // Largeur originale de l'image
                height={1080} // Hauteur originale
                className="w-full h-auto rounded shadow" // Style
              />
            </div>

            {/* Screenshot 2 (Quests) - Placeholder */}
            <div className="border bg-card rounded-lg overflow-hidden shadow-lg p-4">
              <h3 className="font-semibold text-center mb-2">Quêtes</h3>

              <Image
                src="/images/quest.png"
                alt="Aperçu des quêtes"
                width={1920}
                height={1080}
                className="w-full h-auto rounded shadow"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
