// components/FilterBar.js
"use client";
import { Button } from "@/components/ui/button"; // Importe le bouton shadcn

export default function FilterBar({ currentFilterMode, onFilterChange }) {
  const filterOptions = [
    { mode: "all", label: "Tous" },
    { mode: "admin", label: "AdminShop" },
    { mode: "players", label: "Joueurs" },
  ];

  return (
    // Conteneur simple
    <div className="mb-6 flex justify-center items-center gap-2 sm:gap-3 p-2">
      {filterOptions.map(({ mode, label }) => {
        const isActive = currentFilterMode === mode;
        return (
          <Button
            key={mode}
            variant={isActive ? "default" : "outline"} // Variante pleine si actif, contour sinon
            size="sm" // Taille petite/moyenne
            onClick={() => onFilterChange(mode)}
            // Ajoute une couleur spécifique si actif (optionnel via classe)
            className={
              isActive
                ? "ring-2 ring-primary ring-offset-background ring-offset-2"
                : ""
            }
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
