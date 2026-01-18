<template>
  <ion-page>

    <ion-header>
      <ion-toolbar>
        <ion-title>Explorer</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- <ion-fab slot="fixed" vertical="top" horizontal="end">
        <ion-fab-button>
          <ion-icon :icon="mapOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab> -->

      <div id="map" style="height: 100%; width: 100%;"></div>

      <ion-modal 
        :is-open="isLocationModalOpen" 
        @didDismiss="isLocationModalOpen = false"
        :initial-breakpoint="0.25" 
        :breakpoints="[0, 0.25, 0.8]"
        :backdrop-breakpoint="0.5">

        <location-detail :data="selectedLocationData"></location-detail>
      </ion-modal>

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { 
  IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonFab, 
  IonFabButton, IonIcon, loadingController,
  IonModal
} from '@ionic/vue';

import { mapOutline } from 'ionicons/icons';

import { Geolocation } from '@capacitor/geolocation';
import { setupGeoLocationPermissions } from '@/services/geolocation/permission';
import L from 'leaflet';
import LocationDetail from '@/components/LocationDetail.vue';

let map: L.Map | null = null;

const isLocationModalOpen = ref<boolean>(false);

export interface LocationData {
  latitude: number,
  longitude: number,
}

const selectedLocationData = ref<LocationData>({
  latitude: 0,
  longitude: 0
});

const setupMap = async () => {
  const mapLoading = await loadingController.create({
    message: 'Chargement de la carte...',
    spinner: 'crescent',
    backdropDismiss: false,
  });

  await mapLoading.present();

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

    // Mark current position
    const location = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`${latitude},${longitude}`, {
        closeButton: false, 
        closeOnClick: false,
      });

    location.on('click', () => {
      location.openPopup();

      selectedLocationData.value.latitude = latitude;
      selectedLocationData.value.longitude = longitude;
      isLocationModalOpen.value = true;
    });
  } catch (error) {
    console.error(error);
  } finally {
    await mapLoading.dismiss();
  }
};

onMounted(() => {
  setupMap();
});
</script>
