// app/admin/components/ActionsSection.jsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, PlusSquare } from "lucide-react"; // Importe ArrowLeft
import QuestCreator from "./QuestCreator"; // Importe le formulaire

export default function ActionsSection() {
  // 'list' pour afficher la liste des actions, 'createQuest' pour afficher le formulaire
  const [viewMode, setViewMode] = useState("list");

  // Contenu à afficher en fonction du mode
  if (viewMode === "createQuest") {
    return (
      <div>
        {/* Bouton pour revenir à la liste */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode("list")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux Actions
        </Button>
        {/* Affiche le formulaire de création */}
        <QuestCreator />
      </div>
    );
  }

  // Par défaut, affiche la liste des actions (viewMode === 'list')
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Actions Administrateur</h2>
      <p className="text-sm text-muted-foreground">
        Choisissez une action à effectuer.
      </p>

      {/* Liste des actions disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Action : Créer une quête */}
        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
          onClick={() => setViewMode("createQuest")}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setViewMode("createQuest");
          }}
        >
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
            <PlusSquare className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-base">
                Créer Définition Quête
              </CardTitle>
              <CardDescription className="text-xs">
                Ajouter un nouveau modèle de quête.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* --- Ajoute d'autres cartes ici pour d'autres actions futures --- */}
        {/* Exemple :
          <Card className="opacity-50 cursor-not-allowed">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <SomeIcon className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-base">Autre Action (Bientôt)</CardTitle>
                    <CardDescription className="text-xs">Description de l'autre action.</CardDescription>
                  </div>
              </CardHeader>
          </Card>
          */}
      </div>
    </div>
  );
}
