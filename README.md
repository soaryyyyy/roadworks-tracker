# Roadworks Tracker - Suivi des Travaux Routiers

**Projet universitaire - ITU | Semestre 5 | Groupe Mr Rojo**

Application multi-plateforme de signalement et de suivi des problemes d'infrastructure routiere dans la ville d'Antananarivo. Les citoyens peuvent signaler des degradations (nids de poule, inondations, effondrements, etc.) et les gestionnaires peuvent suivre, assigner et superviser les travaux de reparation.

---

## Table des matieres

- [Architecture du projet](#architecture-du-projet)
- [Technologies utilisees](#technologies-utilisees)
- [Structure du projet](#structure-du-projet)
- [Modele de donnees](#modele-de-donnees)
- [Fonctionnalites](#fonctionnalites)
- [Pre-requis](#pre-requis)
- [Installation et lancement](#installation-et-lancement)
- [Acces aux services](#acces-aux-services)
- [API REST](#api-rest)
- [Comptes par defaut](#comptes-par-defaut)

---

## Architecture du projet

Le projet suit une architecture **multi-tiers** composee de :

| Couche         | Technologie              | Role                                      |
|----------------|--------------------------|-------------------------------------------|
| Frontend       | React 19 + Vite          | Interface publique (signalement)          |
| Backoffice     | React 19 + Vite          | Interface d'administration                |
| Mobile         | Ionic 8 + Vue 3          | Application mobile (Android/iOS)          |
| Backend        | Spring Boot 3.2 (Java 17)| API REST + WebSocket                      |
| Base de donnees| PostgreSQL 14            | Stockage des donnees                      |
| Cartographie   | Leaflet + MapTiler       | Affichage des cartes et tuiles offline    |
| Authentification| Firebase Auth + JWT     | Gestion des utilisateurs                  |

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Frontoffice │  │  Backoffice  │  │  Mobile App  │
│  (React 19)  │  │  (React 19)  │  │ (Ionic/Vue3) │
│  :5173       │  │  :5174       │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    │ HTTP / WebSocket
              ┌─────┴──────┐
              │  Backend   │
              │ Spring Boot│
              │  :8080     │
              └──┬─────┬───┘
                 │     │
        ┌────────┘     └────────┐
   ┌────┴─────┐          ┌─────┴──────┐
   │PostgreSQL│          │  Firebase  │
   │  :5432   │          │  (Cloud)   │
   └──────────┘          └────────────┘
```

---

## Technologies utilisees

### Backend
- **Java 17** avec **Spring Boot 3.2.5**
- **Spring Data JPA** / Hibernate (ORM)
- **Spring WebSocket** (STOMP + SockJS) pour les notifications temps reel
- **PostgreSQL 14** comme SGBD
- **Firebase Admin SDK 9.2.0** (synchronisation Firestore, gestion utilisateurs)
- **JWT** pour l'authentification
- **Swagger / OpenAPI 2.3.0** pour la documentation de l'API
- **Maven 3.9.5** comme outil de build
- **Lombok** pour la generation de code

### Frontend (Frontoffice + Backoffice)
- **React 19.2.3** avec composants fonctionnels
- **Vite 6.4** comme bundler
- **React Router DOM 7** pour le routage
- **Leaflet 1.9.4** + **React-Leaflet 5.0** pour la cartographie
- **STOMP.js** + **SockJS** pour les WebSockets (backoffice)

### Application Mobile
- **Ionic 8.0** + **Vue 3.3** + **Capacitor 8.0**
- **Pinia** pour la gestion d'etat
- **Capacitor Plugins** : Camera, Geolocation, Local Notifications, Secure Storage
- **Leaflet** pour les cartes
- **Cypress** (tests E2E) + **Vitest** (tests unitaires)

### Infrastructure
- **Docker** + **Docker Compose** pour l'orchestration
- **MapTiler Tileserver GL** pour le serveur de tuiles cartographiques

---

## Structure du projet

```
roadworks-tracker/
├── backend/                     # API Spring Boot
│   ├── src/main/java/.../
│   │   ├── api/                 # Controleurs REST
│   │   ├── model/               # Entites JPA
│   │   ├── service/             # Logique metier
│   │   ├── repository/          # Couche d'acces aux donnees
│   │   ├── dto/                 # Objets de transfert
│   │   └── config/              # Configuration (CORS, WebSocket, Firebase)
│   └── pom.xml
│
├── web/
│   ├── frontoffice/             # Application React publique
│   │   ├── src/
│   │   │   ├── pages/           # Pages (MapPage, PhotosPage)
│   │   │   └── components/      # Composants reutilisables
│   │   └── package.json
│   │
│   └── backoffice/              # Application React administration
│       ├── src/
│       │   ├── pages/           # Pages (Dashboard, Analytics, Users)
│       │   ├── components/      # Composants reutilisables
│       │   └── hooks/           # Hooks personnalises (notifications)
│       └── package.json
│
├── mobile/                      # Application Ionic/Vue
│   ├── src/
│   │   ├── views/               # Pages (auth, map, recap, admin)
│   │   └── components/          # Composants reutilisables
│   ├── capacitor.config.ts
│   └── package.json
│
├── database/                    # Scripts SQL
│   ├── reset-database.sql       # Initialisation + donnees de test
│   ├── create.sql               # Creation des tables
│   └── conception.txt           # Conception de la base
│
├── maps/data/                   # Tuiles cartographiques (mbtiles)
├── docs/                        # Documentation (MCD)
├── docker-compose.yml           # Orchestration Docker
└── README.md
```

---

## Modele de donnees

Le schema de la base de donnees comporte les entites principales suivantes :

| Table                 | Description                                        |
|-----------------------|----------------------------------------------------|
| `account`             | Comptes utilisateurs (username, mot de passe, role)|
| `role`                | Roles (visiteur, utilisateur, manager)             |
| `session`             | Sessions JWT avec IP et user-agent                 |
| `signalement`         | Signalements routiers (localisation, type, photos) |
| `signalement_status`  | Historique des statuts d'un signalement             |
| `signalement_work`    | Travaux assignes (entreprise, dates, cout)         |
| `type_problem`        | Types de problemes (14 categories)                 |
| `company`             | Entreprises de travaux (SIRET, contact)            |
| `security_log`        | Journal d'audit des actions de securite            |
| `config`              | Configuration systeme (tentatives max, duree session)|

### Cycle de vie d'un signalement

```
Nouveau  ──>  En cours  ──>  Resolu
                  │
                  └──>  Rejete
```

Le diagramme MCD complet est disponible dans [docs/mcd.md](docs/mcd.md).

---

## Fonctionnalites

### Interface publique (Frontoffice)
- Visualisation des signalements sur une carte interactive
- Signalement de problemes routiers avec localisation GPS
- Choix du type de probleme parmi 14 categories
- Possibilité de voir les photos
- Filtrage des signalements par date et par statut

### Interface d'administration (Backoffice)
- Tableau de bord avec vue d'ensemble des signalements
- Gestion des statuts des signalements
- Assignation de travaux a des entreprises
- Gestion des entreprises (SIRET, contact)
- Gestion des utilisateurs (blocage/deblocage de comptes)
- Tableau analytique et statistiques d'avancement
- Notifications en temps reel via WebSocket

### Application mobile
- Signalement avec geolocalisation automatique (GPS)
- Prise de photo directement depuis l'application
- Synchronisation des donnees avec le backend via Firebase
- Notifications locales
- Authentification (inscription / connexion)

### Securite
- Authentification JWT avec gestion des sessions
- Verrouillage de compte apres 5 tentatives echouees
- Journalisation des actions de securite (IP, user-agent)
- Integration Firebase Auth

---

## Pre-requis

### Avec Docker (recommande)
- [Docker](https://www.docker.com/) et Docker Compose

### Sans Docker
- Java 17+
- Maven 3.9+
- PostgreSQL 14+
- Node.js 22+
- Fichier de cle de service Firebase (`firebase-key.json`)

---

## Installation et lancement

### Avec Docker Compose (recommande)

```bash
# Cloner le depot
git clone https://github.com/soaryyyyy/roadworks-tracker.git
cd roadworks-tracker

# Lancer tous les services
docker-compose up --build
```

Cela demarre automatiquement :
- PostgreSQL avec les donnees initiales
- Le backend Spring Boot
- Le frontoffice React
- Le backoffice React
- Le serveur de tuiles cartographiques

### Lancement manuel

**Backend :**
```bash
cd backend
mvn clean package -DskipTests
java -jar target/roadworks-0.0.1-SNAPSHOT.jar
```

**Frontoffice :**
```bash
cd web/frontoffice
npm ci
npm run dev
```

**Backoffice :**
```bash
cd web/backoffice
npm ci
npm run dev
```

**Mobile (Android) :**
```bash
cd mobile
npm ci
npm run build
npx cap copy
npx cap sync android
# Ouvrir dans Android Studio
```

---

## Acces aux services

| Service              | URL                              |
|----------------------|----------------------------------|
| Frontoffice (public) | http://localhost:5173             |
| Backoffice (admin)   | http://localhost:5174             |
| API Backend          | http://localhost:8080             |
| Documentation Swagger| http://localhost:8080/swagger-ui.html |
| Serveur de tuiles    | http://localhost:8089             |
| Base de donnees      | localhost:5432                   |

---

## API REST

### Authentification (`/api/auth`)
| Methode | Endpoint                     | Description                    |
|---------|------------------------------|--------------------------------|
| POST    | `/api/auth/login`            | Connexion                      |
| POST    | `/api/auth/register`         | Inscription                    |
| POST    | `/api/auth/logout`           | Deconnexion                    |
| GET     | `/api/auth/validate`         | Validation du token JWT        |
| GET     | `/api/auth/users`            | Liste des utilisateurs Firebase|
| POST    | `/api/auth/users/{uid}/unlock`| Debloquer un compte           |

### Signalements (`/api/signalements`)
| Methode | Endpoint                            | Description                     |
|---------|-------------------------------------|---------------------------------|
| GET     | `/api/signalements`                 | Liste des signalements          |
| GET     | `/api/signalements/{id}`            | Detail d'un signalement         |
| GET     | `/api/signalements/status/{status}` | Filtrer par statut              |
| PUT     | `/api/signalements/{id}/status`     | Modifier le statut              |
| POST    | `/api/signalements/{id}/work`       | Assigner des travaux            |
| POST    | `/api/signalements/sync/firebase`   | Synchroniser depuis Firestore   |

### Entreprises (`/api/companies`)
| Methode | Endpoint               | Description             |
|---------|------------------------|-------------------------|
| GET     | `/api/companies`       | Liste des entreprises   |
| POST    | `/api/companies`       | Creer une entreprise    |
| PUT     | `/api/companies/{id}`  | Modifier une entreprise |
| DELETE  | `/api/companies/{id}`  | Supprimer une entreprise|

### Autres
| Methode | Endpoint                  | Description               |
|---------|---------------------------|---------------------------|
| GET     | `/api/advancement-rate`   | Taux d'avancement         |
| GET     | `/api/analytics`          | Donnees analytiques       |

La documentation interactive complete est accessible via **Swagger UI** a l'adresse : `http://localhost:8080/swagger-ui.html`

### WebSocket (temps reel)
- `/topic/signalements` - Nouveaux signalements
- `/topic/notifications` - Notifications generales

---

## Comptes par defaut

| Username | Mot de passe | Role    |
|----------|-------------|---------|
| admin    | admin123    | manager |

Les donnees de test incluent egalement des entreprises et des types de problemes pre-configures (voir `database/reset-database.sql`).
