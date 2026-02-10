# 📋 Documentation API Roadworks Tracker - Swagger

## 🚀 Vue d'ensemble

L'API Roadworks Tracker est une API REST complète pour la gestion des signalements de travaux routiers et incidents.

**Serveurs:**
- Développement: `http://localhost:8080`
- Docker: `http://localhost:8080`
- API: `http://localhost:8084`

**Documentation interactive:** http://localhost:8080/swagger-ui.html

---

## 🔐 Authentification

### Schéma de sécurité: Bearer Token (UUID)

Tous les endpoints (sauf login, register et roles) nécessitent un token Bearer :

```
Authorization: Bearer <UUID-token>
```

Obtenez un token en appelant `POST /api/auth/login`.

**Format du token:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## 📚 Endpoints API

### 1️⃣ **AUTHENTIFICATION** (`/api/auth`)

#### POST `/api/auth/login`
Connecte un utilisateur et retourne un token. Le compte est bloqué après N tentatives échouées (paramétrable via config).

**Requête:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse (200):**
```json
{
  "token": "afd8e2f4-161e-4de9-b3f3-b30e0d5bd54d-fa6f20d6-0cf3-4f9f-95f7-290d19725fc7",
  "username": "admin",
  "role": "manager",
  "message": "Connexion réussie"
}
```

**Codes d'erreur:**
- `400`: Identifiants invalides ou compte bloqué

---

#### POST `/api/auth/register`
Crée un nouveau compte utilisateur.

**Requête:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "utilisateur"
}
```

**Réponse (200):**
```json
{
  "username": "newuser",
  "role": "utilisateur",
  "message": "Compte créé avec succès"
}
```

**Codes d'erreur:**
- `400`: Nom d'utilisateur déjà existant ou données invalides

---

#### GET `/api/auth/validate`
Valide si un token est encore actif.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "username": "admin",
  "role": "manager",
  "token": "<token>",
  "message": "Token valide"
}
```

**Réponse (401):**
```json
{
  "message": "Token invalide ou expiré"
}
```

---

#### POST `/api/auth/logout`
Déconnecte l'utilisateur et invalide le token.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):** Déconnexion réussie

---

#### GET `/api/auth/roles`
Liste tous les rôles disponibles.

**Réponse (200):**
```json
[
  { "id": 1, "libelle": "utilisateur" },
  { "id": 2, "libelle": "manager" }
]
```

---

#### GET `/api/auth/users`
Liste tous les utilisateurs de la base de données locale (PostgreSQL).

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "manager",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET `/api/auth/firebase-users`
Liste tous les utilisateurs Firebase (application mobile). Utilisé pour prévisualiser avant synchronisation.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
[
  {
    "id": "firebase_uid_123",
    "username": "user@example.com",
    "role": "utilisateur",
    "isActive": true,
    "isLocked": false
  }
]
```

---

#### PUT `/api/auth/users/{userId}`
Met à jour les informations d'un utilisateur (rôle, mot de passe).

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `userId` (string) : ID local ou UID Firebase de l'utilisateur

**Requête:**
```json
{
  "role": "manager",
  "password": "newpassword123"
}
```

> Note : `password` est optionnel. Si vide ou absent, le mot de passe n'est pas modifié.

**Réponse (200):** Utilisateur mis à jour
**Réponse (404):** Utilisateur non trouvé

---

#### POST `/api/auth/users/{userId}/unlock`
Déverrouille un compte local bloqué après tentatives échouées.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `userId` (Long) : ID de l'utilisateur local

**Réponse (200):** Utilisateur déverrouillé
**Réponse (404):** Utilisateur non trouvé

---

#### POST `/api/auth/firebase-users/{firebaseUid}/unlock`
Déverrouille un compte utilisateur Firebase (mobile) dans Firestore.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `firebaseUid` (string) : UID Firebase de l'utilisateur

**Réponse (200):** Utilisateur Firebase déverrouillé
**Réponse (404):** Utilisateur non trouvé

---

#### POST `/api/auth/import-firebase`
Importe tous les utilisateurs depuis Firebase vers la base de données locale.

- Récupère tous les utilisateurs de Firebase
- Crée un compte local pour chaque utilisateur (s'il n'existe pas déjà)
- Importe le statut (actif/bloqué) depuis Firebase
- Assigne le rôle "utilisateur" par défaut
- Utilise le UID Firebase comme mot de passe temporaire

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Import réussi: 11 utilisateurs importés, 1 utilisateurs ignorés"
}
```

