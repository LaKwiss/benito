// app/(main)/quests/_components/QuestCard.jsx
"use client";

import React from "react"; // Assure-toi que React est importé si tu utilises React.cloneElement (pas nécessaire ici)
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, Package, Star, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper pour formater la date d'expiration
const formatExpiryDate = (isoDateString) => {
  if (!isoDateString) return null;
  try {
    const date = new Date(isoDateString);
    return date.toLocaleString("fr-CH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    console.error("Erreur formatage date:", e); // Log l'erreur pour le debug
    return "Date invalide";
  }
};

// Helper pour afficher les récompenses - CORRIGÉ
const renderReward = (reward, index, questId) => {
  // Ajout de questId
  let Icon = Package;
  let text = "";
  // Clé robuste utilisant l'ID de la quête, l'index et le type de récompense
  const key = `quest-${questId}-reward-${index}-${reward.type}`;

  switch (reward.type) {
    case "money":
      Icon = Coins;
      text = `${reward.amount?.toLocaleString("fr-CH") ?? "?"} $`;
      break;
    case "item":
      Icon = Package;
      const itemName = reward.itemId?.replace("minecraft:", "") ?? "inconnu";
      const itemImageUrl = `https://minecraft-api.vercel.app/images/items/${itemName}.png`;
      // Retourne directement pour le type 'item'
      return (
        <div
          key={key} // Utilise la clé générée
          className="flex items-center gap-1 text-xs bg-muted p-1 rounded"
        >
          <Image
            src={itemImageUrl}
            alt={itemName}
            width={16}
            height={16}
            unoptimized
            className="image-rendering-pixelated"
            onError={(e) => {
              // Fallback générique si l'image de l'item n'est pas trouvée
              e.currentTarget.src = "/images/items/default.png"; // Assure-toi que ce chemin existe dans public/images/items/
              e.currentTarget.onerror = null; // Empêche boucle d'erreur
            }}
          />
          <span>
            {reward.quantity > 1 ? `${reward.quantity}x ` : ""}
            {itemName}
          </span>
        </div>
      );
    case "xp":
      Icon = Star;
      text = `${reward.amount ?? "?"} XP`;
      break;
    // Ajoute d'autres types de récompenses ici si nécessaire
    default:
      text = `Récompense inconnue (${reward.type})`;
  }

  // Retourne pour les autres types de récompenses
  return (
    <div
      key={key} // Utilise la clé générée
      className="flex items-center gap-1 text-xs bg-muted p-1 rounded"
    >
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
};

// Helper pour le badge de statut
const getStatusBadgeVariant = (status) => {
  switch (status) {
    case "completed":
      return "default"; // Style primaire (souvent bleu ou vert)
    case "reward_claimed":
      return "secondary"; // Style secondaire (gris)
    case "in_progress":
      return "outline"; // Style contour
    case "not_started":
      return "outline";
    default:
      return "secondary";
  }
};

// Composant QuestCard - CORRIGÉ (dans l'appel .map)
export default function QuestCard({ quest }) {
  // Vérification défensive au cas où quest ou quest.progress serait null/undefined
  const progressValue =
    quest?.progress && quest.progress.target > 0
      ? (quest.progress.current / quest.progress.target) * 100
      : 0;

  // Vérification si la quête est expirée (en plus du statut réclamé)
  const isExpired =
    quest?.expiry_date && new Date(quest.expiry_date) < new Date();
  const isCompleted = quest?.status === "completed" && !isExpired; // Complété et non expiré
  const isClaimed = quest?.status === "reward_claimed";
  const isInactive = isClaimed || isExpired; // Inactif si réclamé OU expiré

  const formattedExpiry = formatExpiryDate(quest?.expiry_date);

  // Vérification si l'objet quête est valide
  if (!quest || !quest.id) {
    console.error("Données de quête invalides reçues:", quest);
    return (
      <Card className="border-destructive p-4">
        <p className="text-destructive-foreground">
          Erreur: Données de quête invalides.
        </p>
      </Card>
    ); // Affiche une carte d'erreur
  }

  return (
    <Card
      className={cn(
        "flex flex-col h-full", // h-full pour que toutes les cartes aient la même hauteur si dans une grille CSS
        isInactive ? "opacity-60 bg-muted/50" : "", // Style pour inactif (réclamé ou expiré)
        isCompleted ? "border-green-600 shadow-md shadow-green-600/20" : "" // Style pour complété (prêt à réclamer)
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2 mb-2">
          {/* Type et Titre */}
          <div>
            {quest.type && (
              <Badge variant="secondary" className="mb-2 capitalize text-xs">
                {quest.type}
              </Badge>
            )}
            <CardTitle className="text-base leading-tight">
              {quest.title ?? "Quête sans titre"}
            </CardTitle>
          </div>
          {/* Statut */}
          {quest.status && (
            <Badge
              variant={getStatusBadgeVariant(quest.status)}
              className="capitalize mt-1 whitespace-nowrap text-xs"
            >
              {isExpired && quest.status !== "reward_claimed"
                ? "Expirée"
                : quest.status.replace("_", " ")}
            </Badge>
          )}
        </div>
        {/* Description */}
        {quest.description && (
          <CardDescription className="text-sm">
            {quest.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        {/* Barre de Progression */}
        {(quest.status === "in_progress" || quest.status === "completed") &&
          quest.progress &&
          typeof quest.progress.current === "number" &&
          typeof quest.progress.target === "number" &&
          quest.progress.target > 0 &&
          !isExpired && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 text-right">
                {quest.progress.current} / {quest.progress.target}
              </div>
              <Progress
                value={progressValue}
                aria-label={`Progression ${progressValue.toFixed(0)}%`}
                className="h-2"
              />
            </div>
          )}

        {/* Série (Streak) */}
        {quest.completion_streak?.current_days > 0 &&
          !isInactive && ( // N'affiche pas le streak si inactif
            <div className="flex items-center text-xs text-amber-600 font-medium">
              <Flame className="h-4 w-4 mr-1" />
              Série de {quest.completion_streak.current_days} jours
            </div>
          )}

        {/* Récompenses */}
        {quest.rewards?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-1.5">Récompenses :</h4>
            <div className="flex flex-wrap gap-1.5">
              {/* On passe quest.id à renderReward */}
              {quest.rewards.map((reward, index) =>
                renderReward(reward, index, quest.id)
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground border-t pt-3 mt-auto">
        {" "}
        {/* mt-auto pour pousser en bas */}
        {/* Date d'Expiration / Reset */}
        {formattedExpiry ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isExpired ? (
              <span className="text-destructive">
                Expirée le : {formattedExpiry}
              </span>
            ) : (
              <span>Réinitialisation le : {formattedExpiry}</span>
            )}
          </div>
        ) : (
          <span>Quête permanente</span>
        )}
      </CardFooter>
    </Card>
  );
}
