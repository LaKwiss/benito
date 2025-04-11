// app/admin/page.jsx
"use client";

import { useState, useEffect } from "react";
import AdminPasswordForm from "./components/AdminPasswordForm";
import AdminLayout from "./components/AdminLayout";

const ADMIN_AUTH_KEY = "isAdminLoggedIn_benito"; // Doit être la même clé qu'utilisée dans la sidebar

export default function AdminPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Pour vérifier le localStorage au début

  // Vérifier le localStorage au montage initial (côté client seulement)
  useEffect(() => {
    const loggedIn = localStorage.getItem(ADMIN_AUTH_KEY) === "true";
    setIsAdminAuthenticated(loggedIn);
    setIsLoading(false); // Fin de la vérification initiale
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem(ADMIN_AUTH_KEY, "true");
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    // localStorage est déjà vidé par la sidebar, on met juste à jour l'état
    setIsAdminAuthenticated(false);
    // Optionnel : Rediriger quelque part ou simplement afficher le form de login
    console.log("Admin logged out");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Chargement Admin...
      </div>
    ); // Loader pendant la vérif localStorage
  }

  return (
    <>
      {isAdminAuthenticated ? (
        <AdminLayout onLogout={handleLogout} /> // Affiche le layout admin si connecté
      ) : (
        <AdminPasswordForm onLoginSuccess={handleLoginSuccess} /> // Affiche le form si non connecté
      )}
    </>
  );
}
