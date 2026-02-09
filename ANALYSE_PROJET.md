# Analyse du Projet Cloud S5 - Roadworks Tracker

> Comparaison entre le sujet (V3 du 3 fevrier 2026) et l'etat actuel du projet.

---

## RESUME RAPIDE

| Module | Statut | Completude estimee |
|--------|--------|--------------------|
| Authentification (API) | Quasi complet | ~85% |
| Cartes (Docker offline) | Complet | ~100% |
| Web Frontoffice (Visiteur) | Quasi complet | ~90% |
| Web Backoffice (Manager) | Quasi complet | ~90% |
| Mobile (Ionic/Vue) | Quasi complet | ~90% |
| Documentation technique | Incomplete | ~40% |
| Livrables (APK, suivi) | Partiellement | ~50% |

---

## 1. MODULE AUTHENTIFICATION - Ce qui manque / a corriger

### Problemes identifies

- **max_attempts = 5 au lieu de 3** : Le sujet demande "par defaut 3" tentatives. Dans `database/init-database.sql`, la valeur est 5.
  ```sql
  -- Actuel :
  INSERT INTO config (max_attempts, session_duration) VALUES (5, 60);
  -- Attendu :
  INSERT INTO config (max_attempts, session_duration) VALUES (3, 60);
  ```

- **Authentification par username au lieu de email** : Le sujet dit "Authentification (email/pwd)". Le backend utilise `username` dans `LoginRequest.java`. Le mobile utilise email via Firebase, mais le backoffice envoie un username. Il faudrait uniformiser sur email/pwd, ou au minimum que le champ `username` contienne un email.

### Ce qui est fait (OK)

