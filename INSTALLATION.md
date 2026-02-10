# 🚧 Roadworks Tracker - Guide d'installation

## Prérequis

- **Docker Desktop** installé et lancé
  - [Télécharger pour Mac](https://www.docker.com/products/docker-desktop/)
  - [Télécharger pour Windows](https://www.docker.com/products/docker-desktop/)

## Lancer le projet

```bash
# 1. Se placer dans le dossier du projet
cd roadworks-tracker

# 2. Lancer tous les services
docker compose up --build
```

>  Le premier lancement peut prendre plusieurs minutes (téléchargement des images, compilation du backend Maven, installation des dépendances npm...).

## Accès aux services

| Service            | URL                        |
|--------------------|----------------------------|
| **Backend API**    | http://localhost:8080      |
| **Frontoffice**    | http://localhost:5173      |
| **Backoffice**     | http://localhost:5174      |
| **Carte Tileserver** | http://localhost:8089    |
| **PostgreSQL**     | localhost:5432             |

## Arrêter le projet

```bash
docker compose down
```

## Réinitialiser complètement (supprimer les données)

```bash
docker compose down -v
docker compose up --build
```

## Structure des services Docker

- **postgres** : Base de données PostgreSQL 14
- **backend** : API Spring Boot (Java 17 / Maven)
- **frontoffice** : Application web publique (Vite + Vue.js)
- **backoffice** : Application web d'administration (Vite + Vue.js)
- **map** : Serveur de tuiles cartographiques (TileServer GL)

##  Notes importantes

- Le fichier `backend/firebase-key.json` doit être présent pour que le backend fonctionne correctement.
- La base de données est automatiquement initialisée au premier lancement via `database/reset-database.sql`.
- Les `node_modules` sont gérés dans des volumes Docker, pas besoin de faire `npm install` manuellement.
