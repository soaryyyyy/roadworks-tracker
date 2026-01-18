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

import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, isPlatform } from '@ionic/vue';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';

let map: L.Map | null = null;

// TODO Change the location of this method to be in a specific folder
const checkGeoLocationPermissions = async () => {
  if (isPlatform('hybrid')) {
    const permission = await Geolocation.checkPermissions();

    if (permission.location !== 'granted') {
      const permission = await Geolocation.requestPermissions();
      
      if (permission.location !== 'granted') {
        // Permission refusee
      }
    }
  }
};

const initMap = async () => {
  try {
    await checkGeoLocationPermissions();

    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 0
    });

    const { latitude, longitude } = coordinates.coords;

    map = L.map('map').setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup('Votre position')
      .openPopup();
    
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  initMap();
});
</script>
