// app/admin/components/AdminLayout.jsx
"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import TodoListManager from "./TodoListManager";
// Importe le nouveau composant qu'on va créer
import QuestDefinitionManager from "./QuestDefinitionManager";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({ onLogout }) {
  // Utilise les nouveaux IDs, ex: 'todos' par défaut
  const [activeSection, setActiveSection] = useState("todos");

  const renderContent = () => {
    switch (activeSection) {
      case "todos":
        return <TodoListManager />;
      case "questDefinitions": // <-- Nouvel ID
        return <QuestDefinitionManager />; // <-- Nouveau composant
      default:
        return <div>Sélectionnez une option dans le menu.</div>;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
        />
        <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
