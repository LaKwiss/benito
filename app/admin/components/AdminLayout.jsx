// app/admin/components/AdminLayout.jsx
"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import TodoListManager from "./TodoListManager";
import ActionsSection from "./ActionsSection"; // <--- Importe le nouveau composant
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({ onLogout }) {
  // Met 'todos' ou 'actions' comme défaut
  const [activeSection, setActiveSection] = useState("todos");

  const renderContent = () => {
    switch (activeSection) {
      case "todos":
        return <TodoListManager />;
      case "actions": // <--- Utilise le nouvel ID 'actions'
        return <ActionsSection />; // <--- Affiche le composant de section
      default:
        return (
          <div>Section non trouvée. Sélectionnez une option dans le menu.</div>
        );
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection} // Passe la fonction pour changer de section
          onLogout={onLogout}
        />
        <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
