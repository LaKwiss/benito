// app/admin/components/AdminSidebar.jsx
"use client";

import { Button } from "@/components/ui/button";
// Change l'icône pour les définitions de quêtes (ex: FileText)
import { ListTodo, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_AUTH_KEY = "isAdminLoggedIn_benito";

// Modifie l'id et le label ici
const navItems = [
  { id: "todos", label: "Todo List", icon: ListTodo },
  { id: "questDefinitions", label: "Définitions Quêtes", icon: FileText }, // <-- MODIFIÉ ICI
];

export default function AdminSidebar({
  activeSection,
  setActiveSection,
  onLogout,
}) {
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    if (onLogout) onLogout();
  };

  return (
    <div className="flex flex-col h-full w-64 border-r bg-card p-4">
      <h2 className="text-lg font-semibold mb-6 px-2">Admin Panel</h2>
      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveSection(item.id)} // Utilise item.id
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="mt-auto">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Déconnexion Admin
        </Button>
      </div>
    </div>
  );
}
