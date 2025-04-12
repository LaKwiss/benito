// app/admin/components/AdminActiveQuestsViewer.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// Utilise l'endpoint confirmé par l'utilisateur
const ACTIVE_QUESTS_ENDPOINT = "/api/admin/quests"; // <- Modifié

// Helper pour formater la date
const formatShortDateTime = (isoDateString) => {
  if (!isoDateString) return "-";
  try {
    const date = new Date(isoDateString);
    return date.toLocaleString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Date invalide";
  }
};

// Helper pour badge statut
const getStatusBadgeVariant = (status) => {
  /* ... comme avant ... */
};

export default function AdminActiveQuestsViewer() {
  const [activeQuests, setActiveQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // TODO: Ajouter états pour pagination quand l'API le supportera

  const fetchActiveQuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!API_BASE_URL) {
      setError("URL API non configurée.");
      setIsLoading(false);
      return;
    }

    try {
      console.log(
        `Workspaceing active quests from: ${API_BASE_URL}${ACTIVE_QUESTS_ENDPOINT}`
      );
      const response = await fetch(`${API_BASE_URL}${ACTIVE_QUESTS_ENDPOINT}`); // Appel au bon endpoint
      if (!response.ok) {
        let errorMsg = `Erreur ${response.status}`;
        try {
          const d = await response.json();
          errorMsg = d.message || JSON.stringify(d);
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      // **IMPORTANT**: Adapte ceci si la structure de retour n'est pas un tableau direct
      // ou si le nom du tableau est différent (ex: data.playerQuests)
      setActiveQuests(Array.isArray(data) ? data : []);
      console.log("Active quests data:", data); // Pour vérifier la structure reçue
      // TODO: Gérer la pagination ici
    } catch (err) {
      console.error("Erreur fetchActiveQuests:", err);
      setError(err.message || "Impossible de charger les quêtes actives.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveQuests();
  }, [fetchActiveQuests]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Quêtes Actives des Joueurs</h3>

      {error && (
        <Alert variant="destructive">
          {" "}
          <AlertCircle className="h-4 w-4" />{" "}
          <AlertTitle>Erreur de Chargement</AlertTitle>{" "}
          <AlertDescription>{error}</AlertDescription>{" "}
        </Alert>
      )}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement...</span>
        </div>
      )}

      {!isLoading && activeQuests.length === 0 && !error && (
        <p className="text-center text-muted-foreground pt-5">
          Aucune quête active trouvée.
        </p>
      )}

      {!isLoading && activeQuests.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableCaption className="mt-4">
              Liste des quêtes en cours ou terminées non réclamées par les
              joueurs.
              {/* TODO: Ajouter contrôles de pagination ici */}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Joueur</TableHead>
                <TableHead>Titre Quête</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[180px]">Progression</TableHead>
                {/* Un peu plus large */}
                <TableHead className="text-right">Expiration/Reset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeQuests.map((q) => {
                // Recalcul des valeurs pour chaque ligne
                const progressPercent =
                  q.progress &&
                  typeof q.progress.current === "number" &&
                  typeof q.progress.target === "number" &&
                  q.progress.target > 0
                    ? (q.progress.current / q.progress.target) * 100
                    : 0;
                const isExpired =
                  q.expiry_date && new Date(q.expiry_date) < new Date();
                // S'assure que q.status existe avant d'appeler replace ou getStatusBadgeVariant
                const currentStatus = q.status ?? "unknown";
                const displayStatus =
                  isExpired && currentStatus !== "reward_claimed"
                    ? "Expirée"
                    : currentStatus.replace("_", " ");
                const displayStatusVariant =
                  isExpired && currentStatus !== "reward_claimed"
                    ? "destructive"
                    : getStatusBadgeVariant(currentStatus);

                return (
                  <TableRow
                    key={q._id ?? `quest-${q.playerUsername}-${q.questId}`}
                  >
                    <TableCell className="font-medium">
                      {q.playerUsername ?? "-"}
                    </TableCell>
                    {/* Affiche le titre si disponible, sinon questId */}
                    <TableCell>{q.title ?? q.questId ?? "Inconnue"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {q.type ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={displayStatusVariant}
                        className="capitalize"
                      >
                        {displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {q.progress &&
                      typeof q.progress.current === "number" &&
                      typeof q.progress.target === "number" ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={progressPercent}
                            className="h-2 flex-1 min-w-[60px]"
                            aria-label={`Progression ${progressPercent.toFixed(
                              0
                            )}%`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {q.progress.current}/{q.progress.target}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatShortDateTime(q.expiry_date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {/* TODO: Ajouter les contrôles de pagination ici */}
    </div>
  );
}
