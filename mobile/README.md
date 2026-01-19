# roadworks-tracker

## Project dependency

```bash
npm install firebase
npm install ionicons
npm install @capacitor/push-notifications
npm install @capacitor/preferences
npm install capacitor-secure-storage
```

Geo localisation

```bash
npm install @capacitor/geolocation
npm install leaflet
npm install --save-dev @types/leaflet
```

## Lancer l'image docker

```bash
docker compose up --build
```

## Android permission

```xml
<uses-permission android:name="android.permission.INTERNET"
    tools:ignore="ManifestOrder" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```
