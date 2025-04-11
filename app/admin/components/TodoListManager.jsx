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
import { toast } from "sonner"; // Utilisation de Sonner
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TodoListManager() {
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

  // --- Fonctions API ---

  // Récupérer les todos
  const fetchTodos = useCallback(async () => {
    setError(null);
    if (!API_BASE_URL) {
      setError("URL API non configurée.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/todos`);
      if (!response.ok)
        throw new Error(
          `Erreur ${response.status} (${
            response.statusText || "inconnue"
          }) lors de la récupération.`
        );
      const data = await response.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetchTodos:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchTodos();
  }, [fetchTodos]);

  // Ajouter un todo
  const handleAddTodo = async (event) => {
    event.preventDefault();
    if (!newTodoText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodoText.trim() }),
      });
      if (!response.ok) {
        let errorMsg = `Erreur ${response.status}`;
        try {
          const d = await response.json();
          errorMsg = d.message || JSON.stringify(d);
        } catch (e) {}
        throw new Error(errorMsg);
      }
      setNewTodoText("");
      toast.success("Tâche ajoutée !");
      await fetchTodos();
    } catch (err) {
      console.error("Erreur handleAddTodo:", err);
      setError(err.message);
      toast.error("Erreur ajout", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Basculer état complété (action rapide depuis checkbox)
  const handleToggleComplete = async (todoId, currentStatus) => {
    const originalTodos = [...todos];
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t._id === todoId ? { ...t, isCompleted: !currentStatus } : t
      )
    ); // Optimistic UI
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/todos/${todoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: !currentStatus }),
        }
      );
      if (!response.ok) throw new Error("Erreur serveur");
    } catch (err) {
      toast.error("Erreur MàJ", {
        description: "Impossible de changer le statut.",
      });
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
    if (!selectedTodo || !editText.trim()) {
      toast.error("Le texte ne peut pas être vide.");
      return;
    }
    setIsSheetSaving(true);
    setError(null);
    const updatedData = { text: editText.trim(), isCompleted: editCompleted };
    const todoId = selectedTodo._id;

    toast.promise(
      fetch(`${API_BASE_URL}/api/admin/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }).then(async (response) => {
        if (!response.ok) {
          let errorMsg = `Erreur ${response.status}`;
          try {
            const d = await response.json();
            errorMsg = d.message || JSON.stringify(d);
          } catch (e) {}
          throw new Error(errorMsg);
        }
        return response.json();
      }),
      {
        loading: "Mise à jour...",
        success: () => {
          setIsSheetOpen(false);
          fetchTodos();
          return "Tâche mise à jour avec succès !";
        },
        error: (err) => {
          console.error("Erreur handleUpdateTodo:", err);
          return err.message || "Impossible de mettre à jour.";
        },
        finally: () => setIsSheetSaving(false),
      }
    );
  };

  // Supprimer depuis la Sheet
  const handleDeleteFromSheet = async () => {
    if (!selectedTodo) return;
    if (!confirm(`Supprimer la tâche "${selectedTodo.text}" ?`)) return;

    setIsSheetDeleting(true);
    setError(null);
    const todoId = selectedTodo._id;

    toast.promise(
      fetch(`${API_BASE_URL}/api/admin/todos/${todoId}`, {
        method: "DELETE",
      }).then(async (response) => {
        if (!response.ok) {
          let errorMsg = `Erreur ${response.status}`;
          try {
            const d = await response.json();
            errorMsg = d.message || JSON.stringify(d);
          } catch (e) {}
          throw new Error(errorMsg);
        }
      }),
      {
        loading: "Suppression...",
        success: () => {
          setIsSheetOpen(false);
          fetchTodos();
          return "Tâche supprimée avec succès !";
        },
        error: (err) => {
          console.error("Erreur handleDeleteFromSheet:", err);
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
        <h2 className="text-2xl font-semibold">Todo List Administrateur</h2>
        <form onSubmit={handleAddTodo} className="flex gap-2">
          <Input
            type="text"
            placeholder="Nouvelle tâche..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            disabled={isSubmitting}
            className="flex-grow"
          />
          <Button type="submit" disabled={isSubmitting || !newTodoText.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ajouter"
            )}
          </Button>
        </form>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur API</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
                  onCheckedChange={() =>
                    handleToggleComplete(todo._id, todo.isCompleted)
                  }
                  aria-label={todo.isCompleted ? "Décocher" : "Cocher"}
                  className="shrink-0"
                />
                <SheetTrigger asChild>
                  <button
                    onClick={() => handleEditClick(todo)}
                    className={cn(
                      "flex-grow text-left cursor-pointer hover:text-primary transition-colors",
                      todo.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
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
