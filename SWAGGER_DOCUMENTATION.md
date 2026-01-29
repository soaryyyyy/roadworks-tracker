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

Tous les endpoints (sauf login et register) nécessitent un token Bearer :

```
Authorization: Bearer <UUID-token>
```

Obtenez un token en appelant `POST /api/auth/login`.

**Format du token:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## 📚 Endpoints API

### 1️⃣ **AUTHENTIFICATION** (`/api/auth`)

#### POST `/login`
Connecte un utilisateur et retourne un token.

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

#### POST `/register`
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
- `400`: Nom d'utilisateur déjà existant

---

#### GET `/validate`
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

#### POST `/logout`
Déconnecte l'utilisateur et invalide le token.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):** Déconnexion réussie

---

#### GET `/roles`
Liste tous les rôles disponibles.

**Réponse (200):**
```json
[
  {
    "id": 1,
    "libelle": "manager"
  },
  {
    "id": 2,
    "libelle": "utilisateur"
  },
  {
    "id": 3,
    "libelle": "visiteur"
  }
]
```

---

#### GET `/users`
Liste tous les utilisateurs (nécessite authentification).

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
  },
  {
    "id": 2,
    "username": "user1",
    "role": "utilisateur",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2024-01-20T14:45:00Z"
  }
]
```

---

#### POST `/import-firebase`
**Importe tous les utilisateurs depuis Firebase vers la base de données locale.**

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

#### PUT `/users/{userId}`
Met à jour les informations d'un utilisateur.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "role": "manager",
  "password": "newpassword123"
}
```

**Réponse (200):** Utilisateur mis à jour

---

#### POST `/users/{userId}/unlock`
Déverrouille un compte bloqué après tentatives échouées.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):** Utilisateur déverrouillé

---

### 2️⃣ **ENTREPRISES** (`/api/companies`)

#### GET `/companies`
Liste toutes les entreprises.

**Réponse (200):**
```json
[
  {
    "id": 1,
    "name": "Entreprise A",
    "siret": "12345678901234",
    "address": "123 Rue de la Paix, 75000 Paris",
    "phone": "01 23 45 67 89",
    "email": "contact@entrepriseA.fr",
    "createdAt": "2024-01-10T09:00:00Z"
  }
]
```

---

#### GET `/companies/{id}`
Récupère une entreprise par ID.

**Réponse (200):** Détails de l'entreprise

---

#### POST `/companies`
Crée une nouvelle entreprise.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "name": "Nouvelle Entreprise",
  "siret": "98765432109876",
  "address": "456 Avenue des Champs, 75008 Paris",
  "phone": "01 98 76 54 32",
  "email": "contact@newentreprise.fr"
}
```

**Réponse (200):** Entreprise créée

---

#### PUT `/companies/{id}`
Met à jour une entreprise.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "name": "Nom modifié",
  "email": "newemail@entreprise.fr"
}
```

**Réponse (200):** Entreprise mise à jour

---

#### DELETE `/companies/{id}`
Supprime une entreprise.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):** Entreprise supprimée

---

### 3️⃣ **SIGNALEMENTS** (`/api/signalements`)

#### GET `/signalements`
Liste tous les signalements avec détails complets.

**Réponse (200):**
```json
[
  {
    "id": 1,
    "typeProblem": "Nid de poule",
    "illustrationProblem": "⚠️",
    "descriptions": "Grand nid de poule dangereux",
    "dateProblem": "2024-01-20T08:30:00Z",
    "location": "123 Rue de la Paix, Paris",
    "surfaceM2": 0.5,
    "etat": "nouveau",
    "statusDate": "2024-01-20T08:30:00Z",
    "budget": null,
    "startDate": null,
    "endDateEstimation": null,
    "realEndDate": null,
    "idCompany": null,
    "companyName": null
  }
]
```

---

#### GET `/signalements/{id}`
Récupère un signalement spécifique.

**Réponse (200):** Détails du signalement

---

#### GET `/signalements/status/{status}`
Filtre les signalements par statut.

**Statuts valides:** `nouveau`, `en_cours`, `resolu`, `rejete`

**Réponse (200):** Liste filtrée

---

#### PUT `/signalements/{id}/status`
Met à jour le statut d'un signalement.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "status": "en_cours"
}
```

**Réponse (200):** Statut mis à jour

---

#### POST `/signalements/{id}/work`
Ajoute une réparation à un signalement.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Requête:**
```json
{
  "id_company": 1,
  "start_date": "2024-02-01",
  "end_date_estimation": "2024-02-10",
  "price": 2500.00
}
```

**Réponse (200):** Réparation ajoutée (statut changé en `en_cours`)

---

#### POST `/signalements/sync/firebase`
Synchronise les signalements depuis Firebase.

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

#### POST `/signalements/{id}/sync/firebase`
Synchronise un signalement spécifique vers Firebase.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200):** Signalement synchronisé

---

## 📊 Modèles de données

### Account (Utilisateur)
```json
{
  "id": 1,
  "username": "admin",
  "pwd": "[hashé en SHA-256]",
  "idRole": 1,
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
  "libelle": "manager"
}
```

### Company (Entreprise)
```json
{
  "id": 1,
  "name": "Entreprise ABC",
  "siret": "12345678901234",
  "address": "123 Rue Principale",
  "phone": "01 23 45 67 89",
  "email": "contact@abc.fr",
  "createdAt": "2024-01-10T09:00:00Z"
}
```

### Signalement (Incident routier)
```json
{
  "id": 1,
  "idAccount": 2,
  "descriptions": "Description du problème",
  "createdAt": "2024-01-20T08:30:00Z",
  "location": "Adresse du problème",
  "picture": "[URL de la photo]",
  "surface": 0.5,
  "idTypeProblem": 1,
  "firebaseId": "firebase_id_123"
}
```

### TypeProblem (Type de problème)
```json
{
  "id": 1,
  "libelle": "Nid de poule",
  "icone": "⚠️"
}
```

---

## 🔄 Flux d'authentification typique

```
1. POST /api/auth/login
   ├─ Fournir: username, password
   └─ Recevoir: token, username, role

2. Utiliser le token pour les autres requêtes
   Header: Authorization: Bearer <token>

3. POST /api/auth/logout
   └─ Token invalide
```

---

## 🛠️ Gestion des erreurs

### Codes HTTP
- `200 OK`: Succès
- `400 Bad Request`: Données invalides
- `401 Unauthorized`: Authentification requise ou invalide
- `404 Not Found`: Ressource non trouvée
- `500 Internal Server Error`: Erreur serveur

### Réponse d'erreur
```json
{
  "message": "Description de l'erreur",
  "error": "Détail technique"
}
```

---

## 📝 Notes importantes

1. **Sécurité**: Ne jamais exposer vos tokens en production
2. **Statut des utilisateurs**: Les utilisateurs importés de Firebase héritent du statut Firebase (actif/bloqué)
3. **Limite de tentatives**: Après 5 tentatives échouées, le compte est bloqué
4. **Duplication**: Les utilisateurs existants ne sont pas réimportés lors d'un import Firebase
5. **Firebase**: Assurez-vous que le fichier `firebase-key.json` est correctement configuré

---

## 🚀 Démarrage de l'API

```bash
# Avec Docker Compose
docker-compose up -d

# L'API sera accessible à http://localhost:8080
# Swagger UI à http://localhost:8080/swagger-ui.html
```

---

**Dernière mise à jour:** 27 janvier 2026  
**Version:** 1.0.0
