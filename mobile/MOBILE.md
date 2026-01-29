# Roadworks Tracker - Application Mobile

Application mobile de signalement et suivi des travaux routiers développée avec Ionic, Vue 3 et Capacitor.

## Table des matières

- [Technologies](#technologies)
- [Installation](#installation)
- [Lancement](#lancement)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Configuration Firebase](#configuration-firebase)
- [Collections Firestore](#collections-firestore)

---

## Technologies

| Technologie | Version | Description |
|-------------|---------|-------------|
| Vue.js | 3.3+ | Framework JavaScript |
| Ionic | 8.0+ | Framework UI mobile |
| Capacitor | 8.0+ | Runtime natif |
| Pinia | 3.0+ | State management |
| Leaflet | 1.9+ | Cartes interactives |
| Firebase | 12.8+ | Backend (Auth, Firestore) |
| TypeScript | 5.9+ | Typage statique |

---

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd roadworks-tracker/mobile

# Installer les dépendances
npm install
```

---

## Lancement

### Mode développement (Web)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de production

```bash
npm run build
```

### Android

```bash
# Synchroniser avec le projet natif
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android

# Ou lancer directement
npx cap run android
```

### Tests

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Linting
npm run lint
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION                          │
├─────────────────────────────────────────────────────────┤
│  Views (Pages)                                          │
│  ├── MapPage.vue        (Carte + signalements)          │
│  ├── SignInPage.vue     (Connexion)                     │
│  └── AdminBlockedAccountsPage.vue (Admin)               │
├─────────────────────────────────────────────────────────┤
│  State Management (Pinia)                               │
│  ├── auth/session.ts         (Session utilisateur)      │
│  ├── geo-location/           (Localisation)             │
│  └── firebase/               (Config Firebase)          │
├─────────────────────────────────────────────────────────┤
│  Services                                               │
│  ├── firebase/auth-attempts.ts   (Blocage comptes)      │
│  ├── firebase/roadworks-reports.ts (Signalements)       │
│  └── firebase/routeworks-tracker.ts (Init Firebase)     │
├─────────────────────────────────────────────────────────┤
│                     FIREBASE                            │
│  ├── Authentication                                     │
│  ├── Firestore                                          │
│  └── Remote Config                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Fonctionnalités

### 1. Authentification

**Page:** `/auth/signIn`

- Connexion par email/mot de passe (Firebase Auth)
- Protection contre les attaques par force brute :
  - 3 tentatives maximum avant blocage
  - Compte bloqué définitivement jusqu'à intervention admin
- Gestion des erreurs réseau
- Session avec expiration configurable (Remote Config)

### 2. Carte Interactive

**Page:** `/tabs/map`

- Carte Leaflet centrée sur Antananarivo
- Localisation GPS de l'utilisateur (bouton en haut à gauche)
- Affichage des signalements avec marqueurs emoji
- Filtre "Mes signalements uniquement" (bouton en haut à droite)
- Clic sur la carte pour créer un nouveau signalement
- Clic sur un marqueur pour voir les détails

### 3. Signalements

**Types de signalements disponibles:**

| Type | Emoji | Description |
|------|-------|-------------|
| `pothole` | 🕳️ | Nid-de-poule |
| `blocked_road` | 🚧 | Route barrée |
| `accident` | 🚨 | Accident |
| `construction` | 🏗️ | Travaux |
| `flooding` | 💧 | Inondation |
| `debris` | 🪨 | Débris |
| `poor_surface` | ⚠️ | Mauvaise surface |
| `other` | ❓ | Autre |

**Données d'un signalement:**

```typescript
interface RoadworksReportData {
  lat: number;              // Latitude
  lng: number;              // Longitude
  status: string;           // Type (voir tableau ci-dessus)
  description?: string;     // Description optionnelle
  reportStatus?: string;    // 'new' | 'in_progress' | 'completed'
  surface?: number;         // Surface en m²
  budget?: number;          // Budget estimé
  company?: string;         // Entreprise concernée
  userId: string;           // ID utilisateur Firebase
  createdAt: Timestamp;     // Date création
  updatedAt: Timestamp;     // Date modification
}
```

### 4. Administration

**Page:** `/admin/blocked-accounts`

- Liste des comptes bloqués
- Statistiques (nombre de comptes bloqués)
- Recherche par email
- Actions:
  - **Débloquer:** Remet le compteur à 0 et déverrouille
  - **Réinitialiser:** Supprime complètement l'entrée

### 5. Géolocalisation

- Permission demandée automatiquement sur mobile
- Gestion des erreurs Capacitor (GPS désactivé, permission refusée, timeout...)
- Marqueur "Vous" sur la carte avec popup

---

## Structure du projet

```
mobile/
├── src/
│   ├── components/
│   │   └── geo-location/
│   │       ├── RoadworksReportModal.vue      # Modal création signalement
│   │       ├── RoadworksReportDetailsModal.vue # Modal détails
│   │       └── icon.ts                        # Icône marqueur par défaut
│   │
│   ├── pinia/                                 # State management
│   │   ├── auth/
│   │   │   └── session.ts                     # Session utilisateur
│   │   ├── firebase/
│   │   │   └── routeworks-tracker.ts          # Config store
│   │   └── geo-location/
│   │       ├── current-location.ts            # Position actuelle
│   │       ├── permission.ts                  # Permissions GPS
│   │       └── roadworks-report.ts            # Store signalements
│   │
│   ├── router/
│   │   └── index.ts                           # Routes + guards
│   │
│   ├── services/
│   │   └── firebase/
│   │       ├── routeworks-tracker.ts          # Init Firebase
│   │       ├── auth-attempts.ts               # Gestion blocage comptes
│   │       └── roadworks-reports.ts           # CRUD signalements
│   │
│   ├── utils/
│   │   └── ui.ts                              # Helpers (toasts...)
│   │
│   ├── views/
│   │   ├── auth/
│   │   │   ├── SignInPage.vue                 # Page connexion
│   │   │   └── SignUpPage.vue                 # Page inscription
│   │   ├── admin/
│   │   │   └── AdminBlockedAccountsPage.vue   # Admin comptes bloqués
│   │   ├── geo-location/
│   │   │   └── MapPage.vue                    # Page carte principale
│   │   ├── TabsPage.vue                       # Layout avec tabs
│   │   ├── Tab2Page.vue                       # Onglet 2
│   │   ├── Tab3Page.vue                       # Onglet 3
│   │   └── TestBlockingPage.vue               # Test blocage
│   │
│   ├── App.vue                                # Composant racine
│   └── main.ts                                # Point d'entrée
│
├── android/                                   # Projet Android natif
├── capacitor.config.ts                        # Config Capacitor
├── ionic.config.json                          # Config Ionic
├── package.json                               # Dépendances
├── tsconfig.json                              # Config TypeScript
└── vite.config.ts                             # Config Vite
```

---

## Configuration Firebase

Le fichier `src/services/firebase/routeworks-tracker.ts` contient la configuration Firebase:

```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyDehq2R623KKuuEpxX0Ubt-IokwP2hqINY',
  authDomain: 'roadworks-tracker.firebaseapp.com',
  projectId: 'roadworks-tracker',
  storageBucket: 'roadworks-tracker.firebasestorage.app',
  messagingSenderId: '915681241557',
  appId: '1:915681241557:web:27c4ef16db61b9be4ff55c'
};
```

**Services utilisés:**
- `getAuth()` - Authentification
- `getFirestore()` - Base de données
- `getRemoteConfig()` - Configuration à distance

**Remote Config:**
- `session_duration_millis`: Durée de session (défaut: 1h)

---

## Collections Firestore

### `roadworks_reports`

Stocke les signalements routiers.

| Champ | Type | Description |
|-------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `status` | string | Type de signalement |
| `description` | string? | Description |
| `reportStatus` | string? | Statut du rapport |
| `surface` | number? | Surface en m² |
| `budget` | number? | Budget |
| `company` | string? | Entreprise |
| `userId` | string | UID Firebase |
| `createdAt` | Timestamp | Date création |
| `updatedAt` | Timestamp | Date modification |

### `loginAttempts`

Gère le blocage des comptes après tentatives échouées.

| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | Email (= document ID) |
| `userId` | string? | UID si connu |
| `failedAttempts` | number | Nombre d'échecs |
| `isLocked` | boolean | Compte bloqué? |
| `lockedAt` | Timestamp? | Date blocage |
| `lastFailedAttempt` | Timestamp? | Dernière tentative |

---

## Routes

| Route | Page | Auth requise | Description |
|-------|------|--------------|-------------|
| `/` | - | - | Redirige vers `/tabs/map` |
| `/tabs/map` | MapPage | Oui | Carte principale |
| `/tabs/tab2` | Tab2Page | Oui | Onglet 2 |
| `/tabs/tab3` | Tab3Page | Oui | Onglet 3 |
| `/auth/signIn` | SignInPage | Non | Connexion |
| `/admin/blocked-accounts` | AdminBlockedAccountsPage | Non* | Admin |
| `/test/blocking` | TestBlockingPage | Non | Tests |

*Note: La page admin devrait idéalement être protégée par un rôle admin.

---

## Sécurité

### Protection contre brute force

1. Chaque échec de connexion est enregistré dans Firestore
2. Après 3 échecs, le compte est bloqué (`isLocked: true`)
3. Seul un admin peut débloquer via `/admin/blocked-accounts`
4. Connexion réussie = réinitialisation du compteur

### Session

- Expiration configurable via Remote Config
- Vérification à chaque navigation vers une route protégée
- Déconnexion automatique si session expirée

---

## Commandes utiles

```bash
# Développement
npm run dev                    # Serveur dev
npm run build                  # Build production
npm run preview                # Preview du build

# Tests
npm run test:unit              # Tests Vitest
npm run test:e2e               # Tests Cypress
npm run lint                   # ESLint

# Capacitor
npx cap sync                   # Sync tous les projets natifs
npx cap sync android           # Sync Android uniquement
npx cap open android           # Ouvrir Android Studio
npx cap run android            # Build et run sur device/émulateur
```
