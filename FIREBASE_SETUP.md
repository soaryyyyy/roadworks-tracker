# Configuration Firebase pour la création automatique d'utilisateurs

## Vue d'ensemble
L'intégration Firebase automatise la création d'utilisateurs à la fois dans votre base de données locale et dans Firebase Authentication.

## Configuration

### 1. Installation des dépendances
Les dépendances Firebase ont été ajoutées au `pom.xml` :
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

### 2. Obtenir les identifiants Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez ou créez un projet
3. Allez à **Project Settings** → **Service Accounts**
4. Cliquez sur **Generate New Private Key**
5. Sauvegardez le fichier JSON (ex: `firebase-key.json`)

### 3. Configuration dans votre application

#### Option A : Utiliser une variable d'environnement (Recommandé)
```bash
# Linux/Mac
export FIREBASE_CREDENTIALS_PATH=/chemin/vers/firebase-key.json

# Windows PowerShell
$env:FIREBASE_CREDENTIALS_PATH="C:\chemin\vers\firebase-key.json"

# Docker
-e FIREBASE_CREDENTIALS_PATH=/config/firebase-key.json
```

#### Option B : Utiliser application.properties
```properties
firebase.credentials-path=/chemin/vers/firebase-key.json
```

#### Option C : Variables d'environnement Google Cloud
Firebase peut aussi utiliser `GOOGLE_APPLICATION_CREDENTIALS`:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/firebase-key.json
```

### 4. Docker Compose
Ajoutez le fichier de credentials à votre service backend:
```yaml
backend:
  ...
  volumes:
    - ./firebase-key.json:/app/firebase-key.json:ro
  environment:
    - FIREBASE_CREDENTIALS_PATH=/app/firebase-key.json
```

## Flux de création d'utilisateur

Quand un utilisateur s'enregistre:

1. **Validation locale** → Vérifier que l'username n'existe pas
2. **Création Firebase** → `FirebaseService.createFirebaseUser()`
   - Email: `username@roadworks.app`
   - Mot de passe: Le mot de passe en clair fourni
   - Nom d'affichage: L'username
3. **Création locale** → Sauvegarder dans PostgreSQL avec le mot de passe hashé
4. **Réponse** → Confirmation de succès

## Architecture

### FirebaseService.java
Service qui gère toutes les opérations Firebase:
- `createFirebaseUser()` - Crée un nouvel utilisateur
- `deleteFirebaseUser()` - Supprime un utilisateur
- `disableFirebaseUser()` - Désactive un utilisateur
- `enableFirebaseUser()` - Réactive un utilisateur
- `getFirebaseUser()` - Récupère les infos Firebase

### FirebaseConfig.java
Configuration Spring qui initialise Firebase avec les credentials.

### Modifications AuthService
La méthode `register()` a été modifiée pour appeler `firebaseService.createFirebaseUser()` avant de créer l'utilisateur local.

## Gestion des erreurs

Si la création Firebase échoue:
- L'utilisateur local n'est **PAS** créé
- Un message d'erreur détaillé est retourné
- L'utilisateur peut réessayer

## Avantages

✅ Les utilisateurs existent automatiquement dans Firebase  
✅ Authentification sécurisée via Firebase  
✅ Synchronisation simplifiée des comptes  
✅ Gestion centralisée des utilisateurs  
✅ Support de l'authentification mobile (si nécessaire)

## Prochaines étapes optionnelles

1. **Modifier le domaine email** - Changer `@roadworks.app` à votre domaine réel
2. **Ajouter la vérification d'email** - Envoyer un email de confirmation
3. **Synchroniser les mises à jour** - Mettre à jour Firebase quand un utilisateur est modifié
4. **Intégrer la connexion Firebase** - Utiliser Firebase pour la connexion aussi
5. **Authentification mobile** - Connecter votre app mobile avec Firebase