---

#### POST `/api/auth/sync-status-to-firebase`
Envoie les modifications de statut (bloqué/débloqué) des utilisateurs locaux vers Firebase/Firestore.

- Les managers ne sont pas synchronisés
- Seuls les utilisateurs avec un email valide sont synchronisés
- Met à jour la collection `loginAttempts` dans Firestore

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Statuts envoyés vers mobile avec succès"
}
```

---

#### DELETE `/api/auth/users/{userId}`
*(Placeholder)* Suppression d'un utilisateur — non implémentée.

**Réponse (501):**
```json
{
  "username": "userId",
  "message": "Suppression utilisateur non implementee"
}
```

---

### 2️⃣ **SIGNALEMENTS** (`/api/signalements`)

#### GET `/api/signalements`
Liste tous les signalements avec détails complets (type, statut, travaux, photos).

**Réponse (200):**
```json
[
  {
    "id": 1,
    "typeProblem": "pothole",
    "illustrationProblem": "🕳️",
    "location": "-18.8792,47.5079",
    "detail": {
      "description": "Nid de poule dangereux",
      "dateProblem": "2024-01-20T08:30:00Z",
      "etat": "nouveau"
    },
    "work": {
      "surface": 25.5,
      "company": { "id": 1, "name": "BTP Antananarivo" },
      "reparationType": { "id": 3, "niveau": 3 },
      "startDate": "2024-02-01",
      "endDateEstimation": "2024-02-10",
      "realEndDate": null,
      "price": 150000.00
    },
    "photos": ["data:image/jpeg;base64,..."]
  }
]
```

---

#### GET `/api/signalements/{id}`
Récupère un signalement spécifique par son ID.

**Paramètres de chemin:**
- `id` (Long) : ID du signalement

**Réponse (200):** Détails du signalement
**Réponse (404):** Signalement non trouvé

---

#### GET `/api/signalements/status/{status}`
Filtre les signalements par statut.

**Paramètres de chemin:**
- `status` (string) : Statut à filtrer

**Statuts valides:** `nouveau`, `en_cours`, `terminé`, `annulé`

**Réponse (200):** Liste filtrée

---

#### PUT `/api/signalements/{id}/status`
Met à jour le statut d'un signalement.

**⚠️ Règle de non-régression des statuts :**
Le statut ne peut qu'avancer dans la hiérarchie suivante :

| Niveau | Statut |
|--------|---------|
| 1 | `nouveau` |
| 2 | `en_cours` |
| 3 | `terminé` |
| 4 | `annulé` |

> **Exemples :**
> - `nouveau` → `en_cours` ✅
> - `en_cours` → `terminé` ✅
> - `nouveau` → `annulé` ✅
> - `en_cours` → `nouveau` ❌ **Interdit**
> - `terminé` → `en_cours` ❌ **Interdit**
> - `terminé` → `nouveau` ❌ **Interdit**

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID du signalement

**Requête:**
```json
{
  "status": "en_cours",
  "realEndDate": null
}
```

> Si le statut est `terminé`, le champ `realEndDate` (format `YYYY-MM-DD`) est **obligatoire**.

**Réponse (200):**
```json
{
  "message": "Statut mis à jour avec succès"
}
```

**Codes d'erreur:**
- `404`: Signalement non trouvé ou statut invalide
- `400`: Tentative de régression de statut (`"Impossible de réduire le statut de 'en_cours' vers 'nouveau'"`)

---

#### POST `/api/signalements/{id}/work`
Ajoute une réparation à un signalement et change automatiquement son statut à `en_cours`.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID du signalement

**Requête:**
```json
{
  "surface": 25.50,
  "companyId": 1,
  "startDate": "2024-02-01",
  "endDate": "2024-02-10",
  "price": 150000.00,
  "reparationTypeId": 3
}
```

| Champ | Type | Obligatoire | Description |
|-------|------|:-----------:|-------------|
| `surface` | number | ✅ | Surface à réparer (m²) |
| `companyId` | Long | ✅ | ID de l'entreprise |
| `startDate` | string | ❌ | Date de début (YYYY-MM-DD) |
| `endDate` | string | ❌ | Date de fin estimée (YYYY-MM-DD) |
| `price` | number | ✅ | Budget estimé (Ariary) |
| `reparationTypeId` | Long | ❌ | ID du niveau de réparation (1-10) |

**Réponse (200):**
```json
{
  "message": "Réparation ajoutée avec succès"
}
```

**Codes d'erreur:**
- `404`: Signalement non trouvé, entreprise non trouvée, ou type de réparation non trouvé

---

#### GET `/api/signalements/{id}/photos`
Récupère toutes les photos associées à un signalement, triées par ordre.

**Paramètres de chemin:**
- `id` (Long) : ID du signalement

**Réponse (200):**
```json
[
  {
    "id": 1,
    "photoData": "data:image/jpeg;base64,...",
    "photoOrder": 1,
    "createdAt": "2024-01-20T08:30:00Z"
  }
]
```

**Réponse (404):** Signalement non trouvé

---

#### GET `/api/signalements/firebase/unsynced`
Récupère les signalements Firebase non encore importés en base locale. Réservé aux managers.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
[
  {
    "firebaseId": "abc123",
    "typeProblem": "pothole",
    "description": "Nid de poule rue X",
    "lat": -18.8792,
    "lng": 47.5079,
    "reportStatus": "new"
  }
]
```

