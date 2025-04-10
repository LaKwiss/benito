// app/(main)/quests/page.js
"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/apiClient"; // Ajuste le chemin si besoin
import QuestCard from "../_components/QuestCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react"; // Icône de chargement

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchWithAuth("/api/quests/me"); // Appelle le nouvel endpoint
        // TODO: Trier les quêtes si nécessaire avant de les setter
        // Exemple simple : mettre les 'completed' non réclamées en premier
        data.sort((a, b) => {
          const statusOrder = {
            completed: 0,
            in_progress: 1,
            not_started: 2,
            reward_claimed: 3,
          };
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        });
        setQuests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement quêtes:", err);
        setError(err.message || "Impossible de charger les quêtes.");
        // Gérer la déconnexion si l'erreur est "Session expirée" (normalement géré par AuthContext/AuthGuard)
      } finally {
        setIsLoading(false);
      }
    };

    loadQuests();
  }, []); // Se charge une seule fois au montage

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Quêtes</h1>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement des quêtes...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && quests.length === 0 && (
        <p className="text-center text-muted-foreground mt-10">
          Aucune quête disponible pour le moment.
        </p>
      )}

      {!isLoading && !error && quests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {/* Rappel pour réclamer en jeu */}
      <p className="mt-8 text-sm text-center text-muted-foreground italic border-t pt-4">
        Réclamez les récompenses de vos quêtes terminées en tapant{" "}
        <strong>/claim_rewards</strong> en jeu !
      </p>
    </div>
  );
}
