// app/(main)/layout.js
import AppHeader from "./_components/AppHeader"; // On va créer ce composant juste après
import AuthGuard from "./_components/AuthGuard"; // Optionnel mais recommandé pour protéger les routes

export default function MainLayout({ children }) {
  return (
    // Enveloppe avec AuthGuard pour vérifier la connexion
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-6">
          {/* Le contenu de chaque page (page.js) sera injecté ici */}
          {children}
        </main>
        {/* Tu pourrais ajouter un Footer commun ici si besoin */}
      </div>
    </AuthGuard>
  );
}