- [x] Authentification login/register
- [x] Inscription
- [x] Modification infos users
- [x] Duree de vie des sessions (configurable, 60 min par defaut)
- [x] Limite tentatives de connexion (parametre, mais mauvaise valeur par defaut)
- [x] API REST pour reinitialiser le blocage
- [x] Documentation Swagger
- [x] Base PostgreSQL dans Docker
- [x] API seulement (pas d'interface dans le backend)

---

## 2. MODULE CARTES - Complet

- [x] Serveur de carte offline sur Docker (TileServer GL)
- [x] Carte d'Antananarivo avec rues (antananarivo.mbtiles)
- [x] Leaflet pour afficher/manipuler la carte

Rien a ajouter ici.

---

## 3. MODULE WEB - FRONTOFFICE (Visiteur)

### Ce qui manque

- **Survol (hover) au lieu de clic** : Le sujet dit "Lorsqu'on **survole** un point, on doit voir les infos". Actuellement, les infos s'affichent uniquement au **clic** (Popup Leaflet). Il faudrait utiliser un `Tooltip` Leaflet qui s'affiche au hover, ou au minimum un hover event.

### Ce qui est fait (OK)

- [x] Carte avec les points representant les problemes routiers
- [x] Infos dans le popup : date, status, surface m2, budget, entreprise, lien photos
- [x] Tableau de recapitulation : Nb de points, total surface, avancement %, total budget
- [x] Page photos pour chaque signalement

---

## 4. MODULE WEB - BACKOFFICE (Manager)

### Ce qui manque / a ameliorer

- **Dates pour chaque etape d'avancement** : Le sujet dit "Pour chaque etape d'avancement, on specifie les dates". Les dates sont stockees en BDD (`SignalementStatus.updatedAt`) et affichees dans la page Analytics (timeline). Mais dans le modal de detail d'un signalement, les dates de chaque changement de statut ne sont pas clairement exposees. Il faudrait afficher un historique des transitions de statut avec leurs dates.

- **Envoi des comptes mobiles crees** : Le sujet mentionne que la synchro doit aussi "envoyer les comptes mobiles crees". La synchro utilisateurs vers Firebase existe (`/api/auth/import-firebase`), mais la creation de comptes depuis le backoffice vers Firebase pourrait etre plus explicite.

### Ce qui est fait (OK)

- [x] Login via API REST
- [x] 2 profils : Visiteur (sans compte) / Manager
- [x] Creation d'un compte utilisateur
- [x] Bouton synchronisation (import Firebase -> local)
- [x] Export donnees vers Firebase pour mobile
- [x] Page pour debloquer les utilisateurs bloques
- [x] Gestion infos signalement (surface, budget, entreprise)
- [x] Modifier les statuts
- [x] Calcul avancement (nouveau=0%, en_cours=50%, termine=100%)
- [x] Tableau de statistiques (delai de traitement moyen)
- [x] Notifications WebSocket en temps reel

---

## 5. MODULE MOBILE (Ionic + Vue)

### Ce qui manque / a verifier

- **Inscription uniquement via le manager** : Le sujet dit "inscription via le manager dans l'application web uniquement". Or, le mobile semble avoir une page `SignUpPage.vue`. Si cette page permet l'auto-inscription, c'est contraire au sujet. Il faudrait soit la supprimer, soit la restreindre.

- **Notifications de changement de statut** : L'implementation existe (`notifications.ts` avec `notifyStatusChange`), mais il faut verifier que ca fonctionne correctement sur un vrai appareil Android (les notifications locales Capacitor necessitent des permissions).

### Ce qui est fait (OK)

- [x] Login Firebase en ligne
- [x] Signaler les problemes depuis la carte
- [x] Localisation GPS
- [x] Ajout de photos (camera)
- [x] Affichage carte + recap (comme visiteur)
- [x] Filtre "Mes signalements uniquement"
- [x] Notifications de changement de statut (implementation presente)
- [x] Gestion offline / no-connection

---

## 6. LIVRABLES ET DOCUMENTATION

### Ce qui manque

| Livrable | Statut | Commentaire |
|----------|--------|-------------|
| **Documentation technique (PDF)** | Incomplete | Le `doc_tec_v3_3556_3575_3614.pdf` existe a la racine mais le sujet demande un contenu precis (voir ci-dessous) |
| **MCD dans la doc** | Partiel | `docs/mcd.md` existe mais doit etre integre dans la doc technique |
| **Scenarios d'utilisation avec copies d'ecran** | Manquant | Aucune capture d'ecran dans la doc |
| **Liste des membres (Nom, Prenoms, NumETU)** | A verifier | Doit etre dans la doc technique |
| **Suivi des taches** | Partiel | Le fichier `TODO_CLOUD_v4_3556_3575_3614.xlsx` existe |
| **APK pour mobile** | A generer | Pas d'APK visible dans le repo |
| **Code dans GitHub/GitLab public** | A verifier | Le repo existe mais verifier qu'il est bien public |

### Contenu Documentation Technique requis

Le sujet exige :
1. Le MCD
2. Les scenarios d'utilisation avec copies d'ecran
3. La liste des membres (Nom, Prenoms, NumETU)

---

## 7. AMELIORATIONS RECOMMANDEES

### Priorite haute (pour la notation)

1. **Changer max_attempts de 5 a 3** dans `database/init-database.sql` et `database/create.sql`
2. **Ajouter le hover/tooltip** sur les marqueurs du frontoffice (remplacer `Popup` par `Tooltip` Leaflet ou ajouter les deux)
3. **Completer la documentation technique** avec copies d'ecran et scenarios d'utilisation
4. **Generer l'APK** Android (`cd mobile && npx cap build android` ou export depuis Android Studio)
5. **Supprimer ou masquer SignUpPage.vue** sur le mobile (inscription uniquement via manager web)

### Priorite moyenne (qualite)

6. **Uniformiser email/pwd** : Utiliser le champ email pour l'authentification partout (pas username)
7. **Afficher l'historique des transitions de statut** avec dates dans le modal du backoffice
8. **Ajouter des tests** : Actuellement seul un test de demarrage existe. Ajouter des tests unitaires pour les services critiques (AuthService, SignalementService)
9. **Securite** : Le mot de passe est hashe en SHA-256, ce qui est faible. Bcrypt serait preferable (mais c'est un bonus, pas exige par le sujet)

### Priorite basse (bonus)

10. **CI/CD** : Aucun pipeline configure. Ajouter un GitHub Actions basique
11. **Validation des entrees** : Ajouter des validations cote API (Bean Validation, @Valid)
12. **Gestion d'erreurs frontend** : Ameliorer les messages d'erreur pour l'utilisateur
13. **Design/UX** : Le frontoffice et backoffice sont fonctionnels mais le design pourrait etre ameliore

---

## 8. RECAPITULATIF DES ACTIONS PRIORITAIRES

```
[ ] 1. Corriger max_attempts = 3 (au lieu de 5)
[ ] 2. Ajouter tooltip au hover sur les marqueurs (frontoffice)
[ ] 3. Supprimer/masquer l'auto-inscription mobile (SignUpPage)
[ ] 4. Ajouter historique des dates de changement de statut dans le modal backoffice
[ ] 5. Completer la doc technique (MCD + scenarios + copies d'ecran + liste membres)
[ ] 6. Generer l'APK Android
[ ] 7. Verifier que le repo est public sur GitHub/GitLab
[ ] 8. Uniformiser l'authentification sur email/pwd
```
