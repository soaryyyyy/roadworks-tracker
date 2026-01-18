<template>
  <ion-page>

    <ion-header>
      <ion-toolbar>
        <ion-title>Carte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="map" style="height: 100%; width: 100%;"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { 
  IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, actionSheetController
} from '@ionic/vue';

import { arrowBackOutline, shareOutline, trashBinOutline } from 'ionicons/icons';

import { Geolocation } from '@capacitor/geolocation';
import { setupGeoLocationPermissions } from '@/services/geolocation/permission';
import L from 'leaflet';

let map: L.Map | null = null;

const initMap = async () => {
  try {
    // Current coordinates
    await setupGeoLocationPermissions();

    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 0
    });

    const { latitude, longitude } = coordinates.coords;

    // Map
    map = L.map('map', {
      zoomControl: false
    }).setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Current position marker
    const currentPosition = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`${latitude},${longitude}`, {
        closeButton: false, 
        closeOnClick: false,
      }).openPopup();

    currentPosition.on('click', () => {
      // Ca fait un effet des glitch mais au moins maintenant le pop up ne se ferme plus
      currentPosition.openPopup() 
      presentMarkerActionSheet(currentPosition);
    });
    
  } catch (error) {
    console.error(error);
  }
};

const presentMarkerActionSheet = async (marker: L.Marker) => {
  const actionSheet = await actionSheetController.create({
    header: `${marker.getLatLng().lat}, ${marker.getLatLng().lng}`,
    buttons: [
      { text: 'Signaler', icon: shareOutline },
      { text: 'Supprimer', role: 'destructive', icon: trashBinOutline },
      { text: 'Annuler', role: 'cancel', icon: arrowBackOutline },
    ],
  });

  await actionSheet.present();
}

onMounted(() => {
  initMap();
});
</script>
