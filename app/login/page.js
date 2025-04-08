// app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// Importe les composants shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Gardé pour le username
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Importe les composants InputOTP, y compris le séparateur
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator, // Ajout de l'import
} from "@/components/ui/input-otp";
import { Terminal } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push("/shop");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      setError("Config API manquante.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, code: code }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || `Erreur ${response.status}`);
      if (data.accessToken && data.refreshToken) await login(data);
      else throw new Error("Tokens non reçus.");
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Chargement...
      </div>
    );
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
            {/* Champ Pseudo (inchangé) */}
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

            {/* Champ Code avec séparateur */}
            <div className="space-y-1.5">
              <Label htmlFor="code">Code (6 chiffres)</Label>
              <div className="flex justify-center">
                <InputOTP
                  id="code"
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
                  {/* Ajout du séparateur ici */}
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
