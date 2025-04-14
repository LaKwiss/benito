// app/admin/components/QuestCreator.jsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Gardé pour les erreurs API générales
import {
  Trash2,
  PlusCircle,
  Loader2,
  AlertCircle,
  Package,
  Coins,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Schéma de validation avec Zod (inchangé)
const rewardSchema = z
  .object({
    /* ... */
  })
  .refine((data) => {
    /* ... */
  });
const questDefinitionSchema = z.object({
  questId: z
    .string()
    .min(3, "L'ID textuel doit faire au moins 3 caractères.")
    .regex(
      /^[a-z0-9_]+$/,
      "Utilisez uniquement minuscules, chiffres et underscores pour l'ID."
    ),
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().min(1, "La description est requise."),
  type: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Le type est requis.",
  }),
  target: z.coerce
    .number({ invalid_type_error: "Doit être un nombre." })
    .int()
    .positive("L'objectif doit être un nombre positif."),
  isActive: z.boolean().default(true),
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function QuestCreator() {
  const [rewards, setRewards] = useState([]);
  const [currentReward, setCurrentReward] = useState({
    type: "money",
    amount: "",
    itemId: "",
    quantity: 1,
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null); // Pour erreurs API non gérées par toast

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

  const handleAddReward = () => {
    const { type, amount, itemId, quantity } = currentReward;
    let isValid = false;
    let rewardToAdd = { type };

    console.log("Ajout de récompense:");

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
      setCurrentReward({ type: "money", amount: "", itemId: "", quantity: 1 });
      setPopoverOpen(false);
    } else {
      console.warn(
        "Tentative d'ajout d'une récompense invalide",
        currentReward
      );
      // Utilise toast.error de sonner
      toast.error("Récompense invalide", {
        description:
          "Veuillez remplir correctement les champs pour le type sélectionné.",
      });
    }
  };

  const removeReward = (index) => {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  // Logique de soumission du formulaire principal
  async function onSubmit(values) {
    setIsSubmitting(true);
    setApiError(null);
    if (!API_BASE_URL) {
      setApiError("L'URL de l'API n'est pas configurée.");
      setIsSubmitting(false);
      return;
    }
    if (rewards.length === 0) {
      // Valider qu'il y a au moins une récompense ? Ou l'API le gère ?
      // Pour l'instant on permet 0 récompense basé sur le schéma backend
      // toast.warning("Aucune récompense ajoutée", { description: "Veuillez ajouter au moins une récompense."});
      // setIsSubmitting(false);
      // return;
    }

    const questData = { ...values, rewards: rewards };
    console.log("Données envoyées:", JSON.stringify(questData, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/quests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        let errorMsg = `Erreur ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          /* Ignorer */
        }
        throw new Error(errorMsg);
      }

      // Utilise toast.success de sonner
      toast("Succès !", {
        description: `La définition de quête "${values.title}" a été créée.`,
      });
      form.reset();
      setRewards([]);
    } catch (error) {
      console.error("Erreur création quête:", error);
      const errorDesc =
        error.message || "Impossible de créer la définition de quête.";
      setApiError(errorDesc); // Affiche aussi dans l'Alert
      // Utilise toast.error de sonner
      toast.error("Erreur Création Quête", { description: errorDesc });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Rendu ---
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-semibold">Créer une Définition de Quête</h2>

      {/* Affichage erreur API générale */}
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur API</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Champs de base */}
          <FormField
            control={form.control}
            name="questId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Textuel Unique (*)</FormLabel>
                <FormControl>
                  <Input placeholder="ex: daily_kill_zombies" {...field} />
                </FormControl>
                <FormDescription>
                  Identifiant unique (minuscules, chiffres, _). Non modifiable.
                </FormDescription>
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
                  <Input placeholder="Titre affiché aux joueurs" {...field} />
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
                  <Textarea placeholder="Détails des objectifs..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type (*)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Quantité à atteindre.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Activée</FormLabel>
                  <FormDescription>
                    La quête sera-t-elle proposée aux joueurs ?
                  </FormDescription>
                </div>
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
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Récompenses</h3>
            {rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune récompense ajoutée.
              </p>
            ) : (
              <ul className="space-y-2">
                {rewards.map((reward, index) => (
                  <li
                    key={`reward-${index}-${reward.type}`}
                    className="flex items-center justify-between text-sm bg-secondary p-2 rounded"
                  >
                    <span className="flex items-center gap-2">
                      {reward.type === "money" && (
                        <>
                          <Coins className="h-4 w-4" /> {reward.amount}$
                        </>
                      )}
                      {reward.type === "xp" && (
                        <>
                          <Star className="h-4 w-4" /> {reward.amount} XP
                        </>
                      )}
                      {reward.type === "item" && (
                        <>
                          <Package className="h-4 w-4" /> {reward.quantity}x{" "}
                          {reward.itemId}
                        </>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReward(index)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Bouton Ajouter Récompense (Popover) */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une récompense
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    {" "}
                    <h4 className="font-medium leading-none">
                      Nouvelle Récompense
                    </h4>{" "}
                    <p className="text-sm text-muted-foreground">
                      Configurez la récompense.
                    </p>{" "}
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="reward-type">Type</Label>
                      <Select
                        value={currentReward.type}
                        onValueChange={(value) =>
                          setCurrentReward((prev) => ({
                            ...prev,
                            type: value,
                            amount: "",
                            itemId: "",
                            quantity: 1,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="reward-type"
                          className="col-span-2 h-8"
                        >
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="money">Argent</SelectItem>
                          <SelectItem value="item">Item</SelectItem>
                          <SelectItem value="xp">XP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(currentReward.type === "money" ||
                      currentReward.type === "xp") && (
                      <div className="grid grid-cols-3 items-center gap-4">
                        {" "}
                        <Label htmlFor="reward-amount">Montant</Label>{" "}
                        <Input
                          id="reward-amount"
                          type="number"
                          min="1"
                          placeholder="Ex: 100"
                          value={currentReward.amount}
                          onChange={(e) =>
                            setCurrentReward((prev) => ({
                              ...prev,
                              amount: e.target.value,
                            }))
                          }
                          className="col-span-2 h-8"
                        />{" "}
                      </div>
                    )}
                    {currentReward.type === "item" && (
                      <>
                        <div className="grid grid-cols-3 items-center gap-4">
                          {" "}
                          <Label htmlFor="reward-itemid">Item ID</Label>{" "}
                          <Input
                            id="reward-itemid"
                            type="text"
                            placeholder="minecraft:diamond"
                            value={currentReward.itemId}
                            onChange={(e) =>
                              setCurrentReward((prev) => ({
                                ...prev,
                                itemId: e.target.value,
                              }))
                            }
                            className="col-span-2 h-8"
                          />{" "}
                        </div>
                        <p className="text-xs text-muted-foreground text-right col-span-3 -mt-1">
                          ID complet (ex: minecraft:stone).{" "}
                          <span className="font-bold">
                            // TODO: Autocomplete
                          </span>
                        </p>
                        <div className="grid grid-cols-3 items-center gap-4">
                          {" "}
                          <Label htmlFor="reward-quantity">Quantité</Label>{" "}
                          <Input
                            id="reward-quantity"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={currentReward.quantity}
                            onChange={(e) =>
                              setCurrentReward((prev) => ({
                                ...prev,
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
                    Ajouter à la liste
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>{" "}
          {/* Fin Section Récompenses */}
          {/* Bouton de soumission */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Création..." : "Créer la Définition"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
