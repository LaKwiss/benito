// components/PurchaseStatusAlert.js
"use client";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Importe Alert de shadcn
import { X } from "lucide-react"; // Icone pour la croix (ou utilise '✕')

export default function PurchaseStatusAlert({ status, onDismiss }) {
  if (!status || !status.message) {
    return null;
  }

  // Détermine la variante de l'alerte shadcn
  let variant = "default"; // Bleu par défaut pour 'info'
  if (status.type === "success") {
    variant = "default"; // Le vert n'existe pas par défaut, on peut le styler ou utiliser default
    // Ajoutons une classe pour le vert si besoin: className="bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-100"
  } else if (status.type === "error") {
    variant = "destructive"; // Rouge pour 'error'
  }

  const handleDismissClick = (e) => {
    e.stopPropagation(); // Empêche les clics de se propager si jamais
    if (typeof onDismiss === "function") {
      onDismiss();
    } else {
      console.error(
        "PurchaseStatusAlert: 'onDismiss' prop is missing or not a function!"
      );
    }
  };

  return (
    // Utilise Alert de shadcn et ajoute 'relative' pour positionner la croix
    <Alert variant={variant} className="mb-6 relative pr-8">
      {/* Tu peux ajouter une icone AlertCircle, CheckCircle etc. ici si tu veux */}
      <AlertDescription>{status.message}</AlertDescription>
      {/* Bouton croix ajouté manuellement */}
      <button
        onClick={handleDismissClick}
        aria-label="Fermer l'alerte"
        className="absolute top-1 right-1 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" /> {/* Utilise l'icone Lucide */}
      </button>
    </Alert>
  );
}