---

#### POST `/api/signalements/sync/firebase`
Synchronise (importe) les signalements depuis Firebase vers la base de données locale. Les doublons sont détectés par `firebase_id`.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Synchronisation effectuée avec succès",
  "imported": 5
}
```

---

#### POST `/api/signalements/sync/to-firebase`
Exporte les signalements locaux (sans `firebase_id`) vers Firebase pour qu'ils soient visibles dans l'application mobile.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Export vers Firebase effectué avec succès",
  "exported": 3
}
```

---

#### POST `/api/signalements/sync/status-to-firebase`
Met à jour les statuts de tous les signalements dans Firebase pour synchroniser les derniers changements vers l'application mobile.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Synchronisation des statuts vers Firebase effectuée avec succès",
  "synced": 12
}
```

---

#### POST `/api/signalements/{id}/sync/firebase`
Synchronise un signalement spécifique vers Firebase (statut, détails de réparation).

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID du signalement

**Réponse (200):**
```json
{
  "message": "Synchronisation vers Firebase effectuée avec succès"
}
```

**Codes d'erreur:**
- `404`: Signalement non trouvé
- `500`: Erreur de communication avec Firebase

---

### 3️⃣ **ENTREPRISES** (`/api/companies`)

#### GET `/api/companies`
Liste toutes les entreprises.

**Réponse (200):**
```json
[
  {
    "id": 1,
    "name": "BTP Antananarivo",
    "siret": "12345678900010",
    "address": "1 Rue de l'Independance",
    "phone": "+26120202020",
    "email": "contact@btp-ants.com",
    "createdAt": "2024-01-10T09:00:00Z"
  }
]
```

---

#### GET `/api/companies/{id}`
Récupère une entreprise par ID.

**Paramètres de chemin:**
- `id` (Long) : ID de l'entreprise

**Réponse (200):** Détails de l'entreprise
**Réponse (404):** Entreprise non trouvée

---

#### POST `/api/companies`
Crée une nouvelle entreprise. Le SIRET doit être unique.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "name": "Nouvelle Entreprise",
  "siret": "98765432109876",
  "address": "456 Avenue de France",
  "phone": "+26120202099",
  "email": "contact@newentreprise.mg"
}
```

**Réponse (200):** Entreprise créée
**Réponse (400):** Données invalides ou SIRET déjà existant

---

#### PUT `/api/companies/{id}`
Met à jour une entreprise existante.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID de l'entreprise

**Requête:**
```json
{
  "name": "Nom modifié",
  "email": "newemail@entreprise.mg"
}
```

> Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.

**Réponse (200):** Entreprise mise à jour
**Réponse (404):** Entreprise non trouvée

---

#### DELETE `/api/companies/{id}`
Supprime une entreprise (irréversible).

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID de l'entreprise

**Réponse (200):** Entreprise supprimée
**Réponse (404):** Entreprise non trouvée

---

### 4️⃣ **NIVEAUX DE RÉPARATION** (`/api/reparation-types`)

#### GET `/api/reparation-types`
Liste tous les niveaux de réparation disponibles, triés par niveau croissant.

**Réponse (200):**
```json
[
  { "id": 1, "niveau": 1 },
  { "id": 2, "niveau": 2 },
  { "id": 3, "niveau": 3 },
  { "id": 4, "niveau": 4 },
  { "id": 5, "niveau": 5 },
  { "id": 6, "niveau": 6 },
  { "id": 7, "niveau": 7 },
  { "id": 8, "niveau": 8 },
  { "id": 9, "niveau": 9 },
  { "id": 10, "niveau": 10 }
]
```

---

### 5️⃣ **FORFAITS M²** (`/api/m2-forfaits`)

#### GET `/api/m2-forfaits`
Liste tous les forfaits de prix au m².

**Réponse (200):**
```json
[
  { "id": 1, "price": 5000.00 }
]
```

---

#### GET `/api/m2-forfaits/current`
Récupère le prix forfaitaire courant (le dernier enregistré).

**Réponse (200):**
```json
{
  "id": 3,
  "price": 7500.00
}
```

**Réponse (404):**
```json
{
  "error": "Aucun prix forfaitaire défini"
}
```

---

#### GET `/api/m2-forfaits/{id}`
Récupère un forfait m² par son ID.

**Paramètres de chemin:**
- `id` (Long) : ID du forfait

**Réponse (200):** Forfait récupéré
**Réponse (404):** Forfait non trouvé

---

