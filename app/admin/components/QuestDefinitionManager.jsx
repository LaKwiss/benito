// app/admin/components/QuestDefinitionManager.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Imports Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Imports Lucide Icons
import {
  Loader2,
  Trash2,
  AlertCircle,
  Edit,
  PlusCircle,
  Package,
  Coins,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";

// --- Schémas Zod ---
const rewardSchema = z
  .object({
    type: z.enum(["money", "item", "xp"]),
    amount: z.coerce.number().int().positive().optional(),
    itemId: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "money" || data.type === "xp")
        return data.amount != null && data.amount > 0;
      if (data.type === "item")
        return (
          data.itemId != null &&
          data.itemId.trim() !== "" &&
          data.quantity != null &&
          data.quantity > 0
        );
      return false;
    },
    { message: "Données invalides pour le type." }
  );

const questDefinitionSchema = z.object({
  questId: z
    .string()
    .min(3)
    .regex(/^[a-z0-9_]+$/),
  title: z.string().min(1, "Titre requis."),
  description: z.string().min(1, "Description requise."),
  type: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Type requis.",
  }),
  target: z.coerce
    .number({ invalid_type_error: "Nombre requis." })
    .int()
    .positive("Doit être positif."),
  isActive: z.boolean().default(true),
});

// API Config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const QUESTS_ENDPOINT = "/api/admin/quests";

