// app/(main)/quests/page.js
"use client";

import { useState, useEffect, useCallback } from "react"; // Ajout useCallback
import { fetchWithAuth } from "@/utils/apiClient"; // Ajuste le chemin si besoin
// Renomme QuestCard si tu l'as mis dans _components
import QuestCard from "../_components/QuestCard"; // Assure-toi que ce chemin est bon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Clock, CalendarDays, CalendarRange, ListFilter, CheckCircle, Award, History } from "lucide-react"; // Ajout d'icônes pour statuts aussi
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper pour savoir si une quête est active (non terminée/réclamée et non expirée)
const isActiveQuest = (quest) => {
    const now = new Date();
    const isExpired = quest.expiry_date && new Date(quest.expiry_date) < now;
    return !isExpired && quest.status !== 'completed' && quest.status !== 'reward_claimed';
};

// Helper pour savoir si une quête est prête à être réclamée
const isCompletableQuest = (quest) => {
     const now = new Date();
     const isExpired = quest.expiry_date && new Date(quest.expiry_date) < now;
     // Mettre ici la logique métier : peut-on réclamer une quête expirée si complétée ?
     // Pour l'instant, on considère que non.
     return !isExpired && quest.status === 'completed';
};

// Helper pour savoir si une quête est historisée (réclamée ou expirée non complétée)
const isArchivedQuest = (quest) => {
     const now = new Date();
     const isExpired = quest.expiry_date && new Date(quest.expiry_date) < now;
     return quest.status === 'reward_claimed' || (isExpired && quest.status !== 'completed');
     // Ajuste si les 'completed' expirées doivent aller ici si non réclamables
}

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Garde 'all' comme défaut, ou 'active' si tu préfères
  const [activeTab, setActiveTab] = useState("all");

  // --- Fetching Logic (inchangée mais avec useCallback) ---
  const fetchQuests = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchWithAuth("/api/quests/me");
       // Tri initial optionnel (ex: mettre les complétées en premier, puis actives, puis archivées)
      data.sort((a, b) => {
        const statusOrder = { completed: 0, in_progress: 1, not_started: 2, reward_claimed: 3 };
        const aIsArchived = isArchivedQuest(a);
        const bIsArchived = isArchivedQuest(b);
        if (aIsArchived !== bIsArchived) return aIsArchived ? 1 : -1; // Archivées à la fin
        return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      });
      setQuests(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Erreur quêtes:", err); setError(err.message || "Erreur chargement."); }
    finally { setIsLoading(false); }
  }, []); // Pas de dépendances externes

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  // --- Logique de Filtrage Simplifiée ---
  const filteredQuests = quests.filter(quest => {
    const now = new Date();
    const isExpired = quest.expiry_date && new Date(quest.expiry_date) < now;

    switch (activeTab) {
        // Statuts
        case 'active': return isActiveQuest(quest); // En cours ou non démarrée, non expirée
        case 'completable': return isCompletableQuest(quest); // Terminée, non expirée (selon règles)
        case 'archived': return isArchivedQuest(quest); // Réclamée ou expirée non complétée

        // Types
        case 'daily': return quest.type === 'daily';
        case 'weekly': return quest.type === 'weekly';
        case 'monthly': return quest.type === 'monthly';

        // Défaut = 'all'
        case 'all':
        default: return true;
    }
  });

  // --- Calcul des Compteurs (simplifié) ---
  const tabCounts = {
    all: quests.length,
    active: quests.filter(isActiveQuest).length,
    completable: quests.filter(isCompletableQuest).length,
    archived: quests.filter(isArchivedQuest).length,
    daily: quests.filter(q => q.type === "daily").length,
    weekly: quests.filter(q => q.type === "weekly").length,
    monthly: quests.filter(q => q.type === "monthly").length,
  };

  // --- Rendu ---
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes Quêtes</h1>

      {isLoading && ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> )}
      {error && ( <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> )}

      {!isLoading && !error && quests.length === 0 && ( <p className="text-center text-muted-foreground mt-10">Aucune quête disponible.</p> )}

      {!isLoading && !error && quests.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Liste des onglets simplifiée */}
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap md:justify-start gap-2 h-auto mb-6">
             {/* Groupe Statut */}
             <TabsTrigger value="all" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <ListFilter className="h-3.5 w-3.5" /><span>Toutes</span> <span className="hidden sm:inline">({tabCounts.all})</span>
             </TabsTrigger>
             <TabsTrigger value="active" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <Clock className="h-3.5 w-3.5" /><span>Actives</span> <span className="hidden sm:inline">({tabCounts.active})</span>
             </TabsTrigger>
             <TabsTrigger value="completable" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <CheckCircle className="h-3.5 w-3.5" /><span>À Réclamer</span> <span className="hidden sm:inline">({tabCounts.completable})</span>
             </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <History className="h-3.5 w-3.5" /><span>Archivées</span> <span className="hidden sm:inline">({tabCounts.archived})</span>
             </TabsTrigger>

             {/* Séparateur visuel (optionnel, peut être géré par gap) */}
             {/* <div className="hidden md:block h-auto w-px bg-border mx-1 self-stretch"></div> */}

             {/* Groupe Type */}
             <TabsTrigger value="daily" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <Clock className="h-3.5 w-3.5" /><span>Jour</span> <span className="hidden sm:inline">({tabCounts.daily})</span>
             </TabsTrigger>
             <TabsTrigger value="weekly" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <CalendarDays className="h-3.5 w-3.5" /><span>Semaine</span> <span className="hidden sm:inline">({tabCounts.weekly})</span>
             </TabsTrigger>
             <TabsTrigger value="monthly" className="flex items-center justify-center gap-1 md:w-auto text-xs sm:text-sm px-2 py-1.5 h-auto">
                <CalendarRange className="h-3.5 w-3.5" /><span>Mois</span> <span className="hidden sm:inline">({tabCounts.monthly})</span>
             </TabsTrigger>

             {/* !! Suppression des triggers combinés !! */}

          </TabsList>

          {/* Contenu de l'onglet actif */}
          {/* On utilise une seule div car le filtrage est fait avant */}
           <div className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               {filteredQuests.length > 0 ? (
                 filteredQuests.map((quest) => (
                   // Utilise l'_id de PlayerQuest s'il existe, sinon fallback
                   <QuestCard key={quest._id ?? `quest-${quest.questId}-${quest.assignedAt}`} quest={quest} />
                 ))
               ) : (
                 <p className="col-span-full text-center text-muted-foreground py-10">
                   Aucune quête ne correspond à ce filtre.
                 </p>
               )}
             </div>
           </div>
           {/* Note: Pas besoin de TabsContent multiples si on filtre avant */}

        </Tabs>
      )}

      {/* Rappel pour réclamer en jeu */}
      <p className="mt-8 text-sm text-center text-muted-foreground italic border-t pt-4">
         Réclamez les récompenses via <strong>/claim_rewards</strong> en jeu !
      </p>
    </div>
  );
}