#### POST `/api/m2-forfaits`
Crée un nouveau forfait m².

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "prixM2": 7500.00
}
```

> Le champ accepte `prixM2` ou `price` (valeur > 0).

**Réponse (200):** Forfait créé
**Réponse (400):** `"prixM2 invalide (>0)"`

---

#### PUT `/api/m2-forfaits/{id}`
Met à jour un forfait m² existant.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID du forfait

**Requête:**
```json
{
  "prixM2": 8000.00
}
```

**Réponse (200):** Forfait mis à jour
**Réponse (404):** Forfait non trouvé
**Réponse (400):** Données invalides

---

#### DELETE `/api/m2-forfaits/{id}`
Supprime un forfait m².

**Headers requis:**
```
Authorization: Bearer <token>
```

**Paramètres de chemin:**
- `id` (Long) : ID du forfait

**Réponse (200):**
```json
{
  "message": "Forfait supprimé"
}
```

**Réponse (404):** Forfait non trouvé

---

### 6️⃣ **TAUX D'AVANCEMENT** (`/api/advancement-rates`)

#### GET `/api/advancement-rates`
Liste tous les taux d'avancement par statut.

**Réponse (200):**
```json
[
  { "id": 1, "statusKey": "nouveau", "percentage": 0 },
  { "id": 2, "statusKey": "new", "percentage": 0 },
  { "id": 3, "statusKey": "en_cours", "percentage": 50 },
  { "id": 4, "statusKey": "in_progress", "percentage": 50 },
  { "id": 5, "statusKey": "terminé", "percentage": 100 },
  { "id": 6, "statusKey": "completed", "percentage": 100 }
]
```

---

#### PUT `/api/advancement-rates/{statusKey}`
Crée ou met à jour le taux d'avancement pour un statut donné.

**Paramètres de chemin:**
- `statusKey` (string) : Clé du statut (ex: `nouveau`, `en_cours`, `terminé`)

**Paramètres de requête:**
- `percentage` (integer, 0-100) : Pourcentage d'avancement

**Exemple:**
```
PUT /api/advancement-rates/en_cours?percentage=50
```

**Réponse (200):**
```json
{
  "id": 3,
  "statusKey": "en_cours",
  "percentage": 50
}
```

---

### 7️⃣ **ANALYTICS** (`/api/analytics`)

#### GET `/api/analytics/work-stats`
Récupère les statistiques agrégées des travaux.

**Paramètres de requête (tous optionnels):**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `companyId` | Long | Filtrer par entreprise |
| `startDate` | date (YYYY-MM-DD) | Date de début de la période |
| `endDate` | date (YYYY-MM-DD) | Date de fin de la période |
| `typeProblem` | string | Filtrer par type de problème |

**Exemple:**
```
GET /api/analytics/work-stats?companyId=1&startDate=2024-01-01&endDate=2024-12-31
```

**Réponse (200):**
```json
{
  "totalSignalements": 42,
  "counts": {
    "new": 10,
    "in_progress": 15,
    "completed": 17
  },
  "totalBudget": 5250000.00,
  "totalSurface": 1200.50,
  "avgDuration": 12.5,
  "avgPrice": 125000.00,
  "progressPercentage": 65.5
}
```

---

#### GET `/api/analytics/work-timelines`
Récupère la timeline détaillée des travaux.

**Paramètres de requête (tous optionnels):**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `companyId` | Long | Filtrer par entreprise |
| `startDate` | date (YYYY-MM-DD) | Date de début de la période |
| `endDate` | date (YYYY-MM-DD) | Date de fin de la période |
| `typeProblem` | string | Filtrer par type de problème |

**Réponse (200):**
```json
[
  {
    "signalementId": 1,
    "typeProblem": "pothole",
    "status": "en_cours",
    "company": "BTP Antananarivo",
    "startDate": "2024-02-01",
    "endDateEstimation": "2024-02-10",
    "realEndDate": null,
    "price": 150000.00,
    "surface": 25.50
  }
]
```

---

## 📊 Modèles de données

### Account (Utilisateur)
```json
{
  "id": 1,
  "username": "admin",
  "pwd": "[hashé en SHA-256 + Base64]",
  "idRole": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-27T08:00:00Z",
  "isActive": true,
  "isLocked": false,
  "attempts": 0,
  "lastFailedLogin": null
}
```

### Role (Rôle)
```json
{
  "id": 1,
  "libelle": "utilisateur"
}
```

### Company (Entreprise)
```json
{
  "id": 1,
  "name": "BTP Antananarivo",
  "siret": "12345678900010",
  "address": "1 Rue de l'Independance",
  "phone": "+26120202020",
  "email": "contact@btp-ants.com",
  "createdAt": "2024-01-10T09:00:00Z"
}
```

### Signalement (Incident routier)
```json
{
  "id": 1,
  "idAccount": 1,
  "idTypeProblem": 7,
  "descriptions": "Description du problème",
  "createdAt": "2024-01-20T08:30:00Z",
  "location": "-18.8792,47.5079",
  "picture": null,
  "surface": 25.50,
  "firebaseId": "firebase_id_123"
}
```

### TypeProblem (Type de problème)
```json
{
  "id": 7,
  "libelle": "pothole",
  "icone": "🕳️"
}
```

**Types disponibles:**

| ID | Libellé | Icône | Source |
|----|---------|-------|--------|
| 1 | Danger | ⚠️ | Web |
| 2 | Travaux | 🚧 | Web |
| 3 | Risque | ⚡ | Web |
| 4 | Inondation | 💧 | Web |
| 5 | Résolu | ✅ | Web |
| 6 | Route fermée | 🚫 | Web |
| 7 | pothole | 🕳️ | Mobile/Firebase |
| 8 | blocked_road | 🚧 | Mobile/Firebase |
| 9 | accident | 🚨 | Mobile/Firebase |
| 10 | construction | 🏗️ | Mobile/Firebase |
| 11 | flooding | 💧 | Mobile/Firebase |
| 12 | debris | 🪨 | Mobile/Firebase |
| 13 | poor_surface | ⚠️ | Mobile/Firebase |
| 14 | other | ❓ | Mobile/Firebase |

### ReparationType (Niveau de réparation)
```json
{
  "id": 3,
  "niveau": 3
}
```

> 10 niveaux disponibles (1 à 10).

### DefaultPrice (Forfait m²)
```json
{
  "id": 1,
  "price": 7500.00
}
```

### AdvancementRate (Taux d'avancement)
```json
{
  "id": 1,
  "statusKey": "nouveau",
  "percentage": 0
}
```

### StatusSignalement (Statut de signalement)

**Hiérarchie des statuts (non-régression) :**

```
nouveau (1) → en_cours (2) → terminé (3)
       ↘           ↘
          annulé (4)