// --- Composant Principal ---
export default function QuestDefinitionManager() {
  // États Liste & Chargement/Erreur
  const [questDefs, setQuestDefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États Sheet & Formulaire
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedQuestDef, setSelectedQuestDef] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [currentReward, setCurrentReward] = useState({
    type: "money",
    amount: "",
    itemId: "",
    quantity: 1,
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSheetSaving, setIsSheetSaving] = useState(false);
  const [isSheetDeleting, setIsSheetDeleting] = useState(false);

  // Formulaire (react-hook-form)
  const form = useForm({
    resolver: zodResolver(questDefinitionSchema),
    defaultValues: {
      questId: "",
      title: "",
      description: "",
      type: undefined,
      target: 1,
      isActive: true,
    },
  });

  // --- Fonctions API ---
  const fetchQuestDefinitions = useCallback(async () => {
    // ... (logique fetch GET inchangée) ...
    setError(null);
    if (!API_BASE_URL) {
      setError("URL API manquante.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}${QUESTS_ENDPOINT}`);
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setQuestDefs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Defs:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchQuestDefinitions();
  }, [fetchQuestDefinitions]);

  // --- Fonctions Sheet : Ouverture ---
  const handleCreateClick = () => {
    setSelectedQuestDef(null);
    setIsCreating(true);
    form.reset({
      questId: "",
      title: "",
      description: "",
      type: undefined,
      target: 1,
      isActive: true,
    });
    setRewards([]);
    setIsSheetOpen(true);
  };

  const handleEditClick = (questDef) => {
    setSelectedQuestDef(questDef);
    setIsCreating(false);
    form.reset({
      questId: questDef.questId,
      title: questDef.title,
      description: questDef.description,
      type: questDef.type,
      target: questDef.target,
      isActive: questDef.isActive ?? true,
    });
    setRewards(questDef.rewards || []);
    setIsSheetOpen(true);
  };

  // --- États nécessaires (doivent exister dans ton composant) ---
  // const [rewards, setRewards] = useState([]);
  // const [currentReward, setCurrentReward] = useState({ type: 'money', amount: '', itemId: '', quantity: 1 });
  // const [popoverOpen, setPopoverOpen] = useState(false);
  // const { toast } = // ... si tu utilises toast de sonner (import { toast } from "sonner";)

  // --- Fonctions Sheet : Gestion Récompenses ---

  // Fonction pour AJOUTER une récompense à la liste temporaire 'rewards'
  const handleAddReward = () => {
    console.log("handleAddReward: Tentative d'ajout."); // LOG 1: Vérifie si la fonction est appelée
    const { type, amount, itemId, quantity } = currentReward; // Récupère l'état de la récompense en cours d'édition
    let isValid = false;
    let rewardToAdd = { type }; // Commence par le type

    // Validation simple basée sur le type choisi
    if (
      (type === "money" || type === "xp") &&
      amount &&
      parseInt(amount, 10) > 0
    ) {
      rewardToAdd.amount = parseInt(amount, 10); // Ajoute le montant converti en nombre
      isValid = true;
    } else if (
      type === "item" &&
      itemId &&
      itemId.trim() !== "" &&
      quantity &&
      parseInt(quantity, 10) > 0
    ) {
      rewardToAdd.itemId = itemId.trim(); // Ajoute l'ID de l'item (nettoyé)
      rewardToAdd.quantity = parseInt(quantity, 10); // Ajoute la quantité convertie
      isValid = true;
    }
    // Tu peux ajouter d'autres validations ici si nécessaire

    console.log(
      "handleAddReward: Validation terminée. Valide =",
      isValid,
      "Données:",
      rewardToAdd,
      "Input actuel:",
      currentReward
    ); // LOG 2: Vérifie le résultat de la validation

    if (isValid) {
      // Met à jour l'état 'rewards' en ajoutant la nouvelle récompense à la liste existante
      setRewards((prev) => {
        const newState = [...prev, rewardToAdd];
        console.log(
          "handleAddReward: Nouvel état rewards après ajout:",
          newState
        ); // LOG 3: Vérifie le nouvel état
        return newState;
      });
      // Réinitialise le formulaire d'ajout de récompense pour la prochaine fois
      setCurrentReward({ type: "money", amount: "", itemId: "", quantity: 1 });
      // Ferme le Popover
      setPopoverOpen(false);
    } else {
      // Si la validation échoue, affiche une notification d'erreur
      toast.error("Récompense invalide", {
        description:
          "Veuillez remplir correctement les champs pour le type sélectionné.",
      });
    }
  };

  // Fonction pour SUPPRIMER une récompense de la liste temporaire 'rewards'
  const removeReward = (indexToRemove) => {
    console.log(
      `removeReward: Tentative de suppression à l'index ${indexToRemove}`
    ); // LOG 4: Vérifie l'index
    // Met à jour l'état 'rewards' en filtrant l'élément à l'index donné
    setRewards((prev) => {
      const newState = prev.filter(
        (_, currentIndex) => currentIndex !== indexToRemove
      );
      console.log(
        "removeReward: Nouvel état rewards après suppression:",
        newState
      ); // LOG 5: Vérifie le nouvel état
      return newState;
    });
  };

  // --- Fonctions Sheet : Actions (Créer/Modifier/Supprimer via onSubmit et handleDeleteClick) ---
  const onSubmit = async (values) => {
    // ... (logique POST / PUT inchangée, utilise toast.promise) ...
    setIsSheetSaving(true);
    setError(null);
    const questData = { ...values, rewards: rewards };
    const url = isCreating
      ? `${API_BASE_URL}${QUESTS_ENDPOINT}`
      : `${API_BASE_URL}${QUESTS_ENDPOINT}/${selectedQuestDef.questId}`;
    const method = isCreating ? "POST" : "PUT";
    if (!isCreating) {
      delete questData.questId;
    }
    toast.promise(
      fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questData),
      }).then(async (res) => {
        if (!res.ok) {
          let eM = `Erreur ${res.status}`;
          try {
            const d = await res.json();
            eM = d.message || JSON.stringify(d);
          } catch (e) {}
          throw new Error(eM);
        }
        return res.json();
      }),
      {
        loading: isCreating ? "Création..." : "Mise à jour...",
        success: (data) => {
          setIsSheetOpen(false);
          fetchQuestDefinitions();
          return isCreating ? "Définition créée !" : "Définition mise à jour !";
        },
        error: (err) => {
          return err.message;
        },
        finally: () => setIsSheetSaving(false),
      }
    );
  };

  const handleDeleteClick = async () => {
    // ... (logique DELETE inchangée, utilise toast.promise et confirm) ...
    if (
      !selectedQuestDef ||
      !confirm(
        `Supprimer "${selectedQuestDef.title}" (${selectedQuestDef.questId}) ?`
      )
    )
      return;
    setIsSheetDeleting(true);
    setError(null);
    const questId = selectedQuestDef.questId;
    toast.promise(
      fetch(`${API_BASE_URL}${QUESTS_ENDPOINT}/${questId}`, {
        method: "DELETE",
      }).then(async (res) => {
        if (!res.ok) {
          let eM = `Erreur ${res.status}`;
          try {
            const d = await res.json();
            eM = d.message || JSON.stringify(d);
          } catch (e) {}
          throw new Error(eM);
        }
      }),
      {
        loading: "Suppression...",
        success: () => {
          setIsSheetOpen(false);
          fetchQuestDefinitions();
          return "Définition supprimée !";
        },
        error: (err) => {
          return err.message;
        },
        finally: () => setIsSheetDeleting(false),
      }
    );
  };

  // --- Rendu ---
  return (
    // La Sheet englobe le tableau (pour les triggers) et son propre contenu
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="space-y-6">
        {" "}
        {/* Conteneur pour Titre + Bouton Créer + Erreurs + Tableau */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            Gestion des Définitions de Quêtes
          </h2>
          {/* Bouton Créer - Correction : Retire asChild */}
          <SheetTrigger asChild>
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Créer une Définition
            </Button>
          </SheetTrigger>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Erreur API</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Tableau des définitions */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : questDefs.length === 0 && !error ? (
          <p className="text-center pt-5">Aucune définition.</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Objectif</TableHead>
                  <TableHead>Récompenses</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questDefs.map((def) => (
                  <TableRow key={def.questId}>
                    <TableCell className="font-mono text-xs">
                      {def.questId}
                    </TableCell>
                    <TableCell className="font-medium">{def.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {def.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{def.target}</TableCell>
                    <TableCell className="text-xs">
                      {def.rewards?.length ?? 0} récompense(s)
                    </TableCell>
                    <TableCell>
                      {def.isActive ? (
                        <Badge>Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Bouton Modifier - Correction : Retire asChild */}
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(def)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* --- Contenu de la Sheet pour Création/Édition --- */}
      <SheetContent className="p-6 flex flex-col w-full sm:max-w-2xl">
        {" "}
        {/* Augmenté largeur (max-w-2xl) */}
        <SheetHeader className="pr-10">
          <SheetTitle>
            {isCreating ? "Créer une Définition" : "Modifier la Définition"}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? "Remplissez les détails..."
              : `Modification de '${selectedQuestDef?.questId ?? ""}'`}
          </SheetDescription>
        </SheetHeader>
        {/* Formulaire dans la Sheet */}
        {/* Utilise flex-grow pour pousser le footer en bas */}
        <div className="flex-grow py-4 overflow-y-auto pr-4 -mr-2 space-y-4">
          {" "}
          {/* Ajout -mr-2 pour compenser pr-4 */}
          <Form {...form}>
            {/* Id unique pour le formulaire pour le lier au bouton submit du footer */}
            <form
              id="quest-def-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Champs (questId, title, desc, type, target, isActive) */}
              <FormField
                control={form.control}
                name="questId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Textuel Unique (*)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isCreating} />
                    </FormControl>
                    <FormDescription>Non modifiable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre (*)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (*)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type (*)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">J</SelectItem>
                        <SelectItem value="weekly">H</SelectItem>
                        <SelectItem value="monthly">M</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif (Nombre) (*)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0 pt-2">
                    <FormLabel>Activée?</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Section Récompenses */}
              <div className="space-y-3 rounded-lg border p-3 bg-background">
                {" "}
                {/* Léger fond différent */}
                <h4 className="text-base font-medium">Récompenses</h4>
                {/* ... (Logique d'affichage et d'ajout de récompenses identique à QuestCreator) ... */}
                {/* (Copier/Coller la section depuis le code de QuestCreator ici) */}
                {/* ... ou idéalement, utiliser un composant réutilisable QuestRewardsInput ... */}
                {rewards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune récompense.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {" "}
                    {rewards.map((r, idx) => (
                      <li
                        key={`reward-${idx}`}
                        className="flex items-center justify-between text-xs bg-muted p-1.5 rounded"
                      >
                        {" "}
                        <span className="flex items-center gap-1.5">
                          {" "}
                          {r.type === "money" && (
                            <>
                              <Coins className="h-3 w-3" />
                              {r.amount}$
                            </>
                          )}{" "}
                          {r.type === "xp" && (
                            <>
                              <Star className="h-3 w-3" />
                              {r.amount}XP
                            </>
                          )}{" "}
                          {r.type === "item" && (
                            <>
                              <Package className="h-3 w-3" />
                              {r.quantity}x {r.itemId}
                            </>
                          )}{" "}
                        </span>{" "}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReward(idx)}
                          className="h-5 w-5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>{" "}
                      </li>
                    ))}{" "}
                  </ul>
                )}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-3">
                      {" "}
                      <div className="space-y-1">
                        <h5 className="font-medium text-sm">Nouvelle</h5>
                      </div>{" "}
                      <div className="grid gap-1.5">
                        <Label>Type</Label>
                        <Select
                          value={currentReward.type}
                          onValueChange={(v) =>
                            setCurrentReward((p) => ({
                              ...p,
                              type: v,
                              amount: "",
                              itemId: "",
                              quantity: 1,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="money">Argent</SelectItem>
                            <SelectItem value="item">Item</SelectItem>
                            <SelectItem value="xp">XP</SelectItem>
                          </SelectContent>
                        </Select>
                        {(currentReward.type === "money" ||
                          currentReward.type === "xp") && (
                          <>
                            <Label>Montant</Label>
                            <Input
                              type="number"
                              min="1"
                              value={currentReward.amount}
                              onChange={(e) =>
                                setCurrentReward((p) => ({
                                  ...p,
                                  amount: e.target.value,
                                }))
                              }
                              className="h-8"
                            />
                          </>
                        )}
                        {currentReward.type === "item" && (
                          <>
                            <Label>Item ID</Label>
                            <Input
                              type="text"
                              placeholder="minecraft:..."
                              value={currentReward.itemId}
                              onChange={(e) =>
                                setCurrentReward((p) => ({
                                  ...p,
                                  itemId: e.target.value,
                                }))
                              }
                              className="h-8"
                            />
                            <p className="text-xs text-muted-foreground">
                              // TODO: Autocomplete
                            </p>
                            <Label>Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={currentReward.quantity}
                              onChange={(e) =>
                                setCurrentReward((p) => ({
                                  ...p,
                                  quantity: e.target.value,
                                }))
                              }
                              className="h-8"
                            />
                          </>
                        )}
                      </div>{" "}
                      <Button size="sm" onClick={handleAddReward}>
                        Ajouter à liste
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </form>
          </Form>
        </div>
        {/* Footer de la Sheet */}
        <SheetFooter className="pt-4 border-t">
          {!isCreating && (
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isSheetDeleting || isSheetSaving || !selectedQuestDef}
              className="mr-auto"
            >
              {" "}
              {isSheetDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}{" "}
              Supprimer{" "}
            </Button>
          )}
          {/* Bouton Annuler - Correction : Retire asChild */}
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={isSheetSaving || isSheetDeleting}
            >
              Annuler
            </Button>
          </SheetClose>
          {/* Le bouton Enregistrer soumet le formulaire externe grâce à l'ID */}
          <Button
            type="submit"
            form="quest-def-form"
            disabled={isSheetSaving || isSheetDeleting}
          >
            {" "}
            {isSheetSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}{" "}
            Enregistrer{" "}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
