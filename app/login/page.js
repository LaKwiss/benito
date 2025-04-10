// app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // Adapte chemin

// Importe les composants shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"; // InputOTP importé
// import { Terminal } from 'lucide-react'; // Optionnel

// Définit les clés ici pour éviter les répétitions
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Redirige si déjà authentifié
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // --- NOUVEAU useEffect pour afficher les tokens au chargement ---
  useEffect(() => {
    // Ce code s'exécute seulement côté client, après le montage
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    console.log("--- Tokens au chargement de la page Login ---");
    console.log("Access Token:", storedAccessToken || "(Non trouvé)");
    console.log("Refresh Token:", storedRefreshToken || "(Non trouvé)");
    console.log("------------------------------------------");

    // Le tableau vide [] assure que cet effet ne s'exécute qu'une seule fois
  }, []);
  // --- Fin du nouveau useEffect ---

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      /* ... */
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Rappel: Vérifie si c'est 'code' ou 'tempCode' pour ton API
        body: JSON.stringify({ username: username, code: code }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || `Erreur ${response.status}`);
      if (data.accessToken && data.refreshToken) await login(data);
      else throw new Error("Tokens non reçus.");
    } catch (err) {
      /* ... */
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || isAuthenticated) {
    /* ... */
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez votre pseudo et le code obtenu avec /login en jeu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ Pseudo */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Pseudo Minecraft</Label>
              <Input
                id="username"
                type="text"
                placeholder="VotrePseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Champ Code avec InputOTP */}
            <div className="space-y-1.5">
              <Label htmlFor="code-otp">Code (6 chiffres)</Label>{" "}
              {/* Change id si besoin */}
              <div className="flex justify-center">
                <InputOTP
                  id="code-otp"
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se Connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