```

> ⚠️ **Règle métier** : Un statut ne peut jamais régresser. Un signalement `en_cours` ne peut pas redevenir `nouveau`. Un signalement `terminé` ne peut plus changer de statut.

| Statut | Niveau | Couleur | Avancement |
|--------|--------|---------|------------|
| `nouveau` | 1 | 🟡 Jaune | 0% |
| `en_cours` | 2 | 🟠 Orange | 50% |
| `terminé` | 3 | 🟢 Vert | 100% |
| `annulé` | 4 | 🔴 Rouge | — |

---

## 🔄 Flux d'utilisation typiques

### Authentification
```
1. POST /api/auth/login
   ├─ Fournir: username, password
   └─ Recevoir: token, username, role

2. Utiliser le token pour les autres requêtes
   Header: Authorization: Bearer <token>

3. POST /api/auth/logout
   └─ Token invalidé
```

### Cycle de vie d'un signalement
```
1. Signalement créé (mobile → Firebase → sync) → statut "nouveau"

2. Manager ajoute une réparation:
   POST /api/signalements/{id}/work
   └─ Statut passe à "en_cours" automatiquement

3. Manager marque comme terminé:
   PUT /api/signalements/{id}/status
   Body: { "status": "terminé", "realEndDate": "2024-03-15" }

4. Synchronisation vers mobile:
   POST /api/signalements/sync/status-to-firebase
```

### Synchronisation Firebase
```
Mobile → Backend:
  POST /api/signalements/sync/firebase       (importer signalements)
  POST /api/auth/import-firebase              (importer utilisateurs)

Backend → Mobile:
  POST /api/signalements/sync/to-firebase     (exporter signalements)
  POST /api/signalements/sync/status-to-firebase  (sync statuts)
  POST /api/auth/sync-status-to-firebase      (sync statuts utilisateurs)
```

---

## 🛠️ Gestion des erreurs

### Codes HTTP
| Code | Signification |
|------|--------------|
| `200 OK` | Succès |
| `400 Bad Request` | Données invalides ou violation de règle métier |
| `401 Unauthorized` | Authentification requise ou token invalide |
| `404 Not Found` | Ressource non trouvée |
| `500 Internal Server Error` | Erreur serveur |
| `501 Not Implemented` | Fonctionnalité non implémentée |

### Format d'erreur standard
```json
{
  "error": "Description de l'erreur"
}
```

### Erreurs spécifiques de statut
```json
{
  "error": "Impossible de réduire le statut de 'en_cours' vers 'nouveau'"
}
```

---

## 📝 Notes importantes

1. **Sécurité** : Ne jamais exposer vos tokens en production
2. **Non-régression des statuts** : Un statut ne peut jamais être réduit (en_cours → nouveau est interdit)
3. **Statut des utilisateurs** : Les utilisateurs importés de Firebase héritent du statut Firebase (actif/bloqué)
4. **Limite de tentatives** : Après N tentatives échouées (configurable), le compte est bloqué
5. **Duplication** : Les utilisateurs et signalements existants ne sont pas réimportés lors d'un import Firebase
6. **Firebase** : Assurez-vous que le fichier `firebase-key.json` est correctement configuré
7. **Niveaux de réparation** : 10 niveaux prédéfinis (1 à 10) dans la table `reparation_type`

---

## 🚀 Démarrage de l'API

```bash
# Avec Docker Compose
docker-compose up -d

# L'API sera accessible à http://localhost:8080
# Swagger UI à http://localhost:8080/swagger-ui.html
```

---

**Dernière mise à jour :** 10 février 2026
**Liste des étudiants :** 3556, 3575, 3614
**Version :** 2.0.0
