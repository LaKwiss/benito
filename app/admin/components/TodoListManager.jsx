// app/admin/components/TodoListManager.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// L'URL de base est maintenant gérée par apiClient
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Accepte apiClient comme prop
export default function TodoListManager({ apiClient }) {
  // --- États Généraux ---
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- États Formulaire Ajout ---
  const [newTodoText, setNewTodoText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- États pour la Sheet ---
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);
  const [isSheetSaving, setIsSheetSaving] = useState(false);
  const [isSheetDeleting, setIsSheetDeleting] = useState(false);

  // --- Fonctions API utilisant apiClient ---

  // Récupérer les todos
  const fetchTodos = useCallback(async () => {
    // Vérifier si apiClient est passé (sécurité)
    if (!apiClient) {
      setError("Client API non initialisé.");
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      // Utilise apiClient.get qui gère l'auth et le refresh
      const data = await apiClient.get("/admin/todos");
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetchTodos via apiClient:", err);
      // apiClient lève des erreurs déjà formatées (ex: 'Session expirée')
      setError(err.message);
      // Pas besoin de toast ici, l'erreur est affichée dans l'Alert
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]); // Ajouter apiClient aux dépendances

  useEffect(() => {
    setIsLoading(true);
    fetchTodos();
  }, [fetchTodos]); // fetchTodos a maintenant apiClient comme dépendance

  // Ajouter un todo
  const handleAddTodo = async (event) => {
    event.preventDefault();
    if (!newTodoText.trim() || !apiClient) return;

    setIsSubmitting(true);
    setError(null);
    const textToAdd = newTodoText.trim(); // Sauvegarder avant de vider

    try {
      // Utilise apiClient.post
      await apiClient.post("/admin/todos", { text: textToAdd });
      setNewTodoText(""); // Vider seulement après succès
      toast.success("Tâche ajoutée !");
      await fetchTodos(); // Recharger la liste
    } catch (err) {
      console.error("Erreur handleAddTodo via apiClient:", err);
      setError(err.message);
      toast.error("Erreur ajout", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Basculer état complété (action rapide depuis checkbox)
  const handleToggleComplete = async (todoId, currentStatus) => {
    if (!apiClient) return;
    const originalTodos = [...todos];
    // Optimistic UI: Mettre à jour l'UI immédiatement
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t._id === todoId ? { ...t, isCompleted: !currentStatus } : t
      )
    );
    try {
      // Utilise apiClient.patch
      await apiClient.patch(`/admin/todos/${todoId}`, {
        isCompleted: !currentStatus,
      });
      // Si succès, l'UI est déjà à jour. On pourrait re-fetch pour synchro absolue mais pas essentiel ici.
    } catch (err) {
      console.error("Erreur handleToggleComplete via apiClient:", err);
      toast.error("Erreur MàJ Statut", { description: err.message });
      // Rollback UI en cas d'erreur
      setTodos(originalTodos);
    }
  };

  // --- Fonctions pour la Sheet ---
  const handleEditClick = (todo) => {
    setSelectedTodo(todo);
    setEditText(todo.text);
    setEditCompleted(todo.isCompleted);
    setIsSheetOpen(true);
  };

  // Sauvegarder depuis la Sheet
  const handleUpdateTodo = async () => {
    if (!selectedTodo || !editText.trim() || !apiClient) {
      toast.error("Le texte ne peut pas être vide ou client API manquant.");
      return;
    }
    setIsSheetSaving(true);
    setError(null); // Reset error specific to this action
    const updatedData = { text: editText.trim(), isCompleted: editCompleted };
    const todoId = selectedTodo._id;

    // Utiliser toast.promise avec l'appel apiClient
    toast.promise(
      apiClient.patch(`/admin/todos/${todoId}`, updatedData), // Appel API direct ici
      {
        loading: "Mise à jour...",
        success: () => {
          setIsSheetOpen(false); // Fermer la sheet
          fetchTodos(); // Recharger la liste
          return "Tâche mise à jour avec succès !";
        },
        error: (err) => {
          // apiClient propage déjà une erreur formatée
          console.error(
            "Erreur handleUpdateTodo via apiClient (dans toast):",
            err
          );
          return err.message || "Impossible de mettre à jour.";
        },
        finally: () => setIsSheetSaving(false),
      }
    );
  };

  // Supprimer depuis la Sheet
  const handleDeleteFromSheet = async () => {
    if (!selectedTodo || !apiClient) return;
    // Utilisation de window.confirm est simple mais basique pour l'UX
    if (!window.confirm(`Supprimer la tâche "${selectedTodo.text}" ?`)) return;

    setIsSheetDeleting(true);
    setError(null);
    const todoId = selectedTodo._id;

    // Utiliser toast.promise avec l'appel apiClient
    toast.promise(
      apiClient.delete(`/admin/todos/${todoId}`), // Appel API direct ici
      {
        loading: "Suppression...",
        success: () => {
          setIsSheetOpen(false); // Fermer la sheet
          fetchTodos(); // Recharger la liste
          return "Tâche supprimée avec succès !";
        },
        error: (err) => {
          // apiClient propage déjà une erreur formatée
          console.error(
            "Erreur handleDeleteFromSheet via apiClient (dans toast):",
            err
          );
          return err.message || "Impossible de supprimer.";
        },
        finally: () => setIsSheetDeleting(false),
      }
    );
  };

  // --- Rendu (Identique à avant, sauf la vérification apiClient au début) ---
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Todo List Administrateur</h2>

        {/* Afficher une erreur si apiClient n'est pas fourni */}
        {!apiClient && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de Configuration</AlertTitle>
            <AlertDescription>
              Le client API n'a pas été correctement initialisé.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAddTodo} className="flex gap-2">
          <Input
            type="text"
            placeholder="Nouvelle tâche..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            disabled={isSubmitting || !apiClient} // Désactiver si pas de client API
            className="flex-grow"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newTodoText.trim() || !apiClient}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ajouter"
            )}
          </Button>
        </form>

        {/* Affichage de l'erreur générale */}
        {error &&
          !isLoading && ( // Afficher seulement si pas en chargement
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur API</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        {/* Logique d'affichage */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : todos.length === 0 && !error ? (
          <p className="text-center text-muted-foreground pt-5">
            Aucune tâche pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo._id}
                className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm min-h-[58px]"
              >
                <Checkbox
                  id={`todo-check-${todo._id}`}
                  checked={todo.isCompleted}
                  // Désactiver si pas de client API
                  disabled={!apiClient}
                  onCheckedChange={() =>
                    handleToggleComplete(todo._id, todo.isCompleted)
                  }
                  aria-label={todo.isCompleted ? "Décocher" : "Cocher"}
                  className="shrink-0"
                />
                <SheetTrigger asChild>
                  <button
                    onClick={() => handleEditClick(todo)}
                    disabled={!apiClient} // Désactiver si pas de client API
                    className={cn(
                      "flex-grow text-left cursor-pointer hover:text-primary transition-colors",
                      todo.isCompleted && "line-through text-muted-foreground",
                      !apiClient && "cursor-not-allowed opacity-50" // Style si désactivé
                    )}
                    aria-label={`Modifier la tâche ${todo.text}`}
                  >
                    {todo.text}
                  </button>
                </SheetTrigger>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sheet Content (Modal/Drawer pour édition) */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Modifier la Tâche</SheetTitle>
          <SheetDescription>
            Modifiez le texte ou le statut de la tâche.
          </SheetDescription>
        </SheetHeader>
        {selectedTodo && (
          <div className="grid gap-4 py-6 p-4">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="edit-todo-text">Texte de la tâche</Label>
              <Input
                id="edit-todo-text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                disabled={isSheetSaving || isSheetDeleting}
                className="col-span-3 "
              />
            </div>
            <div className="flex space-x-2 pt-2 right-4">
              <Checkbox
                id="edit-todo-completed"
                checked={editCompleted}
                onCheckedChange={(checked) =>
                  setEditCompleted(Boolean(checked))
                }
                disabled={isSheetSaving || isSheetDeleting}
              />
              <Label htmlFor="edit-todo-completed">Complétée</Label>
            </div>
          </div>
        )}
        <SheetFooter className="mt-auto pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDeleteFromSheet}
            disabled={isSheetSaving || isSheetDeleting || !selectedTodo}
          >
            {isSheetDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Supprimer
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={isSheetSaving || isSheetDeleting}
            >
              Annuler
            </Button>
          </SheetClose>
          <Button
            onClick={handleUpdateTodo}
            disabled={
              isSheetSaving ||
              isSheetDeleting ||
              !selectedTodo ||
              !editText.trim()
            }
          >
            {isSheetSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
