<template>
  <ion-page>

    <ion-header>
      <ion-toolbar>
        <ion-title>Explorer</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <map-fab></map-fab>

      <div id="map" style="height: 100%; width: 100%;"></div>

      <ion-modal 
        :is-open="isLocationModalOpen" 
        @didDismiss="isLocationModalOpen = false"
        :initial-breakpoint="0.25" 
        :breakpoints="[0, 0.25, 0.8]"
        :backdrop-breakpoint="0.5">

      </ion-modal>

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { 
  IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, loadingController,
  IonModal
} from '@ionic/vue';

import MapFab from '@/components/map/MapFab.vue';

import L from 'leaflet';
import { useCurrentLocationStore } from '@/pinia/geolocation';

const isLocationModalOpen = ref<boolean>(false);

let map: L.Map | null = null;
let userLocation: L.Marker | null = null;

const mountMap = async () => {
  const mapLoading = await loadingController.create({
    message: 'Chargement de la carte...',
    spinner: 'crescent',
    backdropDismiss: false,
  });

  await mapLoading.present();

  try {
    map = L.map('map', {
      zoomControl: false
    }).setView([-18.9184607, 47.5211293], 11); // Antananarivo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  } catch (error) {
    console.error(error);
  } finally {
    await mapLoading.dismiss();
  }
};

const currentLocationStore = useCurrentLocationStore();

watch(
  () => currentLocationStore.coords,

  (coords) => { 
    if (!coords) {
      return;
    }

    const { lat, lng } = coords; 

    if (!userLocation && map) {
      userLocation = L.marker([lat, lng]).addTo(map);
      map.flyTo([lat, lng], 16);
    } else if (userLocation && map){
      userLocation.setLatLng([lat, lng]);
    }
  },

  { deep: true }
)

onMounted(() => {
  mountMap();
});
</script>
