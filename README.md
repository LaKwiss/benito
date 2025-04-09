# Client API Shop Minecraft (Frontend Next.js)

Ce projet est l'interface utilisateur (frontend) développée en Next.js pour interagir avec une API backend de boutique pour un serveur Minecraft. Il permet aux utilisateurs de s'authentifier, consulter des offres, acheter des items et gérer leur session.

**Version Actuelle:** 1.0 (Basée sur shadcn/ui + ItemCard custom)

## Fonctionnalités Implémentées

- **Authentification Utilisateur:**
  - Connexion via Pseudo Minecraft + Code temporaire (obtenu en jeu via `/login`).
  - Gestion des tokens JWT (Access Token + Refresh Token).
  - Stockage des tokens dans le LocalStorage.
  - Rafraîchissement automatique de l'Access Token en cas d'expiration via le Refresh Token.
  - Déconnexion utilisateur (suppression des tokens et appel API `/logout`).
- **Consultation de la Boutique :**
  - Affichage des items en vente (AdminShop et Joueurs) dans une grille responsive.
  - Récupération dynamique des images/sprites des items via une API externe de métadonnées (basée sur `itemId`/`namespacedId`).
  - Différenciation visuelle des items AdminShop.
  - **Filtrage Client :** Sélection pour afficher "Tous", "AdminShop" ou "Joueurs".
  - **Tri Client :** Tri des items par Date, Prix ou Nom (Ascendant/Descendant).
  - **Recherche Client :** Filtrage des items par nom via une barre de recherche.
- **Achat d'Items :**
  - Bouton "Acheter" sur chaque item.
  - Appel API sécurisé (`POST /api/shop/purchase`) avec l'Access Token.
  - Gestion des réponses succès (`delivered`, `pending_delivery`) et erreurs (solde, etc.).
  - Affichage de messages de statut après tentative d'achat (avec bouton de fermeture).
- **Informations Utilisateur :**
  - Affichage du pseudo et du solde dans l'en-tête après connexion.
  - Mise à jour automatique du solde après un achat réussi.
  - Affichage de l'avatar Minecraft du joueur (via Minotar.net).

## Stack Technique

- **Framework:** Next.js 15+ (avec App Router)
- **Langage:** JavaScript
- **UI / Style:**
  - Tailwind CSS (Utility-first CSS)
  - shadcn/ui (Composants pré-faits : Button, Card, Input, Select, Alert, Avatar, etc.)
  - Style personnalisé pour `ItemCard` (inspiré de `image_375a39.png`).
  - CSS Modules (potentiellement pour `ItemCard` si style "shop3" appliqué).
- **Gestion d'état global:** React Context API (`AuthContext`)
- **Communication API:** `Workspace` natif encapsulé dans un client API (`utils/apiClient.js`) gérant l'authentification et le refresh token.
- **Linting/Formatting:** ESLint (via `eslint-config-next`), Prettier (recommandé).

## Structure du Projet

.
├── app/ # Next.js App Router
│ ├── (pages)/ # Dossiers pour les routes
│ │ ├── login/page.js # Page de connexion
│ │ └── shop/page.js # Page principale de la boutique
│ ├── layout.js # Layout racine (avec AuthProvider)
│ └── globals.css # Styles globaux, variables CSS shadcn, font setup
├── components/ # Composants React réutilisables
│ ├── ui/ # Composants shadcn/ui ajoutés via CLI
│ ├── ItemCard.js # Carte d'item (style custom)
│ ├── PurchaseStatusAlert.js # Alerte de statut d'achat (utilise shadcn Alert)
│ ├── ShopHeader.js # En-tête de la page Shop (utilise shadcn Avatar/Button)
│ └── FilterBar.js # (Supprimé, fonctionnalité intégrée ailleurs)
├── context/ # Contextes React pour état global
│ └── AuthContext.js # Gère l'authentification, l'utilisateur, les tokens
├── lib/ # Utilitaires (généré par shadcn)
│ └── utils.js # Fonctions utilitaires (ex: cn pour classnames)
├── utils/ # Utilitaires personnalisés
│ └── apiClient.js # Wrapper fetch pour appels API (gère auth + refresh)
├── public/ # Fichiers statiques
│ ├── images/ # Images (fallback item, UI textures...)
│ └── fonts/ # Polices personnalisées (si ajoutées)
├── .env.local # Variables d'environnement locales (NON commitées)
├── next.config.mjs # Configuration Next.js (ex: domaines images externes)
├── tailwind.config.js # Configuration Tailwind CSS (thème shadcn)
├── components.json # Configuration shadcn/ui
├── package.json # Dépendances et scripts
└── README.md # Ce fichier

## Installation et Lancement

1.  **Prérequis :** Node.js (version recommandée par Next.js), npm/yarn/pnpm. Une **API backend** fonctionnelle respectant les endpoints décrits dans le cahier des charges initial est nécessaire.
2.  **Cloner le projet** (si applicable).
3.  **Installer les dépendances :**
    ```bash
    npm install
    # ou yarn install / pnpm install
    ```
4.  **Configurer l'environnement :**
    - Créer un fichier `.env.local` à la racine.
    - Ajouter la variable d'environnement pour l'URL de base de votre API backend :
      ```
      NEXT_PUBLIC_API_BASE_URL=http://VOTRE_API_URL:PORT
      ```
5.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    # ou yarn dev / pnpm dev
    ```
6.  Ouvrir [`http://localhost:3000`](http://localhost:3000) (ou le port indiqué) dans votre navigateur.

## Choix de Conception Clés

- **shadcn/ui + Custom Mix :** Utilisation de shadcn/ui pour une base rapide, moderne et thémable pour la plupart des éléments d'interface, tout en gardant la flexibilité de créer un style très personnalisé pour les composants clés comme `ItemCard`.
- **`AuthContext` :** Centralise la logique d'authentification et l'état utilisateur, le rendant accessible globalement sans "prop drilling".
- **`apiClient.js` :** Encapsule la complexité des appels API authentifiés et du refresh token, simplifiant le code dans les pages/composants.
- **Client-Side Metadata Fetch :** Récupération des métadonnées (images) depuis une API externe côté client pour simplifier le backend initial. Point d'attention pour la performance et le caching.
- **Client-Side Filtering/Sorting :** Implémentation initiale côté client pour la rapidité de développement. Peut nécessiter une refonte côté serveur pour de gros volumes de données.
- **LocalStorage pour Tokens :** Choix pragmatique pour un client SPA, mais avec des implications de sécurité notées (surtout pour le refresh token).

## Améliorations Futures Possibles

- Passer le tri/filtrage/recherche côté serveur.
- Implémenter la pagination.
- Créer une vue détaillée pour les items.
- Implémenter la fonctionnalité "Vendre".
- Mettre en cache les métadonnées des items.
- Sécuriser le refresh token (HttpOnly cookies).
- Appliquer le style "shop3" (assets custom) sur `ItemCard`.
- Peaufiner le responsive design.

---
