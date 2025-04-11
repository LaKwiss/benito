// app/admin/components/AdminPasswordForm.jsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// !!! ATTENTION : Mot de passe en dur, à remplacer par une vraie auth backend !!!
const ADMIN_PASSWORD = "benito_admin_password"; // TODO: Supprimer ceci et utiliser l'auth backend

export default function AdminPasswordForm({ onLoginSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    // --- Logique de vérification Frontend (Temporaire) ---
    // Simule un petit délai
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        console.log("Admin password correct.");
        onLoginSuccess(); // Appelle le callback du parent
      } else {
        setError("Mot de passe incorrect.");
      }
      setIsLoading(false);
    }, 300); // Simule délai réseau
    // --- Fin Logique Temporaire ---

    // TODO: Remplacer la logique ci-dessus par un appel à POST /api/admin/login
    // const loginAdmin = async () => {
    //   try {
    //       const response = await fetch('/api/admin/login', { // Remplace par API_BASE_URL si besoin
    //           method: 'POST',
    //           headers: { 'Content-Type': 'application/json' },
    //           body: JSON.stringify({ password })
    //       });
    //       if (!response.ok) throw new Error('Mot de passe invalide ou erreur serveur.');
    //       // Gérer la réponse succès (peut-être un token admin ?)
    //       onLoginSuccess();
    //   } catch (err) {
    //       setError(err.message || 'Erreur de connexion admin.');
    //   } finally {
    //       setIsLoading(false);
    //   }
    // }
    // loginAdmin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Accès Administrateur</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              id="admin-password"
              type="password"
              placeholder="Entrez le mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Vérification..." : "Valider"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
