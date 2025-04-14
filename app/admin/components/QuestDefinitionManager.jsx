// app/admin/components/QuestDefinitionManager.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Image from "next/image";

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
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  FileText,
} from "lucide-react"; // Ajout FileText

import { cn } from "@/lib/utils";

// --- Schémas Zod ---
// S'assurer que ces schémas sont correctement définis et validés
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
    { message: "Données invalides pour le type de récompense." }
  );

const questDefinitionSchema = z.object({
  questId: z
    .string()
    .min(3, "ID requis (min 3 car.)")
    .regex(/^[a-z0-9_]+$/, "ID invalide (a-z, 0-9, _)."),
  title: z.string().min(1, "Titre requis."),
  description: z.string().min(1, "Description requise."),
  type: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Type requis.",
  }),
  target: z.coerce
    .number({
      required_error: "Objectif requis.",
      invalid_type_error: "Doit être un nombre.",
    })
    .int()
    .positive("Doit être positif."),
  isActive: z.boolean().default(true),
  // rewards est validé séparément avant l'envoi si nécessaire
});

// --- API Config ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ITEM_API_URL = process.env.NEXT_PUBLIC_ITEM_API_URL; // Pour l'autocomplétion
const QUESTS_ENDPOINT = "/api/admin/quests";

// --- Composant Principal ---
export default function QuestDefinitionManager() {
  // --- États Liste & Chargement/Erreur ---
  const [questDefs, setQuestDefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- États Sheet & Formulaire ---
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedQuestDef, setSelectedQuestDef] = useState(null);
  const [rewards, setRewards] = useState([]); // Récompenses pour le formulaire dans la Sheet
  const [currentReward, setCurrentReward] = useState({
    type: "money",
    amount: "",
    itemId: "",
    quantity: 1,
  });
  const [popoverOpen, setPopoverOpen] = useState(false); // Pour l'ajout de récompense
  const [isSheetSaving, setIsSheetSaving] = useState(false);
  const [isSheetDeleting, setIsSheetDeleting] = useState(false);

  // --- États Autocomplétion Items ---
  const [itemComboboxOpen, setItemComboboxOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(""); // itemId sélectionné dans combobox
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const debounceTimeoutRef = useRef(null);

  // --- Formulaire (react-hook-form) ---
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
    setSelectedItemId("");
    setItemSearchQuery("");
    setItemSuggestions([]);
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
    setSelectedItemId("");
    setItemSearchQuery("");
    setItemSuggestions([]);
    setIsSheetOpen(true);
  };

  // --- Fonctions Recherche Item (avec debounce) ---
  const fetchItemSuggestions = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setItemSuggestions([]);
        return;
      }

      setIsSearchingItems(true);
      try {
        const response = await fetch(
          `${ITEM_API_URL}/items?q=${encodeURIComponent(query)}&limit=10`
        );
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        const data = await response.json();
        setItemSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch Items:", err);
        setItemSuggestions([]);
      } finally {
        setIsSearchingItems(false);
      }
    },
    [ITEM_API_URL]
  );

  const debouncedFetchItems = useCallback(
    (query) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchItemSuggestions(query);
      }, 300); // 300ms debounce
    },
    [fetchItemSuggestions]
  );
  useEffect(() => {
    debouncedFetchItems(itemSearchQuery);
    return () => {
      /* cleanup */
    };
  }, [itemSearchQuery, debouncedFetchItems]);
  const handleItemSelect = (item) => {
    setSelectedItemId(item.itemId);
    setItemSearchQuery(item.name);
    setItemComboboxOpen(false);
  };

  // --- Fonctions Sheet : Gestion Récompenses ---
  const handleAddReward = () => {
    const { type, amount, quantity } = currentReward; // Prend de l'état courant
    const itemId = selectedItemId; // Prend l'ID sélectionné du combobox
    let isValid = false;
    let rewardToAdd = { type };
    if (
      (type === "money" || type === "xp") &&
      amount &&
      parseInt(amount, 10) > 0
    ) {
      rewardToAdd.amount = parseInt(amount, 10);
      isValid = true;
    } else if (
      type === "item" &&
      itemId &&
      itemId.trim() !== "" &&
      quantity &&
      parseInt(quantity, 10) > 0
    ) {
      rewardToAdd.itemId = itemId.trim();
      rewardToAdd.quantity = parseInt(quantity, 10);
      isValid = true;
    }
    if (isValid) {
      setRewards((prev) => [...prev, rewardToAdd]);
      setCurrentReward((prev) => ({
        ...prev,
        amount: "",
        itemId: "",
        quantity: 1,
      })); // Reset fields
      setSelectedItemId("");
      setItemSearchQuery("");
      setItemSuggestions([]); // Reset combobox
      setPopoverOpen(false);
    } else {
      toast.error("Récompense invalide", {
        description: "Veuillez remplir correctement les champs.",
      });
    }
  };
  const removeReward = (index) => {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Fonctions Sheet : Actions (Submit du formulaire react-hook-form) ---
  const onSubmit = async (values) => {
    setIsSheetSaving(true);
    setError(null);
    const questData = { ...values, rewards: rewards };
    const url = isCreating
      ? `${API_BASE_URL}${QUESTS_ENDPOINT}`
      : `${API_BASE_URL}${QUESTS_ENDPOINT}/${selectedQuestDef.questId}`;
    const method = isCreating ? "POST" : "PUT";
    if (!isCreating) {
      delete questData.questId;
    } // Ne pas envoyer questId en PUT

    console.log(`Submitting ${method} to ${url}`, questData);
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
          console.error("Submit Error:", err);
          return err.message || "Une erreur est survenue.";
        },
        finally: () => setIsSheetSaving(false),
      }
    );
  };

  // Fonction pour le bouton Supprimer (appelée séparément)
  const handleDeleteClick = async () => {
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
          console.error("Delete Error:", err);
          return err.message || "Impossible de supprimer.";
        },
        finally: () => setIsSheetDeleting(false),
      }
    );
  };

  // --- Rendu ---
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="space-y-6">
        {" "}
        {/* Conteneur principal */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            Gestion des Définitions de Quêtes
          </h2>
          {/* Bouton Créer AVEC asChild */}
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
              <TableCaption>Liste des modèles de quêtes.</TableCaption>
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
                      {/* Bouton Modifier AVEC asChild */}
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
        {/* Largeur augmentée */}
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
        <div className="flex-grow py-4 overflow-y-auto pr-4 -mr-2 space-y-4">
          {" "}
          {/* Scroll + Padding */}
          <Form {...form}>
            {/* ID unique pour le formulaire pour le lier au bouton submit du footer */}
            <form
              id="quest-def-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* questId (lecture seule si édition) */}
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
              {/* Autres champs */}
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
                        <SelectItem value="daily">Journalière</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
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

              {/* Section Récompenses (avec Combobox Item) */}
              <div className="space-y-3 rounded-lg border p-3 bg-background">
                <h4 className="text-base font-medium">Récompenses</h4>
                {rewards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune récompense.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {" "}
                    {rewards.map((r, idx) => (
                      <li
                        key={`reward-${idx}-${r.type}`}
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
                          {r.type === "item" &&
                            (() => {
                              // Construit l'URL de l'image
                              const itemName =
                                r.itemId?.replace("minecraft:", "") ??
                                "inconnu";
                              // Assure-toi que ITEM_API_URL est bien défini et accessible ici
                              const itemImageUrl = ITEM_API_URL
                                ? `${ITEM_API_URL}/assets/items/${itemName}.png`
                                : "/images/items/default.png"; // Fallback si URL non définie

                              return (
                                <>
                                  {/* Affiche l'image de l'item */}
                                  <Image
                                    src={itemImageUrl}
                                    alt={itemName}
                                    width={16}
                                    height={16}
                                    className="image-rendering-pixelated"
                                    unoptimized
                                    // Fallback si l'image ne charge pas
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/images/items/default.png";
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  {/* Affiche quantité et nom */}
                                  {r.quantity}x {r.itemId}
                                </>
                              );
                            })()}{" "}
                          {/* Appel immédiat de la fonction pour retourner le JSX */}
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
                {/* Popover pour ajouter */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    {/* ... Contenu Popover avec Select Type, Inputs conditionnels ET Combobox pour Item ... */}
                    {/* (Copier la structure interne du Popover depuis ma réponse précédente sur le Combobox) */}
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <h5 className="font-medium text-sm">Nouvelle</h5>
                      </div>
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
                            <div className="grid gap-1.5">
                              {" "}
                              <Label htmlFor="reward-itemid">Item ID</Label>
                              <Popover
                                open={itemComboboxOpen}
                                onOpenChange={setItemComboboxOpen}
                                modal={false}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    id="reward-itemid"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={itemComboboxOpen}
                                    className="w-full justify-between h-8 font-normal text-xs"
                                  >
                                    {" "}
                                    {selectedItemId || "Chercher item..."}{" "}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />{" "}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Taper nom/ID..."
                                      value={itemSearchQuery}
                                      onValueChange={setItemSearchQuery}
                                    />
                                    <CommandList>
                                      {isSearchingItems && (
                                        <div className="p-1 text-xs text-center flex items-center justify-center">
                                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                          Recherche...
                                        </div>
                                      )}
                                      <CommandEmpty>
                                        {!isSearchingItems &&
                                        itemSearchQuery.length > 1
                                          ? "Aucun item."
                                          : "Tapez min 2 car."}
                                      </CommandEmpty>{" "}
                                      <CommandGroup>
                                        {" "}
                                        {itemSuggestions.map((item) => (
                                          <CommandItem
                                            key={item.itemId}
                                            value={item.itemId}
                                            onSelect={(val) => {
                                              handleItemSelect(item);
                                            }}
                                            className="flex items-center gap-2 text-xs"
                                          >
                                            {" "}
                                            <Image
                                              src={`${ITEM_API_URL}${item.imageUrl}`}
                                              alt={item.name}
                                              width={16}
                                              height={16}
                                              className="image-rendering-pixelated"
                                              unoptimized
                                            />{" "}
                                            <span>{item.name}</span>{" "}
                                            <span className="text-muted-foreground ml-auto">
                                              {item.itemId.replace(
                                                "minecraft:",
                                                ""
                                              )}
                                            </span>{" "}
                                            <Check
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedItemId === item.itemId
                                                  ? "o-100"
                                                  : "o-0"
                                              )}
                                            />{" "}
                                          </CommandItem>
                                        ))}{" "}
                                      </CommandGroup>{" "}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4 pt-2">
                              {" "}
                              <Label htmlFor="reward-quantity">
                                Quantité
                              </Label>{" "}
                              <Input
                                id="reward-quantity"
                                type="number"
                                min="1"
                                placeholder="1"
                                value={currentReward.quantity}
                                onChange={(e) =>
                                  setCurrentReward((p) => ({
                                    ...p,
                                    quantity: e.target.value,
                                  }))
                                }
                                className="col-span-2 h-8"
                              />{" "}
                            </div>
                          </>
                        )}
                      </div>
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
              {isSheetDeleting ? <Loader2 /> : <Trash2 />} Supprimer{" "}
            </Button>
          )}
          {/* Bouton Annuler AVEC asChild */}
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={isSheetSaving || isSheetDeleting}
            >
              Annuler
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="quest-def-form"
            disabled={isSheetSaving || isSheetDeleting}
          >
            {" "}
            {isSheetSaving && <Loader2 />} Enregistrer{" "}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
