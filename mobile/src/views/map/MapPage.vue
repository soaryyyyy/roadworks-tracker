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
        :is-open="isGeoLocationModalOpen" 
        @didDismiss="isGeoLocationModalOpen = false"
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

const isGeoLocationModalOpen = ref<boolean>(false);

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
      
      userLocation.bindPopup('<div style="text-align: center;font-weight: bold;">Vous</div>', {
        closeButton: false
      });

      userLocation.openPopup();
    } else if (userLocation && map){
      userLocation.setLatLng([lat, lng]);
    }
  },

  { deep: true }
)

// Default marker used by leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

onMounted(() => {
  const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  mountMap();
});
</script>
