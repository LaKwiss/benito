// app/admin/components/AdminLayout.jsx
"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import TodoListManager from "./TodoListManager";
// Importe le composant pour gérer les définitions de quêtes
import QuestDefinitionManager from "./QuestDefinitionManager";
// Retire l'import de ActionsSection car il n'est plus utilisé
// import ActionsSection from "./ActionsSection";
import { Toaster } from "@/components/ui/sonner"; // Garde le Toaster Sonner

export default function AdminLayout({ onLogout }) {
  // Les sections possibles sont maintenant 'todos' et 'questDefinitions'
  const [activeSection, setActiveSection] = useState("todos"); // 'todos' par défaut

  const renderContent = () => {
    console.log("Layout affiche section:", activeSection); // Pour débugger si besoin
    switch (activeSection) {
      case "todos":
        return <TodoListManager />;
      case "questDefinitions": // Utilise l'ID défini dans AdminSidebar
        return <QuestDefinitionManager />; // Affiche directement le gestionnaire
      // Retire le cas 'actions'
      // case 'actions':
      //   return <ActionsSection />;
      default:
        // Message d'erreur si l'état ne correspond à rien
        return (
          <div>
            Section invalide ({activeSection}). Sélectionnez une option valide.
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection} // Passe la fonction pour changer
          onLogout={onLogout}
        />
        <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
